import express from 'express';
import { User } from '../models/User';
import { AssessmentResult } from '../models/Submission';
import { authenticate, requireTeacher, requireStudent, AuthenticatedRequest } from '../middleware/auth';
import { Assessment } from '../models/Assessment';

const router = express.Router();

// Get all students (Teacher only)
router.get('/students', authenticate, requireTeacher, async (req: AuthenticatedRequest, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    
    // Get performance data for each student
    const studentData = await Promise.all(
      students.map(async (student) => {
        const results = await AssessmentResult.find({ studentEmail: student.email });
        const completedAssessments = results.filter(r => r.completedAt).length;
        const averageScore = results.length > 0 
          ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
          : 0;
        
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          registeredAt: student.createdAt,
          assessmentsCompleted: completedAssessments,
          averageScore: averageScore,
          status: 'active' // You can add logic to determine status
        };
      })
    );
    
    res.json({ success: true, students: studentData });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

// Invite students (Mock endpoint - in production, you'd send actual emails)
router.post('/invite-students', authenticate, requireTeacher, async (req: AuthenticatedRequest, res) => {
  try {
    const { emails } = req.body;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide valid email addresses' });
    }
    
    // In a real application, you would:
    // 1. Send invitation emails
    // 2. Create pending invitations in database
    // 3. Handle invitation acceptance flow
    
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: `Invitations sent to ${emails.length} students`,
      invitedEmails: emails 
    });
  } catch (error) {
    console.error('Invite students error:', error);
    res.status(500).json({ success: false, error: 'Failed to send invitations' });
  }
});

// Get student details (Teacher only)
router.get('/students/:id', authenticate, requireTeacher, async (req: AuthenticatedRequest, res) => {
  try {
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Get student's assessment results
    const results = await AssessmentResult.find({ studentEmail: student.email })
      .sort({ startedAt: -1 });
    
    const studentData = {
      _id: student._id,
      name: student.name,
      email: student.email,
      registeredAt: student.createdAt,
      assessmentHistory: results.map(result => ({
        assessmentId: result.assessmentId,
        score: result.percentage,
        completedAt: result.completedAt,
        timeSpent: result.timeSpent
      }))
    };
    
    res.json({ success: true, student: studentData });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student details' });
  }
});

// Get stats for the authenticated student
router.get('/stats', authenticate, requireStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const studentEmail = req.user!.email;

    // Total assigned active assessments
    const totalAssessments = await Assessment.countDocuments({ assignedStudents: studentEmail, isActive: true });

    // Student results
    const results = await AssessmentResult.find({ studentEmail });
    const completedAssessments = results.filter(r => r.completedAt).length;
    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
      : 0;
    const totalTimeSpent = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

    // Simple placeholders for streak and rank
    const currentStreak = 0;
    const rank = 0;

    res.json({
      success: true,
      stats: {
        totalAssessments,
        completedAssessments,
        averageScore,
        totalTimeSpent,
        currentStreak,
        rank
      }
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student stats' });
  }
});

export default router;

