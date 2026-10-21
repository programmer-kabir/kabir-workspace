import React from 'react';
import { FiMinus, FiSquare, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';

const TitleBar = ({ onLogout, user, isCompactMode, onToggleCompactMode, activeTabName }) => {
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
    }
  };

  return (
    <header className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3.5 select-none titlebar-drag shrink-0 z-50">
      {/* Brand & Status */}
      <div className="flex items-center gap-2.5">
        <img src="./logo.png" alt="CCA" className="w-4 h-4 rounded object-contain" />
        <span className="text-xs font-bold tracking-wide text-white">
          Creative Computer Academy &bull; <span className="text-sky-400">Staff Workstation</span>
        </span>
        {activeTabName && (
          <span className="hidden md:inline-flex text-[11px] text-slate-400 font-medium pl-1 border-l border-slate-800">
            {activeTabName}
          </span>
        )}
        {user && (
          <span className="flex h-1.5 w-1.5 relative ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {/* User Info & Window Controls */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {user && onToggleCompactMode && (
          <button
            onClick={onToggleCompactMode}
            title={isCompactMode ? "Switch to Full Workstation Suite" : "Switch to Compact Punch Mode"}
            className="flex items-center gap-1.5 text-[10px] text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition font-bold cursor-pointer"
          >
            {isCompactMode ? <FiMaximize2 size={11} /> : <FiMinimize2 size={11} />}
            <span>{isCompactMode ? 'Full View' : 'Compact'}</span>
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className="text-[11px] font-bold text-slate-300">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-500">
              ({user.employee_code || user.designation || 'Staff'})
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log out"
                className="text-[10px] text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-slate-800 transition font-medium cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleMinimize}
          title="Minimize"
          className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
        >
          <FiMinus size={13} />
        </button>

        <button
          onClick={handleMaximize}
          title="Maximize / Restore"
          className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
        >
          <FiSquare size={11} />
        </button>

        <button
          onClick={handleClose}
          title="Minimize to System Tray"
          className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition cursor-pointer"
        >
          <FiX size={14} />
        </button>
      </div>
    </header>
  );
};

export default TitleBar;
