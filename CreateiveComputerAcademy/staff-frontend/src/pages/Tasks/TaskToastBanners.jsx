import React from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import Toast from '../../components/Toast';

export default function TaskToastBanners({
  claimSuccessToast,
  setClaimSuccessToast,
  selfCreateToast,
  setSelfCreateToast,
  submitSuccessToast,
  setSubmitSuccessToast,
  actionToast,
  setActionToast
}) {
  return (
    <>
      {/* Floating Claim Success Banner */}
      {claimSuccessToast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 text-white rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-top-6 duration-300 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shrink-0 shadow-lg shadow-indigo-500/30">
              <FiCheckCircle size={22} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Task Claimed Successfully</span>
              <p className="text-sm font-bold text-white leading-snug mt-0.5">{claimSuccessToast.title}</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {claimSuccessToast.message}
              </p>
            </div>
            <button
              onClick={() => setClaimSuccessToast && setClaimSuccessToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Self-Initiated Creative Task Success Toast Banner */}
      {selfCreateToast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-rose-500/40 text-white rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-top-6 duration-300 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shrink-0 shadow-lg shadow-rose-500/30">
              <HiSparkles size={22} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">✨ Creative Task Created</span>
              <p className="text-sm font-bold text-white leading-snug mt-0.5">{selfCreateToast.title}</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Task has been added to your <strong>To-Do</strong> list. You can start the timer and work on it anytime.
              </p>
            </div>
            <button
              onClick={() => setSelfCreateToast && setSelfCreateToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Submission Success Toast Banner */}
      {submitSuccessToast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 text-white rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-top-6 duration-300 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shrink-0 shadow-lg shadow-emerald-500/20">
              <FiCheckCircle size={22} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Submission Successful</span>
              <p className="text-sm font-bold text-white leading-snug mt-0.5">Work Submitted for Review!</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Task link submitted. Notifications have been dispatched to <strong>Admin</strong> & <strong>Reviewer Manager</strong>.
              </p>
            </div>
            <button
              onClick={() => setSubmitSuccessToast && setSubmitSuccessToast(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionToast && (
        <Toast
          show={actionToast.show}
          title={actionToast.title}
          message={actionToast.message}
          type={actionToast.type}
          onClose={() => setActionToast && setActionToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </>
  );
}

