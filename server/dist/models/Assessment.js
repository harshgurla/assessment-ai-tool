"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assessment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const testCaseSchema = new mongoose_1.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
});
const questionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['programming', 'theory'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    language: { type: String },
    testCases: [testCaseSchema],
    sampleInput: { type: String },
    sampleOutput: { type: String },
    constraints: { type: String },
    timeLimit: { type: Number, default: 2 }, // 2 seconds default
    memoryLimit: { type: Number, default: 128 }, // 128 MB default
    points: { type: Number, required: true, default: 10 }
});
const assessmentSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    topic: { type: String, required: true },
    language: { type: String, required: true },
    questionType: {
        type: String,
        enum: ['programming', 'theory', 'mixed'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    duration: { type: Number, required: true }, // in hours
    questions: [questionSchema],
    assignedStudents: [{ type: String, required: true }], // email addresses
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});
// Indexes for better performance
assessmentSchema.index({ createdBy: 1, isActive: 1 });
assessmentSchema.index({ assignedStudents: 1 });
exports.Assessment = mongoose_1.default.model('Assessment', assessmentSchema);
//# sourceMappingURL=Assessment.js.map