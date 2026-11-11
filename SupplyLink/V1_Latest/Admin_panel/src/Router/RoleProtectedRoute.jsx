import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Provider/AuthProvider";

const RoleProtectedRoute = ({ allow }) => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) return <Navigate to="/sign_in" replace />;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];

  let hasAccess = allow.some(role => userRoles.includes(role));

  // Audit Role: Has full read-only visibility for any route accessible by admin or developer
  if (!hasAccess && userRoles.includes("audit")) {
    hasAccess = allow.includes("admin") || allow.includes("developer") || allow.includes("manager") || allow.includes("staff");
  }

  if (!hasAccess) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default RoleProtectedRoute;
