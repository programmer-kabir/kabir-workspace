import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { getApiBase } from '../utils/api';
import {
  FiClock, FiCheckCircle, FiPlayCircle, FiEye, FiSearch, FiFilter,
  FiCalendar, FiX, FiInfo, FiPaperclip, FiLink, FiDownload,
  FiSend, FiMessageSquare, FiTrash2, FiEdit2, FiImage, FiFlag,
  FiPauseCircle, FiCheckSquare, FiCode, FiCopy, FiCheck, FiWifiOff, FiRefreshCw
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import TaskCard from './Tasks/TaskCard';
import TaskTabs from './Tasks/TaskTabs';
import TaskDetailsModal from './Tasks/TaskDetailsModal';
import ClaimTaskModal from './Tasks/ClaimTaskModal';
import CreateSelfTaskModal from './Tasks/CreateSelfTaskModal';
import StaffTaskSkeletonGrid from './TaskSkeletonGrid';
import CascadingCategoryFilter from './CascadingCategoryFilter';
import DailyProgressBar from './DailyProgressBar';
import EmptyState from './EmptyState';
import Toast from './Toast';
import offlineQueueService from '../services/OfflineQueueService';
import { preCacheTaskAssets } from '../utils/fileDownloader';

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  text = text.replace(/&nbsp;/g, ' ');
  return text;
};

const isColorHex = (str) => typeof str === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(str);

