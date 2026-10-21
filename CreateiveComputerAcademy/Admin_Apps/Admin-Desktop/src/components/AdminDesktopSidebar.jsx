import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiCheckSquare, FiClock, FiCalendar, FiSettings,
  FiLogOut, FiBarChart2, FiMessageSquare, FiDatabase, FiChevronDown,
  FiBookOpen, FiAward, FiVideo, FiDollarSign, FiShare2, FiMonitor,
  FiHardDrive, FiDownloadCloud, FiCode, FiFilm, FiUser, FiExternalLink
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import axios from 'axios';
import { getApiBase } from '../context/AuthContext';

const AdminDesktopSidebar = ({
  isOpen = true,
  activeTab = 'dashboard',
  setActiveTab,
  currentUser,
  onLogout
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDisputes, setPendingDisputes] = useState(0);
  const [idleAlertCount, setIdleAlertCount] = useState(0);

  // Accordion open/close state, defaulting Work & Attendance to open matching the admin site view
  const [openMenus, setOpenMenus] = useState({
    'Work & Attendance': true
  });

  const toggleMenu = (name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Poll for counts from backend
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchCounts = async () => {
      const apiBase = getApiBase();

      try {
        const res = await axios.post(`${apiBase}api/chat/get_chats.php`, {
          user_id: currentUser.id
        });
        if (res.data?.status === 'success') {
          const count = res.data.chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (e) {
        // Non-blocking
      }

      try {
        const res = await axios.get(`${apiBase}api/admin/attendance/get_pending_disputes_count.php`);
        if (res.data?.status === 'success') {
          setPendingDisputes(res.data.count || 0);
        }
      } catch (e) {
        // Non-blocking
      }

      try {
        const res = await axios.get(`${apiBase}api/admin/screen_monitor/get_idle_alerts.php?status=idle&limit=1`);
        if (res.data?.status === 'success' && res.data.data?.stats) {
          setIdleAlertCount(res.data.data.stats.currently_idle_count || 0);
        }
      } catch (e) {
        // Non-blocking
      }
    };

    fetchCounts();
    const interval = setInterval(() => {
      if (!document.hidden) fetchCounts();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const menuItems = [
    { id: 'dashboard', path: '/', name: 'Dashboard', icon: <FiGrid size={18} /> },
    { id: 'staff', path: '/staff', name: 'Staff Directory', icon: <FiUsers size={18} /> },
    { id: 'payroll', path: '/payroll', name: 'Payroll & Schemes', icon: <FiDollarSign size={18} className="text-emerald-400" /> },
    { id: 'reviewers', path: '/reviewers', name: 'Reviewer Directory', icon: <FiAward size={18} /> },
    { id: 'content-studio', path: '/content-studio', name: 'Content Studio', icon: <FiVideo size={18} className="text-rose-500" /> },
    {
      name: 'Students & Academics',
      icon: <FiBookOpen size={18} />,
      subItems: [
        { id: 'students', path: '/students', name: 'Student Directory' },
        { id: 'student-daily-logs', path: '/student-daily-logs', name: 'Daily Work Logs & Reviews' },
        { id: 'courses', path: '/courses', name: 'Courses & Curriculum' },
        { id: 'typing-reports', path: '/typing-reports', name: 'Typing Master Reports' },
        { id: 'pentool-reports', path: '/pentool-reports', name: 'Pen Tool Master Reports' }
      ]
    },
    { id: 'tasks', path: '/tasks', name: 'Task Oversight', icon: <FiCheckSquare size={18} /> },
    {
      name: 'Work & Attendance',
      icon: <FiClock size={18} />,
      badge: (pendingDisputes || 0) + (idleAlertCount || 0),
      subItems: [
        { id: 'screen-monitor', path: '/screen-monitor', name: 'Live Screen Monitor 🛰️' },
        { id: 'workstation-videos', path: '/workstation-video-logs', name: 'Workstation Video Vault...' },
        { id: 'idle-alerts', path: '/idle-alerts', name: 'Inactivity Alerts ⏳', badge: idleAlertCount },
        { id: 'attendance', path: '/attendance', name: 'Daily Roster' },
        { id: 'leave', path: '/leave', name: 'Leave Approvals' },
        { id: 'attendance-disputes', path: '/attendance-disputes', name: 'Attendance Disputes', badge: pendingDisputes }
      ]
    },
    {
      name: 'Reports & Analytics',
      icon: <FiBarChart2 size={18} />,
      subItems: [
        { id: 'master-report', path: '/master-report', name: 'Company Master Report' },
        { id: 'typing-reports', path: '/typing-reports', name: 'Typing Master Reports' },
        { id: 'pentool-reports', path: '/pentool-reports', name: 'Pen Tool Master Reports' },
        { id: 'reports', path: '/reports', name: 'Staff Reports' },
        { id: 'reviewer-report', path: '/reviewer-report', name: 'Reviewer Reports' }
      ]
    },
    { id: 'community', path: '/community', name: 'Community Wall', icon: <FiShare2 size={18} className="text-violet-400" /> },
    { id: 'blogs', path: '/blogs', name: 'Academy Feed / Blog', icon: <FiBookOpen size={18} className="text-indigo-400" /> },
    { id: 'messages', path: '/messages', name: 'Message', icon: <FiMessageSquare size={18} />, badge: unreadCount },
    { id: 'brand-resources', path: '/brand-resources', name: 'Brand Kit & Assets', icon: <HiSparkles size={18} className="text-amber-400" /> },
    { id: 'database', path: '/database', name: 'Database Manager', icon: <FiDatabase size={18} /> },
    { id: 'storage-settings', path: '/storage-settings', name: 'Cloud Vault & Storage', icon: <FiHardDrive size={18} className="text-cyan-400" /> },
    { id: 'app-releases', path: '/app-releases', name: 'App Version Control', icon: <FiDownloadCloud size={18} className="text-indigo-400" /> },
    { id: 'server-editor', path: '/server-editor', name: 'Server Code Editor', icon: <FiCode size={18} className="text-emerald-400" /> },
    { id: 'settings', path: '/settings', name: 'Settings', icon: <FiSettings size={18} /> },
    { id: 'profile', path: '/profile', name: 'Profile', icon: <FiUser size={18} /> },
  ];

  // Auto-expand accordion if active child matches
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => sub.id === activeTab || sub.path === activeTab);
        if (isChildActive) {
          setOpenMenus(prev => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [activeTab]);

  const handleOpenWebsite = (e) => {
    e.preventDefault();
    const url = 'https://creativecomputeracademybd.com';
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
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
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-full flex flex-col shadow-xl z-40 overflow-hidden shrink-0 select-none transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'
      }`}
    >
      <div className="w-64 h-full flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <img src="./logo.png" alt="CCA Logo" className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" />
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
              CCA <span className="text-blue-600 dark:text-blue-500">Admin</span>
            </h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-3 overflow-y-auto custom-scrollbar px-3 space-y-1">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              if (item.subItems) {
                const isMenuOpen = openMenus[item.name];
                const isAnyChildActive = item.subItems.some(
                  sub => sub.id === activeTab || sub.path === activeTab
                );

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                        isAnyChildActive || isMenuOpen
                          ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 ${isAnyChildActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.name}</span>
                        {item.badge > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <FiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                          isMenuOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                    </button>

                    {isMenuOpen && (
                      <div className="relative ml-5 pl-3.5 space-y-1 my-1 border-l-2 border-slate-200/90 dark:border-slate-800 animate-in slide-in-from-top-1 duration-150">
                        {item.subItems.map((sub) => {
                          const isSubActive = activeTab === sub.id || activeTab === sub.path;
                          return (
                            <button
                              key={sub.name}
                              type="button"
                              onClick={() => setActiveTab(sub.id || sub.path)}
                              className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer text-left ${
                                isSubActive
                                  ? 'bg-blue-600 !text-white font-bold shadow-sm shadow-blue-500/25'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              {/* Hierarchy branch indicator line */}
                              <span
                                className={`absolute -left-[16px] top-1/2 -translate-y-1/2 w-2.5 h-[2px] rounded-full transition-colors ${
                                  isSubActive
                                    ? 'bg-blue-600 dark:bg-blue-500'
                                    : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'
                                }`}
                              />
                              <span className="truncate">{sub.name}</span>
                              {sub.badge > 0 && (
                                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs ml-2 shrink-0">
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = activeTab === item.id || activeTab === item.path;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveTab(item.id || item.path)}
                  className={`w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border-l-4 border-blue-600 dark:border-blue-500 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 transition-transform ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs shrink-0 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Website Card matching Screenshot */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/70 shrink-0 space-y-2 transition-colors">
          <a
            href="https://creativecomputeracademybd.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenWebsite}
            className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#10192e] transition group cursor-pointer shadow-2xs"
            title="Visit Creative Computer Academy Website"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-xs border border-slate-100 dark:border-transparent">
                <img src="./logo.png" alt="CCA Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Creative Computer Ac...
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  creativecomputeracademybd...
                </p>
              </div>
            </div>
            <FiExternalLink size={15} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
          </a>

          {/* Quick Profile & Logout Bar */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition cursor-pointer text-left group"
              title="View Admin Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs overflow-hidden shrink-0 ring-1 ring-blue-500/20 group-hover:ring-blue-500/50">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={currentUser?.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {currentUser?.name || 'Administrator'}
                </p>
                <p className="text-[9px] text-slate-500 truncate">
                  {currentUser?.email || 'admin@cca.com'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
              title="Logout"
            >
              <FiLogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminDesktopSidebar;
