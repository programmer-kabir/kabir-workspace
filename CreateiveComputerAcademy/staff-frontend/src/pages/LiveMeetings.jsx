import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiRadio, FiCalendar, FiClock, FiUsers, FiUser, FiArrowRight,
  FiRefreshCw, FiLoader, FiPlay, FiCheckCircle, FiShield,
  FiVideo, FiSearch, FiCopy, FiCheck, FiInfo, FiPlus
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function LiveMeetings() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Can manage meetings (Admin, Developer, Manager)
  const canManage = currentUser?.roles &&
    currentUser.roles.some(r => ['admin', 'developer', 'manager'].includes(r));

  // Modals
  const [instantModalOpen, setInstantModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [createdMeetingSuccess, setCreatedMeetingSuccess] = useState(null);

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
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    const poll = setInterval(fetchMeetings, 20000);
    return () => clearInterval(poll);
  }, [fetchMeetings]);

  // Handle Launch Instant
  const handleLaunchInstant = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(isBn ? 'মিটিংয়ের শিরোনাম আবশ্যক।' : 'Meeting title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || '';
      const res = await axios.post(`${API_BASE}api/meetings/create_meeting.php`, {
        token,
        admin_id: currentUser?.id,
        user_id: currentUser?.id,
        title: title.trim(),
        agenda: agenda.trim() || null,
        meeting_type: 'instant'
      });

      if (res.data.status === 'success' || res.data.room_id || res.data.status === 'active') {
        toast.success(isBn ? 'ইনস্ট্যান্ট মিটিং শুরু হয়েছে!' : 'Instant conference launched!');
        setInstantModalOpen(false);
        const createdTitle = title.trim();
        const createdAgenda = agenda.trim() || null;
        setTitle('');
        setAgenda('');
        fetchMeetings();
        setCreatedMeetingSuccess({
          room_id: res.data.room_id,
          title: res.data.title || createdTitle,
          agenda: createdAgenda,
          type: 'instant',
          meeting_url: `${window.location.origin}/meetings/${res.data.room_id}`
        });
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
      toast.error(isBn ? 'শিরোনাম ও তারিখ/সময় আবশ্যক।' : 'Title and Scheduled Date/Time are required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || '';
      const res = await axios.post(`${API_BASE}api/meetings/create_meeting.php`, {
        token,
        admin_id: currentUser?.id,
        user_id: currentUser?.id,
        title: title.trim(),
        agenda: agenda.trim() || null,
        meeting_type: 'scheduled',
        scheduled_start: scheduledStart.replace('T', ' ') + ':00'
      });

      if (res.data.status === 'success' || res.data.room_id || res.data.status === 'active') {
        toast.success(isBn ? 'মিটিং সফলভাবে শিডিউল করা হয়েছে!' : 'Meeting scheduled successfully!');
        setScheduleModalOpen(false);
        const schedTitle = title.trim();
        const schedAgenda = agenda.trim() || null;
        const schedTime = scheduledStart;
        setTitle('');
        setAgenda('');
        setScheduledStart('');
        fetchMeetings();
        setCreatedMeetingSuccess({
          room_id: res.data.room_id,
          title: res.data.title || schedTitle,
          agenda: schedAgenda,
          type: 'scheduled',
          scheduled_start: schedTime,
          meeting_url: `${window.location.origin}/meetings/${res.data.room_id}`
        });
      } else {
        toast.error(res.data.message || 'Failed to schedule meeting.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    toast.success(isBn ? 'রুম আইডি কপি হয়েছে!' : `Room ID copied: ${roomId}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* 🚀 HERO STUDIO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-6 md:p-8 text-white border border-slate-700/60 shadow-2xl">
        {/* Ambient Lights */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/4 -bottom-16 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>{isBn ? 'লাইভ কনফারেন্স ও অডিও-ভিডিও মিটিং' : 'CCA Live Conference Hub'}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{isBn ? 'লাইভ মিটিং হাব' : 'Live Meeting Hub'}</span>
              {activeMeetings.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-600 text-white font-black animate-pulse uppercase tracking-wider">
                  {activeMeetings.length} {isBn ? 'সচল' : 'LIVE'}
                </span>
              )}
            </h1>

            <p className="text-sm text-slate-300/90 leading-relaxed">
              {isBn 
                ? 'অ্যাকাডেমির সকল জরুরি টিম মিটিং, ডেইলি ব্রিফিং ও প্রশিক্ষণ সেশনে সরাসরি যোগ দিন। মিটিংয়ে উপস্থিতির সময় স্বয়ংক্রিয়ভাবে রেকর্ড হয়।'
                : 'Join live team standups, training workshops, and academy reviews seamlessly. Your participation time is automatically tracked.'}
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isBn ? 'বর্তমানে চলছে' : 'Active Live'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${activeMeetings.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {activeMeetings.length}
                </span>
                <span className="text-[10px] text-slate-400">{isBn ? 'টি রুম' : 'rooms'}</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isBn ? 'নির্ধারিত' : 'Scheduled'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-sky-400">
                  {scheduledMeetings.length}
                </span>
                <span className="text-[10px] text-slate-400">{isBn ? 'টি মিটিং' : 'upcoming'}</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isBn ? 'অতীত রেকর্ড' : 'Past Records'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-200">
                  {pastMeetings.length}
                </span>
                <span className="text-[10px] text-slate-400">{isBn ? 'টি শেষ' : 'ended'}</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-[130px]">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <FiShield size={11} /> {isBn ? 'অটো হাজিরা' : 'Attendance'}
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-[11px] text-emerald-300 font-bold">
                <span>{isBn ? 'সক্রিয় ট্র্যাকিং' : 'Auto Synced'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Sync Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="flex items-center gap-2.5 flex-wrap">
            {canManage && (
              <>
                <button
                  onClick={() => setInstantModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 text-white font-black rounded-2xl text-xs shadow-lg shadow-rose-500/25 transition-all transform active:scale-95 cursor-pointer"
                >
                  <FiPlay size={13} className="fill-current" />
                  <span>{isBn ? '⚡ ইনস্ট্যান্ট মিটিং শুরু করুন' : '⚡ Start Instant Meeting'}</span>
                </button>

                <button
                  onClick={() => setScheduleModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold rounded-2xl text-xs border border-white/15 shadow-sm transition-all transform active:scale-95 cursor-pointer"
                >
                  <FiCalendar size={13} />
                  <span>{isBn ? '📅 শিডিউল করুন' : '📅 Schedule Meeting'}</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <FiRefreshCw size={12} className={loading ? 'animate-spin text-rose-400' : ''} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 🔴 ACTIVE LIVE CONFERENCES */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
            <FiRadio size={16} className={activeMeetings.length > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isBn ? 'বর্তমানে চালু থাকা লাইভ মিটিং' : 'Live Ongoing Meetings'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {activeMeetings.length}
              </span>
            </h2>
          </div>
        </div>

        {activeMeetings.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-center flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FiVideo size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isBn ? 'বর্তমানে কোনো লাইভ মিটিং সক্রিয় নেই' : 'No Live Meetings Active At This Moment'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              {isBn
                ? 'অ্যাডমিন অথবা টিম হোস্ট কোনো মিটিং শুরু করলে সাথে সাথে এখানে নোটিফিকেশন দেখতে পাবেন।'
                : 'Whenever an administrator launches an instant conference, you will receive an instant ring here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeMeetings.map((m) => (
              <div
                key={m.id}
                className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border-2 border-rose-500/40 p-6 shadow-xl shadow-rose-950/20 flex flex-col justify-between gap-5 group"
              >
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-rose-500/15 blur-2xl group-hover:bg-rose-500/25 transition-all" />

                <div className="space-y-3 relative z-10">
                  {/* Top pill bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>{isBn ? 'সরাসরি সম্প্রচার' : 'LIVE ON AIR'}</span>
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
                      title={isBn ? 'রুম আইডি কপি করুন' : 'Click to copy Room ID'}
                    >
                      {copiedId === m.room_id ? (
                        <>
                          <FiCheck size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">{isBn ? 'কপি হয়েছে' : 'Copied!'}</span>
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
                      <p className="text-xs text-slate-500 italic mt-1">
                        {isBn ? 'সাধারণ টিম আলোচনা ও ব্রিফিং' : 'General team standup & discussion'}
                      </p>
                    )}
                  </div>

                  {/* Host & Participants Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 ring-2 ring-rose-500/40 flex items-center justify-center font-bold text-[11px] text-white">
                        {m.creator_name ? m.creator_name.charAt(0).toUpperCase() : 'H'}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block -mb-0.5">{isBn ? 'হোস্ট' : 'Host'}</span>
                        <strong className="text-slate-200 font-bold">{m.creator_name || 'Admin'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <FiUsers size={12} />
                      <span>{m.live_participants_count} {isBn ? 'জন ভেতরে আছেন' : 'in room'}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <Link
                  to={`/meetings/${m.room_id}`}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/30 hover:shadow-rose-600/45 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10"
                >
                  <FiPlay size={14} className="fill-current" />
                  <span>{isBn ? 'এখনই কনফারেন্সে যোগ দিন' : 'Join Live Conference Now'}</span>
                  <FiArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📅 SCHEDULED MEETINGS SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <FiCalendar size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isBn ? 'নির্ধারিত মিটিং শিডিউল' : 'Scheduled Academy Meetings'}
              </h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {scheduledMeetings.length} {isBn ? 'টি মিটিং' : 'upcoming'}
          </span>
        </div>

        {scheduledMeetings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold">
            {isBn ? 'বর্তমানে কোনো নির্ধারিত মিটিং শিডিউল নেই।' : 'No upcoming meetings scheduled right now.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledMeetings.map((sm) => (
              <div
                key={sm.id}
                className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-sky-500/40 transition"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    <FiClock size={13} />
                    <span>{sm.scheduled_start || 'TBA'}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{sm.title}</h4>
                  {sm.agenda && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sm.agenda}</p>}
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-slate-400">
                  <span>Host: <strong className="text-slate-700 dark:text-slate-300">{sm.creator_name || 'Admin'}</strong></span>
                  <Link
                    to={`/meetings/${sm.room_id}`}
                    className="text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>{isBn ? 'রুম লিংক' : 'Room Link'}</span>
                    <FiArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📜 PAST RECENT MEETINGS ARCHIVE */}
      {pastMeetings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isBn ? 'সম্প্রতি সমাপ্ত মিটিং রেকর্ড' : 'Recent Completed Meetings'}
            </h2>
            <span className="text-xs text-slate-400">
              {pastMeetings.length} {isBn ? 'টি সেশন' : 'sessions'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pastMeetings.slice(0, 10).map((pm) => (
              <div key={pm.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{pm.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {pm.actual_start?.slice(0, 10)} &bull; {pm.actual_start?.slice(11, 16)} – {pm.actual_end?.slice(11, 16) || (isBn ? 'সমাপ্ত' : 'Ended')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {pm.total_attendees_count} {isBn ? 'জন উপস্থিত ছিল' : 'Attended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🌟 MODAL: LAUNCH INSTANT MEETING (STAFF/DEV) */}
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
                    {isBn ? 'ইনস্ট্যান্ট মিটিং শুরু করুন' : 'Start Instant Conference'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isBn ? 'তাৎক্ষণিক রুম চালু হবে ও স্টাফদের কাছে রিং যাবে' : 'Launch now with immediate staff notification'}
                  </p>
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
                  {isBn ? 'মিটিংয়ের শিরোনাম *' : 'Meeting Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: ডিজাইন পর্যালোচনা ও টিম মিটিং' : 'e.g. Design Review & Standup'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  {isBn ? 'আলোচনার বিষয় / নোট (ঐচ্ছিক)' : 'Agenda / Notes (Optional)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isBn ? 'মিটিংয়ের বিষয়বস্তু...' : 'Key talking points or topics...'}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 resize-none transition"
                />
              </div>

              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2.5">
                <FiInfo size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>
                  {isBn 
                    ? 'মিটিং চালু হওয়ার সাথে সাথে অ্যাকাডেমির সকল সক্রিয় সদস্যের কাছে জয়েন লিংকসহ নোটিফিকেশন যাবে।'
                    : 'All active staff members will immediately receive a live broadcast chime with a 1-click Join link.'}
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setInstantModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (isBn ? 'চালু হচ্ছে...' : 'Launching...') : (isBn ? '🚀 মিটিং চালু করুন' : '🚀 Launch Room Now')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📅 MODAL: SCHEDULE MEETING (STAFF/DEV) */}
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
                    {isBn ? 'মিটিং শিডিউল করুন' : 'Schedule Academy Meeting'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isBn ? 'ভবিষ্যতের জন্য নির্দিষ্ট সময় নির্ধারণ করুন' : 'Set a future date and time for your team'}
                  </p>
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
                  {isBn ? 'মিটিংয়ের শিরোনাম *' : 'Meeting Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: মাসিক প্রজেক্ট ব্রিফিং' : 'e.g. Monthly Staff Review & Roadmap'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  {isBn ? 'নির্ধারিত তারিখ ও সময় *' : 'Scheduled Date & Time *'}
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
                  {isBn ? 'আলোচনার বিষয় (ঐচ্ছিক)' : 'Agenda / Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isBn ? 'বিষয়বস্তুর বিবরণ...' : 'Discussion points...'}
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
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Scheduling...') : (isBn ? 'শিডিউল নিশ্চিত করুন' : 'Save Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎉 MODAL: MEETING CREATED SUCCESS POPUP */}
      {createdMeetingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 md:p-7 text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-rose-500/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl" />

            {/* Success Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 animate-bounce">
              <FiCheck size={32} className="stroke-[3]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2">
              <span>{isBn ? '🎉 মিটিং সফলভাবে তৈরি হয়েছে' : '🎉 Meeting Created Successfully'}</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {createdMeetingSuccess.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {createdMeetingSuccess.type === 'instant' 
                ? (isBn ? 'লাইভ কনফারেন্স সক্রিয় হয়েছে ও সকল সদস্যকে নোটিফিকেশন পাঠানো হয়েছে!' : 'Live studio broadcast is active and all staff have received an instant chime!')
                : (isBn ? 'মিটিংটি সফলভাবে শিডিউল করা হয়েছে।' : 'Meeting has been successfully scheduled into the academy calendar.')}
            </p>

            {/* Room ID & Link Card */}
            <div className="my-5 p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isBn ? 'মিটিং রুম আইডি' : 'Meeting Room ID'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{createdMeetingSuccess.room_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdMeetingSuccess.meeting_url}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdMeetingSuccess.meeting_url);
                    setLinkCopied(true);
                    toast.success(isBn ? 'মিটিং লিংক কপি হয়েছে!' : 'Meeting link copied to clipboard!');
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {linkCopied ? <FiCheck size={13} className="text-emerald-400" /> : <FiCopy size={13} />}
                  <span>{linkCopied ? (isBn ? 'কপি হয়েছে' : 'Copied!') : (isBn ? 'কপি' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setCreatedMeetingSuccess(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন ও এখানেই থাকুন' : 'Close & Stay Here'}
              </button>

              {createdMeetingSuccess.type === 'instant' && (
                <button
                  onClick={() => {
                    const rid = createdMeetingSuccess.room_id;
                    setCreatedMeetingSuccess(null);
                    navigate(`/meetings/${rid}`);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FiPlay size={13} className="fill-current" />
                  <span>{isBn ? 'এখনই রুমে যোগ দিন' : 'Enter Room Now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
