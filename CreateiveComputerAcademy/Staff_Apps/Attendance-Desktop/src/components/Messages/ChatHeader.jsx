import React from 'react';
import { FiUsers, FiInfo, FiArrowLeft } from 'react-icons/fi';
import { isUserOnline, formatLastSeen } from '../../utils/presence';
import DirectChatDropdown from './DirectChatDropdown';

const ChatHeader = ({
  activeChat,
  setActiveChat,
  getDirectRecipient,
  getChatTitle,
  API_URL,
  setIsGroupInfoOpen,
  getChatSub,
  setSelectedMiniProfile,
  // For DirectChatDropdown
  currentUser,
  messages,
  handleReact,
  fetchMessages,
  fetchChats,
}) => {
  const isGroup = activeChat?.type === 'group';
  const recipient = getDirectRecipient ? getDirectRecipient(activeChat) : null;
  const isOnline = isGroup ? false : (isUserOnline(activeChat) || isUserOnline(recipient));
  const lastSeenText = isGroup ? '' : formatLastSeen(recipient?.last_activity || activeChat?.last_activity, isOnline);
  const subText = getChatSub ? getChatSub(activeChat) : '';

  return (
    <div
      className={`px-3 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex items-center justify-between shadow-sm z-10 relative flex-shrink-0 transition-all ${
        isGroup ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-850/80' : ''
      }`}
      onClick={() => isGroup && setIsGroupInfoOpen && setIsGroupInfoOpen(true)}
    >
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Back Button to return to Chat List */}
        {setActiveChat && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveChat(null);
            }}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Back to Chats"
          >
            <FiArrowLeft size={18} />
          </button>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full shadow-md ring-1 ring-black/5 dark:ring-white/10">
          {isGroup ? (
            activeChat?.group_picture ? (
              <img
                src={`${API_URL}${activeChat.group_picture}`}
                alt="Group"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center text-sm sm:text-base font-black uppercase">
                {getChatTitle(activeChat).charAt(0)}
              </div>
            )
          ) : recipient?.profile_picture ? (
            <img
              src={`${API_URL}${recipient.profile_picture}`}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-base font-black uppercase">
              {getChatTitle(activeChat).charAt(0)}
            </div>
          )}

          {/* Active status beacon */}
          {!isGroup && isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 rounded-full shadow-sm z-50 animate-pulse" />
          )}
        </div>

        {/* Title & Status info */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
              {getChatTitle(activeChat)}
            </h3>
            {isGroup && (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                Group
              </span>
            )}
            {!isGroup && (subText?.toLowerCase().includes('admin') || activeChat?.role === 'admin' || recipient?.role === 'admin') && (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                Admin
              </span>
            )}
          </div>

          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
            {isGroup ? (
              <>
                <span className="flex items-center gap-1">
                  <FiUsers size={12} className="text-slate-400" />
                  {activeChat?.participants?.filter((p) => p.status !== 'removed').length || 0} Members
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeChat?.participants?.filter((p) => isUserOnline(p) && p.status !== 'removed').length || 0} Online
                </span>
              </>
            ) : (
              <>
                <span className={`inline-flex items-center gap-1.5 font-bold ${isOnline ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                  {isOnline ? 'Active Now' : lastSeenText}
                </span>
                {subText && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">{subText}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {isGroup ? (
          <button
            onClick={() => setIsGroupInfoOpen && setIsGroupInfoOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm"
            title="Group Info"
          >
            <FiInfo size={16} />
          </button>
        ) : (
          recipient && (
            <DirectChatDropdown
              activeChat={activeChat}
              recipient={recipient}
              currentUser={currentUser}
              API_URL={API_URL}
              setSelectedMiniProfile={setSelectedMiniProfile}
              messages={messages}
              handleReact={handleReact}
              fetchMessages={fetchMessages}
              fetchChats={fetchChats}
            />
          )
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
