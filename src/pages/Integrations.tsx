import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Webhook, 
  Puzzle, 
  ArrowRight, 
  CheckCircle, 
  ExternalLink,
  Download,
  Settings,
  X
} from 'lucide-react';

const Integrations: React.FC = () => {
  const { integrations } = useSettings();
  const [showInstallModal, setShowInstallModal] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<any>(null);

  const webhookEvents = [
    'scan.completed',
    'scan.failed',
    'issue.detected',
    'compliance.changed',
    'subscription.updated'
  ];

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/scans',
      description: 'Initiate a new accessibility scan'
    },
    {
      method: 'GET',
      endpoint: '/api/scans/{id}',
      description: 'Retrieve scan results and status'
    },
    {
      method: 'GET',
      endpoint: '/api/reports',
      description: 'List all accessibility reports'
    },
    {
      method: 'POST',
      endpoint: '/api/webhooks',
      description: 'Configure webhook endpoints'
    }
  ];

  return (
    <div className="py-20 animate-fade-in">
      {/* Header */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Integrations &
            <span className="text-brand-accent block mt-2">Developer Tools</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connect AccessIQ Tech with your existing workflow and tools. 
            Build custom integrations with our comprehensive API.
          </p>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Integrations
            </h2>
            <p className="text-xl text-gray-600">
              Connect with the tools you already use
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={integration.logo}
                      alt={integration.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {integration.name}
                      </h3>
                      <span className="text-sm text-gray-500">{integration.category}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    integration.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {integration.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {integration.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {integration.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                      if (integration.status === 'Available') {
                        setSelectedIntegration(integration);
                        setShowInstallModal(true);
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      integration.status === 'Available'
                        ? 'bg-brand-accent text-brand-dark hover:bg-yellow-400'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={integration.status !== 'Available'}
                  >
                    {integration.status === 'Available' ? 'Connect' : 'Coming Soon'}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* API Overview */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Code className="h-8 w-8 text-brand-accent" />
                <h2 className="text-3xl font-bold text-gray-900">REST API</h2>
              </div>
              
              <p className="text-lg text-gray-700 mb-6">
                Build custom integrations with our comprehensive REST API. 
                Programmatically scan websites, retrieve reports, and manage your account.
              </p>
              
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-gray-900">Key Features</h3>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>RESTful design with JSON responses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>OAuth 2.0 and API key authentication</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Rate limiting and error handling</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Comprehensive documentation</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  disabled
                  className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center space-x-2 opacity-50"
                >
                  <span>View Documentation</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button 
                  disabled
                  className="border border-gray-300 text-gray-400 px-6 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center space-x-2 opacity-50"
                >
                  <Download className="h-5 w-5" />
                  <span>Download SDK</span>
                </button>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Coming Soon:</strong> API documentation and SDK downloads will be available in the next release.
                </p>
              </div>
            </div>
            
            {/* API Endpoints */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">API Endpoints</h3>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-mono rounded ${
                        endpoint.method === 'GET' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-800">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <p className="text-sm text-gray-600">
                      {endpoint.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Webhook className="h-8 w-8 text-brand-accent" />
                <h2 className="text-3xl font-bold text-gray-900">Webhooks</h2>
              </div>
              
              <p className="text-lg text-gray-700 mb-6">
                Stay informed about important events in real-time. Configure webhooks 
                to receive instant notifications when scans complete, issues are detected, 
                or compliance status changes.
              </p>
              
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-gray-900">Available Events</h3>
                <div className="grid grid-cols-1 gap-2">
                  {webhookEvents.map((event, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {event}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => alert('Configure Webhooks\n\nSet up real-time notifications for:\n• Scan completion\n• New accessibility issues\n• Compliance changes\n• Custom events\n\nWebhook configuration coming soon!')}
                className="bg-brand-accent text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>Configure Webhooks</span>
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm overflow-x-auto">
              <div className="mb-4 text-gray-400">// Example webhook payload</div>
              <pre>{`{
  "event": "scan.completed",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "scan_id": "scan_123456",
    "url": "https://example.com",
    "score": 87,
    "issues_found": 5,
    "status": "completed"
  }
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Integration CTA */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Puzzle className="h-16 w-16 text-brand-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Need a Custom Integration?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Our team can help you build custom integrations tailored to your specific 
            workflow and requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 text-center"
            >
              Contact Our Team
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-brand-accent text-brand-accent px-8 py-4 rounded-lg text-lg font-semibold hover:bg-brand-accent hover:text-black transition-all text-center"
            >
              View Enterprise Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Installation Modal */}
      {showInstallModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Connect {selectedIntegration.name}
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <img
                src={selectedIntegration.logo}
                alt={selectedIntegration.name}
                className="w-16 h-16 rounded-lg object-cover mx-auto"
              />
            </div>
            
            {/* Integration-specific configuration */}
            <div className="space-y-4 mb-6">
              {selectedIntegration.id === 'wordpress' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WordPress Site URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://yoursite.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      placeholder="admin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Password
                    </label>
                    <input
                      type="password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Generate an application password in WordPress Admin → Users → Profile
                    </p>
                  </div>
                </>
              )}
              
              {selectedIntegration.id === 'github' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Repository
                    </label>
                    <input
                      type="text"
                      placeholder="username/repository"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Access Token
                    </label>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Create a token with 'repo' and 'workflow' permissions
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Events
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Pull Requests</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Push to main branch</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Scheduled scans</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              
              {selectedIntegration.id === 'slack' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slack Workspace
                    </label>
                    <input
                      type="text"
                      placeholder="your-workspace"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Channel
                    </label>
                    <input
                      type="text"
                      placeholder="#accessibility-alerts"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Types
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">New critical issues</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Scan completion</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Weekly summaries</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Features included:</h4>
                {selectedIntegration.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Enhanced integration simulation
                  const integrationMessages = {
                    wordpress: `🎉 WordPress Plugin Connected Successfully!

✅ Plugin installed and activated
✅ API connection established
✅ Dashboard widget added

Next steps:
1. Visit your WordPress admin dashboard
2. Look for the "AccessIQ" menu item
3. Configure your scan preferences
4. Run your first automated scan

Your WordPress site will now be automatically scanned for accessibility issues!`,
                    
                    github: `🚀 GitHub Action Integration Complete!

✅ Workflow file created (.github/workflows/accessibility.yml)
✅ Repository permissions configured
✅ Action triggers set up

What happens next:
• Pull requests will be automatically scanned
• Accessibility reports posted as PR comments
• Build status updated based on scan results
• Team notifications sent for critical issues

Your next PR will include accessibility checks!`,
                    
                    slack: `💬 Slack Bot Connected Successfully!

✅ Bot installed in your workspace
✅ Channel permissions configured
✅ Alert preferences saved

Available commands:
• /accessiq scan [url] - Run instant scan
• /accessiq report [scan-id] - Get detailed report
• /accessiq status - Check monitoring status

You'll start receiving accessibility alerts in your chosen channel!`
                  };
                  
                  const message = integrationMessages[selectedIntegration.id as keyof typeof integrationMessages] || 
                    `✅ ${selectedIntegration.name} has been successfully connected!\n\nCheck your ${selectedIntegration.category.toLowerCase()} platform for the new AccessIQ Tech integration.`;
                  
                  alert(message);
                  setShowInstallModal(false);
                }}
                className="flex-1 bg-brand-accent text-brand-dark py-2 px-4 rounded-md font-medium hover:bg-yellow-400 transition-colors"
              >
                Connect Now
              </button>
              <button
                onClick={() => setShowInstallModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;