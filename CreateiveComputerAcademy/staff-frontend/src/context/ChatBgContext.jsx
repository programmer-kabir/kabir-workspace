import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Background Theme Presets ─────────────────────────────────────────────────
export const BG_THEMES = [
  {
    id: 'default',
    label: 'Default',
    preview: 'bg-slate-50 dark:bg-slate-900',
    style: null, // uses existing app default
  },
  {
    id: 'ocean',
    label: 'Ocean',
    preview: 'bg-gradient-to-br from-blue-900 to-cyan-800',
    style: { background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
  },
  {
    id: 'rose',
    label: 'Rose',
    preview: 'bg-gradient-to-br from-rose-900 to-pink-700',
    style: { background: 'linear-gradient(135deg, #3d0c11, #8b1a2e, #c2185b)' },
  },
  {
    id: 'forest',
    label: 'Forest',
    preview: 'bg-gradient-to-br from-green-900 to-emerald-700',
    style: { background: 'linear-gradient(135deg, #0f2e1e, #1a4731, #2d6a4f)' },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    preview: 'bg-gradient-to-br from-orange-800 to-rose-700',
    style: { background: 'linear-gradient(135deg, #2d0b00, #9c3a00, #c0392b)' },
  },
  {
    id: 'purple',
    label: 'Purple Haze',
    preview: 'bg-gradient-to-br from-purple-900 to-indigo-800',
    style: { background: 'linear-gradient(135deg, #1a0533, #2d1b69, #4a2c8e)' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    preview: 'bg-gradient-to-br from-slate-900 to-slate-800',
    style: { background: 'linear-gradient(135deg, #0a0a0a, #141414, #1a1a2e)' },
  },
  {
    id: 'arctic',
    label: 'Arctic',
    preview: 'bg-gradient-to-br from-sky-100 to-blue-200',
    style: { background: 'linear-gradient(135deg, #e0f2fe, #bae6fd, #dbeafe)' },
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const ChatBgContext = createContext(null);

const STORAGE_KEY = 'cca_chat_backgrounds';
const MUTE_KEY    = 'cca_muted_chats';
const PIN_KEY     = 'cca_pinned_chats';

export const ChatBgProvider = ({ children }) => {
  // { [chatId]: themeId }
  const [chatBackgrounds, setChatBackgrounds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });

  // Set [chatId]: boolean
  const [mutedChats, setMutedChats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MUTE_KEY)) || {}; }
    catch { return {}; }
  });

  // Ordered array of pinned chat IDs
  const [pinnedChats, setPinnedChats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PIN_KEY)) || []; }
    catch { return []; }
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatBackgrounds));
  }, [chatBackgrounds]);

  useEffect(() => {
    localStorage.setItem(MUTE_KEY, JSON.stringify(mutedChats));
  }, [mutedChats]);

  useEffect(() => {
    localStorage.setItem(PIN_KEY, JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const setChatBg = (chatId, themeId) => {
    setChatBackgrounds(prev => ({ ...prev, [chatId]: themeId }));
  };

  const getChatBg = (chatId) => {
    const themeId = chatBackgrounds[chatId] || 'default';
    return BG_THEMES.find(t => t.id === themeId) || BG_THEMES[0];
  };

  const toggleMute = (chatId) => {
    setMutedChats(prev => ({ ...prev, [chatId]: !prev[chatId] }));
  };

  const isMuted = (chatId) => !!mutedChats[chatId];

  const togglePin = (chatId) => {
    setPinnedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [chatId, ...prev]
    );
  };

  const isPinned = (chatId) => pinnedChats.includes(chatId);

  return (
    <ChatBgContext.Provider value={{
      setChatBg, getChatBg,
      toggleMute, isMuted,
      togglePin, isPinned,
      pinnedChats,
    }}>
      {children}
    </ChatBgContext.Provider>
  );
};

export const useChatBg = () => {
  const ctx = useContext(ChatBgContext);
  if (!ctx) throw new Error('useChatBg must be used within ChatBgProvider');
  return ctx;
};

export default ChatBgContext;
