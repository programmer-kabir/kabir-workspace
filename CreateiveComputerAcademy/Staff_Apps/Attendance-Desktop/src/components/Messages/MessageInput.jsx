import React, { useRef, useState } from 'react';
import { FiPaperclip, FiSend, FiX, FiSmile, FiCornerUpLeft, FiEdit2, FiImage, FiZap, FiCheck } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

// ─── All available quick-reaction emojis to pick from ────────────────────────
const ALL_REACTION_EMOJIS = [
  '👍','❤️','😂','😮','😢','🙏','🔥','🎉','👏','💯',
  '😍','🥰','😎','🤩','😅','😭','🤔','😡','🥳','💪',
  '✅','❌','⭐','💡','🎯','🚀','💬','📌','⚡','🏆',
];

const REACTION_STORAGE_KEY = 'cca_quick_reactions';
const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const getStoredReactions = () => {
  try { return JSON.parse(localStorage.getItem(REACTION_STORAGE_KEY)) || DEFAULT_REACTIONS; }
  catch { return DEFAULT_REACTIONS; }
};
const saveStoredReactions = (reactions) => {
  localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(reactions));
};

const MessageInput = ({
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  selectedFile,
  setSelectedFile,
  amIRemoved,
  handleSendMessage,
  fileInputRef,
  typedMessage,
  setTypedMessage,
  handleTyping,
  showEmojiPickerId,
  setShowEmojiPickerId,
  emojis = [],
  isSending,
  // For quick reaction (react to last msg)
  messages = [],
  currentUser,
  handleReact,
  activeChat,
}) => {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const imageInputRef = useRef(null);

  // ── Quick Reaction Panel State ───────────────────────────────────────────
  const [showQuickReact, setShowQuickReact] = useState(false);
  const [isEditingReactions, setIsEditingReactions] = useState(false);
  const [quickReactions, setQuickReactions] = useState(getStoredReactions);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setSelectedFile(file);
  };

  const handleQuickReact = (emoji) => {
    const lastMsg = [...messages].reverse().find(m => String(m.sender_id) !== String(currentUser?.id));
    if (lastMsg && handleReact) {
      handleReact(lastMsg.id, emoji);
    }
    setShowQuickReact(false);
  };

  const toggleReactionInSet = (emoji) => {
    setQuickReactions(prev => {
      let updated;
      if (prev.includes(emoji)) {
        if (prev.length <= 3) return prev; // minimum 3
        updated = prev.filter(e => e !== emoji);
      } else {
        if (prev.length >= 8) return prev; // max 8
        updated = [...prev, emoji];
      }
      saveStoredReactions(updated);
      return updated;
    });
  };

  return (
    <div className="p-3 sm:p-4 md:px-6 md:pb-5 ">
      <div className="mx-auto w-full relative flex flex-col transition-all">

        {/* ── Replying Banner ──────────────────────────────────────────────── */}
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
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <FiX size={15} />
            </button>
          </div>
        )}

        {/* ── Editing Banner ───────────────────────────────────────────────── */}
        {editingMessage && (
          <div className="mb-2 p-2.5 mx-1.5 mt-1 bg-amber-50/80 dark:bg-amber-950/50 rounded-xl border-l-4 border-amber-500 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 overflow-hidden">
              <FiEdit2 className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={15} />
              <div className="flex flex-col min-w-0">
                <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">Editing Message</span>
                <span className="truncate opacity-80 text-[11px]">{editingMessage.message}</span>
              </div>
            </div>
            <button onClick={() => { setEditingMessage(null); setTypedMessage(''); }} className="p-1 hover:bg-white/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <FiX size={15} />
            </button>
          </div>
        )}

        {/* ── Selected File Banner ─────────────────────────────────────────── */}
        {selectedFile && (
          <div className="mb-2 p-2.5 mx-1.5 mt-1 bg-slate-100/90 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                {selectedFile.type.startsWith('image/') ? <FiImage size={14} /> : <FiPaperclip size={14} />}
              </div>
              <span className="truncate max-w-[240px] font-bold text-xs">{selectedFile.name}</span>
            </div>
            <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; if (imageInputRef.current) imageInputRef.current.value = ''; }}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition-colors">
              <FiX size={15} />
            </button>
          </div>
        )}

        {/* ── Removed Banner ───────────────────────────────────────────────── */}
        {amIRemoved ? (
          <div className="w-full flex items-center justify-center py-3">
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-2xl px-4 py-3 text-xs font-bold w-full mx-2 text-center flex items-center justify-center gap-2">
              <FiX size={16} /> You are no longer a participant in this conversation.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-1.5 relative p-1">

            {/* ── Hidden file inputs ────────────────────────────────────── */}
            <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0] || null)} ref={fileInputRef} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} ref={imageInputRef} />

            {/* ── LEFT ICON CLUSTER ─────────────────────────────────────── */}
            <div className="flex items-center gap-0.5 flex-shrink-0 mb-0.5">

        
        

              {/* Image picker */}
              <button type="button" onClick={() => imageInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                title="Send Image">
                <FiImage size={20} />
              </button>

              {/* ⚡ Quick Reaction toggle */}
              <div className="relative">
                <button type="button"
                  onClick={() => { setShowQuickReact(p => !p); setShowEmojiPickerId(null); setIsEditingReactions(false); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showQuickReact ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'}`}
                  title="Quick Reactions">
                  <FiZap size={20} />
                </button>

                {/* Quick Reaction Floating Panel */}
                <AnimatePresence>
                  {showQuickReact && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 8 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                      className="absolute left-0 bottom-full mb-3 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden w-72"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          ⚡ Quick Reactions
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button type="button"
                            onClick={() => setIsEditingReactions(p => !p)}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-all ${isEditingReactions ? 'bg-indigo-600 text-white' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'}`}>
                            {isEditingReactions ? '✓ Done' : '✏️ Customize'}
                          </button>
                          <button type="button" onClick={() => setShowQuickReact(false)}
                            className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all">
                            <FiX size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Mode: USE reactions */}
                      {!isEditingReactions && (
                        <div className="p-2">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-1 mb-1.5">
                            Tap to react to last received message
                          </p>
                          <div className="grid grid-cols-8 gap-1">
                            {quickReactions.map(emoji => (
                              <button key={emoji} type="button" onClick={() => handleQuickReact(emoji)}
                                className="w-full aspect-square flex items-center justify-center text-xl rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125 transition-all duration-150 active:scale-95">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mode: EDIT/CUSTOMIZE reactions */}
                      {isEditingReactions && (
                        <div className="p-2">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-1 mb-1.5">
                            Select 3–8 emojis for your quick reactions
                          </p>
                          <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
                            {ALL_REACTION_EMOJIS.map(emoji => {
                              const selected = quickReactions.includes(emoji);
                              return (
                                <button key={emoji} type="button" onClick={() => toggleReactionInSet(emoji)}
                                  className={`relative w-full aspect-square flex items-center justify-center text-xl rounded-xl transition-all duration-150 ${selected ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500 scale-105' : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110'}`}>
                                  {emoji}
                                  {selected && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                      <FiCheck size={8} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                            {quickReactions.length}/8 selected
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── TEXT INPUT + EMOJI ────────────────────────────────────────── */}
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
                placeholder="Type a message..."
                className="w-full bg-transparent text-slate-800 dark:text-slate-100 py-2.5 pl-3.5 pr-10 focus:outline-none resize-none max-h-32 min-h-[42px] text-xs sm:text-sm font-medium placeholder-slate-400"
                rows="1"
              />

              {/* Emoji Trigger */}
              <button type="button"
                onClick={() => { setShowEmojiPickerId(showEmojiPickerId === 'main' ? null : 'main'); setShowQuickReact(false); }}
                className="absolute right-2.5 bottom-2 p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Emojis">
                <FiSmile size={18} />
              </button>

              {/* Emoji Floating Picker */}
              {showEmojiPickerId === 'main' && (
                <div className="absolute right-0 bottom-full mb-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl shadow-2xl rounded-2xl p-2.5 flex flex-wrap max-w-xs gap-1.5 z-50 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-150">
                  {emojis.map((emoji) => (
                    <button key={emoji} type="button"
                      onClick={() => { setTypedMessage((prev) => prev + emoji); setShowEmojiPickerId(null); }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-transform hover:scale-125">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── SEND BUTTON ───────────────────────────────────────────────── */}
            <button type="submit"
              disabled={isSending || (!typedMessage.trim() && !selectedFile)}
              className="w-10 h-10 mb-0.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              title="Send">
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

export default MessageInput;
