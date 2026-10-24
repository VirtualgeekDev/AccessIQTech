import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  email_verified: boolean;
  trialExpiresAt?: Date;
  subscriptionStatus?: 'active' | 'trialing' | 'canceled' | 'expired';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Only set user if email is verified
          if (!data.user.email_verified) {
            setUser(null);
            localStorage.removeItem('accessiq_user');
            return;
          }
          
          const userData: User = {
            ...data.user,
            trialExpiresAt: data.user.trial_expires_at ? new Date(data.user.trial_expires_at) : undefined
          };
          setUser(userData);
          localStorage.setItem('accessiq_user', JSON.stringify(userData));
        }
      } else {
        // Not authenticated
        setUser(null);
        localStorage.removeItem('accessiq_user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't use localStorage fallback for unverified users
      setUser(null);
      localStorage.removeItem('accessiq_user');
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.user) {
        const userData: User = {
          ...data.user,
          trialExpiresAt: data.user.trial_expires_at ? new Date(data.user.trial_expires_at) : undefined
        };
        setUser(userData);
        localStorage.setItem('accessiq_user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Handle validation errors
          const errorMessages = Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Signup failed');
      }

      if (data.success) {
        // Don't set user state after signup - user needs to verify email first
        setUser(null);
        localStorage.removeItem('accessiq_user');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };
  const logout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setUser(null);
      localStorage.removeItem('accessiq_user');
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      requestPasswordReset, 
      logout, 
      isLoading, 
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};