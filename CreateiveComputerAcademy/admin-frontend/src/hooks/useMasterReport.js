import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

export const useMasterReport = () => {
  // Filter States
  const now = new Date();
  const [filterType, setFilterType] = useState('this_month'); // 'this_month' | 'last_month' | 'specific_month' | 'all_time' | 'custom'
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Custom Date inputs
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  // Filter, Search, Sort & Expanded rows
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [sortBy, setSortBy] = useState('overall');
  const [expandedStaffId, setExpandedStaffId] = useState(null);

  // Calculate active date range
  const activeDateRange = useMemo(() => {
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const todayStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (filterType === 'this_month') {
      const start = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`;
      return {
        start,
        end: todayStr,
        label: `This Month (${MONTH_NAMES[currentMonthIndex]} ${currentYear})`
      };
    }

    if (filterType === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonthIndex - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthIndex = lastMonthDate.getMonth();
      const lastDayOfLastMonth = new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate();
      const start = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-01`;
      const end = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-${String(lastDayOfLastMonth).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `Last Month (${MONTH_NAMES[lastMonthIndex]} ${lastMonthYear})`
      };
    }

    if (filterType === 'specific_month') {
      const y = parseInt(selectedYear) || currentYear;
      const m = parseInt(selectedMonth);
      const lastDay = new Date(y, m + 1, 0).getDate();
      const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `${MONTH_NAMES[m]} ${y}`
      };
    }

    if (filterType === 'all_time') {
      return {
        start: '2023-01-01',
        end: todayStr,
        label: 'All-Time Cumulative'
      };
    }

    return {
      start: customStart,
      end: customEnd,
      label: `Custom (${customStart} to ${customEnd})`
    };
  }, [filterType, selectedYear, selectedMonth, customStart, customEnd]);

  useEffect(() => {
    setStartDate(activeDateRange.start);
    setEndDate(activeDateRange.end);
  }, [activeDateRange]);

  // Fetch Company Master Report
  const fetchReport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE}api/reports/get_all_staff_report.php`, {
        start_date: startDate,
        end_date: endDate
      });

      if (res.data.status === 'success') {
        setReportData(res.data);
      } else {
        setError(res.data.message || 'Failed to load master report.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  // Departments List
  const departmentOptions = useMemo(() => {
    if (!reportData || !reportData.staff_data) return ['all'];
    const depts = new Set();
    reportData.staff_data.forEach(s => {
      if (s.department_name) depts.add(s.department_name);
    });
    return ['all', ...Array.from(depts)];
  }, [reportData]);

  // Filtered and Sorted Staff List
  const filteredStaff = useMemo(() => {
    if (!reportData || !reportData.staff_data) return [];
    let list = [...reportData.staff_data];

    if (selectedDept !== 'all') {
      list = list.filter(s => s.department_name === selectedDept);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.department_name && s.department_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'overall') {
        if (b.efficiency_score !== a.efficiency_score) return b.efficiency_score - a.efficiency_score;
        if (b.tasks_completed !== a.tasks_completed) return b.tasks_completed - a.tasks_completed;
        const ra = a.avg_rating !== null ? a.avg_rating : 0;
        const rb = b.avg_rating !== null ? b.avg_rating : 0;
        if (rb !== ra) return rb - ra;
        return b.total_worked_seconds - a.total_worked_seconds;
      }
      if (sortBy === 'tasks_completed') return b.tasks_completed - a.tasks_completed;
      if (sortBy === 'quality_stars') return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sortBy === 'attendance_rate') return b.attendance_rate - a.attendance_rate;
      if (sortBy === 'task_worked') return b.task_worked_seconds - a.task_worked_seconds;
      if (sortBy === 'total_worked') return b.total_worked_seconds - a.total_worked_seconds;
      if (sortBy === 'quality') return a.rejection_rate - b.rejection_rate;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [reportData, selectedDept, searchTerm, sortBy]);

  // Top 3 Performers (Staff with actual completed tasks and top scores)
  const topPerformers = useMemo(() => {
    if (!reportData || !reportData.staff_data || reportData.staff_data.length === 0) return [];
    return [...reportData.staff_data]
      .filter(s => s.tasks_completed > 0 && s.efficiency_score > 0)
      .sort((a, b) => {
        if (b.efficiency_score !== a.efficiency_score) return b.efficiency_score - a.efficiency_score;
        if (b.tasks_completed !== a.tasks_completed) return b.tasks_completed - a.tasks_completed;
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      })
      .slice(0, 3);
  }, [reportData]);

  const toggleExpand = (id) => {
    setExpandedStaffId(prev => prev === id ? null : id);
  };

  // ─── Export to Excel (.xls) ────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!reportData || !filteredStaff.length) return;
    const summary = reportData.company_summary;
    const filename = `CCA_Company_Master_Performance_Report_${startDate}_to_${endDate}.xls`;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          .header-title { font-size: 18pt; font-weight: bold; color: #1e3a8a; }
          .sub-title { font-size: 11pt; color: #475569; }
          .kpi-table { margin-bottom: 20px; border-collapse: collapse; width: 100%; }
          .kpi-th { background-color: #0284c7; color: #ffffff; padding: 10px; font-weight: bold; border: 1px solid #0369a1; text-align: center; }
          .kpi-td { background-color: #f0f9ff; padding: 10px; font-weight: bold; font-size: 14pt; color: #0369a1; border: 1px solid #bae6fd; text-align: center; }
          .main-table { border-collapse: collapse; width: 100%; }
          .main-th { background-color: #1e293b; color: #ffffff; padding: 8px 12px; font-weight: bold; border: 1px solid #334155; text-align: left; }
          .main-td { padding: 8px 12px; border: 1px solid #cbd5e1; }
          .badge-green { background-color: #dcfce7; color: #15803d; font-weight: bold; }
          .badge-amber { background-color: #fef3c7; color: #b45309; font-weight: bold; }
          .badge-red { background-color: #fee2e2; color: #b91c1c; font-weight: bold; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <p class="header-title">Creative Computer Academy — Company Master Performance Report</p>
        <p class="sub-title"><strong>Report Period:</strong> ${startDate} to ${endDate} | <strong>Generated:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (UTC+6)</p>
        <br />
        
        <table class="kpi-table">
          <tr>
            <th class="kpi-th">Active Staff</th>
            <th class="kpi-th">Attendance Rate</th>
            <th class="kpi-th">Total Office Hours</th>
            <th class="kpi-th">Tasks Assigned</th>
            <th class="kpi-th">Tasks Completed</th>
            <th class="kpi-th">Task Work Duration</th>
            <th class="kpi-th">Revisions / Rejections</th>
          </tr>
          <tr>
            <td class="kpi-td">${summary.total_employees}</td>
            <td class="kpi-td">${summary.overall_attendance_rate}%</td>
            <td class="kpi-td">${summary.total_worked_formatted}</td>
            <td class="kpi-td">${summary.total_tasks_assigned}</td>
            <td class="kpi-td">${summary.total_tasks_completed}</td>
            <td class="kpi-td">${summary.total_task_worked_formatted}</td>
            <td class="kpi-td">${summary.total_tasks_rejected}</td>
          </tr>
        </table>
        <br />

        <table class="main-table">
          <thead>
            <tr>
              <th class="main-th">#</th>
              <th class="main-th">Employee Name</th>
              <th class="main-th">Department</th>
              <th class="main-th">Designation</th>
              <th class="main-th text-center">Quality Stars</th>
              <th class="main-th text-center">Present</th>
              <th class="main-th text-center">Late</th>
              <th class="main-th text-center">Absent</th>
              <th class="main-th text-center">Attendance %</th>
              <th class="main-th text-center">Office Hours</th>
              <th class="main-th text-center">Tasks Assigned</th>
              <th class="main-th text-center">Tasks Completed</th>
              <th class="main-th text-center">In Review</th>
              <th class="main-th text-center">In Progress</th>
              <th class="main-th text-center">Resubmitted</th>
              <th class="main-th text-center">Rejections</th>
              <th class="main-th text-center">Task Working Time</th>
              <th class="main-th text-center">Completion Rate</th>
              <th class="main-th text-center">Efficiency Score</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.map((s, idx) => `
              <tr>
                <td class="main-td text-center">${idx + 1}</td>
                <td class="main-td"><strong>${s.name}</strong></td>
                <td class="main-td">${s.department_name}</td>
                <td class="main-td">${s.designation}</td>
                <td class="main-td text-center font-bold" style="color:#d97706;">${s.rated_count > 0 ? `⭐ ${s.avg_rating}` : '-'}</td>
                <td class="main-td text-center badge-green">${s.present_days}</td>
                <td class="main-td text-center badge-amber">${s.late_days}</td>
                <td class="main-td text-center badge-red">${s.absent_days}</td>
                <td class="main-td text-center"><strong>${s.attendance_rate}%</strong></td>
                <td class="main-td text-center">${s.total_worked_formatted}</td>
                <td class="main-td text-center">${s.tasks_assigned}</td>
                <td class="main-td text-center badge-green">${s.tasks_completed}</td>
                <td class="main-td text-center">${s.tasks_in_review}</td>
                <td class="main-td text-center">${s.tasks_in_progress}</td>
                <td class="main-td text-center">${s.tasks_resubmitted || 0}</td>
                <td class="main-td text-center ${s.tasks_rejected > 0 ? 'badge-red' : ''}">${s.tasks_rejected}</td>
                <td class="main-td text-center"><strong>${s.task_worked_formatted}</strong></td>
                <td class="main-td text-center"><strong>${s.completion_rate}%</strong></td>
                <td class="main-td text-center"><strong>${s.efficiency_score}%</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─── Export to PDF (Direct Styled Document) ────────────────────────────────
  const handleExportPDF = () => {
    if (!reportData || !filteredStaff.length) return;
    const summary = reportData.company_summary;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCA Company Master Report (${startDate} to ${endDate})</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 11px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0;
            text-align: left;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 4px 0 0 0;
            text-align: left;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            color: #64748b;
            margin: 0 0 4px 0;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 900;
            color: #1e293b;
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #334155;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            color: #334155;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .badge-a { background: #fee2e2; color: #991b1b; padding: 2px 5px; border-radius: 4px; font-weight: 800; font-size: 9px; }
          .badge-tier { background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; border: 1px solid #bfdbfe; }
          .footer {
            margin-top: 14px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">Creative Computer Academy</h1>
            <p class="brand-sub">Company Master Performance & Workforce Attendance Report</p>
          </div>
          <div class="meta-info">
            <p style="margin:0;"><strong>Report Period:</strong> ${startDate} to ${endDate}</p>
            <p style="margin:3px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (UTC+6)</p>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <p class="kpi-label">Active Workforce</p>
            <p class="kpi-val">${summary.total_employees} Employees</p>
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Company Attendance</p>
            <p class="kpi-val" style="color:#059669;">${summary.overall_attendance_rate}%</p>
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Tasks Completed</p>
            <p class="kpi-val" style="color:#4f46e5;">${summary.total_tasks_completed} / ${summary.total_tasks_assigned} (${summary.overall_completion_rate}%)</p>
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Task Work Duration</p>
            <p class="kpi-val" style="color:#7c3aed;">${summary.total_task_worked_formatted}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width:30px;">#</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th class="text-center">Quality Stars</th>
              <th class="text-center">Attendance</th>
              <th class="text-center">Office Duty</th>
              <th class="text-center">Tasks Done</th>
              <th class="text-center">Task Working Time</th>
              <th class="text-center">Rejections</th>
              <th class="text-center">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.map((s, idx) => `
              <tr>
                <td class="text-center font-bold">${idx + 1}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.department_name}</td>
                <td>${s.designation}</td>
                <td class="text-center font-bold" style="color:#d97706;">${s.rated_count > 0 ? `⭐ ${s.avg_rating}` : '-'}</td>
                <td class="text-center">
                  <strong>${s.attendance_rate}%</strong>
                  <span style="font-size:8px; color:#64748b; display:block;">${s.present_days}P / ${s.late_days}L / ${s.absent_days}A</span>
                </td>
                <td class="text-center font-bold">${s.total_worked_formatted}</td>
                <td class="text-center">
                  <strong>${s.tasks_completed} / ${s.tasks_assigned}</strong>
                  <span style="font-size:8px; color:#4f46e5; display:block;">${s.completion_rate}% Done</span>
                </td>
                <td class="text-center font-bold" style="color:#7c3aed;">${s.task_worked_formatted}</td>
                <td class="text-center font-bold ${s.tasks_rejected > 0 ? 'badge-a' : ''}">${s.tasks_rejected}x</td>
                <td class="text-center"><span class="badge-tier">${s.efficiency_score}% (${s.performance_tier})</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Creative Computer Academy Management System • Official Confidential Report</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ─── Export to CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!reportData || !filteredStaff.length) return;
    const headers = ['Employee Name', 'Department', 'Designation', 'Quality Stars', 'Present Days', 'Late Days', 'Absent Days', 'Attendance Rate %', 'Office Hours Worked', 'Tasks Assigned', 'Tasks Completed', 'In Review', 'In Progress', 'Resubmitted', 'Rejections', 'Task Working Time', 'Completion Rate %', 'Efficiency Score'];
    const rows = filteredStaff.map(s => [
      s.name,
      s.department_name,
      s.designation,
      `⭐ ${s.avg_rating || 5.0}`,
      s.present_days,
      s.late_days,
      s.absent_days,
      `${s.attendance_rate}%`,
      s.total_worked_formatted,
      s.tasks_assigned,
      s.tasks_completed,
      s.tasks_in_review,
      s.tasks_in_progress,
      s.tasks_resubmitted || 0,
      s.tasks_rejected,
      s.task_worked_formatted,
      `${s.completion_rate}%`,
      `${s.efficiency_score}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CCA_Company_Master_Performance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    API_BASE,
    MONTH_NAMES,
    AVAILABLE_YEARS,
    filterType,
    setFilterType,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    setLoading,
    reportData,
    setReportData,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    selectedDept,
    setSelectedDept,
    sortBy,
    setSortBy,
    expandedStaffId,
    setExpandedStaffId,
    activeDateRange,
    fetchReport,
    departmentOptions,
    filteredStaff,
    topPerformers,
    toggleExpand,
    handleExportExcel,
    handleExportPDF,
    handleExportCSV
  };
};

export default useMasterReport;
