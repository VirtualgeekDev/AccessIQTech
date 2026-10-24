import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Integrations', href: '/integrations' },
    { name: 'Docs', href: '/docs' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-brand-dark shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Shield className="h-8 w-8 text-brand-accent" />
            <span className="text-white text-xl font-bold">AccessIQ Tech</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-accent'
                    : 'text-gray-300 hover:text-brand-accent'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user && user.email_verified ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-brand-accent transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-brand-accent transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">Account</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/billing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Billing
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : user && !user.email_verified ? (
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Please verify your email
                </div>
                <button
                  onClick={logout}
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-brand-accent text-brand-dark px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-400 transition-colors"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-brand-accent transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-accent'
                    : 'text-gray-300 hover:text-brand-accent'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {user && user.email_verified ? (
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="px-3 py-2 text-sm text-gray-300">
                  Signed in as {user.name}
                </div>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/billing"
                  className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Billing
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                >
                  Sign out
                </button>
              </div>
            ) : user && !user.email_verified ? (
              <div className="border-t border-gray-700 pt-3 mt-3 space-y-1">
                <div className="px-3 py-2 text-sm text-yellow-400">
                  Please verify your email to access your account
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-3 mt-3 space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-brand-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 text-base font-medium bg-brand-accent text-brand-dark rounded-md mx-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;