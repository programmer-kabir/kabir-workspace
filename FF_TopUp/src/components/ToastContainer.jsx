import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        return (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--emerald)" />}
            {toast.type === 'error' && <AlertCircle size={18} color="var(--accent)" />}
            {toast.type === 'info' && <Info size={18} color="var(--primary)" />}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
