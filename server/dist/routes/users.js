"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const Submission_1 = require("../models/Submission");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all students (Teacher only)
router.get('/students', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        const students = await User_1.User.find({ role: 'student' }).sort({ createdAt: -1 });
        // Get performance data for each student
        const studentData = await Promise.all(students.map(async (student) => {
            const results = await Submission_1.AssessmentResult.find({ studentEmail: student.email });
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
        }));
        res.json({ success: true, students: studentData });
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
});
// Invite students (Mock endpoint - in production, you'd send actual emails)
router.post('/invite-students', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
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
    }
    catch (error) {
        console.error('Invite students error:', error);
        res.status(500).json({ success: false, error: 'Failed to send invitations' });
    }
});
// Get student details (Teacher only)
router.get('/students/:id', auth_1.authenticate, auth_1.requireTeacher, async (req, res) => {
    try {
        const student = await User_1.User.findById(req.params.id);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }
        // Get student's assessment results
        const results = await Submission_1.AssessmentResult.find({ studentEmail: student.email })
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
    }
    catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch student details' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map