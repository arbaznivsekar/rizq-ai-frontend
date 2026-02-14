'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getCurrentUser, login as apiLogin, register as apiRegister } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  _id: string;
  email: string;
  name: string;
  image?: string;
  phone?: string;
  roles: string[];
  gmailConnectedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGmail: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
    handleAuthCallback();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Checking auth with cookies (HttpOnly)');
      
      try {
        const response = await getCurrentUser();
        console.log('✅ Auth check response:', response);
        
        if (response.success && response.user) {
          setUser(response.user);
          console.log('✅ User authenticated:', response.user.email);
        } else {
          console.log('❌ Auth failed - no user data');
          setUser(null);
        }
      } catch (apiError: any) {
        console.error('❌ API call failed:', apiError.response?.status, apiError.response?.data);
        
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          console.log('❌ Authentication failed - user not logged in');
          setUser(null);
        } else {
          console.log('⚠️ Network error - keeping current state');
        }
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCallback = () => {
    // Handle OAuth callback - check if we're coming from Gmail OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      console.error('❌ OAuth error:', error);
      toast.error(`Authentication failed: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Show welcome message on dashboard (OAuth redirect or page refresh)
    // Only show once per session to avoid duplicate toasts
    if (window.location.pathname === '/dashboard' && !sessionStorage.getItem('dashboard_welcome_shown')) {
      console.log('Dashboard loaded - showing welcome message');
      toast.success('Welcome to RIZQ.AI dashboard.');
      sessionStorage.setItem('dashboard_welcome_shown', 'true');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Immediately check auth and keep checking until successful
      const checkAuthWithRetry = async (retries = 0) => {
        try {
          const response = await getCurrentUser();
          if (response.success && response.user) {
            console.log('✅ OAuth authentication successful');
            setUser(response.user);
            return;
          }
        } catch (error) {
          console.log(`⏳ Auth check attempt ${retries + 1} failed, retrying...`);
        }
        
        if (retries < 5) {
          setTimeout(() => checkAuthWithRetry(retries + 1), 1000);
        } else {
          console.error('❌ OAuth authentication failed after 5 attempts');
        }
      };
      
      checkAuthWithRetry();
    }
  };

  const loginWithGmail = () => {
    console.log('🔗 Initiating Gmail OAuth login');
    // Redirect to backend Gmail OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/google/login`;
  };

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        console.log('✅ User data refreshed:', response.user);
      } else {
        console.log('⚠️ Failed to refresh user data');
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear any localStorage token (fallback)
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGmail,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

