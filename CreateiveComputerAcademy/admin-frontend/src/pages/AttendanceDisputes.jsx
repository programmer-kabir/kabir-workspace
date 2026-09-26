import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAlertCircle, FiCheck, FiX, FiSearch, FiFilter } from 'react-icons/fi';
import ResolveDisputeModal from '../components/ResolveDisputeModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AttendanceDisputes = () => {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedDispute, setSelectedDispute] = useState(null);
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/attendance/get_disputes.php?status=${filter}`);
      if (res.data.status === 'success') {
        setDisputes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching disputes', err);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const handleResolve = () => {
    fetchDisputes();
    setSelectedDispute(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Attendance Disputes</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Review and resolve staff attendance issues.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header/Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', ''].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all uppercase tracking-wider ${
                  filter === status 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold">Staff</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Issue Type</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading disputes...</td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No {filter} disputes found.</td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`${API_BASE}${dispute.profile_picture}`} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${dispute.staff_name}&background=random`; }}
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{dispute.staff_name}</p>
                          <p className="text-xs text-slate-500 font-mono">{dispute.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {new Date(dispute.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-md">
                        {dispute.dispute_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${
                        dispute.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50' :
                        dispute.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' :
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/50'
                      }`}>
                        {dispute.status === 'pending' && <FiAlertCircle size={12} />}
                        {dispute.status === 'approved' && <FiCheck size={12} />}
                        {dispute.status === 'rejected' && <FiX size={12} />}
                        {dispute.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedDispute(dispute)}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                      >
                        {dispute.status === 'pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDispute && (
        <ResolveDisputeModal 
          dispute={selectedDispute} 
          onClose={() => setSelectedDispute(null)}
          onResolve={handleResolve}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default AttendanceDisputes;
