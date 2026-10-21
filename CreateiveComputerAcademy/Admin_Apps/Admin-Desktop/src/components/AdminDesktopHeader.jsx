import React, { useEffect } from 'react';
import { FiSidebar, FiMinus, FiSquare, FiX, FiSearch } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import HeaderCreditBadge from './HeaderCreditBadge';
import { getApiBase } from '../context/AuthContext';

const AdminDesktopHeader = ({
  isSidebarOpen,
  toggleSidebar,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenCommandPalette
}) => {
  // Shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (toggleSidebar) toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeToTray) {
      window.electronAPI.closeToTray();
    } else if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  const getProfileImgUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    const cleanBase = getApiBase().replace(/\/+$/, '');
    return `${cleanBase}/${pic.replace(/^\/+/, '')}`;
  };

  const avatarUrl = getProfileImgUrl(currentUser?.profile_picture);

  return (
    <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-6 shadow-xs relative z-30 select-none titlebar-drag transition-colors">
      {/* Left: Sidebar Collapse/Expand Toggle + Title + Command Palette Trigger */}
      <div className="flex items-center gap-3.5 min-w-0 titlebar-no-drag">
        <button
          type="button"
          onClick={toggleSidebar}
          className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 group ${
            isSidebarOpen
              ? 'bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 ring-2 ring-blue-500/15'
          }`}
          title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
          aria-label="Toggle Sidebar"
        >
          <FiSidebar
            size={18}
            className={`transition-transform duration-300 ${
              !isSidebarOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
            }`}
          />
        </button>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate hidden lg:block">
          Administrator Console
        </h2>

        {/* Quick Command Palette Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium transition cursor-pointer shadow-2xs"
          title="Search & Jump to Module (Ctrl+K)"
        >
          <FiSearch size={13} className="text-blue-500" />
          <span className="hidden sm:inline">Search modules &amp; staff...</span>
          <kbd className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-bold text-slate-600 dark:text-slate-300">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Credits, Theme Toggle, Notifications, Academy Profile Pill, Desktop Window Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 titlebar-no-drag">
        {/* Admin Credit Reserve Badge */}
        <HeaderCreditBadge />

        {/* Dark/Light Switcher */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell portal="admin" setActiveTab={setActiveTab} />

        {/* Creative Computer Academy Profile Pill */}
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('profile')}
          className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-all cursor-pointer group shadow-2xs"
          title="Admin Profile & Settings"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-blue-500/30 transition-all shadow-xs border border-slate-100 dark:border-transparent">
            {avatarUrl ? (
              <img src={avatarUrl} alt={currentUser?.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <img src="./logo.png" alt="CCA Logo" className="w-full h-full object-contain" />
            )}
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors max-w-[140px] truncate">
            {currentUser?.name || 'Administrator'}
          </span>
        </button>

        {/* Frameless Desktop Window Controls (when in Electron) */}
        {window.electronAPI && (
          <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleMinimize}
              title="Minimize"
              className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <FiMinus size={13} />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              title="Maximize"
              className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <FiSquare size={12} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              title="Close to Tray"
              className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
            >
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminDesktopHeader;
