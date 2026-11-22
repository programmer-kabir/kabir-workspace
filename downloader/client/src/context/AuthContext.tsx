import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getAuthToken, setAuthToken, removeAuthToken, authFetch, fetchNotifications } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  unreadCount: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUser = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authFetch('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        refreshUnreadCount();
      } else {
        removeAuthToken();
        setUser(null);
        setToken(null);
      }
    } catch {
      removeAuthToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!getAuthToken()) return;
    try {
      const data = await fetchNotifications(false, 1);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ignore background notification check error
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Periodic poll for unread notifications every 30 seconds when logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      refreshUnreadCount();
    } else {
      throw new Error(res.error || 'Login failed.');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });

    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      refreshUnreadCount();
    } else {
      throw new Error(res.error || 'Registration failed.');
    }
  };

  const logout = async () => {
    try {
      await authFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    } finally {
      removeAuthToken();
      setToken(null);
      setUser(null);
      setUnreadCount(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        unreadCount,
        login,
        register,
        logout,
        refreshUser,
        refreshUnreadCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
