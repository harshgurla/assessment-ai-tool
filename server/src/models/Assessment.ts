import mongoose, { Schema, Document } from 'mongoose';
import { Assessment as IAssessment, Question, TestCase } from '../types';

export interface AssessmentDocument extends Omit<IAssessment, '_id'>, Document {}

const testCaseSchema = new Schema<TestCase>({
  input: { type: String, required: true },
  output: { type: String, required: true },
  isHidden: { type: Boolean, default: false }
});

const questionSchema = new Schema<Question>({
  type: {
    type: String,
    enum: ['programming', 'theory', 'mcq'],
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
  // Nested structures for different question types
  programmingData: {
    language: { type: String },
    starterCode: { type: String },
    solution: { type: String },
    testCases: [testCaseSchema]
  },
  theoryData: {
    expectedKeywords: [{ type: String }],
    minWords: { type: Number },
    maxWords: { type: Number }
  },
  mcqData: {
    options: [{ type: String }],
    correctAnswer: { type: Number },
    explanation: { type: String }
  },
  testCases: [testCaseSchema],
  sampleInput: { type: String },
  sampleOutput: { type: String },
  constraints: { type: String },
  timeLimit: { type: Number, default: 2 }, // 2 seconds default
  memoryLimit: { type: Number, default: 128 }, // 128 MB default
  points: { type: Number, required: true, default: 10 }
});

const assessmentSchema = new Schema<AssessmentDocument>({
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

export const Assessment = mongoose.model<AssessmentDocument>('Assessment', assessmentSchema);
