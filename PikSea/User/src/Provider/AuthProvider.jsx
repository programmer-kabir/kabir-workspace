import { createContext, useEffect, useState, useCallback } from "react";
import { 
  getAuthToken, 
  setAuthToken, 
  loginUserApi, 
  registerUserApi, 
  verifyOtpApi, 
  resendOtpApi, 
  googleLoginApi, 
  getMeApi 
} from "../api/api";
import { signInWithGooglePopup } from "../utlis/googleAuth";

// eslint-disable-next-line react-refresh/only-export-components
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
      const savedUser = localStorage.getItem('dayalstock_user');
      return savedUser ? normalizeUser(JSON.parse(savedUser)) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Synchronize and validate user profile from backend on app startup
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMeApi();
        if (currentUser) {
          const normalized = normalizeUser(currentUser);
          setUser(normalized);
          localStorage.setItem('dayalstock_user', JSON.stringify(normalized));
        } else {
          setAuthToken(null);
          localStorage.removeItem('dayalstock_user');
          setUser(null);
        }
      } catch (err) {
        console.warn("Session check error or expired:", err);
        setAuthToken(null);
        localStorage.removeItem('dayalstock_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register New User (triggers 6-digit OTP email)
  const RegisterUser = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const response = await registerUserApi({ name, email, password });
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify OTP code and log in
  const VerifyOtp = useCallback(async (email, code, type = 'registration') => {
    setLoading(true);
    try {
      const response = await verifyOtpApi({ email, code, type });
      if (response.token && response.user) {
        setAuthToken(response.token);
        const normalized = normalizeUser(response.user);
        setUser(normalized);
        localStorage.setItem('dayalstock_user', JSON.stringify(normalized));
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // Resend 6-digit OTP code
  const ResendOtp = useCallback(async (email, type = 'registration') => {
    return await resendOtpApi({ email, type });
  }, []);

  // Sign in existing user with Email & Password
  const SingInUser = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUserApi({ email, password });
      if (response.token && response.user) {
        setAuthToken(response.token);
        const normalized = normalizeUser(response.user);
        setUser(normalized);
        localStorage.setItem('dayalstock_user', JSON.stringify(normalized));
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // One-click Google Login (Zero Firebase)
  const GoogleLogin = useCallback(async (credentialOrPayload) => {
    setLoading(true);
    try {
      let email = '';
      let name = '';
      let photo = '';

      if (credentialOrPayload && typeof credentialOrPayload === 'object' && credentialOrPayload.email) {
        email = credentialOrPayload.email;
        name = credentialOrPayload.name || '';
        photo = credentialOrPayload.photo || '';
      } else {
        // Trigger pure Google OAuth2 popup
        const googleProfile = await signInWithGooglePopup();
        email = googleProfile.email;
        name = googleProfile.name;
        photo = googleProfile.photo;
      }

      if (!email) {
        throw new Error("No valid email returned from Google authentication");
      }

      const response = await googleLoginApi({ email, name, photo });
      if (response.token && response.user) {
        setAuthToken(response.token);
        const normalized = normalizeUser(response.user);
        setUser(normalized);
        localStorage.setItem('dayalstock_user', JSON.stringify(normalized));
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // User Logout
  const logOut = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem('dayalstock_user');
    setUser(null);
    return Promise.resolve();
  }, []);

  // Update user profile info locally
  const updateUserProfile = useCallback((userInfo) => {
    setUser((prev) => {
      const updated = { ...prev, ...userInfo };
      localStorage.setItem('dayalstock_user', JSON.stringify(updated));
      return updated;
    });
    return Promise.resolve();
  }, []);

  const authValue = {
    user,
    loading,
    setLoading,
    RegisterUser,
    VerifyOtp,
    ResendOtp,
    SingInUser,
    GoogleLogin,
    logOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;