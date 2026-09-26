import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiList, FiClock, FiMessageSquare, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const MobileBottomNav = ({ onOpenMenu }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/chat/get_chats.php', {
          user_id: currentUser.id
        });
        if (isMounted && res.data.status === 'success') {
          const count = res.data.chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (e) {
        // silent
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  const navItems = [
    { label: 'Home', path: '/', icon: <FiHome size={20} /> },
    { label: 'Tasks', path: '/tasks', icon: <FiList size={20} /> },
    { label: 'Chat', path: '/messages', icon: <FiMessageSquare size={20} />, badge: unreadCount },
    { label: 'Clock-in', path: '/attendance', icon: <FiClock size={20} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 shadow-2xl flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-4 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full shadow-xs" />
            )}
          </NavLink>
        );
      })}

      {/* Menu / Drawer Trigger */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-all active:scale-95 cursor-pointer"
        title="More options"
      >
        <FiMenu size={20} />
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
