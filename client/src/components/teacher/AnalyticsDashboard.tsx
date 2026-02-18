import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Award, Calendar, Clock } from 'lucide-react';

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

interface AnalyticsDashboardProps {
  assessments: Assessment[];
}

export const AnalyticsDashboard = ({ assessments }: AnalyticsDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Calculate analytics
  const totalAssessments = assessments.length;
  const totalSubmissions = assessments.reduce((sum, a) => sum + a.submissions, 0);
  const averageCompletion = totalSubmissions > 0 ? 
    (totalSubmissions / assessments.reduce((sum, a) => sum + a.studentsAssigned, 0) * 100) : 0;

  const difficultyDistribution = {
    beginner: assessments.filter(a => a.difficulty === 'beginner').length,
    intermediate: assessments.filter(a => a.difficulty === 'intermediate').length,
    advanced: assessments.filter(a => a.difficulty === 'advanced').length
  };

  const languageDistribution = assessments.reduce((acc, assessment) => {
    acc[assessment.language] = (acc[assessment.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Mock data for charts
  const submissionTrend = [
    { period: 'Mon', submissions: 12 },
    { period: 'Tue', submissions: 19 },
    { period: 'Wed', submissions: 8 },
    { period: 'Thu', submissions: 24 },
    { period: 'Fri', submissions: 15 },
    { period: 'Sat', submissions: 6 },
    { period: 'Sun', submissions: 9 }
  ];

  const topPerformers = [
    { name: 'Alex Johnson', score: 95, assessments: 8 },
    { name: 'Sarah Chen', score: 92, assessments: 12 },
    { name: 'Mike Davis', score: 89, assessments: 6 },
    { name: 'Emma Wilson', score: 87, assessments: 10 },
    { name: 'Tom Brown', score: 85, assessments: 7 }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900">{totalAssessments}</p>
              <p className="text-xs text-green-600">+12% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
              <p className="text-xs text-green-600">+8% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{averageCompletion.toFixed(1)}%</p>
              <p className="text-xs text-red-600">-2% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-3">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">78.5%</p>
              <p className="text-xs text-green-600">+5% from last period</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trend Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Submission Trend</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {submissionTrend.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-8">{item.period}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.submissions / 24) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8">{item.submissions}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {topPerformers.map((student, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-medium">
                    {student.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.assessments} assessments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{student.score}%</p>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full mr-1 ${
                          i < Math.floor(student.score / 20) ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Difficulty Distribution</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(difficultyDistribution).map(([difficulty, count]) => (
              <div key={difficulty} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    difficulty === 'beginner' ? 'bg-green-500' :
                    difficulty === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">{difficulty}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{count}</span>
                  <div className="bg-gray-200 rounded-full h-2 w-16">
                    <div
                      className={`h-2 rounded-full ${
                        difficulty === 'beginner' ? 'bg-green-500' :
                        difficulty === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${totalAssessments > 0 ? (count / totalAssessments) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Language Usage</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(languageDistribution).map(([language, count]) => (
              <div key={language} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900 capitalize">{language}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{count}</span>
                  <div className="bg-gray-200 rounded-full h-2 w-16">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${totalAssessments > 0 ? (count / totalAssessments) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(languageDistribution).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No language data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'New submission', student: 'Alex Johnson', assessment: 'JavaScript Basics', time: '2 minutes ago' },
            { action: 'Assessment completed', student: 'Sarah Chen', assessment: 'Python Functions', time: '15 minutes ago' },
            { action: 'New submission', student: 'Mike Davis', assessment: 'React Components', time: '1 hour ago' },
            { action: 'Assessment started', student: 'Emma Wilson', assessment: 'Data Structures', time: '2 hours ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action} by {activity.student}
                  </p>
                  <p className="text-xs text-gray-500">{activity.assessment}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
