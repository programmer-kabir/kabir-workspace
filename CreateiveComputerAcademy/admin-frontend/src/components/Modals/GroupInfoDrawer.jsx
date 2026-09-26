import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiEdit2,
  FiUserPlus,
  FiSearch,
  FiMessageSquare,
  FiUser,
  FiCheck,
  FiImage,
} from 'react-icons/fi';
import { isUserOnline, formatLastSeen } from '../../utils/presence';

const GroupInfoDrawer = ({
  isGroupInfoOpen,
  setIsGroupInfoOpen,
  activeChat,
  amIAdmin,
  currentUser,
  API_URL,
  memberSearchQuery,
  setMemberSearchQuery,
  selectedMiniProfile,
  setSelectedMiniProfile,
  userToRemove,
  setUserToRemove,
  isAddMemberModalOpen,
  setIsAddMemberModalOpen,
  isEditGroupModalOpen,
  setIsEditGroupModalOpen,
  editGroupName,
  setEditGroupName,
  editGroupFile,
  setEditGroupFile,
  searchContact,
  setSearchContact,
  selectedContacts,
  setSelectedContacts,
  contacts,
  toggleContactSelection,
  handleManageMember,
  handleAddMembers,
  handleEditGroup,
  handleDirectMessage,
}) => {
  const navigate = useNavigate();

  if (!activeChat || activeChat.type !== 'group') return null;

  return (
    <>
      {/* 1. SLIDING GROUP INFO DRAWER */}
      <AnimatePresence>
        {isGroupInfoOpen && (
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

            {/* Profile & Edit Trigger */}
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
              <p className="text-xs text-slate-500 font-semibold">
                {activeChat?.participants?.filter((p) => p.status !== 'removed').length || 0} Members
              </p>

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

            {/* Members List */}
            <div className="overflow-y-auto p-2 space-y-1 flex-1">
              {activeChat.participants
                ?.filter((m) => m.status !== 'removed')
                .filter((m) => m.name?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                .map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMiniProfile(member)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {member.profile_picture ? (
                          <img
                            src={`${API_URL}${member.profile_picture}`}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center font-black uppercase transition-transform group-hover:scale-105">
                            {member.name?.charAt(0)}
                          </div>
                        )}
                        {member.is_online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
                            {member.name}
                          </p>
                          {member.is_admin == 1 && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-500/30 dark:text-amber-200 px-1.5 py-0.5 rounded flex-shrink-0 uppercase font-black tracking-wider">
                              Admin
                            </span>
                          )}
                          {member.id === currentUser?.id && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-200 px-1.5 py-0.5 rounded flex-shrink-0 uppercase font-black tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]" title={member.role_name}>
                          {isUserOnline(member) ? (
                            <span className="text-emerald-500 font-bold">Active Now</span>
                          ) : member.last_activity ? (
                            <span className="text-slate-400 dark:text-slate-500">{formatLastSeen(member.last_activity, false)}</span>
                          ) : (
                            member.role_name
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              {activeChat.participants?.filter((m) => m.name?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                .length === 0 && (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-xs text-slate-500 font-bold">No members found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MINI PROFILE MODAL */}
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
                  <img
                    src={`${API_URL}${selectedMiniProfile.profile_picture}`}
                    className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-slate-700"
                    alt={selectedMiniProfile.name}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-black uppercase shadow-lg border-4 border-white dark:border-slate-700">
                    {selectedMiniProfile.name?.charAt(0)}
                  </div>
                )}
                {selectedMiniProfile.is_online && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-sm"></span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{selectedMiniProfile.name}</h2>
              <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-4">
                {selectedMiniProfile.role_name}
              </p>

              <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-5 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Email</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate ml-2">
                    {selectedMiniProfile.email || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedMiniProfile.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Emp ID</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedMiniProfile.employee_code || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedMiniProfile.id !== currentUser?.id && (
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => {
                      setSelectedMiniProfile(null);
                      handleDirectMessage(selectedMiniProfile);
                    }}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <FiMessageSquare size={16} className="transition-transform group-hover/btn:scale-110" /> Message
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMiniProfile(null);
                      navigate(`/staff/${selectedMiniProfile.employee_code || selectedMiniProfile.id}`);
                    }}
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

      {/* 3. REMOVE MEMBER CONFIRMATION MODAL */}
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
                Are you sure you want to remove <strong>{userToRemove.name}</strong> from this group? They will no
                longer be able to send or receive new messages.
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

      {/* 4. ADD MEMBERS MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsAddMemberModalOpen(false);
              setSelectedContacts([]);
            }}
          />

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Members</h3>
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setSelectedContacts([]);
                }}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="relative mb-4 flex-shrink-0">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 p-1">
              {contacts
                ?.filter((c) => !activeChat?.participants?.some((p) => p.id === c.id && p.status !== 'removed'))
                .filter((c) => c.name?.toLowerCase().includes(searchContact.toLowerCase()))
                .map((contact) => {
                  const isChecked = selectedContacts.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-primary-50/50 border border-primary-100 dark:border-primary-900/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                          {contact.profile_picture ? (
                            <img src={`${API_URL}${contact.profile_picture}`} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                            contact.name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{contact.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{contact.role_display}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          isChecked ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <FiCheck size={12} />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
              <button
                onClick={handleAddMembers}
                disabled={selectedContacts.length === 0}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                Add {selectedContacts.length} {selectedContacts.length === 1 ? 'Member' : 'Members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT GROUP MODAL */}
      {isEditGroupModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsEditGroupModalOpen(false)} />

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Group Info</h3>
              <button
                onClick={() => setIsEditGroupModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Group Picture</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {editGroupFile ? (
                      <img src={URL.createObjectURL(editGroupFile)} className="w-full h-full object-cover" alt="Preview" />
                    ) : activeChat?.group_picture ? (
                      <img src={`${API_URL}${activeChat.group_picture}`} className="w-full h-full object-cover" alt="Group" />
                    ) : (
                      <FiImage className="text-slate-400 text-xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="edit-group-file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setEditGroupFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="edit-group-file"
                      className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-slate-600"
                    >
                      Choose New Picture
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Group Name</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Enter group name..."
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button
                  type="submit"
                  disabled={(!editGroupName.trim() || editGroupName === activeChat?.name) && !editGroupFile}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupInfoDrawer;