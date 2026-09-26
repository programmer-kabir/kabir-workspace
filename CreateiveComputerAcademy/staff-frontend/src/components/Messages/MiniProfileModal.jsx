import React from 'react';
import { FiX, FiMessageSquare, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { isUserOnline, formatLastSeen } from '../../utils/presence';

const MiniProfileModal = ({
  selectedMiniProfile,
  setSelectedMiniProfile,
  API_URL,
  amIAdmin,
  currentUser,
  handleManageMember,
  setUserToRemove,
  handleDirectMessage,
  handleViewProfile,
}) => {
  const online = isUserOnline(selectedMiniProfile);
  const lastSeenText = formatLastSeen(selectedMiniProfile?.last_activity, online);

  return (
    <AnimatePresence>
      {selectedMiniProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={() => setSelectedMiniProfile(null)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full border border-white/20 dark:border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col items-center text-center z-10"
          >
            <button
              onClick={() => setSelectedMiniProfile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full transition-all"
            >
              <FiX size={16} />
            </button>

            <div className="relative mb-4">
              {selectedMiniProfile.profile_picture ? (
                <img src={`${API_URL}${selectedMiniProfile.profile_picture}`} className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-slate-700" alt={selectedMiniProfile.name} />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-black uppercase shadow-lg border-4 border-white dark:border-slate-700">
                  {selectedMiniProfile.name?.charAt(0) || 'U'}
                </div>
              )}
              {online && (
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-sm animate-pulse"></span>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{selectedMiniProfile.name}</h2>
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-4">{selectedMiniProfile.role_name}</p>

            <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-5 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <span className={`font-semibold flex items-center gap-1.5 ${online ? 'text-emerald-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {online ? 'Active Now' : lastSeenText}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Email</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate ml-2">{selectedMiniProfile.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMiniProfile.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Emp ID</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMiniProfile.employee_code || 'N/A'}</span>
              </div>
            </div>

            {amIAdmin && selectedMiniProfile.id !== currentUser.id && (
              <div className="w-full grid grid-cols-2 gap-2 mb-3">
                {!selectedMiniProfile.is_admin ? (
                  <button onClick={() => handleManageMember('make_admin', selectedMiniProfile.id)} className="py-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors">
                    Make Admin
                  </button>
                ) : (
                  <button onClick={() => handleManageMember('remove_admin', selectedMiniProfile.id)} className="py-2 text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
                    Remove Admin
                  </button>
                )}
                <button onClick={() => setUserToRemove(selectedMiniProfile)} className="py-2 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition-colors">
                  Remove User
                </button>
              </div>
            )}

            {selectedMiniProfile.id !== currentUser.id && (
              <div className="flex w-full gap-3">
                <button
                  onClick={() => { setSelectedMiniProfile(null); handleDirectMessage(selectedMiniProfile); }}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <FiMessageSquare size={16} className="transition-transform group-hover/btn:scale-110" /> Message
                </button>
                <button
                  onClick={() => handleViewProfile(selectedMiniProfile)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <FiUser size={16} className="transition-transform group-hover/btn:scale-110" /> Profile
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniProfileModal;
