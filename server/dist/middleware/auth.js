"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStudent = exports.requireTeacher = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};
exports.authenticate = authenticate;
const requireTeacher = (req, res, next) => {
    if (req.user?.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied. Teacher role required.' });
    }
    next();
};
exports.requireTeacher = requireTeacher;
const requireStudent = (req, res, next) => {
    if (req.user?.role !== 'student') {
        return res.status(403).json({ error: 'Access denied. Student role required.' });
    }
    next();
};
exports.requireStudent = requireStudent;
//# sourceMappingURL=auth.js.map