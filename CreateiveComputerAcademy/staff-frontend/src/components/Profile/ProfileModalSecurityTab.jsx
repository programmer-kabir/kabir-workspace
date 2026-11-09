import React from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

/**
 * ProfileModalSecurityTab
 * Tab for updating account password.
 */
export default function ProfileModalSecurityTab({
  passwordMessage,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordLoading,
  onPasswordChange,
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {passwordMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
            passwordMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
          }`}
        >
          {passwordMessage.type === 'success' ? (
            <FiCheckCircle className="mt-0.5 text-lg shrink-0" />
          ) : (
            <FiXCircle className="mt-0.5 text-lg shrink-0" />
          )}
          {passwordMessage.text}
        </div>
      )}

      <form onSubmit={onPasswordChange} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Enter current password"
            required
          />
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full my-4" />

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Min. 6 characters"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Re-type new password"
            required
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
          <button
            type="submit"
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {passwordLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

