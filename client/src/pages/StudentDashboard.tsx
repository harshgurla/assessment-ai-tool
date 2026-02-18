import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  BarChart3,
  Settings,
  User,
  CheckCircle,
  AlertCircle,
  LogOut,
  Timer,
  Award,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import {
  AssessmentList,
  StudentProfile
} from '../components/student';
import { ModernStudentProgress } from '../components/student/ModernStudentProgress';

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

interface StudentStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalTimeSpent: number;
  currentStreak: number;
  rank: number;
}

type ActiveTab = 'dashboard' | 'assessments' | 'progress' | 'profile' | 'settings';

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalAssessments: 0,
    completedAssessments: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    rank: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchAssessments();
    fetchStudentStats();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assessments/student`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats({
            totalAssessments: data.stats.totalAssessments || 0,
            completedAssessments: data.stats.completedAssessments || 0,
            averageScore: data.stats.averageScore || 0,
            totalTimeSpent: data.stats.totalTimeSpent || 0,
            currentStreak: data.stats.currentStreak || 0,
            rank: data.stats.rank || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch student stats:', error);
      // Keep default stats on error
    }
  };

  const startAssessment = async (assessment: Assessment) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assessments/${assessment._id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Navigate to assessment workspace
        navigate(`/student/assessment/${assessment._id}`);
        // Refresh assessments to update status
        fetchAssessments();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to start assessment');
      }
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setError('Network error. Please try again.');
    }
  };



  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assessments', label: 'Assessments', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Assessment workspace is handled by separate route
  // No need for conditional rendering here

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Hub</h1>
              <p className="text-sm text-gray-500 mt-1">Student Portal</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="mt-6 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-green-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 capitalize truncate">
                {activeTab}
              </h2>
              {error && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                  <button 
                    onClick={() => setError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
              <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Rank #{stats.rank || 'N/A'}
              </div>
              <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {stats.averageScore.toFixed(1)}%
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.name || 'Student'}! 👋</h3>
                    <p className="mt-2 text-blue-100 text-sm sm:text-base">
                      Ready to continue your learning journey? Let's tackle some assessments!
                    </p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold">{stats.currentStreak}</div>
                      <div className="text-xs sm:text-sm text-blue-100">Day Streak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="bg-blue-100 rounded-lg p-2 sm:p-3 mb-2 sm:mb-0">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Total</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalAssessments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="bg-green-100 rounded-lg p-2 sm:p-3 mb-2 sm:mb-0">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Completed</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.completedAssessments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="bg-purple-100 rounded-lg p-2 sm:p-3 mb-2 sm:mb-0">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Score</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="bg-orange-100 rounded-lg p-2 sm:p-3 mb-2 sm:mb-0">
                      <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div className="sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Time Spent</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {stats.totalTimeSpent >= 60 
                          ? `${Math.floor(stats.totalTimeSpent / 60)}h ${Math.round(stats.totalTimeSpent % 60)}m`
                          : `${Math.round(stats.totalTimeSpent)}m`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Available Assessments</h3>
                  </div>
                  <div className="p-6">
                    {assessments.filter(a => a.status === 'not-started').slice(0, 3).map((assessment) => (
                      <div key={assessment._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{assessment.title}</p>
                            <p className="text-sm text-gray-500">{assessment.topic} • {assessment.difficulty}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => startAssessment(assessment)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Start
                        </button>
                      </div>
                    ))}
                    {assessments.filter(a => a.status === 'not-started').length === 0 && (
                      <p className="text-gray-500 text-center py-4">No new assessments available</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Results</h3>
                  </div>
                  <div className="p-6">
                    {assessments.filter(a => a.status === 'completed').slice(0, 3).map((assessment) => (
                      <div key={assessment._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{assessment.title}</p>
                            <p className="text-sm text-gray-500">{new Date(assessment.completedAt!).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{assessment.score}%</p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      </div>
                    ))}
                    {assessments.filter(a => a.status === 'completed').length === 0 && (
                      <p className="text-gray-500 text-center py-4">No completed assessments yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assessments Tab */}
          {activeTab === 'assessments' && (
            <AssessmentList 
              assessments={assessments}
              loading={loading}
              onStartAssessment={startAssessment}
              onRetry={fetchAssessments}
            />
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <ModernStudentProgress 
              userId={user?.id}
            />
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <StudentProfile />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-3" defaultChecked />
                      <span className="text-sm text-gray-700">Email notifications for new assessments</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-3" defaultChecked />
                      <span className="text-sm text-gray-700">Show performance analytics</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-3" />
                      <span className="text-sm text-gray-700">Dark mode (Coming soon)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Code Editor</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Theme</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>VS Code Dark</option>
                        <option>VS Code Light</option>
                        <option>Monokai</option>
                        <option>GitHub</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Font Size</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>12px</option>
                        <option>14px</option>
                        <option>16px</option>
                        <option>18px</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