const DynamicJsonViewer = React.memo(({ data, level = 0 }) => {
  if (data === null) return <span className="text-slate-400 italic text-sm">null</span>;
  if (typeof data === 'boolean') return <span className={`text-sm ${data ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}`}>{data ? 'True' : 'False'}</span>;
  if (typeof data === 'number') return <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{data}</span>;
  if (typeof data === 'string') {
    if (isColorHex(data)) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm font-mono text-slate-700 dark:text-slate-300">
          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0" style={{ backgroundColor: data }} />
          {data}
        </span>
      );
    }
    return <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{data}</span>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="flex flex-col gap-1.5 mt-1 list-disc list-inside text-slate-400 marker:text-slate-300 pl-1">
        {data.map((item, idx) => (
          <li key={idx} className="text-sm">
            <span className="inline-block align-top ml-[-4px] w-[calc(100%-12px)]">
              <DynamicJsonViewer data={item} level={level + 1} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    const isComplex = Object.values(data).some(v => typeof v === 'object' && v !== null);
    return (
      <div className={`flex flex-col ${level > 0 ? 'gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800' : 'gap-3.5'}`}>
        {Object.entries(data).map(([key, val]) => {
          return (
            <div key={key} className={`flex ${isComplex ? 'flex-col' : 'items-start gap-3'}`}>
              <span className={`text-xs font-bold text-slate-500 dark:text-slate-400 capitalize shrink-0 ${!isComplex ? 'w-1/3 min-w-[120px] max-w-[150px] pt-0.5' : 'mb-0.5 text-slate-800 dark:text-slate-200'}`}>
                {key.replace(/_/g, ' ')}
              </span>
              <div className={`${isComplex ? 'w-full' : 'flex-1 break-words'}`}>
                <DynamicJsonViewer data={val} level={level + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
});

const CopyButton = ({ textToCopy }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
      title="Copy text"
    >
      {copied ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

const DescriptionRenderer = React.memo(({ htmlContent, onImageClick }) => {
  let jsonData = null;
  let textBefore = '';
  let textAfter = '';
  let cleanHtml = htmlContent || '';

  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    const urlRegex = /(https?:\/\/[^\s<"']+)/g;
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentNode && node.parentNode.tagName !== 'A' && urlRegex.test(node.nodeValue)) {
        nodesToReplace.push(node);
      }
    }
    nodesToReplace.forEach((n) => {
      const span = document.createElement('span');
      span.innerHTML = n.nodeValue.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline" draggable="false">${url}</a>`;
      });
      n.parentNode.replaceChild(span, n);
    });

    const allLinks = tempDiv.querySelectorAll('a, img');
    allLinks.forEach(el => {
      el.setAttribute('draggable', 'false');
      if (el.tagName === 'A') {
        el.classList.add('text-blue-600', 'hover:text-blue-700', 'dark:text-blue-400', 'dark:hover:text-blue-300', 'font-semibold', 'hover:underline');
      } else if (el.tagName === 'IMG') {
        el.classList.add('cursor-zoom-in', 'hover:opacity-90', 'transition-opacity', 'rounded-xl', 'border', 'border-slate-200', 'dark:border-white/10');
      }
    });

    cleanHtml = tempDiv.innerHTML;
  } catch (e) {
    console.error("Linkify error", e);
  }

  try {
    let textWithNewlines = htmlContent || '';
    textWithNewlines = textWithNewlines.replace(/<p[^>]*>/gi, '\n');
    textWithNewlines = textWithNewlines.replace(/<\/p>/gi, '\n');
    textWithNewlines = textWithNewlines.replace(/<div[^>]*>/gi, '\n');
    textWithNewlines = textWithNewlines.replace(/<\/div>/gi, '\n');
    textWithNewlines = textWithNewlines.replace(/<br\s*\/?>/gi, '\n');
    textWithNewlines = textWithNewlines.replace(/<li[^>]*>/gi, '\n• ');
    textWithNewlines = textWithNewlines.replace(/<\/li>/gi, '\n');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textWithNewlines;
    let rawText = tempDiv.textContent || tempDiv.innerText || '';
    rawText = rawText.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ');

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    const firstBracket = rawText.indexOf('[');
    const lastBracket = rawText.lastIndexOf(']');

    let startIndex = -1;
    let endIndex = -1;

    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      endIndex = lastBrace;
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      startIndex = firstBracket;
      endIndex = lastBracket;
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const possibleJson = rawText.substring(startIndex, endIndex + 1);
      jsonData = JSON.parse(possibleJson);
      textBefore = rawText.substring(0, startIndex).trim();
      textAfter = rawText.substring(endIndex + 1).trim();
    }
  } catch (e) {
    jsonData = null;
  }

  const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatPlainText = (text) => {
    if (!text) return null;
    const escaped = escapeHtml(text);
    const withLinks = escaped.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline" draggable="false">${url}</a>`;
    });

    return (
      <div
        className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
        dangerouslySetInnerHTML={{ __html: withLinks }}
      />
    );
  };

  if (jsonData) {
    return (
      <div className="flex flex-col gap-4">
        {textBefore && (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {formatPlainText(textBefore)}
          </div>
        )}

        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs relative group">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiCode size={14} className="text-blue-500" />
              Structured Task Data
            </span>
            <CopyButton textToCopy={JSON.stringify(jsonData, null, 2)} />
          </div>
          <DynamicJsonViewer data={jsonData} />
        </div>

        {textAfter && (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {formatPlainText(textAfter)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target.tagName === 'IMG' && onImageClick) {
          onImageClick(e.target.src);
        }
      }}
      className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 select-text"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
});

const TasksView = ({ activeTab: currentModuleTab }) => {
  const { currentUser } = useAuth();
  const API_BASE = (getApiBase() || '').replace(/\/$/, '') + '/';

  const [tasks, setTasks] = useState(() => {
    return currentUser?.id ? offlineQueueService.getTasksCache(currentUser.id) : [];
  });
  const [activeTab, setActiveTab] = useState('To-Do');
  const [loading, setLoading] = useState(() => {
    const cached = currentUser?.id ? offlineQueueService.getTasksCache(currentUser.id) : [];
    return cached.length === 0;
  });
  const [error, setError] = useState('');
  const [pendingTasksCount, setPendingTasksCount] = useState(() => {
    return currentUser?.id ? offlineQueueService.getPendingTasksCount(currentUser.id) : 0;
  });
  const [syncingTasks, setSyncingTasks] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsTab, setDetailsTab] = useState('comments');
  const [submissionLink, setSubmissionLink] = useState('');

  // Claim Modal State
  const [claimModalTask, setClaimModalTask] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccessToast, setClaimSuccessToast] = useState(null);

  // Self-Initiated Creative Task Modal State
  const [isCreateSelfModalOpen, setIsCreateSelfModalOpen] = useState(false);
  const [selfCreateToast, setSelfCreateToast] = useState(null);
  const [actionToast, setActionToast] = useState({ show: false, title: '', message: '', type: 'error' });

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);

  // Lightbox and Zoom state
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxScale, setLightboxScale] = useState(2);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxScale(2);
    setIsHovered(false);
    setZoomPos({ x: 50, y: 50 });
  };

  const { searchTerm, setSearchTerm } = useSearch();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('all');
  const [selectedChildCategoryFilter, setSelectedChildCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const handleCategoryFilterChange = (cat) => {
    setSelectedCategoryFilter(cat);
    setSelectedSubcategoryFilter('all');
    setSelectedChildCategoryFilter('all');
  };

  const handleSubcategoryFilterChange = (sub) => {
    setSelectedSubcategoryFilter(sub);
    setSelectedChildCategoryFilter('all');
  };

  const handleChildCategoryFilterChange = (child) => {
    setSelectedChildCategoryFilter(child);
  };

  // Live Timer Tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeSpent = (task) => {
    if (!task) return '0h 0m 0s';
    let totalSecs = parseInt(task.total_time_spent || 0, 10);
    if (task.status === 'In Progress' && task.timer_status === 'Running' && task.session_start_time) {
      let cleanStr = String(task.session_start_time).trim().replace(' ', 'T');
      if (!cleanStr.includes('+') && !cleanStr.endsWith('Z')) {
        cleanStr += '+06:00';
      }
      const start = new Date(cleanStr).getTime();
      if (!isNaN(start)) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        totalSecs += diff;
      }
    }
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated && (updated.total_time_spent !== selectedTask.total_time_spent || updated.timer_status !== selectedTask.timer_status || updated.status !== selectedTask.status)) {
        setSelectedTask(prev => ({ ...prev, ...updated }));
      }
    }
  }, [tasks]);

  const handleToggleTimer = async (e, task) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const isRunning = task.timer_status === 'Running';

    if (!navigator.onLine) {
      offlineQueueService.enqueueTaskAction({
        userId: currentUser.id,
        taskId: task.id,
        type: isRunning ? 'pause_timer' : 'start_task',
        timestamp: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            timer_status: isRunning ? 'Paused' : 'Running',
            session_start_time: isRunning ? null : new Date().toISOString(),
            is_offline_pending: true
          };
        }
        return t;
      }));
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
      return;
    }

    try {
      const endpoint = isRunning ? 'pause_timer.php' : 'start_timer.php';
      const response = await axios.post(`${API_BASE}api/tasks/${endpoint}`, {
        user_id: currentUser.id,
        task_id: task.id
      });

      if (response.data.status === 'success') {
        fetchTasks();
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      const isNetErr = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK';
      if (isNetErr) {
        offlineQueueService.enqueueTaskAction({
          userId: currentUser.id,
          taskId: task.id,
          type: isRunning ? 'pause_timer' : 'start_task',
          timestamp: new Date().toISOString()
        });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, timer_status: isRunning ? 'Paused' : 'Running', is_offline_pending: true } : t));
        setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
        return;
      }
      alert('Failed to toggle timer.');
    }
  };

  const handleToggleChecklist = async (index) => {
    if (!selectedTask) return;
    const updatedChecklists = [...selectedTask.checklists];
    updatedChecklists[index].is_completed = !updatedChecklists[index].is_completed;

    setSelectedTask({ ...selectedTask, checklists: updatedChecklists });
    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, checklists: updatedChecklists, is_offline_pending: true } : t));

    if (!navigator.onLine) {
      offlineQueueService.enqueueTaskAction({
        userId: currentUser.id,
        taskId: selectedTask.id,
        type: 'update_checklist',
        checklists: updatedChecklists,
        timestamp: new Date().toISOString()
      });
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
      return;
    }

    try {
      await axios.post(`${API_BASE}api/tasks/update_checklist.php`, {
        task_id: selectedTask.id,
        checklists: updatedChecklists
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      offlineQueueService.enqueueTaskAction({
        userId: currentUser.id,
        taskId: selectedTask.id,
        type: 'update_checklist',
        checklists: updatedChecklists,
        timestamp: new Date().toISOString()
      });
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
    }
  };

  const fetchTasks = async () => {
    if (!currentUser?.id) return;
    setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));

    if (!navigator.onLine) {
      const cached = offlineQueueService.getTasksCache(currentUser.id);
      if (cached && cached.length > 0) {
        setTasks(cached);
      }
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}api/tasks/get_my_tasks.php`, {
        user_id: currentUser.id
      });

      if (response.data.status === 'success') {
        const fetchedTasks = response.data.tasks || [];
        setTasks(fetchedTasks);
        offlineQueueService.saveTasksCache(currentUser.id, fetchedTasks);
        // Pre-cache active task assets for offline use!
        preCacheTaskAssets(fetchedTasks);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.warn('Failed to fetch tasks (using offline cache):', err?.message);
      const cached = offlineQueueService.getTasksCache(currentUser.id);
      if (cached && cached.length > 0) {
        setTasks(cached);
      } else {
        setError('Failed to fetch tasks.');
      }
    } finally {
      setLoading(false);
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
    }
  };

  const handleManualSyncTasks = async () => {
    if (!navigator.onLine) {
      alert('ডিভাইস বর্তমানে অফলাইনে রয়েছে। ইন্টারনেট সংযোগ এলে সিঙ্ক করুন।');
      return;
    }
    setSyncingTasks(true);
    const res = await offlineQueueService.syncPendingTaskActions(currentUser.id, API_BASE);
    setSyncingTasks(false);
    if (res.success) {
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
      fetchTasks();
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification('টাস্ক সিঙ্ক হয়েছে ✅', `${res.synced_count || 0}টি অফলাইন টাস্ক পরিবর্তন সার্ভারে সিঙ্ক হয়েছে।`);
      }
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchTasks();
    }

    const handleOnline = async () => {
      if (currentUser?.id) {
        console.log('[TasksView] Online detected! Syncing pending task actions...');
        await offlineQueueService.syncPendingTaskActions(currentUser.id, API_BASE);
        setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
        fetchTasks();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser?.id]);

  // Load comments when a task is selected
  useEffect(() => {
    if (selectedTask?.id) {
      fetchComments(selectedTask.id);

      const pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2'
      });
      const channel = pusher.subscribe(`task-comments-${selectedTask.id}`);

      channel.bind('new-comment', function (newComment) {
        setComments(prev => {
          if (prev.find(c => String(c.id) === String(newComment.id))) {
            return prev;
          }
          return [...prev, newComment];
        });
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        pusher.disconnect();
      };
    } else {
      setComments([]);
    }
  }, [selectedTask?.id]);

  const fetchComments = async (taskId) => {
    setCommentsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, {
        action: 'get',
        task_id: taskId
      });
      if (res.data.status === 'success') {
        setComments(res.data.comments || []);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if ((!newComment.trim() && !commentImage) || !selectedTask) return;
    setAddingComment(true);

    const formData = new FormData();
    formData.append('action', 'add');
    formData.append('task_id', selectedTask.id);
    formData.append('user_id', currentUser.id);
    formData.append('comment', newComment.trim());
    if (commentImage) {
      formData.append('image', commentImage);
    }

    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setComments(prev => {
          if (prev.find(c => String(c.id) === String(res.data.comment.id))) {
            return prev;
          }
          return [...prev, res.data.comment];
        });
        setNewComment('');
        setCommentImage(null);
        setCommentImagePreview(null);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, {
        action: 'delete',
        comment_id: commentId,
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, {
        action: 'update',
        comment_id: commentId,
        user_id: currentUser.id,
        comment: editCommentText.trim()
      });
      if (res.data.status === 'success') {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment: editCommentText.trim() } : c));
        setEditingCommentId(null);
        setEditCommentText('');
      }
    } catch (err) { console.error('Failed to update comment', err); }
  };

  const handleOpenClaimModal = (e, task) => {
    if (e) e.stopPropagation();
    setClaimError('');
    setClaimModalTask(task);
  };

  const handleConfirmClaim = async (taskId) => {
    setClaimLoading(true);
    setClaimError('');

    try {
      const res = await axios.post(`${API_BASE}api/tasks/claim_task.php`, {
        task_id: taskId,
        user_id: currentUser.id
      });

      if (res.data.status === 'success') {
        const claimedTitle = claimModalTask?.title || 'Task';
        setClaimModalTask(null);
        setSelectedTask(null);
        setClaimSuccessToast({
          title: claimedTitle,
          message: 'Task claimed successfully! It has been moved to your To-Do board.'
        });
        setTimeout(() => setClaimSuccessToast(null), 5000);
        await fetchTasks();
        setActiveTab('To-Do');
      } else {
        setClaimError(res.data.message || 'Failed to claim task.');
      }
    } catch (error) {
      setClaimError(error.response?.data?.message || 'Server error claiming task. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleStartTask = async (e, taskId) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    if (!navigator.onLine) {
      offlineQueueService.enqueueTaskAction({
        userId: currentUser.id,
        taskId,
        type: 'start_task',
        timestamp: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: 'In Progress', timer_status: 'Running', session_start_time: new Date().toISOString(), is_offline_pending: true };
        }
        if (t.status === 'In Progress') {
          return { ...t, timer_status: 'Paused' };
        }
        return t;
      }));
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
      setActionToast({
        show: true,
        title: 'Task Started (Offline ⏳)',
        message: 'অফলাইনে টাস্ক শুরু হয়েছে। ইন্টারনেট এলে সার্ভারে সিঙ্ক হবে।',
        type: 'success'
      });
      setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 4000);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}api/tasks/update_task_status.php`, {
        user_id: currentUser.id,
        task_id: taskId,
        status: 'In Progress'
      });

      if (response.data.status === 'success') {
        fetchTasks();
        setActionToast({
          show: true,
          title: 'Task Started',
          message: 'Task is now in progress and timer is active.',
          type: 'success'
        });
        setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 4000);
      } else {
        setActionToast({
          show: true,
          title: 'Action Restricted',
          message: response.data.message || 'Cannot start this task while another task is in progress.',
          type: 'error'
        });
        setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 6000);
      }
    } catch (err) {
      const isNetErr = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK';
      if (isNetErr) {
        offlineQueueService.enqueueTaskAction({
          userId: currentUser.id,
          taskId,
          type: 'start_task',
          timestamp: new Date().toISOString()
        });
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return { ...t, status: 'In Progress', timer_status: 'Running', session_start_time: new Date().toISOString(), is_offline_pending: true };
          }
          if (t.status === 'In Progress') {
            return { ...t, timer_status: 'Paused' };
          }
          return t;
        }));
        setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
        setActionToast({
          show: true,
          title: 'Task Started (Offline ⏳)',
          message: 'নেটওয়ার্ক সমস্যার কারণে অফলাইনে টাস্ক শুরু হয়েছে।',
          type: 'success'
        });
        setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 4000);
        return;
      }
      setActionToast({
        show: true,
        title: 'Error',
        message: err.response?.data?.message || 'Failed to update task status.',
        type: 'error'
      });
      setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 5000);
    }
  };

  const [submitSuccessToast, setSubmitSuccessToast] = useState(false);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  const handleSubmitWork = async (predefinedLink = null, submissionFiles = []) => {
    const finalLink = (typeof predefinedLink === 'string' ? predefinedLink : submissionLink) || '';
    if (!finalLink.trim() && (!submissionFiles || submissionFiles.length === 0)) {
      alert('Please upload your completed file(s) or provide a submission link.');
      return;
    }

    if (!navigator.onLine) {
      offlineQueueService.enqueueTaskAction({
        userId: currentUser.id,
        taskId: selectedTask.id,
        type: 'submit_work',
        status: 'In Review',
        submissionLink: finalLink,
        timestamp: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'In Review', timer_status: 'Stopped', submission_link: finalLink, is_offline_pending: true } : t));
      setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
      setSelectedTask(null);
      setSubmissionLink('');
      setSubmitSuccessToast(true);
      setTimeout(() => setSubmitSuccessToast(false), 5000);
      return;
    }

    setIsSubmittingWork(true);
    try {
      const response = await axios.post(`${API_BASE}api/tasks/update_task_status.php`, {
        user_id: currentUser.id,
        task_id: selectedTask.id,
        status: 'In Review',
        submission_link: finalLink,
        submission_files: submissionFiles
      });

      if (response.data.status === 'success') {
        fetchTasks();
        setSelectedTask(null);
        setSubmissionLink('');
        setSubmitSuccessToast(true);
        setTimeout(() => setSubmitSuccessToast(false), 5000);
      } else {
        alert(response.data.message || 'Failed to submit work.');
      }
    } catch (err) {
      const isNetErr = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK';
      if (isNetErr) {
        offlineQueueService.enqueueTaskAction({
          userId: currentUser.id,
          taskId: selectedTask.id,
          type: 'submit_work',
          status: 'In Review',
          submissionLink: finalLink,
          timestamp: new Date().toISOString()
        });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'In Review', timer_status: 'Stopped', submission_link: finalLink, is_offline_pending: true } : t));
        setPendingTasksCount(offlineQueueService.getPendingTasksCount(currentUser.id));
        setSelectedTask(null);
        setSubmissionLink('');
        setSubmitSuccessToast(true);
        setTimeout(() => setSubmitSuccessToast(false), 5000);
        return;
      }
      alert('Failed to submit work.');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleSelfTaskCreated = (newTask, message) => {
    fetchTasks();
    setActiveTab('To-Do');
    setSelfCreateToast(newTask || { title: 'Creative Task Added' });
    setTimeout(() => setSelfCreateToast(null), 6000);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        (task.title || '').toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.category || '').toLowerCase().includes(term) ||
        (task.main_category_name || '').toLowerCase().includes(term) ||
        (task.sub_category_name || '').toLowerCase().includes(term) ||
        (task.child_category_name || '').toLowerCase().includes(term) ||
        (task.category_path || '').toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
      const catLow = selectedCategoryFilter.toLowerCase().trim();
      const mainName = (task.main_category_name || '').toLowerCase().trim();
      const catName = (task.category_name || '').toLowerCase().trim();
      const directCat = (task.category || '').toLowerCase().trim();
      const catPath = (task.category_path || '').toLowerCase().trim();

      const matchesCat =
        mainName === catLow ||
        directCat === catLow ||
        catPath.startsWith(catLow) ||
        catPath.includes(catLow) ||
        catName === catLow;
      if (!matchesCat) return false;
    }

    if (selectedSubcategoryFilter && selectedSubcategoryFilter !== 'all') {
      const subLow = selectedSubcategoryFilter.toLowerCase().trim();
      const subName = (task.sub_category_name || '').toLowerCase().trim();
      const directCat = (task.category || '').toLowerCase().trim();
      const catPath = (task.category_path || '').toLowerCase().trim();

      const matchesSub =
        subName === subLow ||
        directCat === subLow ||
        catPath.includes(subLow);
      if (!matchesSub) return false;
    }

    if (selectedChildCategoryFilter && selectedChildCategoryFilter !== 'all') {
      const childLow = selectedChildCategoryFilter.toLowerCase().trim();
      const childName = (task.child_category_name || '').toLowerCase().trim();
      const directCat = (task.category || '').toLowerCase().trim();
      const catPath = (task.category_path || '').toLowerCase().trim();

      const matchesChild =
        childName === childLow ||
        directCat === childLow ||
        catPath.includes(childLow);
      if (!matchesChild) return false;
    }

    const taskDate = task.assign_date || task.created_at;
    const matchesDate = !dateFilter || task.status === 'Unassigned' || (taskDate && taskDate.startsWith(dateFilter));
    if (!matchesDate) return false;

    return true;
  });

  const columns = {
    'Unassigned': filteredTasks.filter(t => t.status === 'Unassigned'),
    'To-Do': filteredTasks.filter(t => t.status === 'To-Do'),
    'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
    'In Review': filteredTasks.filter(t => t.status === 'In Review'),
    'Rejected': filteredTasks.filter(t => t.status === 'Rejected'),
    'Completed': filteredTasks.filter(t => t.status === 'Completed'),
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 min-h-[60vh]">
        <StaffTaskSkeletonGrid count={8} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-12 relative max-w-[1920px] mx-auto">
      {/* Floating Claim Success Banner */}
      {claimSuccessToast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 text-white rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-top-6 duration-300 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shrink-0 shadow-lg shadow-indigo-500/30">
              <FiCheckCircle size={22} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Task Claimed Successfully</span>
              <p className="text-sm font-bold text-white leading-snug mt-0.5">{claimSuccessToast.title}</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {claimSuccessToast.message}
              </p>
            </div>
            <button
              onClick={() => setClaimSuccessToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Self-Initiated Creative Task Success Toast Banner */}
      {selfCreateToast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-rose-500/40 text-white rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-top-6 duration-300 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shrink-0 shadow-lg shadow-rose-500/30">
              <HiSparkles size={22} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">✨ Creative Task Created</span>
              <p className="text-sm font-bold text-white leading-snug mt-0.5">{selfCreateToast.title}</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Task has been added to your <strong>To-Do</strong> list. You can start the timer and work on it anytime.
              </p>
            </div>
            <button
              onClick={() => setSelfCreateToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Submission Success Toast Banner */}
      {submitSuccessToast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 text-white rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-top-6 duration-300 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shrink-0 shadow-lg shadow-emerald-500/20">
              <FiCheckCircle size={22} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Submission Successful</span>
              <p className="text-sm font-bold text-white leading-snug mt-0.5">Work Submitted for Review!</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Task link submitted. Notifications have been dispatched to <strong>Admin</strong> & <strong>Reviewer Manager</strong>.
              </p>
            </div>
            <button
              onClick={() => setSubmitSuccessToast(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Offline Tasks Queue Banner ── */}
      {pendingTasksCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold shrink-0">
              ⏳
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                অফলাইন টাস্ক কিউ: {pendingTasksCount}টি পরিবর্তন সিঙ্কের অপেক্ষায়
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                অফলাইনে টাস্ক শুরু বা জমা করা হয়েছে। ইন্টারনেট ফিরে এলে স্বয়ংক্রিয়ভাবে সার্ভারে সিঙ্ক হয়ে যাবে।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualSyncTasks}
            disabled={syncingTasks}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            <FiRefreshCw className={syncingTasks ? 'animate-spin' : ''} size={14} />
            <span>{syncingTasks ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক করুন'}</span>
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Task Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and track your daily assignments.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow-sm border border-red-100 w-full xl:w-auto">{error}</div>}

        {/* ULTRA PREMIUM FILTERS & ACTIONS */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* + New Creative Task Button */}
          <button
            onClick={() => setIsCreateSelfModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:via-rose-600 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <HiSparkles size={16} />
            <span>+ New Creative Task</span>
          </button>

          {/* Cascading Category Filters (3-tier) */}
          <CascadingCategoryFilter
            category={selectedCategoryFilter}
            subcategory={selectedSubcategoryFilter}
            childCategory={selectedChildCategoryFilter}
            onCategoryChange={handleCategoryFilterChange}
            onSubcategoryChange={handleSubcategoryFilterChange}
            onChildCategoryChange={handleChildCategoryFilterChange}
            apiBase={API_BASE}
          />

          {/* Date Pill */}
          <div className="relative group w-full sm:w-auto">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" size={14} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-[160px] pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* Clear Action */}
          <div className={`overflow-hidden transition-all duration-300 origin-left ${Boolean((searchTerm && searchTerm.trim()) || selectedCategoryFilter !== 'all' || selectedSubcategoryFilter !== 'all' || selectedChildCategoryFilter !== 'all' || dateFilter) ? 'w-full sm:w-auto opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoryFilter('all');
                setSelectedSubcategoryFilter('all');
                setSelectedChildCategoryFilter('all');
                setDateFilter('');
              }}
              className="w-full px-5 py-2.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100/50 dark:border-red-500/20 rounded-full transition-all font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FiX size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* DAILY PROGRESS & MOTIVATION GOAL BAR (Synced to active date & filters) */}
      <DailyProgressBar tasks={filteredTasks} />

      {/* TABS NAVIGATION */}
      <TaskTabs columns={columns} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* TAB CONTENT GRID */}
      {columns[activeTab].length === 0 ? (
        <EmptyState
          activeTab={activeTab}
          hasFilter={Boolean((searchTerm && searchTerm.trim()) || selectedCategoryFilter !== 'all' || selectedSubcategoryFilter !== 'all' || selectedChildCategoryFilter !== 'all' || dateFilter)}
          onClearFilter={() => {
            setSearchTerm('');
            setSelectedCategoryFilter('all');
            setSelectedSubcategoryFilter('all');
            setSelectedChildCategoryFilter('all');
            setDateFilter('');
          }}
          onSwitchTab={setActiveTab}
          onCreateTask={() => setIsCreateSelfModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {columns[activeTab].map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={setSelectedTask}
              onStart={handleStartTask}
              onClaim={handleOpenClaimModal}
              onToggleTimer={handleToggleTimer}
              formatTimeSpent={formatTimeSpent}
            />
          ))}
        </div>
      )}

      <TaskDetailsModal
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        API_BASE={API_BASE}
        currentUser={currentUser}
        handleStartTask={handleStartTask}
        handleClaimTask={handleOpenClaimModal}
        handleToggleTimer={handleToggleTimer}
        formatTimeSpent={formatTimeSpent}
        stripHtml={stripHtml}
        DynamicJsonViewer={DynamicJsonViewer}
        DescriptionRenderer={DescriptionRenderer}
        comments={comments}
        newComment={newComment}
        setNewComment={setNewComment}
        commentsLoading={commentsLoading}
        addingComment={addingComment}
        handleCommentSubmit={handleAddComment}
        handleLoadComments={fetchComments}
        handleDeleteComment={handleDeleteComment}
        handleSaveEdit={handleSaveEdit}
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editCommentText={editCommentText}
        setEditCommentText={setEditCommentText}
        commentImagePreview={commentImagePreview}
        setCommentImagePreview={setCommentImagePreview}
        commentImage={commentImage}
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
        lightboxScale={lightboxScale}
        setLightboxScale={setLightboxScale}
        zoomPos={zoomPos}
        setZoomPos={setZoomPos}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        closeLightbox={closeLightbox}
        detailsTab={detailsTab}
        setDetailsTab={setDetailsTab}
        submissionLink={submissionLink}
        setSubmissionLink={setSubmissionLink}
        handleSubmitWork={handleSubmitWork}
        isSubmittingWork={isSubmittingWork}
        commentsEndRef={commentsEndRef}
      />

      {/* Modern Claim Task Confirmation Modal */}
      <ClaimTaskModal
        task={claimModalTask}
        isOpen={!!claimModalTask}
        onClose={() => { if (!claimLoading) setClaimModalTask(null); }}
        onConfirm={handleConfirmClaim}
        loading={claimLoading}
        error={claimError}
      />

      {/* Modern Create Self-Initiated Creative Task Modal */}
      <CreateSelfTaskModal
        isOpen={isCreateSelfModalOpen}
        onClose={() => setIsCreateSelfModalOpen(false)}
        onSuccess={handleSelfTaskCreated}
        currentUser={currentUser}
        API_BASE={API_BASE}
      />

      {/* Action Notification Toast */}
      <Toast
        show={actionToast.show}
        title={actionToast.title}
        message={actionToast.message}
        type={actionToast.type}
        onClose={() => setActionToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default TasksView;
