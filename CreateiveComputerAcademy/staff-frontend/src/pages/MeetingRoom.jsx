import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiPhoneOff, FiZap, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import MeetingRoomView from '../components/MeetingRoomView';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  const isHostOrAdmin = currentUser?.roles &&
    currentUser.roles.some(r => ['admin', 'developer', 'manager'].includes(r));

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
    if (!window.confirm('Are you sure you want to end this meeting for everyone?')) return;

    setEnding(true);
    try {
      const res = await axios.post(`${API_BASE}api/meetings/end_meeting.php`, {
        room_id: roomId,
        user_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        toast.success('Meeting ended successfully.');
        navigate('/meetings');
      }
    } catch (err) {
      toast.error('Failed to end meeting.');
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 px-2">
        <button
          onClick={() => navigate('/meetings')}
          className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
        >
          <FiArrowLeft size={14} />
          <span>Leave Room</span>
        </button>

        <div className="flex items-center gap-2">
          {isHostOrAdmin && (
            <button
              onClick={handleEndMeeting}
              disabled={ending}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Close meeting room and end conference for all members"
            >
              {ending ? <FiLoader className="animate-spin" size={13} /> : <FiPhoneOff size={13} />}
              <span>End Meeting For All</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conference View */}
      <MeetingRoomView
        roomId={roomId}
        meetingTitle={meeting?.title || 'Creative Computer Academy Conference'}
        currentUser={currentUser}
        onLeave={() => navigate('/meetings')}
      />

    </div>
  );
}
