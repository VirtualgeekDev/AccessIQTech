import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle,
  HelpCircle,
  Users,
  CheckCircle
} from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Handle validation errors
          const errorMessages = Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to send message');
      }

      if (data.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6 text-brand-accent" />,
      title: 'Email Support',
      description: 'Get help from our support team',
      contact: 'support@accessiqtech.net',
      availability: '24/7 response within 4 hours'
    },
    {
      icon: <Phone className="h-6 w-6 text-brand-accent" />,
      title: 'Phone Support',
      description: 'Speak directly with our experts',
      contact: '+447877382559',
      availability: 'Mon-Fri, 9 AM - 6 PM PST'
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-brand-accent" />,
      title: 'Live Chat',
      description: 'Instant help when you need it',
      contact: 'Available in dashboard',
      availability: 'Mon-Fri, 9 AM - 6 PM PST'
    }
  ];

  const officeLocations = [
    {
      city: 'London',
      address: '7 Coronation Road, Dephna House',
      zipCode: 'London, United Kingdom, NW10 7PQ',
      phone: '+447877382559'
    }
  ];

  const faqs = [
    {
      question: 'How quickly can I get started?',
      answer: 'You can start scanning your website immediately after signing up. Our 14-day free trial gives you full access to all features.'
    },
    {
      question: 'Do you offer custom enterprise solutions?',
      answer: 'Yes! We provide white-label solutions, custom integrations, and dedicated support for enterprise customers.'
    },
    {
      question: 'What accessibility standards do you support?',
      answer: 'We support WCAG 2.1 Level AA and AAA standards, Section 508, and ADA compliance requirements.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Absolutely. You can cancel your subscription at any time with no cancellation fees or penalties.'
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                name: '',
                email: '',
                company: '',
                subject: 'General Inquiry',
                message: ''
              });
            }}
            className="bg-brand-accent text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 animate-fade-in">
      {/* Header */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get in
            <span className="text-brand-accent block mt-2">Touch</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Have questions about AccessIQ Tech? Need help with accessibility compliance? 
            Our team of experts is here to help.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Can We Help?
            </h2>
            <p className="text-xl text-gray-600">
              Choose the best way to reach our team
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {method.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {method.description}
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-brand-accent">
                    {method.contact}
                  </p>
                  <p className="text-sm text-gray-500">
                    {method.availability}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Send Us a Message
              </h2>
              <p className="text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    placeholder="Enter your company name"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Sales Question">Sales Question</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Tell us how we can help you..."
                />
              </div>
              
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Offices
            </h2>
            <p className="text-xl text-gray-600">
              Visit us at one of our locations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {officeLocations.map((office, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200">
                <MapPin className="h-8 w-8 text-brand-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {office.city}
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>{office.address}</p>
                  <p>{office.zipCode}</p>
                  <p className="font-medium text-brand-accent">{office.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <HelpCircle className="h-12 w-12 text-brand-accent mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for?
            </p>
            <Link 
              to="/docs"
              className="text-brand-accent hover:text-yellow-600 font-medium"
            >
              View All FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Clock className="h-12 w-12 text-brand-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            We're Here When You Need Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Support Hours</h3>
              <div className="space-y-2">
                <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Emergency Support</h3>
              <div className="space-y-2">
                <p>Critical issues: 24/7 response</p>
                <p>Enterprise customers: Priority support</p>
                <p>Phone: +447877382559</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;