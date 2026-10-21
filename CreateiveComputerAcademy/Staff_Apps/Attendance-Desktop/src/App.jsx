import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useAuth } from './context/AuthContext';
import { getApiBase } from './utils/api';
import TitleBar from './components/TitleBar';
import DesktopHeader from './components/DesktopHeader';
import DesktopSidebar from './components/DesktopSidebar';
import Login from './components/Login';
import DashboardView from './components/DashboardView';
import AttendanceView from './components/AttendanceView';
import CommunityFeed from './components/CommunityFeed';
import MessagesView from './components/MessagesView';
import DesktopAppView from './components/DesktopAppView';
import MangoBreakTreeView from './components/MangoBreakTreeView';
import BreaksView from './components/BreaksView';
import TasksView from './components/TasksView';
import AcademyFeedView from './components/AcademyFeedView';
import PayrollWalletView from './components/PayrollWalletView';
import CreditWalletView from './components/CreditWalletView';
import LeaveView from './components/LeaveView';
import ReportsView from './components/ReportsView';
import BrandKitView from './components/BrandKitView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import DeveloperConsoleView from './components/DeveloperConsoleView';
import BreakLockOverlay from './components/BreakLockOverlay';
import CommandPalette from './components/CommandPalette';
import { SearchProvider } from './context/SearchContext';
import ModulePlaceholder from './components/ModulePlaceholder';
import ForceUpdateModal from './components/ForceUpdateModal';
import updateService from './services/UpdateService';
import { soundFx } from './utils/soundFx';
import { Toaster } from 'sonner';
import {
  FiClock, FiList, FiCalendar, FiMessageSquare,
  FiDollarSign, FiUsers, FiSettings, FiActivity, FiDownload,
  FiCoffee, FiBookOpen, FiVideo, FiFileText, FiUser, FiTerminal,
  FiAlertOctagon, FiRefreshCw
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaCoins } from 'react-icons/fa6';

