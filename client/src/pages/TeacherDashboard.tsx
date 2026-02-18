import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  BookOpen, 
  Users, 
  BarChart3, 
  LogOut,
  Settings,
  Calendar,
  Search,
  Menu,
  X
} from 'lucide-react';
import { CreateAssessmentModal } from '../components/teacher/CreateAssessmentModal';
import { AssessmentCard } from '../components/teacher/AssessmentCard';
import { StudentManagement } from '../components/teacher/StudentManagement';
import { AnalyticsDashboard } from '../components/teacher/AnalyticsDashboard';

interface Assessment {
  _id: string;
  title: string;
  topic: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  questions: any[];
  createdAt: string;
  status: 'draft' | 'active' | 'completed';
  studentsAssigned: number;
  submissions: number;
}

type ActiveTab = 'dashboard' | 'assessments' | 'students' | 'analytics' | 'settings';

export const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'completed'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assessments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assessment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalAssessments: assessments.length,
    activeAssessments: assessments.filter(a => a.status === 'active').length,
    totalStudents: assessments.reduce((sum, a) => sum + a.studentsAssigned, 0),
    totalSubmissions: assessments.reduce((sum, a) => sum + a.submissions, 0),
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assessments', label: 'Assessments', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Assessment Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Teacher Portal</p>
        </div>

        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
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

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'T'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Teacher'}</p>
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

      {/* Mobile Menu Overlay - Optimized for iQoo Neo 10 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 w-72 h-full bg-white shadow-xl flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assessment Hub</h2>
                  <p className="text-xs text-gray-500 mt-1">Teacher Portal</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-colors touch-manipulation ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="font-medium text-base">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-100 rounded-lg p-4 mb-3">
                <div className="flex items-center">
                  <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || 'T'}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Teacher'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors font-medium touch-manipulation"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-base">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 capitalize truncate flex-1 min-w-0">
              {activeTab}
            </h2>
            
            {activeTab === 'assessments' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-2 touch-manipulation min-h-[44px] font-medium shadow-sm whitespace-nowrap"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline text-sm sm:text-base">Create Assessment</span>
                <span className="sm:hidden text-sm">Create</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Cards - Responsive grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-blue-100 rounded-lg p-2.5 sm:p-3">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalAssessments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-green-100 rounded-lg p-2.5 sm:p-3">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Active</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeAssessments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-purple-100 rounded-lg p-2.5 sm:p-3">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Students</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-orange-100 rounded-lg p-2.5 sm:p-3">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Submissions</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
                </div>
                <div className="p-6">
                  {assessments.slice(0, 5).map((assessment) => (
                    <div key={assessment._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          assessment.status === 'active' ? 'bg-green-500' :
                          assessment.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{assessment.title}</p>
                          <p className="text-sm text-gray-500">{assessment.topic} • {assessment.language}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{assessment.submissions} submissions</p>
                        <p className="text-xs text-gray-500">{new Date(assessment.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assessments Tab */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              {/* Search and Filter - Responsive */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search assessments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assessments Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredAssessments.map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      onEdit={() => {/* TODO: Implement edit */}}
                      onDelete={() => {/* TODO: Implement delete */}}
                      onView={() => {/* TODO: Implement view */}}
                    />
                  ))}
                </div>
              )}

              {filteredAssessments.length === 0 && !loading && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters.'
                      : 'Get started by creating your first assessment.'
                    }
                  </p>
                  {!searchQuery && filterStatus === 'all' && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[48px] font-medium shadow-sm"
                    >
                      Create Assessment
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && <StudentManagement />}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && <AnalyticsDashboard assessments={assessments} />}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              <p className="text-gray-600">Settings panel coming soon...</p>
            </div>
          )}
        </main>
      </div>

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <CreateAssessmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAssessments();
          }}
        />
      )}
    </div>
  );
};
