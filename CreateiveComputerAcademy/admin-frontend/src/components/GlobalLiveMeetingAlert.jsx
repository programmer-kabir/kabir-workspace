import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiRadio, FiVideo, FiArrowRight, FiX, FiUsers } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function GlobalLiveMeetingAlert() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeMeeting, setActiveMeeting] = useState(null);
  const [dismissedRoomId, setDismissedRoomId] = useState(null);

  // If already in a meeting room or in the meeting manager, suppress alert
  const isMeetingPage = location.pathname.startsWith('/meetings');

  useEffect(() => {
    let isMounted = true;

    const checkActive = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/meetings/get_meetings.php`);
        if (res.data.status === 'success' && isMounted) {
          const list = res.data.active_meetings || [];
          if (list.length > 0) {
            const latest = list[0];
            const dismissed = sessionStorage.getItem(`dismissed_admin_meeting_${latest.room_id}`);
            if (!dismissed) {
              setActiveMeeting(latest);
            } else {
              setActiveMeeting(null);
            }
          } else {
            setActiveMeeting(null);
          }
        }
      } catch (err) {
        // silent
      }
    };

    checkActive();
    const interval = setInterval(checkActive, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isMeetingPage || !activeMeeting || dismissedRoomId === activeMeeting.room_id) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(`dismissed_admin_meeting_${activeMeeting.room_id}`, 'true');
    setDismissedRoomId(activeMeeting.room_id);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border-2 border-rose-500/50 p-4 shadow-2xl shadow-rose-950/40 backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full bg-rose-500/20 blur-xl" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
              <FiRadio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>LIVE MEETING ACTIVE</span>
              </div>
              <h4 className="text-xs font-black text-white line-clamp-1">
                {activeMeeting.title}
              </h4>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition shrink-0"
            title="Dismiss"
          >
            <FiX size={13} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 relative z-10">
          <span>Host: <strong className="text-slate-200">{activeMeeting.creator_name || 'Admin'}</strong></span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <FiUsers size={11} />
            <span>{activeMeeting.live_participants_count} in room</span>
          </span>
        </div>

        <div className="mt-3 flex gap-2 relative z-10">
          <button
            onClick={() => navigate(`/meetings/${activeMeeting.room_id}`)}
            className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 hover:from-rose-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FiVideo size={13} />
            <span>Enter Studio Room</span>
            <FiArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
