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
exports.AssessmentResult = exports.Submission = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const submissionSchema = new mongoose_1.Schema({
    assessmentId: { type: String, required: true },
    questionId: { type: String, required: true },
    studentEmail: { type: String, required: true },
    code: { type: String },
    answer: { type: String },
    language: { type: String },
    status: {
        type: String,
        enum: ['pending', 'running', 'accepted', 'wrong', 'error', 'timeout', 'partial'],
        default: 'pending'
    },
    score: { type: Number, default: 0 },
    feedback: { type: String },
    executionTime: { type: Number }, // in milliseconds
    memoryUsed: { type: Number }, // in KB
    submittedAt: { type: Date, default: Date.now },
    evaluatedAt: { type: Date }
});
const assessmentResultSchema = new mongoose_1.Schema({
    assessmentId: { type: String, required: true },
    studentEmail: { type: String, required: true },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    submissions: [{ type: String }],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeSpent: { type: Number, default: 0 } // in minutes
});
// Indexes for better performance
submissionSchema.index({ assessmentId: 1, studentEmail: 1 });
submissionSchema.index({ questionId: 1, studentEmail: 1 });
assessmentResultSchema.index({ assessmentId: 1, studentEmail: 1 });
exports.Submission = mongoose_1.default.model('Submission', submissionSchema);
exports.AssessmentResult = mongoose_1.default.model('AssessmentResult', assessmentResultSchema);
//# sourceMappingURL=Submission.js.map