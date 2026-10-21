import React, { useState, useEffect } from 'react';
import {
  FiHome, FiClock, FiList, FiCalendar, FiUser, FiLogOut, FiFileText,
  FiMessageSquare, FiSettings, FiCoffee, FiBookOpen, FiVideo,
  FiDollarSign, FiUsers, FiTerminal, FiChevronDown, FiActivity, FiRadio, FiDatabase, FiCode, FiDownload
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaCoins } from 'react-icons/fa6';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const DesktopSidebar = ({ 
  isOpen = true,
  activeTab = '/', 
  setActiveTab, 
  currentUser, 
  onLogout 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread chat count just like staff-frontend
  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchUnreadCount = async () => {
      try {
        const cleanBase = (API_BASE || '').replace(/\/+$/, '');
        const res = await axios.post(`${cleanBase}/api/chat/get_chats.php`, {
          user_id: currentUser.id
        }, {
          signal: abortController.signal
        });
        if (isMounted && res.data.status === 'success') {
          const count = (res.data.chats || []).reduce((total, chat) => total + (chat.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          // ignore error
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      abortController.abort();
    };
  }, [currentUser]);

  const deptName = currentUser?.department_name ? currentUser.department_name.toLowerCase() : '';
  const isContentTeam = deptName.includes('content') || deptName.includes('video');
  const isDeveloper = currentUser?.roles &&
    currentUser.roles.some(r => ['developer', 'admin'].includes(r));

  const isDevRoute = activeTab.startsWith('/developer');
  const [devMenuOpen, setDevMenuOpen] = useState(() => {
    const saved = localStorage.getItem('cca_desktop_dev_menu_open');
    if (saved !== null) return saved === 'true';
    return isDevRoute;
  });

  const toggleDevMenu = () => {
    setDevMenuOpen(prev => {
      const next = !prev;
      localStorage.setItem('cca_desktop_dev_menu_open', String(next));
      return next;
    });
  };

  const devSubMenuItems = [
    { name: 'Overview', path: '/developer', icon: <FiActivity size={14} /> },
    { name: 'User Impersonator', path: '/developer/impersonate', icon: <FiUsers size={14} /> },
    { name: 'System Logs', path: '/developer/logs', icon: <FiFileText size={14} /> },
    { name: 'API & Sockets', path: '/developer/api-tester', icon: <FiRadio size={14} /> },
    { name: 'Crons & Auto', path: '/developer/crons', icon: <FiClock size={14} /> },
    { name: 'Database & Cache', path: '/developer/database', icon: <FiDatabase size={14} /> },
    { name: 'Server Code Editor', path: '/developer/editor', icon: <FiCode size={14} /> },
  ];

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome size={19} /> },
    { name: 'Community Wall', path: '/community', icon: <FiUsers size={19} className="text-violet-500 group-hover:text-violet-400" /> },
    { name: 'Message', path: '/messages', icon: <FiMessageSquare size={19} /> },
    { name: 'Attendance', path: '/attendance', icon: <FiClock size={19} /> },
    { name: 'Desktop App & Updates', path: '/desktop-app', icon: <FiDownload size={19} className="text-cyan-500 group-hover:text-cyan-400" /> },
    { name: 'Mango Break Tree', path: '/mango-tree', icon: <span className="text-lg">🥭</span> },
    { name: 'Breaks Log', path: '/breaks', icon: <FiCoffee size={19} className="text-amber-500 group-hover:text-amber-400" /> },
    // Content Team gets Content Studio, Other staff gets Tasks
    ...(isContentTeam
      ? [{ name: 'Content Studio', path: '/content-studio', icon: <FiVideo size={19} className="text-rose-500 group-hover:text-rose-400" /> }]
      : [{ name: 'Tasks', path: '/tasks', icon: <FiList size={19} /> }]),
    { name: 'Academy Feed', path: '/feed', icon: <FiBookOpen size={19} className="text-indigo-400 group-hover:text-indigo-300" /> },
    { name: 'Work Wallet & Salary', path: '/payroll', icon: <FiDollarSign size={19} className="text-emerald-500 group-hover:text-emerald-400" /> },
    { name: 'Credit Wallet', path: '/credits', icon: <FaCoins size={18} className="text-amber-500 group-hover:text-amber-400" /> },
    { name: 'Leave', path: '/leave', icon: <FiCalendar size={19} /> },
    { name: 'Reports', path: '/reports', icon: <FiFileText size={19} /> },
    { name: 'Brand Kit', path: '/brand-kit', icon: <HiSparkles size={19} className="text-amber-400" /> },
    { name: 'Profile', path: '/profile', icon: <FiUser size={19} /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings size={19} /> },
  ];

  const cleanBase = (API_BASE || '').replace(/\/+$/, '');
  const avatarUrl = currentUser?.profile_picture
    ? (currentUser.profile_picture.startsWith('http') ? currentUser.profile_picture : `${cleanBase}/${currentUser.profile_picture.replace(/^\/+/, '')}`)
    : null;

  return (
    <aside
      style={{ willChange: 'transform, width, opacity' }}
      className={`bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 h-full flex flex-col shadow-2xl lg:shadow-xl border-r border-slate-200 dark:border-slate-800 z-40 overflow-hidden shrink-0 select-none transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'
      }`}
    >
      <div className="w-64 h-full flex flex-col shrink-0">
        
        {/* Exact Logo / Brand Area matching staff-frontend */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img src="./logo.png" alt="CCA Logo" className="w-8 h-8 rounded-lg object-contain drop-shadow-xs shrink-0" />
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-wide truncate">
              CCA<span className="text-primary-600 dark:text-primary-400 drop-shadow-sm">Staff</span>
            </h1>
          </div>
          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 tracking-wider">
            App
          </span>
        </div>

        {/* Navigation Menu matching staff-frontend */}
        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = activeTab === item.path;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveTab(item.path)}
                  className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ease-out overflow-hidden cursor-pointer ${
                    isActive
                      ? 'bg-primary-50/90 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] font-black'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1 font-bold text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {/* Subtle active state glow background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent dark:from-primary-400/10 dark:via-primary-400/5 opacity-70 pointer-events-none"></div>
                  )}

                  {/* Active indicator bar on the left */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full bg-primary-600 dark:bg-primary-400 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out ${
                      isActive ? 'h-4/5 opacity-100' : 'h-0 opacity-0 group-hover:h-1/2 group-hover:opacity-40'
                    }`}
                  ></div>

                  <div className="flex items-center gap-3 relative z-10 min-w-0">
                    <div
                      className={`transition-all duration-300 transform group-hover:scale-110 shrink-0 ${
                        isActive ? 'drop-shadow-md text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs lg:text-sm tracking-wide truncate">{item.name}</span>
                  </div>

                  {item.name === 'Message' && unreadCount > 0 && (
                    <span className="relative z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse group-hover:scale-110 transition-transform">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Dedicated Collapsible Dev Console for Developer & Admin */}
            {isDeveloper && (
              <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={toggleDevMenu}
                  className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ease-out overflow-hidden cursor-pointer ${
                    isDevRoute
                      ? 'bg-primary-50/90 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] font-black'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1 font-bold text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isDevRoute && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent dark:from-primary-400/10 dark:via-primary-400/5 opacity-70 pointer-events-none"></div>
                  )}

                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full bg-primary-600 dark:bg-primary-400 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out ${
                      isDevRoute ? 'h-4/5 opacity-100' : 'h-0 opacity-0 group-hover:h-1/2 group-hover:opacity-40'
                    }`}
                  ></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div
                      className={`transition-all duration-300 transform group-hover:scale-110 ${
                        isDevRoute ? 'drop-shadow-md text-primary-600 dark:text-primary-400' : 'text-cyan-500 group-hover:text-cyan-400'
                      }`}
                    >
                      <FiTerminal size={19} />
                    </div>
                    <span className="text-xs lg:text-sm tracking-wide">Developer Suite</span>
                  </div>

                  <div className="relative z-10 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[9px] font-black uppercase tracking-wider">
                      DEV
                    </span>
                    <FiChevronDown
                      size={15}
                      className={`text-slate-400 transition-transform duration-300 ease-out ${
                        devMenuOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Sub-items */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    devMenuOpen ? 'max-h-72 opacity-100 mt-1.5' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4.5 my-1">
                    {devSubMenuItems.map((sub) => {
                      const isSubActive = activeTab === sub.path;
                      return (
                        <button
                          key={sub.path}
                          type="button"
                          onClick={() => setActiveTab(sub.path)}
                          className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                            isSubActive
                              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black shadow-2xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`transition-colors ${
                                isSubActive
                                  ? 'text-cyan-600 dark:text-cyan-400'
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-500'
                              }`}
                            >
                              {sub.icon}
                            </div>
                            <span className="truncate">{sub.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* User Info / Logout Area matching staff-frontend */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 transition-colors duration-300">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-600/30 flex items-center justify-center text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700/50 font-black uppercase shadow-2xs overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name ? currentUser.name.charAt(0) : 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs lg:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser?.name || 'Staff Member'}
                </p>
                {isDeveloper && (
                  <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[8px] font-black uppercase tracking-wider shrink-0">
                    DEV
                  </span>
                )}
              </div>
              <p className="text-[9px] lg:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
                {currentUser?.employee_code || 'Pending ID'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 shadow-2xs transition-all duration-200 font-bold text-xs lg:text-sm uppercase tracking-wider cursor-pointer"
          >
            <FiLogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
