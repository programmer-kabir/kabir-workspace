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
        const parsed = JSON.parse(saved);
        if (!parsed.roles || !Array.isArray(parsed.roles) || parsed.roles.length === 0) {
          parsed.roles = ["investor"];
        }
        setUser(parsed);
      } catch {
        localStorage.removeItem("investorUser");
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Login user with MySQL data
  const loginUser = (userData) => {
    const rawRoles = Array.isArray(userData?.roles) && userData.roles.length > 0
      ? userData.roles
      : ["investor"];

    const loggedUser = {
      ...userData,
      id: String(userData.id),
      name: userData.name || "",
      mobile: userData.mobile || "",
      roles: rawRoles,
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
