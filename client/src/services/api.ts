import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Assessment,
  CreateAssessmentRequest,
  Submission,
  CodeSubmissionRequest,
  AnswerSubmissionRequest,
  CodeRunRequest,
  CodeRunResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  // Authentication
  static async loginTeacher(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/teacher/login', credentials);
    return response.data;
  }

  static async loginStudent(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/student/login', credentials);
    return response.data;
  }

  static async registerStudent(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/student/register', data);
    return response.data;
  }

  static async verifyToken(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await api.get('/auth/verify');
    return response.data;
  }

  // Assessments
  static async createAssessment(data: CreateAssessmentRequest): Promise<{ message: string; assessment: Assessment }> {
    const response = await api.post('/assessments', data);
    return response.data;
  }

  static async getTeacherAssessments(): Promise<{ assessments: Assessment[] }> {
    const response = await api.get('/assessments/teacher');
    return response.data;
  }

  static async getStudentAssessments(): Promise<{ assessments: Assessment[] }> {
    const response = await api.get('/assessments/student');
    return response.data;
  }

  static async getAssessmentDetails(id: string): Promise<{ assessment: Assessment }> {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  }

  static async startAssessment(id: string): Promise<{ message: string; resultId: string; startedAt: string; duration: number }> {
    const response = await api.post(`/assessments/${id}/start`);
    return response.data;
  }

  static async deleteAssessment(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  }

  // Submissions
  static async submitCode(data: CodeSubmissionRequest): Promise<{ message: string; submission: Submission }> {
    const response = await api.post('/submissions/code', data);
    return response.data;
  }

  static async submitAnswer(data: AnswerSubmissionRequest): Promise<{ message: string; submission: Submission }> {
    const response = await api.post('/submissions/answer', data);
    return response.data;
  }

  static async runCode(data: CodeRunRequest): Promise<CodeRunResult> {
    const response = await api.post('/submissions/run', data);
    return response.data;
  }

  static async getSubmissions(assessmentId: string): Promise<{ submissions: Submission[] }> {
    const response = await api.get(`/submissions/assessment/${assessmentId}`);
    return response.data;
  }

  static async completeAssessment(assessmentId: string): Promise<{ message: string; result: any }> {
    const response = await api.post(`/submissions/complete/${assessmentId}`);
    return response.data;
  }

  // Health check
  static async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await api.get('/health');
    return response.data;
  }
}
