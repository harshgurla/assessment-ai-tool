import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Target,
  Activity,
  Zap,
  Star,
  Calendar,
  Trophy,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Users,
  Brain,
  Code,
  CheckCircle2,
  Timer,
  Flame,
  Medal,
  RefreshCw,
  Play,
  Pause,
  Clock
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
    icon: keyof typeof ICON_MAP;
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

// Define icon mapping as a constant for type safety
const ICON_MAP = {
  trophy: Trophy,
  flame: Flame,
  code: Code,
  zap: Zap,
  star: Star,
  medal: Medal,
  brain: Brain,
  clock: Clock
} as const;

interface StudentProgressProps {
  userId?: string;
}

// Comprehensive type guard to validate stats data
const isValidProgressStats = (data: unknown): data is ProgressStats => {
  if (!data || typeof data !== 'object') return false;
  
  const requiredNumbers = ['totalAssessments', 'completedAssessments', 'averageScore', 'totalTimeSpent', 'streak', 'rank', 'totalStudents'];
  if (!requiredNumbers.every(key => typeof (data as Record<string, unknown>)[key] === 'number' && (data as Record<string, number>)[key] >= 0)) return false;
  
  const requiredArrays = ['recentScores', 'subjectPerformance', 'monthlyProgress', 'weeklyActivity', 'achievements', 'skillLevels'];
  if (!requiredArrays.every(key => Array.isArray((data as Record<string, unknown>)[key]))) return false;
  
  // Validate improvements object
  if (!(data as Record<string, unknown>).improvements || typeof (data as Record<string, unknown>).improvements !== 'object') return false;
  const improvementKeys = ['score', 'time', 'accuracy'];
  if (!improvementKeys.every(key => typeof (data as Record<string, any>).improvements[key] === 'number')) return false;
  
  return true;
};

// Data sanitizer to ensure safe values
const sanitizeProgressData = (data: unknown): ProgressStats | null => {
  if (!isValidProgressStats(data)) return null;
  
  return {
    ...data,
    totalAssessments: Math.max(0, Math.floor(data.totalAssessments)),
    completedAssessments: Math.max(0, Math.floor(data.completedAssessments)),
    averageScore: Math.max(0, Math.min(100, Math.round(data.averageScore))),
    totalTimeSpent: Math.max(0, Math.floor(data.totalTimeSpent)),
    streak: Math.max(0, Math.floor(data.streak)),
    rank: Math.max(1, Math.floor(data.rank)),
    totalStudents: Math.max(1, Math.floor(data.totalStudents)),
    recentScores: data.recentScores.map((score: any) => ({
      ...score,
      score: Math.max(0, Math.min(100, Math.round(score.score || 0)))
    })),
    achievements: data.achievements.filter((achievement: any) => 
      achievement && achievement.id && achievement.title && achievement.icon in ICON_MAP
    )
  };
};

