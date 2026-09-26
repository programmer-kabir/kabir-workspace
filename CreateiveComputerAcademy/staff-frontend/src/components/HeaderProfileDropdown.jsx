import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiList, FiClock, FiSettings, FiLogOut, FiChevronDown, FiMessageSquare } from 'react-icons/fi';

const HeaderProfileDropdown = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setOpen(false);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleNav = (path) => {
    setOpen(false);
    navigate(path);
  };

  const avatarUrl = currentUser?.profile_picture
    ? `${import.meta.env.VITE_API_BASE_URL}${currentUser.profile_picture}`
    : null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 shadow-xs cursor-pointer group active:scale-95"
        title="Account & Quick Menu"
        aria-expanded={open}
      >
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={currentUser?.name || 'Staff'} className="w-full h-full object-cover" />
          ) : (
            <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}</span>
          )}
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
        </div>

        <span className="hidden sm:inline-block font-bold text-xs text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
          {currentUser?.name?.split(' ')[0] || 'Staff'}
        </span>

        <FiChevronDown
          size={13}
          className={`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={currentUser?.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                  {currentUser?.name || 'Staff Member'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md">
                    {currentUser?.employee_code || 'STAFF'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {currentUser?.department_name || 'Creative'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => handleNav('/profile')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <FiUser size={15} className="text-blue-500" />
              <span>My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('/tasks')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <FiList size={15} className="text-indigo-500" />
              <span>Task Board</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('/attendance')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <FiClock size={15} className="text-emerald-500" />
              <span>Attendance & Shifts</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('/messages')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <FiMessageSquare size={15} className="text-purple-500" />
              <span>Team Messages</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('/settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <FiSettings size={15} className="text-slate-400" />
              <span>Preferences</span>
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

          {/* Logout Action */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <FiLogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderProfileDropdown;
