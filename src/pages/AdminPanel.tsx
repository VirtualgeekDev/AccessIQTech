import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Mail, 
  Shield,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    email_verified: false
  });
  const [userFormErrors, setUserFormErrors] = useState<{[key: string]: string}>({});
  const [userFormSaving, setUserFormSaving] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showUserConfirmPassword, setShowUserConfirmPassword] = useState(false);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    encryption_key: '',
    session_lifetime: '7200',
    csrf_token_lifetime: '3600',
    max_login_attempts: '5',
    lockout_duration: '900',
    password_min_length: '8',
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    api_rate_limit: '100',
    api_rate_window: '3600',
    enable_2fa: false,
    backup_retention_days: '30',
    log_retention_days: '90',
    security_notifications: true
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySaveStatus, setSecuritySaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityLogsLoading, setSecurityLogsLoading] = useState(false);

  // Settings state
  const [paymentSettings, setPaymentSettings] = useState({
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    paypal_enabled: false,
    paypal_client_id: '',
    paypal_secret: '',
    paypal_webhook_id: '',
    payment_required: true
  });

  const [emailSettings, setEmailSettings] = useState({
    smtp_host: 'smtp.hostinger.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    support_email: 'support@accessiqtech.net'
  });

  const [generalSettings, setGeneralSettings] = useState({
    site_name: 'AccessIQ Tech',
    trial_length_days: 8,
    google_analytics_id: '',
    sentry_dsn: ''
  });

  const [analytics, setAnalytics] = useState({
    mrr: 0,
    active_users: 0,
    trial_conversions: 0,
    churn_rate: 0
  });

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'payments', name: 'Payment Settings', icon: CreditCard },
    { id: 'email', name: 'Email Settings', icon: Mail },
    { id: 'general', name: 'General Settings', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAnalytics();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'security') {
      fetchSecuritySettings();
      fetchSecurityLogs();
    } else if (activeTab === 'payments') {
      fetchPaymentSettings();
    } else if (activeTab === 'email') {
      fetchEmailSettings();
    } else if (activeTab === 'general') {
      fetchGeneralSettings();
    }
  }, [activeTab]);

  // Fetch users when search, filter, or pagination changes
  useEffect(() => {
    if (activeTab === 'users') {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300); // Debounce search
      
      return () => clearTimeout(timeoutId);
    }
  }, [usersSearch, usersRoleFilter, usersPagination.page]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    
    try {
      const params = new URLSearchParams({
        page: usersPagination.page.toString(),
        limit: usersPagination.limit.toString()
      });
      
      if (usersSearch) {
        params.append('search', usersSearch);
      }
      
      if (usersRoleFilter) {
        params.append('role', usersRoleFilter);
      }
      
      const response = await fetch(`/api/users?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setUsersPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsersError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});
    
    // Validate form
    const errors: {[key: string]: string} = {};
    
    if (!userFormData.name.trim() || userFormData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!editingUser) {
      // New user - password required
      if (!userFormData.password || userFormData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      
      if (userFormData.password !== userFormData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (userFormData.password) {
      // Editing user - password optional but must be valid if provided
      if (userFormData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      
      if (userFormData.password !== userFormData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }
    
    setUserFormSaving(true);
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const requestData: any = {
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        email_verified: userFormData.email_verified
      };
      
      // Only include password if provided
      if (userFormData.password) {
        requestData.password = userFormData.password;
      }
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setUserFormErrors(data.errors);
          return;
        }
        throw new Error(data.error || 'Failed to save user');
      }

      if (data.success) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserFormData({
          name: '',
          email: '',
          role: 'user',
          password: '',
          confirmPassword: '',
          email_verified: false
        });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('User form error:', error);
      setUserFormErrors({ general: error instanceof Error ? error.message : 'Failed to save user' });
    } finally {
      setUserFormSaving(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: '',
      email_verified: user.email_verified
    });
    setUserFormErrors({});
    setShowUserModal(true);
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.email})? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      if (data.success) {
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      role: 'user',
      password: '',
      confirmPassword: '',
      email_verified: false
    });
    setUserFormErrors({});
    setShowUserModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchSecuritySettings = async () => {
    setSecurityLoading(true);
    setSecurityError(null);
    
    try {
      const response = await fetch('/api/settings/security', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch security settings: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const settings = data.settings || {};
        setSecuritySettings(prev => ({
          ...prev,
          encryption_key: settings.encryption_key?.value || '',
          session_lifetime: settings.session_lifetime?.value || '7200',
          csrf_token_lifetime: settings.csrf_token_lifetime?.value || '3600',
          max_login_attempts: settings.max_login_attempts?.value || '5',
          lockout_duration: settings.lockout_duration?.value || '900',
          password_min_length: settings.password_min_length?.value || '8',
          password_require_uppercase: settings.password_require_uppercase?.value || true,
          password_require_lowercase: settings.password_require_lowercase?.value || true,
          password_require_numbers: settings.password_require_numbers?.value || true,
          password_require_symbols: settings.password_require_symbols?.value || false,
          api_rate_limit: settings.api_rate_limit?.value || '100',
          api_rate_window: settings.api_rate_window?.value || '3600',
          enable_2fa: settings.enable_2fa?.value || false,
          backup_retention_days: settings.backup_retention_days?.value || '30',
          log_retention_days: settings.log_retention_days?.value || '90',
          security_notifications: settings.security_notifications?.value || true
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch security settings');
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
      setSecurityError(error instanceof Error ? error.message : 'Failed to fetch security settings');
    } finally {
      setSecurityLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    setSecurityLogsLoading(true);
    
    try {
      const response = await fetch('/api/admin/security-logs', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSecurityLogs(data.logs || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
    } finally {
      setSecurityLogsLoading(false);
    }
  };

  const handleSecuritySettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySaveStatus('saving');
    setSecurityError(null);
    
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securitySettings)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to update security settings');
      }

      if (data.success) {
        setSecuritySaveStatus('saved');
      } else {
        throw new Error(data.error || 'Failed to update security settings');
      }
    } catch (error) {
      console.error('Security settings error:', error);
      setSecurityError(error instanceof Error ? error.message : 'Failed to update security settings');
      setSecuritySaveStatus('error');
    }
    
    // Reset status after delay
    setTimeout(() => {
      setSecuritySaveStatus('idle');
      setSecurityError(null);
    }, 3000);
  };

  const generateNewEncryptionKey = () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSecuritySettings(prev => ({ ...prev, encryption_key: key }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchPaymentSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/payment', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const settings = {};
          Object.keys(data.settings).forEach(key => {
            settings[key] = data.settings[key].value;
          });
          setPaymentSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/email', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const settings = {};
          Object.keys(data.settings).forEach(key => {
            settings[key] = data.settings[key].value;
          });
          setEmailSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/general', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const settings = {};
          Object.keys(data.settings).forEach(key => {
            settings[key] = data.settings[key].value;
          });
          setGeneralSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch general settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsData: any, category: string) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/settings/${category}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        alert(data.error || 'Failed to save settings');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
      alert('Failed to save settings');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const testConnection = async (service: 'stripe' | 'paypal' | 'email') => {
    setTestResults(prev => ({ ...prev, [service]: { testing: true } }));
    
    try {
      let endpoint = '';
      switch (service) {
        case 'stripe':
          endpoint = '/api/settings?test=stripe';
          break;
        case 'paypal':
          endpoint = '/api/settings?test=paypal';
          break;
        case 'email':
          endpoint = '/api/settings?test=email';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      setTestResults(prev => ({ 
        ...prev, 
        [service]: { 
          testing: false, 
          success: data.success, 
          message: data.message || data.error 
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [service]: { 
          testing: false, 
          success: false, 
          message: 'Connection test failed' 
        } 
      }));
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const generateWebhookUrl = (provider: 'stripe' | 'paypal') => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/${provider}.php`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage your AccessIQ Tech platform</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${analytics.mrr.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.active_users}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trial Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.trial_conversions}%</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.churn_rate}%</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => testConnection('stripe')}
                  className="flex items-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <span>Test Stripe Connection</span>
                </button>
                
                <button
                  onClick={() => testConnection('paypal')}
                  className="flex items-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <span>Test PayPal Connection</span>
                </button>
                
                <button
                  onClick={() => testConnection('email')}
                  className="flex items-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Mail className="h-5 w-5 text-green-600" />
                  <span>Test Email Configuration</span>
                </button>
              </div>
              
              {/* Test Results */}
              {Object.keys(testResults).map(service => (
                <div key={service} className="mt-4">
                  {testResults[service].testing && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Testing {service}...</span>
                    </div>
                  )}
                  {!testResults[service].testing && testResults[service].success !== undefined && (
                    <div className={`flex items-center space-x-2 ${
                      testResults[service].success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResults[service].success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>{testResults[service].message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-8">
            {/* Stripe Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Stripe Configuration</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="stripe_enabled"
                    checked={paymentSettings.stripe_enabled}
                    onChange={(e) => setPaymentSettings(prev => ({ 
                      ...prev, 
                      stripe_enabled: e.target.checked 
                    }))}
                    className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                  />
                  <label htmlFor="stripe_enabled" className="text-sm font-medium text-gray-700">
                    Enable Stripe
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publishable Key
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.stripe_publishable_key}
                    onChange={(e) => setPaymentSettings(prev => ({ 
                      ...prev, 
                      stripe_publishable_key: e.target.value 
                    }))}
                    placeholder="pk_test_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.stripe_secret ? 'text' : 'password'}
                      value={paymentSettings.stripe_secret_key}
                      onChange={(e) => setPaymentSettings(prev => ({ 
                        ...prev, 
                        stripe_secret_key: e.target.value 
                      }))}
                      placeholder="sk_test_..."
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('stripe_secret')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.stripe_secret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.stripe_webhook ? 'text' : 'password'}
                      value={paymentSettings.stripe_webhook_secret}
                      onChange={(e) => setPaymentSettings(prev => ({ 
                        ...prev, 
                        stripe_webhook_secret: e.target.value 
                      }))}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('stripe_webhook')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.stripe_webhook ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generateWebhookUrl('stripe')}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                    <button
                      onClick={() => copyToClipboard(generateWebhookUrl('stripe'))}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add this URL to your Stripe webhook endpoints
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center space-x-4">
                <button
                  onClick={() => saveSettings(paymentSettings, 'payment')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Stripe Settings'}</span>
                </button>
                
                <button
                  onClick={() => testConnection('stripe')}
                  className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  <TestTube className="h-4 w-4" />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            {/* PayPal Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">PayPal Configuration</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="paypal_enabled"
                    checked={paymentSettings.paypal_enabled}
                    onChange={(e) => setPaymentSettings(prev => ({ 
                      ...prev, 
                      paypal_enabled: e.target.checked 
                    }))}
                    className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                  />
                  <label htmlFor="paypal_enabled" className="text-sm font-medium text-gray-700">
                    Enable PayPal
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.paypal_client_id}
                    onChange={(e) => setPaymentSettings(prev => ({ 
                      ...prev, 
                      paypal_client_id: e.target.value 
                    }))}
                    placeholder="AXxxx..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.paypal_secret ? 'text' : 'password'}
                      value={paymentSettings.paypal_secret}
                      onChange={(e) => setPaymentSettings(prev => ({ 
                        ...prev, 
                        paypal_secret: e.target.value 
                      }))}
                      placeholder="EXxxx..."
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('paypal_secret')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.paypal_secret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook ID
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.paypal_webhook_id}
                    onChange={(e) => setPaymentSettings(prev => ({ 
                      ...prev, 
                      paypal_webhook_id: e.target.value 
                    }))}
                    placeholder="5XX..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generateWebhookUrl('paypal')}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                    <button
                      onClick={() => copyToClipboard(generateWebhookUrl('paypal'))}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add this URL to your PayPal webhook endpoints
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center space-x-4">
                <button
                  onClick={() => saveSettings(paymentSettings, 'payment')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save PayPal Settings'}</span>
                </button>
                
                <button
                  onClick={() => testConnection('paypal')}
                  className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  <TestTube className="h-4 w-4" />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            {/* General Payment Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">General Payment Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Payment Required</h4>
                    <p className="text-sm text-gray-500">Require payment for subscriptions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.payment_required}
                      onChange={(e) => setPaymentSettings(prev => ({ 
                        ...prev, 
                        payment_required: e.target.checked 
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => saveSettings(paymentSettings, 'payment')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Payment Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">SMTP Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={emailSettings.smtp_host}
                  onChange={(e) => setEmailSettings(prev => ({ 
                    ...prev, 
                    smtp_host: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={emailSettings.smtp_port}
                  onChange={(e) => setEmailSettings(prev => ({ 
                    ...prev, 
                    smtp_port: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="email"
                  value={emailSettings.smtp_username}
                  onChange={(e) => setEmailSettings(prev => ({ 
                    ...prev, 
                    smtp_username: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.smtp_password ? 'text' : 'password'}
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings(prev => ({ 
                      ...prev, 
                      smtp_password: e.target.value 
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('smtp_password')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets.smtp_password ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encryption
                </label>
                <select
                  value={emailSettings.smtp_encryption}
                  onChange={(e) => setEmailSettings(prev => ({ 
                    ...prev, 
                    smtp_encryption: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={emailSettings.support_email}
                  onChange={(e) => setEmailSettings(prev => ({ 
                    ...prev, 
                    support_email: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={() => saveSettings(emailSettings, 'email')}
                disabled={saveStatus === 'saving'}
                className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Email Settings'}</span>
              </button>
              
              <button
                onClick={() => testConnection('email')}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                <span>Send Test Email</span>
              </button>
            </div>
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={generalSettings.site_name}
                  onChange={(e) => setGeneralSettings(prev => ({ 
                    ...prev, 
                    site_name: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trial Length (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={generalSettings.trial_length_days}
                  onChange={(e) => setGeneralSettings(prev => ({ 
                    ...prev, 
                    trial_length_days: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={generalSettings.google_analytics_id}
                  onChange={(e) => setGeneralSettings(prev => ({ 
                    ...prev, 
                    google_analytics_id: e.target.value 
                  }))}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentry DSN
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.sentry_dsn ? 'text' : 'password'}
                    value={generalSettings.sentry_dsn}
                    onChange={(e) => setGeneralSettings(prev => ({ 
                      ...prev, 
                      sentry_dsn: e.target.value 
                    }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('sentry_dsn')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets.sentry_dsn ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => saveSettings(generalSettings, 'general')}
                disabled={saveStatus === 'saving'}
                className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save General Settings'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Users Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">User Management</h2>
                <button
                  onClick={handleAddUser}
                  className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={usersRoleFilter}
                    onChange={(e) => setUsersRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              {/* Users Table */}
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                </div>
              ) : usersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{usersError}</p>
                  <button 
                    onClick={fetchUsers}
                    className="bg-brand-accent text-brand-dark px-4 py-2 rounded-md hover:bg-yellow-400"
                  >
                    Retry
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscription
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {user.email_verified ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {user.email_verified ? 'Verified' : 'Unverified'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                {user.subscription_status && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.subscription_status)}`}>
                                    {user.subscription_status}
                                  </span>
                                )}
                                {user.plan_name && (
                                  <div className="text-xs text-gray-500 mt-1">{user.plan_name}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-brand-accent hover:text-yellow-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((usersPagination.page - 1) * usersPagination.limit) + 1} to{' '}
                      {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} of{' '}
                      {usersPagination.total} users
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={usersPagination.page <= 1}
                        className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </button>
                      
                      <span className="text-sm text-gray-700">
                        Page {usersPagination.page} of {usersPagination.pages}
                      </span>
                      
                      <button
                        onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={usersPagination.page >= usersPagination.pages}
                        className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Settings Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Configuration</h2>
              
              {securityError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <span className="text-red-700 text-sm">{securityError}</span>
                </div>
              )}
              
              {securityLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                </div>
              ) : (
                <form onSubmit={handleSecuritySettingsSubmit} className="space-y-6">
                  {/* Encryption Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Encryption</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encryption Key
                        </label>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <input
                              type={showEncryptionKey ? 'text' : 'password'}
                              value={securitySettings.encryption_key}
                              onChange={(e) => setSecuritySettings(prev => ({ ...prev, encryption_key: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent font-mono text-sm"
                              placeholder="32-character encryption key"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showEncryptionKey ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={generateNewEncryptionKey}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Generate
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Used to encrypt sensitive data in the database. Changing this will invalidate existing encrypted data.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Session Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Lifetime (seconds)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.session_lifetime}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_lifetime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="300"
                          max="86400"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: 7200 (2 hours)</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CSRF Token Lifetime (seconds)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.csrf_token_lifetime}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, csrf_token_lifetime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="300"
                          max="7200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: 3600 (1 hour)</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Authentication Security */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          value={securitySettings.max_login_attempts}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="3"
                          max="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">Before account lockout</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lockout Duration (seconds)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.lockout_duration}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockout_duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="300"
                          max="3600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: 900 (15 minutes)</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password Policy */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Password Length
                        </label>
                        <input
                          type="number"
                          value={securitySettings.password_min_length}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_min_length: e.target.value }))}
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="6"
                          max="32"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.password_require_uppercase}
                              onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_require_uppercase: e.target.checked }))}
                              className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Require uppercase letters</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.password_require_lowercase}
                              onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_require_lowercase: e.target.checked }))}
                              className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Require lowercase letters</span>
                          </label>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.password_require_numbers}
                              onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_require_numbers: e.target.checked }))}
                              className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Require numbers</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.password_require_symbols}
                              onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_require_symbols: e.target.checked }))}
                              className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Require special characters</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* API Security */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">API Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Limit (requests)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.api_rate_limit}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, api_rate_limit: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="10"
                          max="1000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Per time window</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Window (seconds)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.api_rate_window}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, api_rate_window: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="60"
                          max="7200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: 3600 (1 hour)</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Advanced Security */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Security</h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securitySettings.enable_2fa}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, enable_2fa: e.target.checked }))}
                          className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securitySettings.security_notifications}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, security_notifications: e.target.checked }))}
                          className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Send security alert notifications</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Data Retention */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Data Retention</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Backup Retention (days)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.backup_retention_days}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, backup_retention_days: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="7"
                          max="365"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Log Retention (days)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.log_retention_days}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, log_retention_days: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                          min="30"
                          max="365"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {securitySaveStatus === 'saved' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-700 text-sm">Security settings saved successfully</span>
                        </>
                      )}
                      {securitySaveStatus === 'error' && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-red-700 text-sm">Failed to save security settings</span>
                        </>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={securitySaveStatus === 'saving'}
                      className="flex items-center space-x-2 px-4 py-2 bg-brand-accent text-brand-dark rounded-md hover:bg-yellow-400 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{securitySaveStatus === 'saving' ? 'Saving...' : 'Save Security Settings'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            {/* Security Logs */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
                <button
                  onClick={fetchSecurityLogs}
                  className="flex items-center space-x-2 text-brand-accent hover:text-yellow-600"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              {securityLogsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-accent"></div>
                </div>
              ) : securityLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No security events found</p>
              ) : (
                <div className="space-y-3">
                  {securityLogs.slice(0, 10).map((log, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{log.event}</div>
                        <div className="text-xs text-gray-500">{formatDate(log.created_at)}</div>
                        {log.details && (
                          <div className="text-xs text-gray-600 mt-1">
                            IP: {log.ip_address || 'unknown'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
              saveStatus === 'saved' ? 'bg-green-100 text-green-800' :
              saveStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {saveStatus === 'saving' && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saveStatus === 'saved' && <CheckCircle className="h-4 w-4" />}
              {saveStatus === 'error' && <XCircle className="h-4 w-4" />}
              <span>
                {saveStatus === 'saving' && 'Saving settings...'}
                {saveStatus === 'saved' && 'Settings saved successfully!'}
                {saveStatus === 'error' && 'Failed to save settings'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* User Form Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {userFormErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-red-700 text-sm">{userFormErrors.general}</span>
              </div>
            )}
            
            <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent ${
                    userFormErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                  required
                />
                {userFormErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{userFormErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent ${
                    userFormErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                  required
                />
                {userFormErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{userFormErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent ${
                      userFormErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showUserPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {userFormErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{userFormErrors.password}</p>
                )}
              </div>
              
              {userFormData.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showUserConfirmPassword ? 'text' : 'password'}
                      value={userFormData.confirmPassword}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent ${
                        userFormErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm password"
                      required={!!userFormData.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserConfirmPassword(!showUserConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showUserConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {userFormErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{userFormErrors.confirmPassword}</p>
                  )}
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email_verified"
                  checked={userFormData.email_verified}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, email_verified: e.target.checked }))}
                  className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                />
                <label htmlFor="email_verified" className="ml-2 block text-sm text-gray-700">
                  Email verified
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={userFormSaving}
                  className="flex-1 bg-brand-accent text-brand-dark py-2 px-4 rounded-md font-medium hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {userFormSaving ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;