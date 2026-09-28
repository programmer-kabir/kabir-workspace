import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import JSZip from 'jszip';
import {
  FiCalendar, FiSearch, FiFilter, FiCheckCircle, FiClock,
  FiFileText, FiStar, FiDownload, FiExternalLink, FiEye,
  FiAlertCircle, FiChevronLeft, FiChevronRight, FiAward,
  FiUser, FiCheck, FiX, FiRefreshCw, FiImage, FiFolder, FiPackage
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const R2_PUBLIC_URL = 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';

export const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('uploads/')) {
    const base = (API_BASE || '').replace(/\/+$/, '');
    return `${base}/${url.replace(/^\/+/, '')}`;
  }
  return `${R2_PUBLIC_URL}/${url.replace(/^\/+/, '')}`;
};

// Helper to get Bangladesh date YYYY-MM-DD
const getTodayDhakaDate = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const StudentDailyLogs = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDhakaDate());
  const [logsData, setLogsData] = useState({ summary: {}, logs: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, submitted, reviewed, missing
  
  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [bonusCredits, setBonusCredits] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchLogs = async (date = selectedDate) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/student_logs/get_all_student_logs.php`, {
        params: { date }
      });
      if (res.data.status === 'success') {
        const rawSummary = res.data.data?.summary || res.data.summary || {};
        const rawStudents = res.data.data?.students || res.data.students || res.data.data?.logs || res.data.logs || [];
        
        const normalizedLogs = rawStudents.map(s => {
          const log = s.log || (s.log_id ? s : null);
          const status = s.status || s.log_status || (log ? (log.instructor_rating ? 'reviewed' : 'submitted') : 'missing');
          const logStatus = status === 'pending_review' ? 'submitted' : status;

          return {
            ...s,
            log_id: log?.id || s.log_id || null,
            log_status: logStatus, // 'submitted' | 'reviewed' | 'missing'
            topic: log?.topic_title || s.topic || '',
            summary: log?.summary || s.summary || '',
            challenges: log?.challenges_faced || s.challenges || '',
            practice_hours: log?.practice_hours ?? s.practice_hours ?? 0,
            files: log?.files || s.files || [],
            rating: log?.instructor_rating || s.rating || 0,
            feedback: log?.instructor_feedback || s.feedback || '',
            credits_awarded: log?.credits_earned ?? s.credits_awarded ?? 0,
            reviewer_name: log?.reviewed_by_name || s.reviewer_name || '',
            reviewed_at: log?.reviewed_at || s.reviewed_at || '',
            submitted_at: log?.created_at || s.submitted_at || s.created_at || '',
            attendance: s.attendance || {}
          };
        });

        setLogsData({
          summary: {
            total_students: rawSummary.total_students ?? normalizedLogs.length,
            submitted_count: rawSummary.submitted ?? rawSummary.submitted_count ?? 0,
            pending_review_count: rawSummary.pending_review ?? rawSummary.pending_review_count ?? 0,
            reviewed_count: rawSummary.reviewed ?? rawSummary.reviewed_count ?? 0,
            missing_count: rawSummary.missing ?? rawSummary.missing_count ?? 0
          },
          logs: normalizedLogs
        });
      } else {
        toast.error(res.data.message || 'Failed to fetch student logs');
      }
    } catch (err) {
      toast.error('Network error loading student logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate]);

  // Real-time Pusher listener
  useEffect(() => {
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe('admin-channel');
    channel.bind('student-daily-log-submitted', (data) => {
      toast.info(`New Log: ${data.student_name}`, {
        description: `Topic: ${data.topic}`
      });
      fetchLogs(selectedDate);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [selectedDate]);

  // Date Navigation
  const changeDateBy = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const isToday = selectedDate === getTodayDhakaDate();

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return (logsData.logs || []).filter(item => {
      // Search
      const matchSearch = 
        item.student_name.toLowerCase().includes(search.toLowerCase()) ||
        item.student_code.toLowerCase().includes(search.toLowerCase()) ||
        (item.topic && item.topic.toLowerCase().includes(search.toLowerCase())) ||
        (item.course_name && item.course_name.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      // Status Filter
      if (statusFilter === 'submitted') {
        return item.log_status === 'submitted';
      }
      if (statusFilter === 'reviewed') {
        return item.log_status === 'reviewed';
      }
      if (statusFilter === 'missing') {
        return item.log_status === 'missing';
      }
      return true;
    });
  }, [logsData.logs, search, statusFilter]);

  // Open Review Modal
  const handleOpenReview = (item) => {
    setSelectedLog(item);
    setRating(item.rating || 5);
    setFeedback(item.feedback || '');
    setBonusCredits(item.credits_awarded || 5);
    setReviewModalOpen(true);
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedLog || !selectedLog.log_id) {
      toast.error('Cannot review a missing submission');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/student_logs/review_student_log.php`, {
        log_id: selectedLog.log_id,
        rating: Number(rating),
        feedback: feedback.trim(),
        bonus_credits: Number(bonusCredits),
        admin_id: currentUser?.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Review & grading submitted!');
        setReviewModalOpen(false);
        fetchLogs(selectedDate);
      } else {
        toast.error(res.data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const [downloadingZip, setDownloadingZip] = useState(false);

  // 1-Click ZIP Downloader for all deliverables
  const handleDownloadAllZip = async (item) => {
    if (!item) return;
    const files = item.files || [];
    if (!files.length) {
      toast.info('No deliverables or files attached to this submission.');
      return;
    }

    setDownloadingZip(true);
    const toastId = toast.loading(`Packing ZIP for ${item.student_name}...`);

    try {
      const zip = new JSZip();

      // Add summary info text file
      const infoContent = `=====================================================
CREATIVE COMPUTER ACADEMY (CCA)
STUDENT DAILY WORK LOG & DELIVERABLES ARCHIVE
=====================================================
Student Name  : ${item.student_name || 'N/A'}
Student Code  : ${item.student_code || 'N/A'}
Date          : ${selectedDate}
Course / Lab  : ${item.course_name || 'Design / Practice Lab'}
Topic Title   : ${item.topic || 'N/A'}
Practice Time : ${item.practice_hours || 0} Hours
Submission At : ${item.submitted_at || 'Today'}

-----------------------------------------------------
PRACTICE SUMMARY:
${item.summary || 'N/A'}

-----------------------------------------------------
CHALLENGES / SOLUTIONS:
${item.challenges || 'None reported.'}

-----------------------------------------------------
EVALUATION / REVIEW:
Rating        : ${item.rating ? `${item.rating} / 5 Stars` : 'Pending Review'}
Bonus Credits : +${item.credits_awarded || 0} Credits
Feedback      : ${item.feedback || 'No feedback yet.'}
Reviewed By   : ${item.reviewer_name || 'Instructor'}
=====================================================
`;
      zip.file('submission_summary.txt', infoContent);

      const filesFolder = zip.folder('deliverables');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawUrl = file.file_url || file.url;
        const fileUrl = getFileUrl(rawUrl);
        const fileName = file.file_name || file.name || `deliverable_${i + 1}`;

        try {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          filesFolder.file(fileName, blob);
        } catch (fetchErr) {
          console.warn(`Could not add ${fileName} to zip directly, triggering fallback download:`, fetchErr);
          // Fallback direct browser download
          const a = document.createElement('a');
          a.href = fileUrl;
          a.download = fileName;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const cleanCode = (item.student_code || 'STU').replace(/[^A-Za-z0-9_-]/g, '_');
      const cleanName = (item.student_name || 'student').replace(/[^A-Za-z0-9_-]/g, '_');
      const zipFileName = `${cleanCode}_${cleanName}_${selectedDate}_deliverables.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`🎉 Downloaded all deliverables for ${item.student_name}!`, { id: toastId });
    } catch (err) {
      console.error('ZIP Error:', err);
      toast.error('Failed to create ZIP package.', { id: toastId });
    } finally {
      setDownloadingZip(false);
    }
  };

  // 1-Click Direct Single File Downloader (CORS & Cross-Origin Safe)
  const handleDownloadSingleFile = async (e, rawUrl, fileName) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const fileUrl = getFileUrl(rawUrl);
    if (!fileUrl) return;

    const safeName = fileName || 'download';
    const toastId = toast.loading(`Downloading ${safeName}...`);

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${safeName}!`, { id: toastId });
    } catch (err) {
      console.warn('Direct blob download failed, attempting browser download fallback:', err);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.dismiss(toastId);
    }
  };

  const quickFeedbacks = [
    'Great practice work! Keep it up! 🌟',
    'Good effort, work on alignment & spacing.',
    'Excellent pen tool curve precision! 👏',
    'Outstanding creativity and visual harmony! 🏆',
    'Need more details in daily summary.'
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <FiFileText size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Student Daily Work Logs & Review
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Monitor daily offline practice submissions, evaluate deliverables, and award bonus credits.
              </p>
            </div>
          </div>
        </div>

        {/* Date Controller */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => changeDateBy(-1)}
            className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
            title="Previous Day"
          >
            <FiChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-2">
            <FiCalendar className="text-indigo-500" size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-black text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => changeDateBy(1)}
            disabled={isToday}
            className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-800 shadow-xs'}`}
            title="Next Day"
          >
            <FiChevronRight size={18} />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayDhakaDate())}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm"
            >
              Today
            </button>
          )}

          <button
            onClick={() => fetchLogs(selectedDate)}
            className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Data"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin text-indigo-500' : ''} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Active Students</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FiUser size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {logsData.summary?.total_students || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Submitted Today</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <FiCheckCircle size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {logsData.summary?.submitted_count || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <FiClock size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {logsData.summary?.pending_review_count || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Reviewed / Graded</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <FiAward size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {logsData.summary?.reviewed_count || 0}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search student or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Students' },
            { id: 'submitted', label: 'Pending Review' },
            { id: 'reviewed', label: 'Reviewed' },
            { id: 'missing', label: 'Missing' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Student Submissions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-slate-500">Loading daily submissions...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center p-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
            <FiFileText size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No logs found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {search || statusFilter !== 'all' 
              ? 'No student matches your search or filter criteria.' 
              : `No practice submissions recorded for ${selectedDate}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map((item) => {
            const isMissing = item.log_status === 'missing';
            const isReviewed = item.log_status === 'reviewed';
            const isSubmitted = item.log_status === 'submitted';

            return (
              <div
                key={item.student_id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border transition-all ${
                  isSubmitted
                    ? 'border-indigo-300 dark:border-indigo-700/60 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                    : isReviewed
                    ? 'border-purple-200 dark:border-purple-900/40'
                    : 'border-slate-200 dark:border-slate-700/80 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Student Info & Attendance */}
                  <div className="flex items-start gap-3.5 min-w-[260px]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0 overflow-hidden">
                      {item.profile_picture ? (
                        <img src={`${API_BASE}${item.profile_picture}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        item.student_name?.charAt(0)?.toUpperCase() || 'S'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {item.student_name}
                        </h3>
                        {isSubmitted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 animate-pulse">
                            Needs Review
                          </span>
                        )}
                        {isReviewed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <FiCheck size={11} /> Graded
                          </span>
                        )}
                        {isMissing && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500">
                            Missing
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Code: <span className="font-bold text-slate-600 dark:text-slate-300">{item.student_code}</span> • {item.course_name || 'Graphic Design'}
                      </p>

                      {/* Attendance Badge */}
                      <div className="mt-2 flex items-center gap-2">
                        {item.attendance?.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <FiCheckCircle size={12} /> Present ({item.attendance.check_in_time || 'Present'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            <FiClock size={12} /> Attendance Not Logged
                          </span>
                        )}

                        {item.practice_hours > 0 && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            ⚡ {item.practice_hours} hrs practiced
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission Content */}
                  <div className="flex-1 min-w-0">
                    {isMissing ? (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3 text-slate-400">
                        <FiAlertCircle size={18} />
                        <span className="text-xs font-medium">Student has not submitted their work log for this date yet.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              Topic: {item.topic}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Logged at: {item.submitted_at || item.created_at}
                            </span>
                          </div>
                          
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                            {item.summary}
                          </p>

                          {item.challenges && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                              <span className="font-bold text-amber-600 dark:text-amber-400">Challenges / Solutions: </span>
                              <span className="text-slate-600 dark:text-slate-300">{item.challenges}</span>
                            </div>
                          )}
                        </div>

                        {/* Uploaded Files Gallery */}
                        {item.files && item.files.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FiFolder size={13} /> Deliverables & Source Files ({item.files.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDownloadAllZip(item)}
                                disabled={downloadingZip}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                                title="Download all deliverables as a ZIP package"
                              >
                                <FiDownload size={12} />
                                <span>Download All (ZIP)</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                              {item.files.map((file, fIdx) => {
                                const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(
                                  (file.file_name || '').split('.').pop().toLowerCase()
                                );

                                return (
                                  <div
                                    key={fIdx}
                                    className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                  >
                                    {isImg ? (
                                      <div
                                        onClick={() => setLightboxImage(getFileUrl(file.file_url || file.url))}
                                        className="h-20 w-full bg-slate-100 dark:bg-slate-900 cursor-pointer overflow-hidden relative flex items-center justify-center"
                                      >
                                        <img
                                          src={getFileUrl(file.file_url || file.url)}
                                          alt={file.file_name || file.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <FiEye size={18} />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-20 w-full bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-2 text-indigo-500">
                                        <FiFileText size={24} />
                                        <span className="text-[10px] font-black uppercase mt-1 text-slate-600 dark:text-slate-300">
                                          {(file.file_name || file.name || '').split('.').pop()}
                                        </span>
                                      </div>
                                    )}

                                    <div className="p-1.5 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800">
                                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate" title={file.file_name || file.name}>
                                        {file.file_name || file.name}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDownloadSingleFile(e, file.file_url || file.url, file.file_name || file.name)}
                                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded transition-colors cursor-pointer"
                                        title="Download this file"
                                      >
                                        <FiDownload size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Existing Review & Feedback Box */}
                        {isReviewed && (
                          <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="flex text-amber-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <FiStar
                                      key={s}
                                      size={14}
                                      className={s <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                                  {item.rating}/5 Stars
                                </span>
                                {item.credits_awarded > 0 && (
                                  <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                    +{item.credits_awarded} Credits
                                  </span>
                                )}
                              </div>
                              {item.feedback && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                  "{item.feedback}"
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                Reviewed by: {item.reviewer_name || 'Instructor'} • {item.reviewed_at}
                              </p>
                            </div>

                            <button
                              onClick={() => handleOpenReview(item)}
                              className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 hover:bg-purple-50 transition-colors shadow-xs"
                            >
                              Edit Review
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0">
                    {item.files && item.files.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDownloadAllZip(item)}
                        disabled={downloadingZip}
                        className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Download all submitted deliverables as ZIP"
                      >
                        <FiDownload size={13} />
                        <span>Download Files ({item.files.length})</span>
                      </button>
                    )}

                    {!isMissing && (
                      <button
                        onClick={() => handleOpenReview(item)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isSubmitted
                            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-90 shadow-indigo-500/25 scale-[1.02]'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <FiStar size={14} />
                        {isSubmitted ? 'Grade & Reward' : 'Update Grade'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review / Evaluation Modal */}
      {reviewModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                  <FiAward size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Grade & Review Practice Work
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedLog.student_name} ({selectedLog.student_code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {/* Attached Deliverables Box in Modal with 1-Click ZIP Download */}
              {selectedLog.files && selectedLog.files.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <FiPackage className="text-indigo-500" size={15} />
                      <span>Deliverables ({selectedLog.files.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadAllZip(selectedLog)}
                      disabled={downloadingZip}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <FiDownload size={13} />
                      <span>{downloadingZip ? 'Packing...' : 'Download All (.ZIP)'}</span>
                    </button>
                  </div>

                  {/* Mini Thumbnails / File Badges */}
                  <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto">
                    {selectedLog.files.map((file, fIdx) => {
                      const fileName = file.file_name || file.name || 'file';
                      const fileUrl = getFileUrl(file.file_url || file.url);
                      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileName.split('.').pop()?.toLowerCase());

                      return (
                        <div
                          key={fIdx}
                          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-2xs text-xs"
                        >
                          {isImg ? (
                            <img
                              src={fileUrl}
                              alt=""
                              onClick={() => setLightboxImage(fileUrl)}
                              className="w-7 h-7 rounded-lg object-cover cursor-pointer hover:opacity-80 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 text-[10px] font-black uppercase shrink-0">
                              {fileName.split('.').pop()}
                            </div>
                          )}
                          <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={fileName}>
                            {fileName}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadSingleFile(e, file.file_url || file.url, file.file_name || file.name)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 shrink-0 cursor-pointer rounded transition-colors"
                            title="Download this file"
                          >
                            <FiDownload size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <FiStar
                        size={28}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-black text-amber-500 ml-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Bonus Credits */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Bonus Gamified Credits
                  </label>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    +{bonusCredits} Credits
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBonusCredits(val)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        bonusCredits === val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Instructor Feedback & Comments
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share constructive feedback on their design / code practice..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />

                {/* Quick Feedback Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickFeedbacks.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedback(q)}
                      className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 rounded-lg transition-colors text-left truncate max-w-full"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheck size={14} /> Submit Evaluation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleDownloadSingleFile(e, lightboxImage, 'full_image_preview.png')}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
                title="Download full size"
              >
                <FiDownload size={18} />
              </button>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDailyLogs;
