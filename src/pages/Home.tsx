import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Eye, 
  FileText, 
  Star,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';

const Home: React.FC = () => {
  const benefits = [
    {
      icon: <Zap className="h-8 w-8 text-brand-accent" />,
      title: 'Automated Scans',
      description: 'AI-powered scanning identifies accessibility issues instantly across your entire website.'
    },
    {
      icon: <Eye className="h-8 w-8 text-brand-accent" />,
      title: 'Contrast Fixes',
      description: 'Automatically detect and suggest fixes for color contrast violations.'
    },
    {
      icon: <FileText className="h-8 w-8 text-brand-accent" />,
      title: 'Alt-Text Auto-Fix',
      description: 'AI generates appropriate alt-text for images missing accessibility descriptions.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-brand-accent" />,
      title: 'Report Exports',
      description: 'Comprehensive WCAG compliance reports in PDF, CSV, and API formats.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      company: 'TechCorp Inc.',
      quote: 'AccessIQ Tech saved us weeks of manual accessibility testing. The AI-powered fixes are incredibly accurate.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      company: 'Digital Solutions',
      quote: 'Finally, a tool that makes WCAG compliance achievable for our entire team. The reports are crystal clear.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      company: 'StartupLab',
      quote: 'The one-click fixes feature is a game-changer. We went from non-compliant to fully accessible in days.',
      rating: 5
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              One-Click AI
              <span className="text-brand-accent block">Web Accessibility</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Scan your website for ADA/WCAG compliance issues and get AI-powered fixes 
              with a single click. Make the web accessible for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 flex items-center space-x-2 shadow-brand"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/features"
                className="border-2 border-brand-accent text-brand-accent px-8 py-4 rounded-lg text-lg font-semibold hover:bg-brand-accent hover:text-gray-900 transition-all"
              >
                Learn More
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-4 text-gray-400">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>14-day free trial</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>No credit card required</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AccessIQ Tech?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform makes web accessibility compliance fast, 
              accurate, and affordable for businesses of all sizes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover-scale bg-gray-50"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-md">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Comprehensive Accessibility Testing
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our AI analyzes your website against WCAG 2.1 AA/AAA standards, 
                identifying issues and providing actionable solutions.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-brand-accent flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">WCAG 2.1 Compliance</h4>
                    <p className="text-gray-600">Full coverage of accessibility guidelines</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-brand-accent flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Monitoring</h4>
                    <p className="text-gray-600">Continuous scanning and alerts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-6 w-6 text-brand-accent flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Detailed Analytics</h4>
                    <p className="text-gray-600">Track progress and compliance scores</p>
                  </div>
                </div>
              </div>
              
              <Link
                to="/features"
                className="inline-flex items-center space-x-2 mt-8 text-brand-accent hover:text-yellow-600 font-semibold"
              >
                <span>Explore all features</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-lg shadow-2xl p-6 animate-float">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Accessibility Score</span>
                    <span className="text-2xl font-bold text-green-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Color Contrast</span>
                    <span className="text-sm font-medium text-green-600">✓ Passed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Alt Text</span>
                    <span className="text-sm font-medium text-green-600">✓ Passed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Keyboard Navigation</span>
                    <span className="text-sm font-medium text-yellow-600">⚠ Needs Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about AccessIQ Tech
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make Your Website Accessible?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of businesses already using AccessIQ Tech to ensure 
            their websites are accessible to everyone.
          </p>
          <Link
            to="/signup"
            className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 inline-flex items-center space-x-2 shadow-brand"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-gray-400 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;