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
const submitCodeSchema = joi_1.default.object({
    assessmentId: joi_1.default.string().required(),
    questionId: joi_1.default.string().required(),
    code: joi_1.default.string().required(),
    language: joi_1.default.string().required()
});
const submitAnswerSchema = joi_1.default.object({
    assessmentId: joi_1.default.string().required(),
    questionId: joi_1.default.string().required(),
    answer: joi_1.default.string().required()
});
const runCodeSchema = joi_1.default.object({
    code: joi_1.default.string().required(),
    language: joi_1.default.string().required(),
    input: joi_1.default.string().optional().default('')
});
// Submit Programming Solution
router.post('/code', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        const { error } = submitCodeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { assessmentId, questionId, code, language } = req.body;
        const studentEmail = req.user.email;
        // Verify assessment and question
        const assessment = await Assessment_1.Assessment.findById(assessmentId);
        if (!assessment || !assessment.assignedStudents.includes(studentEmail)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const question = assessment.questions.find(q => q._id === questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        // Check if assessment is still active (time limit)
        const result = await Submission_1.AssessmentResult.findOne({ assessmentId, studentEmail });
        if (!result) {
            return res.status(400).json({ error: 'Assessment not started' });
        }
        if (result.completedAt) {
            return res.status(400).json({ error: 'Assessment already completed' });
        }
        // Check time limit
        const timeElapsed = (new Date().getTime() - result.startedAt.getTime()) / (1000 * 60 * 60); // hours
        if (timeElapsed > assessment.duration) {
            // Auto-complete the assessment
            result.completedAt = new Date();
            await result.save();
            return res.status(400).json({ error: 'Assessment time limit exceeded' });
        }
        // Check if already submitted
        const existingSubmission = await Submission_1.Submission.findOne({
            assessmentId,
            questionId,
            studentEmail
        });
        let submission;
        if (existingSubmission) {
            // Update existing submission
            existingSubmission.code = code;
            existingSubmission.language = language;
            existingSubmission.status = 'pending';
            existingSubmission.submittedAt = new Date();
            submission = await existingSubmission.save();
        }
        else {
            // Create new submission
            submission = new Submission_1.Submission({
                assessmentId,
                questionId,
                studentEmail,
                code,
                language,
                status: 'pending'
            });
            await submission.save();
        }
        // Evaluate submission using AI
        try {
            const evaluation = await aiService_1.default.evaluateSubmission({
                question,
                submission: { code, language }
            });
            submission.score = evaluation.score;
            submission.feedback = evaluation.feedback;
            submission.status = evaluation.status;
            submission.evaluatedAt = new Date();
            await submission.save();
            // Update assessment result
            await updateAssessmentResult(assessmentId, studentEmail);
            res.json({
                message: 'Code submitted successfully',
                submission: {
                    id: submission._id,
                    score: submission.score,
                    feedback: submission.feedback,
                    status: submission.status
                }
            });
        }
        catch (evalError) {
            console.error('Evaluation error:', evalError);
            res.json({
                message: 'Code submitted, evaluation pending',
                submission: {
                    id: submission._id,
                    status: 'pending'
                }
            });
        }
    }
    catch (error) {
        console.error('Submit code error:', error);
        res.status(500).json({ error: 'Failed to submit code' });
    }
});
// Submit Theory Answer
router.post('/answer', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        const { error } = submitAnswerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { assessmentId, questionId, answer } = req.body;
        const studentEmail = req.user.email;
        // Verify assessment and question
        const assessment = await Assessment_1.Assessment.findById(assessmentId);
        if (!assessment || !assessment.assignedStudents.includes(studentEmail)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const question = assessment.questions.find(q => q._id === questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        // Check if assessment is still active
        const result = await Submission_1.AssessmentResult.findOne({ assessmentId, studentEmail });
        if (!result || result.completedAt) {
            return res.status(400).json({ error: 'Assessment not active' });
        }
        // Check time limit
        const timeElapsed = (new Date().getTime() - result.startedAt.getTime()) / (1000 * 60 * 60);
        if (timeElapsed > assessment.duration) {
            result.completedAt = new Date();
            await result.save();
            return res.status(400).json({ error: 'Assessment time limit exceeded' });
        }
        // Check if already submitted
        const existingSubmission = await Submission_1.Submission.findOne({
            assessmentId,
            questionId,
            studentEmail
        });
        let submission;
        if (existingSubmission) {
            existingSubmission.answer = answer;
            existingSubmission.status = 'pending';
            existingSubmission.submittedAt = new Date();
            submission = await existingSubmission.save();
        }
        else {
            submission = new Submission_1.Submission({
                assessmentId,
                questionId,
                studentEmail,
                answer,
                status: 'pending'
            });
            await submission.save();
        }
        // Evaluate submission using AI
        try {
            const evaluation = await aiService_1.default.evaluateSubmission({
                question,
                submission: { answer }
            });
            submission.score = evaluation.score;
            submission.feedback = evaluation.feedback;
            submission.status = evaluation.status;
            submission.evaluatedAt = new Date();
            await submission.save();
            await updateAssessmentResult(assessmentId, studentEmail);
            res.json({
                message: 'Answer submitted successfully',
                submission: {
                    id: submission._id,
                    score: submission.score,
                    feedback: submission.feedback,
                    status: submission.status
                }
            });
        }
        catch (evalError) {
            console.error('Evaluation error:', evalError);
            res.json({
                message: 'Answer submitted, evaluation pending',
                submission: {
                    id: submission._id,
                    status: 'pending'
                }
            });
        }
    }
    catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});
