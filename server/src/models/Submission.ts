import mongoose, { Schema, Document } from 'mongoose';
import { Submission as ISubmission, AssessmentResult as IAssessmentResult } from '../types';

export interface SubmissionDocument extends Omit<ISubmission, '_id'>, Document {}
export interface AssessmentResultDocument extends Omit<IAssessmentResult, '_id'>, Document {}

const submissionSchema = new Schema<SubmissionDocument>({
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

const assessmentResultSchema = new Schema<AssessmentResultDocument>({
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

export const Submission = mongoose.model<SubmissionDocument>('Submission', submissionSchema);
export const AssessmentResult = mongoose.model<AssessmentResultDocument>('AssessmentResult', assessmentResultSchema);
