import React from 'react';
import { FiMinus, FiSquare, FiX, FiMinimize2, FiMaximize2, FiShield } from 'react-icons/fi';

const TitleBar = ({ user, activeTabName }) => {
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

  return (
    <header className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3.5 select-none titlebar-drag shrink-0 z-50">
      {/* Brand & Status */}
      <div className="flex items-center gap-2.5">
        <img src="./logo.png" alt="CCA" className="w-4 h-4 rounded object-contain shrink-0" />
        <span className="text-xs font-bold tracking-wide text-white flex items-center gap-1.5">
          <span>Creative Computer Academy</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-blue-400 font-extrabold flex items-center gap-1">
            <FiShield size={12} className="text-blue-400" />
            Admin Workstation
          </span>
        </span>
        {activeTabName && (
          <span className="hidden md:inline-flex text-[11px] text-slate-400 font-medium pl-2 border-l border-slate-800">
            {activeTabName}
          </span>
        )}
        <span className="flex h-1.5 w-1.5 relative ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
        </span>
      </div>

      {/* User Info & Frameless Window Controls */}
      <div className="flex items-center gap-3 titlebar-no-drag">
        {user && (
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className="text-[11px] font-bold text-slate-300">
              {user.name}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Admin
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleMinimize}
            title="Minimize"
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 hover:text-white rounded-lg transition cursor-pointer"
          >
            <FiMinus size={13} />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            title="Maximize / Restore"
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 hover:text-white rounded-lg transition cursor-pointer"
          >
            <FiSquare size={12} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            title="Close to Tray"
            className="w-7 h-7 flex items-center justify-center hover:bg-rose-600 hover:text-white rounded-lg transition cursor-pointer"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TitleBar;
