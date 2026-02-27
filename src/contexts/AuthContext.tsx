'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  getCurrentUser,
  login as apiLogin,
  register as apiRegister,
  loadAuthTokensFromStorage,
  setAuthTokens,
  getAuthTokens,
  clearAuthTokens,
} from '@/lib/api';
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Bootstrap tokens from storage, then handle OAuth callback or regular auth check.
    loadAuthTokensFromStorage();

    const init = async () => {
      const handled = await handleAuthCallback();
      if (!handled) {
        await checkAuth();
      }
      setLoading(false);
    };

    void init();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Checking auth with access token');

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
    }
  };

  const handleAuthCallback = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const { search, hash, pathname } = window.location;
    const urlParams = new URLSearchParams(search);
    const error = urlParams.get('error');

    if (error) {
      console.error('❌ OAuth error:', error);
      toast.error(`Authentication failed: ${error}`);

      const cleanUrl = new URL(window.location.href);
      cleanUrl.search = '';
      cleanUrl.hash = '';
      window.history.replaceState({}, document.title, cleanUrl.toString());
      return false;
    }

    // New flow: backend returns tokens in URL hash on /auth/callback
    if (hash && hash.startsWith('#')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const expiresInStr = params.get('expiresIn');

      if (accessToken && refreshToken) {
        const expiresIn = expiresInStr ? Number(expiresInStr) : undefined;
        setAuthTokens({ accessToken, refreshToken, expiresIn });

        // Clean up URL (remove tokens from address bar) without changing the route.
        // Navigation is handled by the /auth/callback page using Next router.
        const newUrl = new URL(window.location.href);
        newUrl.search = '';
        newUrl.hash = '';
        window.history.replaceState({}, document.title, newUrl.toString());

        await checkAuth();

        if (!sessionStorage.getItem('dashboard_welcome_shown')) {
          toast.success('Welcome to RIZQ.AI dashboard.');
          sessionStorage.setItem('dashboard_welcome_shown', 'true');
        }

        return true;
      }
    }

    // Legacy behavior: if we land directly on dashboard, show welcome once.
    if (pathname === '/dashboard' && !sessionStorage.getItem('dashboard_welcome_shown')) {
      console.log('Dashboard loaded - showing welcome message');
      toast.success('Welcome to RIZQ.AI dashboard.');
      sessionStorage.setItem('dashboard_welcome_shown', 'true');

      const cleanUrl = new URL(window.location.href);
      cleanUrl.search = '';
      cleanUrl.hash = '';
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }

    return false;
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
      const tokens = getAuthTokens();
      const body = tokens.refreshToken ? { refreshToken: tokens.refreshToken } : undefined;
      await api.post('/auth/logout', body);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthTokens();
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

