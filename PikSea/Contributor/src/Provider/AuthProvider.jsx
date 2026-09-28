/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
  getAuthToken, 
  setAuthToken, 
  loginUserApi, 
  googleLoginApi, 
  getMeApi 
} from "../api/api";
import { signInWithGooglePopup } from "../utlis/googleAuth";

export const AuthContext = createContext(null);

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    uid: userData.id,
    displayName: userData.name,
    photoURL: userData.photo,
    getIdToken: () => Promise.resolve(getAuthToken()),
  };
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('dayalstock_contributor_user');
      return savedUser ? normalizeUser(JSON.parse(savedUser)) : null;
    } catch {
      return null;
    }
  });
  
  const [userRoles, setUserRoles] = useState(() => {
    try {
      const savedRoles = localStorage.getItem('dayalstock_contributor_roles');
      return savedRoles ? JSON.parse(savedRoles) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);

  // Fetch roles for a given email
  const fetchRolesForUser = async (email, token) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/get_user_by_email.php`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.user) {
        const roles = res.data.user.roles || [];
        setUserRoles(roles);
        localStorage.setItem('dayalstock_contributor_roles', JSON.stringify(roles));
        return roles;
      }
    } catch (err) {
      console.warn("Failed to fetch user roles:", err);
    }
    return [];
  };

  // Synchronize and validate user profile from backend on app startup
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setUserRoles([]);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMeApi();
        if (currentUser) {
          const normalized = normalizeUser(currentUser);
          setUser(normalized);
          localStorage.setItem('dayalstock_contributor_user', JSON.stringify(normalized));
          
          if (currentUser.roles) {
            setUserRoles(currentUser.roles);
            localStorage.setItem('dayalstock_contributor_roles', JSON.stringify(currentUser.roles));
          } else {
            await fetchRolesForUser(currentUser.email, token);
          }
        } else {
          setAuthToken(null);
          localStorage.removeItem('dayalstock_contributor_user');
          localStorage.removeItem('dayalstock_contributor_roles');
          setUser(null);
          setUserRoles([]);
        }
      } catch (err) {
        console.warn("Session check error or expired:", err);
        setAuthToken(null);
        localStorage.removeItem('dayalstock_contributor_user');
        localStorage.removeItem('dayalstock_contributor_roles');
        setUser(null);
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // User Ping for Online Status
  useEffect(() => {
    if (!user) return;
    let intervalId;
    let timeoutId;
    
    const sendPing = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/ping.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore ping errors
      }
    };
    
    timeoutId = setTimeout(() => {
      sendPing();
      intervalId = setInterval(sendPing, 60000); // 1 minute
    }, 5000);
    
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  // Sign in with Email & Password
  const SingInUser = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUserApi({ email, password });
      if (response.token && response.user) {
        setAuthToken(response.token);
        const normalized = normalizeUser(response.user);
        setUser(normalized);
        localStorage.setItem('dayalstock_contributor_user', JSON.stringify(normalized));
        
        const roles = response.user.roles || await fetchRolesForUser(email, response.token);
        setUserRoles(roles);
        localStorage.setItem('dayalstock_contributor_roles', JSON.stringify(roles));
        return { success: true, user: normalized, roles };
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // One-click Google Login (Zero Firebase)
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const googleProfile = await signInWithGooglePopup();
      if (!googleProfile.email) {
        throw new Error("No valid email returned from Google authentication");
      }

      const response = await googleLoginApi({
        email: googleProfile.email,
        name: googleProfile.name,
        photo: googleProfile.photo
      });

      if (response.token && response.user) {
        setAuthToken(response.token);
        const normalized = normalizeUser(response.user);
        setUser(normalized);
        localStorage.setItem('dayalstock_contributor_user', JSON.stringify(normalized));
        
        const roles = response.user.roles || await fetchRolesForUser(googleProfile.email, response.token);
        setUserRoles(roles);
        localStorage.setItem('dayalstock_contributor_roles', JSON.stringify(roles));
        return {
          user: normalized,
          roles,
          success: true
        };
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // User Logout
  const logOut = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem('dayalstock_contributor_user');
    localStorage.removeItem('dayalstock_contributor_roles');
    setUser(null);
    setUserRoles([]);
    return Promise.resolve();
  }, []);

  // Update user profile info locally
  const updateUserProfile = useCallback((userInfo) => {
    setUser((prev) => {
      const updated = { ...prev, ...userInfo };
      localStorage.setItem('dayalstock_contributor_user', JSON.stringify(updated));
      return updated;
    });
    return Promise.resolve();
  }, []);

  const authValue = {
    user,
    userRoles,
    SingInUser,
    signInWithGoogle,
    logOut,
    updateUserProfile,
    setLoading,
    loading,
  };

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;