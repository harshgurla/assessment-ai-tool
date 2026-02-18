import { useState, useEffect } from 'react';
import {
  User,
  Award,
  Edit3,
  Save,
  X,
  Camera,
  TrendingUp,
  Settings,
  Key
} from 'lucide-react';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  joinDate: string;
  bio?: string;
  skills: string[];
  preferences: {
    notifications: {
      email: boolean;
      assessmentReminders: boolean;
      scoreUpdates: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  stats: {
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    totalTimeSpent: number;
    streak: number;
    achievements: number;
  };
}

export const StudentProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch user profile from auth verify endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      // Fetch stats
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      let stats = {
        totalAssessments: 0,
        completedAssessments: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        streak: 0,
        achievements: 0
      };
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.stats) {
          stats = {
            totalAssessments: statsData.stats.totalAssessments || 0,
            completedAssessments: statsData.stats.completedAssessments || 0,
            averageScore: statsData.stats.averageScore || 0,
            totalTimeSpent: statsData.stats.totalTimeSpent || 0,
            streak: statsData.stats.currentStreak || 0,
            achievements: 0
          };
        }
      }
      
      setProfile({
        _id: data.user.id,
        email: data.user.email,
        name: data.user.name || 'Student',
        joinDate: new Date().toISOString(),
        bio: '',
        skills: [],
        preferences: {
          notifications: {
            email: true,
            assessmentReminders: true,
            scoreUpdates: false
          },
          theme: 'light',
          language: 'en'
        },
        stats
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Show error without mock data
      // Error already set above
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditedProfile({});
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/students/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError(null);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const formatTime = (minutes: number) => {
    if (!minutes || minutes === 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Profile</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-gray-600 text-white p-1 rounded-full hover:bg-gray-700 transition-colors">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500">
                Joined {new Date(profile.joinDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{profile.stats.completedAssessments}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{profile.stats.averageScore}%</div>
            <div className="text-sm text-gray-500">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(profile.stats.totalTimeSpent)}</div>
            <div className="text-sm text-gray-500">Time Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{profile.stats.streak}</div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'profile', name: 'Profile', icon: User },
              { id: 'preferences', name: 'Preferences', icon: Settings },
              { id: 'security', name: 'Security', icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editedProfile.name || profile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={editedProfile.bio || profile.bio || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <input
                      type="text"
                      value={editedProfile.skills?.join(', ') || profile.skills.join(', ')}
                      onChange={(e) => setEditedProfile({ ...editedProfile, skills: e.target.value.split(', ').filter(skill => skill.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="JavaScript, Python, React..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProfile({});
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600">{profile.bio || 'No bio added yet.'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Award className="h-8 w-8 text-yellow-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Quick Learner</p>
                          <p className="text-sm text-gray-500">Completed 5 assessments</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Consistent Performer</p>
                          <p className="text-sm text-gray-500">7-day streak</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications.email}
                      onChange={() => {
                        const newProfile = {
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              email: !profile.preferences.notifications.email
                            }
                          }
                        };
                        setProfile(newProfile);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Assessment Reminders</p>
                      <p className="text-sm text-gray-500">Get reminded about pending assessments</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications.assessmentReminders}
                      onChange={() => {
                        const newProfile = {
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              assessmentReminders: !profile.preferences.notifications.assessmentReminders
                            }
                          }
                        };
                        setProfile(newProfile);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Score Updates</p>
                      <p className="text-sm text-gray-500">Get notified when scores are available</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications.scoreUpdates}
                      onChange={() => {
                        const newProfile = {
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              scoreUpdates: !profile.preferences.notifications.scoreUpdates
                            }
                          }
                        };
                        setProfile(newProfile);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
                <select
                  value={profile.preferences.theme}
                  onChange={(e) => {
                    const newProfile = {
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        theme: e.target.value as 'light' | 'dark' | 'system'
                      }
                    };
                    setProfile(newProfile);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                {isChangingPassword ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
