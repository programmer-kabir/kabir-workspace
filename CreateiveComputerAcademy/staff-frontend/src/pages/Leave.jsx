import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import LeaveApplyForm from '../components/Leave/LeaveApplyForm';
import LeaveHistoryList from '../components/Leave/LeaveHistoryList';

const Leave = () => {
  const { currentUser } = useAuth();
  const { searchTerm } = useSearch();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentQuota, setStudentQuota] = useState(null);
  
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

  const fetchStudentQuota = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/leave/get_student_quota.php?user_id=${currentUser.id}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setStudentQuota(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLeaves();
    fetchStudentQuota();
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

  const calculateDays = (start, end) => {
    if(!start || !end) return 0;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    if (e < s) return 0;
    const diffTime = Math.abs(e - s);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays + 1; // inclusive
  };

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
      <div className={`grid grid-cols-1 ${studentQuota?.is_student ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-8`}>
        {studentQuota?.is_student && (
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-5xl">🎓</div>
            <h3 className="text-indigo-100 font-bold mb-1">Student Leave Left</h3>
            <div className="text-4xl font-extrabold">{studentQuota.remaining_days} <span className="text-lg font-normal text-indigo-200">/ {studentQuota.monthly_quota} Days</span></div>
            <p className="text-[11px] text-indigo-200 mt-2 font-medium">Unpaid • Zero Mango deduction</p>
          </div>
        )}
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
          <LeaveApplyForm
            currentUser={currentUser}
            studentQuota={studentQuota}
            onSuccess={() => {
              fetchLeaves();
              fetchStudentQuota();
            }}
          />
        </div>

        {/* Right Column: Leave History */}
        <div className="lg:col-span-2 space-y-6">
          <LeaveHistoryList
            leaves={filteredLeaves}
            loading={loading}
            searchTerm={searchTerm}
          />
        </div>

      </div>
    </div>
  );
};

export default Leave;

