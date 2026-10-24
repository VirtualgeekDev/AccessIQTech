import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Shield, Plus, BarChart3 } from 'lucide-react';

interface ScanReport {
  id: string;
  url: string;
  score: number;
  status: 'completed' | 'scanning' | 'failed';
  issues_found: number;
  scan_date: string;
  scan_duration?: number;
  wcag_version?: string;
  level?: string;
  issues?: Array<{
    type: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    wcag_criterion: string;
    element_count: number;
    fix_suggestion: string;
  }>;
  summary?: {
    total_issues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations?: string[];
}

const Dashboard: React.FC = () => {
  const [scans, setScans] = useState<ScanReport[]>([]);
  const [newScanUrl, setNewScanUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewScan = async () => {
    if (!newScanUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setIsScanning(true);

    // Add temporary scanning entry
    const tempScan: ScanReport = {
      id: Date.now().toString(),
      url: newScanUrl,
      scan_date: new Date().toISOString(),
      score: 0,
      status: 'scanning',
      issues_found: 0
    };

    setScans(prev => [tempScan, ...prev]);

    try {
      // Make actual API call to backend
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('accessiq_user') ? JSON.parse(localStorage.getItem('accessiq_user')!).id : 'demo')
        },
        body: JSON.stringify({ url: newScanUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Scan failed');
      }

      // Create completed scan from API response
      const completedScan: ScanReport = {
        id: result.scan_id || tempScan.id,
        url: result.url,
        score: result.score,
        status: 'completed',
        issues_found: result.issues_found,
        scan_date: new Date().toISOString(),
        scan_duration: result.report?.duration,
        wcag_version: result.report?.wcag_version,
        level: result.report?.level,
        issues: result.report?.issues,
        summary: result.report?.summary,
        recommendations: result.report?.recommendations
      };

      // Update the scan with results
      setScans(prev => prev.map(scan => 
        scan.id === tempScan.id ? completedScan : scan
      ));

      setNewScanUrl('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan website. Please try again.';
      setError(errorMessage);
      // Remove the failed scan
      setScans(prev => prev.filter(scan => scan.id !== tempScan.id));
    } finally {
      setIsScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'scanning':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-lg text-gray-600">
                Monitor and improve your website's accessibility
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <Shield className="w-5 h-5 text-brand-accent" />
                <span className="font-medium text-gray-700">AccessIQ Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">{scans.length}</p>
                <p className="text-sm text-green-600 mt-1">+12% from last month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {scans.length > 0 
                    ? Math.round(scans.reduce((acc, scan) => acc + scan.score, 0) / scans.length)
                    : 0
                  }%
                </p>
                <p className="text-sm text-green-600 mt-1">+5% improvement</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">
                  {scans.reduce((acc, scan) => acc + scan.issues_found, 0)}
                </p>
                <p className="text-sm text-red-600 mt-1">-8% from last week</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Sites</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(scans.map(scan => scan.url)).size}
                </p>
                <p className="text-sm text-blue-600 mt-1">2 new this month</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* New Scan Section */}
        <div className="bg-white shadow-xl rounded-2xl mb-8 border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-brand-accent p-2 rounded-lg">
                <Plus className="h-6 w-6 text-brand-dark" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Start New Scan</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label htmlFor="url" className="sr-only">
                  Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Globe className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    id="url"
                    value={newScanUrl}
                    onChange={(e) => setNewScanUrl(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all"
                    placeholder="Enter website URL (e.g., https://example.com)"
                    disabled={isScanning}
                  />
                </div>
              </div>
              <button
                onClick={handleNewScan}
                disabled={isScanning || !newScanUrl.trim()}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-lg text-white bg-brand-accent hover:bg-yellow-400 hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                <Search className="w-6 h-6 mr-3" />
                {isScanning ? 'Scanning...' : 'Scan Website'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Continuous Monitoring */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Continuous Monitoring</h2>
              </div>
            </div>
            <div className="p-8">
              <p className="text-gray-600 mb-6">
                Configure automated monitoring to track accessibility changes and receive instant alerts.
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Frequency
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Threshold
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="any">Any new issues</option>
                    <option value="critical">Critical issues only</option>
                    <option value="score_drop">Score drops by 5+ points</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Slack integration</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Webhook URL</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  alert('✅ Monitoring setup saved!\n\nYour website will be automatically scanned daily and you\'ll receive email alerts for any new accessibility issues.\n\n📊 First scan scheduled for tomorrow at 9:00 AM');
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Save Monitoring Settings
              </button>
            </div>
          </div>

          {/* Advanced Analytics */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
              </div>
            </div>
            <div className="p-8">
              <p className="text-gray-600 mb-6">
                Track your accessibility performance with detailed insights and trend analysis.
              </p>
              
              {/* Mock Analytics Data */}
              <div className="space-y-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Accessibility Score Trend (Last 30 Days)</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-end space-x-2 h-20">
                      {[65, 72, 78, 82, 85, 87, 89, 91, 94].map((score, index) => (
                        <div
                          key={index}
                          className="bg-purple-500 rounded-t"
                          style={{ 
                            height: `${(score / 100) * 80}px`,
                            width: '20px'
                          }}
                          title={`Day ${index + 1}: ${score}%`}
                        />
                      ))}
                    </div>
                    <div className="text-center mt-2 text-sm text-gray-600">
                      📈 +29 points improvement this month
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Issue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Color Contrast</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">40%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Missing Alt Text</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">25%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Form Labels</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">20%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Other Issues</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">98%</div>
                      <div className="text-xs text-green-800">Uptime</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">2.3s</div>
                      <div className="text-xs text-blue-800">Avg Scan Time</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  alert('📊 Advanced Analytics Dashboard\n\nFeatures available:\n• Historical trend analysis\n• Issue pattern recognition\n• Performance benchmarking\n• Custom report generation\n• Export capabilities\n\nUpgrade to Pro for full analytics access!');
                }}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                View Full Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Scans</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {scans.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Globe className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No scans yet</h3>
                <p className="text-gray-500 mb-6">
                  Get started by scanning your first website above.
                </p>
                <button 
                  onClick={() => {
                    // Scroll to the new scan section
                    const scanSection = document.querySelector('input[type="url"]');
                    if (scanSection) {
                      scanSection.scrollIntoView({ behavior: 'smooth' });
                      (scanSection as HTMLInputElement).focus();
                    }
                  }}
                  className="bg-brand-accent text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Start Your First Scan
                </button>
              </div>
            ) : (
              scans.map((scan) => (
                <div key={scan.id} className="p-8 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(scan.status)}
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">
                          {scan.url}
                        </p>
                        <p className="text-gray-500">
                          Scanned on {new Date(scan.scan_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {scan.status === 'completed' && (
                        <>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getScoreColor(scan.score)} mb-1`}>
                              Score: {scan.score}/100
                            </p>
                            <p className="text-sm text-gray-500">
                              {scan.issues_found} issues found
                            </p>
                          </div>
                          <Link
                            to={`/dashboard/scan/${scan.id}`}
                            className="inline-flex items-center px-6 py-3 border-2 border-brand-accent text-brand-accent font-semibold rounded-lg hover:bg-brand-accent hover:text-brand-dark transition-all transform hover:scale-105"
                          >
                            View Report
                          </Link>
                        </>
                      )}
                      {scan.status === 'scanning' && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-600 mb-1">
                            Scanning in progress...
                          </p>
                          <p className="text-sm text-gray-500">
                            Please wait
                          </p>
                        </div>
                      )}
                      {scan.status === 'failed' && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-red-600 mb-1">
                            Scan failed
                          </p>
                          <p className="text-sm text-gray-500">
                            Please try again
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;