import React from 'react';
import { FiSearch, FiMessageSquare, FiPlus, FiShield, FiChevronRight } from 'react-icons/fi';
import { isUserOnline, formatLastSeen } from '../../utils/presence';

const ChatSidebar = ({
  activeChat,
  admins = [],
  contactingAdmin,
  handleContactAdmin,
  searchChat,
  setSearchChat,
  loadingChats,
  filteredChats = [],
  getDirectRecipient,
  getChatTitle,
  getChatSub,
  setActiveChat,
  setIsNewChatModalOpen,
  API_URL,
  isPinned,
}) => {
  return (
    <div className={`w-full md:w-[360px] lg:w-[390px] flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full transition-all duration-300 z-20 shadow-lg shadow-slate-200/50 dark:shadow-none ${activeChat ? 'hidden md:flex' : 'flex'
      }`}>

      {/* Sidebar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FiMessageSquare size={16} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Messages</h2>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Live Team & Admin Chat</p>
          </div>
        </div>
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="group relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 active:scale-95"
          title="Start New Chat"
        >
          <FiPlus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Quick Contact Admin Section - Sleek Frosted Glass VIP Banner */}
      {admins.length > 0 && (
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-slate-50/80 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-900/40">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <FiShield size={11} /> Dedicated Admin Support
            </span>
          </div>
          <div className="space-y-2">
            {admins.map((admin) => {
              const adminOnline = isUserOnline(admin);
              const adminLastSeen = formatLastSeen(admin.last_activity, adminOnline);
              return (
                <button
                  key={admin.id}
                  onClick={() => handleContactAdmin(admin)}
                  disabled={contactingAdmin === admin.id}
                  className="group relative w-full flex items-center gap-3 p-2.5 rounded-xl text-left bg-slate-50/70 hover:bg-indigo-50/70 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all duration-200 shadow-xs"
                >
                  {/* Accent glow on hover */}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />

                  {/* Avatar */}
                  <div className="relative flex-shrink-0 w-10 h-10 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    {admin.profile_picture ? (
                      <img
                        src={`${API_URL}${admin.profile_picture}`}
                        alt={admin.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black uppercase">
                        {admin.name.charAt(0)}
                      </div>
                    )}

                    {/* Status Indicator */}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 z-50 ${adminOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {admin.name}
                      </p>
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                        Admin
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${adminOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {adminOnline ? 'Online • Click to chat' : `${adminLastSeen} • Click to chat`}
                    </p>
                  </div>

                  {/* Right Arrow / Spinner */}
                  <div className="flex-shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                    {contactingAdmin === admin.id ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Chats */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="relative flex items-center">
          <FiSearch className="absolute left-3.5 text-slate-400 dark:text-slate-500" size={15} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchChat}
            onChange={(e) => setSearchChat(e.target.value)}
            className="w-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
          {searchChat && (
            <button
              onClick={() => setSearchChat('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Loading conversations...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <FiMessageSquare size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No chats found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start a conversation or talk with Admin.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
            >
              <FiPlus size={14} /> Start New Chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChat && activeChat.id === chat.id;
            const recipient = getDirectRecipient(chat);
            const unread = chat.unread_count > 0;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`group relative w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent dark:from-indigo-500/20 dark:via-blue-500/10 dark:to-transparent border border-indigo-500/30 dark:border-indigo-500/40 shadow-sm'
                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
              >
                {/* Active left indicator pill */}
                {isActive && (
                  <div className="absolute left-1 top-3 bottom-3 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0 w-11 h-11 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10">                  {chat.type === 'group' ? (
                  chat.group_picture ? (
                    <img
                      src={`${API_URL}${chat.group_picture}`}
                      alt="Group"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-base font-black uppercase">
                      {getChatTitle(chat).charAt(0)}
                    </div>
                  )
                ) : recipient?.profile_picture ? (
                  <img
                    src={`${API_URL}${recipient.profile_picture}`}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-base font-black uppercase">
                    {getChatTitle(chat).charAt(0)}
                  </div>
                )}

                  {/* Online Dot (for direct chats) */}
                  {chat.type === 'direct' && (isUserOnline(chat) || (recipient && isUserOnline(recipient))) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 rounded-full shadow-sm z-50 animate-pulse" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm truncate ${unread
                      ? 'font-extrabold text-slate-900 dark:text-white'
                      : 'font-bold text-slate-800 dark:text-slate-200'
                      }`}>
                      {getChatTitle(chat)}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      {isPinned && isPinned(chat.id) && (
                        <span className="text-sky-500 dark:text-sky-400" title="Pinned">📌</span>
                      )}
                      {chat.last_message_time && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                          {(() => {
                            let str = String(chat.last_message_time).trim().replace(' ', 'T');
                            if (!str.includes('+') && !str.endsWith('Z')) str += '+06:00';
                            return new Date(str).toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${unread
                      ? 'text-slate-900 dark:text-slate-100 font-bold'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
                      }`}>
                      {chat.last_message_file_path ? '📎 Attachment' : chat.last_message || getChatSub(chat)}
                    </p>
                    {unread && (
                      <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
