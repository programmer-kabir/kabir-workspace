import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Shield,
  Download,
  LogIn,
  Key,
  Layers,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { ActivityItem } from '../../types';
import { fetchUserActivity } from '../../services/api';

export const ActivityView: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const loadActivity = async () => {
    setLoading(true);
    try {
      const data = await fetchUserActivity(page, search);
      setActivities(data.activities || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load user activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadActivity();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-3 h-3" />
            Signed In
          </span>
        );
      case 'register':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-3 h-3" />
            Registered
          </span>
        );
      case 'download_request':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Job Queued
          </span>
        );
      case 'download_completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Download className="w-3 h-3" />
            Completed
          </span>
        );
      case 'bulk_download':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-3 h-3" />
            Bulk Batch
          </span>
        );
      case 'favorite_added':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Bookmark className="w-3 h-3" />
            Favorited
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
            {action.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            <span>Account Security & Activity Audit Log</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-proof event log of downloads, authentication sessions, and security actions.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search action or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-200 outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading activity audit log...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
          <Activity className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No activity logged yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Actions performed on the platform will be recorded securely here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs uppercase font-semibold">
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
                <th className="p-4 hidden sm:table-cell">IP Address</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    {getActionBadge(act.action)}
                  </td>
                  <td className="p-4 text-slate-300 font-mono text-[11px] max-w-md truncate">
                    {act.details || '-'}
                  </td>
                  <td className="p-4 hidden sm:table-cell text-slate-500 font-mono">
                    {act.ip_address || '127.0.0.1'}
                  </td>
                  <td className="p-4 text-right text-slate-400 whitespace-nowrap">
                    {new Date(act.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Toolbar */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {activities.length} of {total} activities
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
