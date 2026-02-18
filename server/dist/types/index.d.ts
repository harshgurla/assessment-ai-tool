export interface User {
    _id: string;
    email: string;
    password?: string;
    role: 'teacher' | 'student';
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Assessment {
    _id: string;
    title: string;
    topic: string;
    language: string;
    questionType: 'programming' | 'theory' | 'mixed';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    questions: Question[];
    assignedStudents: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface Question {
    _id: string;
    type: 'programming' | 'theory' | 'mcq';
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    testCases?: TestCase[];
    sampleInput?: string;
    sampleOutput?: string;
    constraints?: string;
    timeLimit?: number;
    memoryLimit?: number;
    points: number;
    programmingData?: {
        language: string;
        starterCode: string;
        solution: string;
        testCases: TestCase[];
    };
    theoryData?: {
        expectedKeywords: string[];
        minWords: number;
        maxWords: number;
    };
    mcqData?: {
        options: string[];
        correctAnswer: number;
        explanation: string;
    };
}
export interface TestCase {
    input: string;
    output: string;
    isHidden: boolean;
}
export interface Submission {
    _id: string;
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
    submittedAt: Date;
    evaluatedAt?: Date;
}
export interface AssessmentResult {
    _id: string;
    assessmentId: string;
    studentEmail: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    submissions: string[];
    startedAt: Date;
    completedAt?: Date;
    timeSpent: number;
}
export interface AIQuestionRequest {
    topic: string;
    language?: string;
    type: 'programming' | 'theory' | 'mixed' | 'mcq';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    count: number;
}
export interface AIEvaluationRequest {
    question: Question;
    submission: {
        code?: string;
        answer?: string;
        language?: string;
    };
}
export interface AIEvaluationResponse {
    score: number;
    maxScore: number;
    feedback: string;
    status: 'accepted' | 'wrong' | 'partial';
}
//# sourceMappingURL=index.d.ts.map