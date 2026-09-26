import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { toast, Toaster } from 'sonner';
import Pusher from 'pusher-js';
import { FiSidebar } from 'react-icons/fi';

const AdminLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';

  // Sidebar toggle state (persisted in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    try {
      const saved = localStorage.getItem('cca_admin_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cca_admin_sidebar_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;
    
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);
    
    channel.bind('new-notification', function(data) {
      toast.info(data.title, {
        description: data.message,
      });
      window.dispatchEvent(new Event('new-notification-received'));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser]);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-xs relative z-30 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 group ${
                isSidebarOpen
                  ? 'bg-slate-100/80 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 ring-2 ring-blue-500/15'
              }`}
              title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
              aria-label="Toggle Sidebar"
            >
              <FiSidebar
                size={18}
                className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}
              />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              Administrator Console
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell portal="admin" />
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0">
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
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{currentUser?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 min-h-0 ${isMessagesPage ? 'overflow-hidden ' : 'overflow-y-auto custom-scrollbar p-8 '} dark:bg-slate-900`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
