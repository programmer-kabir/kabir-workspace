import { useMemo } from "react";
import { useAuth } from "../../Provider/AuthProvider";

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
  const isDataEntry = useMemo(() => userRoles.includes("data_entry"), [userRoles]);

  /**
   * Only Admin, Developer, and Data Entry can perform financial & installment entry/save actions.
   * Plain Staff and Plain Manager are View/Audit/Supervisory only.
   */
  const canMakeEntry = useMemo(
    () => isAdmin || isDev || isDataEntry,
    [isAdmin, isDev, isDataEntry]
  );

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
    isDataEntry,
    canMakeEntry,
    hasRole,
  };
};

export default useUserRole;
