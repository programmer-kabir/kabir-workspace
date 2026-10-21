// admin-frontend/src/pages/WorkstationVideoLogs.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiFilm, FiCalendar, FiUser, FiClock, FiHardDrive, 
  FiRefreshCw, FiPlay, FiExternalLink, FiX, FiCheckCircle,
  FiSearch, FiFastForward, FiSliders, FiShield, FiFolder
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';

export default function WorkstationVideoLogs() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState([]);
  const [stats, setStats] = useState({
    total_staff: 0,
    total_clips: 0,
    total_hours: 0
  });

  // Active playing modal
  const [activeClipModal, setActiveClipModal] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/screen_monitor/get_workstation_videos.php?date=${selectedDate}`);
      if (res.data?.status === 'success') {
        setVideoData(res.data.data || []);
        setStats({
          total_staff: res.data.total_staff_recorded || 0,
          total_clips: res.data.total_clips_count || 0,
          total_hours: res.data.total_recorded_hours || 0
        });
      }
    } catch (err) {
      console.error('Failed to load workstation video logs:', err);
      toast.error('ভিডিও লগ লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedDate]);

  // Filter staff list
  const filteredStaffList = videoData.filter(staff => {
    const matchesStaff = staffFilter === 'all' || String(staff.user_id) === String(staffFilter);
    const matchesSearch = staff.staff_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStaff && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-2xs">
              <FiFilm size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Workstation Video Audit Vault
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  30-Min Chunks
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Continuous surveillance screen recordings synced with Google Drive (<span className="text-indigo-600 dark:text-indigo-300 font-bold">CCA_Vault</span>).
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
            <FiCalendar className="text-indigo-500 dark:text-indigo-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={fetchVideos}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-2xs">
            <FiUser />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recorded Staff</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total_staff} Staff</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-600/15 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-2xs">
            <FiClock />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Recorded Hours</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total_hours} Hours</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-600/15 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-2xs">
            <FiFilm />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed 30-Min Clips</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total_clips} Clips</h3>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search staff name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition shadow-2xs"
          />
        </div>

        <select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option value="all">All Staff Members</option>
          {videoData.map(s => (
            <option key={s.user_id} value={s.user_id}>{s.staff_name} ({s.total_clips} clips)</option>
          ))}
        </select>
      </div>

      {/* ── Staff Video Cards Roster ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
          <FiRefreshCw className="animate-spin text-3xl mb-3 text-indigo-500 dark:text-indigo-400" />
          <p className="text-sm font-bold">গুগল ড্রাইভ ও সার্ভার থেকে ভিডিও হিস্ট্রি লোড হচ্ছে...</p>
        </div>
      ) : filteredStaffList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-3xl text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center text-2xl mb-3">
            <FiFilm />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">কোনো ভিডিও রেকর্ড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            নির্বাচিত তারিখে ({selectedDate}) কোনো স্টাফ চেক-ইন করে ভিডিও রেকর্ড জমা দেয়নি অথবা আজকের রেকর্ডিং চলছে।
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStaffList.map(staff => (
            <div 
              key={staff.user_id}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs"
            >
              {/* Staff Card Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-black flex items-center justify-center text-sm uppercase">
                    {staff.staff_name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{staff.staff_name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      User #{staff.user_id} &bull; Total: <span className="text-indigo-600 dark:text-indigo-300 font-bold">{Math.round(staff.total_duration_minutes / 60 * 10) / 10} hrs</span> ({staff.total_clips} clips) &bull; Size: {Math.round(staff.total_size_mb)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
                    <FiCheckCircle size={12} /> Google Drive Synced
                  </span>
                </div>
              </div>

              {/* 30-Minute Clip Timeline Grid */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {staff.clips.map((clip, idx) => (
                  <div 
                    key={clip.id}
                    className="group relative bg-slate-50/90 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                          Clip #{clip.chunk_index || idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {clip.file_size_mb} MB
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white mb-1">
                        <FiClock className="text-indigo-500 dark:text-indigo-400 shrink-0" size={14} />
                        <span>{clip.start_time_formatted || clip.start_time} - {clip.end_time_formatted || clip.end_time}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        Duration: {Math.round(clip.duration_seconds / 60)} minutes
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
                      <button
                        onClick={() => {
                          setActiveClipModal(clip);
                          setPlaybackSpeed(1);
                        }}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FiPlay size={12} /> Play
                      </button>

                      {clip.drive_view_link && (
                        <a
                          href={clip.drive_view_link}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in Google Drive"
                          className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition border border-slate-200 dark:border-slate-700"
                        >
                          <FiExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Interactive Video Player Modal with 1x, 2x, 4x, 8x Speed ─────── */}
      {activeClipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <FiFilm className="text-indigo-500 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {activeClipModal.staff_name} &bull; Clip #{activeClipModal.chunk_index} ({activeClipModal.start_time_formatted || activeClipModal.start_time} - {activeClipModal.end_time_formatted || activeClipModal.end_time})
                </h3>
              </div>
              <button
                onClick={() => setActiveClipModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative bg-black aspect-video w-full flex items-center justify-center">
              {activeClipModal.embed_url ? (
                <iframe
                  src={activeClipModal.embed_url}
                  className="w-full h-full border-0"
                  allow="autoplay"
                  title="Workstation Recording"
                />
              ) : (
                <p className="text-xs text-slate-400">Video preview not available</p>
              )}
            </div>

            {/* Playback Controls & Speed Switcher */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <FiFastForward /> Speed:
                </span>
                {[1, 1.5, 2, 4, 8].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${playbackSpeed === spd
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={activeClipModal.drive_view_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold"
                >
                  <FiFolder size={12} /> View in Google Drive Vault
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
