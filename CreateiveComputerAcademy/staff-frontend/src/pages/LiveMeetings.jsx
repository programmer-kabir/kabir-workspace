import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiRadio, FiCalendar, FiClock, FiUsers, FiUser, FiArrowRight,
  FiRefreshCw, FiLoader, FiPlay, FiCheckCircle, FiShield,
  FiVideo, FiSearch, FiCopy, FiCheck
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

        {/* Sync bar */}
        <div className="relative z-10 flex items-center justify-between pt-5 mt-5 border-t border-white/10">
          <span className="text-xs text-slate-400">
            {isBn ? 'স্ট্যাটাস প্রতি ২০ সেকেন্ড পর পর স্বয়ংক্রিয়ভাবে রিফ্রেশ হয়' : 'Live meetings refresh automatically every 20 seconds'}
          </span>
          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition cursor-pointer"
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

    </div>
  );
}
