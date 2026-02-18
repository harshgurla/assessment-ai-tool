"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const Assessment_1 = require("../models/Assessment");
const Submission_1 = require("../models/Submission");
const auth_1 = require("../middleware/auth");
const aiService_1 = __importDefault(require("../services/aiService"));
const router = express_1.default.Router();
// Validation schemas
const createAssessmentSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    topic: joi_1.default.string().required(),
    language: joi_1.default.string().required(),
    difficulty: joi_1.default.string().valid('beginner', 'intermediate', 'advanced').required(),
    duration: joi_1.default.number().min(10).max(300).required(), // 10 to 300 minutes
    instructions: joi_1.default.string().optional().allow(''),
    questions: joi_1.default.array().items(joi_1.default.object()).min(1).required(),
    studentEmails: joi_1.default.array().items(joi_1.default.string().email()).optional()
});
// Create Assessment (Teacher only)
router.post('/', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        console.log('Create assessment request body:', JSON.stringify(req.body, null, 2));
        const { error } = createAssessmentSchema.validate(req.body);
        if (error) {
            console.log('Validation error:', error.details[0].message);
            return res.status(400).json({ success: false, error: error.details[0].message });
        }
        const { title, topic, language, difficulty, duration, instructions, questions, studentEmails } = req.body;
        // Clean questions data: remove _id field and ensure proper structure
        const cleanedQuestions = questions.map((q) => {
            const { _id, ...cleanQuestion } = q;
            // Set default difficulty if not provided (inherit from assessment)
            if (!cleanQuestion.difficulty) {
                cleanQuestion.difficulty = difficulty;
            }
            // Fix test cases field name if needed (expectedOutput -> output)
            if (cleanQuestion.testCases) {
                cleanQuestion.testCases = cleanQuestion.testCases.map((tc) => {
                    if (tc.expectedOutput && !tc.output) {
                        return {
                            input: tc.input,
                            output: tc.expectedOutput,
                            isHidden: tc.isHidden || false
                        };
                    }
                    return tc;
                });
            }
            return cleanQuestion;
        });
        // Create assessment
        const assessment = new Assessment_1.Assessment({
            title,
            topic,
            language,
            questionType: 'mixed', // Since we support multiple types now
            difficulty,
            duration,
            instructions: instructions || '',
            questions: cleanedQuestions,
            assignedStudents: studentEmails || [],
            createdBy: req.user.id
        });
        await assessment.save();
        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            assessment: {
                _id: assessment._id,
                title: assessment.title,
                topic: assessment.topic,
                language: assessment.language,
                difficulty: assessment.difficulty,
                duration: assessment.duration,
                questions: assessment.questions,
                createdAt: assessment.createdAt
            }
        });
    }
    catch (error) {
        console.error('Create assessment error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            error: 'Failed to create assessment',
            details: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        });
    }
});
// Get Teacher's Assessments
router.get('/teacher', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        const assessments = await Assessment_1.Assessment.find({
            createdBy: req.user.id,
            isActive: true
        }).sort({ createdAt: -1 });
        const assessmentSummary = assessments.map(assessment => ({
            id: assessment._id,
            title: assessment.title,
            topic: assessment.topic,
            questionType: assessment.questionType,
            difficulty: assessment.difficulty,
            duration: assessment.duration,
            questionCount: assessment.questions.length,
            assignedStudents: assessment.assignedStudents.length,
            createdAt: assessment.createdAt
        }));
        res.json({ assessments: assessmentSummary });
    }
    catch (error) {
        console.error('Get teacher assessments error:', error);
        res.status(500).json({ error: 'Failed to fetch assessments' });
    }
});
// Get Student's Assigned Assessments
router.get('/student', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        const studentEmail = req.user.email;
        console.log('📚 Fetching assessments for student:', studentEmail);
        const assessments = await Assessment_1.Assessment.find({
            assignedStudents: studentEmail,
            isActive: true
        }).sort({ createdAt: -1 });
        console.log('✅ Found assessments:', assessments.length);
        const assessmentList = await Promise.all(assessments.map(async (assessment) => {
            // Check if student has already started/completed this assessment
            const result = await Submission_1.AssessmentResult.findOne({
                assessmentId: assessment._id.toString(),
                studentEmail
            });
            const assessmentData = {
                _id: assessment._id,
                title: assessment.title,
                topic: assessment.topic,
                questionType: assessment.questionType,
                difficulty: assessment.difficulty,
                duration: assessment.duration,
                questionCount: assessment.questions.length,
                createdAt: assessment.createdAt,
                status: result ? (result.completedAt ? 'completed' : 'in-progress') : 'not-started',
                score: result ? result.percentage : null,
                startedAt: result?.startedAt,
                completedAt: result?.completedAt
            };
            console.log('📋 Assessment data:', { id: assessmentData._id, title: assessmentData.title, status: assessmentData.status });
            return assessmentData;
        }));
        res.json({ assessments: assessmentList });
    }
    catch (error) {
        console.error('Get student assessments error:', error);
        res.status(500).json({ error: 'Failed to fetch assessments' });
    }
});
// Get Assessment Details
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const assessment = await Assessment_1.Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        // Check permissions
        if (req.user.role === 'teacher') {
            // Teacher can view their own assessments
            if (assessment.createdBy !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        else {
            // Student can only view assigned assessments
            if (!assessment.assignedStudents.includes(req.user.email)) {
                return res.status(403).json({ error: 'Assessment not assigned to you' });
            }
        }
        // For students, hide some sensitive information
        if (req.user.role === 'student') {
            const studentAssessment = {
                id: assessment._id,
                title: assessment.title,
                topic: assessment.topic,
                questionType: assessment.questionType,
                difficulty: assessment.difficulty,
                duration: assessment.duration,
                questions: assessment.questions.map((q, index) => ({
                    _id: q._id,
                    type: q.type,
                    title: q.title,
                    description: q.description,
                    difficulty: q.difficulty,
                    language: q.language,
                    sampleInput: q.sampleInput,
                    sampleOutput: q.sampleOutput,
                    constraints: q.constraints,
                    timeLimit: q.timeLimit,
                    memoryLimit: q.memoryLimit,
                    points: q.points,
                    // Hide test cases except sample ones
                    testCases: q.testCases?.filter(tc => !tc.isHidden)
                })),
                createdAt: assessment.createdAt
            };
            res.json({ assessment: studentAssessment });
        }
        else {
            res.json({ assessment });
        }
    }
    catch (error) {
        console.error('Get assessment details error:', error);
        res.status(500).json({ error: 'Failed to fetch assessment details' });
    }
});
// Get Assessment Session Status (Student only) - NEW ENDPOINT
router.get('/:id/session', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        console.log('📊 Get session status for assessment:', req.params.id);
        if (!req.params.id || req.params.id === 'undefined') {
            return res.status(400).json({ error: 'Invalid assessment ID' });
        }
        const assessment = await Assessment_1.Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        if (!assessment.assignedStudents.includes(req.user.email)) {
            return res.status(403).json({ error: 'Assessment not assigned to you' });
        }
        // Check for existing session
        const existingResult = await Submission_1.AssessmentResult.findOne({
            assessmentId: assessment._id.toString(),
            studentEmail: req.user.email
        });
        if (existingResult) {
            return res.json({
                hasSession: true,
                resultId: existingResult._id,
                startedAt: existingResult.startedAt,
                completedAt: existingResult.completedAt,
                duration: assessment.duration,
                isCompleted: !!existingResult.completedAt
            });
        }
        else {
            return res.json({
                hasSession: false,
                duration: assessment.duration
            });
        }
    }
    catch (error) {
        console.error('Get session status error:', error);
        res.status(500).json({ error: 'Failed to get session status' });
    }
});
// Start Assessment (Student only)
router.post('/:id/start', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        console.log('🚀 Start assessment request:', req.params.id);
        console.log('📧 Student email:', req.user?.email);
        if (!req.params.id || req.params.id === 'undefined') {
            console.log('❌ Invalid assessment ID received:', req.params.id);
            return res.status(400).json({ error: 'Invalid assessment ID' });
        }
        const assessment = await Assessment_1.Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        if (!assessment.assignedStudents.includes(req.user.email)) {
            return res.status(403).json({ error: 'Assessment not assigned to you' });
        }
        // Check if already started
        const existingResult = await Submission_1.AssessmentResult.findOne({
            assessmentId: assessment._id.toString(),
            studentEmail: req.user.email
        });
        if (existingResult) {
            // Return existing session data instead of error
            console.log('Assessment already started, returning existing session');
            return res.json({
                message: 'Assessment already in progress',
                resultId: existingResult._id,
                startedAt: existingResult.startedAt,
                duration: assessment.duration,
                alreadyStarted: true
            });
        }
        // Calculate max score
        const maxScore = assessment.questions.reduce((total, q) => {
            const pts = Number(q.points) || 0;
            return total + pts;
        }, 0);
        console.log('Calculated maxScore for assessment:', maxScore);
        // Create assessment result
        const result = new Submission_1.AssessmentResult({
            assessmentId: assessment._id.toString(),
            studentEmail: req.user.email,
            totalScore: 0,
            maxScore,
            percentage: 0,
            submissions: [],
            startedAt: new Date(),
            timeSpent: 0
        });
        console.log('Saving new AssessmentResult for student:', req.user.email);
        await result.save();
        console.log('AssessmentResult saved:', result._id.toString());
        res.json({
            message: 'Assessment started successfully',
            resultId: result._id,
            startedAt: result.startedAt,
            duration: assessment.duration
        });
    }
    catch (error) {
        console.error('Start assessment error:', error);
        res.status(500).json({ error: 'Failed to start assessment' });
    }
});
// Delete Assessment (Teacher only)
router.delete('/:id', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        const assessment = await Assessment_1.Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        if (assessment.createdBy !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Soft delete by setting isActive to false
        assessment.isActive = false;
        await assessment.save();
        res.json({ message: 'Assessment deleted successfully' });
    }
    catch (error) {
        console.error('Delete assessment error:', error);
        res.status(500).json({ error: 'Failed to delete assessment' });
    }
});
// Get All Assessments (Teacher Dashboard) - Updated endpoint
router.get('/', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        const assessments = await Assessment_1.Assessment.find({
            createdBy: req.user.id,
            isActive: true
        }).sort({ createdAt: -1 });
        // Get submission counts for each assessment
        const assessmentSummary = await Promise.all(assessments.map(async (assessment) => {
            const submissionCount = await Submission_1.AssessmentResult.countDocuments({
                assessmentId: assessment._id.toString()
            });
            return {
                _id: assessment._id,
                title: assessment.title,
                topic: assessment.topic,
                language: assessment.language,
                difficulty: assessment.difficulty,
                duration: assessment.duration,
                questions: assessment.questions,
                createdAt: assessment.createdAt,
                status: 'active', // You can add logic to determine status
                studentsAssigned: assessment.assignedStudents.length,
                submissions: submissionCount
            };
        }));
        res.json({ success: true, assessments: assessmentSummary });
    }
    catch (error) {
        console.error('Get assessments error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
    }
});
// Generate Questions with AI
router.post('/generate-questions', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        console.log('🔥 Generate questions request received');
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User:', req.user?.email);
        const { topic, language, difficulty, questionTypes, counts } = req.body;
        // Validate input
        if (!topic || !difficulty || !questionTypes || !counts) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: topic, difficulty, questionTypes, and counts are required',
                aiError: false
            });
        }
        const allQuestions = [];
        const errors = [];
        let usedMockQuestions = false;
        // Generate different types of questions with individual error handling
        if (questionTypes.includes('programming') && counts.programming > 0) {
            try {
                console.log('📚 Generating programming questions...');
                const programmingQuestions = await aiService_1.default.generateQuestions({
                    topic,
                    language,
                    type: 'programming',
                    difficulty,
                    count: counts.programming
                });
                allQuestions.push(...programmingQuestions);
                // Check if these are mock questions
                if (programmingQuestions.some(q => q._id?.startsWith('mock_'))) {
                    usedMockQuestions = true;
                }
            }
            catch (error) {
                console.error('❌ Programming questions generation failed:', error.message);
                errors.push(`Programming questions: ${error.message}`);
            }
        }
        if (questionTypes.includes('theory') && counts.theory > 0) {
            try {
                console.log('📝 Generating theory questions...');
                const theoryQuestions = await aiService_1.default.generateQuestions({
                    topic,
                    type: 'theory',
                    difficulty,
                    count: counts.theory
                });
                allQuestions.push(...theoryQuestions);
                // Check if these are mock questions
                if (theoryQuestions.some(q => q._id?.startsWith('mock_'))) {
                    usedMockQuestions = true;
                }
            }
            catch (error) {
                console.error('❌ Theory questions generation failed:', error.message);
                errors.push(`Theory questions: ${error.message}`);
            }
        }
        if (questionTypes.includes('mcq') && counts.mcq > 0) {
            try {
                console.log('☑️  Generating MCQ questions...');
                const mcqQuestions = await aiService_1.default.generateQuestions({
                    topic,
                    type: 'mcq',
                    difficulty,
                    count: counts.mcq
                });
                allQuestions.push(...mcqQuestions);
                // Check if these are mock questions
                if (mcqQuestions.some(q => q._id?.startsWith('mock_'))) {
                    usedMockQuestions = true;
                }
            }
            catch (error) {
                console.error('❌ MCQ questions generation failed:', error.message);
                errors.push(`MCQ questions: ${error.message}`);
            }
        }
        // Prepare response with detailed information
        const response = {
            success: true,
            questions: allQuestions,
            totalGenerated: allQuestions.length
        };
        // Add warnings and information about AI service status
        if (usedMockQuestions) {
            response.warning = 'AI Generation Failed';
            response.message = 'AI service is not available. Mock questions were generated instead. You can edit them manually or add your own questions.';
            response.aiError = true;
            response.suggestions = [
                'Check your AI API keys in the .env file',
                'Ensure you have valid OpenAI or Google Gemini API credentials',
                'Edit the mock questions to match your requirements',
                'Add your own custom questions manually'
            ];
        }
        if (errors.length > 0) {
            response.errors = errors;
            response.partialFailure = true;
        }
        console.log(`✅ Generated ${allQuestions.length} questions total`);
        if (usedMockQuestions) {
            console.log('⚠️  Using mock questions due to AI service unavailability');
        }
        res.json(response);
    }
    catch (error) {
        console.error('❌ Generate questions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate questions',
            details: error.message,
            aiError: true,
            suggestions: [
                'Check server logs for detailed error information',
                'Verify your AI API keys are configured correctly',
                'Try again with different parameters',
                'Contact support if the issue persists'
            ]
        });
    }
});
exports.default = router;
//# sourceMappingURL=assessment.js.map