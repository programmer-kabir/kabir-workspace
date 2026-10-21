import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, verifyTokenApi, logoutApi } from '../utils/api';
import offlineQueueService from '../services/OfflineQueueService';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = 'cca_desktop_token';
const USER_KEY = 'cca_desktop_user';
const DEV_SESSION_KEY = 'cca_desktop_original_dev_session';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(() => {
    return Boolean(localStorage.getItem(DEV_SESSION_KEY));
  });
  const [originalDevUser, setOriginalDevUser] = useState(() => {
    try {
      const saved = localStorage.getItem(DEV_SESSION_KEY);
      return saved ? JSON.parse(saved).user : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      if (!navigator.onLine) {
        // If offline on startup, restore cached user directly
        const cachedUser = localStorage.getItem(USER_KEY);
        if (cachedUser) {
          try {
            setCurrentUser(JSON.parse(cachedUser));
            setIsOfflineSession(true);
          } catch (e) {
            setCurrentUser(null);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const res = await verifyTokenApi(storedToken);
        if (res.status === 'success' && res.user) {
          setCurrentUser(res.user);
          setIsOfflineSession(false);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          localStorage.setItem('cca_user', JSON.stringify(res.user));
          localStorage.setItem('cca_token', storedToken);
        } else {
          // If token failed and was impersonating, try to revert cleanly
          const savedDev = localStorage.getItem(DEV_SESSION_KEY);
          if (savedDev) {
            try {
              const devSession = JSON.parse(savedDev);
              localStorage.setItem(TOKEN_KEY, devSession.token);
              localStorage.setItem('cca_token', devSession.token);
              localStorage.setItem(USER_KEY, JSON.stringify(devSession.user));
              localStorage.setItem('cca_user', JSON.stringify(devSession.user));
              localStorage.removeItem(DEV_SESSION_KEY);
              setIsImpersonating(false);
              setOriginalDevUser(null);
              setCurrentUser(devSession.user);
              return;
            } catch (e) {
              /* ignore */
            }
          }
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('cca_token');
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem('cca_user');
          localStorage.removeItem(DEV_SESSION_KEY);
          setIsImpersonating(false);
          setOriginalDevUser(null);
          setCurrentUser(null);
        }
      } catch (err) {
        // Fallback to cached user if offline or network glitch
        const cachedUser = localStorage.getItem(USER_KEY);
        if (cachedUser) {
          try {
            setCurrentUser(JSON.parse(cachedUser));
            setIsOfflineSession(true);
          } catch (e) {
            setCurrentUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    // If device is explicitly offline, check offline vault immediately
    if (!navigator.onLine) {
      const offlineRes = await offlineQueueService.verifyOfflineVault(identifier, password);
      if (offlineRes.success) {
        setCurrentUser(offlineRes.user);
        setIsOfflineSession(true);
        localStorage.setItem(USER_KEY, JSON.stringify(offlineRes.user));
        return { status: 'success', user: offlineRes.user, is_offline: true };
      } else {
        throw new Error(offlineRes.message || 'অফলাইন লগইন ব্যর্থ হয়েছে।');
      }
    }

    // Attempt online login first
    try {
      const data = await loginApi(identifier, password);
      if (data.status === 'success') {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem('cca_token', data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        localStorage.setItem('cca_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsOfflineSession(false);

        // Pre-cache user credentials into offline vault for future offline logins
        offlineQueueService.saveOfflineVault(data.user, identifier, password).catch(() => {});
        return data;
      } else {
        throw new Error(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      // If network failure occurred (server unreachable, WiFi dropped), check offline vault as failover
      const isNetworkErr = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        const offlineRes = await offlineQueueService.verifyOfflineVault(identifier, password);
        if (offlineRes.success) {
          setCurrentUser(offlineRes.user);
          setIsOfflineSession(true);
          localStorage.setItem(USER_KEY, JSON.stringify(offlineRes.user));
          return { status: 'success', user: offlineRes.user, is_offline: true };
        }
      }
      throw new Error(err.message || 'Login failed. Please check credentials.');
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('cca_token');
    if (token) {
      await logoutApi(token);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('cca_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('cca_user');
    localStorage.removeItem(DEV_SESSION_KEY);
    setIsImpersonating(false);
    setOriginalDevUser(null);
    setCurrentUser(null);
  };

  const impersonateUser = (targetUser, targetToken) => {
    if (!localStorage.getItem(DEV_SESSION_KEY)) {
      const currentToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('cca_token');
      localStorage.setItem(DEV_SESSION_KEY, JSON.stringify({ token: currentToken, user: currentUser }));
      setOriginalDevUser(currentUser);
    }
    localStorage.setItem(TOKEN_KEY, targetToken);
    localStorage.setItem('cca_token', targetToken);
    localStorage.setItem(USER_KEY, JSON.stringify(targetUser));
    localStorage.setItem('cca_user', JSON.stringify(targetUser));
    setCurrentUser(targetUser);
    setIsImpersonating(true);
  };

  const revertImpersonation = () => {
    const saved = localStorage.getItem(DEV_SESSION_KEY);
    if (saved) {
      try {
        const devSession = JSON.parse(saved);
        localStorage.setItem(TOKEN_KEY, devSession.token);
        localStorage.setItem('cca_token', devSession.token);
        localStorage.setItem(USER_KEY, JSON.stringify(devSession.user));
        localStorage.setItem('cca_user', JSON.stringify(devSession.user));
        setCurrentUser(devSession.user);
      } catch (err) {
        console.error('Failed to revert impersonation session', err);
      }
    }
    localStorage.removeItem(DEV_SESSION_KEY);
    setIsImpersonating(false);
    setOriginalDevUser(null);
  };

  const updateUser = (fields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...fields };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      localStorage.setItem('cca_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        updateUser,
        isOfflineSession,
        isImpersonating,
        originalDevUser,
        impersonateUser,
        revertImpersonation
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
