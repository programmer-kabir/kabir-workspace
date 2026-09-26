import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_BASE  = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'cca_reviewer_token';
const USER_KEY  = 'cca_reviewer_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.post(`${API_BASE}api/auth/verify.php`, { token, role: 'reviewer' });
        if (res.data.status === 'success') {
          const isReviewer = res.data.user.roles && res.data.user.roles.includes('reviewer');
          if (isReviewer) {
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

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}api/auth/login.php`, { email, password, role: 'reviewer' });
    if (res.data.status === 'success') {
      const user = res.data.user;
      const isReviewer = user.roles && user.roles.includes('reviewer');
      if (!isReviewer) {
        throw new Error('Access denied. This portal is for reviewers only.');
      }
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      return res.data;
    } else {
      throw new Error(res.data.message || 'Login failed.');
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try { await axios.post(`${API_BASE}api/auth/logout.php`, { token }); } catch { /* ignore */ }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  };

  const updateUser = (data) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
