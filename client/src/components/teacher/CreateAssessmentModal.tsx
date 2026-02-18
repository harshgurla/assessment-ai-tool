import { useEffect, useState } from 'react';
import { 
  X, 
  Sparkles, 
  Trash2, 
  Eye, 
  Plus, 
  Edit3, 
  Code, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Save
} from 'lucide-react';

interface Question {
  id: string;
  type: 'programming' | 'theory' | 'mcq';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  // Programming specific
  language?: string;
  starterCode?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  // MCQ specific
  options?: string[];
  correctAnswer?: number;
  // Theory specific
  expectedAnswer?: string;
  keywords?: string[];
}

interface CreateAssessmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentOption {
  _id: string;
  name?: string;
  email: string;
}

export const CreateAssessmentModal = ({ onClose, onSuccess }: CreateAssessmentModalProps) => {
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Questions, 3: Review
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [questionCreationMode, setQuestionCreationMode] = useState<'ai' | 'manual'>('ai');
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    language: 'javascript',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    duration: 60,
    questionTypes: [] as ('programming' | 'theory' | 'mcq')[],
    questionCounts: {
      programming: 2,
      theory: 3,
      mcq: 5
    },
    instructions: '',
    studentEmails: [] as string[]
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [manualQuestionData, setManualQuestionData] = useState({
    type: 'programming' as 'programming' | 'theory' | 'mcq',
    title: '',
    description: '',
    points: 10,
    timeLimit: 30,
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    programmingData: {
      language: 'javascript',
      starterCode: '',
      solution: '',
      testCases: [{ input: '', expectedOutput: '', isHidden: false }]
    },
    theoryData: {
      expectedKeywords: [] as string[],
      minWords: 50,
      maxWords: 200
    },
    mcqData: {
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }
  });

  const languages = [
    'javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go', 'rust'
  ];

  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      setStudentsError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/students`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.students)) {
          setStudents(data.students);
        } else {
          setStudentsError(data.error || 'Failed to load students');
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setStudentsError('Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleBasicInfoSubmit = () => {
    if (!formData.title || !formData.topic || formData.questionTypes.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    setStep(2);
  };

  const generateQuestionsWithAI = async () => {
    setAiGenerating(true);
    setAiError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assessments/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          topic: formData.topic,
          language: formData.language,
          difficulty: formData.difficulty,
          questionTypes: formData.questionTypes,
          counts: formData.questionCounts
        })
      });

      const data = await response.json();
      console.log('AI Response:', data);
      
      if (data.success && data.questions && data.questions.length > 0) {
        // Ensure every question has a stable unique `id` for React list keys
        const questionsWithIds = data.questions.map((q: any, i: number) => ({
          ...q,
          id: q.id || q._id || `${q.type || 'q'}_${Date.now()}_${i}`
        }));

        setQuestions(questionsWithIds);
        
        // Handle AI service warnings and errors
        if (data.aiError && data.warning) {
          setAiError(`${data.warning}: ${data.message}`);
        } else if (data.errors && data.errors.length > 0) {
          setAiError(`Partial generation failure: ${data.errors.join(', ')}`);
        } else if (data.totalGenerated < (formData.questionCounts.programming + formData.questionCounts.theory + formData.questionCounts.mcq)) {
          setAiError('Some questions could not be generated. You may need to add more questions manually.');
        }
      } else {
        // No questions generated at all
        const errorMessage = data.error || 'Failed to generate questions';
        const suggestions = data.suggestions ? data.suggestions.join('\n• ') : 'Please try again or create questions manually.';
        
        setAiError(`${errorMessage}\n\nSuggestions:\n• ${suggestions}`);
        
        // Generate mock questions as fallback
        generateMockQuestions();
      }
    } catch (error: any) {
      console.error('AI generation request failed:', error);
      
      // Network or request error
      setAiError(
        `Connection error: ${error.message}\n\nPlease check:\n• Your internet connection\n• Server is running\n• Try again in a few moments`
      );
      
      // Generate mock questions as fallback
      generateMockQuestions();
    } finally {
      setAiGenerating(false);
    }
  };

  const saveManualQuestion = (question: Question) => {
    if (editingQuestion && questions.find(q => q.id === editingQuestion.id)) {
      // Update existing question
      setQuestions(questions.map(q => q.id === question.id ? question : q));
    } else {
      // Add new question
      setQuestions([...questions, question]);
    }
    setShowManualForm(false);
    setEditingQuestion(null);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowManualForm(true);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const duplicateQuestion = (question: Question) => {
    const duplicated = {
      ...question,
      id: `duplicate_${Date.now()}`,
      title: `${question.title} (Copy)`
    };
    setQuestions([...questions, duplicated]);
  };

  const generateMockQuestions = () => {
    const mockQuestions: Question[] = [];
    
    if (formData.questionTypes.includes('programming')) {
      for (let i = 0; i < formData.questionCounts.programming; i++) {
        mockQuestions.push({
          id: `prog_${i + 1}`,
          type: 'programming',
          title: `${formData.topic} Programming Challenge ${i + 1}`,
          description: `Solve this ${formData.topic} problem using ${formData.language}.`,
          difficulty: formData.difficulty,
          points: 20,
          language: formData.language,
          starterCode: getStarterCode(formData.language),
          testCases: [
            { input: 'test input', expectedOutput: 'expected output', isHidden: false },
            { input: 'hidden test', expectedOutput: 'hidden output', isHidden: true }
          ]
        });
      }
    }

    if (formData.questionTypes.includes('theory')) {
      for (let i = 0; i < formData.questionCounts.theory; i++) {
        mockQuestions.push({
          id: `theory_${i + 1}`,
          type: 'theory',
          title: `${formData.topic} Theory Question ${i + 1}`,
          description: `Explain the concept of ${formData.topic} and its practical applications.`,
          difficulty: formData.difficulty,
          points: 10,
          expectedAnswer: `A comprehensive explanation about ${formData.topic}...`,
          keywords: [formData.topic.toLowerCase(), 'concept', 'application']
        });
      }
    }

    if (formData.questionTypes.includes('mcq')) {
      for (let i = 0; i < formData.questionCounts.mcq; i++) {
        mockQuestions.push({
          id: `mcq_${i + 1}`,
          type: 'mcq',
          title: `${formData.topic} Multiple Choice ${i + 1}`,
          description: `Which of the following is true about ${formData.topic}?`,
          difficulty: formData.difficulty,
          points: 5,
          options: [
            'Option A - Correct answer',
            'Option B - Incorrect',
            'Option C - Incorrect',
            'Option D - Incorrect'
          ],
          correctAnswer: 0
        });
      }
    }

    setQuestions(mockQuestions);
  };

  const getStarterCode = (language: string) => {
    const starters: { [key: string]: string } = {
      javascript: 'function solve() {\n  // Your code here\n  \n}',
      python: 'def solve():\n    # Your code here\n    pass',
      java: 'public class Solution {\n    public void solve() {\n        // Your code here\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
      csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        // Your code here\n    }\n}',
    };
    return starters[language] || '// Your code here';
  };

  const createAssessment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          topic: formData.topic,
          language: formData.language,
          difficulty: formData.difficulty,
          duration: formData.duration,
          instructions: formData.instructions,
          questions: questions,
          studentEmails: formData.studentEmails
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        alert('Failed to create assessment: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create assessment:', error);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionList = () => {
    return questions.map((question) => (
      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h5 className="font-medium text-gray-900">{question.title}</h5>
            <p className="text-sm text-gray-500 mt-1">{question.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                {question.type === 'programming' && <Code className="h-3 w-3 mr-1" />}
                {question.type === 'theory' && <FileText className="h-3 w-3 mr-1" />}
                {question.type === 'mcq' && <CheckCircle className="h-3 w-3 mr-1" />}
                {question.type}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                {question.difficulty}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {question.points} points
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewQuestion(question)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Preview Question"
            >
              <Eye className="h-4 w-4" />
            </button>
            {questionCreationMode === 'manual' && (
              <>
                <button
                  onClick={() => editQuestion(question)}
                  className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                  title="Edit Question"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => duplicateQuestion(question)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Duplicate Question"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => deleteQuestion(question.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove Question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    ));
  };

  const renderManualQuestionForm = () => {
    return (
      <div className="space-y-6">
        {/* Question Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Question Type *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: 'programming', icon: Code, label: 'Programming', desc: 'Code challenge' },
              { type: 'theory', icon: FileText, label: 'Theory', desc: 'Written answer' },
              { type: 'mcq', icon: CheckCircle, label: 'MCQ', desc: 'Multiple choice' }
            ].map(({ type, icon: Icon, label, desc }) => (
              <button
                key={type}
                onClick={() => setManualQuestionData(prev => ({ ...prev, type: type as any }))}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  manualQuestionData.type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Question Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Title *
            </label>
            <input
              type="text"
              value={manualQuestionData.title}
              onChange={(e) => setManualQuestionData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter question title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points *
            </label>
            <input
              type="number"
              value={manualQuestionData.points}
              onChange={(e) => setManualQuestionData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Description *
          </label>
          <textarea
            value={manualQuestionData.description}
            onChange={(e) => setManualQuestionData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what the student needs to do..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={manualQuestionData.difficulty}
              onChange={(e) => setManualQuestionData(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={manualQuestionData.timeLimit}
              onChange={(e) => setManualQuestionData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="5"
              max="120"
            />
          </div>
        </div>

        {/* Type-specific fields */}
        {manualQuestionData.type === 'programming' && renderProgrammingFields()}
        {manualQuestionData.type === 'theory' && renderTheoryFields()}
        {manualQuestionData.type === 'mcq' && renderMCQFields()}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setShowManualForm(false);
              setEditingQuestion(null);
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const questionToSave = {
                ...manualQuestionData,
                id: editingQuestion?.id || `manual_${Date.now()}`
              };
              saveManualQuestion(questionToSave);
            }}
            disabled={!manualQuestionData.title || !manualQuestionData.description}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {editingQuestion ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    );
  };

  const renderProgrammingFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Programming Language
        </label>
        <select
          value={manualQuestionData.programmingData.language}
          onChange={(e) => setManualQuestionData(prev => ({
            ...prev,
            programmingData: { ...prev.programmingData, language: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {languages.map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Starter Code (Optional)
        </label>
        <textarea
          value={manualQuestionData.programmingData.starterCode}
          onChange={(e) => setManualQuestionData(prev => ({
            ...prev,
            programmingData: { ...prev.programmingData, starterCode: e.target.value }
          }))}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Enter starter code for students..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Cases *
        </label>
        <div className="space-y-3">
          {manualQuestionData.programmingData.testCases.map((testCase, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Test Case {index + 1}</h4>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={testCase.isHidden}
                      onChange={(e) => {
                        const newTestCases = [...manualQuestionData.programmingData.testCases];
                        newTestCases[index].isHidden = e.target.checked;
                        setManualQuestionData(prev => ({
                          ...prev,
                          programmingData: { ...prev.programmingData, testCases: newTestCases }
                        }));
                      }}
                      className="mr-1"
                    />
                    Hidden
                  </label>
                  <button
                    onClick={() => {
                      const newTestCases = manualQuestionData.programmingData.testCases.filter((_, i) => i !== index);
                      setManualQuestionData(prev => ({
                        ...prev,
                        programmingData: { ...prev.programmingData, testCases: newTestCases }
                      }));
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Input</label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => {
                      const newTestCases = [...manualQuestionData.programmingData.testCases];
                      newTestCases[index].input = e.target.value;
                      setManualQuestionData(prev => ({
                        ...prev,
                        programmingData: { ...prev.programmingData, testCases: newTestCases }
                      }));
                    }}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="Test input..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expected Output</label>
                  <textarea
                    value={testCase.expectedOutput}
                    onChange={(e) => {
                      const newTestCases = [...manualQuestionData.programmingData.testCases];
                      newTestCases[index].expectedOutput = e.target.value;
                      setManualQuestionData(prev => ({
                        ...prev,
                        programmingData: { ...prev.programmingData, testCases: newTestCases }
                      }));
                    }}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="Expected output..."
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const newTestCases = [...manualQuestionData.programmingData.testCases, { input: '', expectedOutput: '', isHidden: false }];
              setManualQuestionData(prev => ({
                ...prev,
                programmingData: { ...prev.programmingData, testCases: newTestCases }
              }));
            }}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add Test Case
          </button>
        </div>
      </div>
    </div>
  );

  const renderTheoryFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Words
          </label>
          <input
            type="number"
            value={manualQuestionData.theoryData.minWords}
            onChange={(e) => setManualQuestionData(prev => ({
              ...prev,
              theoryData: { ...prev.theoryData, minWords: parseInt(e.target.value) }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="10"
            max="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Words
          </label>
          <input
            type="number"
            value={manualQuestionData.theoryData.maxWords}
            onChange={(e) => setManualQuestionData(prev => ({
              ...prev,
              theoryData: { ...prev.theoryData, maxWords: parseInt(e.target.value) }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="50"
            max="2000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expected Keywords (Optional)
        </label>
        <input
          type="text"
          value={manualQuestionData.theoryData.expectedKeywords.join(', ')}
          onChange={(e) => setManualQuestionData(prev => ({
            ...prev,
            theoryData: { 
              ...prev.theoryData, 
              expectedKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
            }
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="keyword1, keyword2, keyword3..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Comma-separated keywords that should appear in good answers
        </p>
      </div>
    </div>
  );

  const renderMCQFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Answer Options *
        </label>
        <div className="space-y-3">
          {manualQuestionData.mcqData.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="radio"
                name="correctAnswer"
                checked={manualQuestionData.mcqData.correctAnswer === index}
                onChange={() => setManualQuestionData(prev => ({
                  ...prev,
                  mcqData: { ...prev.mcqData, correctAnswer: index }
                }))}
                className="text-blue-600"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...manualQuestionData.mcqData.options];
                    newOptions[index] = e.target.value;
                    setManualQuestionData(prev => ({
                      ...prev,
                      mcqData: { ...prev.mcqData, options: newOptions }
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Select the radio button next to the correct answer
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explanation (Optional)
        </label>
        <textarea
          value={manualQuestionData.mcqData.explanation}
          onChange={(e) => setManualQuestionData(prev => ({
            ...prev,
            mcqData: { ...prev.mcqData, explanation: e.target.value }
          }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Explain why this is the correct answer..."
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">Create Assessment</h2>
            <div className="ml-4 flex items-center space-x-2">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., JavaScript Fundamentals Test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Variables and Functions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programming Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="10"
                    max="180"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question Types *
                </label>
                <div className="space-y-4">
                  {[
                    { type: 'programming', label: 'Programming Questions', desc: 'Code challenges with test cases' },
                    { type: 'theory', label: 'Theory Questions', desc: 'Written explanations and concepts' },
                    { type: 'mcq', label: 'Multiple Choice', desc: 'Quick knowledge checks' }
                  ].map(({ type, label, desc }) => (
                    <div key={type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.questionTypes.includes(type as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                questionTypes: [...prev.questionTypes, type as any]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                questionTypes: prev.questionTypes.filter(t => t !== type)
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                      </div>
                      {formData.questionTypes.includes(type as any) && (
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.questionCounts[type as keyof typeof formData.questionCounts]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            questionCounts: {
                              ...prev.questionCounts,
                              [type]: parseInt(e.target.value)
                            }
                          }))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (Optional)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Special instructions for students..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Questions</h3>
                <p className="text-gray-600">
                  Choose how you want to create questions for your assessment
                </p>
              </div>

              {/* Question Creation Mode Selection */}
              <div className="mb-6">
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => setQuestionCreationMode('ai')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      questionCreationMode === 'ai'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    Generate with AI
                  </button>
                  <button
                    onClick={() => setQuestionCreationMode('manual')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      questionCreationMode === 'manual'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Manually
                  </button>
                </div>
              </div>

              {/* AI Generation Mode */}
              {questionCreationMode === 'ai' && (
                <div>
                  {aiError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-red-800 font-medium">AI Generation Failed</p>
                          <p className="text-red-600 text-sm mt-1">{aiError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                      <button
                        onClick={generateQuestionsWithAI}
                        disabled={aiGenerating}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center mx-auto"
                      >
                        {aiGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Questions with AI
                          </>
                        )}
                      </button>
                      {aiError && (
                        <p className="text-sm text-gray-500 mt-4">
                          Having trouble with AI? Try switching to manual creation above.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Generated Questions ({questions.length})
                        </h4>
                        <button
                          onClick={generateQuestionsWithAI}
                          disabled={aiGenerating}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Regenerate
                        </button>
                      </div>
                      {renderQuestionList()}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Creation Mode */}
              {questionCreationMode === 'manual' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Questions ({questions.length})
                    </h4>
                    <button
                      onClick={() => setShowManualForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">No questions added yet</p>
                      <button
                        onClick={() => setShowManualForm(true)}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {renderQuestionList()}
                    </div>
                  )}

                  {/* Manual Question Form Modal */}
                  {showManualForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {editingQuestion ? 'Edit Question' : 'Add New Question'}
                            </h3>
                            <button
                              onClick={() => {
                                setShowManualForm(false);
                                setEditingQuestion(null);
                                setManualQuestionData({
                                  type: 'programming',
                                  title: '',
                                  description: '',
                                  points: 10,
                                  timeLimit: 30,
                                  difficulty: 'intermediate',
                                  programmingData: {
                                    language: formData.language,
                                    starterCode: '',
                                    solution: '',
                                    testCases: [{ input: '', expectedOutput: '', isHidden: false }]
                                  },
                                  theoryData: {
                                    expectedKeywords: [],
                                    minWords: 50,
                                    maxWords: 200
                                  },
                                  mcqData: {
                                    options: ['', '', '', ''],
                                    correctAnswer: 0,
                                    explanation: ''
                                  }
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                          {renderManualQuestionForm()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review and Create */}
          {step === 3 && (
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Assessment Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Title:</span>
                    <span className="ml-2 font-medium">{formData.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Topic:</span>
                    <span className="ml-2 font-medium">{formData.topic}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Language:</span>
                    <span className="ml-2 font-medium">{formData.language}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 font-medium">{formData.duration} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Difficulty:</span>
                    <span className="ml-2 font-medium">{formData.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Questions:</span>
                    <span className="ml-2 font-medium">{questions.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Emails
                </label>
                <select
                  multiple
                  value={formData.studentEmails}
                  onChange={(e) => {
                    const selectedEmails = Array.from(e.target.selectedOptions).map(option => option.value);
                    setFormData(prev => ({ ...prev, studentEmails: selectedEmails }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {studentsLoading && (
                    <option value="" disabled>
                      Loading students...
                    </option>
                  )}
                  {!studentsLoading && students.length === 0 && (
                    <option value="" disabled>
                      No students have logged in yet
                    </option>
                  )}
                  {!studentsLoading && students.map((student) => (
                    <option key={student._id} value={student.email}>
                      {student.name ? `${student.name} (${student.email})` : student.email}
                    </option>
                  ))}
                </select>
                {studentsError && (
                  <p className="text-xs text-red-600 mt-1">{studentsError}</p>
                )}
                {!studentsError && (
                  <p className="text-xs text-gray-500 mt-1">
                    Hold Ctrl (Windows) or Command (Mac) to select multiple students.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={step === 1 ? handleBasicInfoSubmit : () => setStep(3)}
                disabled={step === 2 && questions.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={createAssessment}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Assessment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Question Preview</h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              <h4 className="font-medium text-gray-900 mb-2">{previewQuestion.title}</h4>
              <p className="text-gray-700 mb-4">{previewQuestion.description}</p>
              
              {previewQuestion.type === 'programming' && previewQuestion.starterCode && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Starter Code:</h5>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {previewQuestion.starterCode}
                  </pre>
                </div>
              )}
              
              {previewQuestion.type === 'mcq' && previewQuestion.options && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Options:</h5>
                  <div className="space-y-2">
                    {previewQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border ${
                          index === previewQuestion.correctAnswer
                            ? 'bg-green-100 border-green-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
