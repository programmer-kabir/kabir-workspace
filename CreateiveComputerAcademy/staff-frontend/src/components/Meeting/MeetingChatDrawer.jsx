import React from 'react';
import {
  FiSend, FiSmile, FiX, FiRadio, FiLock, FiUnlock, FiBookmark,
  FiCode, FiPaperclip, FiDownload, FiFileText, FiCheck, FiCopy
} from 'react-icons/fi';
import {
  CODE_LANGUAGES, formatChatFileSize, getChatAttachmentUrl
} from './meetingUtils';

/**
 * MeetingChatDrawer Component
 * Features:
 * - Live real-time chat with text messages
 * - Host chat lock indicator and toggle button
 * - Sticky pinned message display
 * - Syntax-highlighted programming code snippets with 1-click clipboard copy
 * - File and image attachment cards with direct downloads
 * - Hidden file input and code composer pop-up tray
 */
export default function MeetingChatDrawer(props) {
  const isBn = props.isBn;
  const currentUser = props.currentUser;
  const isMeHost = props.isMeHost;
  const isChatLocked = props.isChatLocked;
  const chat = props.chat || props;

  const chatOpen = chat.chatOpen;
  const onCloseChat = props.onCloseChat || (() => chat.setChatOpen(false));
  const onToggleChatLock = props.onToggleChatLock || chat.handleToggleChatLock;
  const chatMessages = chat.chatMessages || [];
  const highlightedMsgId = chat.highlightedMsgId;
  const chatScrollRef = chat.chatScrollRef;
  const chatFileInputRef = chat.chatFileInputRef;
  const chatInput = chat.chatInput;
  const onChangeChatInput = chat.setChatInput;
  const onSendMessage = chat.handleSendMessage;
  const isSending = chat.isSending;
  const isUploadingFile = chat.isUploadingFile;
  const onTogglePinMessage = chat.togglePinMessage;
  const onScrollToPinnedMessage = chat.scrollToMessage;
  const codeModalOpen = chat.codeModalOpen;
  const onToggleCodeModal = props.onToggleCodeModal || (() => chat.setCodeModalOpen(prev => !prev));
  const codeSnippet = chat.codeSnippet;
  const codeLanguage = chat.codeLanguage;
  const onChangeCodeSnippet = chat.setCodeSnippet;
  const onChangeCodeLanguage = chat.setCodeLanguage;
  const onSendCodeSnippet = chat.handleSendCodeSnippet;
  const onUploadFile = chat.handleChatFileUpload;
  const onCopyCodeSnippet = chat.handleCopyCodeSnippet;
  const onDirectFileDownload = chat.handleDirectFileDownload;
  const onPreviewImage = chat.setPreviewImageModal;

  if (!chatOpen) return null;

  const pinnedMsg = chatMessages.find(m => Number(m.is_pinned) === 1);

  return (
    <div className="w-80 md:w-96 h-full bg-[#0b0f19] border-l border-slate-800/80 flex flex-col z-20 shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* 🌟 1. Chat Header */}
      <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {isBn ? 'ইন-মিটিং চ্যাট' : 'In-Meeting Chat'}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-black">
            {chatMessages.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Host Chat Lock Toggle Button */}
          {isMeHost && (
            <button
              onClick={onToggleChatLock}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isChatLocked
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
              }`}
              title={
                isChatLocked
                  ? (isBn ? 'চ্যাট আনলক করুন (সবাই লিখতে পারবে)' : 'Unlock Chat (Everyone can chat)')
                  : (isBn ? 'চ্যাট লক করুন (শুধুমাত্র হোস্ট লিখতে পারবে)' : 'Lock Chat (Host only)')
              }
            >
              {isChatLocked ? <FiLock size={12} /> : <FiUnlock size={12} />}
              <span className="text-[10px]">
                {isChatLocked ? (isBn ? 'লকড' : 'Locked') : (isBn ? 'উন্মুক্ত' : 'Unlocked')}
              </span>
            </button>
          )}

          <button
            onClick={onCloseChat}
            className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close chat"
          >
            <FiX size={15} />
          </button>
        </div>
      </div>

      {/* 🌟 2. Sticky Pinned Message (If any) */}
      {pinnedMsg && (
        <div
          onClick={() => onScrollToPinnedMessage(pinnedMsg.id)}
          className="px-4 py-2 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border-b border-amber-500/30 flex items-center justify-between text-xs cursor-pointer hover:brightness-110 transition group"
          title={isBn ? 'মেসেজে যেতে ক্লিক করুন' : 'Click to jump to message'}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-amber-400 font-bold shrink-0">📌</span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-amber-300 text-[11px] truncate block">
                {pinnedMsg.user_name}: <span className="font-normal text-slate-300">{pinnedMsg.message}</span>
              </span>
            </div>
          </div>
          {isMeHost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinMessage(pinnedMsg);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition shrink-0"
              title={isBn ? 'আনপিন করুন' : 'Unpin'}
            >
              <FiX size={12} />
            </button>
          )}
        </div>
      )}

      {/* 🌟 3. Message Stream List */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
            <FiRadio className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-semibold">{isBn ? 'এখনো কোনো মেসেজ নেই' : 'No messages yet'}</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
              {isChatLocked && !isMeHost
                ? (isBn ? 'চ্যাট বর্তমানে হোস্ট দ্বারা লক করা রয়েছে।' : 'Chat is currently locked by the host.')
                : (isBn ? 'মিটিংয়ের সহকর্মীদের সাথে কথা বলতে নিচে লিখুন।' : 'Send a message or code snippet to everyone.')}
            </p>
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = Number(msg.user_id) === Number(currentUser?.id);
            const isPinned = Number(msg.is_pinned) === 1;
            const isHighlighted = highlightedMsgId === msg.id;

            return (
              <div
                key={msg.id || i}
                id={`chat-msg-${msg.id}`}
                className={`flex flex-col group/msg transition-all duration-300 ${isMe ? 'items-end' : 'items-start'} ${
                  isHighlighted ? 'ring-2 ring-amber-400/80 rounded-2xl p-1 bg-amber-500/10' : ''
                }`}
              >
                {/* Sender Name & Role */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">{msg.user_name}</span>
                  {msg.user_role && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]">
                      {msg.user_role}
                    </span>
                  )}
                  {isPinned && (
                    <span className="text-amber-400 text-[9px] font-bold flex items-center gap-0.5">
                      📌 Pinned
                    </span>
                  )}
                </div>

                {/* Message Bubble & Pin Action Container */}
                <div className="relative flex items-center gap-1 max-w-[88%]">
                  {/* Host Pin Button (Hoverable) */}
                  {isMeHost && (
                    <button
                      onClick={() => onTogglePinMessage(msg)}
                      className={`opacity-0 group-hover/msg:opacity-100 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition cursor-pointer shrink-0 ${
                        isMe ? 'order-first' : 'order-last'
                      }`}
                      title={isPinned ? (isBn ? 'আনপিন করুন' : 'Unpin message') : (isBn ? 'উপরে পিন করুন' : 'Pin to top')}
                    >
                      <FiBookmark size={12} className={isPinned ? 'fill-amber-400 text-amber-400' : ''} />
                    </button>
                  )}

                  {/* 💻 Code Snippet Message Card */}
                  {msg.message_type === 'code' ? (
                    <div
                      className={`rounded-2xl border text-xs overflow-hidden shadow-lg w-72 max-w-full group/code ${
                        isMe
                          ? 'bg-[#0f1422] border-rose-600/40 rounded-tr-none'
                          : 'bg-[#0f1422] border-slate-700 rounded-tl-none'
                      }`}
                    >
                      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono uppercase font-bold text-rose-400 flex items-center gap-1">
                          <FiCode size={11} />
                          {msg.code_language || 'code'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopyCodeSnippet(msg.id, msg.message)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Copy snippet"
                        >
                          {chat.copiedSnippetId === msg.id ? (
                            <>
                              <FiCheck size={10} className="text-emerald-400" />
                              <span className="text-emerald-400 font-bold">{isBn ? 'কপি হয়েছে' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <FiCopy size={10} />
                              <span>{isBn ? 'কপি' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-48 selection:bg-rose-500/30">
                        <code>{msg.message}</code>
                      </pre>
                    </div>
                  ) : msg.message_type === 'image' ? (
                    /* 🖼️ Image Attachment Card with Direct Download */
                    <div
                      className={`p-1.5 rounded-2xl border shadow-md w-64 max-w-full ${
                        isMe
                          ? 'bg-rose-950/20 border-rose-600/40 rounded-tr-none'
                          : 'bg-slate-800/80 border-slate-700 rounded-tl-none'
                      }`}
                    >
                      <div
                        onClick={() => onPreviewImage(getChatAttachmentUrl(msg.attachment_url))}
                        className="relative rounded-xl overflow-hidden cursor-pointer group/img aspect-video bg-black/40 flex items-center justify-center"
                      >
                        <img
                          src={getChatAttachmentUrl(msg.attachment_url)}
                          alt={msg.attachment_name || 'shared image'}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <span>🔍 {isBn ? 'বড় করে দেখুন' : 'Expand'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-1.5 pt-1.5">
                        <span className="text-[10px] text-slate-300 font-medium truncate max-w-[140px]" title={msg.attachment_name}>
                          {msg.attachment_name || 'image.png'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[9px]">
                            {formatChatFileSize(msg.attachment_size)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => onDirectFileDownload(msg.attachment_url, msg.attachment_name || 'image.png', e)}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition cursor-pointer"
                            title={isBn ? 'ছবি ডাউনলোড করুন' : 'Download image'}
                          >
                            <FiDownload size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : msg.message_type === 'file' ? (
                    /* 📎 File Attachment Card with Direct Download */
                    <div
                      onClick={(e) => onDirectFileDownload(msg.attachment_url, msg.attachment_name || msg.message, e)}
                      className={`p-3 rounded-2xl border shadow-md flex items-center gap-3 w-64 max-w-full cursor-pointer hover:brightness-110 active:scale-[0.98] transition group/filecard ${
                        isMe
                          ? 'bg-gradient-to-r from-rose-950/30 to-red-950/30 border-rose-600/50 rounded-tr-none'
                          : 'bg-slate-800 border-slate-700 rounded-tl-none'
                      }`}
                      title={isBn ? 'সরাসরি ডাউনলোড করতে ক্লিক করুন' : 'Click to download directly'}
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover/filecard:scale-105 transition">
                        <FiFileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate" title={msg.attachment_name}>
                          {msg.attachment_name || msg.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatChatFileSize(msg.attachment_size) || 'Attachment'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onDirectFileDownload(msg.attachment_url, msg.attachment_name || msg.message, e)}
                        className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shrink-0 shadow cursor-pointer group-hover/filecard:scale-105"
                        title={isBn ? 'সরাসরি ডাউনলোড করুন' : 'Direct Download'}
                      >
                        <FiDownload size={13} />
                      </button>
                    </div>
                  ) : (
                    /* 💬 Normal Text Message */
                    <div
                      className={`relative px-3.5 py-2.5 rounded-2xl text-xs break-words leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80'
                      }`}
                    >
                      {msg.message}
                    </div>
                  )}
                </div>

                {/* Message Timestamp */}
                <span className="text-[9px] text-slate-500 mt-0.5 px-1">
                  {msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 🌟 4. Programming Code Snippet Composer Modal */}
      {codeModalOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FiCode className="text-rose-400" />
              {isBn ? 'কোড স্ননিপেট শেয়ার করুন' : 'Share Code Snippet'}
            </span>
            <select
              value={codeLanguage}
              onChange={(e) => onChangeCodeLanguage(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono outline-none"
            >
              {CODE_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <textarea
            value={codeSnippet}
            onChange={(e) => onChangeCodeSnippet(e.target.value)}
            placeholder={isBn ? 'এখানে প্রোগ্রামিং কোড পেস্ট করুন...' : 'Paste your programming code here...'}
            rows={5}
            className="w-full bg-[#050811] text-slate-200 border border-slate-700 rounded-xl p-2.5 text-xs font-mono outline-none focus:border-rose-500 resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onToggleCodeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onSendCodeSnippet}
              disabled={!codeSnippet.trim() || isSending}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
            >
              <FiSend size={12} />
              <span>{isBn ? 'সেন্ড কোড' : 'Send Code'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 5. Hidden File Input for PDF / Images / Documents */}
      <input
        ref={chatFileInputRef}
        type="file"
        onChange={onUploadFile}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
      />

      {/* 🌟 6. Chat Input Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        {isChatLocked && !isMeHost ? (
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5">
              <FiLock size={13} />
              <span>{isBn ? 'হোস্ট চ্যাট লক করে রেখেছেন' : 'Chat locked by Host'}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isBn ? 'শুধুমাত্র হোস্ট এবং কো-হোস্ট মেসেজ পাঠাতে পারবেন।' : 'Only hosts and co-hosts can send messages.'}
            </p>
          </div>
        ) : (
          <form onSubmit={onSendMessage} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => onChangeChatInput(e.target.value)}
                  placeholder={isBn ? 'মেসেজ লিখুন...' : 'Type a message...'}
                  disabled={isSending || isUploadingFile}
                  className="w-full bg-slate-800/90 text-white placeholder-slate-500 rounded-2xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-rose-500 border border-slate-700/60 disabled:opacity-50"
                />
              </div>

              {/* 📎 File Upload Button */}
              <button
                type="button"
                onClick={() => chatFileInputRef?.current?.click()}
                disabled={isUploadingFile || isSending}
                className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50 border border-slate-700/60 shrink-0"
                title={isBn ? 'ফাইল / ছবি শেয়ার করুন (সর্বোচ্চ ২৫MB)' : 'Share file / image (Max 25MB)'}
              >
                <FiPaperclip size={15} />
              </button>

              {/* 💻 Code Snippet Toggle Button */}
              <button
                type="button"
                onClick={onToggleCodeModal}
                disabled={isSending || isUploadingFile}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition cursor-pointer border shrink-0 ${
                  codeModalOpen
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
                }`}
                title={isBn ? 'প্রোগ্রামিং কোড শেয়ার করুন' : 'Share code snippet'}
              >
                <FiCode size={15} />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending || isUploadingFile}
                className="w-9 h-9 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white flex items-center justify-center transition shadow-lg shadow-rose-600/30 cursor-pointer shrink-0"
                title={isBn ? 'পাঠান' : 'Send'}
              >
                <FiSend size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
