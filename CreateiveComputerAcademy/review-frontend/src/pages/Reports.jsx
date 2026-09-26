import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiList, FiPieChart } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Reports = () => {
  const { currentUser } = useAuth();
  
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reportData, setReportData] = useState({
    summary: { total_received: 0, accepted: 0, rejected: 0, unviewed: 0 },
    tasks: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}api/reviewer/get_daily_report.php?reviewer_user_id=${currentUser.id}&date=${selectedDate}`);
        if (res.data.status === 'success') {
          setReportData({
            summary: res.data.summary,
            tasks: res.data.tasks || []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?.id) {
      fetchReport();
    }
  }, [currentUser, selectedDate]);

  return (
    <div className="mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiPieChart className="text-brand-400" /> Daily Reports
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Track the exact volume of work received and processed on a specific day.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-48 shrink-0">
            <FiCalendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Received */}
            <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-500/10 text-brand-400">
                  <FiList size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">{reportData.summary.total_received}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/40">Tasks Came In</p>
              </div>
            </div>

            {/* Accepted */}
            <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                  <FiCheckCircle size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">{reportData.summary.accepted}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/40">Accepted</p>
              </div>
            </div>

            {/* Rejected */}
            <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400">
                  <FiXCircle size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">{reportData.summary.rejected}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/40">Rejected</p>
              </div>
            </div>

            {/* Unviewed / Pending */}
            <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/10 text-yellow-400">
                  <FiClock size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">{reportData.summary.unviewed}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/40">Pending / Unviewed</p>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-white text-sm">Task Breakdown for {selectedDate}</h3>
            </div>
            
            {reportData.tasks.length === 0 ? (
              <div className="p-10 text-center text-white/40 text-sm">
                No tasks entered review on this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">Staff Member</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">Task Title</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">Priority</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportData.tasks.map(task => (
                      <tr key={task.task_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-white/10">
                              {task.staff_avatar 
                                ? <img src={`${API_BASE}${task.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white/50">{task.staff_name?.[0]}</div>
                              }
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{task.staff_name}</p>
                              <p className="text-[9px] text-white/40">{task.department_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs font-medium text-white/90 line-clamp-1">{task.title}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold shrink-0 ${
                            task.priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/5'
                            : task.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                            : 'text-slate-400 border-slate-500/30 bg-slate-500/5'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-1.5 w-max ${
                            task.report_status === 'Accepted' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                            : task.report_status === 'Rejected' ? 'text-red-400 border-red-500/30 bg-red-500/5'
                            : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                          }`}>
                            {task.report_status === 'Accepted' && <FiCheckCircle size={10} />}
                            {task.report_status === 'Rejected' && <FiXCircle size={10} />}
                            {task.report_status === 'Pending' && <FiClock size={10} />}
                            {task.report_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
