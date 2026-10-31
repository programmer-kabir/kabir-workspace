import { Navigate } from "react-router-dom";
import { useAuth } from "../Provider/AuthProvider";

const DeveloperRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/sign_in" replace />;
  }

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  if (!userRoles.includes("developer") && !userRoles.includes("audit")) {
    return <Navigate to="/sign_in" replace />;
  }

  return children;
};

export default DeveloperRoute;
