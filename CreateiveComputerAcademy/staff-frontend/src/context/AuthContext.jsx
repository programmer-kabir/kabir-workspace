import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_BASE        = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY       = 'cca_token';
const USER_KEY        = 'cca_user';
const DEV_SESSION_KEY = 'cca_original_dev_session';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
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

  // ── On app load: verify stored token ────────────────────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      try {
        const res = await axios.post(`${API_BASE}api/auth/verify.php`, { token });
        if (res.data.status === 'success') {
          setCurrentUser(res.data.user);
        } else {
          // If token failed and was impersonating, try to revert cleanly
          const savedDev = localStorage.getItem(DEV_SESSION_KEY);
          if (savedDev) {
            try {
              const devSession = JSON.parse(savedDev);
              localStorage.setItem(TOKEN_KEY, devSession.token);
              localStorage.setItem(USER_KEY, JSON.stringify(devSession.user));
              localStorage.removeItem(DEV_SESSION_KEY);
              setIsImpersonating(false);
              setOriginalDevUser(null);
              setCurrentUser(devSession.user);
              return;
            } catch {}
          }
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}api/auth/login.php`, { email, password });
    if (res.data.status === 'success') {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      return res.data;
    } else {
      throw new Error(res.data.message || 'Login failed.');
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try { await axios.post(`${API_BASE}api/auth/logout.php`, { token }); } catch { /* ignore */ }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DEV_SESSION_KEY);
    setIsImpersonating(false);
    setOriginalDevUser(null);
    setCurrentUser(null);
  };

  // ── Impersonate User ────────────────────────────────────────────────────────
  const impersonateUser = (targetUser, targetToken) => {
    // If not already impersonating, save current session as developer session
    if (!localStorage.getItem(DEV_SESSION_KEY)) {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      localStorage.setItem(DEV_SESSION_KEY, JSON.stringify({ token: currentToken, user: currentUser }));
      setOriginalDevUser(currentUser);
    }
    localStorage.setItem(TOKEN_KEY, targetToken);
    localStorage.setItem(USER_KEY, JSON.stringify(targetUser));
    setCurrentUser(targetUser);
    setIsImpersonating(true);
  };

  // ── Revert Impersonation ────────────────────────────────────────────────────
  const revertImpersonation = () => {
    const saved = localStorage.getItem(DEV_SESSION_KEY);
    if (saved) {
      try {
        const devSession = JSON.parse(saved);
        localStorage.setItem(TOKEN_KEY, devSession.token);
        localStorage.setItem(USER_KEY, JSON.stringify(devSession.user));
        setCurrentUser(devSession.user);
      } catch (err) {
        console.error('Failed to revert impersonation session', err);
      }
    }
    localStorage.removeItem(DEV_SESSION_KEY);
    setIsImpersonating(false);
    setOriginalDevUser(null);
  };

  const updateUser = (updatedFields) => {
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updatedFields };
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setCurrentUser(newUser);
  };

  const value = {
    currentUser,
    login,
    logout,
    updateUser,
    isImpersonating,
    originalDevUser,
    impersonateUser,
    revertImpersonation
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
