import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIQuestionRequest, AIEvaluationRequest, AIEvaluationResponse, Question } from '../types';

class AIService {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;
  private aiProvider: 'openai' | 'gemini';

  constructor() {
    // Get API keys from environment
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const preferredProvider = process.env.AI_PROVIDER as 'openai' | 'gemini';
    
    // Validate API keys more strictly
    const hasValidOpenAI = openaiKey && 
      openaiKey !== 'your-openai-api-key-here' && 
      openaiKey.startsWith('sk-') && 
      openaiKey.length > 20;
      
    const hasValidGemini = geminiKey && 
      geminiKey !== 'YOUR_GEMINI_API_KEY_HERE' && 
      geminiKey.startsWith('AIza') && 
      geminiKey.length > 20;

    // Priority: Use Gemini first (free), then OpenAI (paid)
    if (hasValidGemini) {
      this.aiProvider = 'gemini';
      this.gemini = new GoogleGenerativeAI(geminiKey);
      this.openai = null; // Don't initialize OpenAI if Gemini works
      console.log('✅ Using Google Gemini AI (Free Tier Available)');
    } else if (hasValidOpenAI && preferredProvider === 'openai') {
      this.aiProvider = 'openai';
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.gemini = null;
      console.log('✅ Using OpenAI (Note: This is a paid service)');
    } else {
      // No valid AI service available
      this.aiProvider = 'gemini'; // Default fallback
      this.openai = null;
      this.gemini = null;
      
      console.warn('❌ No valid AI service available.');
      console.warn('📝 Recommended solution:');
      console.warn('  🆓 Get a FREE Google Gemini API key from: https://makersuite.google.com/app/apikey');
      console.warn('  💰 Or get a paid OpenAI API key from: https://platform.openai.com/api-keys');
      console.warn('  📁 Add the key to your .env file');
      console.warn('  🔄 Restart the server');
      console.warn('  ⚡ Mock questions will be used as fallback');
    }
  }

  async generateQuestions(request: AIQuestionRequest): Promise<Question[]> {
    console.log('🤖 AI generateQuestions called with:', JSON.stringify(request, null, 2));
    console.log('🔧 Using AI Provider:', this.aiProvider);
    
    // Check if AI service is available
    if (this.aiProvider === 'gemini' && !this.gemini) {
      console.log('⚠️  Gemini client not available, using mock questions');
      return this.generateMockQuestions(request);
    }
    
    if (this.aiProvider === 'openai' && !this.openai) {
      console.log('⚠️  OpenAI client not available, using mock questions');
      return this.generateMockQuestions(request);
    }
    
    try {
      if (this.aiProvider === 'gemini') {
        console.log('✅ Gemini client available, proceeding with AI generation');
        return await this.generateQuestionsWithGemini(request);
      } else {
        console.log('✅ OpenAI client available, proceeding with AI generation');
        return await this.generateQuestionsWithOpenAI(request);
      }
    } catch (error: any) {
      console.error('❌ Error in generateQuestions:', error);
      console.error('❌ Error message:', error.message);
      
      // Return mock questions as fallback
      console.log('🔄 Falling back to mock questions...');
      return this.generateMockQuestions(request);
    }
  }

  private async generateQuestionsWithGemini(request: AIQuestionRequest): Promise<Question[]> {
    const { topic, language, type, difficulty, count } = request;
    
    if (!this.gemini) {
      throw new Error('Gemini client is not initialized. Please check your API key.');
    }
    
    let prompt = this.buildPrompt(request);
    
    console.log('🚀 Making Google Gemini API call...');
    console.log('📊 Model: gemini-2.5-flash');
    console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (!response) {
        throw new Error('Empty response from Gemini API');
      }
      
      const content = response.text();
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty content from Gemini API');
      }

      console.log('✅ Gemini API call successful');
      console.log('📄 Raw content length:', content.length);
      console.log('📄 Content preview:', content.substring(0, 300) + '...');

      // Parse JSON response
      let questions;
      try {
        // Remove any markdown code block markers if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        
        // Try to extract JSON if it's embedded in text
        const jsonMatch = cleanContent.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
        
        questions = JSON.parse(jsonString);
        
        if (!Array.isArray(questions)) {
          throw new Error('Response is not an array of questions');
        }
        
        console.log('✅ JSON parsing successful, questions count:', questions.length);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('📄 Raw content that failed to parse:', content.substring(0, 500));
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }
      
