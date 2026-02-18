export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student';
  name?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Assessment {
  id: string;
  title: string;
  topic: string;
  language: string;
  questionType: 'programming' | 'theory' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // in hours
  questionCount?: number;
  assignedStudents?: number | string[];
  createdAt: string;
  status?: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  startedAt?: string;
  completedAt?: string;
  questions?: Question[];
}

export interface Question {
  _id: string;
  type: 'programming' | 'theory';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language?: string;
  testCases?: TestCase[];
  sampleInput?: string;
  sampleOutput?: string;
  constraints?: string;
  timeLimit?: number;
  memoryLimit?: number;
  points: number;
}

export interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

export interface Submission {
  id: string;
  assessmentId: string;
  questionId: string;
  studentEmail: string;
  code?: string;
  answer?: string;
  language?: string;
  status: 'pending' | 'running' | 'accepted' | 'wrong' | 'error' | 'timeout' | 'partial';
  score: number;
  feedback?: string;
  executionTime?: number;
  memoryUsed?: number;
  submittedAt: string;
  evaluatedAt?: string;
}

export interface CreateAssessmentRequest {
  topic: string;
  language: string;
  questionType: 'programming' | 'theory' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  assignedStudents: string[];
  questionCount?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface CodeSubmissionRequest {
  assessmentId: string;
  questionId: string;
  code: string;
  language: string;
}

export interface AnswerSubmissionRequest {
  assessmentId: string;
  questionId: string;
  answer: string;
}

export interface CodeRunRequest {
  code: string;
  language: string;
  input?: string;
}

export interface CodeRunResult {
  output: string;
  error?: string;
  executionTime: number;
}
