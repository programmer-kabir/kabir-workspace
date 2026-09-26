import { createContext, useEffect, useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import app from "../Firebase/Firebase.config";
const auth = getAuth(app);
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState("");

  const [loading, setLoading] = useState(true);

  //   User Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {

       
        setLoading(false);
      } else {
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
  // User Logout
  const logOut = () => {
    setLoading(true);
    return signOut(auth);
  };
  // User name and photo
  const updateUserProfile = (userInfo) => {
    return updateProfile(auth.currentUser, userInfo);
  };

  const googleProvider = new GoogleAuthProvider();
  const GoogleLogin = () => {
    setLoading(true);
    return signInWithPopup(auth, googleProvider);
  };

  const authValue = {
    RegisterUser,
    user,
    SingInUser,
    GoogleLogin,
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