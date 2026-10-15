import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, verifyTokenApi, logoutApi } from '../utils/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = 'cca_desktop_token';
const USER_KEY = 'cca_desktop_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await verifyTokenApi(storedToken);
        if (res.status === 'success' && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setCurrentUser(null);
        }
      } catch (err) {
        // Fallback to cached user if offline or network glitch
        const cachedUser = localStorage.getItem(USER_KEY);
        if (cachedUser) {
          try {
            setCurrentUser(JSON.parse(cachedUser));
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
    const data = await loginApi(identifier, password);
    if (data.status === 'success') {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setCurrentUser(data.user);
      return data;
    } else {
      throw new Error(data.message || 'Login failed. Please check credentials.');
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await logoutApi(token);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
