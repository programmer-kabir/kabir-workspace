// Staff_Apps/Attendance-Desktop/src/components/MyWorkstationView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FiFilm, FiCalendar, FiClock, FiHardDrive, 
  FiRefreshCw, FiPlay, FiExternalLink, FiX, FiCheckCircle,
  FiSearch, FiSliders, FiShield, FiAlertTriangle, FiAlertOctagon,
  FiMonitor, FiActivity, FiCpu, FiInfo
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../utils/api';

const formatSeconds = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return '0s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
};

export default function MyWorkstationView() {
  const { currentUser } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'alerts'
  const [alertRange, setAlertRange] = useState('date'); // 'date', 'today', 'yesterday', 'week', 'all'
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [videos, setVideos] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total_clips: 0,
    total_recorded_minutes: 0,
    total_recorded_hours: 0,
    total_video_size_mb: 0,
    date_idle_minutes: 0,
    date_alert_count: 0,
    today_idle_minutes: 0,
    today_alert_count: 0,
    is_currently_idle: false,
    current_idle_seconds: 0,
    live_active_window: null,
    live_active_process: null,
    is_workstation_online: false
  });

  // Active playing clip modal
  const [activeClipModal, setActiveClipModal] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const fetchWorkstationLogs = useCallback(async (silent = false) => {
    if (!currentUser?.id) return;
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const base = getApiBase();
      const url = `${base}api/screen_monitor/get_my_workstation_logs.php?user_id=${currentUser.id}&date=${selectedDate}&range=${alertRange}`;
      const res = await axios.get(url);

      if (res.data?.status === 'success') {
        setVideos(res.data.videos || []);
        setAlerts(res.data.alerts || []);
        setStats(res.data.stats || {});
      } else {
        toast.error(res.data?.message || 'লগ লোড করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Failed to load workstation logs:', err);
      toast.error('ওয়ার্কস্টেশন ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id, selectedDate, alertRange]);

  useEffect(() => {
    fetchWorkstationLogs();
  }, [fetchWorkstationLogs]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header & Controls ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
              <FiMonitor size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                My Workstation & Recordings
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                আপনার দৈনিক কাজের ভিডিও রেকর্ডিং এবং ইনঅ্যাক্টিভিটি (Idle) লগ পর্যবেক্ষণ করুন।
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
            <FiCalendar className="text-slate-400" size={15} />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchWorkstationLogs(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
            title="Refresh logs"
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin text-blue-500' : ''} size={14} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Recorded Video Hours */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              রেকর্ডিং সময়
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FiFilm size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {stats.total_recorded_hours || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">ঘণ্টা ({stats.total_clips}টি ক্লিপ)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            নির্বাচিত তারিখে: {stats.total_recorded_minutes} মিনিট
          </p>
        </div>

        {/* Card 2: Idle Time on Date */}
        <div className={`p-5 rounded-2xl border transition-all ${
          stats.date_idle_minutes > 0 
            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-200 dark:border-amber-900/50 shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              নিষ্ক্রিয় (Idle) সময়
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.date_idle_minutes > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <FiClock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-black ${
              stats.date_idle_minutes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}>
              {stats.date_idle_minutes}
            </span>
            <span className="text-xs font-bold text-slate-500">মিনিট ({stats.date_alert_count} বার)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            আজকের মোট আইডল: {stats.today_idle_minutes} মিনিট
          </p>
        </div>

        {/* Card 3: Google Drive Cloud Sync */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ক্লাউড ব্যাকআপ
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              Drive Synced
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            মোট সাইজ: {stats.total_video_size_mb || 0} MB
          </p>
        </div>

        {/* Card 4: Workstation Live Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ওয়ার্কস্টেশন স্ট্যাটাস
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FiActivity size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 ${
              stats.is_workstation_online 
                ? stats.is_currently_idle 
                  ? 'bg-amber-500 animate-pulse' 
                  : 'bg-emerald-500 animate-ping'
                : 'bg-slate-400'
            }`} />
            <span className="text-sm md:text-base font-black text-slate-900 dark:text-white truncate">
              {stats.is_workstation_online 
                ? stats.is_currently_idle ? 'Currently Idle' : 'Online & Active' 
                : 'App Idle/Offline'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium truncate" title={stats.live_active_window || ''}>
            {stats.live_active_process ? `${stats.live_active_process}` : 'Desktop Agent Synced'}
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
            activeTab === 'videos'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiFilm size={16} />
          <span>কাজের ভিডিও রেকর্ডিং ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiClock size={16} />
          <span>নিষ্ক্রিয়তা (Idle) লগ ({alerts.length})</span>
        </button>
      </div>

      {/* ── TAB 1: WORKSTATION VIDEOS ─────────────────────────────────── */}
      {activeTab === 'videos' && (
        <div>
          {loading ? (
            <div className="py-20 text-center">
              <FiRefreshCw className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-500">ভিডিও ক্লিপগুলো লোড হচ্ছে...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FiFilm size={28} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                নির্বাচিত তারিখে কোনো ভিডিও ক্লিপ পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                তারিখ: ({selectedDate})। নিশ্চিত করুন ডেস্কটপ অ্যাপ ওপেন ছিল এবং আপনার ওয়ার্কস্টেশন রেকর্ডিং শুরু হয়েছিল।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((clip, idx) => (
                <div 
                  key={clip.id}
                  className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                        ক্লিপ #{clip.chunk_index || idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {clip.file_size_mb} MB
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white mb-1.5">
                      <FiClock className="text-blue-500 dark:text-blue-400 shrink-0" size={14} />
                      <span>{clip.start_time_formatted || clip.start_time} - {clip.end_time_formatted || clip.end_time}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>সময়কাল: {clip.duration_minutes || Math.round(clip.duration_seconds / 60)} মিনিট</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <FiCheckCircle size={11} /> Cloud
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveClipModal(clip);
                        setPlaybackSpeed(1);
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <FiPlay size={12} /> প্লে করুন
                    </button>

                    {clip.drive_view_link && (
                      <a
                        href={clip.drive_view_link}
                        target="_blank"
                        rel="noreferrer"
                        title="Google Drive-এ সরাসরি দেখুন"
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition border border-slate-200 dark:border-slate-700"
                      >
                        <FiExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: INACTIVITY / IDLE ALERTS ───────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Sub Filters for Alerts */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">ফিল্টার:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'date', label: `নির্বাচিত তারিখ (${selectedDate})` },
                  { key: 'today', label: 'আজকে' },
                  { key: 'yesterday', label: 'গতকাল' },
                  { key: 'week', label: 'বিগত ৭ দিন' },
                  { key: 'all', label: 'সকল হিস্ট্রি' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setAlertRange(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      alertRange === f.key
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <FiInfo size={14} />
              <span>মাউস/কীবোর্ড ৫+ মিনিট নিষ্ক্রিয় থাকলে সিস্টেম অ্যালার্ট রেকর্ড করে।</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <FiRefreshCw className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-500">অ্যালার্ট হিস্ট্রি লোড হচ্ছে...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <FiCheckCircle size={28} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                কোনো নিষ্ক্রিয়তা অ্যালার্ট পাওয়া যায়নি!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                এই সময়সীমায় আপনার কোনো অপ্রত্যাশিত অলস সময় (Idle Alert) রেকর্ড হয়নি। গ্রেট জব!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      <FiClock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                          {alert.started_at_time || alert.started_at} 
                          {alert.resumed_at_time ? ` - ${alert.resumed_at_time}` : ' (চলমান)'}
                        </span>
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          নিষ্ক্রিয়: {alert.idle_minutes || Math.round(alert.idle_seconds / 60)} মিনিট
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          alert.status === 'resumed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                        }`}>
                          {alert.status === 'resumed' ? 'Resumed / ফিরেছেন' : 'Active Idle'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <FiCpu size={12} className="text-blue-500" />
                          {alert.active_process || 'Desktop'}
                        </span>
                        <span>&bull;</span>
                        <span className="truncate max-w-xs md:max-w-md" title={alert.active_window_title || ''}>
                          {alert.active_window_title || 'No active window reported'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 font-medium">
                      তারিখ: {alert.alert_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Interactive Video Player Modal ────────────────────────────── */}
      {activeClipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <FiFilm className="text-blue-500 dark:text-blue-400" size={18} />
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                  ক্লিপ #{activeClipModal.chunk_index} ({activeClipModal.start_time_formatted} - {activeClipModal.end_time_formatted})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Speed Controls */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  {[1, 1.25, 1.5, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveClipModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Video Player Container */}
            <div className="relative bg-black flex-1 flex items-center justify-center aspect-video w-full overflow-hidden">
              {activeClipModal.embed_url ? (
                <iframe
                  src={activeClipModal.embed_url}
                  className="w-full h-full border-0"
                  allow="autoplay"
                  title="Workstation Recording"
                />
              ) : (
                <div className="text-center p-8 text-white space-y-2">
                  <FiAlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold">ভিডিও স্ট্রিমিং লিঙ্ক প্রস্তুত নয়</p>
                  <p className="text-xs text-slate-400">Google Drive-এ সরাসরি ফাইলটি দেখুন।</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                ফাইল সাইজ: {activeClipModal.file_size_mb} MB &bull; সময়কাল: {activeClipModal.duration_minutes} মিনিট
              </span>

              {activeClipModal.drive_view_link && (
                <a
                  href={activeClipModal.drive_view_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                >
                  Google Drive-এ ওপেন করুন <FiExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