      // Validate and structure questions
      const structuredQuestions = questions.map((q: any, index: number) => {
        if (!q.title || !q.description) {
          console.warn(`⚠️  Question ${index + 1} missing required fields, using defaults`);
        }
        
        return {
          _id: `q_${Date.now()}_${index}`,
          title: q.title || `${topic} Question ${index + 1}`,
          description: q.description || `Question about ${topic}`,
          type: type,
          difficulty: difficulty,
          points: this.getPointsByDifficulty(difficulty),
          timeLimit: 30,
          ...q
        };
      });
      
      return structuredQuestions;
      
    } catch (error: any) {
      console.error('❌ Gemini API Error:', error);
      
      // Provide specific error messages
      if (error.message?.includes('API key not valid')) {
        throw new Error('Invalid Google Gemini API key. Please check your GOOGLE_GEMINI_API_KEY in .env file.');
      } else if (error.message?.includes('quota')) {
        throw new Error('Google Gemini API quota exceeded. Please check your usage limits or try again later.');
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        throw new Error('Permission denied for Google Gemini API. Please verify your API key has proper permissions.');
      } else {
        throw new Error(`Google Gemini API error: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }
  
  private getPointsByDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'beginner': return 10;
      case 'intermediate': return 20;
      case 'advanced': return 30;
      default: return 15;
    }
  }

  private async generateQuestionsWithOpenAI(request: AIQuestionRequest): Promise<Question[]> {
    const { topic, language, type, difficulty, count } = request;
    
    let prompt = this.buildPrompt(request);

    console.log('🚀 Making OpenAI API call...');
    console.log('📊 Model:', process.env.AI_MODEL || 'gpt-3.5-turbo');
    console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');

    const response = await this.openai!.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert programming instructor. Generate high-quality, educational programming and theory questions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(process.env.MAX_TOKENS || '2000'),
      temperature: 0.7
    });

    console.log('✅ OpenAI API call successful');
    console.log('📤 Response usage:', response.usage);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('❌ No content in OpenAI response');
      throw new Error('No content generated');
    }

    console.log('📄 Raw content length:', content.length);
    console.log('📄 Content preview:', content.substring(0, 300) + '...');

    // Parse JSON response
    let questions;
    try {
      questions = JSON.parse(content);
      console.log('✅ JSON parsing successful, questions count:', questions.length);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('📄 Raw content that failed to parse:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Add IDs and ensure proper structure
    return questions.map((q: any, index: number) => ({
      _id: `q_${Date.now()}_${index}`,
      ...q
    }));
  }

  private buildPrompt(request: AIQuestionRequest): string {
    const { topic, language, type, difficulty, count } = request;
    
    let prompt = '';
    
    if (type === 'programming' || type === 'mixed') {
      prompt = `Generate ${count} ${difficulty} level programming questions about ${topic}`;
      if (language) {
        prompt += ` in ${language}`;
      }
      prompt += `. For each question, provide:
      1. Title (concise)
      2. Description (detailed problem statement)
      3. Sample input/output
      4. Test cases (at least 3)
      5. Constraints
      6. Time limit (in seconds)
      7. Memory limit (in MB)
      8. Points (based on difficulty: easy=10, medium=20, hard=30)
      
      Format the response as JSON array with this structure:
      [{
        "type": "programming",
        "title": "Question Title",
        "description": "Detailed problem description",
        "sampleInput": "sample input",
        "sampleOutput": "sample output",
        "constraints": "constraints",
        "timeLimit": 30,
        "memoryLimit": 128,
        "language": "${language}",
        "testCases": [
          {"input": "test1", "output": "output1", "isHidden": false},
          {"input": "test2", "output": "output2", "isHidden": true}
        ],
        "points": 20
      }]`;
    } else if (type === 'theory') {
      prompt = `Generate ${count} ${difficulty} level theory questions about ${topic}. For each question, provide:
      1. Title (concise)
      2. Description (detailed question)
      3. Expected keywords for evaluation
      4. Points based on difficulty
      
      Format the response as JSON array with this structure:
      [{
        "type": "theory",
        "title": "Question Title",
        "description": "Detailed question description",
        "expectedAnswer": "Sample answer for reference",
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "points": 15
      }]`;
    } else if (type === 'mcq') {
      prompt = `Generate ${count} ${difficulty} level multiple choice questions about ${topic}. For each question, provide:
      1. Title (concise)
      2. Description (question text)
      3. Four options
      4. Correct answer index (0-3)
      5. Explanation
      
      Format the response as JSON array with this structure:
      [{
        "type": "mcq",
        "title": "Question Title",
        "description": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why this is correct",
        "points": 10
      }]`;
    }
    
    return prompt;
  }

  async evaluateSubmission(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    // Return basic mock evaluation for now
    return {
      score: 75,
      maxScore: 100,
      feedback: "Good attempt! The solution shows understanding of the concepts.",
      status: 'partial' as const
    };
  }

  async runCode(code: string, language: string, input: string): Promise<{
    output: string;
    error: string | null;
    executionTime: number;
  }> {
    // Mock code execution for now - in a real implementation you'd use a sandbox
    console.log(`🏃 Running ${language} code with input: ${input}`);
    
    // Simulate execution time
    const executionTime = Math.random() * 1000 + 100; // 100-1100ms
    
    // Mock output based on language
    let output = '';
    if (language === 'javascript') {
      output = `JavaScript execution result for input: ${input}`;
    } else if (language === 'python') {
      output = `Python execution result for input: ${input}`;
    } else {
      output = `${language} execution result for input: ${input}`;
    }
    
    return {
      output,
      error: null,
      executionTime: Math.round(executionTime)
    };
  }

  private generateMockQuestions(request: AIQuestionRequest): Question[] {
    const mockQuestions: Question[] = [];
    const { topic, language, type, difficulty, count } = request;
    
    console.log('🎭 Generating mock questions as fallback');
    console.log('📝 Request details:', { topic, language, type, difficulty, count });
    
    for (let i = 0; i < count; i++) {
      if (type === 'programming') {
        mockQuestions.push({
          _id: `mock_prog_${Date.now()}_${i + 1}`,
          type: 'programming',
          title: `${topic} Programming Challenge ${i + 1}`,
          description: `Write a ${language} program to solve this ${topic} problem. 

Requirements:
1. Implement a solution that demonstrates understanding of ${topic}
2. Follow best practices for ${language} programming
3. Handle edge cases appropriately
4. Optimize for time and space complexity

This is a high-quality mock question generated when AI service is temporarily unavailable.`,
          difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
          points: this.getPointsByDifficulty(difficulty),
          timeLimit: 45,
          programmingData: {
            language: language || 'javascript',
            starterCode: `// ${topic} solution\nfunction solve${topic.replace(/\s+/g, '')}() {\n  // Your code here\n  \n}`,
            solution: `// Sample solution for ${topic}\nfunction solve${topic.replace(/\s+/g, '')}() {\n  // Implementation would go here\n  return result;\n}`,
            testCases: [
              { 
                input: 'sample input', 
                output: 'expected output', 
                isHidden: false
              },
              { 
                input: 'edge case input', 
                output: 'edge case output', 
                isHidden: true
              }
            ]
          }
        });
      } else if (type === 'theory') {
        mockQuestions.push({
          _id: `mock_theory_${Date.now()}_${i + 1}`,
          type: 'theory',
          title: `Understanding ${topic} - Question ${i + 1}`,
          description: `Provide a comprehensive explanation of ${topic}. Your answer should cover:

1. Definition and core concepts
2. Practical applications and use cases  
3. Advantages and limitations
4. Real-world examples
5. Best practices

Please provide detailed explanations with examples where appropriate. This is a comprehensive mock question generated when AI service is temporarily unavailable.`,
          difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
          points: this.getPointsByDifficulty(difficulty),
          timeLimit: 30,
          theoryData: {
            expectedKeywords: [topic.toLowerCase(), 'explanation', 'example', 'application'],
            minWords: difficulty === 'beginner' ? 50 : difficulty === 'intermediate' ? 100 : 150,
            maxWords: difficulty === 'beginner' ? 150 : difficulty === 'intermediate' ? 300 : 500
          }
        });
      }
    }
    
    console.log(`✅ Generated ${mockQuestions.length} mock questions`);
    return mockQuestions;
  }

  private getStarterCode(language: string): string {
    const starters: { [key: string]: string } = {
      javascript: 'function solve() {\n  // Your code here\n  \n}',
      python: 'def solve():\n    # Your code here\n    pass',
      java: 'public class Solution {\n    public void solve() {\n        // Your code here\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
    };
    return starters[language] || '// Your code here';
  }
}

const aiService = new AIService();
export default aiService;
