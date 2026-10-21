import React from 'react';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';

const NewChatModal = ({  API_URL = '', setIsNewChatModalOpen, selectedContacts = [], setSelectedContacts, searchContact, setSearchContact, filteredContacts = [], toggleContactSelection, groupName, setGroupName, handleCreateChat }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => {
                setIsNewChatModalOpen(false);
                setSelectedContacts([]);
                setGroupName('');
            }} />

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-250">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Start New Chat</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Choose one for private chat, or select multiple for a group.</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsNewChatModalOpen(false);
                            setSelectedContacts([]);
                            setGroupName('');
                        }}
                        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 dark:text-slate-600 p-1 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Group Name input (Only shown when >1 contact is selected) */}
                {selectedContacts.length > 1 && (
                    <div className="mb-4 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 animate-in slide-in-from-top-2 flex-shrink-0">
                        <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2">Group Conversation Name</label>
                        <input
                            type="text"
                            placeholder="Enter group name (e.g. Design Team)"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 font-semibold text-sm rounded-xl p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>
                )}

                {/* Search Contact */}
                <div className="relative mb-4 flex-shrink-0">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search staff, managers, instructors..."
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto space-y-1 p-1 pr-2">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">No contacts found</p>
                        </div>
                    ) : (
                        filteredContacts.map((contact) => {
                            const isChecked = selectedContacts.includes(contact.id);
                            return (
                                <div
                                    key={contact.id}
                                    onClick={() => toggleContactSelection(contact.id)}
                                    className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isChecked ? 'bg-primary-50/50 border border-primary-100 dark:border-primary-900/50' : 'hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700/50 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            {contact.profile_picture ? (
                                                <img
                                                    src={`${API_URL}${contact.profile_picture}`}
                                                    alt="Profile"
                                                    className="w-9 h-9 rounded-lg object-cover shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                    {contact.name.charAt(0)}
                                                </div>
                                            )}

                                            {contact.is_online && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{contact.name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                                                {contact.role_display} {contact.department_name ? `• ${contact.department_name}` : ''}
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
                        onClick={() => {
                            setIsNewChatModalOpen(false);
                            setSelectedContacts([]);
                            setGroupName('');
                        }}
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
    )
}

export default NewChatModal;