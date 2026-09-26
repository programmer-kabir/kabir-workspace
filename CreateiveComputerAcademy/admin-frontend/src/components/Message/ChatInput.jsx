import React from 'react';
import { FiPaperclip, FiSend, FiX, FiCornerUpLeft, FiEdit2 } from 'react-icons/fi';

const ChatInput = ({
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  setTypedMessage,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  amIRemoved,
  handleSendMessage,
  handleTyping,
  isSending,
  typedMessage,
  API_URL,
}) => {
  return (
    <div className="p-3 sm:p-4 md:px-6 md:pb-5 bg-gradient-to-t from-slate-100/90 via-slate-100/50 to-transparent dark:from-[#070b14] dark:via-[#070b14]/80 relative z-10 w-full flex-shrink-0">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-black/50 rounded-2xl sm:rounded-3xl p-2 mx-auto w-full relative flex flex-col transition-all">
        {/* Replying Banner */}
        {replyingTo && (
          <div className="mb-2 p-2.5 mx-1.5 mt-1 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-xl border-l-4 border-indigo-600 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 overflow-hidden">
              <FiCornerUpLeft className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={15} />
              <div className="flex flex-col min-w-0">
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px]">
                  Replying to {replyingTo.sender_name}
                </span>
                <span className="truncate opacity-80 text-[11px]">
                  {replyingTo.file_path ? '📎 Attachment' : replyingTo.message}
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-white/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <FiX size={15} />
            </button>
          </div>
        )}

        {/* Editing Banner */}
        {editingMessage && (
          <div className="mb-2 p-2.5 mx-1.5 mt-1 bg-amber-50/80 dark:bg-amber-950/50 rounded-xl border-l-4 border-amber-500 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 overflow-hidden">
              <FiEdit2 className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={15} />
              <div className="flex flex-col min-w-0">
                <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                  Editing Message
                </span>
                <span className="truncate opacity-80 text-[11px]">{editingMessage.message}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setTypedMessage('');
              }}
              className="p-1 hover:bg-white/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <FiX size={15} />
            </button>
          </div>
        )}

        {/* Selected File Banner */}
        {selectedFile && (
          <div className="mb-2 p-2.5 mx-1.5 mt-1 bg-slate-100/90 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                <FiPaperclip size={14} />
              </div>
              <span className="truncate max-w-[240px] font-bold text-xs">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition-colors"
            >
              <FiX size={15} />
            </button>
          </div>
        )}

        {amIRemoved ? (
          <div className="w-full flex items-center justify-center py-3">
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-2xl px-4 py-3 text-xs font-bold w-full mx-2 text-center flex items-center justify-center gap-2">
              <FiX size={16} /> You are no longer a participant in this conversation.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative p-1">
            {/* File Upload Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 mb-0.5 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex-shrink-0"
              title="Attach File"
            >
              <FiPaperclip size={19} />
            </button>

            {/* Input Container */}
            <div className="flex-1 relative bg-slate-100/70 dark:bg-slate-900/60 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-700/60 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <textarea
                value={typedMessage}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
                className="w-full bg-transparent text-slate-800 dark:text-slate-100 py-2.5 pl-3.5 pr-4 focus:outline-none resize-none max-h-32 min-h-[42px] text-xs sm:text-sm font-medium placeholder-slate-400"
                rows="1"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || (!typedMessage.trim() && !selectedFile)}
              className="w-10 h-10 mb-0.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              title="Send"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSend size={16} className="ml-0.5" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInput;