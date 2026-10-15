import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import { getAttendanceApi } from '../utils/api';

const AttendanceHistoryModal = ({ userId, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      getAttendanceApi(userId)
        .then((res) => {
          if (res.status === 'success') {
            setHistory(res.history || []);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const format12H = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedH = hour % 12 || 12;
      return `${formattedH}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-sky-400" />
            <h3 className="text-sm font-bold text-white">Attendance Log (Recent)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading recent history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No recent attendance records found.
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {item.date}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>In: {format12H(item.check_in)}</span>
                    <span>&bull;</span>
                    <span>Out: {format12H(item.check_out)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'Present'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {item.status || 'Present'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryModal;
