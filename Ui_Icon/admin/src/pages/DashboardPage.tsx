// admin/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboardStats } from '@/lib/api';
import { formatSvgForDarkPreview } from '@/lib/svg';
import { DashboardStats } from '@/types/admin';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getAdminDashboardStats();
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard statistics.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl p-4"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
          <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center text-red-300">
        <p className="font-semibold">{error || 'Failed to load stats'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { counts, recent_icons, recent_downloads, recent_users, recent_audit } = stats;

  const cards = [
    {
      title: 'Total Icons',
      value: counts.total_icons.toLocaleString(),
      sub: `${counts.published_icons} published · ${counts.draft_icons} draft`,
      href: '/icons',
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      title: 'Categories',
      value: counts.total_categories.toLocaleString(),
      sub: 'Active catalog taxonomies',
      href: '/categories',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: 'Registered Users',
      value: counts.total_users.toLocaleString(),
      sub: 'Platform user accounts',
      href: '/users',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Downloads',
      value: counts.total_downloads.toLocaleString(),
      sub: 'SVG & PNG export events',
      href: '/downloads',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time statistics and administrative control center</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/icons/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Icon</span>
          </Link>
          <Link
            to="/categories"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <span>Manage Categories</span>
          </Link>
          {counts.unread_messages > 0 && (
            <Link
              to="/contact-messages"
              className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>{counts.unread_messages} New Message{counts.unread_messages > 1 ? 's' : ''}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Link
            key={i}
            to={card.href}
            className={`p-5 rounded-2xl bg-gradient-to-br bg-slate-900/90 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${card.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</span>
              <div className="p-2 rounded-xl bg-slate-800/80">{card.icon}</div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{card.value}</div>
            <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
          </Link>
        ))}
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="text-center border-r border-slate-800/80 last:border-r-0">
          <div className="text-xs text-slate-400 font-medium">Favorites</div>
          <div className="text-lg font-bold text-slate-200 mt-0.5">{counts.total_favorites.toLocaleString()}</div>
        </div>
        <div className="text-center border-r border-slate-800/80 last:border-r-0">
          <div className="text-xs text-slate-400 font-medium">Collections</div>
          <div className="text-lg font-bold text-slate-200 mt-0.5">{counts.total_collections.toLocaleString()}</div>
        </div>
        <div className="text-center border-r border-slate-800/80 last:border-r-0">
          <div className="text-xs text-slate-400 font-medium">Draft Icons</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{counts.draft_icons.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 font-medium">Unread Messages</div>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">{counts.unread_messages}</div>
        </div>
      </div>

      {/* Recent Icons & Downloads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Icons */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Recently Uploaded Icons</span>
              <span className="text-xs font-normal text-slate-400">({recent_icons.length})</span>
            </h2>
            <Link to="/icons" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
            {recent_icons.map((icon) => (
              <Link
                key={icon.id}
                to={`/icons/edit/${icon.id}`}
                className="p-3 bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl transition-all group flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-colors mb-2">
                  {icon.svg_content ? (
                    <div
                      className="w-8 h-8 svg-preview-white text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: formatSvgForDarkPreview(icon.svg_content) }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs">SVG</div>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate w-full group-hover:text-white">
                  {icon.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                    {icon.category_name || 'Uncategorized'}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      icon.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>
              </Link>
            ))}
            {recent_icons.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                No icons uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Downloads */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Recent Downloads</span>
            </h2>
            <Link to="/downloads" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              View All &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-2 font-medium">Icon</th>
                  <th className="pb-2 font-medium">Format</th>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recent_downloads.map((dl) => (
                  <tr key={dl.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium text-slate-200 truncate max-w-[120px]">
                      {dl.icon_name || 'Unknown Icon'}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          dl.format === 'svg'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {dl.format} {dl.size ? `${dl.size}px` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[110px]">
                      {dl.username || 'Anonymous'}
                    </td>
                    <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">
                      {new Date(dl.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {recent_downloads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No recent downloads recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Users & Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Users</h2>
            <Link to="/users" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              Manage Users &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recent_users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {user.full_name || user.username}
                    </div>
                    <div className="text-[11px] text-slate-500">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      user.role === 'admin'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      user.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Timeline */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Activity Log</h2>
            <Link to="/audit-logs" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              Full Log &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recent_audit.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                      {log.entity_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    By <span className="text-slate-300">{log.username || 'System'}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {recent_audit.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">
                No recent administrative actions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
