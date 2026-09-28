import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Download, 
  Upload, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../api/authFetch';

const PlatformPulseWidget = () => {
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_LOCALHOST_KEY;

  const fetchPulse = async () => {
    try {
      setIsRefreshing(true);
      const res = await authFetch(`${apiUrl}/dashboard/get_platform_pulse.php`);
      const data = await res.json();
      if (data.success) {
        setPulseData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 30000); // 30s auto pulse
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-800/60 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const pulse = pulseData?.pulse || {};
  const storage = pulseData?.storage || {};
  const today = pulseData?.today || {};
  const velocity = pulseData?.velocity || [];
  const recentActivity = pulseData?.recent_activity || [];

  // Calculate sparkline points for velocity
  const maxVelocity = Math.max(...velocity.map(v => v.count), 1);
  const points = velocity.map((v, i) => {
    const x = (i / (velocity.length - 1 || 1)) * 140;
    const y = 35 - (v.count / maxVelocity) * 30;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      
      {/* PLATFORM PULSE HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 p-6 shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Live Platform Pulse
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                  Operational
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time server telemetry, storage metrics, and live activity monitor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-gray-300">
              <Database size={13} className="text-blue-400" />
              <span>DB Ping: <strong className="text-white">{pulse.db_latency_ms}ms</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-gray-300">
              <Activity size={13} className="text-purple-400" />
              <span>PHP Mem: <strong className="text-white">{pulse.php_memory_mb}MB</strong></span>
            </div>
            <button
              onClick={fetchPulse}
              className={`p-2 rounded-xl bg-gray-800/80 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh Pulse"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* 4 TELEMETRY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          
          {/* 1. Cloudflare R2 Storage */}
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/60 p-4 flex flex-col justify-between hover:border-gray-700 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Cloudflare R2</span>
              <HardDrive size={15} className="text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-white">{storage.r2_size_gb} <span className="text-xs font-normal text-gray-400">GB</span></span>
              <p className="text-[11px] text-gray-400 mt-0.5">{storage.r2_objects} objects stored</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.min(100, Math.max(8, storage.r2_size_gb * 10))}%` }} />
            </div>
          </div>

          {/* 2. Download Velocity & Sparkline */}
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/60 p-4 flex flex-col justify-between hover:border-gray-700 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Today Downloads</span>
              <Zap size={15} className="text-amber-400" />
            </div>
            <div className="flex items-end justify-between my-1">
              <div>
                <span className="text-2xl font-black text-white">{today.downloads}</span>
                <p className="text-[11px] text-gray-400 mt-0.5">Velocity sparkline</p>
              </div>
              <svg className="w-28 h-9 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>
            <div className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1">
              <span>Live download activity</span>
            </div>
          </div>

          {/* 3. Pending Reviews & Quick Jump */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>Pending Review</span>
              <Clock size={15} className="text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-white">{today.pending_reviews}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Assets awaiting approval</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/content/pending')}
              className="flex items-center justify-between text-[11px] font-bold text-amber-300 hover:text-amber-200 transition group cursor-pointer"
            >
              <span>Fast Review Queue</span>
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* 4. Active Creators & Rules */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4 flex flex-col justify-between hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider">
              <span>Contributors</span>
              <Award size={15} className="text-purple-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-white">{today.total_contributors}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">{today.total_published} assets live</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/users/author-level-rules')}
              className="flex items-center justify-between text-[11px] font-bold text-purple-300 hover:text-purple-200 transition group cursor-pointer"
            >
              <span>Manage Level Rules</span>
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>

      </div>

      {/* QUICK ACTIONS BAR & LIVE RECENT ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions Shortcuts */}
        <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-indigo-400" />
              Quick Mission Control
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Direct shortcuts for daily administrative operations.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/content/pending')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 hover:border-indigo-500/50 hover:bg-gray-800 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Review Submissions</span>
                    <span className="text-[10px] text-gray-400">{today.pending_reviews} files pending</span>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => navigate('/dashboard/users/author-level-rules')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 hover:border-purple-500/50 hover:bg-gray-800 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <Award size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Author Level Rules</span>
                    <span className="text-[10px] text-gray-400">Manage ranks & history</span>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => navigate('/dashboard/settings/system-health')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 hover:border-emerald-500/50 hover:bg-gray-800 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">System Health & Logs</span>
                    <span className="text-[10px] text-gray-400">Database & R2 diagnosis</span>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Recent Activity Feed */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-800 bg-gray-900/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" />
                  Live Activity Stream
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">Real-time marketplace uploads & download events</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                Latest 6 events
              </span>
            </div>

            <div className="space-y-2.5">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">No recent activity detected.</div>
              ) : (
                recentActivity.map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-800/30 border border-gray-800/80 hover:bg-gray-800/50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        act.type === 'download' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {act.type === 'download' ? <Download size={15} /> : <Upload size={15} />}
                      </div>
                      <div className="flex flex-col max-w-sm sm:max-w-md">
                        <span className="text-xs font-bold text-white truncate">{act.title}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(act.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(act.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 ${
                      act.type === 'download' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {act.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PlatformPulseWidget;
