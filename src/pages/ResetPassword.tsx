import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, Lock } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokenStatus, setTokenStatus] = useState<'validating' | 'valid' | 'invalid' | 'expired'>('validating');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/backend/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setTokenStatus('valid');
        } else {
          const errorMsg = data.error || 'Token validation failed';
          if (errorMsg.includes('expired')) {
            setTokenStatus('expired');
          } else {
            setTokenStatus('invalid');
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenStatus('invalid');
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/backend/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successful. Please log in with your new password.' }
          });
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenStatus === 'validating') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (tokenStatus === 'invalid' || tokenStatus === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {tokenStatus === 'expired' ? 'Link Expired' : 'Invalid Link'}
          </h1>
          <p className="text-red-700 mb-8">
            {tokenStatus === 'expired' 
              ? 'This password reset link has expired. Please request a new one.'
              : 'This password reset link is invalid. Please check your email for the correct link.'
            }
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Request New Reset Link
            </Link>
            <Link
              to="/"
              className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful!</h1>
          <p className="text-green-700 mb-8">
            Your password has been successfully reset. You will be redirected to the login page shortly.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Lock className="h-12 w-12 text-brand-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>One number</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid}
            className="w-full bg-brand-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-brand-accent hover:text-black font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;