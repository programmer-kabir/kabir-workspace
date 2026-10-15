import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const DeveloperRoute = ({ children }) => {
  const { currentUser, isImpersonating } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Developer or Admin can access Developer Suite
  const isDeveloper = currentUser.roles &&
    currentUser.roles.some(r => ['developer', 'admin'].includes(r));

  if (!isDeveloper) {
    // Only show error toast if not in an impersonation session
    if (!isImpersonating) {
      toast.error('Developer Privileges Required. Access restricted.');
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DeveloperRoute;
