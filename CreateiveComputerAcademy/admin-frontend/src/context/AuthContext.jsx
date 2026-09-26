import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_BASE  = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'cca_admin_token';
const USER_KEY  = 'cca_admin_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── On app load: verify stored token ────────────────────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      try {
        const res = await axios.post(`${API_BASE}api/auth/verify.php`, { token });
        if (res.data.status === 'success') {
          // Extra guard: must have admin role
          const isAdmin = res.data.user.roles && res.data.user.roles.includes('admin');
          if (isAdmin) {
            setCurrentUser(res.data.user);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } else {
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

  // ── Login ─────────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}api/auth/login.php`, { email, password });
    if (res.data.status === 'success') {
      const user = res.data.user;
      const isAdmin = user.roles && user.roles.includes('admin');
      if (!isAdmin) {
        throw new Error('Access denied. You do not have admin privileges.');
      }
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      return res.data;
    } else {
      throw new Error(res.data.message || 'Login failed.');
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try { await axios.post(`${API_BASE}api/auth/logout.php`, { token }); } catch { /* ignore */ }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  };

  const value = { currentUser, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
