import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FiSearch, FiHome, FiList, FiClock, FiCalendar, FiFileText, FiUser, FiSettings, 
  FiMessageSquare, FiMoon, FiSun, FiSidebar, FiX, FiCheckCircle, FiPlay, FiCornerDownLeft,
  FiDownload, FiCoffee, FiDollarSign, FiBookOpen, FiRadio, FiDatabase, FiCode, FiActivity, FiUsers
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaCoins } from 'react-icons/fa6';
import { soundFx } from '../utils/soundFx';

const CommandPalette = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onToggleSidebar, 
  currentUser,
  tasks = [] 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

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

  const isDevOrAdmin = Boolean(
    currentUser?.roles && currentUser.roles.some(r => ['developer', 'admin'].includes(r))
  );

  // Static Navigation Items
  const navActions = useMemo(() => {
    const items = [
      { id: 'nav-dashboard', label: 'Dashboard', subLabel: 'Overview, today shift & announcements', group: 'Navigation', icon: FiHome, path: '/' },
      { id: 'nav-community', label: 'Community Wall', subLabel: 'Staff feed, stories & updates', group: 'Navigation', icon: FiUsers, path: '/community', color: 'text-violet-500' },
      { id: 'nav-messages', label: 'Team Messages & Chat', subLabel: 'Direct messaging & voice notes', group: 'Navigation', icon: FiMessageSquare, path: '/messages' },
      { id: 'nav-attendance', label: 'Attendance & Quick Punch', subLabel: 'Punch In / Out, shifts & recordings', group: 'Navigation', icon: FiClock, path: '/attendance' },
      { id: 'nav-mango-tree', label: 'Mango Break Tree', subLabel: 'Gamified break tracking & rewards', group: 'Navigation', icon: FiCoffee, path: '/mango-tree', color: 'text-amber-500' },
      { id: 'nav-breaks', label: 'Breaks Log & History', subLabel: 'Break history & active requests', group: 'Navigation', icon: FiCoffee, path: '/breaks', color: 'text-amber-500' },
      { id: 'nav-tasks', label: 'Creative Tasks & Board', subLabel: 'Assigned tasks, deliverables & AI review', group: 'Navigation', icon: FiList, path: '/tasks' },
      { id: 'nav-feed', label: 'Academy Feed', subLabel: 'Tutorials, notices & academy guidelines', group: 'Navigation', icon: FiBookOpen, path: '/feed', color: 'text-indigo-400' },
      { id: 'nav-payroll', label: 'Work Wallet & Salary', subLabel: 'Earnings, payslips & advance requests', group: 'Navigation', icon: FiDollarSign, path: '/payroll', color: 'text-emerald-500' },
      { id: 'nav-credits', label: 'Credit Wallet & P2P Market', subLabel: 'Coin balance, transactions & overtime trade', group: 'Navigation', icon: FaCoins, path: '/credits', color: 'text-amber-500' },
      { id: 'nav-leave', label: 'Leave Requests & Balances', subLabel: 'Apply for leave & view balance history', group: 'Navigation', icon: FiCalendar, path: '/leave' },
      { id: 'nav-reports', label: 'Reports & Work Analytics', subLabel: 'Monthly work logs, export PDF/Excel', group: 'Navigation', icon: FiFileText, path: '/reports' },
      { id: 'nav-brand-kit', label: 'Brand Kit & Assets', subLabel: 'Official logos, colors & typography', group: 'Navigation', icon: HiSparkles, path: '/brand-kit', color: 'text-amber-400' },
      { id: 'nav-desktop-app', label: 'Desktop App & Updates', subLabel: 'Version check & standalone releases', group: 'Navigation', icon: FiDownload, path: '/desktop-app', color: 'text-cyan-500' },
      { id: 'nav-profile', label: 'My Profile', subLabel: 'Personal details, avatar & password', group: 'Navigation', icon: FiUser, path: '/profile' },
      { id: 'nav-settings', label: 'Settings', subLabel: 'Theme, sound FX & API endpoint config', group: 'Navigation', icon: FiSettings, path: '/settings' },
    ];

    if (isDevOrAdmin) {
      items.push(
        { id: 'nav-dev-overview', label: 'Developer Suite: Telemetry', subLabel: 'System status, engine metrics & maintenance', group: 'Developer Suite', icon: FiActivity, path: '/developer', color: 'text-cyan-400' },
        { id: 'nav-dev-impersonate', label: 'Developer Suite: User Impersonator', subLabel: 'Shadow login as any staff member', group: 'Developer Suite', icon: FiUsers, path: '/developer/impersonate', color: 'text-cyan-400' },
        { id: 'nav-dev-logs', label: 'Developer Suite: System Logs', subLabel: 'Live server PHP error_log viewer', group: 'Developer Suite', icon: FiFileText, path: '/developer/logs', color: 'text-cyan-400' },
        { id: 'nav-dev-api', label: 'Developer Suite: API & Sockets Tester', subLabel: 'Endpoint explorer & Pusher events', group: 'Developer Suite', icon: FiRadio, path: '/developer/api-tester', color: 'text-cyan-400' },
        { id: 'nav-dev-crons', label: 'Developer Suite: Crons & Automation', subLabel: 'Trigger auto-absent & system crons', group: 'Developer Suite', icon: FiClock, path: '/developer/crons', color: 'text-cyan-400' },
        { id: 'nav-dev-db', label: 'Developer Suite: Database & Cache', subLabel: 'R2 storage, MySQL snapshots & janitor', group: 'Developer Suite', icon: FiDatabase, path: '/developer/database', color: 'text-cyan-400' },
        { id: 'nav-dev-editor', label: 'Developer Suite: Server Code Editor', subLabel: 'Direct server PHP editor with opcache clear', group: 'Developer Suite', icon: FiCode, path: '/developer/editor', color: 'text-cyan-400' }
      );
    }

    return items.map(item => ({
      ...item,
      action: () => {
        if (onNavigate) onNavigate(item.path);
      }
    }));
  }, [isDevOrAdmin, onNavigate]);

  // Quick Action Items
  const quickActions = useMemo(() => [
    { 
      id: 'action-attendance-punch', 
      label: 'Open Attendance to Punch In / Out', 
      subLabel: 'Face verification & quick punch hub',
      group: 'Quick Actions', 
      icon: FiClock, 
      color: 'text-blue-500',
      action: () => onNavigate && onNavigate('/attendance') 
    },
    { 
      id: 'action-theme', 
      label: 'Toggle Dark / Light Theme', 
      subLabel: 'Switch application color appearance',
      group: 'Quick Actions', 
      icon: FiMoon, 
      color: 'text-indigo-400',
      action: () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('cca_theme', isDark ? 'dark' : 'light');
      } 
    },
    { 
      id: 'action-sidebar', 
      label: 'Toggle Sidebar (Collapse / Expand)', 
      subLabel: 'Maximize workspace viewing area',
      group: 'Quick Actions', 
      icon: FiSidebar, 
      shortcut: 'Ctrl+B',
      action: () => onToggleSidebar && onToggleSidebar() 
    },
    { 
      id: 'action-updates', 
      label: 'Check Desktop App Updates', 
      subLabel: 'Verify if a new version is available',
      group: 'Quick Actions', 
      icon: FiDownload, 
      color: 'text-cyan-400',
      action: () => onNavigate && onNavigate('/desktop-app') 
    },
  ], [onNavigate, onToggleSidebar]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    // Matching actions & navs
    const matchedActions = [...quickActions, ...navActions].filter(item => 
      item.label.toLowerCase().includes(q) || (item.subLabel && item.subLabel.toLowerCase().includes(q))
    );

    // Matching tasks if query is provided
    let matchedTasks = [];
    if (q && Array.isArray(tasks) && tasks.length > 0) {
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
          action: () => onNavigate && onNavigate(`/tasks?taskId=${t.id}`)
        }));
    }

    return [...matchedActions, ...matchedTasks];
  }, [query, quickActions, navActions, tasks, onNavigate]);

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
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 titlebar-no-drag select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-md animate-in fade-in duration-200" 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80">
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
            placeholder="Type a command or search sections (Dashboard, Attendance, Salary...)"
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
              <p className="text-sm font-bold">No matching commands found</p>
              <p className="text-xs mt-1 text-slate-500">Try searching for "Dashboard", "Punch In", "Salary" or "Developer".</p>
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
              Open
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CCA Spotlight Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
