import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 প্রথম লোডে localStorage থেকে user রিড করব
  useEffect(() => {
    const saved = localStorage.getItem("investorUser");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("investorUser");
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Login user with MySQL data
  const loginUser = (userData) => {
    const loggedUser = {
      id: String(userData.id),
      name: userData.name || "",
      mobile: userData.mobile || "",
    };

    setUser(loggedUser);
    localStorage.setItem("investorUser", JSON.stringify(loggedUser));
    return loggedUser;
  };

  // 🔹 Backward-compatible helper
  const loginWithIdAndPassword = async (id, password, userData) => {
    if (userData) {
      return loginUser(userData);
    }
    return loginUser({ id, name: "" });
  };

  // 🔹 Logout
  const logOut = () => {
    setUser(null);
    localStorage.removeItem("investorUser");
    localStorage.removeItem("activeRole");
  };

  const authValue = {
    user,
    loading,
    setLoading,
    loginUser,
    loginWithIdAndPassword,
    logOut,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
