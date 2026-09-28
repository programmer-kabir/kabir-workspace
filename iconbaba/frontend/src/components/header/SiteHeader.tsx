// frontend/src/components/header/SiteHeader.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Heart, Folder, History, LogOut, Sparkles, Shield, ExternalLink, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationDropdown from '@/components/header/NotificationDropdown';

interface SiteHeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function SiteHeader({ onToggleSidebar, sidebarOpen = false }: SiteHeaderProps) {
  const { user, logout, setShowAuthModal, setAuthMode } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  const isAdmin = Boolean(user && (user.roles?.includes('admin') || user.role === 'admin'));
  const currentToken = typeof window !== 'undefined' ? localStorage.getItem('iconbaba_token') : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0d0e15]/90 backdrop-blur-md transition-colors">
      <div className="px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="size-8.5 rounded-full inline-flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-sm lg:hidden transition-all"
              aria-label="Toggle Category Sidebar"
            >
              {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <img
              src="/icon.png"
              alt="IconBaba Logo"
              className="size-8 sm:size-8.5 object-contain filter drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]"
            />
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
              Icon<span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent ml-0.5">Baba</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 ml-1">
              5,000+
            </span>
          </Link>
        </div>

        {/* Right: Actions, Utilities Capsule, Auth & Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Admin panel direct quick-switcher for admins */}
          {isAdmin && (
            <a
              href={`http://localhost:3003${currentToken ? `?token=${currentToken}` : ''}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold transition-all shadow-sm"
              title="Open Admin Dashboard"
            >
              <Shield className="size-3.5 text-purple-600 dark:text-purple-400" />
              <span>Admin</span>
              <ExternalLink className="size-3 opacity-70 ml-0.5" />
            </a>
          )}

          {/* Role-Aware & Personal Notifications */}
          <NotificationDropdown />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative flex items-center gap-2 py-1 pl-1 pr-3 rounded-full bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <div className="relative size-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                  {user.username.charAt(0)}
                  {user.pending_invites && user.pending_invites.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-2 bg-amber-400 rounded-full border-2 border-white dark:border-[#0d0e15]" />
                  )}
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                  {user.full_name || user.username}
                </span>
                {isAdmin && (
                  <span className="hidden lg:inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                    Admin
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#141522] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1.5">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.full_name || user.username}</p>
                        {isAdmin ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 whitespace-nowrap">
                            Admin & User
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            User
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>

                    {user.pending_invites && user.pending_invites.length > 0 && (
                      <Link
                        to="/billing"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all mb-1.5 shadow-sm"
                      >
                        <Sparkles className="size-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Team Invite Waiting</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-800 dark:text-amber-200 font-bold">
                          Approve
                        </span>
                      </Link>
                    )}

                    {isAdmin && (
                      <a
                        href={`http://localhost:3001${currentToken ? `?token=${currentToken}` : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all mb-1.5 shadow-sm"
                      >
                        <Shield className="size-4 text-purple-500 dark:text-purple-400" />
                        <span>Admin Dashboard</span>
                        <ExternalLink className="size-3 ml-auto opacity-70" />
                      </a>
                    )}

                    <Link
                      to="/favorites"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Heart className="size-4 text-pink-500 dark:text-pink-400" />
                      My Favorites
                      {user.stats?.favorites_count !== undefined && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                          {user.stats.favorites_count}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/collections"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Folder className="size-4 text-purple-500 dark:text-purple-400" />
                      My Collections
                      {user.stats?.collections_count !== undefined && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                          {user.stats.collections_count}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <History className="size-4 text-indigo-500 dark:text-indigo-400" />
                      Download History
                    </Link>

                    <Link
                      to="/billing"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <CreditCard className="size-4 text-emerald-500 dark:text-emerald-400" />
                      <span>Billing & Invoices</span>
                      {user.pending_invites && user.pending_invites.length > 0 ? (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30">
                          {user.pending_invites.length} Pending
                        </span>
                      ) : user.is_pro ? (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30">
                          PRO
                        </span>
                      ) : null}
                    </Link>

                    <div className="border-t border-slate-100 dark:border-white/10 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/35 transition-all duration-200 cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
                className="px-4.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 shadow-md shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5 text-purple-200 animate-pulse" />
                <span>Sign up</span>
              </button>
            </div>
          )}

          {/* Site Navigation Dropdown (Mobile / More Menu) */}
          <div className="relative">
            <button
              onClick={() => setNavMenuOpen(!navMenuOpen)}
              className="size-8.5 sm:size-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20 shadow-sm transition-all duration-200 cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Navigation Menu"
            >
              {navMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            {navMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNavMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#141522] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                  {/* Main Pages */}
                  <div className="py-1">
                    <Link
                      to="/pricing"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Pricing
                    </Link>
                    <Link
                      to="/faq"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      FAQ&apos;s
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Contact
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/10 my-1.5" />

                  {/* Licenses Section */}
                  <div className="px-3 pt-1 pb-1">
                    <Link
                      to="/licenses"
                      onClick={() => setNavMenuOpen(false)}
                      className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors block"
                    >
                      Licenses
                    </Link>
                  </div>
                  <div className="py-0.5">
                    <Link
                      to="/licenses/free"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Free License
                    </Link>
                    <Link
                      to="/licenses/pro"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Pro License
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/10 my-1.5" />

                  {/* Legal Section */}
                  <div className="px-3 pt-1 pb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                      Legal
                    </span>
                  </div>
                  <div className="py-0.5">
                    <Link
                      to="/terms"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Terms
                    </Link>
                    <Link
                      to="/privacy-policy"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      to="/refund-policy"
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Refund Policy
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {user?.pending_invites && user.pending_invites.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950 via-[#18192d] to-purple-950 border-t border-purple-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2 text-purple-200 truncate">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-white">Team Invitation:</span>
            <span className="text-slate-300 truncate">
              {user.pending_invites[0].owner_name || user.pending_invites[0].owner_username || 'A team owner'} invited you to join their Team Plan!
            </span>
          </div>
          <Link
            to="/billing"
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Review & Approve</span>
            <Sparkles className="size-3" />
          </Link>
        </div>
      )}
    </header>
  );
}