function App() {
  const { currentUser, logout, isImpersonating, revertImpersonation, originalDevUser } = useAuth();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [maintenance, setMaintenance] = useState({ active: false, message: '', updated_by: '' });
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  const isPrivileged = Boolean(
    (currentUser?.roles && currentUser.roles.some(r => ['developer', 'admin'].includes(r))) ||
    isImpersonating ||
    localStorage.getItem('cca_desktop_original_dev_session')
  );

  // Layout & Navigation State matching staff-frontend paths
  const [activeTab, setActiveTab] = useState('/');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('cca_desktop_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('cca_desktop_sidebar_open', String(next));
      return next;
    });
  };

  // Check server maintenance status on app start / user change
  useEffect(() => {
    if (isPrivileged || !currentUser) {
      setCheckingMaintenance(false);
      return;
    }

    const checkMaintenance = async () => {
      try {
        const apiBase = (getApiBase() || '').replace(/\/+$/, '') + '/';
        const res = await axios.get(`${apiBase}api/developer/get_public_maintenance.php`);
        if (res.data?.status === 'success' && res.data.maintenance_enabled) {
          setMaintenance({
            active: true,
            message: res.data.maintenance_message || 'সিস্টেম মেইনটেন্যান্স চলছে।',
            updated_by: res.data.updated_by || 'Developer'
          });
        }
      } catch (err) {
        // Ignore network errors in public maintenance check
      } finally {
        setCheckingMaintenance(false);
      }
    };

    checkMaintenance();
  }, [currentUser, isPrivileged]);

  // Toggle Compact vs Full Workstation Mode
  const handleToggleCompactMode = () => {
    const nextMode = !isCompactMode;
    setIsCompactMode(nextMode);
    if (window.electronAPI?.setWindowMode) {
      window.electronAPI.setWindowMode(nextMode ? 'compact' : 'full');
    }
  };

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      const res = await updateService.checkForUpdates();
      if (res && res.has_update) {
        setUpdateInfo(res);
        setShowUpdateModal(true);
      }
    } catch (e) {
      console.warn('Update check routine error:', e);
    }
  }, []);

  // Listen for forced update requirements triggered during Check-In
  useEffect(() => {
    const handleForceRequired = (e) => {
      const detail = e?.detail || {};
      const releaseData = detail.release || {
        version: detail.required_version,
        download_url: detail.download_url,
        release_notes: detail.message
      };

      setUpdateInfo(prev => ({
        ...(prev || {}),
        has_update: true,
        is_mandatory: true,
        latest_version: detail.required_version || prev?.latest_version,
        release: releaseData
      }));
      setShowUpdateModal(true);
    };

    window.addEventListener('cca-force-update-required', handleForceRequired);
    return () => window.removeEventListener('cca-force-update-required', handleForceRequired);
  }, []);

  // Startup update check & periodic check every 30 minutes
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Real-time Pusher listener: Instantly triggers modal when Admin publishes a new release
  useEffect(() => {
    let pusher = null;
    let channel = null;
    try {
      pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });
      channel = pusher.subscribe('app-releases-channel');
      channel.bind('new-release', (data) => {
        if (!data || !data.version) return;
        updateService.getVersion().then(currVer => {
          if (data.version !== currVer) {
            setUpdateInfo({
              has_update: true,
              is_mandatory: !!data.is_mandatory,
              latest_version: data.version,
              current_version: currVer,
              release: data
            });
            setShowUpdateModal(true);
            try { soundFx.playSuccess(); } catch (e) { }
            if (window.electronAPI?.showNotification) {
              window.electronAPI.showNotification(
                'New Update Available',
                `CCA Staff Desktop v${data.version} has been published!`
              );
            }
          }
        });
      });
    } catch (e) {
      console.warn('Realtime release listener failed:', e);
    }

    return () => {
      if (channel) channel.unbind_all();
      if (pusher) pusher.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    updateService.logHeartbeat(currentUser);
    const heartbeatInterval = setInterval(() => {
      updateService.logHeartbeat(currentUser);
    }, 15 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

  // Global shortcut for Spotlight Command Palette (Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const tabTitles = {
    '/': 'Dashboard',
    '/attendance': 'Attendance',
    '/community': 'Community Wall',
    '/messages': 'Messages',
    '/desktop-app': 'Desktop App & Updates',
    '/mango-tree': 'Mango Break Tree',
    '/breaks': 'Breaks Log',
    '/tasks': 'Tasks',
    '/content-studio': 'Content Studio',
    '/feed': 'Academy Feed',
    '/payroll': 'Work Wallet & Salary',
    '/credits': 'Credit Wallet',
    '/leave': 'Leave Management',
    '/reports': 'Reports',
    '/brand-kit': 'Brand Kit',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/developer': 'Developer Suite Overview',
    '/developer/impersonate': 'User Impersonator',
    '/developer/logs': 'System Error Logs',
    '/developer/api-tester': 'API & Sockets Tester',
    '/developer/crons': 'Crons & Automation',
    '/developer/database': 'Database & Cache Cleaner',
    '/developer/editor': 'Server Code Editor'
  };

  const renderTabContent = () => {
    // 1:1 Duplicate of staff-frontend Dashboard
    if (activeTab === '/') {
      return <DashboardView setActiveTab={setActiveTab} />;
    }

    // Attendance & Quick Punch / Screen Recording Hub
    if (activeTab === '/attendance') {
      return <AttendanceView />;
    }

    if (activeTab === '/mango-tree' || activeTab === '/break-tree') {
      return (
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full mx-auto">
          <MangoBreakTreeView />
        </div>
      );
    }

    if (activeTab === '/breaks') {
      return (
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full mx-auto">
          <BreaksView />
        </div>
      );
    }

    if (activeTab === '/tasks' || activeTab === '/content-studio') {
      return <TasksView activeTab={activeTab} />;
    }

    if (activeTab === '/community') {
      return <CommunityFeed />;
    }

    if (activeTab === '/messages') {
      return <MessagesView />;
    }

    if (activeTab === '/feed') {
      return <AcademyFeedView />;
    }

    if (activeTab === '/leave') {
      return (
        <div className="p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
          <LeaveView onNavigate={setActiveTab} />
        </div>
      );
    }

    if (activeTab === '/payroll') {
      return (
        <div className="p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
          <PayrollWalletView />
        </div>
      );
    }

    if (activeTab === '/credits') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6">
          <CreditWalletView onNavigate={setActiveTab} />
        </div>
      );
    }

    if (activeTab === '/desktop-app') {
      return <DesktopAppView />;
    }

    if (activeTab === '/reports') {
      return (
        <div className="p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
          <ReportsView onNavigate={setActiveTab} />
        </div>
      );
    }

    if (activeTab === '/brand-kit') {
      return (
        <div className="p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
          <BrandKitView onNavigate={setActiveTab} />
        </div>
      );
    }

    if (activeTab === '/profile') {
      return (
        <div className="p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
          <ProfileView onNavigate={setActiveTab} />
        </div>
      );
    }

    if (activeTab === '/settings') {
      return (
        <div className="p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
          <SettingsView onNavigate={setActiveTab} />
        </div>
      );
    }

    if (activeTab.startsWith('/developer')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6">
          <DeveloperConsoleView currentRoute={activeTab} onNavigate={setActiveTab} />
        </div>
      );
    }

    // Default Fallback
    return (
      <ModulePlaceholder
        tabId={activeTab.replace('/', '') || 'module'}
        title={tabTitles[activeTab] || "Staff Module"}
        engTitle="Creative Computer Academy Workstation"
        icon={<FiActivity />}
        stepLabel="ধাপ ৩ (Step 3)"
        description="এই ফিচারটি স্টাফ পোর্টালে সক্রিয় রয়েছে। পরবর্তী ধাপে সরাসরি এই ডেস্কটপ ইন্টারফেসে ফুল ভিউ যোগ করা হবে।"
        features={[
          'ব্রাউজার ও ডেস্কটপ উভয়েই সিঙ্কড থাকবে',
          'রিয়েলটাইম পুশার ডেটা ইন্টিগ্রেশন'
        ]}
        webPath={activeTab}
        onBackToAttendance={() => setActiveTab('/')}
      />
    );
  };

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      {currentUser && !isPrivileged && maintenance.active ? (
        <div className="flex-1 flex flex-col h-full bg-slate-950 text-white relative overflow-hidden">
          <TitleBar onLogout={logout} user={currentUser} />
          <div className="flex-1 flex items-center justify-center p-4 relative">
            {/* Glow ambient background */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <FiAlertOctagon className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-black uppercase tracking-wider">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>System Downtime Active</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Maintenance Underway
                </h1>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs leading-relaxed text-left space-y-2">
                <div className="font-bold text-rose-400 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Announcement by Developer:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    By Developer {maintenance.updated_by ? `(${maintenance.updated_by})` : ''}
                  </span>
                </div>
                <p className="whitespace-pre-line text-xs font-sans text-slate-200">
                  {maintenance.message}
                </p>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                All workstation actions and automated cron workflows are safely paused. We will automatically restore access once the maintenance window is concluded.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  <span>Check Status Again</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : currentUser ? (
        <>
          {/* 1:1 Duplicate of staff-frontend Sidebar */}
          {!isCompactMode && (
            <DesktopSidebar
              isOpen={isSidebarOpen}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onLogout={logout}
            />
          )}

          {/* Right Workstation Content Area */}
          <SearchProvider activeTab={activeTab}>
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
              {/* Sticky Impersonation Alert Banner */}
              {isImpersonating && (
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3 sm:px-6 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-md z-40 border-b border-amber-500/40 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                    </span>
                    <span className="truncate">
                      <strong className="tracking-wide uppercase text-[10px] bg-black/25 px-1.5 py-0.5 rounded mr-1">Impersonating</strong>
                      <span>{currentUser?.name || 'User'}</span>
                      <span className="opacity-80 ml-1">({currentUser?.employee_code || 'Staff'})</span>
                      <span className="hidden md:inline opacity-75 ml-1.5">&bull; Logged in by Developer {originalDevUser?.name || ''}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      revertImpersonation();
                      setActiveTab('/developer/impersonate');
                    }}
                    className="px-2.5 sm:px-3 py-1 bg-white text-amber-950 hover:bg-amber-100 rounded-lg text-xs font-black shadow-xs cursor-pointer transition flex items-center gap-1.5 shrink-0"
                  >
                    Revert Session
                  </button>
                </div>
              )}
              {/* 1:1 Duplicate of staff-frontend Header */}
              <DesktopHeader
                isSidebarOpen={!isCompactMode && isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={logout}
                isCompactMode={isCompactMode}
                onToggleCompactMode={handleToggleCompactMode}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />

              {/* Content Area */}
              <main className={`flex-1 min-h-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200 ${activeTab === '/messages' ? 'overflow-hidden flex flex-col p-0 h-full' : 'overflow-y-auto custom-scrollbar'
                }`}>
                {renderTabContent()}
              </main>

              {/* Active Break Lock Overlay */}
              <BreakLockOverlay />

              {/* Global Spotlight / Command Palette */}
              <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                onNavigate={setActiveTab}
                onToggleSidebar={toggleSidebar}
                currentUser={currentUser}
              />
            </div>
          </SearchProvider>
        </>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          <TitleBar onLogout={null} user={null} activeTabName="Staff Workstation Login" />
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <Login />
          </div>
        </div>
      )}

      {/* Version Control & Force Update Lockout Modal */}
      {showUpdateModal && updateInfo && (
        <ForceUpdateModal
          updateInfo={updateInfo}
          onClose={() => {
            if (!updateInfo.is_mandatory) {
              setShowUpdateModal(false);
            }
          }}
        />
      )}

      {/* Global Notifications Toaster */}
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
