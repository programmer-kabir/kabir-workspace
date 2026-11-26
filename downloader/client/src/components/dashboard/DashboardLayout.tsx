import React, { useState } from 'react';
import {
  Download,
  BarChart3,
  Clock,
  History,
  Layers,
  Bookmark,
  Bell,
  Activity,
  ArrowLeft,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  Code2,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OverviewView } from './OverviewView';
import { QueueView } from './QueueView';
import { HistoryView } from './HistoryView';
import { BulkDownloaderView } from './BulkDownloaderView';
import { FavoritesView } from './FavoritesView';
import { NotificationsView } from './NotificationsView';
import { ActivityView } from './ActivityView';
import { DeveloperPortalView } from './developer/DeveloperPortalView';
import { SubscriptionView } from './SubscriptionView';
import { AdminPaymentView } from '../admin/AdminPaymentView';

interface DashboardLayoutProps {
  onBackToHome: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  onBackToHome,
  theme,
  toggleTheme
}) => {
  const { user, logout, unreadCount } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'queue' | 'history' | 'bulk' | 'favorites' | 'notifications' | 'activity' | 'developer' | 'billing' | 'admin-payments'
  >('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'billing', label: 'Subscription & Plans', icon: CreditCard },
    { id: 'queue', label: 'Active Queue', icon: Clock },
    { id: 'history', label: 'Download History', icon: History },
    { id: 'bulk', label: 'Bulk Downloader', icon: Layers },
    { id: 'favorites', label: 'Saved Favorites', icon: Bookmark },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'developer', label: 'Developer API', icon: Code2 },
    ...(user?.role === 'admin'
      ? [{ id: 'admin-payments', label: 'Admin Payments', icon: ShieldCheck }]
      : [])
  ];

  const handleNavClick = (id: any) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={(view) => setActiveTab(view as any)} />;
      case 'billing':
        return <SubscriptionView />;
      case 'admin-payments':
        return <AdminPaymentView />;
      case 'queue':
        return <QueueView />;
      case 'history':
        return <HistoryView />;
      case 'bulk':
        return <BulkDownloaderView />;
      case 'favorites':
        return <FavoritesView />;
      case 'notifications':
        return <NotificationsView />;
      case 'activity':
        return <ActivityView />;
      case 'developer':
        return <DeveloperPortalView />;
      default:
        return <OverviewView onNavigate={(view) => setActiveTab(view as any)} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 🌌 Background grid & glow */}
      <div className="fixed inset-0 bg-grid-mesh pointer-events-none z-0 opacity-40" />

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl z-20 sticky top-0 h-screen p-5 justify-between">
        <div className="space-y-6">
          
          {/* Logo & Public Site Link */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  StreamVault
                </span>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  User Workspace
                </span>
              </div>
            </div>

            <button
              onClick={onBackToHome}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Downloader</span>
            </button>
          </div>

          {/* User Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/30">
              {user?.plan || 'Free'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Logout & Theme Toggle */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-semibold border border-slate-700/50 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-base font-bold text-white capitalize hidden sm:block">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={logout}
              title="Logout"
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-lg font-bold text-white">StreamVault Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full p-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                    activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={onBackToHome}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold"
              >
                Back to Public Downloader
              </button>
              <button
                onClick={logout}
                className="w-full py-2.5 rounded-xl bg-rose-950/50 text-rose-400 text-sm font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main View Container */}
        <main className="p-4 sm:p-6 lg:p-8 w-full mx-auto flex-1">
          {renderActiveView()}
        </main>

      </div>

    </div>
  );
};
