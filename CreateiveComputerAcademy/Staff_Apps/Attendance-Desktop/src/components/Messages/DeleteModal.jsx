import React from 'react';
import { FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteModal = ({
  messageToDelete,
  setMessageToDelete,
  handleDeleteMessage,
  userToRemove,
  setUserToRemove,
  handleManageMember,
}) => {
  return (
    <>
      {/* 1. DELETE MESSAGE CONFIRMATION MODAL */}
      {messageToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setMessageToDelete(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-250">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
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
        </div>
      )}

      {/* 2. REMOVE USER FROM GROUP CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
                <FiX size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Remove Member?</h2>
              <p className="text-sm text-slate-500 font-semibold mb-6">
                Are you sure you want to remove <strong>{userToRemove.name}</strong> from this group? They will no longer be able to send or receive new messages.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setUserToRemove(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleManageMember('remove', userToRemove.id);
                    setUserToRemove(null);
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DeleteModal;
