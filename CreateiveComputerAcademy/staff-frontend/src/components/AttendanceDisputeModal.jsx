import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const AttendanceDisputeModal = ({ isOpen, onClose, selectedDate, onSuccess }) => {
  const { currentUser } = useAuth();
  const [disputeType, setDisputeType] = useState('check_in');
  const [description, setDescription] = useState('');
  const [claimedStartTime, setClaimedStartTime] = useState('');
  const [claimedEndTime, setClaimedEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-up">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FiAlertCircle className="text-amber-500" />
            Report Issue
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Date
            </label>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Issue Type
            </label>
            <select 
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="check_in">Check In Time Incorrect</option>
              <option value="check_out">Check Out Time Incorrect</option>
              <option value="break_time">Break Time Incorrect</option>
              <option value="absent_mark">Marked Absent Mistakenly</option>
            </select>
          </div>

          {/* Time Inputs based on type */}
          {disputeType !== 'absent_mark' && (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {disputeType === 'break_time' ? 'Actual Break Start' : 'Actual Check In'}
                </label>
                <input 
                  type="time" 
                  step="1"
                  value={claimedStartTime}
                  onChange={(e) => setClaimedStartTime(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {disputeType === 'break_time' ? 'Actual Break End' : 'Actual Check Out'}
                </label>
                <input 
                  type="time" 
                  step="1"
                  value={claimedEndTime}
                  onChange={(e) => setClaimedEndTime(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Description / Reason
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the issue (e.g., Forgot to check out, system was down...)"
              className="w-full p-3 h-28 resize-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            ></textarea>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg shadow-primary-500/30 transition-all uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit to Admin'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AttendanceDisputeModal;