// Custom hook for progress data management
const useProgressData = (userId?: string, timeRange: 'week' | 'month' | 'year' = 'month') => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProgressStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when backend is ready
      const loadingDelay = Math.min(500 + retryCount * 200, 2000);
      
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            const mockData = {
              totalAssessments: 24,
              completedAssessments: 18,
              averageScore: 82,
              totalTimeSpent: 2160,
              streak: 12,
              rank: 8,
              totalStudents: 150,
              improvements: { score: 15, time: -12, accuracy: 22 },
              recentScores: [
                { date: '2024-12-10', score: 65, subject: 'JavaScript' },
                { date: '2024-12-11', score: 72, subject: 'Python' },
                { date: '2024-12-12', score: 78, subject: 'React' },
                { date: '2024-12-13', score: 81, subject: 'JavaScript' },
                { date: '2024-12-14', score: 85, subject: 'Python' },
                { date: '2024-12-15', score: 79, subject: 'React' },
                { date: '2024-12-16', score: 88, subject: 'JavaScript' },
                { date: '2024-12-17', score: 91, subject: 'Node.js' },
                { date: '2024-12-18', score: 76, subject: 'CSS' },
                { date: '2024-12-19', score: 93, subject: 'TypeScript' }
              ],
              subjectPerformance: [
                { subject: 'JavaScript', score: 88, assessments: 8, improvement: 12, color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
                { subject: 'Python', score: 79, assessments: 6, improvement: -3, color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
                { subject: 'React', score: 85, assessments: 4, improvement: 18, color: 'bg-gradient-to-r from-cyan-400 to-cyan-600' },
                { subject: 'Node.js', score: 82, assessments: 3, improvement: 8, color: 'bg-gradient-to-r from-green-400 to-green-600' },
                { subject: 'TypeScript', score: 91, assessments: 2, improvement: 25, color: 'bg-gradient-to-r from-indigo-400 to-indigo-600' },
                { subject: 'CSS', score: 76, assessments: 1, improvement: 5, color: 'bg-gradient-to-r from-pink-400 to-pink-600' }
              ],
              monthlyProgress: [
                { month: 'Sep', assessments: 3, averageScore: 65, timeSpent: 180 },
                { month: 'Oct', assessments: 6, averageScore: 72, timeSpent: 420 },
                { month: 'Nov', assessments: 8, averageScore: 78, timeSpent: 580 },
                { month: 'Dec', assessments: 7, averageScore: 86, timeSpent: 480 }
              ],
              weeklyActivity: [
                { day: 'Mon', assessments: 3, score: 85 },
                { day: 'Tue', assessments: 2, score: 72 },
                { day: 'Wed', assessments: 4, score: 88 },
                { day: 'Thu', assessments: 1, score: 91 },
                { day: 'Fri', assessments: 2, score: 79 },
                { day: 'Sat', assessments: 1, score: 93 },
                { day: 'Sun', assessments: 0, score: 0 }
              ],
              achievements: [
                { id: '1', title: 'First Steps', description: 'Complete your first assessment', icon: 'trophy', earned: true, date: '2024-11-15' },
                { id: '2', title: 'Streak Master', description: 'Maintain a 12-day streak', icon: 'flame', earned: true, date: '2024-12-10' },
                { id: '3', title: 'Code Warrior', description: 'Score above 90% in programming', icon: 'code', earned: true, date: '2024-12-17' },
                { id: '4', title: 'Speed Demon', description: 'Complete assessment in under 30 minutes', icon: 'zap', earned: true, date: '2024-12-05' },
                { id: '5', title: 'Perfect Score', description: 'Get 100% on any assessment', icon: 'star', earned: false },
                { id: '6', title: 'Top 10', description: 'Reach top 10 in leaderboard', icon: 'medal', earned: true, date: '2024-12-18' },
                { id: '7', title: 'Multi-talented', description: 'Complete assessments in 5 different subjects', icon: 'brain', earned: false },
                { id: '8', title: 'Night Owl', description: 'Complete assessment after 10 PM', icon: 'clock', earned: true, date: '2024-12-12' }
              ],
              skillLevels: [
                { skill: 'Problem Solving', level: 8, maxLevel: 10, progress: 80 },
                { skill: 'Code Quality', level: 7, maxLevel: 10, progress: 70 },
                { skill: 'Time Management', level: 6, maxLevel: 10, progress: 60 },
                { skill: 'Debugging', level: 7, maxLevel: 10, progress: 70 },
                { skill: 'Algorithm Design', level: 5, maxLevel: 10, progress: 50 },
                { skill: 'Testing', level: 4, maxLevel: 10, progress: 40 }
              ]
            };
            
            const sanitizedData = sanitizeProgressData(mockData);
            if (sanitizedData) {
              setStats(sanitizedData);
              setLoading(false);
              setRetryCount(0);
              resolve();
            } else {
              reject(new Error('Data validation failed - corrupted progress data'));
            }
          } catch (error) {
            console.error('Error setting mock data:', error);
            reject(new Error('Failed to process progress data'));
          }
        }, loadingDelay);
      });
    } catch (err) {
      console.error('Error fetching progress:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching progress data';
      setError(errorMessage);
      setLoading(false);
      setRetryCount(prev => Math.min(prev + 1, 5));
    }
  }, [userId, timeRange, retryCount]);

  useEffect(() => {
    void fetchProgressStats();
  }, []);

  const retry = useCallback(() => {
    setRetryCount(0);
    fetchProgressStats();
  }, [fetchProgressStats]);

  return { stats, loading, error, retry };
};

