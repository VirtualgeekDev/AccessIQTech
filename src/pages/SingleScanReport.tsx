import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Keyboard,
  Type,
  Palette,
  FileText,
  ExternalLink,
  Zap,
  Loader
} from 'lucide-react';

interface ScanIssue {
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  wcag_criterion: string;
  element_count: number;
  fix_suggestion: string;
  elements?: Array<{
    selector: string;
    line: number;
    column: number;
  }>;
}

interface ScanReport {
  id: string;
  url: string;
  score: number;
  status: 'completed' | 'scanning' | 'failed';
  issues_found: number;
  scan_date: string;
  scan_duration: number;
  wcag_version: string;
  level: string;
  issues: ScanIssue[];
  summary: {
    total_issues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

const SingleScanReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'recommendations'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    // Fetch scan report from backend
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/scan_report?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Scan report not found');
          } else if (response.status === 401) {
            throw new Error('Please log in to view this report');
          } else {
            throw new Error(`Failed to fetch report: ${response.status}`);
          }
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch scan report');
        }

        setReport(data.report);
      } catch (error) {
        console.error('Failed to fetch scan report:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch scan report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, navigate]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'missing_alt_text':
        return <Eye className="h-5 w-5" />;
      case 'color_contrast':
        return <Palette className="h-5 w-5" />;
      case 'heading_structure':
        return <Type className="h-5 w-5" />;
      case 'keyboard_navigation':
        return <Keyboard className="h-5 w-5" />;
      case 'form_labels':
        return <FileText className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const handleRescan = () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);
    
    // Trigger new scan
    fetch('/api/scan', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: report.url }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Redirect to new scan report
        navigate(`/dashboard/scan/${data.scan_id}`);
      } else {
        setError(data.error || 'Failed to start new scan');
      }
    })
    .catch(error => {
      setError('Failed to start new scan');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleDownloadReport = () => {
    if (!report) return;
    
    const reportData = {
      url: report.url,
      score: report.score,
      scan_date: report.scan_date,
      issues: report.issues,
      recommendations: report.recommendations
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyFix = async (issueType: string, issueIndex: number) => {
    const issueKey = `${issueType}_${issueIndex}`;
    setFixingIssues(prev => new Set(prev).add(issueKey));
    
    try {
      const response = await fetch('/api/scan/apply-fix', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scan_id: id,
          issue_type: issueType,
          issue_index: issueIndex
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFixedIssues(prev => new Set(prev).add(issueKey));
        // Show detailed success message with AI fix details
        const successMessage = `
✅ ${data.message}

📊 Estimated Improvement: ${data.estimated_improvement}
🔧 ${data.fix_description}

⚡ Processing Time: ${data.processing_time || 'N/A'}
🎯 Confidence: ${data.confidence_score || 'N/A'}
        `.trim();
        
        alert(successMessage);
      } else {
        // Show detailed failure message
        const failureMessage = data.description || data.error || 'Failed to apply AI fix';
        let alertMessage = `❌ ${failureMessage}`;
        
        if (data.manual_steps && data.manual_steps.length > 0) {
          alertMessage += '\n\n📋 Manual Steps Required:\n' + data.manual_steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
        }
        
        alert(alertMessage);
      }
    } catch (error) {
      console.error('Failed to apply fix:', error);
      alert(error instanceof Error ? error.message : 'Failed to apply AI fix');
    } finally {
      setFixingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueKey);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!report) {
    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Report</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <Link
            to="/dashboard"
            className="bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-brand-accent hover:text-black mb-4 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Accessibility Report</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>{report.url}</span>
                <span>•</span>
                <span>{new Date(report.scan_date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{report.scan_duration}s scan time</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleRescan}
                className="flex items-center space-x-2 bg-brand-accent text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-400 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Rescan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(report.score)} mb-2`}>
                {report.score}%
              </div>
              <div className="text-gray-600">Accessibility Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">{report.issues_found}</div>
              <div className="text-gray-600">Issues Found</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">WCAG {report.wcag_version}</div>
              <div className="text-gray-600">Level {report.level}</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center space-x-4">
                {report.status === 'completed' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="text-gray-600 capitalize">{report.status}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'issues', name: 'Issues' },
                { id: 'recommendations', name: 'Recommendations' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
                    <div className="text-red-800 text-sm">Critical</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{report.summary.high}</div>
                    <div className="text-orange-800 text-sm">High</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{report.summary.medium}</div>
                    <div className="text-yellow-800 text-sm">Medium</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.summary.low}</div>
                    <div className="text-blue-800 text-sm">Low</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">URL Scanned:</span>
                      <span className="ml-2 text-gray-600">{report.url}</span>
                    </div>
                    <div>
                      <span className="font-medium">Scan Duration:</span>
                      <span className="ml-2 text-gray-600">{report.scan_duration} seconds</span>
                    </div>
                    <div>
                      <span className="font-medium">WCAG Version:</span>
                      <span className="ml-2 text-gray-600">{report.wcag_version}</span>
                    </div>
                    <div>
                      <span className="font-medium">Compliance Level:</span>
                      <span className="ml-2 text-gray-600">Level {report.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                {report.issues.map((issue, index) => (
                  <div key={index} className={`border rounded-lg p-6 ${
                    fixedIssues.has(`${issue.type}_${index}`) 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
                          {getIssueIcon(issue.type)}
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            fixedIssues.has(`${issue.type}_${index}`) 
                              ? 'text-green-800 line-through' 
                              : 'text-gray-900'
                          }`}>{issue.title}</h3>
                          <p className="text-gray-600">{issue.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!fixedIssues.has(`${issue.type}_${index}`) && (
                          <button
                            onClick={() => handleApplyFix(issue.type, index)}
                            disabled={fixingIssues.has(`${issue.type}_${index}`)}
                            className="flex items-center space-x-2 bg-brand-accent text-brand-dark px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {fixingIssues.has(`${issue.type}_${index}`) ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span>Fixing...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4" />
                                <span>AI Fix</span>
                              </>
                            )}
                          </button>
                        )}
                        {fixedIssues.has(`${issue.type}_${index}`) && (
                          <span className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>Fixed</span>
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">WCAG {issue.wcag_criterion}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Recommended Fix:</h4>
                      <p className="text-gray-700">{issue.fix_suggestion}</p>
                    </div>
                    
                    {issue.elements && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Affected Elements ({issue.element_count}):
                        </h4>
                        <div className="space-y-2">
                          {issue.elements.map((element, elemIndex) => (
                            <div key={elemIndex} className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                              <code className="text-gray-800">{element.selector}</code>
                              <span className="text-gray-500">Line {element.line}, Col {element.column}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Priority Actions</h3>
                  <p className="text-blue-800">
                    Based on your scan results, here are the most important accessibility improvements 
                    to implement for better compliance and user experience.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-brand-accent text-black rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                  <p className="text-gray-600 mb-4">
                    Our accessibility experts can help you implement these recommendations and achieve full compliance.
                  </p>
                  <Link
                    to="/contact"
                    className="flex items-center space-x-2 text-brand-accent hover:text-black font-medium"
                  >
                    <span>Contact Support</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleScanReport;