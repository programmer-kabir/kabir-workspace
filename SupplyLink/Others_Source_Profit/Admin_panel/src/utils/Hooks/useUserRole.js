import { useMemo } from "react";
import { useAuth } from "../../Provider/AuthProvider";

/**
 * useUserRole - Centralized Hook for checking user roles & permissions
 * 
 * Returns:
 * - user: Current authenticated user object
 * - userRoles: Normalized array of role strings (lowercase)
 * - isAdmin: true if role includes 'admin'
 * - isDev: true if role includes 'developer'
 * - isAdminOrDev: true if role includes 'admin' or 'developer'
 * - isManager: true if role includes 'manager'
 * - isStaff: true if role includes 'staff'
 * - hasRole: function(...roles) returns true if user has any of the given roles
 */
export const useUserRole = () => {
  const { user } = useAuth();

  const userRoles = useMemo(() => {
    if (!user) return [];
    const raw = Array.isArray(user.role)
      ? user.role
      : Array.isArray(user.roles)
      ? user.roles
      : [user.role || user.roles];

    return raw
      .filter(Boolean)
      .map((r) => String(r).toLowerCase().trim());
  }, [user]);

  const isAdmin = useMemo(() => userRoles.includes("admin"), [userRoles]);
  const isDev = useMemo(() => userRoles.includes("developer"), [userRoles]);
  const isAdminOrDev = useMemo(() => isAdmin || isDev, [isAdmin, isDev]);
  const isManager = useMemo(() => userRoles.includes("manager"), [userRoles]);
  const isStaff = useMemo(() => userRoles.includes("staff"), [userRoles]);

  const hasRole = useMemo(() => {
    return (...rolesToCheck) => {
      const flattened = rolesToCheck.flat().map((r) => String(r).toLowerCase().trim());
      return userRoles.some((role) => flattened.includes(role));
    };
  }, [userRoles]);

  return {
    user,
    userRoles,
    isAdmin,
    isDev,
    isAdminOrDev,
    isManager,
    isStaff,
    hasRole,
  };
};

export default useUserRole;
