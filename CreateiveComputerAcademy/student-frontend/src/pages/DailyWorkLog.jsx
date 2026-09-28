import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import { useAuth } from '../context/AuthContext';
import {
  FiBookOpen, FiUploadCloud, FiCheckCircle, FiClock, FiStar,
  FiFileText, FiImage, FiFolder, FiTrash2, FiAward, FiAlertCircle,
  FiSend, FiCalendar, FiChevronRight, FiDownload, FiEye, FiX, FiRefreshCw,
  FiEdit2, FiZap, FiHelpCircle
} from 'react-icons/fi';
import confetti from 'canvas-confetti';

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

const DailyWorkLog = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || currentUser?.user_id;

  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'history'
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const [date, setDate] = useState(todayStr);
  const [topicTitle, setTopicTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [practiceHours, setPracticeHours] = useState(4);
  const [files, setFiles] = useState([]); // [{ name, url, size, type, ext, progress, uploading }]
  const fileInputRef = useRef(null);

  // Stats & History
  const [stats, setStats] = useState({
    total_logs: 0,
    total_credits: 0,
    total_hours: 0,
    average_rating: 0,
    rated_logs: 0
  });
  const [historyLogs, setHistoryLogs] = useState([]);
  const [todaySubmission, setTodaySubmission] = useState(null);
  const [selectedPreviewImg, setSelectedPreviewImg] = useState(null);

  const fetchHistory = async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/student/daily_logs/get_my_logs.php?user_id=${userId}`);
      if (res.data && res.data.status === 'success') {
        setStats(res.data.data.stats || {});
        const logs = res.data.data.logs || [];
        setHistoryLogs(logs);

        // Track today's submission
        const todaysEntry = logs.find(l => l.date === todayStr);
        setTodaySubmission(todaysEntry || null);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditSubmission = (entry) => {
    if (!entry) return;
    setDate(entry.date || todayStr);
    setTopicTitle(entry.topic_title || '');
    setSummary(entry.summary || '');
    setChallengesFaced(entry.challenges_faced || '');
    setPracticeHours(entry.practice_hours || 4);
    setFiles(entry.files || []);
    setActiveTab('submit');
    toast.success('Loaded submission into form for editing.');
  };

  const handleResetForm = () => {
    setTopicTitle('');
    setSummary('');
    setChallengesFaced('');
    setPracticeHours(4);
    setFiles([]);
    setDate(todayStr);
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  // Real-time Pusher listener for instructor grading & reviews
  useEffect(() => {
    if (!userId) return;

    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const userChannel = pusher.subscribe(`user-${userId}`);
    const legacyChannel = pusher.subscribe(`user-channel-${userId}`);

    const handleReviewEvent = (data) => {
      const stars = data.rating ? '⭐'.repeat(data.rating) : '⭐⭐⭐⭐⭐';
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      toast.success(`🎉 Your practice log was reviewed! ${stars}`, {
        description: data.credits_awarded > 0 ? `+${data.credits_awarded} bonus credits awarded!` : data.feedback || 'Great work!'
      });
      fetchHistory();
    };

    userChannel.bind('daily-log-reviewed', handleReviewEvent);
    legacyChannel.bind('daily-log-reviewed', handleReviewEvent);

    return () => {
      userChannel.unbind_all();
      legacyChannel.unbind_all();
      pusher.unsubscribe(`user-${userId}`);
      pusher.unsubscribe(`user-channel-${userId}`);
    };
  }, [userId]);

  // 1-Click Direct Single File Downloader (CORS Safe)
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

  // Handle File Selection & Direct Server-Side R2 Upload
  const handleFilesSelected = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    for (const file of selectedFiles) {
      const tempId = Date.now() + Math.random().toString(36).substring(2, 7);
      const ext = file.name.split('.').pop().toLowerCase();
      const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

      // Local placeholder with uploading state
      const placeholder = {
        id: tempId,
        name: file.name,
        size: (file.size / (1024 * 1024) < 1) ? Math.round(file.size / 1024) + ' KB' : (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        ext: ext,
        type: isImg ? 'preview' : 'source',
        progress: 0,
        uploading: true,
        localUrl: isImg ? URL.createObjectURL(file) : null
      };

      setFiles(prev => [...prev, placeholder]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        formData.append('date', date);

        const uploadRes = await axios.post(`${API_BASE}api/student/daily_logs/upload_daily_log_file.php`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setFiles(current => current.map(f => f.id === tempId ? { ...f, progress: percent } : f));
          }
        });

        if (uploadRes.data && uploadRes.data.status === 'success' && uploadRes.data.file) {
          const uploadedFile = uploadRes.data.file;

          setFiles(current => current.map(f => f.id === tempId ? {
            ...f,
            uploading: false,
            progress: 100,
            url: uploadedFile.url,
            key: uploadedFile.key
          } : f));
        } else {
          throw new Error(uploadRes.data?.message || 'Upload failed');
        }
      } catch (err) {
        console.error('File upload error:', err);
        toast.error(`Failed to upload ${file.name}: ${err.response?.data?.message || err.message}`);
        setFiles(current => current.filter(f => f.id !== tempId));
      }
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicTitle.trim()) {
      toast.error('Please enter today\'s topic or class title.');
      return;
    }
    if (!summary.trim()) {
      toast.error('Please write a brief summary of what you practiced today.');
      return;
    }

    const stillUploading = files.some(f => f.uploading);
    if (stillUploading) {
      toast.error('Please wait for all files to finish uploading.');
      return;
    }

    setLoading(true);
    try {
      const cleanFiles = files.map(({ name, url, size, type, ext }) => ({ name, url, size, type, ext }));

      const res = await axios.post(`${API_BASE}api/student/daily_logs/save_daily_log.php`, {
        user_id: userId,
        date: date,
        topic_title: topicTitle.trim(),
        summary: summary.trim(),
        challenges_faced: challengesFaced.trim(),
        practice_hours: practiceHours,
        files: cleanFiles
      });

      if (res.data && res.data.status === 'success') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('🎉 Daily work log submitted successfully!');
        handleResetForm();
        fetchHistory();
        setActiveTab('history');
      } else {
        toast.error(res.data?.message || 'Failed to submit log.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Server error while saving log.');
    } finally {
      setLoading(false);
    }
  };

  const quickTopics = [
    'Pen Tool Curved Tracing',
    'Logo Vector Creation',
    'Social Media Banner Design',
    'Typography & Font Pairing',
    'Image Retouching & Masking',
    'Color Theory & Gradients'
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6  mx-auto min-h-screen text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header Banner & Gamified Stats */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3">
              <FiZap className="text-amber-500" />
              Daily Practice & Portfolio Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily Work Log & Showcase
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Log what you learned in offline class, upload your practice deliverables (PNG, JPG, PSD, AI), and earn instructor ⭐ ratings and credits!
            </p>
          </div>

          {/* Mini Stat Counters */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 sm:p-4 text-center">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total Logs</span>
              <span className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{stats.total_logs || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 sm:p-4 text-center">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Practice Hrs</span>
              <span className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">{stats.total_hours || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 sm:p-4 text-center">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Earned ⭐</span>
              <span className="text-lg sm:text-2xl font-black text-amber-500 mt-0.5 block">+{stats.total_credits || 0}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700/80 mt-6 pt-2">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <FiFileText size={16} /> Submit Today's Work
          </button>
          <button
            onClick={() => { setActiveTab('history'); fetchHistory(); }}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <FiCalendar size={16} /> My Submissions & Reviews ({historyLogs.length})
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div>
        {/* TAB 1: SUBMIT WORK LOG */}
        {activeTab === 'submit' && (
          <div className="space-y-4">
            {/* Status Card if Today is Already Logged */}
            {todaySubmission && !topicTitle && (
              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <FiCheckCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Today's Work Logged: <span className="text-indigo-600 dark:text-indigo-400">"{todaySubmission.topic_title}"</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {todaySubmission.instructor_rating ? `⭐ Graded ${todaySubmission.instructor_rating}/5 Stars` : '⏳ Awaiting Instructor Review & Grading'} • {todaySubmission.practice_hours} hrs logged
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleEditSubmission(todaySubmission)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <FiEdit2 size={13} /> Edit / Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    View in History
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs backdrop-blur-md">
              {/* Date & Practice Hours Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <FiCalendar className="text-indigo-500" /> Class / Practice Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <FiClock className="text-indigo-500" /> Approximate Practice Hours
                  </label>
                  <div className="flex items-center gap-2">
                    {[2, 4, 6, 8].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setPracticeHours(h)}
                        className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          practiceHours === h
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {h} hrs
                      </button>
                    ))}
                    <input
                      type="number"
                      min="0.5"
                      max="14"
                      step="0.5"
                      value={practiceHours}
                      onChange={(e) => setPracticeHours(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-center text-slate-900 dark:text-slate-100 font-bold rounded-xl py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Topic Input & Quick Suggestions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Topic / Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g., Pen Tool Curved Tracing / Modern Logo Concept"
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold transition-all placeholder-slate-400"
                  required
                />

                {/* Suggestions Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Suggestions:</span>
                  {quickTopics.map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopicTitle(topic)}
                      className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer"
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Summary - Rich Interactive Card */}
              <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/70 rounded-3xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                      <FiEdit2 size={15} />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Detailed Work Summary
                      </label>
                      <span className="text-[11px] text-rose-500 ml-1 font-bold">* Required</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Template Starters */}
                    <button
                      type="button"
                      onClick={() => setSummary(prev => prev ? `${prev}\n\n• Tools: Photoshop / Illustrator\n• Process: Created modern layout with customized typography\n• Deliverable: 2 high-res design exports` : `1. What I Practiced: \n2. Tools Used: \n3. Key Learnings & Output: `)}
                      className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FiZap size={12} className="text-amber-500" /> Insert Template
                    </button>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {summary.length} chars
                    </span>
                  </div>
                </div>

                {/* Textarea Box with Floating Container */}
                <div className="bg-white dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-3 shadow-2xs">
                  <textarea
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Example: Today I practiced pen tool bezier curves. Created 3 smooth vector icons, organized layers properly, and applied complementary color gradients..."
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-none placeholder-slate-400 resize-y leading-relaxed"
                    required
                  />

                  {/* Quick Insert Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400">Quick Insert:</span>
                    {[
                      { label: '+ 🛠️ Tools Used', text: '\n• Tools Used: Adobe Photoshop, Illustrator' },
                      { label: '+ 🎨 Key Techniques', text: '\n• Techniques: Pen Tool Curving, Layer Masking' },
                      { label: '+ 📦 Output Exported', text: '\n• Output: 1 High-res PNG + Source PSD' },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSummary(prev => prev ? `${prev}${btn.text}` : btn.text.trim())}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                    {summary && (
                      <button
                        type="button"
                        onClick={() => setSummary('')}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-500 ml-auto cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Challenges / Questions - Interactive Card */}
              <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/70 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                      <FiHelpCircle size={15} />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Challenges Faced / Questions for Instructor
                      </label>
                      <span className="text-[10px] text-slate-400 ml-1 font-semibold">(Optional)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all p-3 shadow-2xs">
                  <textarea
                    rows={2}
                    value={challengesFaced}
                    onChange={(e) => setChallengesFaced(e.target.value)}
                    placeholder="Did you encounter any confusion with anchor points, shortcuts, alignment, or color balance?"
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-none placeholder-slate-400 resize-y leading-relaxed"
                  />

                  {/* Quick Chips for Common Challenges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400">Common Topics:</span>
                    {[
                      'Pen Tool curves handling',
                      'Layer mask selection',
                      'Color gradient harmony',
                      'Shortcut memorization'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setChallengesFaced(prev => prev ? `${prev}, ${chip}` : `Faced difficulty with: ${chip}`)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cloudflare R2 Drag & Drop File Uploader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>Upload Practice Outputs & Source Files</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">Cloudflare R2 Direct</span>
                </label>

                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 rounded-3xl p-6 text-center cursor-pointer transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilesSelected}
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.psd,.ai,.eps,.pdf,.zip,.rar,.svg"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <FiUploadCloud size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-3">Click or Drag & Drop Practice Files Here</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload PNG/JPG designs for instant review + PSD, AI, EPS, or ZIP source files
                  </p>
                </div>

                {/* Uploaded Files Grid */}
                {files.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {files.map((f, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 flex items-center gap-3 relative group">
                        {/* Image Thumbnail or File Icon */}
                        {f.localUrl || (f.url && f.type === 'preview') ? (
                          <div
                            onClick={() => setSelectedPreviewImg(getFileUrl(f.url) || f.localUrl)}
                            className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer border border-slate-300 dark:border-slate-700 hover:opacity-80 relative flex items-center justify-center"
                          >
                            <img
                              src={f.localUrl || getFileUrl(f.url)}
                              alt={f.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <FiImage className="text-slate-400 absolute" size={16} />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-black uppercase text-xs">
                            {f.ext || 'FILE'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{f.size}</p>
                          {f.uploading && (
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-full transition-all" style={{ width: `${f.progress || 0}%` }} />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black rounded-2xl shadow-lg shadow-purple-500/25 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <FiRefreshCw className="animate-spin text-base" /> : <FiSend size={16} />}
                  {loading ? 'Submitting to Cloud...' : 'Submit Daily Work Log'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: SUBMISSIONS HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyLoading ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800">
                <FiRefreshCw className="animate-spin text-3xl text-indigo-500 mx-auto" />
                <p className="text-sm font-bold text-slate-400 mt-3">Loading your practice history...</p>
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 p-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl shadow-xs">
                  <FiBookOpen />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">No Practice Logs Submitted Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start by submitting your first daily work report today to build your academy portfolio and earn credits!
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  Submit First Log <FiChevronRight />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {historyLogs.map((log) => (
                  <div key={log.id} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold">
                            {log.date}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <FiClock size={12} /> {log.practice_hours} hrs practiced
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5">{log.topic_title}</h3>
                      </div>

                      {/* Rating & Credits Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {log.instructor_rating ? (
                          <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-500 text-xs font-black shadow-xs">
                            {Array.from({ length: log.instructor_rating }).map((_, i) => (
                              <FiStar key={i} className="fill-amber-400 text-amber-400" size={13} />
                            ))}
                            <span className="ml-1">({log.instructor_rating}/5)</span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold">
                            Pending Review
                          </span>
                        )}

                        {log.credits_earned > 0 && (
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black flex items-center gap-1">
                            <FiAward size={13} /> +{log.credits_earned} Credits
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEditSubmission(log)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Edit this submission"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">{log.summary}</p>

                    {/* Challenges */}
                    {log.challenges_faced && (
                      <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Challenges: </span>
                        <span className="text-slate-600 dark:text-slate-300">{log.challenges_faced}</span>
                      </div>
                    )}

                    {/* Attached Deliverables & Image Visual Showcase */}
                    {log.files && log.files.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FiFolder size={13} /> Attached Deliverables & Outputs ({log.files.length})
                        </h5>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {log.files.map((file, fIdx) => {
                            const fileName = file.name || file.file_name || 'file';
                            const fileUrl = getFileUrl(file.url || file.file_url);
                            const ext = (file.ext || fileName.split('.').pop() || '').toLowerCase();
                            const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) || file.type === 'preview';

                            return (
                              <div
                                key={fIdx}
                                className="group bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                              >
                                {isImg ? (
                                  /* Image Preview Thumbnail with Click-to-Zoom */
                                  <div
                                    onClick={() => setSelectedPreviewImg(fileUrl)}
                                    className="h-28 w-full bg-slate-200 dark:bg-slate-800 cursor-pointer overflow-hidden relative flex items-center justify-center"
                                  >
                                    <img
                                      src={fileUrl}
                                      alt={fileName}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <FiImage className="text-slate-400 absolute" size={22} />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-2xs">
                                      <FiEye size={16} /> View Image
                                    </div>
                                  </div>
                                ) : (
                                  /* Source File Box (AI, PSD, ZIP, PDF) */
                                  <div className="h-28 w-full bg-slate-100 dark:bg-slate-800/60 flex flex-col items-center justify-center p-3 text-indigo-500">
                                    <FiFileText size={28} />
                                    <span className="text-[11px] font-black uppercase mt-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                                      {ext}
                                    </span>
                                  </div>
                                )}

                                {/* File Name & Download Bar */}
                                  <div className="p-2 bg-white dark:bg-slate-950/70 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={fileName}>
                                      {fileName}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDownloadSingleFile(e, file.url || file.file_url, fileName)}
                                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                                      title="Download File"
                                    >
                                      <FiDownload size={13} />
                                    </button>
                                  </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Instructor Feedback Callout */}
                    {log.instructor_feedback && (
                      <div className="bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 p-4 rounded-2xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                          <FiCheckCircle size={14} className="text-emerald-500" />
                          <span>Instructor Feedback ({log.reviewer_name || 'Instructor'}):</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic pl-5">"{log.instructor_feedback}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Image Preview */}
      {selectedPreviewImg && (
        <div
          onClick={() => setSelectedPreviewImg(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={selectedPreviewImg} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <a
                href={selectedPreviewImg}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-colors"
                title="Download full image"
              >
                <FiDownload size={18} />
              </a>
              <button
                onClick={() => setSelectedPreviewImg(null)}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-colors"
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

export default DailyWorkLog;
