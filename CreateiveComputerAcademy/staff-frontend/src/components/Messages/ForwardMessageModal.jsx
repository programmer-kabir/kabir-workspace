import React from 'react';
import { FiSearch, FiX, FiCheck, FiUsers, FiUser, FiSend } from 'react-icons/fi';

const ForwardMessageModal = ({
  forwardModalOpen,
  setForwardModalOpen,
  forwardSearchQuery,
  setForwardSearchQuery,
  filteredForwardChats,
  filteredForwardContacts,
  forwardSelectedTargets,
  toggleForwardTarget,
  contacts,
  API_URL,
  handleForwardMessage,
  isForwarding,
}) => {
  if (!forwardModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setForwardModalOpen(false)} />
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-250 h-[80vh] max-h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Forward Message</h3>
          <button
            onClick={() => setForwardModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts & groups..."
            value={forwardSearchQuery}
            onChange={(e) => setForwardSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Recent Chats */}
          {filteredForwardChats.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recent Chats</h4>
              <div className="space-y-1">
                {filteredForwardChats.map(chat => {
                  const isSelected = forwardSelectedTargets.chats.includes(chat.id);
                  return (
                    <div
                      key={`chat-${chat.id}`}
                      onClick={() => toggleForwardTarget('chats', chat.id)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isSelected && <FiCheck size={12} />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        {chat.type === 'group' ? <FiUsers /> : <FiUser />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {chat.type === 'group' ? chat.name : (contacts.find(c => c.id === chat.other_participant_id)?.name || 'Direct Chat')}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Contacts */}
          {filteredForwardContacts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">All Contacts</h4>
              <div className="space-y-1">
                {filteredForwardContacts.map(contact => {
                  const isSelected = forwardSelectedTargets.users.includes(contact.id);
                  return (
                    <div
                      key={`user-${contact.id}`}
                      onClick={() => toggleForwardTarget('users', contact.id)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isSelected && <FiCheck size={12} />}
                      </div>
                      <img
                        src={contact.profile_picture ? `${API_URL}${contact.profile_picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}`}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        alt="Profile"
                      />
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{contact.name}</h4>
                        <p className="text-xs text-slate-500 capitalize">{contact.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-500">
            {forwardSelectedTargets.chats.length + forwardSelectedTargets.users.length} selected
          </span>
          <button
            onClick={handleForwardMessage}
            disabled={(forwardSelectedTargets.chats.length === 0 && forwardSelectedTargets.users.length === 0) || isForwarding}
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            {isForwarding ? 'Sending...' : 'Forward Message'} <FiSend size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
