import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX, FiCheck } from 'react-icons/fi';

const Toast = ({ show, message, title = "Success", type = "success", onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-[999999] max-w-sm w-full bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-xl border border-white/20 text-white rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-6 duration-300 transition-all group overflow-hidden">
      {/* Top Accent Glow */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        type === 'success' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
        type === 'error' ? 'bg-gradient-to-r from-rose-500 to-amber-500' :
        'bg-gradient-to-r from-blue-500 to-indigo-600'
      }`} />

      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl text-white shrink-0 shadow-lg ${
          type === 'success' ? 'bg-gradient-to-tr from-emerald-500 to-teal-600' :
          type === 'error' ? 'bg-gradient-to-tr from-rose-500 to-amber-600' :
          'bg-gradient-to-tr from-blue-600 to-indigo-600'
        }`}>
          {type === 'success' ? <FiCheckCircle size={20} /> :
           type === 'error' ? <FiAlertTriangle size={20} /> :
           <FiInfo size={20} />}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-white leading-snug">
            {title}
          </p>
          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
