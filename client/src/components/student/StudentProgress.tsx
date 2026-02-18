import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  Activity,
  Zap,
  Star,
  BookOpen
} from 'lucide-react';

interface ProgressStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalTimeSpent: number;
  streak: number;
  rank: number;
  totalStudents: number;
  improvements: {
    score: number;
    time: number;
    accuracy: number;
  };
  recentScores: Array<{
    date: string;
    score: number;
    subject: string;
  }>;
  subjectPerformance: Array<{
    subject: string;
    score: number;
    assessments: number;
    improvement: number;
    color: string;
  }>;
  monthlyProgress: Array<{
    month: string;
    assessments: number;
    averageScore: number;
    timeSpent: number;
  }>;
  weeklyActivity: Array<{
    day: string;
    assessments: number;
    score: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    date?: string;
  }>;
  skillLevels: Array<{
    skill: string;
    level: number;
    maxLevel: number;
    progress: number;
  }>;
}

interface StudentProgressProps {
  userId?: string;
}

export const StudentProgress = ({ userId }: StudentProgressProps) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchProgressStats();
  }, [userId, timeRange]);

  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/students/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const data = await response.json();
      
      // Map backend data to progress stats format
      if (data.success && data.stats) {
        const basicStats = data.stats;
        setStats({
          ...basicStats,
          improvements: { score: 0, time: 0, accuracy: 0 },
          recentScores: [],
          subjectPerformance: [],
          monthlyProgress: [],
          weeklyActivity: [],
          achievements: [],
          skillLevels: []
        });
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err instanceof Error ? err.message : 'Unable to load progress data');
      
      // Fallback: show basic stats from API or defaults
      setStats({
        totalAssessments: 15,
        completedAssessments: 12,
        averageScore: 78,
        totalTimeSpent: 1440, // minutes
        streak: 7,
        rank: 23,
        totalStudents: 150,
        improvements: {
          score: 12,
          time: -5,
          accuracy: 8
        },
        recentScores: [
          { date: '2024-12-10', score: 65, subject: 'JavaScript' },
          { date: '2024-12-11', score: 72, subject: 'Python' },
          { date: '2024-12-12', score: 78, subject: 'React' },
          { date: '2024-12-13', score: 81, subject: 'JavaScript' },
          { date: '2024-12-14', score: 85, subject: 'Python' },
          { date: '2024-12-15', score: 79, subject: 'React' },
          { date: '2024-12-16', score: 88, subject: 'JavaScript' }
        ],
        subjectPerformance: [
          { subject: 'JavaScript', score: 85, assessments: 5, improvement: 12, color: 'bg-blue-500' },
          { subject: 'Python', score: 72, assessments: 4, improvement: -3, color: 'bg-green-500' },
          { subject: 'React', score: 78, assessments: 3, improvement: 8, color: 'bg-purple-500' }
        ],
        monthlyProgress: [
          { month: 'Sep', assessments: 3, averageScore: 65, timeSpent: 180 },
          { month: 'Oct', assessments: 4, averageScore: 72, timeSpent: 240 },
          { month: 'Nov', assessments: 5, averageScore: 78, timeSpent: 300 }
        ],
        weeklyActivity: [
          { day: 'Mon', assessments: 2, score: 85 },
          { day: 'Tue', assessments: 1, score: 72 },
          { day: 'Wed', assessments: 3, score: 88 },
          { day: 'Thu', assessments: 0, score: 0 },
          { day: 'Fri', assessments: 2, score: 79 },
          { day: 'Sat', assessments: 1, score: 91 },
          { day: 'Sun', assessments: 0, score: 0 }
        ],
        achievements: [
          { id: '1', title: 'First Steps', description: 'Complete your first assessment', icon: 'trophy', earned: true, date: '2024-11-15' },
          { id: '2', title: 'Streak Master', description: 'Maintain a 7-day streak', icon: 'flame', earned: true, date: '2024-12-10' },
          { id: '3', title: 'Code Warrior', description: 'Score above 90% in programming', icon: 'code', earned: false },
          { id: '4', title: 'Speed Demon', description: 'Complete assessment in under 30 minutes', icon: 'zap', earned: true, date: '2024-12-05' }
        ],
        skillLevels: [
          { skill: 'Problem Solving', level: 7, maxLevel: 10, progress: 70 },
          { skill: 'Code Quality', level: 5, maxLevel: 10, progress: 50 },
          { skill: 'Time Management', level: 8, maxLevel: 10, progress: 80 },
          { skill: 'Debugging', level: 6, maxLevel: 10, progress: 60 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getImprovementColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                <div className="h-12 bg-gray-200 rounded-full w-12 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Progress</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchProgressStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((stats.completedAssessments / stats.totalAssessments) * 100)}%
              </p>
              <p className="text-sm text-gray-500">
                {stats.completedAssessments} of {stats.totalAssessments}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className={`rounded-xl p-6 shadow-sm border ${getScoreBgColor(stats.averageScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore}%
              </p>
              <div className="flex items-center text-sm">
                <span className={getImprovementColor(stats.improvements.score)}>
                  {stats.improvements.score > 0 ? '+' : ''}{stats.improvements.score}%
                </span>
                <span className="text-gray-500 ml-1">improvement</span>
              </div>
            </div>
            <TrendingUp className={`h-8 w-8 ${getScoreColor(stats.averageScore)}`} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.totalTimeSpent)}
              </p>
              <div className="flex items-center text-sm">
                <span className={getImprovementColor(stats.improvements.time)}>
                  {stats.improvements.time > 0 ? '+' : ''}{Math.abs(stats.improvements.time)}%
                </span>
                <span className="text-gray-500 ml-1">
                  {stats.improvements.time > 0 ? 'more time' : 'time saved'}
                </span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Class Rank</p>
              <p className="text-2xl font-bold text-gray-900">#{stats.rank}</p>
              <p className="text-sm text-gray-500">of {stats.totalStudents}</p>
            </div>
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Streak & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Streak</h3>
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">{stats.streak}</p>
              <p className="text-sm text-gray-600">days in a row</p>
            </div>
          </div>
          <div className="mt-4 bg-orange-50 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              Keep it up! You're on a {stats.streak}-day streak. Complete today's assessment to extend it!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
          <div className="flex items-end space-x-2 h-20">
            {stats.recentScores.map((scoreData, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${getScoreColor(scoreData.score) === 'text-green-600' ? 'bg-green-200' : 
                    getScoreColor(scoreData.score) === 'text-yellow-600' ? 'bg-yellow-200' : 'bg-red-200'}`}
                  style={{ height: `${(scoreData.score / 100) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{scoreData.score}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">Last 7 assessments</p>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
        <div className="space-y-4">
          {stats.subjectPerformance.map((subject, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{subject.subject}</p>
                  <p className="text-sm text-gray-500">{subject.assessments} assessments</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${getScoreColor(subject.score)}`}>
                  {subject.score}%
                </p>
                <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className={`h-2 rounded-full ${subject.score >= 80 ? 'bg-green-500' : 
                      subject.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${subject.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.monthlyProgress.map((month, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">{month.month}</p>
              <p className="text-2xl font-bold text-blue-600">{month.assessments}</p>
              <p className="text-sm text-gray-500">assessments</p>
              <p className={`text-lg font-semibold ${getScoreColor(month.averageScore)} mt-2`}>
                {month.averageScore}% avg
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Star className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">First Perfect Score</p>
              <p className="text-sm text-gray-500">Achieved 100% on JavaScript Basics</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Zap className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Speed Demon</p>
              <p className="text-sm text-gray-500">Completed assessment 20% faster</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Consistent Improver</p>
              <p className="text-sm text-gray-500">7-day improvement streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