// Run Code (without submitting)
router.post('/run', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        const { error } = runCodeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { code, language, input } = req.body;
        const result = await aiService_1.default.runCode(code, language, input);
        res.json({
            output: result.output,
            error: result.error,
            executionTime: result.executionTime
        });
    }
    catch (error) {
        console.error('Run code error:', error);
        res.status(500).json({ error: 'Failed to run code' });
    }
});
// Get Submissions for Assessment
router.get('/assessment/:assessmentId', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const studentEmail = req.user.email;
        // Verify access
        const assessment = await Assessment_1.Assessment.findById(assessmentId);
        if (!assessment || !assessment.assignedStudents.includes(studentEmail)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const submissions = await Submission_1.Submission.find({
            assessmentId,
            studentEmail
        }).sort({ submittedAt: -1 });
        res.json({ submissions });
    }
    catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});
// Complete Assessment
router.post('/complete/:assessmentId', auth_1.authenticate, auth_1.requireStudent, async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const studentEmail = req.user.email;
        const result = await Submission_1.AssessmentResult.findOne({ assessmentId, studentEmail });
        if (!result) {
            return res.status(404).json({ error: 'Assessment result not found' });
        }
        if (result.completedAt) {
            return res.status(400).json({ error: 'Assessment already completed' });
        }
        // Calculate time spent
        const timeSpent = (new Date().getTime() - result.startedAt.getTime()) / (1000 * 60); // minutes
        result.completedAt = new Date();
        result.timeSpent = timeSpent;
        await result.save();
        res.json({
            message: 'Assessment completed successfully',
            result: {
                totalScore: result.totalScore,
                maxScore: result.maxScore,
                percentage: result.percentage,
                timeSpent: result.timeSpent
            }
        });
    }
    catch (error) {
        console.error('Complete assessment error:', error);
        res.status(500).json({ error: 'Failed to complete assessment' });
    }
});
// Helper function to update assessment result
async function updateAssessmentResult(assessmentId, studentEmail) {
    try {
        const submissions = await Submission_1.Submission.find({ assessmentId, studentEmail });
        const result = await Submission_1.AssessmentResult.findOne({ assessmentId, studentEmail });
        if (!result)
            return;
        // Calculate total score
        const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
        const percentage = result.maxScore > 0 ? Math.round((totalScore / result.maxScore) * 100) : 0;
        result.totalScore = totalScore;
        result.percentage = percentage;
        result.submissions = submissions.map(s => s._id.toString());
        await result.save();
    }
    catch (error) {
        console.error('Update assessment result error:', error);
    }
}
exports.default = router;
//# sourceMappingURL=submission.js.map