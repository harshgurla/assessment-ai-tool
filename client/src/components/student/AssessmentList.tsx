import { useState } from 'react';
import { 
  Search, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  BookOpen,
  Calendar,
  Timer,
  Award,
  RefreshCw
} from 'lucide-react';

interface Assessment {
  _id: string;
  title: string;
  topic: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  questionCount: number;
  createdAt: string;
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  startedAt?: string;
  completedAt?: string;
}

interface AssessmentListProps {
  assessments: Assessment[];
  loading: boolean;
  onStartAssessment: (assessment: Assessment) => void;
  onRetry: () => void;
}

export const AssessmentList = ({ assessments, loading, onStartAssessment, onRetry }: AssessmentListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus;
    const matchesDifficulty = filterDifficulty === 'all' || assessment.difficulty === filterDifficulty;
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <PlayCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Assessment Cards */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterStatus !== 'all' || filterDifficulty !== 'all'
              ? 'No assessments found'
              : 'No assessments available'
            }
          </h3>
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterDifficulty !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Check back later for new assessments from your teachers.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <div key={assessment._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(assessment.status)}
                      <h3 className="text-xl font-semibold text-gray-900 ml-2">{assessment.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{assessment.topic}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {assessment.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assessment.difficulty)}`}>
                        {assessment.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {assessment.language}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Timer className="h-4 w-4 mr-1" />
                        {formatDuration(assessment.duration)}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {assessment.questionCount} questions
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </div>
                      {assessment.score !== undefined && (
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1" />
                          {assessment.score}% score
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col items-end space-y-2">
                    {assessment.status === 'not-started' && (
                      <button
                        onClick={() => onStartAssessment(assessment)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Assessment
                      </button>
                    )}
                    
                    {assessment.status === 'in-progress' && (
                      <button
                        onClick={() => onStartAssessment(assessment)}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Continue
                      </button>
                    )}
                    
                    {assessment.status === 'completed' && (
                      <div className="text-right">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                          Completed
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{assessment.score}%</div>
                        <div className="text-xs text-gray-500">Final Score</div>
                      </div>
                    )}
                    
                    {assessment.startedAt && (
                      <div className="text-xs text-gray-500 text-right">
                        Started: {new Date(assessment.startedAt).toLocaleDateString()}
                      </div>
                    )}
                    
                    {assessment.completedAt && (
                      <div className="text-xs text-gray-500 text-right">
                        Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Summary Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{assessments.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{assessments.filter(a => a.status === 'in-progress').length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{assessments.filter(a => a.status === 'completed').length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{assessments.filter(a => a.status === 'not-started').length}</div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};
