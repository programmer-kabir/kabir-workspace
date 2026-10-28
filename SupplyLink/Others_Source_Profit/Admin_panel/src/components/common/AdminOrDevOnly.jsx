import React from "react";
import useUserRole from "../../utils/Hooks/useUserRole";

/**
 * AdminOrDevOnly Component
 * 
 * Conditionally renders children ONLY if the logged-in user has 'admin' or 'developer' role.
 * 
 * Usage:
 * <AdminOrDevOnly>
 *    <button>Add Cash In</button>
 * </AdminOrDevOnly>
 * 
 * With optional fallback:
 * <AdminOrDevOnly fallback={<span>Access Denied</span>}>
 *    ...
 * </AdminOrDevOnly>
 */
export const AdminOrDevOnly = ({ children, fallback = null }) => {
  const { isAdminOrDev } = useUserRole();

  if (!isAdminOrDev) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * RoleGate Component
 * 
 * Generalized component for checking any specified roles.
 * 
 * Usage:
 * <RoleGate roles={["admin", "developer", "manager"]}>
 *    ...
 * </RoleGate>
 */
export const RoleGate = ({ roles = [], children, fallback = null }) => {
  const { hasRole } = useUserRole();

  if (!hasRole(roles)) {
    return fallback;
  }

  return <>{children}</>;
};

export default AdminOrDevOnly;
