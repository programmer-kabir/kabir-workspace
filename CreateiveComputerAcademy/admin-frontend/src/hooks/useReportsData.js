import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEARS = [2024, 2025, 2026, 2027, 2028];

export function useReportsData() {
    const [staffList, setStaffList] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const staffParam = searchParams.get('staff');
    const tabParam = searchParams.get('tab') || 'attendance';

    const [selectedStaffId, setSelectedStaffId] = useState(staffParam || '');
    const [activeTab, setActiveTab] = useState(tabParam);
    const now = new Date();
    const [filterType, setFilterType] = useState('this_month');
    const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
    const [customStart, setCustomStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [attReport, setAttReport] = useState(null);
    const [taskReport, setTaskReport] = useState(null);
    const [error, setError] = useState('');
    const [taskViewMode, setTaskViewMode] = useState('cards'); // 'cards' | 'table'
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [taskStatusFilter, setTaskStatusFilter] = useState('all');
    const [selectedTaskModal, setSelectedTaskModal] = useState(null);
    const [modalActiveTab, setModalActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'deliverables' | 'marketplaces' | 'review'
    const [showRawJson, setShowRawJson] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Selected Staff Info
    const selectedStaffInfo = useMemo(() => {
        return staffList.find(s => String(s.id) === String(selectedStaffId)) || null;
    }, [staffList, selectedStaffId]);

    // Dropdown Memoized Options (Individual Staff Only)
    const employeeOptions = useMemo(() => {
        return staffList.map(staff => ({
            value: String(staff.id),
            label: `${staff.name} (${staff.designation || 'Staff'})`,
            name: staff.name,
            designation: staff.designation,
            department_name: staff.department_name,
            profile_picture: staff.profile_picture
        }));
    }, [staffList]);

    // Active Date Range Computation
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
            const y = parseInt(selectedYear, 10) || currentYear;
            const m = parseInt(selectedMonth, 10);
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

    // Helper to extract clean concise snippet from description/JSON
    const getCleanTaskSnippet = (desc) => {
        if (!desc) return 'No description provided.';
        if (typeof desc === 'string' && (desc.trim().startsWith('{') || desc.trim().startsWith('['))) {
            try {
                const parsed = JSON.parse(desc);
                if (parsed.canvas_specifications?.format) {
                    return `Format: ${parsed.canvas_specifications.format}${parsed.canvas_specifications.color_mode ? ` • ${parsed.canvas_specifications.color_mode}` : ''}`;
                }
                if (parsed.brand_name) {
                    return `Brand: ${parsed.brand_name}`;
                }
                if (parsed.task_name || parsed.title) {
                    return parsed.task_name || parsed.title;
                }
                return 'Structured Technical Specifications';
            } catch {
                // fallback
            }
        }
        const stripped = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return stripped.length > 95 ? stripped.substring(0, 95) + '...' : (stripped || 'No description provided.');
    };

    // Helper to safely parse task specifications object
    const parseTaskSpecs = (desc) => {
        if (!desc || typeof desc !== 'string') return null;
        const trimmed = desc.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    };

    // Helper to format date & time nicely in Asia/Dhaka or locale
    const formatDateTime = (dateStr) => {
        if (!dateStr) return null;
        let s = String(dateStr).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            s = `${s} 09:00:00`;
        }
        const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
        if (isNaN(d.getTime())) {
            const fallbackD = new Date(s);
            if (isNaN(fallbackD.getTime())) return dateStr;
            return fallbackD.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Helper to format duration in seconds into friendly string
    const formatDurationSeconds = (totalSeconds) => {
        if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return null;
        const sec = Math.max(0, Math.round(totalSeconds));
        if (sec < 60) return `${sec}s`;
        const minutes = Math.floor(sec / 60);
        if (minutes < 60) {
            const remainingSec = sec % 60;
            return remainingSec > 0 ? `${minutes}m ${remainingSec}s` : `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMin = minutes % 60;
        if (hours < 24) {
            return remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}h`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    // Helper to compute duration between two timestamps
    const formatDurationBetween = (startDateStr, endDateStr) => {
        if (!startDateStr || !endDateStr) return null;
        let sStr = String(startDateStr).trim();
        let eStr = String(endDateStr).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(sStr)) sStr = `${sStr} 09:00:00`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) eStr = `${eStr} 09:00:00`;

        const s = new Date(sStr.includes('T') ? sStr : sStr.replace(' ', 'T')).getTime();
        const e = new Date(eStr.includes('T') ? eStr : eStr.replace(' ', 'T')).getTime();
        if (isNaN(s) || isNaN(e) || e < s) return null;
        return formatDurationSeconds((e - s) / 1000);
    };

    // Memoized Filtered Tasks
    const filteredTasks = useMemo(() => {
        if (!taskReport?.tasks) return [];
        return taskReport.tasks.filter((task) => {
            const q = taskSearchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (task.title && task.title.toLowerCase().includes(q)) ||
                (task.category && task.category.toLowerCase().includes(q));

            const matchesStatus = taskStatusFilter === 'all' ||
                (taskStatusFilter === 'delayed' ? task.was_delayed :
                    taskStatusFilter === 'resubmitted' ? task.was_resubmitted :
                        taskStatusFilter === 'has_link' ? Boolean(task.submission_link) :
                            task.status?.toLowerCase() === taskStatusFilter.toLowerCase());

            return matchesSearch && matchesStatus;
        });
    }, [taskReport, taskSearchQuery, taskStatusFilter]);

    // 1. Sync Active Date Range to Start & End Dates
    useEffect(() => {
        if (activeDateRange?.start && activeDateRange?.end) {
            setStartDate(activeDateRange.start);
            setEndDate(activeDateRange.end);
        }
    }, [activeDateRange]);

    // 2. Fetch Staff List
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await axios.get(`${API_BASE}api/admin/staff/get_all_staff.php`);
                if (res.data.status === 'success') {
                    setStaffList(res.data.data);
                    if (res.data.data.length > 0 && (!selectedStaffId || selectedStaffId === 'all')) {
                        setSelectedStaffId(String(res.data.data[0].id));
                    }
                } else {
                    setError(res.data.message || 'Failed to load staff list.');
                }
            } catch (err) {
                console.error(err);
                setError('Error connecting to backend API.');
            }
        };
        fetchStaff();
    }, []);

    // Sync search param staff ID
    useEffect(() => {
        const staff = searchParams.get('staff');
        if (staff && staff !== 'all' && staff !== selectedStaffId) {
            setSelectedStaffId(staff);
        }
    }, [searchParams]);

    // 3. Fetch Reports Data
    const fetchReports = async () => {
        if (!selectedStaffId || !startDate || !endDate) return;
        setLoading(true);
        setError('');

        try {
            const [attRes, taskRes] = await Promise.all([
                axios.post(`${API_BASE}api/reports/get_attendance_report.php`, {
                    user_id: selectedStaffId,
                    start_date: startDate,
                    end_date: endDate
                }),
                axios.post(`${API_BASE}api/reports/get_task_report.php`, {
                    user_id: selectedStaffId,
                    start_date: startDate,
                    end_date: endDate
                })
            ]);

            if (attRes.data.status === 'success') {
                const data = attRes.data;
                let totalExpectedSeconds = 0;
                let totalWorkedSeconds = 0;
                let absentDays = 0;

                if (data.history && Array.isArray(data.history)) {
                    data.history.forEach((day) => {
                        if (day.expected_hours) {
                            const expMatch = day.expected_hours.match(/(\d+)h\s*(\d+)m/);
                            if (expMatch) {
                                totalExpectedSeconds += (parseInt(expMatch[1], 10) * 3600) + (parseInt(expMatch[2], 10) * 60);
                            }
                        }
                        if (day.total_hours) {
                            const wrkMatch = day.total_hours.match(/(\d+)h\s*(\d+)m/);
                            if (wrkMatch) {
                                totalWorkedSeconds += (parseInt(wrkMatch[1], 10) * 3600) + (parseInt(wrkMatch[2], 10) * 60);
                            }
                        }
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

                if (!data.summary.total_expected) data.summary.total_expected = formatSecs(totalExpectedSeconds);
                if (!data.summary.total_worked) data.summary.total_worked = formatSecs(totalWorkedSeconds);
                if (!data.summary.absent || data.summary.absent === 0) data.summary.absent = absentDays;

                setAttReport(data);
            } else {
                setAttReport(null);
            }

            if (taskRes.data.status === 'success') {
                setTaskReport(taskRes.data);
            } else {
                setTaskReport(null);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch reports. Please verify your backend server connection.');
        } finally {
            setLoading(false);
        }
    };

    // Auto trigger fetchReports when staff or dates change
    useEffect(() => {
        if (selectedStaffId && startDate && endDate) {
            fetchReports();
        }
    }, [selectedStaffId, startDate, endDate]);

    return {
        staffList,
        selectedStaffId,
        setSelectedStaffId,
        selectedStaffInfo,
        activeTab,
        setActiveTab,
        searchParams,
        setSearchParams,
        API_BASE,
        setStaffList,
        now,
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
        attReport,
        setAttReport,
        taskReport,
        setTaskReport,
        error,
        setError,
        taskViewMode,
        setTaskViewMode,
        taskSearchQuery,
        setTaskSearchQuery,
        taskStatusFilter,
        setTaskStatusFilter,
        selectedTaskModal,
        setSelectedTaskModal,
        modalActiveTab,
        setModalActiveTab,
        showRawJson,
        setShowRawJson,
        copiedJson,
        setCopiedJson,
        lightboxImage,
        setLightboxImage,
        getCleanTaskSnippet,
        parseTaskSpecs,
        formatDateTime,
        formatDurationSeconds,
        formatDurationBetween,
        filteredTasks,
        employeeOptions,
        activeDateRange,
        fetchReports,
        MONTH_NAMES,
        YEARS
    };
}
