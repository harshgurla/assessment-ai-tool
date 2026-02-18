import express from 'express';
import Joi from 'joi';
import { Assessment } from '../models/Assessment';
import { Submission, AssessmentResult } from '../models/Submission';
import { authenticate, requireStudent, AuthenticatedRequest } from '../middleware/auth';
import aiService from '../services/aiService';

const router = express.Router();

// Validation schemas
const submitCodeSchema = Joi.object({
  assessmentId: Joi.string().required(),
  questionId: Joi.string().required(),
  code: Joi.string().required(),
  language: Joi.string().required()
});

const submitAnswerSchema = Joi.object({
  assessmentId: Joi.string().required(),
  questionId: Joi.string().required(),
  answer: Joi.string().required()
});

const runCodeSchema = Joi.object({
  code: Joi.string().required(),
  language: Joi.string().required(),
  input: Joi.string().optional().default('')
});

// Submit Programming Solution
router.post('/code', authenticate, requireStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = submitCodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { assessmentId, questionId, code, language } = req.body;
    const studentEmail = req.user!.email;

    // Verify assessment and question
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment || !assessment.assignedStudents.includes(studentEmail)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const question = assessment.questions.find(q => q._id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if assessment is still active (time limit)
    const result = await AssessmentResult.findOne({ assessmentId, studentEmail });
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
    const existingSubmission = await Submission.findOne({
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
    } else {
      // Create new submission
      submission = new Submission({
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
      const evaluation = await aiService.evaluateSubmission({
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
    } catch (evalError) {
      console.error('Evaluation error:', evalError);
      res.json({
        message: 'Code submitted, evaluation pending',
        submission: {
          id: submission._id,
          status: 'pending'
        }
      });
    }
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

// Submit Theory Answer
router.post('/answer', authenticate, requireStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = submitAnswerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { assessmentId, questionId, answer } = req.body;
    const studentEmail = req.user!.email;

    // Verify assessment and question
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment || !assessment.assignedStudents.includes(studentEmail)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const question = assessment.questions.find(q => q._id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if assessment is still active
    const result = await AssessmentResult.findOne({ assessmentId, studentEmail });
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
    const existingSubmission = await Submission.findOne({
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
    } else {
      submission = new Submission({
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
      const evaluation = await aiService.evaluateSubmission({
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
    } catch (evalError) {
      console.error('Evaluation error:', evalError);
      res.json({
        message: 'Answer submitted, evaluation pending',
        submission: {
          id: submission._id,
          status: 'pending'
        }
      });
    }
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Run Code (without submitting)
router.post('/run', authenticate, requireStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = runCodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { code, language, input } = req.body;

    const result = await aiService.runCode(code, language, input);
    
    res.json({
      output: result.output,
      error: result.error,
      executionTime: result.executionTime
    });
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ error: 'Failed to run code' });
  }
});

// Get Submissions for Assessment
router.get('/assessment/:assessmentId', authenticate, requireStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const { assessmentId } = req.params;
    const studentEmail = req.user!.email;

    // Verify access
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment || !assessment.assignedStudents.includes(studentEmail)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submissions = await Submission.find({
      assessmentId,
      studentEmail
    }).sort({ submittedAt: -1 });

    res.json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Complete Assessment
router.post('/complete/:assessmentId', authenticate, requireStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const { assessmentId } = req.params;
    const studentEmail = req.user!.email;

    const result = await AssessmentResult.findOne({ assessmentId, studentEmail });
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
  } catch (error) {
    console.error('Complete assessment error:', error);
    res.status(500).json({ error: 'Failed to complete assessment' });
  }
});

// Helper function to update assessment result
async function updateAssessmentResult(assessmentId: string, studentEmail: string) {
  try {
    const submissions = await Submission.find({ assessmentId, studentEmail });
    const result = await AssessmentResult.findOne({ assessmentId, studentEmail });
    
    if (!result) return;

    // Calculate total score
    const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
    const percentage = result.maxScore > 0 ? Math.round((totalScore / result.maxScore) * 100) : 0;

    result.totalScore = totalScore;
    result.percentage = percentage;
    result.submissions = submissions.map(s => s._id.toString());
    
    await result.save();
  } catch (error) {
    console.error('Update assessment result error:', error);
  }
}

export default router;
