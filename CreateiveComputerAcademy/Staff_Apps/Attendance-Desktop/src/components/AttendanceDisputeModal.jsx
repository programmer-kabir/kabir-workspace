import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';

const AttendanceDisputeModal = ({ isOpen, onClose, selectedDate, onSuccess }) => {
  const { currentUser } = useAuth();
  const [disputeType, setDisputeType] = useState('check_in');
  const [description, setDescription] = useState('');
  const [claimedStartTime, setClaimedStartTime] = useState('');
  const [claimedEndTime, setClaimedEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE}api/attendance/dispute.php`, {
        user_id: currentUser.id,
        date: selectedDate,
        dispute_type: disputeType,
        description,
        claimed_start_time: claimedStartTime,
        claimed_end_time: claimedEndTime
      });

      if (res.data.status === 'success') {
        onSuccess(res.data.message);
        onClose();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('An error occurred while submitting the dispute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-up">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FiAlertCircle className="text-amber-500" />
            Report Issue ({selectedDate})
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Issue Type
            </label>
            <select
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="check_in">Wrong Check-In Time</option>
              <option value="check_out">Wrong Check-Out Time</option>
              <option value="absent">Marked Absent by Mistake</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Claimed In Time</label>
              <input
                type="time"
                value={claimedStartTime}
                onChange={(e) => setClaimedStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Claimed Out Time</label>
              <input
                type="time"
                value={claimedEndTime}
                onChange={(e) => setClaimedEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Explanation
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the discrepancy..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AttendanceDisputeModal;
