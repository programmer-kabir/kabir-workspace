import React from 'react';
import MessageItem from './MessageItem';

const MessageList = ({
  loadingMessages,
  messages,
  currentUser,
  activeChat,
  API_URL,
  emojis,
  handleReact,
  setReplyingTo,
  setEditingMessage,
  setTypedMessage,
  setForwardingMessage,
  setForwardModalOpen,
  setForwardSelectedTargets,
  setForwardSearchQuery,
  setInfoMessage,
  setMessageToDelete,
  setLightboxImage,
  activeDropdown,
  setActiveDropdown,
  showEmojiPickerId,
  setShowEmojiPickerId,
  typingUsers,
  amIRemoved,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
      {loadingMessages ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Loading conversation...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center text-2xl shadow-inner mb-3">
            👋
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Say Hello!</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
            Start the conversation by typing your first message below.
          </p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <MessageItem
            key={msg.id || index}
            msg={msg}
            currentUser={currentUser}
            activeChat={activeChat}
            API_URL={API_URL}
            emojis={emojis}
            handleReact={handleReact}
            setReplyingTo={setReplyingTo}
            setEditingMessage={setEditingMessage}
            setTypedMessage={setTypedMessage}
            setForwardingMessage={setForwardingMessage}
            setForwardModalOpen={setForwardModalOpen}
            setForwardSelectedTargets={setForwardSelectedTargets}
            setForwardSearchQuery={setForwardSearchQuery}
            setInfoMessage={setInfoMessage}
            setMessageToDelete={setMessageToDelete}
            setLightboxImage={setLightboxImage}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            showEmojiPickerId={showEmojiPickerId}
            setShowEmojiPickerId={setShowEmojiPickerId}
          />
        ))
      )}

      {/* Typing Indicator Bar */}
      {!amIRemoved && typingUsers?.length > 0 && (
        <div className="flex items-center gap-2 p-2 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-2 flex items-center gap-1 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic">
            {typingUsers.length === 1
              ? `${typingUsers[0].name} is typing...`
              : typingUsers.length === 2
                ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                : `${typingUsers[0].name}, ${typingUsers[1].name} and ${typingUsers.length - 2} others are typing...`}
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
