import React from 'react';
import { FiSearch, FiMessageSquare, FiPlus,  } from 'react-icons/fi';

const ChatSidebar = ({
  API_URL,
  activeChat,
  filteredChats = [],
  setActiveChat,
  loadingChats,
  searchChat,
  setSearchChat,
  setIsNewChatModalOpen,
  getChatTitle,
  getDirectRecipient,
  getChatSub,
}) => {
  return (
    <div className={`w-full md:w-[350px] lg:w-[380px] border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex flex-col h-full flex-shrink-0 z-20 shadow-lg shadow-slate-200/50 dark:shadow-none ${
      activeChat ? 'hidden md:flex' : 'flex'
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FiMessageSquare size={16} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Messages</h2>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Staff & Group Conversations</p>
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
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start a conversation with your team.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
            >
              <FiPlus size={14} /> Start New Chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChat && activeChat.id === chat.id;
            const recipient = getDirectRecipient(chat);
            const unread = chat.unread_count > 0;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`group relative w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent dark:from-indigo-500/20 dark:via-blue-500/10 dark:to-transparent border border-indigo-500/30 dark:border-indigo-500/40 shadow-sm'
                    : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Active left indicator pill */}
                {isSelected && (
                  <div className="absolute left-1 top-3 bottom-3 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                  {chat.type === 'group' ? (
                    chat.group_picture ? (
                      <img
                        src={`${API_URL}${chat.group_picture}`}
                        alt="Group"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-base font-black uppercase">
                        {getChatTitle(chat).charAt(0)}
                      </div>
                    )
                  ) : recipient?.profile_picture ? (
                    <img
                      src={`${API_URL}${recipient.profile_picture}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-base font-black uppercase">
                      {getChatTitle(chat).charAt(0)}
                    </div>
                  )}

                  {/* Online Dot */}
                  {chat.type === 'direct' && chat.is_online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 rounded-full shadow-sm" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm truncate ${
                      unread
                        ? 'font-extrabold text-slate-900 dark:text-white'
                        : 'font-bold text-slate-800 dark:text-slate-200'
                    }`}>
                      {getChatTitle(chat)}
                    </p>
                    {chat.last_message_time && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex-shrink-0 ml-1">
                        {(() => {
                          let str = String(chat.last_message_time).trim().replace(' ', 'T');
                          if (!str.includes('+') && !str.endsWith('Z')) str += '+06:00';
                          return new Date(str).toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
                        })()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${
                      unread
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