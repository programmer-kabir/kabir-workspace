import React, { useState } from 'react';
import axios from 'axios';
import { FiCalendar, FiFileText, FiSend, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const LeaveApplyForm = ({ currentUser, studentQuota, onSuccess }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Casual');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    if (e < s) return 0;
    const diffTime = Math.abs(e - s);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // inclusive
  };

  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    const cur = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    if (last < cur) return 0;
    let count = 0;
    const iter = new Date(cur);
    while (iter <= last) {
      if (iter.getDay() !== 5) { // 5 is Friday
        count++;
      }
      iter.setDate(iter.getDate() + 1);
    }
    return count;
  };

  const calendarDays = calculateDays(startDate, endDate);
  const workingDays = calculateWorkingDays(startDate, endDate);
  const isStudentLeave = type === 'Student Academic Leave';
  const remainingStudentQuota = studentQuota?.remaining_days ?? 0;
  const isExceedingStudentQuota = isStudentLeave && Boolean(startDate && endDate) && (workingDays > remainingStudentQuota);
  const isNoWorkingDays = isStudentLeave && Boolean(startDate && endDate) && (workingDays === 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setMessage({ text: 'Please fill in all fields.', type: 'error' });
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setMessage({ text: 'End date cannot be before start date.', type: 'error' });
      return;
    }

    if (type === 'Student Academic Leave') {
      const reqWorkingDays = calculateWorkingDays(startDate, endDate);
      if (reqWorkingDays <= 0) {
        setMessage({ text: 'Selected dates do not include any working days (only Fridays).', type: 'error' });
        return;
      }
      const rem = studentQuota?.remaining_days ?? 0;
      if (reqWorkingDays > rem) {
        setMessage({
          text: `Requested ${reqWorkingDays} working day(s) exceed your remaining student leave quota (${rem} day(s) left).`,
          type: 'error'
        });
        return;
      }
    }

    setSubmitLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}api/leave/apply_leave.php`, {
        user_id: currentUser?.id,
        start_date: startDate,
        end_date: endDate,
        type: type,
        reason: reason
      });

      if (res.data.status === 'success') {
        setMessage({ text: 'Leave application submitted successfully!', type: 'success' });
        setStartDate('');
        setEndDate('');
        setReason('');
        setType('Casual');
        onSuccess?.();
      } else {
        setMessage({ text: res.data.message || 'Failed to submit application.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden sticky top-6">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FiSend className="text-primary-600" /> Apply for Leave
        </h2>
      </div>

      <div className="p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {message.type === 'success' ? <FiCheckCircle className="mt-0.5 text-lg" /> : <FiXCircle className="mt-0.5 text-lg" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (message?.type === 'success') setMessage(null);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (message?.type === 'success') setMessage(null);
                  }}
                  min={startDate}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {startDate && endDate && (
            <div className="space-y-2">
              <div className="bg-primary-50 dark:bg-slate-900/60 text-primary-700 dark:text-primary-300 p-3 rounded-xl text-sm font-semibold flex items-center justify-between border border-primary-100 dark:border-primary-900/30">
                <span>Total Duration:</span>
                <span className="text-right">
                  {isStudentLeave ? (
                    <>
                      <span className="font-bold">{workingDays} Working Day{workingDays !== 1 ? 's' : ''}</span>
                      {calendarDays > workingDays && (
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 block sm:inline sm:ml-1.5">
                          ({calendarDays - workingDays} Friday{calendarDays - workingDays !== 1 ? 's' : ''} off excluded)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="font-bold">{calendarDays} Day{calendarDays !== 1 ? 's' : ''}</span>
                  )}
                </span>
              </div>

              {isExceedingStudentQuota && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
                  <FiXCircle className="text-rose-500 mt-0.5 shrink-0 text-base" />
                  <div>
                    <p className="font-bold">⚠️ কোটা অতিক্রম করেছে (Quota Exceeded):</p>
                    <p className="mt-0.5 leading-relaxed">
                      চলতি মাসে আপনার স্টুডেন্ট কোটা বাকি আছে মাত্র <strong>{remainingStudentQuota} দিন</strong>,
                      কিন্তু নির্বাচিত কর্মদিবস <strong>{workingDays} দিন</strong>। কোটার চেয়ে বেশি দিনের আবেদন করা সম্ভব নয়।
                    </p>
                  </div>
                </div>
              )}

              {isNoWorkingDays && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
                  <FiClock className="text-amber-500 mt-0.5 shrink-0 text-base" />
                  <div>
                    <p className="font-bold">⚠️ কোনো কর্মদিবস নেই (Off Day):</p>
                    <p className="mt-0.5 leading-relaxed">
                      নির্বাচিত তারিখটি শুধুমাত্র শুক্রবার (সাপ্তাহিক ছুটি)। ছুটির দিনে একাডেমিক ছুটির আবেদন করার প্রয়োজন নেই।
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Leave Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (message?.type === 'success') setMessage(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-all"
            >
              {studentQuota?.is_student && studentQuota?.is_approved ? (
                <option value="Student Academic Leave">
                  🎓 Student Academic Leave ({remainingStudentQuota} days left)
                </option>
              ) : studentQuota?.is_student ? (
                <option value="student_pending" disabled>
                  🎓 Student Academic Leave (Pending Admin Approval ⏳)
                </option>
              ) : null}
              <option value="Casual">Casual Leave</option>
              <option value="Medical">Medical Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>

            {studentQuota?.is_student && !studentQuota?.is_approved && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 leading-relaxed shadow-xs flex items-start gap-2">
                <FiClock className="text-amber-600 mt-0.5 shrink-0" size={14} />
                <div>
                  <p className="font-bold">🎓 স্টুডেন্ট অ্যাকাডেমিক ছুটি (অনুমোদনের অপেক্ষায়):</p>
                  <p className="mt-0.5">
                    আপনার শিক্ষার্থী প্রোফাইলটি বর্তমানে অ্যাডমিন ভেরিফিকেশনের অপেক্ষায় রয়েছে। অ্যাডমিন অনুমোদন করার পর আপনি প্রতি মাসে সর্বোচ্চ ৩ দিনের অ্যাকাডেমিক ছুটি নিতে পারবেন (ম্যাঙ্গো কর্তন ব্যতীত)।
                  </p>
                </div>
              </div>
            )}

            {type === 'Student Academic Leave' && (
              <div className="mt-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed shadow-xs space-y-1">
                <p className="font-bold flex items-center justify-between">
                  <span>🎓 স্টুডেন্ট একাডেমিক ছুটি:</span>
                  {studentQuota?.institution && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-md">
                      🏛️ {studentQuota.institution} {studentQuota.student_level ? `(${studentQuota.student_level})` : ''}
                    </span>
                  )}
                </p>
                <p className="mt-0.5">এই ছুটির জন্য কোনো বেতন প্রদান হবে না (Unpaid Day), তবে আপনার জমানো ম্যাঙ্গো (ওভারটাইম) ব্যালেন্স থেকে ১ মিনিটও কাটা হবে না এবং কোনো জরিমানা হবে না। চলতি মাসের অবশিষ্ট কোটা: <strong>{remainingStudentQuota} দিন</strong>।</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Reason</label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-3 text-slate-400" />
              <textarea
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain your reason for leave..."
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 outline-none transition-all resize-none"
                required
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitLoading || isExceedingStudentQuota || isNoWorkingDays || !startDate || !endDate || !reason.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : isExceedingStudentQuota ? (
              <>⚠️ কোটা শেষ (সর্বোচ্চ {remainingStudentQuota} দিন সম্ভব)</>
            ) : isNoWorkingDays ? (
              <>⚠️ শুধুমাত্র শুক্রবার সিলেক্টেড</>
            ) : (
              <>Submit Application <FiSend /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveApplyForm;

