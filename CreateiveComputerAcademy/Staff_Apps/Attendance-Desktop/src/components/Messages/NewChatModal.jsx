import React from 'react';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { isUserOnline, formatLastSeen } from '../../utils/presence';

const NewChatModal = ({
  isNewChatModalOpen,
  setIsNewChatModalOpen,
  selectedContacts,
  setSelectedContacts,
  groupName,
  setGroupName,
  searchContact,
  setSearchContact,
  filteredContacts,
  toggleContactSelection,
  handleCreateChat,
  API_URL,
}) => {
  if (!isNewChatModalOpen) return null;

  const handleClose = () => {
    setIsNewChatModalOpen(false);
    setSelectedContacts([]);
    setGroupName('');
    setSearchContact('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-700/80">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">New Message</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Select members to start chatting</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Group Name (shows if >= 2 selected) */}
        {selectedContacts.length > 1 && (
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Group Subject</label>
            <input
              type="text"
              placeholder="e.g. Graphic Design Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Search */}
        <div className="mt-4 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchContact}
            onChange={(e) => setSearchContact(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Contacts List */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {filteredContacts.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No contacts found</p>
          ) : (
            filteredContacts.map((contact) => {
              const isChecked = selectedContacts.includes(contact.id);
              const contactOnline = isUserOnline(contact);
              const contactLastSeen = formatLastSeen(contact.last_activity, contactOnline);
              return (
                <div
                  key={contact.id}
                  onClick={() => toggleContactSelection(contact.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {contact.profile_picture ? (
                        <img
                          src={`${API_URL}${contact.profile_picture}`}
                          alt="Profile"
                          style={{ width: '36px', height: '36px', objectFit: 'cover', display: 'block' }}
                          className="rounded-full"
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px' }} className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-full flex items-center justify-center font-black text-xs uppercase shadow-sm">
                          {contact.name.charAt(0)}
                        </div>
                      )}

                      {contactOnline && (
                        <span className="absolute bottom-0 right-0 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm animate-pulse" style={{ width: '9px', height: '9px' }}></span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{contact.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                        <span>{contact.role_display} {contact.department_name ? `• ${contact.department_name}` : ''}</span>
                        <span>•</span>
                        <span className={contactOnline ? 'text-emerald-500 font-bold' : ''}>
                          {contactOnline ? 'Online' : contactLastSeen}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isChecked
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-slate-300 bg-white dark:bg-slate-800'
                    }`}>
                    {isChecked && <FiCheck size={12} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateChat}
            disabled={selectedContacts.length === 0}
            className="flex-1 py-3 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{selectedContacts.length > 1 ? 'Create Group' : 'Start Chat'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
