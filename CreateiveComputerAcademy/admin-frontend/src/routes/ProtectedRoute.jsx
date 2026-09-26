import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = currentUser.roles && currentUser.roles.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-red-400 text-3xl">⛔</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 font-medium">
            This console is strictly for administrators. Your account does not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
