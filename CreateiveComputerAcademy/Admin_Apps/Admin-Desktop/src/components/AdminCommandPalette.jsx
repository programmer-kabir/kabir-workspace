import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FiSearch, FiGrid, FiUsers, FiDollarSign, FiAward, FiVideo,
  FiBookOpen, FiFileText, FiCheckSquare, FiClock, FiMonitor,
  FiFilm, FiAlertTriangle, FiCalendar, FiBarChart2, FiShare2,
  FiMessageSquare, FiDatabase, FiHardDrive, FiDownloadCloud,
  FiCode, FiSettings, FiUser, FiMoon, FiSun, FiSidebar,
  FiRefreshCw, FiCornerDownLeft, FiX
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { soundFx } from '../utils/soundFx';

const AdminCommandPalette = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onToggleSidebar, 
  currentUser 
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
      try { soundFx.playPop(); } catch (e) {}
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

  // All 30 Executive Modules
  const navActions = useMemo(() => {
    return [
      { id: 'dashboard', label: 'Executive Dashboard', subLabel: 'Real-time company stats & live staff status', group: 'Overview', icon: FiGrid, path: 'dashboard' },
      { id: 'staff', label: 'Staff Directory', subLabel: 'Employee directory, roles & profile view', group: 'Workforce', icon: FiUsers, path: 'staff' },
      { id: 'payroll', label: 'Payroll & Schemes', subLabel: 'Staff compensation, schemes & payment approval', group: 'Finance', icon: FiDollarSign, path: 'payroll', color: 'text-emerald-500' },
      { id: 'reviewers', label: 'Reviewer Directory', subLabel: 'Task quality reviewers & grading performance', group: 'Workforce', icon: FiAward, path: 'reviewers' },
      { id: 'content-studio', label: 'Content Studio Admin', subLabel: 'Media production, video content & marketing assets', group: 'Creative', icon: FiVideo, path: 'content-studio', color: 'text-rose-500' },
      
      { id: 'students', label: 'Student Directory', subLabel: 'Active academy students, enrollment & courses', group: 'Academics', icon: FiBookOpen, path: 'students' },
      { id: 'student-daily-logs', label: 'Student Daily Work Logs', subLabel: 'Daily progress, instructor reviews & submissions', group: 'Academics', icon: FiFileText, path: 'student-daily-logs' },
      { id: 'courses', label: 'Courses & Curriculum', subLabel: 'Curriculum structure, batches & syllabus editor', group: 'Academics', icon: FiBookOpen, path: 'courses' },
      { id: 'typing-reports', label: 'Typing Master Reports', subLabel: 'Speed, accuracy & typing progress tracking', group: 'Academics', icon: FiFileText, path: 'typing-reports' },
      { id: 'pentool-reports', label: 'Pen Tool Master Reports', subLabel: 'Graphic design precision & vector exercises', group: 'Academics', icon: FiFileText, path: 'pentool-reports' },

      { id: 'tasks', label: 'Task Oversight', subLabel: 'Agentic AI & manual task Kanban board', group: 'Operations', icon: FiCheckSquare, path: 'tasks' },
      { id: 'screen-monitor', label: 'Live Screen Surveillance', subLabel: 'Real-time WebRTC multi-screen monitor 🛰️', group: 'Attendance & Surveillance', icon: FiMonitor, path: 'screen-monitor', color: 'text-blue-500' },
      { id: 'workstation-videos', label: 'Workstation Video Vault', subLabel: 'Continuous recording logs & session downloads 🎥', group: 'Attendance & Surveillance', icon: FiFilm, path: 'workstation-videos', color: 'text-indigo-400' },
      { id: 'idle-alerts', label: 'Inactivity Alarms & Watchdog', subLabel: 'Idle alerts, hardware warnings & staff timeout ⏳', group: 'Attendance & Surveillance', icon: FiAlertTriangle, path: 'idle-alerts', color: 'text-amber-500' },
      { id: 'attendance', label: 'Daily Attendance Roster', subLabel: 'Daily punch logs, shifts, IP & GPS compliance', group: 'Attendance & Surveillance', icon: FiClock, path: 'attendance' },
      { id: 'leave', label: 'Leave Approvals', subLabel: 'Employee leave requests, approvals & quota', group: 'Attendance & Surveillance', icon: FiCalendar, path: 'leave' },
      { id: 'attendance-disputes', label: 'Attendance Disputes', subLabel: 'Staff dispute claims, time adjustments & resolution', group: 'Attendance & Surveillance', icon: FiAlertTriangle, path: 'attendance-disputes' },

      { id: 'master-report', label: 'Company Master Report', subLabel: 'Cross-organization metrics, attendance & KPIs', group: 'Analytics', icon: FiBarChart2, path: 'master-report' },
      { id: 'reports', label: 'Staff Reports', subLabel: 'Monthly performance, hours worked & productivity', group: 'Analytics', icon: FiBarChart2, path: 'reports' },
      { id: 'reviewer-report', label: 'Reviewer Reports', subLabel: 'Grading audit, feedback speed & bonus earnings', group: 'Analytics', icon: FiBarChart2, path: 'reviewer-report' },

      { id: 'community', label: 'Community Social Wall', subLabel: 'Staff feed, stories, achievements & social wall', group: 'Communication', icon: FiShare2, path: 'community', color: 'text-violet-400' },
      { id: 'blogs', label: 'Academy Feed & Blogs', subLabel: 'Tutorials, notices, guidelines & public blogs', group: 'Communication', icon: FiBookOpen, path: 'blogs', color: 'text-indigo-400' },
      { id: 'messages', label: 'Direct Messages & Chat', subLabel: 'End-to-end encrypted admin & staff communication', group: 'Communication', icon: FiMessageSquare, path: 'messages' },

      { id: 'brand-resources', label: 'Brand Kit & Assets', subLabel: 'Official logos, fonts, palettes & design assets', group: 'System & Tools', icon: HiSparkles, path: 'brand-resources', color: 'text-amber-400' },
      { id: 'database', label: 'Database & System Telemetry', subLabel: 'Raw SQL runner, table explorer & schema telemetry', group: 'System & Tools', icon: FiDatabase, path: 'database' },
      { id: 'storage-settings', label: 'Cloud Vault & Storage', subLabel: 'Cloudflare R2, Google Drive & local disk manager', group: 'System & Tools', icon: FiHardDrive, path: 'storage-settings', color: 'text-cyan-400' },
      { id: 'app-releases', label: 'App Version Control', subLabel: 'Publish desktop installers & mandatory force update', group: 'System & Tools', icon: FiDownloadCloud, path: 'app-releases', color: 'text-indigo-400' },
      { id: 'server-editor', label: 'Server Code Editor', subLabel: 'Direct Hostinger server tree & live code editor', group: 'System & Tools', icon: FiCode, path: 'server-editor', color: 'text-emerald-400' },
      { id: 'settings', label: 'System & Security Settings', subLabel: 'Geofence GPS, IP whitelists & category presets', group: 'System & Tools', icon: FiSettings, path: 'settings' },
      { id: 'profile', label: 'Admin Profile & Security', subLabel: 'Change avatar, password, username & credentials', group: 'Account', icon: FiUser, path: 'profile' }
    ];
  }, []);

  // Quick Utility Actions
  const utilActions = useMemo(() => {
    return [
      {
        id: 'toggle-theme',
        label: 'Toggle Dark / Light Theme',
        subLabel: 'Switch current visual appearance',
        group: 'Quick Controls',
        icon: FiMoon,
        action: () => {
          const current = localStorage.getItem('theme') || 'dark';
          const next = current === 'dark' ? 'light' : 'dark';
          if (next === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', next);
          onClose();
        }
      },
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar Expand/Collapse',
        subLabel: 'Keyboard shortcut: Ctrl+B',
        group: 'Quick Controls',
        icon: FiSidebar,
        action: () => {
          if (onToggleSidebar) onToggleSidebar();
          onClose();
        }
      },
      {
        id: 'reload-window',
        label: 'Reload Desktop Window',
        subLabel: 'Soft-refresh UI and purge in-memory cache',
        group: 'Quick Controls',
        icon: FiRefreshCw,
        action: () => {
          window.location.reload();
        }
      }
    ];
  }, [onToggleSidebar, onClose]);

  // Combined and filtered actions
  const filteredActions = useMemo(() => {
    const all = [...navActions, ...utilActions];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.subLabel.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    );
  }, [navActions, utilActions, query]);

  // Keyboard Navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e) => {
    if (filteredActions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      scrollSelectedIntoView((selectedIndex + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      scrollSelectedIntoView((selectedIndex - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeAction(filteredActions[selectedIndex]);
    }
  };

  const scrollSelectedIntoView = (index) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-command-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const executeAction = (action) => {
    if (!action) return;
    try { soundFx.playClick(); } catch (e) {}
    if (action.action) {
      action.action();
    } else if (action.path) {
      onNavigate(action.path);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
          <FiSearch className="text-slate-400 shrink-0 mr-3" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or module name (e.g., Staff, Screen, Editor, Database)..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/80 shrink-0 ml-2">
            ESC to close
          </span>
          <button 
            type="button" 
            onClick={onClose}
            className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2 cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Action List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar"
        >
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching modules or actions found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  data-command-item
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Icon size={16} className={isSelected ? 'text-white' : action.color || ''} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{action.label}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300/40 dark:border-slate-700'
                        }`}>
                          {action.group}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {action.subLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg">
                        <span>Select</span>
                        <FiCornerDownLeft size={10} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↑</kbd> <kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↓</kbd> to navigate</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↵</kbd> to open</span>
          </div>
          <span className="font-bold text-blue-500 dark:text-blue-400">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPalette;
