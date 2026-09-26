import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiCheck, FiInfo } from 'react-icons/fi';
import { toast } from 'sonner';

const ResolveDisputeModal = ({ dispute, onClose, onResolve, currentUser }) => {
  const [adminComment, setAdminComment] = useState(dispute.admin_comment || '');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  
  // Editable fields
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [breakType, setBreakType] = useState('Tiffin');
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

  React.useEffect(() => {
    if (dispute.status === 'pending') {
      const fetchRecord = async () => {
        try {
          const res = await axios.get(`${API_BASE}api/admin/attendance/get_attendance_record.php?staff_id=${dispute.staff_id}&date=${dispute.date}`);
          if (res.data.status === 'success') {
            setRecord(res.data.data);
            
            // Pre-fill with claimed times if the staff provided them, otherwise fallback to existing record
            if (dispute.dispute_type !== 'break_time') {
              setCheckIn(dispute.claimed_start_time || res.data.data.check_in || '');
              setCheckOut(dispute.claimed_end_time || res.data.data.check_out || '');
              setBreakStart(res.data.data.break_start || '');
              setBreakEnd(res.data.data.break_end || '');
            } else {
              setCheckIn(res.data.data.check_in || '');
              setCheckOut(res.data.data.check_out || '');
              setBreakStart(dispute.claimed_start_time || res.data.data.break_start || '');
              setBreakEnd(dispute.claimed_end_time || res.data.data.break_end || '');
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchRecord();
    }
  }, [dispute]);

  const handleAction = async (status) => {
    if (status === 'rejected' && !adminComment.trim()) {
      toast.error('Please provide a reason for rejection in the comment box.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        dispute_id: dispute.id,
        admin_id: currentUser.id,
        status,
        admin_comment: adminComment
      };

      if (status === 'approved') {
        if (dispute.dispute_type !== 'break_time') {
          payload.check_in = checkIn;
          payload.check_out = checkOut;
        } else {
          payload.break_start = breakStart;
          payload.break_end = breakEnd;
          payload.break_type = breakType;
        }
      }

      const res = await axios.post(`${API_BASE}api/admin/attendance/resolve_dispute.php`, payload);

      if (res.data.status === 'success') {
        toast.success(`Dispute marked as ${status}`);
        onResolve();
      } else {
        toast.error(res.data.message || 'Failed to resolve dispute');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isResolved = dispute.status !== 'pending';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-up">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            Dispute Details
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Staff Info */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <img 
              src={`${API_BASE}${dispute.profile_picture}`} 
              alt="Avatar" 
              className="w-14 h-14 rounded-full object-cover shadow-sm border-2 border-white dark:border-slate-700"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${dispute.staff_name}&background=random`; }}
            />
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Staff Member</p>
              <p className="font-black text-lg text-slate-800 dark:text-slate-100">{dispute.staff_name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(dispute.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Grid for Staff Claim & System Record */}
          <div className="grid grid-cols-2 gap-4">
            {/* Issue Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiInfo /> Staff Claim
              </h4>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-3 h-[110px] overflow-y-auto">
                <div className="mb-2">
                  <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {dispute.dispute_type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-amber-900 dark:text-amber-200 font-medium italic text-xs mb-2">
                  "{dispute.description}"
                </p>
                
                {(dispute.claimed_start_time || dispute.claimed_end_time) && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800/50">
                    <div className="flex gap-4">
                      {dispute.claimed_start_time && (
                        <div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-500 block mb-0.5 font-bold uppercase">
                            {dispute.dispute_type === 'break_time' ? 'Start' : 'In'}
                          </span>
                          <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                            {dispute.claimed_start_time}
                          </span>
                        </div>
                      )}
                      {dispute.claimed_end_time && (
                        <div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-500 block mb-0.5 font-bold uppercase">
                            {dispute.dispute_type === 'break_time' ? 'End' : 'Out'}
                          </span>
                          <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                            {dispute.claimed_end_time}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current System Record */}
            {record && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FiInfo /> Current Record
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-3 h-[110px] flex flex-col justify-center">
                  <div className="flex flex-col gap-3">
                    {dispute.dispute_type !== 'break_time' ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Check In:</span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {record.check_in ? record.check_in : 'Not found'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Check Out:</span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {record.check_out ? record.check_out : 'Not found'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Break Start:</span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {record.break_start ? record.break_start : 'Not found'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Break End:</span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {record.break_end ? record.break_end : 'Not found'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time Editing */}
          {!isResolved && record && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                Correct {dispute.dispute_type === 'break_time' ? 'Break' : 'Attendance'} Record
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {dispute.dispute_type !== 'break_time' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Check In</label>
                      <input type="time" step="1" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Check Out</label>
                      <input type="time" step="1" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Break Start Time</label>
                      <input type="time" step="1" value={breakStart} onChange={e => setBreakStart(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Break End Time</label>
                      <input type="time" step="1" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Break Type</label>
                      <select value={breakType} onChange={e => setBreakType(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500">
                        <option value="Tiffin">Tiffin Break</option>
                        <option value="Prayer">Prayer Break</option>
                        <option value="Personal">Personal Break</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-2 opacity-75">
                Note: Approving the dispute will automatically update the time with the values above.
              </p>
            </div>
          )}

          {/* Admin Action */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Admin Comment / Resolution Notes
            </h4>
            <textarea 
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              disabled={isResolved}
              placeholder="Add note for the staff member..."
              className="w-full p-2 h-12 resize-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-75"
            ></textarea>
          </div>

          {!isResolved ? (
            <div className="flex gap-3">
              <button 
                onClick={() => handleAction('rejected')}
                disabled={loading}
                className="flex-1 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-black rounded-xl transition-colors uppercase tracking-wider text-sm disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleAction('approved')}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all uppercase tracking-wider text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiCheck size={18} /> Approve
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-xl text-center font-bold border ${
              dispute.status === 'approved' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800 dark:text-emerald-400' 
                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800 dark:text-rose-400'
            }`}>
              This dispute was {dispute.status}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResolveDisputeModal;
