import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Code,
  FileText,
  Loader2
} from 'lucide-react';

interface Question {
  _id: string;
  type: 'programming' | 'theory' | 'mcq';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  sampleInput?: string;
  sampleOutput?: string;
  constraints?: string;
  timeLimit?: number;
  memoryLimit?: number;
  points: number;
  testCases?: {
    input: string;
    output: string;
    isHidden?: boolean;
  }[];
  options?: string[]; // For MCQ questions
  correctAnswer?: string; // For MCQ questions
  starterCode?: string; // For programming questions
}

interface Assessment {
  id: string;
  title: string;
  topic: string;
  language: string;
  difficulty: string;
  duration: number;
  questions: Question[];
}

interface AssessmentSession {
  resultId: string;
  startedAt: string;
  duration: number; // in minutes
}

interface SubmissionData {
  questionId: string;
  answer: string;
  code?: string;
  timeSpent: number;
}

export const AssessmentWorkspace = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SubmissionData>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const editorRef = useRef<any>(null);
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (assessmentId) {
      initializeAssessment();
    }
  }, [assessmentId]);

  useEffect(() => {
    if (session) {
      // Calculate end time from session start time + duration
      const startTime = new Date(session.startedAt).getTime();
      const durationMs = session.duration * 60 * 1000; // Convert minutes to milliseconds
      const endTime = startTime + durationMs;
      
      // Set initial time remaining
      const initialRemaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(initialRemaining);
      
      console.log('Timer started:', {
        startTime: new Date(startTime).toISOString(),
        duration: session.duration,
        endTime: new Date(endTime).toISOString(),
        remaining: Math.floor(initialRemaining / 1000) + ' seconds'
      });
      
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          handleSubmitAssessment(true); // Auto-submit when time runs out
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestionIndex]);

  const initializeAssessment = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // First, try to start the assessment (this creates the session if not already started)
      const startResponse = await fetch(`${import.meta.env.VITE_API_URL}/assessments/${assessmentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let sessionData;
      if (startResponse.ok) {
        // Assessment started successfully (new or already started)
        sessionData = await startResponse.json();
        console.log('Session data:', sessionData);
        setSession({
          resultId: sessionData.resultId,
          startedAt: sessionData.startedAt,
          duration: sessionData.duration
        });
      } else {
        // Handle error cases
        const errorData = await startResponse.json();
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      // Fetch the assessment details
      const detailsResponse = await fetch(`${import.meta.env.VITE_API_URL}/assessments/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch assessment details');
      }

      const detailsData = await detailsResponse.json();
      
      // Validate assessment data
      if (!detailsData.assessment || !detailsData.assessment.questions) {
        throw new Error('Invalid assessment data received');
      }
      
      setAssessment({
        id: detailsData.assessment.id || detailsData.assessment._id,
        title: detailsData.assessment.title || 'Untitled Assessment',
        topic: detailsData.assessment.topic || 'General',
        language: detailsData.assessment.language || 'javascript',
        difficulty: detailsData.assessment.difficulty || 'beginner',
        duration: detailsData.assessment.duration || 60,
        questions: detailsData.assessment.questions
      });

      // Ensure we have session data before proceeding
      if (!sessionData) {
        throw new Error('Failed to initialize assessment session');
      }

    } catch (err) {
      console.error('Error initializing assessment:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string, code?: string) => {
    const timeSpent = Date.now() - questionStartTime.current;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answer,
        code,
        timeSpent: (prev[questionId]?.timeSpent || 0) + timeSpent
      }
    }));
    questionStartTime.current = Date.now();
  };

  const handleRunCode = async () => {
    if (!assessment || !editorRef.current) return;
    
    const currentQuestion = assessment.questions[currentQuestionIndex];
    if (currentQuestion.type !== 'programming') return;

    const code = editorRef.current.getValue();
    
    try {
      setIsRunningCode(true);
      setCodeOutput('Running code...');

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/submissions/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: assessment.language,
          input: '' // We can add input field later if needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run code');
      }

      const result = await response.json();
      setCodeOutput(result.output || result.error || 'Code executed successfully');
      
      // Save the code
      handleAnswerChange(currentQuestion._id, '', code);
    } catch (err) {
      setCodeOutput(`Error: ${err instanceof Error ? err.message : 'Failed to run code'}`);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSubmitAssessment = async (isAutoSubmit = false) => {
    if (!assessment || !session || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/submissions/complete/${assessmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: Object.values(answers),
          isAutoSubmit
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      await response.json(); // Read response but don't need result
      // Navigate back to student dashboard with success message
      navigate('/student', { 
        state: { message: 'Assessment submitted successfully!' }
      });
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/student')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{assessment.title}</h1>
                <p className="text-sm text-gray-500">{assessment.topic}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                timeRemaining < 300000 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeRemaining)}
              </div>
              <button
                onClick={() => handleSubmitAssessment()}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Question List */}
              <div className="space-y-2">
                {assessment.questions.map((question, index) => {
                  const isAnswered = answers[question._id];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question._id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isCurrent 
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : isAnswered
                            ? 'border-green-200 bg-green-50 text-green-900'
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {question.type === 'programming' ? (
                            <Code className="h-4 w-4 mr-2" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          <span className="text-sm font-medium">Q{index + 1}</span>
                        </div>
                        {isAnswered && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {question.points} point{question.points !== 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Question Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {currentQuestion.type === 'programming' ? (
                      <Code className="h-5 w-5 mr-2 text-blue-600" />
                    ) : (
                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">
                      Question {currentQuestionIndex + 1} of {assessment.questions.length}
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">{currentQuestion.title}</h3>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.description}
                  </div>
                  {currentQuestion.constraints && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Constraints:</p>
                      <p className="text-sm text-yellow-700 whitespace-pre-wrap">{currentQuestion.constraints}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6">
                {/* MCQ Question */}
                {currentQuestion.type === 'mcq' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Select the correct answer:</h4>
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                      currentQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            answers[currentQuestion._id]?.answer === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion._id}`}
                            value={option}
                            checked={answers[currentQuestion._id]?.answer === option}
                            onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                            className="h-5 w-5 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className="ml-3 text-base text-gray-800 leading-relaxed">
                            <span className="font-medium text-gray-600 mr-2">{String.fromCharCode(65 + index)}.</span>
                            {option}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">⚠️ No options available for this question</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Theory Question */}
                {currentQuestion.type === 'theory' && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Your Answer:</h4>
                    <textarea
                      value={answers[currentQuestion._id]?.answer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      placeholder="Type your detailed answer here...\n\nTip: Be clear and concise in your explanation."
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[150px] text-base leading-relaxed"
                    />
                    <p className="text-xs text-gray-500">Word count: {(answers[currentQuestion._id]?.answer || '').split(/\s+/).filter(Boolean).length}</p>
                  </div>
                )}

                {/* Programming Question */}
                {currentQuestion.type === 'programming' && (
                  <div className="space-y-4">
                    {/* Sample Input/Output */}
                    {(currentQuestion.sampleInput || currentQuestion.sampleOutput) && (
                      <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.sampleInput && (
                          <div className="bg-gray-50 p-3 rounded-lg border">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Sample Input:</p>
                            <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">{currentQuestion.sampleInput}</pre>
                          </div>
                        )}
                        {currentQuestion.sampleOutput && (
                          <div className="bg-gray-50 p-3 rounded-lg border">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Sample Output:</p>
                            <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">{currentQuestion.sampleOutput}</pre>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Code Editor ({assessment.language})
                        </span>
                        <button
                          onClick={handleRunCode}
                          disabled={isRunningCode}
                          className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                        >
                          {isRunningCode ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Run Code
                        </button>
                      </div>
                      <Editor
                        height="400px"
                        language={assessment.language?.toLowerCase() || 'javascript'}
                        value={answers[currentQuestion._id]?.code || currentQuestion.starterCode || ''}
                        onChange={(value) => handleAnswerChange(currentQuestion._id, '', value || '')}
                        onMount={(editor) => { editorRef.current = editor; }}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          wordWrap: 'on',
                          tabSize: 2,
                        }}
                      />
                    </div>

                    {/* Output Panel */}
                    {codeOutput && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <span className="text-sm font-medium text-gray-700">Output</span>
                        </div>
                        <pre className="p-4 text-sm text-gray-800 bg-gray-900 text-green-400 font-mono whitespace-pre-wrap">
                          {codeOutput}
                        </pre>
                      </div>
                    )}

                    {/* Test Cases */}
                    {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                          <span className="text-sm font-semibold text-gray-800">📋 Test Cases (Visible)</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {currentQuestion.testCases.map((testCase, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center mb-2">
                                <span className="inline-block w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="ml-2 text-sm font-medium text-gray-700">Test Case {index + 1}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                  <p className="text-xs font-semibold text-blue-800 mb-1">Input:</p>
                                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">{testCase.input}</pre>
                                </div>
                                <div className="bg-green-50 p-3 rounded border border-green-100">
                                  <p className="text-xs font-semibold text-green-800 mb-1">Expected Output:</p>
                                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">{testCase.output}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(assessment.questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === assessment.questions.length - 1}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
