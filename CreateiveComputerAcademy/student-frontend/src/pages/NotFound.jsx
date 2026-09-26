import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-3xl mb-4">
        <FiAlertTriangle size={48} />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 mt-2 max-w-md">
        The page you are looking for does not exist in the Student Portal.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all"
      >
        <FiHome size={18} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
