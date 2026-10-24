import React from 'react';
import { 
  Zap, 
  Eye, 
  FileText, 
  BarChart3, 
  Shield, 
  Clock, 
  Code, 
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Zap className="h-12 w-12 text-brand-accent" />,
      title: 'AI-Powered Scanning',
      description: 'Our advanced AI engine scans your entire website in minutes, identifying accessibility issues with 99.9% accuracy.',
      details: [
        'Scans all pages automatically',
        'Machine learning algorithms',
        'Real-time issue detection',
        'Contextual understanding'
      ]
    },
    {
      icon: <Eye className="h-12 w-12 text-brand-accent" />,
      title: 'Intelligent Contrast Analysis',
      description: 'Automatically detect color contrast violations and get instant suggestions for WCAG-compliant alternatives.',
      details: [
        'WCAG 2.1 AA/AAA compliance',
        'Color palette suggestions',
        'Background/foreground analysis',
        'Visual contrast simulator'
      ]
    },
    {
      icon: <FileText className="h-12 w-12 text-brand-accent" />,
      title: 'Smart Alt-Text Generation',
      description: 'AI analyzes images and generates contextually appropriate alt-text for improved screen reader accessibility.',
      details: [
        'Context-aware descriptions',
        'Decorative image detection',
        'Complex image analysis',
        'Bulk alt-text generation'
      ]
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-brand-accent" />,
      title: 'Comprehensive Reporting',
      description: 'Generate detailed compliance reports with actionable insights and progress tracking over time.',
      details: [
        'Executive summaries',
        'Technical detail reports',
        'Progress tracking',
        'Multiple export formats'
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Shield className="h-8 w-8 text-brand-accent" />,
      title: 'WCAG 2.1 Compliance',
      description: 'Full coverage of Web Content Accessibility Guidelines 2.1 Level AA and AAA requirements.'
    },
    {
      icon: <Clock className="h-8 w-8 text-brand-accent" />,
      title: 'Real-time Monitoring',
      description: 'Continuous monitoring of your website with instant alerts when new issues are detected.'
    },
    {
      icon: <Code className="h-8 w-8 text-brand-accent" />,
      title: 'Developer API',
      description: 'Integrate accessibility scanning into your development workflow with our robust REST API.'
    },
    {
      icon: <Users className="h-8 w-8 text-brand-accent" />,
      title: 'Team Collaboration',
      description: 'Share reports, assign tasks, and track progress across your entire development team.'
    }
  ];

  return (
    <div className="py-20 animate-fade-in">
      {/* Header - FIXED: Dark background with white/golden text */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <span className="text-brand-accent block mt-2">Web Accessibility</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to make your website accessible, compliant, and inclusive. 
            Powered by cutting-edge AI technology.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-xl group-hover:bg-brand-accent group-hover:text-brand-dark transition-all">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600">
              Interactive demo of our accessibility scanning results
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mock Scan Results */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Scan Results</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-800">Missing Alt Text</p>
                        <p className="text-sm text-red-600">12 images without alt attributes</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('AI Fix Applied!\n\n✅ Generated descriptive alt text for 12 images\n📈 Accessibility score improved by +15 points\n⚡ Processing time: 2.3 seconds\n\nThis is a demo of our AI-powered fix system.')}
                      className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700"
                    >
                      Fix Now
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-yellow-800">Contrast Issues</p>
                        <p className="text-sm text-yellow-600">3 elements below 4.5:1 ratio</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('AI Fix Applied!\n\n✅ Optimized color contrast ratios\n📈 Accessibility score improved by +12 points\n🎨 Updated 3 color combinations\n⚡ Processing time: 1.8 seconds\n\nThis is a demo of our AI-powered fix system.')}
                      className="text-xs bg-yellow-600 text-white px-3 py-1 rounded-full hover:bg-yellow-700"
                    >
                      Fix Now
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-800">Keyboard Navigation</p>
                        <p className="text-sm text-green-600">All elements accessible</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">
                      Passed
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Score Overview */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Accessibility Score</h3>
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#ECB53A"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset="75.36"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">72%</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">Overall Accessibility Score</p>
                  <div className="text-sm text-gray-500">
                    <p>✓ 45 tests passed</p>
                    <p>⚠ 8 warnings</p>
                    <p>✗ 15 errors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Additional tools and features to streamline your accessibility workflow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover-scale bg-gray-50">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;