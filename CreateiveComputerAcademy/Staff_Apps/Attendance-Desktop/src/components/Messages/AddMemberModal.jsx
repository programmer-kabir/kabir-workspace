import React from 'react';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';

const AddMemberModal = ({
  isAddMemberModalOpen,
  setIsAddMemberModalOpen,
  selectedContacts,
  setSelectedContacts,
  searchContact,
  setSearchContact,
  contacts,
  activeChat,
  toggleContactSelection,
  API_URL,
  handleAddMembers,
}) => {
  if (!isAddMemberModalOpen) return null;

  const handleClose = () => {
    setIsAddMemberModalOpen(false);
    setSelectedContacts([]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Members</h3>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="relative mb-4 flex-shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchContact}
            onChange={(e) => setSearchContact(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 p-1">
          {contacts
            .filter(c => !activeChat?.participants?.some(p => p.id === c.id && p.status !== 'removed'))
            .filter(c => c.name.toLowerCase().includes(searchContact.toLowerCase()))
            .map(contact => {
              const isChecked = selectedContacts.includes(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => toggleContactSelection(contact.id)}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isChecked ? 'bg-primary-50/50 border border-primary-100 dark:border-primary-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                      {contact.profile_picture ? (
                        <img src={`${API_URL}${contact.profile_picture}`} className="w-full h-full object-cover" alt={contact.name} />
                      ) : (
                        contact.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{contact.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{contact.role_display}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isChecked ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white dark:bg-slate-800'
                    }`}>
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
  );
};

export default AddMemberModal;
