import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FiCalendar, FiClock, FiUser, FiEdit2, FiCheckCircle,
  FiXCircle, FiAlertTriangle, FiLoader, FiSave, FiX, FiChevronLeft, FiChevronRight,
  FiSmartphone, FiMonitor, FiShield, FiMapPin
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import AttendanceDeviceDetailsModal from '../components/AttendanceDeviceDetailsModal';
import BreakRequestsWidget from '../components/BreakRequestsWidget';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// --- Helpers ---
const fmt = (timeStr) => {
  if (!timeStr) return '—';
  // Extract HH:MM from "YYYY-MM-DD HH:MM:SS" or "HH:MM:SS"
  const match = timeStr.match(/(\d{2}:\d{2})/);
  return match ? match[1] : timeStr;
};

const fmtMins = (mins) => {
  if (mins === null || mins === undefined) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const toInputTime = (datetimeStr) => {
  if (!datetimeStr) return '';
  const match = datetimeStr.match(/(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

// --- Work Status Badge ---
const WorkStatusBadge = ({ status, shortByMinutes }) => {
  const configs = {
    completed: {
      label: 'Full Shift ✓',
      className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    },
    in_progress: {
      label: 'In Office',
      className: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    },
    short: {
      label: `Short ${fmtMins(shortByMinutes)}`,
      className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    },
    leave: {
      label: 'On Leave 🌴',
      className: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
    },
    absent: {
      label: 'Absent',
      className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
    },
  };
  const cfg = configs[status] || configs.absent;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

// --- Edit Modal ---
const EditModal = ({ staff, date, onClose, onSaved, adminId }) => {
  const [checkIn, setCheckIn]   = useState(toInputTime(staff.check_in));
  const [checkOut, setCheckOut] = useState(toInputTime(staff.check_out));
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!checkIn) {
      toast.error('Check-in time is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/attendance/update_attendance.php`, {
        user_id: staff.user_id,
        date,
        admin_id: adminId,
        check_in: checkIn,
        check_out: checkOut || null,
      });
      if (res.data.status === 'success') {
        toast.success(`${staff.name}'s attendance updated!`);
        onSaved();
      } else {
        toast.error(res.data.message || 'Failed to update.');
      }
    } catch {
      toast.error('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              {staff.profile_picture
                ? <img src={`${API_BASE}/${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                : <FiUser size={18} />}
            </div>
            <div>
              <p className="font-black text-slate-800 dark:text-white">{staff.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{date}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Check-In Time</label>
            <input
              type="time"
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Check-Out Time <span className="text-slate-400 normal-case font-normal">(optional — if still in office)</span></label>
            <input
              type="time"
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Auto Check-Out Notice */}
          {Number(staff.is_forgotten_checkout) === 1 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <FiAlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={16} />
              <div>
                <span className="font-bold">System Auto Check-Out:</span> This staff forgot to check out and was automatically checked out at shift end. Saving custom times here will clear this alert flag.
              </div>
            </div>
          )}

          {/* Current status info */}
          {(staff.net_work_minutes !== null) && (
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold">Current net work time:</span> {fmtMins(staff.net_work_minutes)}
              {staff.total_break_minutes > 0 && <span> (after {fmtMins(staff.total_break_minutes)} break)</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><FiLoader className="animate-spin" size={16} /> Saving...</> : <><FiSave size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
const DailyRoster = () => {
  const { currentUser } = useAuth();
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingDeviceStaff, setViewingDeviceStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/attendance/get_daily_roster.php?date=${date}`);
      if (res.data.status === 'success') {
        setRosterData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roster', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const changeDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  const filtered = rosterData.filter(s => filterStatus === 'all' || s.work_status === filterStatus);

  const counts = {
    all:         rosterData.length,
    completed:   rosterData.filter(s => s.work_status === 'completed').length,
    in_progress: rosterData.filter(s => s.work_status === 'in_progress').length,
    short:       rosterData.filter(s => s.work_status === 'short').length,
    leave:       rosterData.filter(s => s.work_status === 'leave').length,
    absent:      rosterData.filter(s => s.work_status === 'absent').length,
  };

  const filterTabs = [
    { key: 'all',         label: 'All',         color: 'text-slate-600 dark:text-slate-300' },
    { key: 'completed',   label: 'Full Shift',  color: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'in_progress', label: 'In Office',   color: 'text-blue-600 dark:text-blue-400' },
    { key: 'short',       label: 'Short Hours', color: 'text-amber-600 dark:text-amber-400' },
    { key: 'leave',       label: 'On Leave',    color: 'text-purple-600 dark:text-purple-400' },
    { key: 'absent',      label: 'Absent',      color: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Daily Roster</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Track and manage daily staff attendance & work hours.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
          >
            <FiChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer px-1"
          />
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-30"
          >
            <FiChevronRight size={18} />
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Real-time Break Requests & Live Breaks Widget */}
      {isToday && <BreakRequestsWidget />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Present',    count: counts.completed + counts.in_progress, color: 'emerald', icon: <FiCheckCircle /> },
          { label: 'In Office',  count: counts.in_progress,                    color: 'blue',    icon: <FiClock /> },
          { label: 'Short Hrs',  count: counts.short,                          color: 'amber',   icon: <FiAlertTriangle /> },
          { label: 'On Leave',   count: counts.leave,                          color: 'purple',  icon: <FiCalendar /> },
          { label: 'Absent',     count: counts.absent,                         color: 'rose',    icon: <FiXCircle /> },
        ].map(({ label, count, color, icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{count}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterStatus === tab.key
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className={filterStatus === tab.key ? 'text-white dark:text-slate-900' : tab.color}>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              filterStatus === tab.key ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <FiUser size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No records found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shift</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Check-In</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Check-Out</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Break</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Work</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Device & Location</th>
                  <th className="text-center px-4 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map((staff) => {
                  const dev = staff.device_log;
                  return (
                    <tr key={staff.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      {/* Staff */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            {staff.profile_picture
                              ? <img src={`${API_BASE}/${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                              : <FiUser size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{staff.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{staff.designation || 'Staff'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Shift */}
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg font-mono">
                          {staff.shift_start?.slice(0,5) ?? '—'} – {staff.shift_end?.slice(0,5) ?? '—'}
                        </span>
                      </td>
                      {/* Check-In */}
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold font-mono ${staff.check_in ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                          {fmt(staff.check_in)}
                        </span>
                      </td>
                      {/* Check-Out */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-sm font-bold font-mono ${staff.check_out ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                            {fmt(staff.check_out)}
                          </span>
                          {Number(staff.is_forgotten_checkout) === 1 && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md cursor-help shadow-xs" 
                              title="Staff forgot to check out. System auto checked out at shift end."
                            >
                              <FiAlertTriangle size={11} className="text-amber-500 shrink-0" />
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Break */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                          {staff.total_break_minutes > 0 ? fmtMins(staff.total_break_minutes) : '—'}
                        </span>
                      </td>
                      {/* Net Work */}
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold font-mono ${
                          staff.work_status === 'completed' ? 'text-emerald-600 dark:text-emerald-400'
                          : staff.work_status === 'short'    ? 'text-amber-600 dark:text-amber-400'
                          : staff.work_status === 'in_progress' ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-300 dark:text-slate-600'
                        }`}>
                          {staff.net_work_minutes !== null ? fmtMins(staff.net_work_minutes) : '—'}
                          {staff.expected_work_minutes && (
                            <span className="text-slate-400 dark:text-slate-500 font-normal text-xs"> / {fmtMins(staff.expected_work_minutes)}</span>
                          )}
                        </span>
                      </td>
                      {/* Status Badge */}
                      <td className="px-4 py-4">
                        <WorkStatusBadge status={staff.work_status} shortByMinutes={staff.short_by_minutes} />
                      </td>
                      {/* Device & Location */}
                      <td className="px-4 py-4">
                        {staff.attendance_id ? (
                          <button
                            onClick={() => setViewingDeviceStaff(staff)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700/60 hover:bg-primary-50 dark:hover:bg-primary-500/15 text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-200 dark:border-slate-700 transition-all group/dev"
                            title="Click to view detailed device specs & location"
                          >
                            {dev?.device_type === 'Mobile' ? (
                              <FiSmartphone size={13} className="text-primary-500" />
                            ) : (
                              <FiMonitor size={13} className="text-primary-500" />
                            )}
                            <span className="truncate max-w-[100px] font-bold">
                              {dev?.device_model ? dev.device_model.split(' ')[0] : 'Device'}
                            </span>
                            {dev?.distance_meters !== null && dev?.distance_meters !== undefined ? (
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                Number(dev.is_within_geofence) === 1
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}>
                                {Math.round(dev.distance_meters)}m
                              </span>
                            ) : (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                IP
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-sm font-mono">—</span>
                        )}
                      </td>
                      {/* Edit */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setEditingStaff(staff)}
                          className="p-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit Attendance"
                        >
                          <FiEdit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStaff && (
        <EditModal
          staff={editingStaff}
          date={date}
          adminId={currentUser?.id}
          onClose={() => setEditingStaff(null)}
          onSaved={() => { setEditingStaff(null); fetchRoster(); }}
        />
      )}

      {/* Device Details Modal */}
      {viewingDeviceStaff && (
        <AttendanceDeviceDetailsModal
          isOpen={Boolean(viewingDeviceStaff)}
          onClose={() => setViewingDeviceStaff(null)}
          attendanceId={viewingDeviceStaff.attendance_id}
          staffName={viewingDeviceStaff.name}
          date={date}
        />
      )}
    </div>
  );
};

export default DailyRoster;
