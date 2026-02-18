import { AIQuestionRequest, AIEvaluationRequest, AIEvaluationResponse, Question } from '../types';
declare class AIService {
    private openai;
    private gemini;
    private aiProvider;
    constructor();
    generateQuestions(request: AIQuestionRequest): Promise<Question[]>;
    private generateQuestionsWithGemini;
    private getPointsByDifficulty;
    private generateQuestionsWithOpenAI;
    private buildPrompt;
    evaluateSubmission(request: AIEvaluationRequest): Promise<AIEvaluationResponse>;
    runCode(code: string, language: string, input: string): Promise<{
        output: string;
        error: string | null;
        executionTime: number;
    }>;
    private generateMockQuestions;
    private getStarterCode;
}
declare const aiService: AIService;
export default aiService;
//# sourceMappingURL=aiService.d.ts.map