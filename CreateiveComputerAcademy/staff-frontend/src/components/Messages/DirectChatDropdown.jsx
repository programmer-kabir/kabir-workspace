import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiMoreVertical, FiUser, FiImage, FiZap, FiBellOff, FiBell,
  FiMapPin, FiTrash2, FiSlash, FiChevronRight, FiCheck, FiX
} from 'react-icons/fi';
import axios from 'axios';
import { BG_THEMES, useChatBg } from '../../context/ChatBgContext';

// ─── Quick Reaction Emojis ────────────────────────────────────────────────────
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '👏', '💯'];

// ─── Sub-panel IDs ────────────────────────────────────────────────────────────
const PANEL = { BG: 'bg', REACTION: 'reaction' };

const DirectChatDropdown = ({
  activeChat,
  recipient,
  currentUser,
  API_URL,
  setSelectedMiniProfile,
  messages = [],
  handleReact,
  fetchMessages,
  fetchChats,
}) => {
  const [open, setOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'bg' | 'reaction' | null
  const [isBlocked, setIsBlocked] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const dropdownRef = useRef(null);

  const { getChatBg, setChatBg, toggleMute, isMuted, togglePin, isPinned } = useChatBg();
  const currentBg = getChatBg(activeChat?.id);
  const muted = isMuted(activeChat?.id);
  const pinned = isPinned(activeChat?.id);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setActivePanel(null);
        setShowClearConfirm(false);
        setShowBlockConfirm(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const close = () => {
    setOpen(false);
    setActivePanel(null);
    setShowClearConfirm(false);
    setShowBlockConfirm(false);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleViewProfile = () => {
    close();
    setSelectedMiniProfile(recipient);
  };

  const handleToggleMute = () => {
    toggleMute(activeChat?.id);
    close();
  };

  const handleTogglePin = () => {
    togglePin(activeChat?.id);
    close();
  };

  const handleClearChat = async () => {
    if (!showClearConfirm) { setShowClearConfirm(true); return; }
    setIsClearing(true);
    try {
      await axios.post(`${API_URL}api/chat/clear_chat.php`, {
        chat_id: activeChat.id,
        user_id: currentUser.id,
      });
      fetchMessages && fetchMessages(activeChat.id);
    } catch (err) {
      console.error('Clear chat error:', err);
    } finally {
      setIsClearing(false);
      close();
    }
  };

  const handleBlockUser = async () => {
    if (!showBlockConfirm) { setShowBlockConfirm(true); return; }
    setIsBlocking(true);
    try {
      const res = await axios.post(`${API_URL}api/chat/block_user.php`, {
        blocker_id: currentUser.id,
        blocked_id: recipient.id,
      });
      if (res.data.status === 'success') {
        setIsBlocked(res.data.action === 'blocked');
      }
    } catch (err) {
      console.error('Block user error:', err);
    } finally {
      setIsBlocking(false);
      close();
    }
  };

  const handleQuickReact = (emoji) => {
    // React to the last message in the chat
    const lastMsg = [...messages].reverse().find(m => m.sender_id !== currentUser.id);
    if (lastMsg && handleReact) {
      handleReact(lastMsg.id, emoji);
    }
    close();
  };

  // ─── Menu Items ────────────────────────────────────────────────────────────
  const menuItems = [
    {
      id: 'profile',
      icon: <FiUser size={15} />,
      label: 'View Profile',
      sub: recipient?.role_name || 'Staff',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
      onClick: handleViewProfile,
    },
    {
      id: 'bg',
      icon: <FiImage size={15} />,
      label: 'Change Background',
      sub: currentBg.label,
      color: 'text-violet-600 dark:text-violet-400',
      bgHover: 'hover:bg-violet-50 dark:hover:bg-violet-900/30',
      hasPanel: true,
      panel: PANEL.BG,
    },
    {
      id: 'reaction',
      icon: <FiZap size={15} />,
      label: 'Quick Reaction',
      sub: 'React to last message',
      color: 'text-amber-600 dark:text-amber-400',
      bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/30',
      hasPanel: true,
      panel: PANEL.REACTION,
    },
    {
      id: 'mute',
      icon: muted ? <FiBell size={15} /> : <FiBellOff size={15} />,
      label: muted ? 'Unmute Notifications' : 'Mute Notifications',
      sub: muted ? 'Notifications are off' : 'Silence this chat',
      color: 'text-slate-600 dark:text-slate-400',
      bgHover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
      onClick: handleToggleMute,
      badge: muted ? '🔇' : null,
    },
    {
      id: 'pin',
      icon: <FiMapPin size={15} />,
      label: pinned ? 'Unpin Chat' : 'Pin Chat',
      sub: pinned ? 'Remove from top' : 'Keep at top of sidebar',
      color: 'text-sky-600 dark:text-sky-400',
      bgHover: 'hover:bg-sky-50 dark:hover:bg-sky-900/30',
      onClick: handleTogglePin,
      badge: pinned ? '📌' : null,
    },
    { type: 'divider' },
    {
      id: 'clear',
      icon: <FiTrash2 size={15} />,
      label: showClearConfirm ? 'Tap again to confirm!' : 'Clear My Messages',
      sub: showClearConfirm ? '⚠️ This cannot be undone' : 'Delete your sent messages',
      color: showClearConfirm ? 'text-red-600 dark:text-red-400' : 'text-rose-600 dark:text-rose-400',
      bgHover: 'hover:bg-rose-50 dark:hover:bg-rose-900/30',
      onClick: handleClearChat,
      loading: isClearing,
    },
    {
      id: 'block',
      icon: <FiSlash size={15} />,
      label: showBlockConfirm
        ? 'Tap again to confirm!'
        : isBlocked ? 'Unblock User' : 'Block User',
      sub: showBlockConfirm
        ? '⚠️ They won\'t be able to message you'
        : isBlocked ? 'Allow messages again' : 'Stop receiving messages',
      color: 'text-red-600 dark:text-red-400',
      bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/30',
      onClick: handleBlockUser,
      loading: isBlocking,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ⋮ Trigger Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); setActivePanel(null); }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${
          open
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Chat Options"
      >
        <FiMoreVertical size={17} />
      </button>

      {/* ─── Dropdown Panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute right-0 top-11 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{recipient?.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{recipient?.role_name || 'Staff'}</p>
              </div>
              <button
                onClick={close}
                className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all"
              >
                <FiX size={12} />
              </button>
            </div>

            {/* ── MAIN MENU ─────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {activePanel === null && (
                <motion.div
                  key="main-menu"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="p-2"
                >
                  {menuItems.map((item, idx) => {
                    if (item.type === 'divider') {
                      return <div key={`div-${idx}`} className="my-1.5 border-t border-slate-100 dark:border-slate-800" />;
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.hasPanel) {
                            setActivePanel(item.panel);
                          } else {
                            item.onClick?.();
                          }
                        }}
                        disabled={item.loading}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${item.bgHover}`}
                      >
                        <span className={`flex-shrink-0 ${item.color}`}>
                          {item.loading
                            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${item.color} leading-tight`}>{item.label}</p>
                          {item.sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{item.sub}</p>}
                        </div>
                        {item.badge && <span className="text-base">{item.badge}</span>}
                        {item.hasPanel && (
                          <FiChevronRight size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {/* ── BG PICKER PANEL ─────────────────────────────────────────── */}
              {activePanel === PANEL.BG && (
                <motion.div
                  key="bg-panel"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                  className="p-3"
                >
                  <button
                    onClick={() => setActivePanel(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3 transition-colors"
                  >
                    <FiChevronRight size={12} className="rotate-180" /> Back
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                    🎨 Choose Background
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {BG_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => { setChatBg(activeChat?.id, theme.id); close(); }}
                        className="flex flex-col items-center gap-1.5 group"
                        title={theme.label}
                      >
                        <div className={`w-full h-12 rounded-xl border-2 transition-all ${
                          currentBg.id === theme.id
                            ? 'border-indigo-500 shadow-md shadow-indigo-500/30 scale-105'
                            : 'border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600'
                        } ${theme.preview || 'bg-slate-100 dark:bg-slate-800'} flex items-center justify-center`}
                          style={theme.style || {}}
                        >
                          {currentBg.id === theme.id && (
                            <FiCheck size={16} className="text-white drop-shadow" />
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight">
                          {theme.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── QUICK REACTION PANEL ─────────────────────────────────────── */}
              {activePanel === PANEL.REACTION && (
                <motion.div
                  key="reaction-panel"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                  className="p-3"
                >
                  <button
                    onClick={() => setActivePanel(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3 transition-colors"
                  >
                    <FiChevronRight size={12} className="rotate-180" /> Back
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                    ⚡ React to Last Message
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleQuickReact(emoji)}
                        className="w-full h-11 flex items-center justify-center text-2xl rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 transition-all duration-150 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 font-medium">
                    Reacts to the last received message
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DirectChatDropdown;
