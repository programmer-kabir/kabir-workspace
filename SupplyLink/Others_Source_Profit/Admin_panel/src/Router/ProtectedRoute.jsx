import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Provider/AuthProvider";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Loader from "../components/Loader/Loader";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const toastShown = useRef(false);

  const roles = user?.role || [];

  // ✅ Allowed roles
  const allowedRoles = ["admin", "staff", "manager", "developer", "audit"];

  // 🔹 Check if user has any allowed role
  const hasAllowedRole = allowedRoles.some(role => roles.includes(role));

  // 🔹 Restricted if no allowed role
  const isRestricted = !hasAllowedRole && (roles.includes("investor") || roles.includes("customer"));

  useEffect(() => {
    if (user && isRestricted && !toastShown.current) {
      toast.error(`😅 Oops! This panel is only for staff.`, {
        position: "top-center",
        autoClose: 2500,
      });
      toastShown.current = true;
    }
  }, [user, isRestricted]);

  if (loading) return <Loader />;

  if (!user) return <Navigate to="/sign_in" replace />;

  if (isRestricted) return <Navigate to="/sign_in" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
