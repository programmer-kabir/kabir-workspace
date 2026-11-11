// import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "../Provider/AuthProvider";

// const RoleProtectedRoute = ({ allow }) => {
//   const { user, loading } = useAuth();

//   if (loading) return null;

//   if (!user) {
//     return <Navigate to="/sign_in" replace />;
//   }

//   if (!allow.includes(user.role)) {
//     return <Navigate to="/" replace />;
//   }

//   return <Outlet />;
// };

// export default RoleProtectedRoute;
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Provider/AuthProvider";

const RoleProtectedRoute = ({ allow }) => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) return <Navigate to="/sign_in" replace />;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];

  const hasAccess = allow.some(role => userRoles.includes(role));

  if (!hasAccess) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default RoleProtectedRoute;