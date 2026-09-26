import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiClock, FiUser, FiCalendar } from 'react-icons/fi';

const AttendanceListWidget = () => {
  const [data, setData] = useState({ present: [], absent: [], leave: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('present'); // 'present', 'absent', or 'leave'

  useEffect(() => {
    const fetchAttendanceList = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/admin/dashboard/get_today_attendance_list.php`);
        if (res.data.status === 'success') {
          setData({
            present: res.data.data.present || [],
            absent: res.data.data.absent || [],
            leave: res.data.data.leave || []
          });
        }
      } catch (error) {
        console.error("Failed to fetch attendance list", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceList();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const listToRender = data[activeTab] || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Today's Attendance Status</h3>

        {/* Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('present')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'present'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Present ({data.present.length})
          </button>
          <button
            onClick={() => setActiveTab('absent')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'absent'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Absent ({data.absent.length})
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'leave'
              ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            On Leave ({data.leave.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
        {listToRender.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
            {activeTab === 'present' && <FiXCircle size={48} className="mb-4 opacity-20" />}
            {activeTab === 'absent' && <FiCheckCircle size={48} className="mb-4 opacity-20 text-emerald-500" />}
            {activeTab === 'leave' && <FiCalendar size={48} className="mb-4 opacity-20 text-purple-500" />}
            <p className="font-medium">
              {activeTab === 'present' && 'No one has checked in yet today.'}
              {activeTab === 'absent' && 'Awesome! No one is absent today.'}
              {activeTab === 'leave' && 'No staff members are on leave today.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {listToRender.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                    {user.profile_picture ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL}/${user.profile_picture}`} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiUser size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.designation || 'Staff'}</p>
                  </div>
                </div>

                {activeTab === 'present' && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                    <FiClock size={14} />
                    <span className="text-xs font-bold font-mono">{user.check_in}</span>
                  </div>
                )}

                {activeTab === 'absent' && (
                  <div className="text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-800/50">
                    <span className="text-[10px] font-black uppercase tracking-wider">Not Arrived</span>
                  </div>
                )}

                {activeTab === 'leave' && (
                  <div className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-lg border border-purple-100 dark:border-purple-800/50 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold">🌴 On Leave</span>
                    {user.leave_type && (
                      <span className="text-[10px] opacity-75 font-medium">({user.leave_type})</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceListWidget;

