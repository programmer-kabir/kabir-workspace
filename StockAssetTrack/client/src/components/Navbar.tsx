import { NavLink, Link } from 'react-router-dom';
import {
  BarChart3,
  Bookmark,
  Calendar,
  Flame,
  Grid2x2,
  LogIn,
  Moon,
  Search,
  Sparkles,
  Sun,
  Tags,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { HealthResponse } from '../types/stock';

interface NavbarProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenSaved: () => void;
  health: HealthResponse | null;
}

const NAV_ITEMS = [
  { to: '/search', label: 'Search', icon: Search },
  { to: '/trending', label: 'Trending', icon: Flame },
  { to: '/tracker', label: 'Portfolio Tracker', icon: Users },
  { to: '/heatmap', label: 'Heat Map', icon: Grid2x2 },
  { to: '/tags', label: 'Tag Clusters', icon: Tags },
  { to: '/prompts', label: 'AI Prompts', icon: Sparkles },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
];

export function Navbar({ darkMode, onToggleTheme, onOpenSaved, health }: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex  items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-indigo/25">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              StockAssetTrack
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Microstock Intelligence
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-sm shadow-brand-indigo/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span
            title={health ? 'Microstock Intelligence Engine Operational' : 'Checking API Status'}
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${
              health?.success
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health?.success ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {health?.success ? 'Live Engine' : 'Connecting...'}
          </span>

          <button
            type="button"
            onClick={onOpenSaved}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Bookmark className="h-3.5 w-3.5 text-brand-cyan" />
            <span>Saved</span>
          </button>

          {/* Adobe Review Submission: Temporarily hidden to present 100% free community tool
          <Link
            to="/pricing"
            className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-block"
          >
            Plans
          </Link>
          */}

          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-indigo px-3 py-1.5 text-xs font-semibold uppercase text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-indigo-500"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{user.planTier}</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-slate-200/70 px-4 py-2 dark:border-slate-800/70 lg:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-brand-indigo text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </header>
  );
}
