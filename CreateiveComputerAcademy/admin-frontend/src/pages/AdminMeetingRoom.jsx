import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiArrowLeft, FiPhoneOff, FiLoader, FiShield, FiRadio,
  FiClock, FiCopy, FiCheck, FiUsers
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import MeetingRoomView from '../components/MeetingRoomView';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function AdminMeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [copied, setCopied] = useState(false);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/meetings/get_meetings.php`);
        if (res.data.status === 'success' && isMounted) {
          const all = [
            ...(res.data.active_meetings || []),
            ...(res.data.scheduled_meetings || []),
            ...(res.data.past_meetings || [])
          ];
          const found = all.find(m => m.room_id === roomId);
          if (found) {
            setMeeting(found);
          }
        }
      } catch (err) {
        console.warn('Failed to load meeting details', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInfo();
    return () => { isMounted = false; };
  }, [roomId]);

  const handleEndMeeting = async () => {
    if (!window.confirm('Are you sure you want to end this live conference for ALL participants?')) return;

    setEnding(true);
    try {
      const res = await axios.post(`${API_BASE}api/meetings/end_meeting.php`, {
        room_id: roomId,
        admin_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        toast.success('Live conference ended. Attendance saved.');
        navigate('/meetings');
      }
    } catch (err) {
      toast.error('Failed to end meeting.');
    } finally {
      setEnding(false);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Meeting URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      
      {/* 🌟 FLOATING CYBER-STUDIO CONTROL BAR */}
      <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-700/60 dark:border-slate-800 rounded-3xl p-3 md:px-5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
        
        {/* Left: Back / Exit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/meetings')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition cursor-pointer border border-slate-700/60 active:scale-95"
          >
            <FiArrowLeft size={14} />
            <span>Leave Room</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>HOST BROADCAST</span>
            {/* Equalizer soundwave */}
            <span className="flex items-center gap-0.5 ml-1">
              <span className="w-0.5 h-2 bg-rose-400 animate-pulse" />
              <span className="w-0.5 h-3.5 bg-rose-400 animate-pulse [animation-delay:150ms]" />
              <span className="w-0.5 h-1.5 bg-rose-400 animate-pulse [animation-delay:300ms]" />
            </span>
          </div>
        </div>

        {/* Center: Title & Room ID */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-black text-white truncate max-w-xs md:max-w-md">
            {meeting?.title || 'Creative Computer Academy Live Host'}
          </span>
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition cursor-pointer"
            title="Copy Meeting URL"
          >
            {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
            <span>{copied ? 'Copied' : roomId}</span>
          </button>
        </div>

        {/* Right: Timer & Host Terminate Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono font-bold">
            <FiClock size={13} className="text-amber-400" />
            <span>{formatTimer(elapsedSec)}</span>
          </div>

          <button
            onClick={handleEndMeeting}
            disabled={ending}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {ending ? <FiLoader className="animate-spin" size={13} /> : <FiPhoneOff size={13} />}
            <span>End For Everyone</span>
          </button>
        </div>
      </div>

      {/* Main Conference Frame */}
      <MeetingRoomView
        roomId={roomId}
        meetingTitle={meeting?.title || 'CCA Studio Broadcast'}
        currentUser={currentUser}
        onLeave={() => navigate('/meetings')}
      />
    </div>
  );
}
