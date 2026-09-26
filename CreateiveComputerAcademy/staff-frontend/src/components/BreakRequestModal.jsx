import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiCoffee, FiX, FiClock, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BREAK_OPTIONS = [
  { type: 'Personal', label: '🚶 Personal Work', icon: '🚶', desc: 'Urgent personal errand or task' },
  { type: 'Emergency', label: '🚨 Emergency Break', icon: '🚨', desc: 'Unplanned critical emergency' },
  { type: 'Prayer', label: '🕌 Prayer Break', icon: '🕌', desc: 'Prayer / Namaz time' },
  { type: 'Medical', label: '🏥 Medical / Doctor', icon: '🏥', desc: 'Doctor visit or medical checkup' },
  { type: 'Tea/Snack', label: '☕ Short Refreshment', icon: '☕', desc: 'Quick tea or refreshment outside' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 Mins' },
  { value: 30, label: '30 Mins' },
  { value: 45, label: '45 Mins' },
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1.5 Hours' },
  { value: 120, label: '2 Hours' },
];

const BreakRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [breakType, setBreakType] = useState('Personal');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;
  if (currentUser?.id === 2) return null; // Guard: User ID 2 excluded

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please enter a brief reason for your break request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/request_break.php`, {
        user_id: currentUser.id,
        break_type: breakType,
        reason: reason.trim(),
        estimated_minutes: estimatedMinutes
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Break request sent to Admin!');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to submit break request.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting break request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <FiCoffee size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                Request Custom Break
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Requires Admin Approval before start
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Break Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Break Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BREAK_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setBreakType(opt.type)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    breakType === opt.type
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Estimated Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DURATION_OPTIONS.map((dur) => (
                <button
                  key={dur.value}
                  type="button"
                  onClick={() => setEstimatedMinutes(dur.value)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    estimatedMinutes === dur.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-600/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Reason / Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Need to visit the bank for urgent work / Doctor appointment..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          {/* Info banner */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
            <FiAlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              Once submitted, Admin will receive a live notification. Your timer will start automatically upon approval and you can end it when you return.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  <span>Send Request to Admin</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BreakRequestModal;
