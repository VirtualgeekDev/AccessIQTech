import React, { useState } from 'react';
import { 
  Book, 
  Code, 
  Zap, 
  Settings, 
  HelpCircle, 
  ArrowRight,
  Search,
  ExternalLink,
  Download,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Docs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Getting Started');

  const categories = [
    'Getting Started',
    'API Reference',
    'Integrations',
    'Webhooks',
    'SDKs',
    'Troubleshooting'
  ];

  const documentation = {
    'Getting Started': [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running with AccessIQ Tech in 5 minutes',
        type: 'guide',
        readTime: '5 min',
        link: '#',
        status: 'available'
      },
      {
        title: 'Understanding WCAG 2.1',
        description: 'Learn about Web Content Accessibility Guidelines',
        type: 'guide',
        readTime: '10 min',
        link: '#',
        status: 'available'
      },
      {
        title: 'Your First Scan',
        description: 'Step-by-step tutorial for scanning your website',
        type: 'tutorial',
        readTime: '8 min',
        link: '#',
        status: 'available'
      },
      {
        title: 'Interpreting Results',
        description: 'How to read and understand accessibility reports',
        type: 'guide',
        readTime: '12 min',
        link: '#',
        status: 'available'
      }
    ],
    'API Reference': [
      {
        title: 'Authentication',
        description: 'API key and OAuth 2.0 authentication methods',
        type: 'reference',
        readTime: '3 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Scans Endpoint',
        description: 'Create, retrieve, and manage accessibility scans',
        type: 'reference',
        readTime: '6 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Reports Endpoint',
        description: 'Access detailed accessibility reports and data',
        type: 'reference',
        readTime: '4 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Rate Limits',
        description: 'Understanding API rate limiting and best practices',
        type: 'reference',
        readTime: '2 min',
        link: '#',
        status: 'coming_soon'
      }
    ],
    'Integrations': [
      {
        title: 'WordPress Plugin',
        description: 'Install and configure the WordPress plugin',
        type: 'tutorial',
        readTime: '7 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'GitHub Actions',
        description: 'Integrate accessibility testing into your CI/CD',
        type: 'tutorial',
        readTime: '10 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Slack Integration',
        description: 'Get accessibility alerts in your Slack channels',
        type: 'tutorial',
        readTime: '5 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Custom Integrations',
        description: 'Build your own integrations using our API',
        type: 'guide',
        readTime: '15 min',
        link: '#',
        status: 'coming_soon'
      }
    ],
    'Webhooks': [
      {
        title: 'Webhook Setup',
        description: 'Configure webhooks for real-time notifications',
        type: 'tutorial',
        readTime: '6 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Event Types',
        description: 'Complete list of webhook events and payloads',
        type: 'reference',
        readTime: '4 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Security',
        description: 'Webhook signature verification and security',
        type: 'guide',
        readTime: '5 min',
        link: '#',
        status: 'coming_soon'
      }
    ],
    'SDKs': [
      {
        title: 'JavaScript SDK',
        description: 'Official JavaScript/Node.js SDK documentation',
        type: 'reference',
        readTime: '8 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Python SDK',
        description: 'Official Python SDK documentation',
        type: 'reference',
        readTime: '8 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'PHP SDK',
        description: 'Official PHP SDK documentation',
        type: 'reference',
        readTime: '8 min',
        link: '#',
        status: 'coming_soon'
      }
    ],
    'Troubleshooting': [
      {
        title: 'Common Issues',
        description: 'Solutions to frequently encountered problems',
        type: 'guide',
        readTime: '10 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Error Codes',
        description: 'Complete reference of API error codes',
        type: 'reference',
        readTime: '5 min',
        link: '#',
        status: 'coming_soon'
      },
      {
        title: 'Performance Tips',
        description: 'Optimize your accessibility scanning workflow',
        type: 'guide',
        readTime: '7 min',
        link: '#',
        status: 'coming_soon'
      }
    ]
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'reference':
        return <Book className="h-4 w-4 text-blue-500" />;
      case 'guide':
        return <HelpCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Book className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tutorial':
        return 'bg-green-100 text-green-800';
      case 'reference':
        return 'bg-blue-100 text-blue-800';
      case 'guide':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocs = documentation[activeCategory as keyof typeof documentation]?.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="py-20 animate-fade-in">
      {/* Header */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Documentation &
            <span className="text-brand-accent block mt-2">Developer Guide</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Everything you need to integrate AccessIQ Tech into your workflow. 
            From quick start guides to comprehensive API documentation.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <Zap className="h-8 w-8 text-brand-accent mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Start</h3>
              <p className="text-gray-600 text-sm mb-4">Get started in minutes</p>
              <button 
                onClick={() => alert('Quick Start Guide\n\nStep-by-step guide to get you up and running with AccessIQ Tech in 5 minutes.\n\nDocumentation coming soon!')}
                className="text-brand-accent hover:text-yellow-600 font-medium text-sm flex items-center space-x-1"
              >
                <span>Start Here</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <Code className="h-8 w-8 text-brand-accent mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Reference</h3>
              <p className="text-gray-600 text-sm mb-4">Complete API documentation</p>
              <button 
                onClick={() => alert('API Reference\n\nComprehensive API documentation with endpoints, authentication, and examples.\n\nDocumentation coming soon!')}
                className="text-brand-accent hover:text-yellow-600 font-medium text-sm flex items-center space-x-1"
              >
                <span>View API</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <Settings className="h-8 w-8 text-brand-accent mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integrations</h3>
              <p className="text-gray-600 text-sm mb-4">Connect with your tools</p>
              <Link
                to="/integrations"
                className="text-brand-accent hover:text-yellow-600 font-medium text-sm flex items-center space-x-1"
              >
                <span>Browse</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <Download className="h-8 w-8 text-brand-accent mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SDKs</h3>
              <p className="text-gray-600 text-sm mb-4">Official client libraries</p>
              <button 
                onClick={() => alert('Download SDKs\n\nOfficial client libraries for JavaScript, Python, PHP, and more.\n\nSDKs coming soon!')}
                className="text-brand-accent hover:text-yellow-600 font-medium text-sm flex items-center space-x-1"
              >
                <span>Download</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Documentation */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <nav className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeCategory === category
                          ? 'bg-brand-accent text-brand-dark'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{activeCategory}</h2>
                <p className="text-gray-600">
                  {activeCategory === 'Getting Started' && 'Learn the basics and get up to speed quickly'}
                  {activeCategory === 'API Reference' && 'Complete API documentation and reference'}
                  {activeCategory === 'Integrations' && 'Connect with your existing tools and workflow'}
                  {activeCategory === 'Webhooks' && 'Set up real-time notifications and event handling'}
                  {activeCategory === 'SDKs' && 'Official client libraries for popular programming languages'}
                  {activeCategory === 'Troubleshooting' && 'Solutions to common problems and issues'}
                </p>
              </div>
              <div className="space-y-4">
                {filteredDocs.map((doc, index) => (
                  <div key={index} className={`bg-gray-50 rounded-lg p-6 transition-shadow ${
                    doc.status === 'coming_soon' ? 'opacity-75' : 'hover:shadow-md'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center space-x-3 mb-2">
                          {getTypeIcon(doc.type)}
                          <h3 className={`text-lg font-semibold ${
                            doc.status === 'coming_soon' ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {doc.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}>
                            {doc.type}
                          </span>
                          {doc.status === 'coming_soon' && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className={`mb-3 ${
                          doc.status === 'coming_soon' ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {doc.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{doc.readTime}</span>
                        </div>
                      </div>
                      {doc.status !== 'coming_soon' ? (
                        <button className="ml-4 text-brand-accent hover:text-yellow-600">
                          <ExternalLink className="h-5 w-5" />
                        </button>
                      ) : (
                        <div className="ml-4 text-gray-400 cursor-not-allowed">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {filteredDocs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No documentation found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <HelpCircle className="h-16 w-16 text-brand-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Need More Help?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 text-center"
            >
              Contact Support
            </Link>
            <button 
              onClick={() => alert('Join Our Community\n\nConnect with developers, accessibility experts, and other AccessIQ Tech users.\n\nCommunity platform coming soon!')}
              className="border-2 border-brand-accent text-brand-accent px-8 py-4 rounded-lg text-lg font-semibold hover:bg-brand-accent hover:text-brand-dark transition-all"
            >
              Join Community
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Docs;