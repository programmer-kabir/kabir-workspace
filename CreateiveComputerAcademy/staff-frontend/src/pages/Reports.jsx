import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiClock, FiRefreshCw, FiFileText } from 'react-icons/fi';
import AttendanceReportTab from '../components/Reports/AttendanceReportTab';
import TaskReportTab from '../components/Reports/TaskReportTab';

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
           <AttendanceReportTab attReport={attReport} />
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && taskReport && (
             <TaskReportTab taskReport={taskReport} />
          )}
        </>
      )}

    </div>
  );
};

export default Reports;

