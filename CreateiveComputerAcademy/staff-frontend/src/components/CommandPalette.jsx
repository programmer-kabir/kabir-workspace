import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiHome, FiList, FiClock, FiCalendar, FiFileText, FiUser, FiSettings, 
  FiMessageSquare, FiMoon, FiSun, FiSidebar, FiX, FiCheckCircle, FiPlay, FiCornerDownLeft
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { soundFx } from '../utils/soundFx';

const CommandPalette = ({ isOpen, onClose, onToggleSidebar, onOpenCreateModal, tasks = [] }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      soundFx.playPop();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Static Navigation Items
  const navActions = useMemo(() => [
    { id: 'nav-dashboard', label: 'Go to Dashboard', group: 'Navigation', icon: FiHome, action: () => navigate('/') },
    { id: 'nav-tasks', label: 'Go to Task Board', group: 'Navigation', icon: FiList, action: () => navigate('/tasks') },
    { id: 'nav-attendance', label: 'Go to Attendance & Shifts', group: 'Navigation', icon: FiClock, action: () => navigate('/attendance') },
    { id: 'nav-messages', label: 'Go to Team Messages', group: 'Navigation', icon: FiMessageSquare, action: () => navigate('/messages') },
    { id: 'nav-leave', label: 'Go to Leave Requests', group: 'Navigation', icon: FiCalendar, action: () => navigate('/leave') },
    { id: 'nav-reports', label: 'Go to Reports & Logs', group: 'Navigation', icon: FiFileText, action: () => navigate('/reports') },
    { id: 'nav-profile', label: 'Go to My Profile', group: 'Navigation', icon: FiUser, action: () => navigate('/profile') },
    { id: 'nav-settings', label: 'Go to Settings', group: 'Navigation', icon: FiSettings, action: () => navigate('/settings') },
  ], [navigate]);

  // Quick Action Items
  const quickActions = useMemo(() => [
    { 
      id: 'action-new-task', 
      label: 'Create New Creative Task', 
      group: 'Quick Actions', 
      icon: HiSparkles, 
      color: 'text-amber-500',
      action: () => {
        if (onOpenCreateModal) onOpenCreateModal();
        else navigate('/tasks');
      } 
    },
    { 
      id: 'action-theme', 
      label: 'Toggle Dark / Light Theme', 
      group: 'Quick Actions', 
      icon: FiMoon, 
      action: () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('cca_theme', isDark ? 'dark' : 'light');
      } 
    },
    { 
      id: 'action-sidebar', 
      label: 'Toggle Sidebar (Collapse / Expand)', 
      group: 'Quick Actions', 
      icon: FiSidebar, 
      shortcut: 'Ctrl+B',
      action: () => onToggleSidebar && onToggleSidebar() 
    },
    { 
      id: 'action-attendance-punch', 
      label: 'Open Attendance to Punch In / Out', 
      group: 'Quick Actions', 
      icon: FiClock, 
      action: () => navigate('/attendance') 
    },
  ], [navigate, onOpenCreateModal, onToggleSidebar]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    // Matching actions & navs
    const matchedActions = [...quickActions, ...navActions].filter(item => 
      item.label.toLowerCase().includes(q)
    );

    // Matching tasks if query is provided
    let matchedTasks = [];
    if (q && Array.isArray(tasks)) {
      matchedTasks = tasks
        .filter(t => (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map(t => ({
          id: `task-${t.id}`,
          label: t.title,
          subLabel: `${t.category || 'Task'} • Status: ${t.status}`,
          group: 'Active Tasks',
          icon: FiPlay,
          color: 'text-blue-500',
          action: () => navigate(`/tasks?taskId=${t.id}`)
        }));
    }

    return [...matchedActions, ...matchedTasks];
  }, [query, quickActions, navActions, tasks, navigate]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => (idx + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => (idx - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current && current.action) {
        soundFx.playSuccess();
        current.action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <FiSearch size={20} className="text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search tasks or navigate..."
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <FiX size={16} />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-black uppercase text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2.5 custom-scrollbar max-h-[420px]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-bold">No matching commands or tasks found</p>
              <p className="text-xs mt-1 text-slate-500">Try searching for "Dashboard", "Punch In", or a task title.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundFx.playSuccess();
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold shadow-xs' 
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      <Icon size={16} className={item.color || ''} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm truncate font-bold">{item.label}</p>
                      {item.subLabel && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.subLabel}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <FiCornerDownLeft size={14} className="text-blue-500 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-black font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-black font-mono">↵</kbd>
              Execute
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CCA Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
