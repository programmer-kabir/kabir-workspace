import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const getApiBase = () => {
  const custom = localStorage.getItem('cca_admin_api_base');
  if (custom) return custom.endsWith('/') ? custom : custom + '/';
  return 'https://api.creativecomputeracademy.com/';
};

const TOKEN_KEY = 'cca_admin_desktop_token';
const USER_KEY = 'cca_admin_desktop_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify stored token on startup
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
      if (!token) {
        setLoading(false);
        return;
      }
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('cca_admin_token', token);
      localStorage.setItem('cca_token', token);

      try {
        const apiBase = getApiBase();
        const res = await axios.post(`${apiBase}api/auth/verify.php`, { token });
        if (res.data?.status === 'success') {
          const user = res.data.user;
          const isPrivileged = user.roles && user.roles.some(r => ['admin', 'developer'].includes(r));
          if (isPrivileged) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('cca_admin_token');
            localStorage.removeItem('cca_token');
            localStorage.removeItem(USER_KEY);
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('cca_admin_token');
          localStorage.removeItem('cca_token');
          localStorage.removeItem(USER_KEY);
        }
      } catch (e) {
        // Fallback to cached user if offline or network glitch
        const cached = localStorage.getItem(USER_KEY);
        if (cached) {
          try { setCurrentUser(JSON.parse(cached)); } catch (err) { }
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login
  const login = async (email, password) => {
    const apiBase = getApiBase();
    const res = await axios.post(`${apiBase}api/auth/login.php`, { email, password });
    if (res.data?.status === 'success') {
      const user = res.data.user;
      const isPrivileged = user.roles && user.roles.some(r => ['admin', 'developer'].includes(r));
      if (!isPrivileged) {
        throw new Error('Access denied. Administrator or Developer credentials required.');
      }
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem('cca_admin_token', res.data.token);
      localStorage.setItem('cca_token', res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      return res.data;
    } else {
      throw new Error(res.data?.message || 'Login failed. Please check credentials.');
    }
  };

  // Logout
  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const apiBase = getApiBase();
        await axios.post(`${apiBase}api/auth/logout.php`, { token });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('cca_admin_token');
    localStorage.removeItem('cca_token');
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  };

  // Update User
  const updateUser = (updatedFields) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedFields };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, loading, getApiBase }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
