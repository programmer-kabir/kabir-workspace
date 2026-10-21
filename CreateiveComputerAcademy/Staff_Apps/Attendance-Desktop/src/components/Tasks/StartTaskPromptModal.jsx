import React from 'react';
import { createPortal } from 'react-dom';
import { FiPlayCircle, FiEye, FiX, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const StartTaskPromptModal = ({ task, isOpen, onClose, onStartWorking, onJustView }) => {
  if (!isOpen || !task) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/30 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-blue-500/10 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close"
        >
          <FiX size={20} />
        </button>

        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 animate-bounce">
          <FiPlayCircle size={32} />
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 mb-2">
            <span>Task #{task.id}</span>
            <span>•</span>
            <span>{task.status || 'To-Do'}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {task.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Do you want to start working on this task now?
          </p>
        </div>

        {/* Informative Quality Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mb-6 text-left">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <FiClock size={14} className="text-blue-500" />
            <span>Time Tracking & Work Period</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Starting the task sets it to <strong>In Progress</strong> and begins your live working session timer.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onStartWorking(task)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <FiPlayCircle size={18} />
            <span>Yes, Start Working Now</span>
          </button>

          <button
            type="button"
            onClick={() => onJustView(task)}
            className="w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiEye size={15} />
            <span>Just View Task Details</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default StartTaskPromptModal;
