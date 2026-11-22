import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiRadio, FiPlus, FiCalendar, FiClock, FiUsers, FiUser, FiPlay,
  FiPhoneOff, FiRefreshCw, FiLoader, FiX, FiCheck, FiInfo, FiCopy,
  FiSearch, FiFilter, FiVideo, FiShield, FiArrowRight, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function MeetingManager() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeMeetings, setActiveMeetings] = useState([]);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'scheduled' | 'past'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [instantModalOpen, setInstantModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedMeetingForAttendees, setSelectedMeetingForAttendees] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/meetings/get_meetings.php`);
      if (res.data.status === 'success') {
        setActiveMeetings(res.data.active_meetings || []);
        setScheduledMeetings(res.data.scheduled_meetings || []);
        setPastMeetings(res.data.past_meetings || []);
      }
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 20000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  // Handle Launch Instant
  const handleLaunchInstant = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Meeting title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token') || '';
      const res = await axios.post(`${API_BASE}api/meetings/create_meeting.php`, {
        token,
        admin_id: currentUser?.id,
        user_id: currentUser?.id,
        title: title.trim(),
        agenda: agenda.trim() || null,
        meeting_type: 'instant'
      });

      if (res.data.status === 'success') {
        toast.success('Instant conference launched! Alerting all staff members...');
        setInstantModalOpen(false);
        setTitle('');
        setAgenda('');
        navigate(`/meetings/${res.data.room_id}`);
      } else {
        toast.error(res.data.message || 'Failed to start meeting.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Schedule Meeting
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledStart) {
      toast.error('Title and Scheduled Date/Time are required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token') || '';
      const res = await axios.post(`${API_BASE}api/meetings/create_meeting.php`, {
        token,
        admin_id: currentUser?.id,
        user_id: currentUser?.id,
        title: title.trim(),
        agenda: agenda.trim() || null,
        meeting_type: 'scheduled',
        scheduled_start: scheduledStart.replace('T', ' ') + ':00'
      });

      if (res.data.status === 'success') {
        toast.success('Meeting scheduled successfully!');
        setScheduleModalOpen(false);
        setTitle('');
        setAgenda('');
        setScheduledStart('');
        fetchMeetings();
      } else {
        toast.error(res.data.message || 'Failed to schedule meeting.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle End Meeting
  const handleEndMeeting = async (roomId) => {
    if (!window.confirm('Are you sure you want to end this live conference for all participants?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/meetings/end_meeting.php`, {
        room_id: roomId,
        admin_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        toast.success('Meeting ended and logs recorded.');
        fetchMeetings();
      }
    } catch (err) {
      toast.error('Failed to end meeting.');
    }
  };

  // View Attendees
  const handleViewAttendees = async (m) => {
    setSelectedMeetingForAttendees(m);
    setAttendeesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/meetings/get_meeting_attendance.php?meeting_id=${m.id}`);
      if (res.data.status === 'success') {
        setAttendees(res.data.attendees || []);
      }
    } catch (err) {
      toast.error('Failed to load attendees.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    toast.success(`Room ID copied: ${roomId}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered lists
  const filteredMeetings = useMemo(() => {
    let list = [];
    if (activeTab === 'all') {
      list = [...scheduledMeetings, ...pastMeetings];
    } else if (activeTab === 'scheduled') {
      list = [...scheduledMeetings];
    } else if (activeTab === 'past') {
      list = [...pastMeetings];
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(m =>
      m.title?.toLowerCase().includes(q) ||
      m.creator_name?.toLowerCase().includes(q) ||
      m.agenda?.toLowerCase().includes(q) ||
      m.room_id?.toLowerCase().includes(q)
    );
  }, [activeTab, scheduledMeetings, pastMeetings, searchQuery]);

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* 🚀 HERO STUDIO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-6 md:p-8 text-white border border-slate-700/60 shadow-2xl">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-16 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>CCA Broadcast Studio & Live Meetings</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Live Meeting Hub</span>
              {activeMeetings.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-600 text-white font-black animate-pulse uppercase tracking-wider">
                  {activeMeetings.length} ON AIR
                </span>
              )}
            </h1>

            <p className="text-sm text-slate-300/90 leading-relaxed">
              Launch instant WebRTC audio-video conferences, schedule masterclasses, and automatically capture precise attendee participation minutes.
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Now</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${activeMeetings.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {activeMeetings.length}
                </span>
                <span className="text-[10px] text-slate-400">sessions</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-sky-400">
                  {scheduledMeetings.length}
                </span>
                <span className="text-[10px] text-slate-400">upcoming</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Past Archives</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-200">
                  {pastMeetings.length}
                </span>
                <span className="text-[10px] text-slate-400">recorded</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <FiShield size={11} /> Auto Attendance
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-[11px] text-emerald-300 font-bold">
                <span>100% Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setInstantModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-rose-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <FiPlay size={13} className="fill-current" />
              <span>⚡ Start Instant Conference</span>
            </button>

            <button
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold rounded-2xl text-xs border border-white/15 shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <FiCalendar size={13} />
              <span>📅 Schedule Future Meeting</span>
            </button>
          </div>

          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl text-xs font-bold border border-white/10 transition cursor-pointer"
            title="Refresh All Meetings"
          >
            <FiRefreshCw size={13} className={loading ? 'animate-spin text-rose-400' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 🔴 ACTIVE LIVE CONFERENCES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <FiRadio size={16} className={activeMeetings.length > 0 ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Active Live Conferences</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {activeMeetings.length}
                </span>
              </h2>
            </div>
          </div>
        </div>

        {activeMeetings.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FiVideo size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Live Meetings Broadcasting Right Now
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All conference channels are quiet. Start an instant standup or meeting anytime with one click.
              </p>
            </div>
            <button
              onClick={() => setInstantModalOpen(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
            >
              <FiPlay size={12} className="fill-current" />
              <span>Launch Instant Meeting Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeMeetings.map((m) => (
              <div
                key={m.id}
                className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border-2 border-rose-500/40 p-6 shadow-xl shadow-rose-950/20 flex flex-col justify-between gap-5 group"
              >
                {/* Glow accent */}
                <div className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-rose-500/15 blur-2xl group-hover:bg-rose-500/25 transition-all" />

                <div className="space-y-3 relative z-10">
                  {/* Top pill bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>LIVE BROADCAST</span>
                      {/* Equalizer soundwave */}
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-0.5 h-2.5 bg-white animate-pulse" />
                        <span className="w-0.5 h-3.5 bg-white animate-pulse [animation-delay:150ms]" />
                        <span className="w-0.5 h-2 bg-white animate-pulse [animation-delay:300ms]" />
                      </span>
                    </div>

                    <button
                      onClick={() => copyRoomId(m.room_id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold transition cursor-pointer"
                      title="Click to copy Room ID"
                    >
                      {copiedId === m.room_id ? (
                        <>
                          <FiCheck size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FiCopy size={12} />
                          <span>{m.room_id}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Agenda */}
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight line-clamp-1">
                      {m.title}
                    </h3>
                    {m.agenda ? (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {m.agenda}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-1">General team discussion</p>
                    )}
                  </div>

                  {/* Host & Participant Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 ring-2 ring-rose-500/40 flex items-center justify-center font-bold text-[11px] text-white">
                        {m.creator_name ? m.creator_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block -mb-0.5">Host</span>
                        <strong className="text-slate-200 font-bold">{m.creator_name || 'Admin'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <FiUsers size={12} />
                      <span>{m.live_participants_count} in room</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800 relative z-10">
                  <Link
                    to={`/meetings/${m.room_id}`}
                    className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-xl text-center shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <FiVideo size={14} />
                    <span>Enter Studio Room</span>
                    <FiArrowRight size={14} />
                  </Link>

                  <button
                    onClick={() => handleViewAttendees(m)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    title="View current attendees and duration"
                  >
                    Logs ({m.total_attendees_count || 0})
                  </button>

                  <button
                    onClick={() => handleEndMeeting(m.room_id)}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition border border-rose-500/20 cursor-pointer"
                    title="End Meeting For Everyone"
                  >
                    <FiPhoneOff size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 SCHEDULED & ARCHIVED CONFERENCES SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        
        {/* Section Header with Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Meeting Directory & Attendance Logs
            </h2>
            <p className="text-xs text-slate-400">
              Review upcoming scheduled sessions and historical attendee attendance reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({scheduledMeetings.length + pastMeetings.length})
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'scheduled'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Scheduled ({scheduledMeetings.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'past'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Past Archives ({pastMeetings.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search meeting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Meeting Table */}
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <FiLoader className="w-6 h-6 animate-spin text-rose-500" />
            <span className="text-xs font-bold">Loading meeting archives...</span>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold">
            No meetings matching your current filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-left border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Title & Discussion</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Type</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Host</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Date & Time</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Attendance Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{m.title}</p>
                      {m.agenda && (
                        <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">{m.agenda}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-bold text-slate-600 dark:text-slate-300">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        m.meeting_type === 'instant'
                          ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                      }`}>
                        {m.meeting_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {m.creator_name || 'Admin'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {m.scheduled_start || m.actual_start || m.created_at}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        m.status === 'active'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                          : m.status === 'scheduled'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleViewAttendees(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-[11px] transition cursor-pointer"
                      >
                        <FiUsers size={12} className="text-primary-500" />
                        <span>Logs ({m.total_attendees_count || 0})</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 MODAL: LAUNCH INSTANT MEETING */}
      {instantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                  <FiRadio size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Start Instant Conference
                  </h3>
                  <p className="text-[11px] text-slate-400">Launch now with immediate staff notification</p>
                </div>
              </div>
              <button
                onClick={() => setInstantModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchInstant} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Standup & Design Sprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Agenda / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Key talking points or topics..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 resize-none transition"
                />
              </div>

              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2.5">
                <FiInfo size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>
                  All active staff portals will immediately receive a live broadcast chime with a 1-click Join link.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setInstantModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Launching...' : '🚀 Launch Room Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📅 MODAL: SCHEDULE FUTURE MEETING */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                  <FiCalendar size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Schedule Academy Meeting
                  </h3>
                  <p className="text-[11px] text-slate-400">Set a future date and time for your team</p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Staff Review & Roadmap"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Agenda / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Discussion points..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 resize-none transition"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Scheduling...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👥 MODAL: PARTICIPANT ATTENDANCE BREAKDOWN */}
      {selectedMeetingForAttendees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <FiUsers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                    {selectedMeetingForAttendees.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Total recorded attendees: <strong className="text-emerald-500">{attendees.length}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeetingForAttendees(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {attendeesLoading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <FiLoader className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="text-xs font-bold">Fetching participation timestamps...</span>
                </div>
              ) : attendees.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-bold">
                  No attendees recorded for this session yet.
                </div>
              ) : (
                attendees.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {att.profile_picture ? (
                          <img src={`${API_BASE}/${att.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FiUser size={15} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{att.user_name}</p>
                        <p className="text-[10px] text-slate-400">{att.designation || 'Academy Staff'}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {att.duration_minutes} mins present
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        In: {att.joined_at?.slice(11, 16)} &bull; Out: {att.left_at ? att.left_at.slice(11, 16) : 'Active'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
