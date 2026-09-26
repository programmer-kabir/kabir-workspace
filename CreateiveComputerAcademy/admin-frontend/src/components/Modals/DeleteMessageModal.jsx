import React from 'react';

const DeleteMessageModal = ({setMessageToDelete,handleDeleteMessage}) => {
    return (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={() => setMessageToDelete(null)} />
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-250">
            <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Message?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This message will be deleted for everyone in this chat.</p>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
                <button
                    onClick={() => setMessageToDelete(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteMessage}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-colors"
                >
                    Delete for Everyone
                </button>
            </div>
        </div>
    </div>)
}
export default DeleteMessageModal;