import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-brand-accent mb-4">404</div>
          <div className="w-24 h-1 bg-brand-accent mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved, 
          deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Go Home</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Looking for something specific?
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link
              to="/features"
              className="text-brand-accent hover:text-black font-medium"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-brand-accent hover:text-black font-medium"
            >
              Pricing
            </Link>
            <Link
              to="/blog"
              className="text-brand-accent hover:text-black font-medium"
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className="text-brand-accent hover:text-black font-medium"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 text-blue-800">
            <Search className="h-5 w-5" />
            <span className="font-medium">Try searching our documentation</span>
          </div>
          <Link
            to="/docs"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
          >
            Browse Documentation →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;