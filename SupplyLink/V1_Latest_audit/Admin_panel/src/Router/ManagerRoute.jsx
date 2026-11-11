import { Navigate } from "react-router-dom";
import { useAuth } from "../Provider/AuthProvider";

const ManagerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/sign_in" replace />;
  }

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  if (!userRoles.includes("manager") && !userRoles.includes("audit")) {
    return <Navigate to="/sign_in" replace />;
  }

  return children;
};

export default ManagerRoute;
