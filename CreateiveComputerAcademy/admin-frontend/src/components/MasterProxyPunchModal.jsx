import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiZap, FiX, FiCheckCircle, FiClock, FiAlertTriangle,
  FiUser, FiSend, FiLoader, FiCalendar, FiLogOut
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const REASON_PRESETS = [
  'System Maintenance / সাইট আপডেট চলছে',
  'Staff App / Device Issue / স্টাফের ডিভাইস বা অ্যাপ সমস্যা',
  'Network / Power Outage / ইন্টারনেট বা বিদ্যুৎ বিভ্রাট',
  'Staff Call / Verbal Request / স্টাফের মৌখিক বা কল অনুরোধ',
  'Official Outdoor Duty / অফিশিয়াল ফিল্ড ডিউটি',
  'Emergency Attendance Override / জরুরি উপস্থিতি অ্যাডজাস্টমেন্ট',
  'Custom Reason / অন্যান্য কারণ...'
];

export default function MasterProxyPunchModal({
  isOpen,
  onClose,
  onSuccess,
  staffList = [],
  preselectedStaff = null,
  currentDate = new Date().toISOString().split('T')[0],
  adminId = null
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [punchType, setPunchType] = useState('check_in');
  const [reasonPreset, setReasonPreset] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customTime, setCustomTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [shiftInTime, setShiftInTime] = useState('09:00');
  const [shiftOutTime, setShiftOutTime] = useState('17:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedStaff) {
      setSelectedUserId(String(preselectedStaff.user_id));
      if (preselectedStaff.work_status === 'in_progress') {
        setPunchType('check_out');
      } else if (preselectedStaff.work_status === 'absent') {
        setPunchType('check_in');
      }
    } else if (staffList.length > 0 && !selectedUserId) {
      setSelectedUserId(String(staffList[0].user_id));
    }
  }, [preselectedStaff, staffList]);

  if (!isOpen) return null;

  const selectedStaffObj = staffList.find(s => String(s.user_id) === String(selectedUserId));

  const filteredStaffList = staffList.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a staff member.');
      return;
    }

    const finalReason = reasonPreset === 'Custom Reason / অন্যান্য কারণ...'
      ? (customReason.trim() || 'Administrative Proxy Punch')
      : reasonPreset;

    const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token') || '';

    setSubmitting(true);
    try {
      const payload = {
        token,
        admin_id: adminId,
        operator_id: adminId,
        target_user_id: parseInt(selectedUserId, 10),
        punch_type: punchType,
        punch_date: currentDate,
        reason: finalReason,
        notes: notes.trim() || null
      };

      if (!useCurrentTime) {
        if (punchType === 'both') {
          payload.check_in_time = shiftInTime;
          payload.check_out_time = shiftOutTime;
        } else {
          payload.punch_time = customTime;
        }
      }

      const res = await axios.post(`${API_BASE}api/admin/attendance/proxy_punch.php`, payload);

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Proxy attendance recorded successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to record proxy punch.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error. Please verify database connection.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0 shadow-xs">
              <FiZap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">Master Proxy Punch</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tracking-wider">
                  Admin & Dev
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                হাজিরা দিন বা আপডেট করুন (সাইট আপডেট বা সমস্যা চলাকালীন)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Target Staff Selection */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Select Staff Member (কর্মকর্তা/কর্মচারী নির্বাচন)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
            >
              <option value="" disabled>-- Select Employee --</option>
              {filteredStaffList.map((s) => {
                const statusLabel = s.work_status === 'completed'
                  ? '✓ Present'
                  : s.work_status === 'in_progress'
                  ? '⏱ In Office'
                  : 'Absent';
                return (
                  <option key={s.user_id} value={s.user_id}>
                    {s.name} ({s.designation || 'Staff'}) — [{statusLabel}]
                  </option>
                );
              })}
            </select>
          </div>

          {/* Current Status Preview */}
          {selectedStaffObj && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  {selectedStaffObj.profile_picture ? (
                    <img src={`${API_BASE}/${selectedStaffObj.profile_picture}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser size={14} />
                  )}
                </div>
                <div>
                  <p className="font-black text-slate-800 dark:text-white">{selectedStaffObj.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Shift: {selectedStaffObj.shift_start?.slice(0, 5) || '09:00'} – {selectedStaffObj.shift_end?.slice(0, 5) || '17:00'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                  selectedStaffObj.work_status === 'completed'
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : selectedStaffObj.work_status === 'in_progress'
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                    : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                }`}>
                  {selectedStaffObj.work_status === 'completed' ? 'Full Shift' : selectedStaffObj.work_status === 'in_progress' ? 'In Office' : 'Absent'}
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  In: {selectedStaffObj.check_in?.slice(11, 16) || '—'} | Out: {selectedStaffObj.check_out?.slice(11, 16) || '—'}
                </p>
              </div>
            </div>
          )}

          {/* Punch Type Selector (3 options) */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Action Type (হাজিরার ধরন)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPunchType('check_in')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  punchType === 'check_in'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <FiCheckCircle size={16} className="text-emerald-500" />
                <span>🟢 Punch In</span>
              </button>

              <button
                type="button"
                onClick={() => setPunchType('check_out')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  punchType === 'check_out'
                    ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <FiLogOut size={16} className="text-rose-500" />
                <span>🔴 Punch Out</span>
              </button>

              <button
                type="button"
                onClick={() => setPunchType('both')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  punchType === 'both'
                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <FiZap size={16} className="text-amber-500" />
                <span>⚡ Full Shift</span>
              </button>
            </div>
          </div>

          {/* Time Configuration */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCurrentTime}
                  onChange={(e) => setUseCurrentTime(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span>Use Current Real-time (বর্তমান সময় ব্যবহার করুন)</span>
              </label>
              {useCurrentTime && (
                <span className="text-[11px] font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
                  Asia/Dhaka Live
                </span>
              )}
            </div>

            {!useCurrentTime && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 animate-in fade-in duration-200">
                {punchType === 'both' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Check-In Time</label>
                      <input
                        type="time"
                        value={shiftInTime}
                        onChange={(e) => setShiftInTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Check-Out Time</label>
                      <input
                        type="time"
                        value={shiftOutTime}
                        onChange={(e) => setShiftOutTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Custom Punch Time (নির্দিষ্ট সময়)
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reason Preset Dropdown */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Reason / প্রেক্ষাপট (কেন প্রক্সি দেওয়া হচ্ছে)
            </label>
            <select
              value={reasonPreset}
              onChange={(e) => setReasonPreset(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
            >
              {REASON_PRESETS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input if selected */}
          {reasonPreset === 'Custom Reason / অন্যান্য কারণ...' && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Specific Reason Details
              </label>
              <input
                type="text"
                placeholder="যেমন: বিদ্যুৎ বিভ্রাটের কারণে ফোনে অনুরোধ জানিয়েছে..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Internal Audit Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="অতিরিক্ত কোনো তথ্য থাকলে এখানে লিখে রাখুন..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Notice info */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <FiAlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={15} />
            <p className="text-[11px] leading-relaxed">
              এই প্রক্সি পাঞ্চটি স্বয়ংক্রিয়ভাবে অডিট লগে সেভ হবে এবং সংশ্লিষ্ট স্টাফের কাছে নোটিফিকেশন পৌঁছাবে।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiZap size={14} className="text-amber-300" />
                  <span>Execute Proxy Punch</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
