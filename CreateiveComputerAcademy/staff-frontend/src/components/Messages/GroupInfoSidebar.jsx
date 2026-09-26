import React from 'react';
import { FiX, FiEdit2, FiUserPlus, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { isUserOnline, formatLastSeen } from '../../utils/presence';

const GroupInfoSidebar = ({
  isGroupInfoOpen,
  setIsGroupInfoOpen,
  activeChat,
  setSelectedMiniProfile,
  setMemberSearchQuery,
  memberSearchQuery,
  API_URL,
  amIAdmin,
  setEditGroupName,
  setEditGroupFile,
  setIsEditGroupModalOpen,
  setIsAddMemberModalOpen,
  currentUser,
}) => {
  return (
    <AnimatePresence>
      {isGroupInfoOpen && activeChat?.type === 'group' && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 border-l border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex flex-col h-full flex-shrink-0 absolute right-0 top-0 bottom-0 z-40 shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Group Info</h2>
            <button
              onClick={() => {
                setIsGroupInfoOpen(false);
                setSelectedMiniProfile(null);
                setMemberSearchQuery('');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Group Profile Info */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col items-center">
            <div className="w-20 h-20 mb-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-3xl font-black shadow-sm border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden relative group">
              {activeChat?.group_picture ? (
                <img src={`${API_URL}${activeChat.group_picture}`} className="w-full h-full object-cover" alt="Group" />
              ) : (
                activeChat?.name?.charAt(0)
              )}
              {amIAdmin && (
                <button
                  onClick={() => {
                    setEditGroupName(activeChat.name);
                    setEditGroupFile(null);
                    setIsEditGroupModalOpen(true);
                  }}
                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                >
                  <FiEdit2 size={24} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeChat?.name}</h3>
              {amIAdmin && (
                <button
                  onClick={() => {
                    setEditGroupName(activeChat.name);
                    setEditGroupFile(null);
                    setIsEditGroupModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-primary-600 transition-colors"
                >
                  <FiEdit2 size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold">{activeChat?.participants?.filter(p => p.status !== 'removed').length} Members</p>

            {amIAdmin && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="mt-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2"
              >
                <FiUserPlus size={14} /> Add Members
              </button>
            )}
          </div>

          {/* Search Members */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:bg-white focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Member List */}
          <div className="overflow-y-auto p-2 space-y-1 flex-1">
            {activeChat.participants
              ?.filter(m => m.status !== 'removed')
              ?.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
              .map((member) => {
                const memberOnline = isUserOnline(member);
                const memberLastSeen = formatLastSeen(member.last_activity, memberOnline);
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMiniProfile(member)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {member.profile_picture ? (
                          <img src={`${API_URL}${member.profile_picture}`} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center font-black uppercase transition-transform group-hover:scale-105">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        {memberOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm animate-pulse z-10"></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
                            {member.name}
                          </p>
                          {member.is_admin && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-500/30 dark:text-amber-200 px-1.5 py-0.5 rounded flex-shrink-0 uppercase font-black tracking-wider">
                              Admin
                            </span>
                          )}
                          {member.id === currentUser.id && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-200 px-1.5 py-0.5 rounded flex-shrink-0 uppercase font-black tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]" title={member.role_name}>
                          {memberOnline ? (
                            <span className="text-emerald-500 font-bold">Active Now</span>
                          ) : member.last_activity ? (
                            <span className="text-slate-400 dark:text-slate-500">{memberLastSeen}</span>
                          ) : (
                            member.role_name
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            {activeChat.participants?.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-xs text-slate-500 font-bold">No members found</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupInfoSidebar;
