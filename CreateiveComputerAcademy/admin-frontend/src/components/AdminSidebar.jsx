import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiUsers, FiCheckSquare, FiClock, FiCalendar, FiSettings, FiLogOut, FiBarChart2, FiMessageSquare, FiDatabase, FiChevronDown, FiBookOpen, FiLayers, FiAward, FiVideo } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminSidebar = ({ isOpen = true }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDisputes, setPendingDisputes] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchCounts = async () => {
      try {
        const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/chat/get_chats.php', {
          user_id: currentUser.id
        });
        if (res.data.status === 'success') {
          const count = res.data.chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Error fetching unread count', error);
      }

      try {
        const res = await axios.get((import.meta.env.VITE_API_BASE_URL) + 'api/admin/attendance/get_pending_disputes_count.php');
        if (res.data.status === 'success') {
          setPendingDisputes(res.data.count);
        }
      } catch (error) {
        console.error('Error fetching disputes count', error);
      }
    };

    if (currentUser?.id) {
      fetchCounts();
      const interval = setInterval(() => {
        if (!document.hidden) fetchCounts();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FiGrid size={18} /> },
    { name: 'Staff Directory', path: '/staff', icon: <FiUsers size={18} /> },
    { name: 'Reviewer Directory', path: '/reviewers', icon: <FiAward size={18} /> },
    { name: 'Content Studio', path: '/content-studio', icon: <FiVideo size={18} className="text-rose-500" /> },
    {
      name: 'Students & Academics',
      icon: <FiBookOpen size={18} />,
      subItems: [
        { name: 'Student Directory', path: '/students' },
        { name: 'Daily Work Logs & Reviews', path: '/student-daily-logs' },
        { name: 'Courses & Curriculum', path: '/courses' },
        { name: 'Typing Master Reports', path: '/typing-reports' },
        { name: 'Pen Tool Master Reports', path: '/pentool-reports' }
      ]
    },
    { name: 'Task Oversight', path: '/tasks', icon: <FiCheckSquare size={18} /> },
    {
      name: 'Work & Attendance',
      icon: <FiClock size={18} />,
      badge: pendingDisputes,
      subItems: [
        { name: 'Daily Roster', path: '/attendance' },
        { name: 'Leave Approvals', path: '/leave' },
        { name: 'Attendance Disputes', path: '/attendance-disputes', badge: pendingDisputes }
      ]
    },
    {
      name: 'Reports & Analytics',
      icon: <FiBarChart2 size={18} />,
      subItems: [
        { name: 'Company Master Report', path: '/master-report' },
        { name: 'Typing Master Reports', path: '/typing-reports' },
        { name: 'Pen Tool Master Reports', path: '/pentool-reports' },
        { name: 'Staff Reports', path: '/reports' },
        { name: 'Reviewer Reports', path: '/reviewer-report' }
      ]
    },
    { name: 'Academy Feed / Blog', path: '/blogs', icon: <FiBookOpen size={18} className="text-indigo-500" /> },
    { name: 'Message', path: '/messages', icon: <FiMessageSquare size={18} /> },
    { name: 'Brand Kit & Assets', path: '/brand-resources', icon: <HiSparkles size={18} className="text-amber-400" /> },
    { name: 'Database Manager', path: '/database', icon: <FiDatabase size={18} /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings size={18} /> },
  ];

  // Auto-expand menu on active child
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path)));
        if (isChildActive) {
          setOpenMenus(prev => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [location.pathname]);

  return (
    <aside
      className={`bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 h-screen flex flex-col shadow-xl border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out z-50 overflow-hidden shrink-0 ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
        }`}
    >
      <div className="w-64 h-full flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <img src="/logo.png" alt="CCA Logo" className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" />
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1">
              CCA <span className="text-blue-600 dark:text-blue-500">Admin</span>
            </h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar px-3">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              if (item.subItems) {
                const isOpen = openMenus[item.name];
                const isAnyChildActive = item.subItems.some(sub => location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path)));

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${isAnyChildActive || isOpen
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 ${isAnyChildActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{item.icon}</span>
                        <span className="truncate text-sm">{item.name}</span>
                        {item.badge > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <FiChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
                    </button>

                    {isOpen && (
                      <div className="relative ml-5 pl-3.5 space-y-1 my-1 border-l-2 border-slate-200/90 dark:border-slate-800 animate-in slide-in-from-top-1 duration-150">
                        {item.subItems.map(sub => {
                          const isSubActive = location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path));
                          return (
                            <NavLink
                              key={sub.name}
                              to={sub.path}
                              className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isSubActive
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
                              <span className="truncate text-sm">{sub.name}</span>
                              {sub.badge > 0 && (
                                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs ml-2 shrink-0">
                                  {sub.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border-l-4 border-blue-600 dark:border-blue-500 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate text-sm">{item.name}</span>
                  </div>
                  {item.name === 'Message' && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs shadow-2xs overflow-hidden shrink-0">
                {currentUser?.profile_picture ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${currentUser.profile_picture}`}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">{currentUser?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{currentUser?.email || 'admin@cca.com'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
              title="Sign Out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
