import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DeveloperStats } from '../../../types';
import { fetchDeveloperStats } from '../../../services/api';

export const ApiAnalytics: React.FC = () => {
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchDeveloperStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load developer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading API analytics...</p>
      </div>
    );
  }

  const quotaPercent = stats
    ? Math.min(100, Math.round((stats.quota.usedThisMonth / stats.quota.monthlyLimit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Strip */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>API Usage & Performance Analytics</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time throughput, latency, and quota consumption across all your API keys.
          </p>
        </div>

        <button
          onClick={loadStats}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Requests Today */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Requests Today</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {stats?.requestsToday ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reset at midnight UTC</div>
        </div>

        {/* Requests This Month */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Requests This Month</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {stats?.requestsThisMonth ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            of {stats?.quota.monthlyLimit ?? 1000} allocation
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Success Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {stats?.totalRequests && stats.totalRequests > 0
              ? `${Math.round(((stats.successfulRequests || 0) / stats.totalRequests) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats?.successfulRequests ?? 0} ok / {stats?.failedRequests ?? 0} errors
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Average Latency</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
            {stats?.averageResponseTimeMs ?? 0}ms
          </div>
          <div className="text-[11px] text-slate-500 mt-1">P95 processing speed</div>
        </div>

      </div>

      {/* Quota Progress & 7-Day Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-white">Daily API Call Volume (7 Days)</h4>
            <span className="text-xs text-slate-400">Past 7 days throughput</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
            {stats?.usageTrend && stats.usageTrend.length > 0 ? (
              stats.usageTrend.map((day, idx) => {
                const maxCount = Math.max(...stats.usageTrend.map((d) => d.count), 5);
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
              <div className="w-full text-center text-xs text-slate-500">No recent API calls</div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Monthly Quota Meter */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-white">Monthly API Quota</h4>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/30">
                {stats?.plan || 'Free'} Plan
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Credits Consumed</span>
                <span className="font-bold text-white">
                  {stats?.quota.usedThisMonth ?? 0} / {stats?.quota.monthlyLimit ?? 1000}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{stats?.quota.remainingMonth ?? 0} requests left</span>
                <span>{quotaPercent}% used</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Free tier includes 1,000 monthly API calls. Need more? Upgrades will unlock up to 500,000 requests/month.
          </div>
        </div>

      </div>

      {/* Endpoint Breakdown */}
      {stats?.endpointBreakdown && stats.endpointBreakdown.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <h4 className="font-bold text-sm text-white mb-3">Requests by Endpoint</h4>
          <div className="divide-y divide-slate-800/80">
            {stats.endpointBreakdown.map((ep, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold text-[10px]">
                    {ep.method}
                  </span>
                  <span className="text-slate-200">{ep.endpoint}</span>
                </div>
                <span className="font-semibold text-slate-400">{ep.count} requests</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
