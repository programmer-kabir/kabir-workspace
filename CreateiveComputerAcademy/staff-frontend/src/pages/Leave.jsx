import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { FiCalendar, FiFileText, FiSend, FiClock, FiCheckCircle, FiXCircle, FiMessageSquare } from 'react-icons/fi';

const Leave = () => {
  const { currentUser } = useAuth();
  const { searchTerm } = useSearch();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Casual');
  const [reason, setReason] = useState('');
  
  const [message, setMessage] = useState('');
  
  const fetchLeaves = async () => {
    if(!currentUser) return;
    setLoading(true);
    try {
      const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/leave/get_my_leaves.php', {
        user_id: currentUser.id
      });
      if(res.data.status === 'success') {
        setLeaves(res.data.leaves);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [currentUser]);

  const filteredLeaves = leaves.filter(l => {
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (l.type || '').toLowerCase().includes(term) ||
      (l.reason || '').toLowerCase().includes(term) ||
      (l.status || '').toLowerCase().includes(term) ||
      (l.admin_comment || '').toLowerCase().includes(term) ||
      (l.start_date || '').toLowerCase().includes(term) ||
      (l.end_date || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!startDate || !endDate || !reason) {
        setMessage({ text: 'Please fill in all fields.', type: 'error' });
        return;
    }
    
    if(new Date(endDate) < new Date(startDate)) {
        setMessage({ text: 'End date cannot be before start date.', type: 'error' });
        return;
    }

    setSubmitLoading(true);
    setMessage(null);
    try {
      const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/leave/apply_leave.php', {
        user_id: currentUser.id,
        start_date: startDate,
        end_date: endDate,
        type: type,
        reason: reason
      });
      
      if(res.data.status === 'success') {
        setMessage({ text: 'Leave application submitted successfully!', type: 'success' });
        setStartDate('');
        setEndDate('');
        setReason('');
        setType('Casual');
        fetchLeaves(); // Refresh list
      } else {
        setMessage({ text: res.data.message || 'Failed to submit application.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const calculateDays = (start, end) => {
      if(!start || !end) return 0;
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays + 1; // inclusive
  }

  const calculateStats = () => {
    let casual = 0;
    let medical = 0;
    let pending = 0;
    
    leaves.forEach(leave => {
      if(leave.status === 'Pending') pending += calculateDays(leave.start_date, leave.end_date);
      if(leave.status === 'Approved') {
        if(leave.type === 'Casual') casual += calculateDays(leave.start_date, leave.end_date);
        if(leave.type === 'Medical') medical += calculateDays(leave.start_date, leave.end_date);
      }
    });
    return { casual, medical, pending };
  };

  const stats = calculateStats();

  return (
    <div className="pb-10 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Leave Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Apply for leave and track your application status.</p>
      </div>

      {/* Leave Balance / Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><FiCheckCircle size={64} /></div>
            <h3 className="text-emerald-100 font-medium mb-1">Casual Leaves Taken</h3>
            <div className="text-4xl font-bold">{stats.casual} <span className="text-lg font-normal text-emerald-200">Days</span></div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><FiCalendar size={64} /></div>
            <h3 className="text-blue-100 font-medium mb-1">Medical Leaves Taken</h3>
            <div className="text-4xl font-bold">{stats.medical} <span className="text-lg font-normal text-blue-200">Days</span></div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><FiClock size={64} /></div>
            <h3 className="text-amber-100 font-medium mb-1">Pending Approval</h3>
            <div className="text-4xl font-bold">{stats.pending} <span className="text-lg font-normal text-amber-200">Days</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Apply Form */}
        <div className="lg:col-span-1">
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
                                        onChange={(e) => setStartDate(e.target.value)}
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
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {startDate && endDate && (
                            <div className="bg-primary-50 text-primary-700 p-3 rounded-xl text-sm font-semibold flex items-center justify-between border border-primary-100">
                                <span>Total Duration:</span>
                                <span>{calculateDays(startDate, endDate)} Days</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Leave Type</label>
                            <select 
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-all"
                            >
                                <option value="Casual">Casual Leave</option>
                                <option value="Medical">Medical Leave</option>
                                <option value="Unpaid">Unpaid Leave</option>
                            </select>
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
                            disabled={submitLoading}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitLoading ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <>Submit Application <FiSend /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* Right Column: Leave History */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Leave History</h2>
            
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
            ) : filteredLeaves.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCalendar className="text-3xl text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{searchTerm ? 'No Matching Leaves' : 'No Leave History'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{searchTerm ? `No records found matching "${searchTerm}"` : "You haven't applied for any leaves yet."}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredLeaves.map((leave) => (
                        <div key={leave.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">
                                            {leave.type}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                                            {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Applied on {new Date(leave.created_at).toLocaleDateString()}</p>
                                </div>
                                
                                <div>
                                    {leave.status === 'Approved' ? (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
                                            <FiCheckCircle /> Approved
                                        </span>
                                    ) : leave.status === 'Rejected' ? (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-100">
                                            <FiXCircle /> Rejected
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-100">
                                            <FiClock /> Pending Approval
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> {leave.reason}</p>
                            </div>
                            
                            {leave.admin_comment && (
                                <div className="mt-3 bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
                                    <FiMessageSquare className="mt-0.5 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-xs uppercase tracking-wider mb-1 text-blue-600">Admin Note</p>
                                        <p>{leave.admin_comment}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Leave;

