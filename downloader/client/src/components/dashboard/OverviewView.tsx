import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { fetchUserStats, addJobToQueueApi } from '../../services/api';

interface OverviewViewProps {
  onNavigate: (view: string) => void;
  onDownloadStarted?: (url: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickType, setQuickType] = useState<'video' | 'audio'>('video');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchUserStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleQuickDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await addJobToQueueApi(quickUrl.trim(), quickType);
      setSubmitMsg({
        type: 'success',
        text: res.message || 'Job added to download queue!'
      });
      setQuickUrl('');
      loadStats();
    } catch (err: any) {
      setSubmitMsg({
        type: 'error',
        text: err.message || 'Failed to submit download job.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quotaPercent = stats ? Math.min(100, Math.round((stats.quota.usedDaily / stats.quota.daily) * 100)) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner / Welcome Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Personal Dashboard</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              {stats?.plan || 'Free'} Plan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Real-Time Engine Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track download throughput, queue lifecycle, and quota consumption live from SQLite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('bulk')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Downloader</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Downloads</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats?.totalDownloads ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats?.successfulDownloads ?? 0} completed</span>
            <span>across all platforms</span>
          </div>
        </div>

        {/* Successful Downloads */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {stats?.totalDownloads && stats.totalDownloads > 0
              ? `${Math.round(((stats.successfulDownloads || 0) / stats.totalDownloads) * 100)}%`
              : '100%'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {stats?.successfulDownloads ?? 0} clean extractions
          </div>
        </div>

        {/* Active Queue Jobs */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            {stats?.activeQueueJobs ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Jobs processing live</span>
            <button
              onClick={() => onNavigate('queue')}
              className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 text-xs font-medium"
            >
              View <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Failed Downloads */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Failed / Retries</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
            {stats?.failedDownloads ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Auto-recovered with 3 retries
          </div>
        </div>

      </div>

      {/* Quota & Quick Download Dual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Quick Single Download Console */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-white">Quick Queue Injector</h3>
              </div>
              <span className="text-xs text-slate-400">Auto-routes to persistent background queue</span>
            </div>

            <form onSubmit={handleQuickDownload} className="space-y-4">
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="Paste video URL (YouTube, TikTok, Instagram, Facebook...)"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="w-full pl-4 pr-32 py-3 rounded-2xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Queue</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="text-slate-400 font-medium">Extract as:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickType('video')}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      quickType === 'video'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Video (MP4 Full HD / 4K)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickType('audio')}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      quickType === 'audio'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Audio Only (320kbps MP3)
                  </button>
                </div>
              </div>

              {submitMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    submitMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {submitMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{submitMsg.text}</span>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Need to download 10+ links at once?</span>
            <button
              onClick={() => onNavigate('bulk')}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Open Bulk Downloader <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Quota Consumption Meter */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Daily Quota Meter</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Resets Midnight UTC
              </span>
            </div>

            {/* Daily Quota Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Daily Downloads</span>
                <span className="font-bold text-white">
                  {stats?.quota.usedDaily ?? 0} / {stats?.quota.daily ?? 15}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{stats?.quota.remainingDaily ?? 0} remaining today</span>
                <span>{quotaPercent}% consumed</span>
              </div>
            </div>

            {/* Monthly Quota */}
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Monthly Allocation</span>
                <span className="font-semibold text-white">
                  {stats?.quota.usedMonthly ?? 0} / {stats?.quota.monthly ?? 250}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {stats?.quota.remainingMonthly ?? 0} downloads remaining in current cycle
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('billing')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/40 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Upgrade Plan & Higher Limits</span>
            </button>
          </div>
        </div>

      </div>

      {/* 7-Day Trend Chart & Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-white">7-Day Download Activity</h3>
            </div>
            <span className="text-xs text-slate-400">Past 7 days throughput</span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
            {stats?.downloadTrend && stats.downloadTrend.length > 0 ? (
              stats.downloadTrend.map((day, idx) => {
                const maxCount = Math.max(...stats.downloadTrend.map(d => d.count), 5);
                const heightPercent = Math.max(8, Math.round((day.count / maxCount) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-800 rounded-t-lg overflow-hidden flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500 group-hover:from-indigo-500 group-hover:to-pink-500 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[55px]">
                      {day.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-slate-500">No recent activity</div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Platform Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-white">Platform Breakdown</h3>
            </div>
          </div>

          <div className="space-y-4">
            {stats?.platformStats && stats.platformStats.length > 0 ? (
              stats.platformStats.map((item, idx) => {
                const total = stats.totalDownloads || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">{item.platform}</span>
                      <span className="text-slate-400">{item.count} downloads ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No platform records yet. Submit your first download to see stats.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
