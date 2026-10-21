import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiTrash2, FiPlus } from 'react-icons/fi';

export const ModalShell = ({ title, onClose, onSubmit, submitLabel, actionLoading, children, onDelete }) =>
    createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-3 sm:p-5 animate-in fade-in duration-200">
            <div 
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/40 w-full max-w-[1540px] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] relative"
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Top Subtle Metallic Light Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex-shrink-0">
                    <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
                        {onDelete && (
                            <button
                                type="button" 
                                onClick={onDelete} 
                                disabled={actionLoading}
                                className="py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold rounded-xl transition-all flex items-center justify-center border border-rose-200 dark:border-rose-900/50 hover:shadow-xs active:scale-95 disabled:opacity-50"
                                title="Delete Task"
                            >
                                <FiTrash2 size={18} />
                            </button>
                        )}
                        <button
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all active:scale-98 shadow-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" 
                            disabled={actionLoading}
                            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-70 flex justify-center items-center gap-2 active:scale-98"
                        >
                            {actionLoading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <span className="flex items-center gap-1.5">{submitLabel} <FiPlus size={16} /></span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );

export default ModalShell;