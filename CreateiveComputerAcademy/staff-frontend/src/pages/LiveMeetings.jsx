import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiRadio, FiCalendar, FiClock, FiUsers, FiUser, FiArrowRight,
  FiRefreshCw, FiLoader, FiPlay, FiCheckCircle, FiShield
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
    // Auto refresh active meetings every 20s
    const poll = setInterval(fetchMeetings, 20000);
    return () => clearInterval(poll);
  }, [fetchMeetings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xs">
            <FiRadio size={24} className={activeMeetings.length > 0 ? 'animate-pulse text-rose-500' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {isBn ? 'লাইভ মিটিং ও কনফারেন্স হাব' : 'Live Meeting & Conference Hub'}
              </h1>
              {activeMeetings.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {activeMeetings.length} {isBn ? 'লাইভ' : 'Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isBn 
                ? 'অ্যাকাডেমির সকল জরুরি মিটিং, ডেইলি ব্রিফিং ও প্রশিক্ষণ সেশনে সরাসরি যুক্ত হোন।'
                : 'Join instant team standups, training workshops and design reviews seamlessly.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchMeetings}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition self-start sm:self-center cursor-pointer"
        >
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
        </button>
      </div>

      {/* 🔴 ACTIVE LIVE MEETINGS SECTION */}
      {activeMeetings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {isBn ? 'বর্তমানে চালু থাকা মিটিংসমূহ' : 'Live Ongoing Meetings'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMeetings.map((m) => (
              <div
                key={m.id}
                className="bg-gradient-to-br from-rose-500/5 via-white dark:via-slate-900 to-amber-500/5 p-6 rounded-3xl border-2 border-rose-500/30 dark:border-rose-500/20 shadow-md flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE NOW
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Started: {m.actual_start?.slice(11, 16) || 'Just now'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">
                    {m.title}
                  </h3>
                  {m.agenda && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {m.agenda}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      {m.creator_avatar ? (
                        <img src={`${API_BASE}/${m.creator_avatar}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={12} />
                      )}
                    </div>
                    <span>Host: <strong className="text-slate-700 dark:text-slate-300">{m.creator_name || 'Admin'}</strong></span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <FiUsers size={12} />
                      {m.live_participants_count} {isBn ? 'জন ভেতরে আছেন' : 'in room'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/meetings/${m.room_id}`}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <FiPlay size={14} className="fill-current" />
                  <span>{isBn ? 'এখনই মিটিংয়ে যোগ দিন' : 'Join Live Meeting Now'}</span>
                  <FiArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📅 UPCOMING SCHEDULED MEETINGS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-primary-500" size={18} />
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            {isBn ? 'নির্ধারিত মিটিং শিডিউল' : 'Scheduled Academy Meetings'}
          </h2>
        </div>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FiLoader className="w-6 h-6 animate-spin text-primary-500" />
            <span className="text-xs">Loading meetings...</span>
          </div>
        ) : scheduledMeetings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold">
            {isBn ? 'বর্তমানে কোনো নির্ধারিত মিটিং নেই।' : 'No upcoming meetings scheduled right now.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledMeetings.map((sm) => (
              <div
                key={sm.id}
                className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <FiClock size={13} />
                    <span>{sm.scheduled_start || 'TBA'}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1.5">{sm.title}</h4>
                  {sm.agenda && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sm.agenda}</p>}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-400">
                  <span>Host: {sm.creator_name || 'Admin'}</span>
                  <Link
                    to={`/meetings/${sm.room_id}`}
                    className="text-primary-600 font-bold hover:underline"
                  >
                    Room Link &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📜 RECENT PAST MEETINGS */}
      {pastMeetings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {isBn ? 'সম্প্রতি সমাপ্ত মিটিং রেকর্ড' : 'Recent Completed Meetings'}
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pastMeetings.map((pm) => (
              <div key={pm.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{pm.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {pm.actual_start?.slice(0, 10)} &bull; {pm.actual_start?.slice(11, 16)} – {pm.actual_end?.slice(11, 16) || 'Ended'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500">
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
