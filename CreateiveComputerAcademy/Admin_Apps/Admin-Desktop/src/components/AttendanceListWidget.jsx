import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiClock, FiUser, FiCalendar } from 'react-icons/fi';
import { getApiBase } from '../context/AuthContext';

const AttendanceListWidget = () => {
  const [data, setData] = useState({ present: [], absent: [], leave: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('present');

  useEffect(() => {
    const fetchAttendanceList = async () => {
      try {
        const apiBase = getApiBase();
        const res = await axios.get(`${apiBase}api/admin/dashboard/get_today_attendance_list.php`);
        if (res.data?.status === 'success') {
          setData({
            present: res.data.data?.present || [],
            absent: res.data.data?.absent || [],
            leave: res.data.data?.leave || []
          });
        }
      } catch (error) {
        // Non-blocking
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceList();
  }, []);

  const getProfileImgUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    const cleanBase = getApiBase().replace(/\/+$/, '');
    return `${cleanBase}/${pic.replace(/^\/+/, '')}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const listToRender = data[activeTab] || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-full overflow-hidden transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-wrap justify-between items-center gap-3 bg-slate-50/70 dark:bg-slate-900/50">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Today's Attendance Status</h3>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl gap-1 border border-slate-200/70 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('present')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'present'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Present ({data.present.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('absent')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'absent'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Absent ({data.absent.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'leave'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            On Leave ({data.leave.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
        {listToRender.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
            {activeTab === 'present' && <FiXCircle size={44} className="mb-3 opacity-20" />}
            {activeTab === 'absent' && <FiCheckCircle size={44} className="mb-3 opacity-20 text-emerald-500" />}
            {activeTab === 'leave' && <FiCalendar size={44} className="mb-3 opacity-20 text-purple-500" />}
            <p className="font-medium text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'present' && 'No one has checked in yet today.'}
              {activeTab === 'absent' && 'Awesome! No one is absent today.'}
              {activeTab === 'leave' && 'No staff members are on leave today.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {listToRender.map((user) => {
              const avatar = getProfileImgUrl(user.profile_picture);
              return (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                      {avatar ? (
                        <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.designation || 'Staff'}</p>
                    </div>
                  </div>

                  {activeTab === 'present' && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                      <FiClock size={12} />
                      <span className="text-xs font-bold font-mono">{user.check_in}</span>
                    </div>
                  )}

                  {activeTab === 'absent' && (
                    <div className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
                      <span className="text-[10px] font-black uppercase tracking-wider">Not Arrived</span>
                    </div>
                  )}

                  {activeTab === 'leave' && (
                    <div className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200/60 dark:border-purple-800/40 flex items-center gap-1">
                      <span className="text-[10px] font-bold">🌴 On Leave</span>
                      {user.leave_type && (
                        <span className="text-[9px] opacity-75 font-medium">({user.leave_type})</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceListWidget;
