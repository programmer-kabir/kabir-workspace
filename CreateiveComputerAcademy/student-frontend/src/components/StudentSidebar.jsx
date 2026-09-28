import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiClock, FiCheckSquare, FiBookOpen,
  FiUser, FiLogOut, FiAward, FiCompass, FiPlayCircle,
  FiFolder, FiChevronDown, FiMousePointer, FiZap, FiBarChart2, FiPenTool, FiTarget, FiStar, FiFileText
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const StudentSidebar = ({ isOpen = true }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route is part of Speed Labs
  const isLabActive = ['/foundations', '/typing', '/pen-tool', '/pen-tool/advanced', '/lumi-odyssey', '/skill-report', '/leaderboard'].includes(location.pathname);
  const [isLabOpen, setIsLabOpen] = useState(true);

  // Auto-expand folder when visiting lab routes
  useEffect(() => {
    if (isLabActive) {
      setIsLabOpen(true);
    }
  }, [location.pathname, isLabActive]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const topMenuItems = [
    { name: 'Dashboard', path: '/', icon: <FiGrid size={18} /> },
  ];

  const labSubItems = [
    {
      name: 'Mouse & Foundations',
      path: '/foundations',
      icon: <FiMousePointer size={17} />
    },
    {
      name: 'Typing Academy',
      path: '/typing',
      icon: <FiZap size={17} />
    },
    {
      name: 'Pen Tool Space Game',
      path: '/lumi-odyssey',
      icon: <FiCompass size={17} />
    },
    {
      name: 'Pen Tool Master Lab',
      path: '/pen-tool',
      icon: <FiPenTool size={17} />
    },
    {
      name: 'Skill Report & Certificate',
      path: '/skill-report',
      icon: <FiBarChart2 size={17} />
    },
    {
      name: 'Hall of Fame / Leaderboard',
      path: '/leaderboard',
      icon: <FiAward size={17} />
    }
  ];

  const bottomMenuItems = [
    { name: 'Daily Work Log', path: '/daily-log', icon: <FiFileText size={18} /> },
    { name: 'Explore All Courses', path: '/courses', icon: <FiCompass size={18} /> },
    { name: 'Daily Attendance', path: '/attendance', icon: <FiClock size={18} /> },
    { name: 'Assignments & Projects', path: '/assignments', icon: <FiCheckSquare size={18} /> },
    { name: 'Course Resources', path: '/resources', icon: <FiBookOpen size={18} /> },
    { name: 'Student Profile & ID', path: '/profile', icon: <FiUser size={18} /> },
  ];

  return (
    <aside
      className={`h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-40 shrink-0 ${isOpen ? 'w-64' : 'w-20'
        }`}
    >
      {/* Brand Header */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-xs">
            <img
              src="/favicons.png"
              alt="CCA Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/cca_logo.png';
              }}
            />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate">
                Student Portal
              </h1>
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                Creative Computer Academy
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2">
          {/* Dashboard */}
          {topMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${isActive
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${!isOpen && 'justify-center px-0'}`
              }
              title={!isOpen ? item.name : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}

          {/* ── COLLAPSIBLE FOLDER: PRACTICE & SPEED LABS ── */}
          <div className="pt-1.5 pb-1">
            {isOpen ? (
              <div className="space-y-1">
                {/* Folder Header */}
                <button
                  type="button"
                  onClick={() => setIsLabOpen(!isLabOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${isLabActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <FiFolder className={isLabActive ? 'text-indigo-500' : 'text-slate-400'} size={15} />
                    <span>Practice & Speed Labs</span>
                  </div>
                  <FiChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isLabOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>

                {/* Nested Sub-links */}
                {isLabOpen && (
                  <div className="space-y-1 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-3.5 my-1">
                    {labSubItems.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${isActive
                            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-500/25 scale-[1.02]'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          }`
                        }
                      >
                        <div className="shrink-0">{sub.icon}</div>
                        <span className="truncate">{sub.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed Sidebar Icon Mode */
              <div className="space-y-1">
                {labSubItems.map((sub) => (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end
                    className={({ isActive }) =>
                      `flex items-center justify-center p-3 rounded-2xl text-sm font-bold transition-all ${isActive
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                    title={sub.name}
                  >
                    {sub.icon}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Standard Navigation Links */}
          {bottomMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${isActive
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${!isOpen && 'justify-center px-0'}`
              }
              title={!isOpen ? item.name : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
        {isOpen ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-sm overflow-hidden">
                {currentUser?.profile_picture ? (
                  <img src={`${API_BASE}${currentUser.profile_picture}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0)?.toUpperCase() || 'S'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Student'}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  {currentUser?.student_info?.student_code || currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default StudentSidebar;