export const ModernStudentProgress = ({ userId }: StudentProgressProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'achievements'>('overview');
  const [isAnimated, setIsAnimated] = useState(true);
  
  const { stats, loading, error, retry } = useProgressData(userId, timeRange);

  // Memoized utility functions for better performance
  const formatTime = useCallback((minutes: number): string => {
    if (typeof minutes !== 'number' || minutes < 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const getScoreColor = useCallback((score: number): string => {
    if (typeof score !== 'number') return 'text-gray-400';
    
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const getScoreBgColor = useCallback((score: number): string => {
    if (typeof score !== 'number') return 'from-gray-400 to-gray-500';
    
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    if (score >= 60) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  }, []);

  const getImprovementIcon = useCallback((value: number) => {
    if (typeof value !== 'number') return <div className="h-4 w-4" />;
    
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  }, []);

  // Memoized calculations for better performance with error protection
  const completionPercentage = useMemo(() => {
    if (!stats?.totalAssessments || stats.totalAssessments <= 0) return 0;
    const percentage = (stats.completedAssessments / stats.totalAssessments) * 100;
    return Math.min(100, Math.max(0, Math.round(percentage)));
  }, [stats?.totalAssessments, stats?.completedAssessments]);

  const achievementStats = useMemo(() => {
    if (!stats?.achievements) return { earned: 0, total: 0, remaining: 0, completionRate: 0 };
    
    const earned = stats.achievements.filter(a => a.earned).length;
    const total = stats.achievements.length;
    const remaining = total - earned;
    const completionRate = total > 0 ? Math.round((earned / total) * 100) : 0;
    
    return { earned, total, remaining, completionRate };
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-80"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-xl w-40"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-lg border animate-pulse">
                <div className="h-14 bg-gray-200 rounded-full w-14 mb-6"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-lg border animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="h-80 bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-lg border animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h3>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <button
              onClick={retry}
              disabled={loading}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <RefreshCw className={`h-5 w-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Progress Data Yet</h3>
            <p className="text-gray-600 text-lg">Start taking assessments to see your amazing progress here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Learning Journey
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              Track your progress, celebrate achievements, and level up your skills! 🚀
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center bg-white rounded-2xl p-2 shadow-lg border">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-3 rounded-xl transition-all duration-200 capitalize font-medium ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-blue-100 font-medium">Completion</span>
                </div>
                <div className="text-3xl font-bold">{completionPercentage}%</div>
                <div className="text-blue-100 text-sm">{stats.completedAssessments}/{stats.totalAssessments} assessments</div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-6 w-6" />
                  <span className="text-emerald-100 font-medium">Avg Score</span>
                </div>
                <div className="text-3xl font-bold">{stats?.averageScore ?? 0}%</div>
                <div className="flex items-center space-x-1 text-emerald-100 text-sm">
                  {getImprovementIcon(stats?.improvements?.score ?? 0)}
                  <span>{Math.abs(stats?.improvements?.score ?? 0)}% this {timeRange}</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Study Streak */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="h-6 w-6" />
                  <span className="text-orange-100 font-medium">Streak</span>
                </div>
                <div className="text-3xl font-bold">{stats?.streak ?? 0} days</div>
                <div className="text-orange-100 text-sm">Keep it up! 🔥</div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Rank */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-6 w-6" />
                  <span className="text-purple-100 font-medium">Ranking</span>
                </div>
                <div className="text-3xl font-bold">#{stats?.rank ?? 0}</div>
                <div className="text-purple-100 text-sm">of {stats?.totalStudents ?? 0} students</div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-white rounded-2xl p-2 shadow-lg border w-fit mx-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'performance', label: 'Performance', icon: TrendingUp },
            { key: 'achievements', label: 'Achievements', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'overview' | 'performance' | 'achievements')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Performance Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Score Trend Chart */}
                <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-xl border">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Score Progression</h3>
                      <p className="text-gray-600">Your journey to excellence ✨</p>
                    </div>
                    <button
                      onClick={() => setIsAnimated(!isAnimated)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      {isAnimated ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Custom Chart */}
                  <div className="relative h-80">
                    <div className="absolute inset-0 flex items-end space-x-2">
                      {stats?.recentScores?.map((scoreData, index) => (
                        <div
                          key={`score-${index}-${scoreData.date}`}
                          className="flex-1 flex flex-col items-center"
                          style={{
                            animation: isAnimated ? `slideUp 0.8s ease-out ${index * 0.1}s both` : undefined
                          }}
                        >
                          <div
                            className={`w-full rounded-t-xl bg-gradient-to-t ${getScoreBgColor(scoreData.score)} shadow-lg relative group`}
                            style={{ height: `${Math.max((scoreData.score / 100) * 100, 5)}%`, minHeight: '20px' }}
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {scoreData.subject}: {scoreData.score}%
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 mt-2">{scoreData.score}%</span>
                          <span className="text-xs text-gray-400">
                            {(() => {
                              try {
                                return new Date(scoreData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              } catch {
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Subject Mastery</h3>
                  <p className="text-gray-600 mb-8">Your expertise across topics 🎯</p>
                  
                  <div className="space-y-6">
                    {stats?.subjectPerformance?.map((subject, index) => (
                      <div key={`subject-${subject.subject}-${index}`} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${subject.color}`}></div>
                            <span className="font-semibold text-gray-900">{subject.subject}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${getScoreColor(subject.score)}`}>
                              {subject.score}%
                            </span>
                            {getImprovementIcon(subject.improvement)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full ${subject.color} transition-all duration-1000 ease-out`}
                              style={{ 
                                width: `${subject.score}%`,
                                animation: isAnimated ? `growWidth 1.5s ease-out ${index * 0.2}s both` : undefined
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{subject.assessments} tests</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Activity Heatmap */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Weekly Activity</h3>
                    <p className="text-gray-600">Your learning rhythm 📅</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-4">
                  {stats?.weeklyActivity?.map((day, index) => (
                    <div key={`day-${day.day}-${index}`} className="text-center space-y-3">
                      <div className="text-sm font-medium text-gray-600">{day.day}</div>
                      <div
                        className={`h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg transition-all duration-500 transform hover:scale-110 ${
                          day.assessments > 0
                            ? `bg-gradient-to-br ${getScoreBgColor(day.score)} shadow-lg`
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        style={{
                          animation: isAnimated ? `popIn 0.6s ease-out ${index * 0.1}s both` : undefined
                        }}
                      >
                        {day.assessments || '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.assessments > 0 ? `${day.score}% avg` : 'Rest day'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'performance' && (
            <>
              {/* Detailed Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Skill Levels */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Skill Development</h3>
                  <p className="text-gray-600 mb-8">Level up your coding abilities 🎮</p>
                  
                  <div className="space-y-6">
                    {stats?.skillLevels?.map((skill, index) => (
                      <div key={`skill-${skill.skill}-${index}`} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{skill.skill}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-indigo-600">
                              Level {skill.level}/{skill.maxLevel}
                            </span>
                            <div className="flex space-x-1">
                              {Array.from({ length: skill.maxLevel }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < skill.level ? 'bg-indigo-600' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${skill.progress}%`,
                              animation: isAnimated ? `growWidth 1.2s ease-out ${index * 0.15}s both` : undefined
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Progress */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Growth</h3>
                  <p className="text-gray-600 mb-8">Your consistent improvement 📈</p>
                  
                  <div className="space-y-6">
                    {stats?.monthlyProgress?.map((month, index) => (
                      <div key={`month-${month.month}-${index}`} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{month.month}</span>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(month.averageScore)}`}>
                                {month.averageScore}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {month.assessments} assessments
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-indigo-600">
                                {formatTime(month.timeSpent)}
                              </div>
                              <div className="text-xs text-gray-500">
                                study time
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getScoreBgColor(month.averageScore)} transition-all duration-1000 ease-out`}
                            style={{ 
                              width: `${month.averageScore}%`,
                              animation: isAnimated ? `growWidth 1s ease-out ${index * 0.2}s both` : undefined
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Performance Insights 🧠</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-20 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Brain className="h-8 w-8" />
                      <span className="font-semibold">Improvement Rate</span>
                    </div>
                    <div className="text-3xl font-bold">+{stats?.improvements?.score ?? 0}%</div>
                    <div className="text-indigo-100">Score increase this {timeRange}</div>
                  </div>
                  
                  <div className="bg-white bg-opacity-20 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Timer className="h-8 w-8" />
                      <span className="font-semibold">Speed Boost</span>
                    </div>
                    <div className="text-3xl font-bold">{Math.abs(stats?.improvements?.time ?? 0)}%</div>
                    <div className="text-indigo-100">Faster completion time</div>
                  </div>
                  
                  <div className="bg-white bg-opacity-20 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Target className="h-8 w-8" />
                      <span className="font-semibold">Accuracy Gain</span>
                    </div>
                    <div className="text-3xl font-bold">+{stats?.improvements?.accuracy ?? 0}%</div>
                    <div className="text-indigo-100">Better precision</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-8">
              {/* Achievement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <Trophy className="h-8 w-8 mb-3" />
                      <div className="text-3xl font-bold">{achievementStats.earned}</div>
                      <div className="text-yellow-100">Achievements Unlocked</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <Star className="h-8 w-8 mb-3" />
                      <div className="text-3xl font-bold">{achievementStats.completionRate}%</div>
                      <div className="text-emerald-100">Completion Rate</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <Medal className="h-8 w-8 mb-3" />
                      <div className="text-3xl font-bold">{achievementStats.remaining}</div>
                      <div className="text-purple-100">Goals Remaining</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stats?.achievements?.map((achievement, index) => {
                  const IconComponent = ICON_MAP[achievement.icon] || Trophy;

                  return (
                    <div
                      key={`achievement-${achievement.id}-${index}`}
                      className={`relative rounded-3xl p-6 shadow-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 shadow-yellow-200/50'
                          : 'bg-gray-50 border-gray-200 grayscale opacity-75'
                      }`}
                      style={{
                        animation: isAnimated && achievement.earned ? `bounceIn 0.8s ease-out ${index * 0.1}s both` : undefined
                      }}
                    >
                      {achievement.earned && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                      
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      
                      <h4 className={`font-bold text-lg mb-2 ${
                        achievement.earned ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {achievement.title}
                      </h4>
                      
                      <p className={`text-sm mb-3 ${
                        achievement.earned ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {achievement.description}
                      </p>
                      
                      {achievement.earned && achievement.date && (
                        <div className="flex items-center space-x-2 text-yellow-600 text-xs font-medium">
                          <Calendar className="h-4 w-4" />
                          <span>Earned {new Date(achievement.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {!achievement.earned && (
                        <div className="text-xs text-gray-500 font-medium">
                          🔒 Locked
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-8 text-white shadow-2xl text-center">
                <Star className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Keep Going, Champion! 🌟</h3>
                <p className="text-pink-100 text-lg">
                  You've unlocked {achievementStats.earned} achievements so far. 
                  Only {achievementStats.remaining} more to become a coding legend!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes growWidth {
          from {
            width: 0%;
          }
        }
        
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
