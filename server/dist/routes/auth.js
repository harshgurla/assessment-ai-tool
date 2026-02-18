"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Validation schemas
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
const registerStudentSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    name: joi_1.default.string().optional()
});
// Teacher Login (hardcoded credentials)
router.post('/teacher/login', async (req, res) => {
    try {
        console.log('🔐 Teacher login attempt:', { email: req.body.email, passwordLength: req.body.password?.length });
        const { error } = loginSchema.validate(req.body);
        if (error) {
            console.log('❌ Validation error:', error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password } = req.body;
        // Check if it's the designated teacher email and password
        const teacherEmail = process.env.TEACHER_EMAIL;
        const teacherPassword = process.env.TEACHER_PASSWORD;
        console.log('🔍 Comparing credentials:');
        console.log('  Expected email:', teacherEmail);
        console.log('  Received email:', email);
        console.log('  Expected password:', teacherPassword);
        console.log('  Received password:', password);
        console.log('  Email match:', email === teacherEmail);
        console.log('  Password match:', password === teacherPassword);
        if (email !== teacherEmail || password !== teacherPassword) {
            console.log('❌ Invalid teacher credentials');
            return res.status(401).json({ error: 'Invalid teacher credentials' });
        }
        console.log('✅ Teacher credentials valid');
        // Find or create teacher user
        let teacher = await User_1.User.findOne({ email: teacherEmail, role: 'teacher' });
        if (!teacher) {
            const hashedPassword = await bcryptjs_1.default.hash(teacherPassword, 10);
            teacher = new User_1.User({
                email: teacherEmail,
                password: hashedPassword,
                role: 'teacher',
                name: 'Teacher'
            });
            await teacher.save();
        }
        const token = jsonwebtoken_1.default.sign({ id: teacher._id, email: teacher.email, role: teacher.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Teacher login successful',
            token,
            user: {
                id: teacher._id,
                email: teacher.email,
                role: teacher.role,
                name: teacher.name
            }
        });
    }
    catch (error) {
        console.error('Teacher login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Student Registration
router.post('/student/register', async (req, res) => {
    try {
        const { error } = registerStudentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password, name } = req.body;
        // Check if student already exists
        const existingStudent = await User_1.User.findOne({ email, role: 'student' });
        if (existingStudent) {
            return res.status(400).json({ error: 'Student already registered' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create new student
        const student = new User_1.User({
            email,
            password: hashedPassword,
            role: 'student',
            name: name || 'Student'
        });
        await student.save();
        const token = jsonwebtoken_1.default.sign({ id: student._id, email: student.email, role: student.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'Student registration successful',
            token,
            user: {
                id: student._id,
                email: student.email,
                role: student.role,
                name: student.name
            }
        });
    }
    catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Student Login
router.post('/student/login', async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password } = req.body;
        // Find student
        const student = await User_1.User.findOne({ email, role: 'student' });
        if (!student) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, student.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: student._id, email: student.email, role: student.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Student login successful',
            token,
            user: {
                id: student._id,
                email: student.email,
                role: student.role,
                name: student.name
            }
        });
    }
    catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.json({
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// General login route (for backward compatibility)
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 General login attempt:', { email: req.body.email, passwordLength: req.body.password?.length });
        const { error } = loginSchema.validate(req.body);
        if (error) {
            console.log('❌ Validation error:', error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password } = req.body;
        // Check if it's teacher credentials first
        const teacherEmail = process.env.TEACHER_EMAIL;
        const teacherPassword = process.env.TEACHER_PASSWORD;
        if (email === teacherEmail && password === teacherPassword) {
            console.log('🏫 Detected teacher login, redirecting to teacher flow');
            // Find or create teacher user
            let teacher = await User_1.User.findOne({ email: teacherEmail, role: 'teacher' });
            if (!teacher) {
                const hashedPassword = await bcryptjs_1.default.hash(teacherPassword, 10);
                teacher = new User_1.User({
                    email: teacherEmail,
                    password: hashedPassword,
                    role: 'teacher',
                    name: 'Teacher'
                });
                await teacher.save();
            }
            const token = jsonwebtoken_1.default.sign({ id: teacher._id, email: teacher.email, role: teacher.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                success: true,
                token,
                user: {
                    id: teacher._id,
                    email: teacher.email,
                    role: teacher.role,
                    name: teacher.name
                }
            });
        }
        // Otherwise, try student login
        console.log('👨‍🎓 Attempting student login');
        const student = await User_1.User.findOne({ email, role: 'student' });
        if (!student) {
            console.log('❌ Student not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, student.password || '');
        if (!isValidPassword) {
            console.log('❌ Invalid student password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('✅ Student login successful');
        const token = jsonwebtoken_1.default.sign({ id: student._id, email: student.email, role: student.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            token,
            user: {
                id: student._id,
                email: student.email,
                role: student.role,
                name: student.name
            }
        });
    }
    catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map