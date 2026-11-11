import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 reload হলে user check
  const checkAuth = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/me.php`,
        { credentials: "include" },
      );

      const data = await res.json();
      setUser(data?.user || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 🔹 login
  const login = async (id, password) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/login.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, password }),
        },
      );

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (res.ok && data?.user) {
        setUser(data.user);
        return { success: true };
      }

      return {
        success: false,
        message:
          data?.message ||
          (res.status >= 500
            ? "Server Error (500) - Please check server logs"
            : "Invalid ID or Password"),
      };
    } catch (err) {
      return { success: false, message: "Network error or server unreachable" };
    } finally {
      setLoading(false);
    }
  };

  // 🔹 logout
  const logout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/logout.php`,
        { credentials: "include" },
      );
    } catch (e) {
      console.error("Logout request error:", e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role?.includes("admin"),
        isStaff: user?.role?.includes("staff"),
        isManager: user?.role?.includes("manager"),
        isDeveloper: user?.role?.includes("developer"),
        isAudit: user?.role?.includes("audit"),
        isReadOnly: user?.role?.includes("audit"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
