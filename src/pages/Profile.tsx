import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    jobTitle: '',
    phone: '',
    timezone: 'America/Los_Angeles'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailReports: true,
    trialReminders: true,
    securityAlerts: true,
    productUpdates: false,
    marketingEmails: false
  });

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      // Update profile data with fetched information
      setProfileData(prev => ({
        ...prev,
        name: data.profile.name || '',
        email: data.profile.email || '',
        company: data.profile.company || '',
        jobTitle: data.profile.job_title || '',
        phone: data.profile.phone || '',
        timezone: data.profile.timezone || 'America/Los_Angeles'
      }));
      
      // Update notification settings
      if (data.profile.email_preferences) {
        setNotificationSettings({
          emailReports: data.profile.email_preferences.email_reports,
          trialReminders: data.profile.email_preferences.trial_reminders,
          securityAlerts: data.profile.email_preferences.security_alerts,
          productUpdates: data.profile.email_preferences.product_updates,
          marketingEmails: data.profile.email_preferences.marketing_emails
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to fetch profile');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Handle validation errors
          const errorMessages = Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.success) {
        setSaveStatus('saved');
        // Refresh profile data
        await fetchProfile();
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
      setSaveStatus('error');
    }
    
    // Reset status after delay
    setTimeout(() => {
      setSaveStatus('idle');
      setProfileError(null);
    }, 3000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setSaveStatus('saving');
    
    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      setSaveStatus('error');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      setSaveStatus('error');
      return;
    }
    
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Handle validation errors
          const errorMessages = Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to update password');
      }

      if (data.success) {
        setSaveStatus('saved');
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
      setSaveStatus('error');
    }
    
    // Reset status after delay
    setTimeout(() => {
      setSaveStatus('idle');
      setPasswordError(null);
    }, 3000);
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationError(null);
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Send only the notification preferences to avoid overwriting profile data
          name: profileData.name,
          email: profileData.email,
          company: profileData.company,
          jobTitle: profileData.jobTitle,
          phone: profileData.phone,
          timezone: profileData.timezone,
          emailReports: notificationSettings.emailReports,
          trialReminders: notificationSettings.trialReminders,
          securityAlerts: notificationSettings.securityAlerts,
          productUpdates: notificationSettings.productUpdates,
          marketingEmails: notificationSettings.marketingEmails
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to update notification preferences');
      }

      if (data.success) {
        setSaveStatus('saved');
        // Refresh profile data to get updated preferences
        await fetchProfile();
      } else {
        throw new Error(data.error || 'Failed to update notification preferences');
      }
    } catch (err) {
      console.error('Notification preferences update error:', err);
      setNotificationError(err instanceof Error ? err.message : 'Failed to update preferences');
      setSaveStatus('error');
    }
    
    // Reset status after delay
    setTimeout(() => {
      setSaveStatus('idle');
      setNotificationError(null);
    }, 3000);
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'password', name: 'Change Password', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile information and account preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-brand-accent text-brand-dark'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Information */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {profileError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <span className="text-red-700 text-sm">{profileError}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={profileData.jobTitle}
                        onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      >
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {saveStatus === 'saved' && activeTab === 'profile' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-700 text-sm">Profile updated successfully</span>
                        </>
                      )}
                      {saveStatus === 'error' && activeTab === 'profile' && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-red-700 text-sm">Failed to update profile</span>
                        </>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={saveStatus === 'saving'}
                      className="flex items-center space-x-2 px-4 py-2 bg-brand-accent text-brand-dark rounded-md hover:bg-yellow-400 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <span className="text-red-700 text-sm">{passwordError}</span>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                      <li>• Contains at least one special character</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {saveStatus === 'saved' && activeTab === 'password' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-700 text-sm">Password updated successfully</span>
                        </>
                      )}
                      {saveStatus === 'error' && activeTab === 'password' && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-red-700 text-sm">Failed to update password</span>
                        </>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={saveStatus === 'saving'}
                      className="flex items-center space-x-2 px-4 py-2 bg-brand-accent text-brand-dark rounded-md hover:bg-yellow-400 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saveStatus === 'saving' ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                
                <form onSubmit={handleNotificationSubmit} className="space-y-6">
                  {notificationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <span className="text-red-700 text-sm">{notificationError}</span>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Reports</h4>
                        <p className="text-sm text-gray-500">Receive accessibility scan reports via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailReports}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, emailReports: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Trial Reminders</h4>
                        <p className="text-sm text-gray-500">Get notified when your trial is about to expire</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.trialReminders}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, trialReminders: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
                        <p className="text-sm text-gray-500">Important security notifications and login alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.securityAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, securityAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Product Updates</h4>
                        <p className="text-sm text-gray-500">New features, improvements, and changelog updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.productUpdates}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, productUpdates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Marketing Emails</h4>
                        <p className="text-sm text-gray-500">Tips, best practices, and promotional content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.marketingEmails}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, marketingEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {saveStatus === 'saved' && activeTab === 'notifications' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-700 text-sm">Preferences updated successfully</span>
                        </>
                      )}
                      {saveStatus === 'error' && activeTab === 'notifications' && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-red-700 text-sm">Failed to update preferences</span>
                        </>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={saveStatus === 'saving'}
                      className="flex items-center space-x-2 px-4 py-2 bg-brand-accent text-brand-dark rounded-md hover:bg-yellow-400 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;