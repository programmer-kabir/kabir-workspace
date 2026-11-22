import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiRadio, FiPlus, FiCalendar, FiClock, FiUsers, FiUser, FiPlay,
  FiPhoneOff, FiRefreshCw, FiLoader, FiX, FiCheck, FiInfo, FiCopy
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

  // Modals
  const [instantModalOpen, setInstantModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedMeetingForAttendees, setSelectedMeetingForAttendees] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

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
        toast.success('Instant meeting launched! Alerting all staff...');
        setInstantModalOpen(false);
        setTitle('');
        setAgenda('');
        // Redirect host into room
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
    if (!window.confirm('Are you sure you want to end this live meeting for all participants?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/meetings/end_meeting.php`, {
        room_id: roomId,
        admin_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        toast.success('Meeting closed.');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <FiRadio size={20} className={activeMeetings.length > 0 ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Live Meeting Manager
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Launch instant video conferences, schedule workshops & monitor attendance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setInstantModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FiPlay size={14} className="fill-current" />
            <span>⚡ Launch Instant Meeting</span>
          </button>

          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FiCalendar size={14} />
            <span>📅 Schedule Meeting</span>
          </button>

          <button
            onClick={fetchMeetings}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh Meetings"
          >
            <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 🔴 ACTIVE LIVE ROOMS */}
      {activeMeetings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">
              Active Live Conferences ({activeMeetings.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMeetings.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border-2 border-rose-500/40 shadow-lg flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      ID: {m.room_id}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-800 dark:text-white mt-2">
                    {m.title}
                  </h3>
                  {m.agenda && <p className="text-xs text-slate-500 mt-0.5">{m.agenda}</p>}

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span>Host: <strong className="text-slate-700 dark:text-slate-200">{m.creator_name}</strong></span>
                    <span>&bull;</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <FiUsers size={12} /> {m.live_participants_count} in room
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <Link
                    to={`/meetings/${m.room_id}`}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl text-center transition shadow-xs"
                  >
                    Enter Room as Host
                  </Link>
                  <button
                    onClick={() => handleViewAttendees(m)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => handleEndMeeting(m.room_id)}
                    className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-100 transition"
                    title="End Meeting For All"
                  >
                    <FiPhoneOff size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULED & PAST MEETINGS TABS / TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-800 dark:text-white">
          All Meetings & Participation Logs
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading meetings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-left">
                  <th className="py-3 px-3">Title & Agenda</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Host</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Attendees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {[...scheduledMeetings, ...pastMeetings].map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800 dark:text-white">{m.title}</p>
                      {m.agenda && <p className="text-[11px] text-slate-400 truncate max-w-xs">{m.agenda}</p>}
                    </td>
                    <td className="py-3 px-3 capitalize font-bold text-slate-600 dark:text-slate-300">
                      {m.meeting_type}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {m.creator_name || 'Admin'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {m.scheduled_start || m.actual_start || m.created_at}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        m.status === 'active'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                          : m.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleViewAttendees(m)}
                        className="px-2.5 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 hover:bg-primary-100 rounded-lg font-bold text-[11px] transition"
                      >
                        View Logs ({m.total_attendees_count || 0})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: LAUNCH INSTANT MEETING */}
      {instantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FiRadio className="text-rose-500" /> Launch Instant Meeting
              </h3>
              <button onClick={() => setInstantModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleLaunchInstant} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Team Standup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Agenda / Discussion Points</label>
                <textarea
                  rows={3}
                  placeholder="Optional brief notes..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-medium outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-800 dark:text-rose-300 text-[11px]">
                ⚡ Upon launch, an instant notification ring will be broadcasted to all active staff members with a 1-click Join link.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInstantModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Launching...' : 'Launch Meeting Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE FUTURE MEETING */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FiCalendar className="text-primary-500" /> Schedule Meeting
              </h3>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Design Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Agenda notes..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-medium outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ATTENDEES */}
      {selectedMeetingForAttendees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Meeting Attendees: {selectedMeetingForAttendees.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total Attendees: {attendees.length}
                </p>
              </div>
              <button onClick={() => setSelectedMeetingForAttendees(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {attendeesLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading attendee logs...</div>
              ) : attendees.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No attendees recorded for this meeting.</div>
              ) : (
                attendees.map((att) => (
                  <div key={att.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {att.profile_picture ? (
                          <img src={`${API_BASE}/${att.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FiUser size={14} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{att.user_name}</p>
                        <p className="text-[10px] text-slate-400">{att.designation || 'Staff'}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {att.duration_minutes} mins present
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Joined: {att.joined_at?.slice(11, 16)} | Left: {att.left_at ? att.left_at.slice(11, 16) : 'Active'}
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
