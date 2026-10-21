import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import TitleBar from './components/TitleBar';
import Login from './components/Login';
import AdminDesktopHeader from './components/AdminDesktopHeader';
import AdminDesktopSidebar from './components/AdminDesktopSidebar';
import DashboardView from './components/DashboardView';
import StaffDirectoryView from './components/StaffDirectoryView';
import PayrollManagementView from './components/PayrollManagementView';
import ReviewerDirectoryView from './components/ReviewerDirectoryView';
import ContentStudioAdminView from './components/ContentStudioAdminView';
import StudentDirectoryView from './components/StudentDirectoryView';
import StudentDailyLogsView from './components/StudentDailyLogsView';
import CoursesAndCurriculumView from './components/CoursesAndCurriculumView';
import TypingReportsView from './components/TypingReportsView';
import PenToolReportsView from './components/PenToolReportsView';
import TaskOversightView from './components/TaskOversightView';
import LiveScreenMonitorView from './components/LiveScreenMonitorView';
import WorkstationVideoLogsView from './components/WorkstationVideoLogsView';
import IdleAlertsView from './components/IdleAlertsView';
import DailyRosterView from './components/DailyRosterView';
import LeaveManagementView from './components/LeaveManagementView';
import AttendanceDisputesView from './components/AttendanceDisputesView';
import MasterReportView from './components/MasterReportView';
import ReportsView from './components/ReportsView';
import ReviewerReportView from './components/ReviewerReportView';
import CommunityWallView from './components/CommunityWallView';
import AcademyBlogView from './components/AcademyBlogView';
import MessagesView from './components/MessagesView';
import BrandResourcesView from './components/BrandResourcesView';
import DatabaseManagerView from './components/DatabaseManagerView';
import StorageSettingsView from './components/StorageSettingsView';
import AppReleasesView from './components/AppReleasesView';
import ServerCodeEditorView from './components/ServerCodeEditorView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import AdminCommandPalette from './components/AdminCommandPalette';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import { soundFx } from './utils/soundFx';
import {
  FiGrid, FiUsers, FiMonitor, FiFilm, FiClock,
  FiCalendar, FiDollarSign, FiCheckSquare, FiShare2,
  FiMessageSquare, FiDatabase, FiUser, FiActivity,
  FiShield, FiRefreshCw, FiExternalLink, FiServer, FiLayers
} from 'react-icons/fi';
import axios from 'axios';

