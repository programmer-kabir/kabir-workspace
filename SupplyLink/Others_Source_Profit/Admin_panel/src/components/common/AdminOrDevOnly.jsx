import React from "react";
import useUserRole from "../../utils/Hooks/useUserRole";

export const AdminOrDevOnly = ({ children, fallback = null }) => {
  const { isAdminOrDev } = useUserRole();

  if (!isAdminOrDev) {
    return fallback;
  }

  return <>{children}</>;
};


export const RoleGate = ({ roles = [], children, fallback = null }) => {
  const { hasRole } = useUserRole();

  if (!hasRole(roles)) {
    return fallback;
  }

  return <>{children}</>;
};

export default AdminOrDevOnly;
