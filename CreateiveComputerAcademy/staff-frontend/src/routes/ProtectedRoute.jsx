import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Only allow users with the 'staff', 'manager', or 'instructor' role
  const isStaff = currentUser.roles &&
    currentUser.roles.some(r => ['staff', 'manager', 'instructor'].includes(r));

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md border border-slate-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-slate-600">
            This portal is for staff members only. Your account does not have staff privileges.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
