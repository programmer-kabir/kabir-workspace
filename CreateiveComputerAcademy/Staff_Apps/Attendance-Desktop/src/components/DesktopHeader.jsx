import React, { useState, useRef, useEffect } from 'react';
import { FiSidebar, FiSearch, FiX, FiMinus, FiSquare, FiMaximize2, FiMinimize2, FiWifiOff } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import HeaderShiftStatus from './HeaderShiftStatus';
import HeaderVideoSpoolBadge from './HeaderVideoSpoolBadge';
import HeaderClock from './HeaderClock';
import HeaderCreditBadge from './HeaderCreditBadge';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import HeaderProfileDropdown from './HeaderProfileDropdown';
import { useSearch } from '../context/SearchContext';

const DesktopHeader = ({
  isSidebarOpen,
  toggleSidebar,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isCompactMode,
  onToggleCompactMode,
  onOpenCommandPalette
}) => {
  const { searchTerm, setSearchTerm } = useSearch();
  const searchInputRef = useRef(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Shortcut Ctrl+K to open Command Palette, Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenCommandPalette) {
          onOpenCommandPalette();
        } else {
          searchInputRef.current?.focus();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (toggleSidebar) toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, onOpenCommandPalette]);

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

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : (currentUser?.username || 'Staff');
  const isBrandKitPage = activeTab === '/brand-kit';

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 shadow-xs relative z-30 flex-shrink-0 titlebar-drag select-none transition-colors duration-200">
      
      {/* Left: Sidebar Toggle + Greeting */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
        
        {/* If sidebar is closed, show brand logo */}
        {!isSidebarOpen && (
          <div className="flex items-center gap-2.5 pr-2 border-r border-slate-200 dark:border-slate-700 titlebar-no-drag">
            <img src="./logo.png" alt="CCA Logo" className="w-7 h-7 rounded-lg object-contain drop-shadow-xs shrink-0" />
            <h1 className="text-base font-black text-slate-800 dark:text-white tracking-wide hidden sm:block">
              CCA<span className="text-primary-600 dark:text-primary-400">Staff</span>
            </h1>
          </div>
        )}

        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 group titlebar-no-drag ${
            isSidebarOpen
              ? 'bg-slate-100/80 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 ring-2 ring-blue-500/15'
          }`}
          title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
          aria-label="Toggle Sidebar"
        >
          <FiSidebar
            size={18}
            className={`transition-transform duration-300 ${
              !isSidebarOpen
                ? 'rotate-180 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
            }`}
          />
        </button>

        {/* Greeting with bold blue first name */}
        <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
          Hi, <span className="text-blue-600 dark:text-blue-400 font-extrabold">{firstName}!</span>
        </h2>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden sm:flex flex-1 max-w-xl mx-1 sm:mx-4 min-w-0 titlebar-no-drag">
        <div className="relative group w-full">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none"
            size={15}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in this page..."
            className="w-full pl-9 pr-8 sm:pr-20 py-1.5 sm:py-2 h-9 sm:h-10 bg-slate-100/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-full text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenCommandPalette) onOpenCommandPalette();
                  else searchInputRef.current?.focus();
                }}
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs cursor-pointer transition-colors"
                title="Spotlight Search & Commands (Ctrl+K)"
              >
                <span>Ctrl</span>
                <span>K</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions, Badges & Profile Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        
        {/* Real-time Offline Mode Badge */}
        {!isOnline && (
          <div className="titlebar-no-drag">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse shadow-xs cursor-help"
              title="ইন্টারনেট সংযোগ বিচ্ছিন্ন — অফলাইন মোডে সমস্ত পাঞ্চ, ব্রেক, টাস্ক ও সার্ভিল্যান্স কম্পিউটারে নিরাপদে সংরক্ষিত হচ্ছে"
            >
              <FiWifiOff size={13} className="text-rose-500 shrink-0" />
              <span className="hidden sm:inline">অফলাইন মোড</span>
            </div>
          </div>
        )}

        {/* Live Shift Status Pill */}
        <div className="titlebar-no-drag">
          <HeaderShiftStatus onNavigate={setActiveTab} />
        </div>

        {/* Live Surveillance & Video Spool Badge */}
        <div className="titlebar-no-drag">
          <HeaderVideoSpoolBadge />
        </div>

        {/* Live CCA Official Server Clock */}
        <div className="titlebar-no-drag hidden md:block">
          <HeaderClock />
        </div>

        {/* Brand Kit Quick Launcher */}
        <div className="titlebar-no-drag">
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('/brand-kit')}
            className={`hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ${
              isBrandKitPage
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-500/30'
            }`}
            title="CCA Official Brand Kit"
          >
            <HiSparkles size={13} className={isBrandKitPage ? 'text-amber-300' : 'text-amber-500 animate-pulse'} />
            <span className="hidden sm:inline">Brand Kit</span>
          </button>
        </div>

        {/* Live Credit Wallet Badge */}
        <div className="titlebar-no-drag">
          <HeaderCreditBadge onNavigate={setActiveTab} />
        </div>

        {/* Dark/Light Theme Switcher */}
        <div className="titlebar-no-drag">
          <ThemeToggle />
        </div>

        {/* Notifications */}
        <div className="titlebar-no-drag">
          <NotificationBell portal="staff" setActiveTab={setActiveTab} />
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

        {/* Staff Profile Quick Dropdown */}
        <div className="titlebar-no-drag">
          <HeaderProfileDropdown setActiveTab={setActiveTab} onLogout={onLogout} />
        </div>

        {/* Frameless Desktop Window Controls */}
        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-slate-200 dark:border-slate-700/80 titlebar-no-drag shrink-0">
          <button
            type="button"
            onClick={handleMinimize}
            title="Minimize"
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <FiMinus size={14} />
          </button>

          <button
            type="button"
            onClick={handleMaximize}
            title="Maximize / Restore"
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <FiSquare size={12} />
          </button>

          <button
            type="button"
            onClick={handleClose}
            title="Minimize to System Tray"
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
          >
            <FiX size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
