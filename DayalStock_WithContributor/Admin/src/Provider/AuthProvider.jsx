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
import { toast } from "react-toastify";
import app from "../Firebase/Firebase.config";
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState("");

  const [loading, setLoading] = useState(true);

  //   User Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
            const roles = res.data.user.roles || [];
            if (roles.includes("admin")) {
              currentUser.roles = roles;
              setUser(currentUser);
            } else {
              await signOut(auth);
              setUser(null);
              toast.error("Access Denied: You must be an admin to access this panel.");
            }
          } else {
            await signOut(auth);
            setUser(null);
            toast.error("User not found in the system.");
          }
        } catch (error) {
          console.error("Auth Error:", error);
          await signOut(auth);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      return unsubscribe;
    };
  }, []);

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