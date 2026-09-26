import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCalendar,FiUserCheck,FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiRefreshCw, FiFileText, FiDownload } from 'react-icons/fi';

const Reports = () => {
  const { currentUser } = useAuth();
  
  const formatLocalDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Date filter state (Default: Current Month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  });
  
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'tasks'
  
  const [loading, setLoading] = useState(false);
  const [attReport, setAttReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);

  const fetchReports = async () => {
    if(!currentUser?.id || !startDate || !endDate) return;
    setLoading(true);
    try {
      const [attRes, taskRes] = await Promise.all([
        axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/reports/get_attendance_report.php', {
          user_id: currentUser.id,
          start_date: startDate,
          end_date: endDate
        }),
        axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/reports/get_task_report.php', {
          user_id: currentUser.id,
          start_date: startDate,
          end_date: endDate
        })
      ]);
      
      if(attRes.data.status === 'success') {
        const data = attRes.data;

        // Frontend fallback calculations in case production API is not updated yet
        let totalExpectedSeconds = 0;
        let totalWorkedSeconds = 0;
        let absentDays = 0;

        if (data.history && Array.isArray(data.history)) {
          data.history.forEach((day) => {
            // 1. Parse Expected Hours (e.g. "8h 0m")
            if (day.expected_hours) {
              const expMatch = day.expected_hours.match(/(\d+)h\s*(\d+)m/);
              if (expMatch) {
                totalExpectedSeconds += (parseInt(expMatch[1], 10) * 3600) + (parseInt(expMatch[2], 10) * 60);
              }
            }

            // 2. Parse Worked Hours (e.g. "8h 0m")
            if (day.total_hours) {
              const wrkMatch = day.total_hours.match(/(\d+)h\s*(\d+)m/);
              if (wrkMatch) {
                totalWorkedSeconds += (parseInt(wrkMatch[1], 10) * 3600) + (parseInt(wrkMatch[2], 10) * 60);
              }
            }

            // 3. Count Absent Days
            const isAbsentStatus = day.status && day.status.toLowerCase() === 'absent';
            if (isAbsentStatus && !day.is_weekend && !day.is_holiday) {
              absentDays++;
            }
          });
        }

        const formatSecs = (totalSecs) => {
          const h = Math.floor(totalSecs / 3600);
          const m = Math.floor((totalSecs % 3600) / 60);
          return `${h}h ${m}m`;
        };

        // Inject computed values if missing from API response
        if (!data.summary.total_expected) {
          data.summary.total_expected = formatSecs(totalExpectedSeconds);
        }
        if (!data.summary.total_worked) {
          data.summary.total_worked = formatSecs(totalWorkedSeconds);
        }
        if (!data.summary.absent || data.summary.absent === 0) {
          data.summary.absent = absentDays;
        }

        setAttReport(data);
      }
      if(taskRes.data.status === 'success') setTaskReport(taskRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentUser, startDate, endDate]);

  return (
    <div className="pb-10 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Performance Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review your attendance and task history.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
            <FiCalendar className="text-slate-400 mr-2" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            />
          </div>
          <span className="text-slate-400 font-medium px-2">to</span>
          <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
            <FiCalendar className="text-slate-400 mr-2" />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            />
          </div>
          <button onClick={fetchReports} className="p-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors">
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-8 shadow-inner">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
        >
          <FiClock className={activeTab === 'attendance' ? 'animate-pulse' : ''} /> Attendance Report
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'tasks' ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
        >
          <FiFileText className={activeTab === 'tasks' ? 'animate-pulse' : ''} /> Work / Tasks Report
        </button>
      </div>

      {loading && !attReport ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <>
          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && attReport && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Working Days */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">Working Days</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-slate-100 group-hover:translate-x-1 transition-transform">{attReport.summary.total_days}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <FiCalendar size={20} />
                  </div>
                </div>

                {/* Card 2: Present */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</p>
                    <p className="text-3xl font-black text-emerald-700 group-hover:translate-x-1 transition-transform">{attReport.summary.present}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <FiCheckCircle size={20} />
                  </div>
                </div>

                {/* Card 3: Absent */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Absent</p>
                    <p className="text-3xl font-black text-rose-700 group-hover:translate-x-1 transition-transform">{attReport.summary.absent}</p>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <FiXCircle size={20} />
                  </div>
                </div>

                {/* Card 4: Late */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Late</p>
                    <p className="text-3xl font-black text-amber-700 group-hover:translate-x-1 transition-transform">{attReport.summary.late}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                    <FiClock size={20} />
                  </div>
                </div>

                {/* Card 5: Expected Hours */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-violet-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-violet-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Expected Duty</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_expected}</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                    <FiClock size={20} />
                  </div>
                </div>

                {/* Card 6: Worked Hours */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Hours Worked</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_worked}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                    <FiUserCheck size={20} />
                  </div>
                </div>

                {/* Card 7: Overtime */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Overtime</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_overtime}</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <FiTrendingUp size={20} />
                  </div>
                </div>

                {/* Card 8: Short Time */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 group-hover:h-1.5 transition-all"></div>
                  <div>
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Short Time</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_short_time}</p>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <FiAlertCircle size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Daily Attendance Breakdown</h3>
                  <button className="text-sm font-semibold text-primary-600 flex items-center gap-2 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                    <FiDownload /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-white dark:bg-slate-800 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Check In</th>
                        <th className="px-6 py-4">Check Out</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Duty Hours</th>
                        <th className="px-6 py-4 text-center">Work Hours</th>
                        <th className="px-6 py-4 text-center">Break Time</th>
                        <th className="px-6 py-4 text-right">OT / Short</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attReport.history.map((record, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{record.date}</td>
                          <td className="px-6 py-4">{record.check_in || '-'}</td>
                          <td className="px-6 py-4">{record.check_out || '-'}</td>
                          <td className="px-6 py-4 flex gap-2">
                            {(record.is_weekend && record.status !== 'Weekend') && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Weekend
                                </span>
                            )}
                            {(record.is_holiday && record.status !== 'Holiday') && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                  Holiday
                                </span>
                            )}
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                              record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                              record.status === 'Late' ? 'bg-amber-100 text-amber-700' : 
                              record.status === 'Weekend' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                              record.status === 'Holiday' ? 'bg-purple-100 text-purple-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-400">{record.expected_hours || '-'}</td>
                          <td className="px-6 py-4 text-center font-medium">{record.total_hours || '-'}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{record.total_break_minutes > 0 ? `${record.total_break_minutes}m` : '-'}</td>
                          <td className="px-6 py-4 text-right">
                            {record.overtime ? (
                              <span className={`font-bold ${record.is_short ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {record.overtime}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                      {attReport.history.length === 0 && (
                        <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400">No records found for this period.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && taskReport && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Assigned</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_assigned}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_completed}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-orange-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Delayed Completion</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.delayed_completions}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Total Rejected</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_rejected}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-blue-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Resubmitted</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_resubmitted}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Task History Details</h3>
                  <button className="text-sm font-semibold text-primary-600 flex items-center gap-2 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                    <FiDownload /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-white dark:bg-slate-800 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">Task Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Assigned On</th>
                        <th className="px-6 py-4 text-right">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taskReport.tasks.map((task, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-700 dark:text-slate-300 max-w-[300px] truncate">{task.title}</div>
                            {task.was_resubmitted && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                  <FiRefreshCw className="mr-1" /> Resubmitted {task.resubmit_count > 1 ? `x${task.resubmit_count}` : ''}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded">{task.category}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(task.assign_date || task.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            {task.status === 'Completed' ? (
                                <span className={`flex items-center justify-end gap-1.5 font-bold ${task.was_delayed ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    <FiCheckCircle /> {task.was_delayed ? 'Completed (Delayed)' : 'Completed'}
                                </span>
                            ) : task.status === 'Rejected' ? (
                                <span className="flex items-center justify-end gap-1.5 font-bold text-rose-600">
                                    <FiXCircle /> Needs Revision
                                </span>
                            ) : (
                                <span className="flex items-center justify-end gap-1.5 font-bold text-blue-600">
                                    <FiClock /> {task.status}
                                </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {taskReport.tasks.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">No tasks assigned in this period.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Reports;

