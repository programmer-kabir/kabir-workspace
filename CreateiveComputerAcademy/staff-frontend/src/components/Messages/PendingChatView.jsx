import React from 'react';
import { FiPaperclip, FiSend } from 'react-icons/fi';
import { isUserOnline, formatLastSeen } from '../../utils/presence';

const PendingChatView = ({
  pendingChatTarget,
  API_URL,
  fileInputRef,
  setSelectedFile,
  selectedFile,
  typedMessage,
  setTypedMessage,
  handleSendMessage,
}) => {
  if (!pendingChatTarget) return null;

  const online = isUserOnline(pendingChatTarget);
  const lastSeenText = formatLastSeen(pendingChatTarget.last_activity, online);

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center gap-3">
        <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px', overflow: 'hidden' }}>
          {pendingChatTarget.profile_picture ? (
            <img
              src={`${API_URL}${pendingChatTarget.profile_picture}`}
              alt={pendingChatTarget.name}
              style={{ width: '40px', height: '40px', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '40px', height: '40px' }} className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-lg font-bold uppercase">
              {pendingChatTarget.name?.charAt(0) || 'A'}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">{pendingChatTarget.name}</h3>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', backgroundColor: online ? '#10b981' : '#cbd5e1' }}></span>
            <span className={online ? 'text-emerald-500 font-bold' : ''}>{online ? 'Active Now' : lastSeenText}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>Admin</span>
          </p>
        </div>
      </div>

      {/* Empty message area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div style={{ width: '64px', height: '64px', fontSize: '24px' }} className="bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center shadow-inner mb-3">
          👋
        </div>
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Start the conversation</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
          Type your first message below to connect with <strong>{pendingChatTarget.name}</strong>.
        </p>
      </div>

      {/* Message input — active and ready */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all flex-shrink-0"
            style={{ width: '44px', height: '44px' }}
            title="Attach File"
          >
            <FiPaperclip size={18} />
          </button>
          <input
            type="text"
            placeholder={`Message ${pendingChatTarget.name}...`}
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-500 transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!typedMessage.trim() && !selectedFile}
            className="rounded-xl bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ width: '44px', height: '44px' }}
          >
            <FiSend size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default PendingChatView;
