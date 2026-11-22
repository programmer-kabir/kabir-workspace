import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FiZap, FiClock, FiUser, FiCheckCircle, FiLogOut, FiRefreshCw,
  FiSearch, FiAlertTriangle, FiShield, FiFileText, FiCalendar, FiLoader
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/').replace(/\/+$/, '') + '/';

const getAuthToken = () => {
  return localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || localStorage.getItem('token') || '';
};

const REASON_PRESETS = [
  'System Maintenance / সাইট আপডেট চলছে',
  'Staff App / Device Issue / স্টাফের ডিভাইস বা অ্যাপ সমস্যা',
  'Network / Power Outage / ইন্টারনেট বা বিদ্যুৎ বিভ্রাট',
  'Staff Call / Verbal Request / স্টাফের মৌখিক বা কল অনুরোধ',
  'Official Outdoor Duty / অফিশিয়াল ফিল্ড ডিউটি',
  'Emergency Attendance Override / জরুরি উপস্থিতি অ্যাডজাস্টমেন্ট',
  'Custom Reason / অন্যান্য কারণ...'
];

export default function DeveloperProxyAttendance({ onNavigate }) {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [punchType, setPunchType] = useState('check_in');
  const [reasonPreset, setReasonPreset] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [notes, setNotes] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/attendance/get_daily_roster.php?date=${date}`);
      if (res.data.status === 'success') {
        setRoster(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/attendance/get_proxy_logs.php?limit=25`);
      if (res.data.status === 'success') {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch proxy logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLogs();
  }, [fetchData, fetchLogs]);

  // Fast 1-click Punch
  const handleQuickPunch = async (staff, pType) => {
    setActionLoadingId(staff.user_id);
    const token = getAuthToken();
    try {
      const res = await axios.post(`${API_BASE}api/admin/attendance/proxy_punch.php`, {
        token,
        operator_id: currentUser?.id,
        target_user_id: staff.user_id,
        punch_type: pType,
        punch_date: date,
        reason: 'System Maintenance / সাইট আপডেট চলছে'
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Proxy Punch Successful');
        fetchData();
        fetchLogs();
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCustomModal = (staff, defaultType = 'check_in') => {
    setSelectedStaff(staff);
    setPunchType(defaultType);
    setReasonPreset(REASON_PRESETS[0]);
    setCustomReason('');
    setNotes('');
    setUseCurrentTime(true);
    setCustomTime(new Date().toTimeString().slice(0, 5));
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const finalReason = reasonPreset === 'Custom Reason / অন্যান্য কারণ...'
      ? (customReason.trim() || 'Developer Proxy Attendance')
      : reasonPreset;

    const token = getAuthToken();
    setSubmitting(true);
    try {
      const payload = {
        token,
        operator_id: currentUser?.id,
        target_user_id: selectedStaff.user_id,
        punch_type: punchType,
        punch_date: date,
        reason: finalReason,
        notes: notes.trim() || null
      };

      if (!useCurrentTime && customTime) {
        payload.punch_time = customTime;
      }

      const res = await axios.post(`${API_BASE}api/admin/attendance/proxy_punch.php`, payload);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Proxy Punch executed successfully!');
        setModalOpen(false);
        fetchData();
        fetchLogs();
      } else {
        toast.error(res.data.message || 'Operation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Network / server error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoster = roster.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.designation?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <FiZap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {isBn ? 'প্রক্সি হাজিরা ও মাস্টার পাঞ্চ কন্ট্রোল' : 'Proxy Attendance & Master Punch Hub'}
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Desktop Dev Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isBn 
                ? 'সাইট আপডেট বা রক্ষণাবেক্ষণ চলাকালীন যেকোনো স্টাফের প্রক্সি চেক-ইন/আউট নিশ্চিত করুন।' 
                : 'Directly record or override attendance check-in/out for any staff during system maintenance.'}
            </p>
          </div>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
          />
          <button
            onClick={() => { fetchData(); fetchLogs(); }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
            title="Reload Roster"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'নাম বা পদবী দিয়ে খুঁজুন...' : 'Search staff by name or role...'}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {isBn ? `মোট ${filteredRoster.length} জন স্টাফ` : `Total ${filteredRoster.length} Staff Members`}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <FiLoader className="w-6 h-6 text-primary-500 animate-spin" />
            <span className="text-xs font-bold text-slate-400">Loading live daily roster...</span>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            No staff records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoster.map((staff) => {
              const isInOffice = staff.check_in && !staff.check_out;
              const isCompleted = staff.check_in && staff.check_out;
              const isAbsent = !staff.check_in;
              const isProxy = Number(staff.is_admin_override) === 1;

              return (
                <div
                  key={staff.user_id}
                  className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 flex flex-col justify-between gap-3 group hover:border-primary-500/40 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      {staff.profile_picture ? (
                        <img src={`${API_BASE}${staff.profile_picture}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white truncate">
                          {staff.name}
                        </h3>
                        {isProxy && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-800/40 px-1 py-0.2 rounded shrink-0">
                            <FiZap size={9} /> Proxy
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{staff.designation || 'Staff'}</p>
                      
                      {/* Attendance Timestamps */}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${staff.check_in ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          IN: {staff.check_in?.slice(11, 16) || '—'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${staff.check_out ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          OUT: {staff.check_out?.slice(11, 16) || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    {/* Punch In */}
                    {isAbsent && (
                      <button
                        onClick={() => handleQuickPunch(staff, 'check_in')}
                        disabled={actionLoadingId === staff.user_id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {actionLoadingId === staff.user_id ? <FiLoader className="animate-spin" size={12} /> : <FiCheckCircle size={12} />}
                        <span>{isBn ? 'পাঞ্চ ইন' : 'Punch In'}</span>
                      </button>
                    )}

                    {/* Punch Out */}
                    {isInOffice && (
                      <button
                        onClick={() => handleQuickPunch(staff, 'check_out')}
                        disabled={actionLoadingId === staff.user_id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {actionLoadingId === staff.user_id ? <FiLoader className="animate-spin" size={12} /> : <FiLogOut size={12} />}
                        <span>{isBn ? 'পাঞ্চ আউট' : 'Punch Out'}</span>
                      </button>
                    )}

                    {/* Completed Tag */}
                    {isCompleted && (
                      <span className="flex-1 text-center py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black">
                        ✓ {isBn ? 'শিফট সম্পন্ন' : 'Shift Completed'}
                      </span>
                    )}

                    {/* Custom Override Dialog */}
                    <button
                      onClick={() => openCustomModal(staff, isInOffice ? 'check_out' : 'check_in')}
                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl transition cursor-pointer"
                      title={isBn ? 'কাস্টম প্রক্সি ডায়ালগ' : 'Custom Proxy Punch Details'}
                    >
                      <FiZap size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit Logs Trail */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShield className="text-emerald-500" size={18} />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {isBn ? 'সাম্প্রতিক প্রক্সি পাঞ্চ অডিট ট্রেইল' : 'Recent Proxy Punch Audit Logs'}
            </h2>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs font-bold text-primary-600 hover:underline cursor-pointer"
          >
            {isBn ? 'রিফ্রেশ' : 'Refresh Logs'}
          </button>
        </div>

        {logsLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No proxy logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-left">
                  <th className="py-2 px-3">Target Staff</th>
                  <th className="py-2 px-3">Authorized By</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Date & Time</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">
                      {log.target_user_name || `User #${log.target_user_id}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {log.operator_name || `Admin #${log.operator_id}`}
                    </td>
                    <td className="py-2.5 px-3 font-bold uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full ${
                        log.punch_type === 'check_in' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}>
                        {log.punch_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {log.punch_date} {log.punch_time}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FiZap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Proxy Punch: {selectedStaff.name}</h3>
                  <p className="text-[11px] text-slate-500">{date}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs">
              {/* Action Type */}
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1.5">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPunchType('check_in')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      punchType === 'check_in'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🟢 Check-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setPunchType('check_out')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      punchType === 'check_out'
                        ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🔴 Check-Out
                  </button>
                </div>
              </div>

              {/* Time */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCurrentTime}
                    onChange={(e) => setUseCurrentTime(e.target.checked)}
                    className="rounded text-primary-600"
                  />
                  <span className="font-bold">Use Current Real-time (Asia/Dhaka)</span>
                </label>
                {!useCurrentTime && (
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold"
                  />
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1.5">Reason</label>
                <select
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold cursor-pointer"
                >
                  {REASON_PRESETS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {reasonPreset === 'Custom Reason / অন্যান্য কারণ...' && (
                <input
                  type="text"
                  placeholder="Enter custom reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                />
              )}

              {/* Notes */}
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional remarks..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <FiLoader className="animate-spin" size={13} /> : <FiZap size={13} />}
                  <span>Execute Punch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
