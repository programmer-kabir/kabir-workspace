import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FiX,
  FiClock,
  FiFileText,
  FiShuffle,
  FiAward,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiStar,
  FiActivity
} from 'react-icons/fi';
import StaffSearchSelect from './StaffSearchSelect';

export default function StaffCompareModal({
  isOpen,
  onClose,
  staffA,
  staffList = [],
  startDate,
  endDate,
  filterLabel,
  staffAAttReport,
  staffATaskReport,
  API_BASE = '/'
}) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'tasks'
  const [staffBId, setStaffBId] = useState('');
  const [loadingB, setLoadingB] = useState(false);
  const [staffBAttReport, setStaffBAttReport] = useState(null);
  const [staffBTaskReport, setStaffBTaskReport] = useState(null);
  const [errorB, setErrorB] = useState('');

  // Filter out Staff A from selection options
  const eligibleStaffBList = useMemo(() => {
    if (!staffA?.id) return staffList;
    return staffList.filter(s => String(s.id) !== String(staffA.id));
  }, [staffList, staffA]);

  // Formatted options for StaffSearchSelect dropdown
  const staffBOptions = useMemo(() => {
    return eligibleStaffBList.map(s => ({
      value: String(s.id),
      name: s.name,
      designation: s.designation || 'Staff',
      department_name: s.department_name || '',
      profile_picture: s.profile_picture || null
    }));
  }, [eligibleStaffBList]);

  // Auto-select the first candidate for Staff B if none selected
  useEffect(() => {
    if (isOpen && eligibleStaffBList.length > 0 && (!staffBId || staffBId === String(staffA?.id))) {
      setStaffBId(String(eligibleStaffBList[0].id));
    }
  }, [isOpen, eligibleStaffBList, staffA, staffBId]);

  // Selected Staff B info object
  const staffB = useMemo(() => {
    return staffList.find(s => String(s.id) === String(staffBId)) || null;
  }, [staffList, staffBId]);

  // Fetch Staff B's reports whenever staffBId, startDate, or endDate changes
  useEffect(() => {
    if (!isOpen || !staffBId) return;

    let isMounted = true;
    const fetchStaffBData = async () => {
      setLoadingB(true);
      setErrorB('');
      try {
        const [attRes, taskRes] = await Promise.all([
          axios.post(`${API_BASE}api/reports/get_attendance_report.php`, {
            user_id: staffBId,
            start_date: startDate,
            end_date: endDate
          }),
          axios.post(`${API_BASE}api/reports/get_task_report.php`, {
            user_id: staffBId,
            start_date: startDate,
            end_date: endDate
          })
        ]);

        if (isMounted) {
          if (attRes.data?.status === 'success') {
            setStaffBAttReport(attRes.data);
          }
          if (taskRes.data?.status === 'success') {
            setStaffBTaskReport(taskRes.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch Staff B report:', err);
          setErrorB('Could not load comparison data for selected staff.');
        }
      } finally {
        if (isMounted) {
          setLoadingB(false);
        }
      }
    };

    fetchStaffBData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, staffBId, startDate, endDate, API_BASE]);

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !staffA) return null;

  // Metric calculation helpers
  const attA = staffAAttReport?.summary || {};
  const attB = staffBAttReport?.summary || {};
  const taskA = staffATaskReport?.summary || {};
  const taskB = staffBTaskReport?.summary || {};

  // Attendance metrics
  const hoursA = (attA.total_worked_seconds || 0) / 3600;
  const hoursB = (attB.total_worked_seconds || 0) / 3600;
  const presentA = attA.present || 0;
  const presentB = attB.present || 0;
  const lateA = attA.late || 0;
  const lateB = attB.late || 0;
  const absentA = attA.absent || 0;
  const absentB = attB.absent || 0;
  const leavesA = (attA.leave || 0) + (attA.student_leave || 0);
  const leavesB = (attB.leave || 0) + (attB.student_leave || 0);
  const otA = (attA.total_overtime_seconds || 0) / 3600;
  const otB = (attB.total_overtime_seconds || 0) / 3600;

  // Task metrics
  const completedA = taskA.total_completed || 0;
  const completedB = taskB.total_completed || 0;
  const assignedA = taskA.total_assigned || 0;
  const assignedB = taskB.total_assigned || 0;
  const ratingA = taskA.avg_rating || 5.0;
  const ratingB = taskB.avg_rating || 5.0;
  const rejectedA = taskA.total_rejected || 0;
  const rejectedB = taskB.total_rejected || 0;
  const delayedA = taskA.delayed_completions || 0;
  const delayedB = taskB.delayed_completions || 0;

  // Comparison helper: returns 'A' | 'B' | 'TIE'
  const getWinner = (valA, valB, higherIsBetter = true) => {
    if (valA === valB) return 'TIE';
    if (higherIsBetter) return valA > valB ? 'A' : 'B';
    return valA < valB ? 'A' : 'B';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Container Shell */}
      <div className="relative w-full max-w-[1600px] h-full mx-auto bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* ──────── Header ──────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FiShuffle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Staff Performance Head-to-Head Comparison
              </h2>
              <p className="text-xs font-bold text-slate-400">
                Period: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{filterLabel || `${startDate} to ${endDate}`}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FiClock size={14} />
                <span>Attendance</span>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FiFileText size={14} />
                <span>Task & Quality</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* ──────── Content Area (Scrollable) ──────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ──────── Top Profile Selection Arena (Staff A vs Staff B) ──────── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 bg-white dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative z-20">
            
            {/* Staff A Profile Card (Primary Benchmark) */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md overflow-hidden shrink-0">
                {staffA.profile_picture ? (
                  <img
                    src={`${API_BASE}${staffA.profile_picture}`}
                    alt={staffA.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{staffA.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-1">
                  Benchmark Staff (A)
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {staffA.name}
                </h3>
                <p className="text-xs font-bold text-slate-400 truncate mt-0.5">
                  {staffA.designation || 'Staff'} • <span className="text-blue-600 dark:text-blue-400">{staffA.department_name || 'General'}</span>
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-400 mt-1">ID: #{staffA.id}</p>
              </div>
            </div>

            {/* Central VS Badge */}
            <div className="flex flex-col items-center justify-center px-2 py-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-lg shadow-orange-500/25 ring-4 ring-white dark:ring-slate-900">
                VS
              </div>
            </div>

            {/* Staff B Selection Card with Custom Searchable Dropdown */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                  Compare Candidate (B)
                </span>
                {staffB?.id && (
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    ID: #{staffB.id}
                  </span>
                )}
              </div>

              {/* Exact Custom Searchable Dropdown matching screenshot */}
              <StaffSearchSelect
                value={staffBId}
                onChange={(val) => setStaffBId(val)}
                options={staffBOptions}
                apiBase={API_BASE}
              />
            </div>

          </div>

          {/* Loading or Error states for Staff B */}
          {loadingB && (
            <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
              <div className="animate-spin h-6 w-6 border-3 border-purple-600 border-t-transparent rounded-full" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading {staffB?.name || 'Staff B'} performance metrics...</p>
            </div>
          )}

          {errorB && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <FiAlertCircle size={16} />
              <span>{errorB}</span>
            </div>
          )}

          {/* ──────── TAB 1: ATTENDANCE COMPARISON ──────── */}
          {activeTab === 'attendance' && !loadingB && (
            <div className="space-y-6">
              
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* 1. Total Worked Hours */}
                <ComparisonMetricCard
                  title="Total Work Hours"
                  icon={FiClock}
                  valA={`${hoursA.toFixed(1)} hrs`}
                  valB={`${hoursB.toFixed(1)} hrs`}
                  winner={getWinner(hoursA, hoursB, true)}
                  colorTheme="blue"
                  subtext="Based on approved punch durations"
                  numA={hoursA}
                  numB={hoursB}
                />

                {/* 2. Present Days */}
                <ComparisonMetricCard
                  title="Days Present"
                  icon={FiCheckCircle}
                  valA={`${presentA} Days`}
                  valB={`${presentB} Days`}
                  winner={getWinner(presentA, presentB, true)}
                  colorTheme="emerald"
                  subtext="Physical or remote attendance"
                  numA={presentA}
                  numB={presentB}
                />

                {/* 3. Late Arrivals (Lower is Better) */}
                <ComparisonMetricCard
                  title="Late Arrivals"
                  icon={FiAlertCircle}
                  valA={`${lateA} Times`}
                  valB={`${lateB} Times`}
                  winner={getWinner(lateA, lateB, false)}
                  colorTheme="amber"
                  subtext="Arrival after shift threshold"
                  numA={lateA}
                  numB={lateB}
                  lowerIsBetter={true}
                />

                {/* 4. Absent & Leaves (Lower is Better) */}
                <ComparisonMetricCard
                  title="Absents & Leaves"
                  icon={FiCalendar}
                  valA={`${absentA} Abs • ${leavesA} Lv`}
                  valB={`${absentB} Abs • ${leavesB} Lv`}
                  winner={getWinner(absentA + leavesA, absentB + leavesB, false)}
                  colorTheme="rose"
                  subtext="Total non-working days"
                  numA={absentA + leavesA}
                  numB={absentB + leavesB}
                  lowerIsBetter={true}
                />

              </div>

              {/* Side-by-side Deep Breakdown Table */}
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiActivity className="text-blue-500" />
                  Detailed Attendance Statistics Breakdown
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[11px] font-black">
                        <th className="py-3 px-4">Metric Feature</th>
                        <th className="py-3 px-4 text-blue-600 dark:text-blue-400 font-extrabold">{staffA.name} (A)</th>
                        <th className="py-3 px-4 text-center">Comparison Bar</th>
                        <th className="py-3 px-4 text-purple-600 dark:text-purple-400 font-extrabold text-right">{staffB?.name || 'Staff B'} (B)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                      
                      <ComparisonTableRow
                        label="Total Working Time"
                        valA={attA.total_worked || `${hoursA.toFixed(1)}h`}
                        valB={attB.total_worked || `${hoursB.toFixed(1)}h`}
                        numA={hoursA}
                        numB={hoursB}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Overtime Generated"
                        valA={attA.total_overtime || `${otA.toFixed(1)}h`}
                        valB={attB.total_overtime || `${otB.toFixed(1)}h`}
                        numA={otA}
                        numB={otB}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Expected Required Shift Time"
                        valA={attA.total_expected || '0h'}
                        valB={attB.total_expected || '0h'}
                        numA={attA.total_expected_seconds || 1}
                        numB={attB.total_expected_seconds || 1}
                        higherIsBetter={false}
                      />

                      <ComparisonTableRow
                        label="Present Days Count"
                        valA={`${presentA} Days`}
                        valB={`${presentB} Days`}
                        numA={presentA}
                        numB={presentB}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Late Arrival Incidents"
                        valA={`${lateA} Times`}
                        valB={`${lateB} Times`}
                        numA={lateA}
                        numB={lateB}
                        higherIsBetter={false}
                      />

                      <ComparisonTableRow
                        label="Approved Leave Days"
                        valA={`${leavesA} Days`}
                        valB={`${leavesB} Days`}
                        numA={leavesA}
                        numB={leavesB}
                        higherIsBetter={false}
                      />

                      <ComparisonTableRow
                        label="Unexcused Absents"
                        valA={`${absentA} Days`}
                        valB={`${absentB} Days`}
                        numA={absentA}
                        numB={absentB}
                        higherIsBetter={false}
                      />

                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ──────── TAB 2: TASK & QUALITY COMPARISON ──────── */}
          {activeTab === 'tasks' && !loadingB && (
            <div className="space-y-6">
              
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* 1. Completed Tasks */}
                <ComparisonMetricCard
                  title="Completed Tasks"
                  icon={FiCheckCircle}
                  valA={`${completedA} / ${assignedA}`}
                  valB={`${completedB} / ${assignedB}`}
                  winner={getWinner(completedA, completedB, true)}
                  colorTheme="emerald"
                  subtext="Successfully delivered assignments"
                  numA={completedA}
                  numB={completedB}
                />

                {/* 2. Average QA Rating */}
                <ComparisonMetricCard
                  title="Quality Rating (QA)"
                  icon={FiStar}
                  valA={`${ratingA.toFixed(1)} / 5.0`}
                  valB={`${ratingB.toFixed(1)} / 5.0`}
                  winner={getWinner(ratingA, ratingB, true)}
                  colorTheme="amber"
                  subtext="Reviewer audit score"
                  numA={ratingA}
                  numB={ratingB}
                />

                {/* 3. Delayed Tasks (Lower is Better) */}
                <ComparisonMetricCard
                  title="Delayed Deliveries"
                  icon={FiAlertCircle}
                  valA={`${delayedA} Tasks`}
                  valB={`${delayedB} Tasks`}
                  winner={getWinner(delayedA, delayedB, false)}
                  colorTheme="rose"
                  subtext="Overdue submission incidents"
                  numA={delayedA}
                  numB={delayedB}
                  lowerIsBetter={true}
                />

                {/* 4. Total Rejections (Lower is Better) */}
                <ComparisonMetricCard
                  title="Task Rejections"
                  icon={FiX}
                  valA={`${rejectedA} Tasks`}
                  valB={`${rejectedB} Tasks`}
                  winner={getWinner(rejectedA, rejectedB, false)}
                  colorTheme="purple"
                  subtext="Returned for major rework"
                  numA={rejectedA}
                  numB={rejectedB}
                  lowerIsBetter={true}
                />

              </div>

              {/* Side-by-side Task Breakdown Table */}
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiAward className="text-amber-500" />
                  Task Execution & Review Benchmark Breakdown
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[11px] font-black">
                        <th className="py-3 px-4">Task Metric</th>
                        <th className="py-3 px-4 text-blue-600 dark:text-blue-400 font-extrabold">{staffA.name} (A)</th>
                        <th className="py-3 px-4 text-center">Comparison Bar</th>
                        <th className="py-3 px-4 text-purple-600 dark:text-purple-400 font-extrabold text-right">{staffB?.name || 'Staff B'} (B)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                      
                      <ComparisonTableRow
                        label="Completion Success Rate"
                        valA={assignedA > 0 ? `${Math.round((completedA / assignedA) * 100)}%` : '0%'}
                        valB={assignedB > 0 ? `${Math.round((completedB / assignedB) * 100)}%` : '0%'}
                        numA={assignedA > 0 ? (completedA / assignedA) * 100 : 0}
                        numB={assignedB > 0 ? (completedB / assignedB) * 100 : 0}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Average Quality Score"
                        valA={`${ratingA.toFixed(1)} / 5.0 ⭐`}
                        valB={`${ratingB.toFixed(1)} / 5.0 ⭐`}
                        numA={ratingA}
                        numB={ratingB}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Total Assigned Tasks"
                        valA={`${assignedA} Tasks`}
                        valB={`${assignedB} Tasks`}
                        numA={assignedA}
                        numB={assignedB}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Completed Deliverables"
                        valA={`${completedA} Tasks`}
                        valB={`${completedB} Tasks`}
                        numA={completedA}
                        numB={completedB}
                        higherIsBetter={true}
                      />

                      <ComparisonTableRow
                        label="Late Delivery Delays"
                        valA={`${delayedA} Tasks`}
                        valB={`${delayedB} Tasks`}
                        numA={delayedA}
                        numB={delayedB}
                        higherIsBetter={false}
                      />

                      <ComparisonTableRow
                        label="Rejected Submissions"
                        valA={`${rejectedA} Tasks`}
                        valB={`${rejectedB} Tasks`}
                        numA={rejectedA}
                        numB={rejectedB}
                        higherIsBetter={false}
                      />

                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ──────── Modal Footer ──────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <FiAward className="text-amber-500" />
            <span>Winner indicators are highlighted with green badges and comparison ratios.</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * Comparison Metric Card Component
 */
function ComparisonMetricCard({
  title,
  icon: Icon,
  valA,
  valB,
  winner,
  subtext,
  numA = 0,
  numB = 0
}) {
  const sum = Math.max(0.001, Math.abs(numA) + Math.abs(numB));
  const pctA = Math.round((Math.abs(numA) / sum) * 100);
  const pctB = Math.max(0, 100 - pctA);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <Icon size={16} />
        </div>
      </div>

      {/* Side by Side Values */}
      <div className="grid grid-cols-2 gap-3 items-baseline">
        <div className="border-r border-slate-100 dark:border-slate-700/60 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">A</span>
            {winner === 'A' && (
              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-md">
                WINNER
              </span>
            )}
          </div>
          <div className={`text-xl font-black mt-1 ${winner === 'A' ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-slate-800 dark:text-white font-mono'}`}>
            {valA}
          </div>
        </div>

        <div className="pl-1 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {winner === 'B' && (
              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-md">
                WINNER
              </span>
            )}
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">B</span>
          </div>
          <div className={`text-xl font-black mt-1 ${winner === 'B' ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-slate-800 dark:text-white font-mono'}`}>
            {valB}
          </div>
        </div>
      </div>

      {/* Visual Comparison Ratio Bar */}
      <div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${pctA}%` }}
            className={`h-full transition-all duration-500 ${
              winner === 'A' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          />
          <div
            style={{ width: `${pctB}%` }}
            className={`h-full transition-all duration-500 ${
              winner === 'B' ? 'bg-emerald-500' : 'bg-purple-500'
            }`}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mt-1">
          <span>{pctA}% (A)</span>
          <span>{pctB}% (B)</span>
        </div>
      </div>

      {subtext && (
        <p className="text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          {subtext}
        </p>
      )}
    </div>
  );
}

/**
 * Detailed Comparison Table Row
 */
function ComparisonTableRow({ label, valA, valB, numA, numB, higherIsBetter = true }) {
  const isTie = numA === numB;
  const isAWinner = !isTie && (higherIsBetter ? numA > numB : numA < numB);
  const isBWinner = !isTie && !isAWinner;

  const sum = Math.max(0.001, Math.abs(numA) + Math.abs(numB));
  const pctA = Math.round((Math.abs(numA) / sum) * 100);

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-400">
        {label}
      </td>

      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-black text-sm ${isAWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
            {valA}
          </span>
          {isAWinner && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              Leading
            </span>
          )}
        </div>
      </td>

      <td className="py-3.5 px-4">
        <div className="w-36 mx-auto">
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${pctA}%` }}
              className={`h-full ${isAWinner ? 'bg-emerald-500' : 'bg-blue-500'}`}
            />
            <div
              style={{ width: `${100 - pctA}%` }}
              className={`h-full ${isBWinner ? 'bg-emerald-500' : 'bg-purple-500'}`}
            />
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {isBWinner && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              Leading
            </span>
          )}
          <span className={`font-mono font-black text-sm ${isBWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
            {valB}
          </span>
        </div>
      </td>
    </tr>
  );
}
