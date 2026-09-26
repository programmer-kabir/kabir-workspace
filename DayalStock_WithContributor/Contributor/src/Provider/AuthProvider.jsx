/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import axios from "axios";
import app from "../Firebase/Firebase.config";
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  //   User Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const res = await axios.post(
            `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/get_user_by_email.php`,
            { email: currentUser.email },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          if (res.data.success && res.data.user) {
            // API এখন roles array রিটার্ন করে
            setUserRoles(res.data.user.roles || []);
          } else {
            setUserRoles([]);
          }
        } catch {
          setUserRoles([]);
        } finally {
          setLoading(false);
        }
      } else {
        setUserRoles([]);
        setLoading(false);
      }
    });
    return () => {
      return unsubscribe;
    };
  }, []);

  // User Ping for Online Status
  useEffect(() => {
    if (!user) return;
    let intervalId;
    let timeoutId;
    
    const sendPing = async () => {
      try {
        const token = await user.getIdToken();
        await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/ping.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // ignore ping errors
      }
    };
    
    // Delay first ping by 5 seconds to avoid concurrent request conflicts during login
    timeoutId = setTimeout(() => {
      sendPing();
      intervalId = setInterval(sendPing, 60000); // 1 minute
    }, 5000);
    
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  // New User
  const RegisterUser = (email, password) => {
    setLoading(true);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // exiting user sing in
  const SingInUser = (email, password) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google sign in
  const signInWithGoogle = () => {
    setLoading(true);
    return signInWithPopup(auth, googleProvider);
  };

  // User Logout
  const logOut = () => {
    setLoading(true);
    return signOut(auth);
  };
  // User name and photo
const updateUserProfile = (userInfo) => {
  return updateProfile(auth.currentUser, userInfo);
};
  const authValue = {
    RegisterUser,
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