// frontend/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/icon';
import { getMe, loginUser, registerUser, logoutUser } from '@/lib/api';

export interface WelcomePayload {
  user?: {
    full_name?: string;
    username?: string;
  };
  type: 'login' | 'register' | 'logout';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, pass: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  // Toast notifications
  welcomePayload: WelcomePayload | null;
  clearWelcome: () => void;
  triggerWelcome: (user: User, isNew?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode]       = useState<'login' | 'register'>('login');
  const [welcomePayload, setWelcomePayload] = useState<WelcomePayload | null>(null);

  const triggerWelcome = (u: User, isNew = false) => {
    setWelcomePayload({ user: u, type: isNew ? 'register' : 'login' });
  };

  const clearWelcome = () => setWelcomePayload(null);

  const refreshUser = async () => {
    try {
      const res = await getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken  = urlParams.get('token');
      if (ssoToken) {
        localStorage.setItem('iconbaba_token', ssoToken);
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
    refreshUser();
  }, []);

  const login = async (loginId: string, pass: string) => {
    const res = await loginUser(loginId, pass);
    if (res.success && res.data?.token && res.data?.user) {
      localStorage.setItem('iconbaba_token', res.data.token);
      setUser(res.data.user);
      setShowAuthModal(false);
      triggerWelcome(res.data.user, false); // 👈 show welcome toast
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (username: string, email: string, pass: string, fullName?: string) => {
    const res = await registerUser(username, email, pass, fullName);
    if (res.success && res.data?.token && res.data?.user) {
      localStorage.setItem('iconbaba_token', res.data.token);
      setUser(res.data.user);
      setShowAuthModal(false);
      triggerWelcome(res.data.user, true); // 👈 show register welcome toast
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = async () => {
    const prevUser = user;
    await logoutUser();
    setUser(null);
    setWelcomePayload({
      user: prevUser ? { full_name: prevUser.full_name, username: prevUser.username } : undefined,
      type: 'logout',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        welcomePayload,
        clearWelcome,
        triggerWelcome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
