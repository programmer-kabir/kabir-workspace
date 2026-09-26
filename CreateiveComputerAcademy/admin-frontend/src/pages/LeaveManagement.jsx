import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiUser, FiMessageSquare, FiAlertTriangle, FiActivity, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ show: false, leaveId: null, reason: '' });
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      // Mocking endpoint for now if not exists, you should replace with actual API
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/admin/leave/get_all_leaves.php`);
      if (res.data.status === 'success') {
        setLeaves(res.data.leaves);
      } else {
        // If API fails or doesn't exist yet, we handle gracefully
        setLeaves([]);
      }
    } catch (error) {
      console.error(error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, reason = '') => {
    setActionLoading(id);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}api/admin/leave/update_leave_status.php`, {
        leave_id: id,
        status: status,
        admin_comment: reason
      });

      if (res.data.status === 'success') {
        toast.success(`Leave request ${status.toLowerCase()} successfully`);
        fetchLeaves();
        if (rejectModal.show) setRejectModal({ show: false, leaveId: null, reason: '' });
      } else {
        toast.error(res.data.message || 'Failed to update leave status');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-500/20"><FiCheckCircle /> Approved</span>;
    if (status === 'Rejected') return <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-500/20"><FiXCircle /> Rejected</span>;
    return <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-500/20"><FiClock /> Pending</span>;
  };

  const getConflictWarning = (pendingLeave) => {
    if (pendingLeave.status !== 'Pending') return null;
    const pendingStart = new Date(pendingLeave.start_date);
    const pendingEnd = new Date(pendingLeave.end_date);
    
    const overlappingLeaves = leaves.filter(l => {
      if (l.id === pendingLeave.id || l.status !== 'Approved') return false;
      const lStart = new Date(l.start_date);
      const lEnd = new Date(l.end_date);
      return pendingStart <= lEnd && pendingEnd >= lStart;
    });

    if (overlappingLeaves.length > 0) {
      return overlappingLeaves.length;
    }
    return null;
  };

  const getLeaveDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  const stats = {
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesStatus = filterStatus === 'All' || leave.status === filterStatus;
    const matchesSearch = leave.staff_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (filterDate) {
      const lStart = new Date(leave.start_date).toISOString().split('T')[0];
      const lEnd = new Date(leave.end_date).toISOString().split('T')[0];
      matchesDate = (filterDate >= lStart && filterDate <= lEnd) || (lStart === filterDate);
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div className="p-6 mx-auto animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                 <FiActivity size={24} />
             </div>
             Leave Approvals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Review and manage staff leave requests seamlessly.</p>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"><FiClock size={120} /></div>
          <p className="text-blue-100 font-medium mb-1 tracking-wide uppercase text-xs">Pending Approvals</p>
          <h3 className="text-5xl font-black">{stats.pending}</h3>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"><FiCheckCircle size={120} /></div>
          <p className="text-emerald-100 font-medium mb-1 tracking-wide uppercase text-xs">Approved Leaves</p>
          <h3 className="text-5xl font-black">{stats.approved}</h3>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"><FiXCircle size={120} /></div>
          <p className="text-rose-100 font-medium mb-1 tracking-wide uppercase text-xs">Rejected Leaves</p>
          <h3 className="text-5xl font-black">{stats.rejected}</h3>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search staff by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all"
          />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 shadow-inner min-w-[180px] focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
            <FiCalendar className="text-blue-500 dark:text-white mr-3" size={16} />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 w-full cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')} 
                className="ml-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/40 text-rose-600 dark:text-rose-400 p-1 rounded-full transition-colors"
                title="Clear Date"
              >
                <FiXCircle size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar md:border-l border-slate-200 dark:border-slate-700 md:pl-4">
            <FiFilter className="text-slate-400 mr-1" />
            {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status ? 'bg-slate-800 text-white dark:bg-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff Member</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leave Details</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500">Loading leave requests...</td></tr>
              ) : filteredLeaves.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500">No leave requests found matching your filter.</td></tr>
              ) : (
                filteredLeaves.map((leave, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, ease: "easeOut" }}
                    key={leave.id} 
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                          {leave.staff_image ? <img src={`${import.meta.env.VITE_API_BASE_URL}${leave.staff_image}`} className="w-full h-full object-cover" /> : <FiUser />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{leave.staff_name}</p>
                          <p className="text-xs text-slate-500">{leave.staff_role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{leave.type} Leave</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <FiCalendar size={12} className="shrink-0" /> 
                        <span className="truncate">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                        <span className="ml-1.5 shrink-0 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-md font-bold text-[10px]">
                          {getLeaveDuration(leave.start_date, leave.end_date)}
                        </span>
                      </p>
                      {getConflictWarning(leave) && (
                        <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-md inline-flex items-center gap-1">
                          <FiAlertTriangle size={12} /> {getConflictWarning(leave)} staff already on leave!
                        </div>
                      )}
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="bg-slate-50/90 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                          {leave.reason || <span className="italic text-slate-400">No reason specified</span>}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="p-4 text-right">
                      {leave.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                            disabled={actionLoading === leave.id}
                            className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <FiCheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => setRejectModal({ show: true, leaveId: leave.id, reason: '' })}
                            disabled={actionLoading === leave.id}
                            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <FiXCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FiMessageSquare className="text-rose-500" /> Reject Leave Request
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Please provide a reason for rejecting this leave request. The staff member will see this.</p>
            <textarea
              rows="3"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Enter rejection reason..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none mb-4 resize-none placeholder-slate-400 dark:placeholder-slate-500"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ show: false, leaveId: null, reason: '' })}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >Cancel</button>
              <button
                onClick={() => handleStatusUpdate(rejectModal.leaveId, 'Rejected', rejectModal.reason)}
                disabled={!rejectModal.reason.trim() || actionLoading === rejectModal.leaveId}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50"
              >Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveManagement;
