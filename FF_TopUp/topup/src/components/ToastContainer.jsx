import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map(toast => {
        let typeStyles = 'bg-sky-50 dark:bg-sky-950/90 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200';
        let Icon = <Info size={18} className="text-sky-500 shrink-0" />;

        if (toast.type === 'success') {
          typeStyles = 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
          Icon = <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
        } else if (toast.type === 'error') {
          typeStyles = 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200';
          Icon = <AlertCircle size={18} className="text-rose-500 shrink-0" />;
        }

        return (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs sm:text-sm font-semibold transition-all ${typeStyles}`}
          >
            {Icon}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
