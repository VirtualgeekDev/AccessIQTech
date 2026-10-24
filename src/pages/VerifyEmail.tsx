import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/backend/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email has been successfully verified! You can now log in.');
        } else {
          const errorMsg = data.error || 'Verification failed';
          if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
            setStatus('expired');
            setMessage('This verification link has expired or is invalid. Please request a new one.');
          } else {
            setStatus('error');
            setMessage(errorMsg);
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    try {
      // This would need to be implemented in the backend
      const response = await fetch('/backend/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        alert('A new verification email has been sent.');
      } else {
        alert('Failed to resend verification email. Please try again later.');
      }
    } catch (error) {
      alert('Failed to resend verification email. Please try again later.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent mx-auto"></div>;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-700';
      case 'error':
      case 'expired':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {getStatusIcon()}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'verifying' && 'Verifying Your Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
          {status === 'expired' && 'Link Expired'}
        </h1>

        <p className={`mb-8 ${getStatusColor()}`}>
          {message}
        </p>

        <div className="space-y-4">
          {status === 'success' && (
            <Link
              to="/dashboard"
              className="w-full bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}

          {(status === 'error' || status === 'expired') && (
            <button 
              onClick={handleResendVerification}
              className="w-full bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2"
            >
              <Mail className="h-5 w-5" />
              <span>Resend Verification Email</span>
            </button>
          )}

          <Link
            to="/"
            className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {status === 'success' && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Access your dashboard and start scanning websites</li>
              <li>• Explore all accessibility features</li>
              <li>• Your 14-day free trial is now active</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;