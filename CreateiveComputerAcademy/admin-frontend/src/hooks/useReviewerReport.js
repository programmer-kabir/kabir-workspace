import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEARS = [2024, 2025, 2026, 2027, 2028];

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

export const useReviewerReport = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewerReport, setReviewerReport] = useState(null);
  const [error, setError] = useState('');

  // Main Page Tabs: Review Analytics vs Marketplace Uploads
  const [activeMainTab, setActiveMainTab] = useState('analytics'); // 'analytics' | 'marketplaces'

  // Date Filters State
  const now = new Date();
  const [filterType, setFilterType] = useState('this_month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [customStart, setCustomStart] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState(now.toISOString().split('T')[0]);

  // Marketplace Tab Local Search & Filters
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketStatusFilter, setMarketStatusFilter] = useState('all');
  const [marketPlatformFilter, setMarketPlatformFilter] = useState('all');
  const [marketViewMode, setMarketViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedMarketModal, setSelectedMarketModal] = useState(null);

  // Memoized Reviewer Options
  const reviewerOptions = useMemo(() => {
    return staffList.map(staff => ({
      value: String(staff.id),
      label: `${staff.name} (${staff.designation || 'Reviewer'})`,
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

  // 1. Fetch Reviewers List on mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/admin/reviewer/get_all_reviewers.php`);
        if (res.data.status === 'success') {
          setStaffList(res.data.data);
          const reviewers = res.data.data;
          if (reviewers.length > 0 && !selectedStaffId) {
            setSelectedStaffId(String(reviewers[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff list', err);
      }
    };
    fetchStaff();
  }, []);

  // 2. Fetch Reviewer Report Analytics
  const fetchReport = async () => {
    if (!selectedStaffId || !startDate || !endDate) {
      setError('Please select a reviewer and a valid date range.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const revRes = await axios.post(`${API_BASE}api/reports/get_reviewer_micro_analytics.php`, {
        reviewer_user_id: selectedStaffId,
        start_date: startDate,
        end_date: endDate
      });

      if (revRes && revRes.data.status === 'success') {
        setReviewerReport(revRes.data);
      } else {
        setReviewerReport(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStaffId && startDate && endDate) {
      fetchReport();
    }
  }, [selectedStaffId, startDate, endDate]);

  // Lock background scroll when details modal is open
  useEffect(() => {
    if (selectedMarketModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMarketModal]);

  // Filtered Marketplace List
  const filteredMarketplaces = useMemo(() => {
    if (!reviewerReport || !reviewerReport.marketplaces) return [];
    return reviewerReport.marketplaces.filter(item => {
      const q = marketSearchQuery.toLowerCase().trim();
      const marketName = item.marketplace === 'Custom' ? (item.custom_market || 'Custom') : item.marketplace;
      const matchesSearch = !q ||
        (item.task_title && item.task_title.toLowerCase().includes(q)) ||
        (item.staff_name && item.staff_name.toLowerCase().includes(q)) ||
        (marketName && marketName.toLowerCase().includes(q)) ||
        (item.approval_url && item.approval_url.toLowerCase().includes(q));

      const statusLower = (item.status || 'pending').toLowerCase();
      const matchesStatus = marketStatusFilter === 'all' ||
        (marketStatusFilter === 'live' ? ['live', 'approved'].includes(statusLower) :
         marketStatusFilter === 'review' ? ['under review', 'submitted', 'uploaded', 'pending', 'in review'].includes(statusLower) :
         marketStatusFilter === 'rejected' ? statusLower === 'rejected' :
         statusLower === marketStatusFilter.toLowerCase());

      const matchesPlatform = marketPlatformFilter === 'all' ||
        (item.marketplace === marketPlatformFilter || item.custom_market === marketPlatformFilter);

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [reviewerReport, marketSearchQuery, marketStatusFilter, marketPlatformFilter]);

  // Export CSV
  const handleExport = () => {
    if (!reviewerReport) return;

    const selectedStaffInfo = staffList.find(s => String(s.id) === String(selectedStaffId)) || { name: 'Reviewer' };

    const downloadCSV = (filename, csvData) => {
      const csvString = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (activeMainTab === 'marketplaces' && reviewerReport.marketplaces && reviewerReport.marketplaces.length > 0) {
      const headers = ['Task Title', 'Designer / Staff', 'Marketplace', 'Status', 'Submitted Date', 'Approved / Live Link', 'Deliverable Link'];
      const rows = reviewerReport.marketplaces.map(m => [
        `"${m.task_title || '-'}"`,
        `"${m.staff_name || '-'}"`,
        `"${m.marketplace === 'Custom' ? (m.custom_market || 'Custom') : m.marketplace}"`,
        `"${m.status || 'Pending'}"`,
        `"${m.submitted_date || m.created_at || '-'}"`,
        `"${m.approval_url || '-'}"`,
        `"${m.submission_link || '-'}"`
      ]);
      downloadCSV(`${selectedStaffInfo.name}_marketplace_distributions_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
    } else if (reviewerReport.history && reviewerReport.history.length > 0) {
      const headers = ['Task', 'Staff Name', 'Priority', 'Status', 'Submitted At', 'Reviewed At', 'Review Time'];
      const rows = reviewerReport.history.map(r => [
        `"${r.title}"`,
        `"${r.staff_name}"`,
        `"${r.priority || '-'}"`,
        `"${r.status}"`,
        `"${r.submitted_at || '-'}"`,
        `"${r.reviewed_at || '-'}"`,
        `"${r.review_time || '-'}"`
      ]);
      downloadCSV(`${selectedStaffInfo.name}_reviewer_analytics_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
    }
  };

  const selectedStaffInfo = useMemo(() => {
    return staffList.find(s => String(s.id) === String(selectedStaffId));
  }, [staffList, selectedStaffId]);

  const totalReviewed = reviewerReport?.summary?.total_reviewed || 0;
  const approvedRate = totalReviewed > 0 ? Math.round((reviewerReport.summary.total_approved / totalReviewed) * 100) : 0;
  const rejectedRate = totalReviewed > 0 ? Math.round((reviewerReport.summary.total_rejected / totalReviewed) * 100) : 0;

  const slaTotal = (reviewerReport?.summary?.sla_met || 0) + (reviewerReport?.summary?.sla_breached || 0);
  const slaRate = slaTotal > 0 ? Math.round(((reviewerReport.summary.sla_met || 0) / slaTotal) * 100) : 100;

  const mSummary = reviewerReport?.marketplace_summary || { total_uploads: 0, live: 0, under_review: 0, rejected: 0, platforms: {} };

  return {
    API_BASE,
    MONTH_NAMES,
    YEARS,
    staffList,
    setStaffList,
    selectedStaffId,
    setSelectedStaffId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    setLoading,
    reviewerReport,
    setReviewerReport,
    error,
    setError,
    activeMainTab,
    setActiveMainTab,
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
    marketSearchQuery,
    setMarketSearchQuery,
    marketStatusFilter,
    setMarketStatusFilter,
    marketPlatformFilter,
    setMarketPlatformFilter,
    marketViewMode,
    setMarketViewMode,
    selectedMarketModal,
    setSelectedMarketModal,
    reviewerOptions,
    activeDateRange,
    fetchReport,
    filteredMarketplaces,
    handleExport,
    selectedStaffInfo,
    totalReviewed,
    approvedRate,
    rejectedRate,
    slaTotal,
    slaRate,
    mSummary
  };
};
