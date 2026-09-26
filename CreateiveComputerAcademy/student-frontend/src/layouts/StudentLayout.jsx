import React, { useState } from 'react';
import StudentSidebar from '../components/StudentSidebar';
import ThemeToggle from '../components/ThemeToggle';
import CourseSwitcher from '../components/CourseSwitcher';
import NotificationDropdown from '../components/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'sonner';
import { FiSidebar } from 'react-icons/fi';

const StudentLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#090d16] overflow-hidden transition-colors">
      <Toaster position="top-right" richColors />
      <StudentSidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header Bar */}
        <header className="h-16 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <FiSidebar size={18} />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Welcome, {currentUser?.name || 'Student'}! 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Dynamic Multi-Course Switcher */}
            <CourseSwitcher />

            {/* Real-Time Notifications Center */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
