import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiClock, FiCheckCircle, FiAlertCircle, FiXCircle,
  FiCalendar, FiSend, FiX, FiCheck, FiFilter
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Attendance = () => {
  const { currentUser } = useAuth();
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayLog, setTodayLog] = useState(null);

  // Dispute Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeDate, setDisputeDate] = useState(new Date().toISOString().split('T')[0]);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchAttendance = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}api/attendance/get_attendance.php`, {
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        const logs = res.data.history || res.data.attendance || res.data.data || [];
        setAttendanceLogs(logs);

        const today = new Date().toISOString().split('T')[0];
        if (res.data.today && res.data.today.check_in) {
          setTodayLog({
            ...res.data.today,
            date: today
          });
        } else {
          const tLog = logs.find(l => l.date === today);
          setTodayLog(tLog || null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentUser]);




  // Check In
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await axios.post(`${API_BASE}api/attendance/check_in.php`, {
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Checked in successfully!');
        fetchAttendance();
      } else {
        toast.error(res.data.message || 'Check-in failed.');
      }
    } catch (err) {
      toast.error('Check-in error.');
    } finally {
      setCheckingIn(false);
    }
  };

  // Check Out
  const handleCheckOut = async () => {
    try {
      setCheckingIn(true);
      const res = await axios.post(`${API_BASE}api/attendance/check_out.php`, {
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Checked out successfully!');
        fetchAttendance();
      } else {
        toast.error(res.data.message || 'Check-out failed.');
      }
    } catch (err) {
      toast.error('Check-out error.');
    } finally {
      setCheckingIn(false);
    }
  };

  // Submit Dispute
  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeDate || !disputeReason) {
      toast.error('Please enter both date and reason.');
      return;
    }

    try {
      setSubmittingDispute(true);
      const res = await axios.post(`${API_BASE}api/attendance/dispute.php`, {
        user_id: currentUser.id,
        date: disputeDate,
        reason: disputeReason
      });

      if (res.data.status === 'success') {
        toast.success('Dispute request submitted to academy admin.');
        setShowDisputeModal(false);
        setDisputeReason('');
      } else {
        toast.error(res.data.message || 'Failed to submit dispute.');
      }
    } catch (err) {
      toast.error('Error submitting dispute.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Stats
  const totalDays = attendanceLogs.length;
  const presentDays = attendanceLogs.filter(l => l.status === 'Present').length;
  const lateDays = attendanceLogs.filter(l => l.status === 'Late').length;
  const absentDays = attendanceLogs.filter(l => l.status === 'Absent').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      {/* Header & Check-In Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl">
              <FiClock size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Daily Class Attendance</h1>
              <p className="text-sm text-slate-400">Track your daily academy presence, check-in time, and history.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowDisputeModal(true)}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <FiAlertCircle size={16} />
            <span>Attendance Dispute</span>
          </button>

          {todayLog?.check_in ? (
            !todayLog.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={checkingIn}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
              >
                {checkingIn ? 'Processing...' : 'Clock Out for Today'}
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800">
                ✓ Completed for Today ({todayLog.check_in.slice(0, 5)} - {todayLog.check_out.slice(0, 5)})
              </div>
            )
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FiCheckCircle size={16} />
              <span>{checkingIn ? 'Recording...' : 'Check In Today'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance %</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{attendanceRate}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Days</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentDays}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Days</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{lateDays}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recorded</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalDays}</p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiCalendar size={18} className="text-indigo-600" />
            <span>Attendance History</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{attendanceLogs.length} Records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading attendance data...</div>
        ) : attendanceLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FiClock size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-base font-bold text-slate-600 dark:text-slate-300">No attendance history found</p>
            <p className="text-xs mt-1">Check in today to start logging your attendance!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Check In</th>
                  <th className="py-3.5 px-6">Check Out</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {attendanceLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{log.date}</td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 font-mono font-medium">{log.check_in || '—'}</td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 font-mono font-medium">{log.check_out || '—'}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${log.status === 'Present'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : log.status === 'Late'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}>
                        {log.status || 'Present'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 font-mono">
                      {log.check_in && log.check_out ? 'Completed' : 'Active Session'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiAlertCircle className="text-amber-500" />
                <span>Submit Attendance Dispute</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dispute Date</label>
                <input
                  type="date"
                  required
                  value={disputeDate}
                  onChange={(e) => setDisputeDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason / Explanation</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Attended class on time but network issue prevented check-in..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {submittingDispute ? 'Submitting...' : 'Send Dispute Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
