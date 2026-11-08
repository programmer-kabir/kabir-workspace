import React from 'react';
import { FiCheckCircle, FiDatabase, FiRefreshCw, FiCheck } from 'react-icons/fi';

export default function BackupProgressModal({ progressModal, onClose }) {
  if (!progressModal?.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative overflow-hidden bg-slate-900 border border-cyan-500/30 rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-6 text-white text-center">
        {/* Ambient glowing blobs */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="relative z-10 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-inner">
            {progressModal.isComplete ? (
              <FiCheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <FiDatabase className="w-8 h-8 text-cyan-400 animate-pulse" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {progressModal.title}
            </h3>
            <p className="text-xs text-slate-400">
              {progressModal.subtitle}
            </p>
          </div>
        </div>

        {/* Glowing Big Percentage Counter */}
        <div className="relative z-10 space-y-2">
          <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent font-mono tracking-tighter">
            {progressModal.progress}%
          </div>
          <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
            {!progressModal.isComplete && (
              <FiRefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            )}
            <span>{progressModal.stage}</span>
          </div>
        </div>

        {/* Liquid Multi-color Progress Bar */}
        <div className="relative z-10 w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-slate-700/80 shadow-inner overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-300 ease-out relative"
            style={{ width: `${progressModal.progress}%` }}
          >
            <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
          </div>
        </div>

        {/* File info pill on complete */}
        {progressModal.isComplete && progressModal.filename && (
          <div className="relative z-10 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-1.5 text-xs">
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
              <FiCheck className="w-3.5 h-3.5" />
              <span>Archive Ready & Verified</span>
            </div>
            <div className="font-mono text-slate-200 text-[11px] truncate select-all">
              {progressModal.filename}
            </div>
            <div className="text-slate-400 text-[10px]">
              Archive Size: <span className="font-bold text-emerald-300">{progressModal.size}</span> &bull; Redundant server mirror saved in <code className="text-cyan-400 font-mono">/server/backups</code>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 pt-2 flex items-center justify-center gap-3">
          {progressModal.isComplete ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              Done & Close
            </button>
          ) : (
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              🛡️ Zero data loss guaranteed &bull; Please keep this tab open until compression finishes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