function App() {
  const { currentUser, logout, getApiBase } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('cca_admin_active_tab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Sync tab persistence
  useEffect(() => {
    if (activeTab) {
      try {
        localStorage.setItem('cca_admin_active_tab', activeTab);
      } catch (e) {}
    }
  }, [activeTab]);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pusher Real-time Notifications & Desktop OS Popups
  useEffect(() => {
    if (!currentUser?.id) return;

    let pusher = null;
    let channel = null;

    try {
      pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2'
      });

      channel = pusher.subscribe(`user-${currentUser.id}`);

      channel.bind('new-notification', function(data) {
        toast.info(data.title || 'New Notification', {
          description: data.message || '',
        });

        try { soundFx.playChime(); } catch (e) {}

        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(data.title || 'CCA Admin App', data.message || '');
        }

        window.dispatchEvent(new Event('new-notification-received'));
      });
    } catch (e) {
      console.error('Pusher subscription failed:', e);
    }

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, [currentUser]);

  // Fetch quick metrics for desktop dashboard
  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const apiBase = getApiBase();
        const res = await axios.get(`${apiBase}api/dashboard/get_stats.php`);
        if (res.data?.status === 'success') {
          setDashboardStats(res.data.data);
        }
      } catch (e) {
        // ignore
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [currentUser, activeTab]);

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
        <TitleBar user={null} activeTabName="Login" />
        <Login />
      </div>
    );
  }

  const tabLabels = {
    dashboard: 'Executive Overview',
    '/': 'Executive Overview',
    staff: 'Staff Directory',
    payroll: 'Payroll & Schemes',
    reviewers: 'Reviewer Directory',
    'content-studio': 'Content Studio',
    students: 'Student Directory',
    'student-daily-logs': 'Daily Work Logs & Reviews',
    courses: 'Courses & Curriculum',
    'typing-reports': 'Typing Master Reports',
    'pentool-reports': 'Pen Tool Master Reports',
    tasks: 'Task Oversight',
    'screen-monitor': 'Live Screen Surveillance',
    'workstation-videos': 'Workstation Video Logs',
    'idle-alerts': 'Inactivity Alarms & Watchdog',
    attendance: 'Daily Attendance Roster',
    leave: 'Leave Approvals',
    'attendance-disputes': 'Attendance Disputes',
    'master-report': 'Company Master Report',
    reports: 'Staff Reports',
    'reviewer-report': 'Reviewer Reports',
    community: 'Community Social Wall',
    blogs: 'Academy Feed & Blogs',
    messages: 'Secure Communication',
    'brand-resources': 'Brand Kit & Assets',
    database: 'Database & System Telemetry',
    'storage-settings': 'Cloud Vault & Storage',
    'app-releases': 'App Version Control',
    'server-editor': 'Server Code Editor',
    settings: 'System Settings',
    profile: 'Admin Profile & Security'
  };

  const handleOpenWebConsole = () => {
    let path = activeTab;
    if (path === 'dashboard' || path === '/') {
      path = '';
    } else if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    const webUrl = `http://localhost:5173${path}`;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(webUrl);
    } else {
      window.open(webUrl, '_blank');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* ── Sidebar (Left Column, Full Height) ── */}
      <AdminDesktopSidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={logout}
      />

      {/* ── Main Area (Right Column: Header + Content) ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300">
        {/* Exact Header matching Admin Portal */}
        <AdminDesktopHeader
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={logout}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-8 transition-colors duration-200">
          {(activeTab === 'dashboard' || activeTab === '/') && (
            <DashboardView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'staff' && (
            <StaffDirectoryView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'payroll' && (
            <PayrollManagementView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'reviewers' && (
            <ReviewerDirectoryView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'content-studio' && (
            <ContentStudioAdminView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'students' && (
            <StudentDirectoryView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'student-daily-logs' && (
            <StudentDailyLogsView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'courses' && (
            <CoursesAndCurriculumView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'typing-reports' && (
            <TypingReportsView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'pentool-reports' && (
            <PenToolReportsView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'tasks' && (
            <TaskOversightView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'screen-monitor' || activeTab === '/screen-monitor') && (
            <LiveScreenMonitorView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'workstation-videos' || activeTab === '/workstation-video-logs') && (
            <WorkstationVideoLogsView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'idle-alerts' || activeTab === '/idle-alerts') && (
            <IdleAlertsView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'attendance' || activeTab === '/attendance') && (
            <DailyRosterView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'leave' || activeTab === '/leave') && (
            <LeaveManagementView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'attendance-disputes' || activeTab === '/attendance-disputes') && (
            <AttendanceDisputesView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'master-report' || activeTab === '/master-report') && (
            <MasterReportView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'reports' || activeTab === '/reports') && (
            <ReportsView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'reviewer-report' || activeTab === '/reviewer-report') && (
            <ReviewerReportView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'community' || activeTab === '/community') && (
            <CommunityWallView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'blogs' || activeTab === '/blogs') && (
            <AcademyBlogView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'messages' || activeTab === '/messages') && (
            <MessagesView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'brand-resources' || activeTab === '/brand-resources') && (
            <BrandResourcesView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'database' || activeTab === '/database') && (
            <DatabaseManagerView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'storage-settings' || activeTab === '/storage-settings') && (
            <StorageSettingsView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'app-releases' || activeTab === '/app-releases') && (
            <AppReleasesView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'server-editor' || activeTab === '/server-editor') && (
            <ServerCodeEditorView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'settings' || activeTab === '/settings') && (
            <SettingsView setActiveTab={setActiveTab} />
          )}

          {(activeTab === 'profile' || activeTab === '/profile') && (
            <ProfileView setActiveTab={setActiveTab} />
          )}

          {!['dashboard', '/', 'staff', 'payroll', 'reviewers', 'content-studio', 'students', 'student-daily-logs', 'courses', 'typing-reports', 'pentool-reports', 'tasks', 'screen-monitor', '/screen-monitor', 'workstation-videos', '/workstation-video-logs', 'idle-alerts', '/idle-alerts', 'attendance', '/attendance', 'leave', '/leave', 'attendance-disputes', '/attendance-disputes', 'master-report', '/master-report', 'reports', '/reports', 'reviewer-report', '/reviewer-report', 'community', '/community', 'blogs', '/blogs', 'messages', '/messages', 'brand-resources', '/brand-resources', 'database', '/database', 'storage-settings', '/storage-settings', 'app-releases', '/app-releases', 'server-editor', '/server-editor', 'settings', '/settings', 'profile', '/profile'].includes(activeTab) && (
            <div className="flex-1 flex flex-col min-h-full">
              {/* Module Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800/80 mb-6 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>{tabLabels[activeTab] || 'Console'}</span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      DESKTOP ENGINE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Connected to {getApiBase()} &bull; Live Workstation Synchronization
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenWebConsole}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Launch Web Browser View"
                  >
                    <FiExternalLink size={13} className="text-blue-500 dark:text-blue-400" />
                    <span>Open in Web</span>
                  </button>
                </div>
              </div>

              {/* Module Placeholder */}
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <FiServer size={28} />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{tabLabels[activeTab] || 'Console'} Module</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dedicated desktop module interface synchronized with your live server database and background electron processes.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
                  >
                    Return to Overview
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenWebConsole}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FiExternalLink size={13} />
                    <span>Open Full View</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Spotlight Executive Command Palette */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
