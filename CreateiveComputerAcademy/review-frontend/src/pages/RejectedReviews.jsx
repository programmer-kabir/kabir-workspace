import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiX, FiCode, FiLink, FiChevronDown, FiAlertCircle,
  FiMessageSquare, FiSearch, FiCalendar, FiUsers,
  FiFileText, FiEye, FiFilter, FiImage, FiMaximize, FiMinimize, FiPackage, FiExternalLink, FiDownload,
  FiCheckSquare, FiCheck, FiCopy, FiClock
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';
import TaskTimeline from '../components/TaskTimeline';
import TaskDeliverablesViewer from '../components/TaskDeliverablesViewer';
import AgenticBlueprintViewer from '../components/AgenticBlueprintViewer';
import TaskCreditsTab from '../components/TaskCreditsTab';
import { downloadFile } from '../utils/fileDownloader';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────
const isColorHex = (str) => typeof str === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(str);

const formatTimeSpent = (seconds) => {
  const s = parseInt(seconds, 10);
  if (!s || s <= 0) return null;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes || 1}m`;
};

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
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
      title="Copy text"
    >
      {copied ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

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

const DescriptionRenderer = React.memo(({ htmlContent, onImageClick }) => {
  let jsonData = null;
  let textBefore = '';
  let textAfter = '';
  let cleanHtml = htmlContent || '';

  // Linkify HTML safely for non-JSON rendering
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

    // Ensure ALL anchor tags and images are not draggable to prevent text selection loss
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
    const urlRegex = /(https?:\/\/[^\s<"']+)/g;
    const linkedText = escaped.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline" draggable="false">${url}</a>`);
    return (
      <div
        className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed select-text"
        dangerouslySetInnerHTML={{ __html: linkedText }}
      />
    );
  };

  if (jsonData) {
    return (
      <div className="space-y-4 select-text">
        {textBefore && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            {formatPlainText(textBefore)}
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-100 dark:border-slate-700 relative">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
            <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiCode size={14} /> Structured Specifications
            </h4>
            <CopyButton textToCopy={JSON.stringify(jsonData, null, 2)} />
          </div>
          <DynamicJsonViewer data={jsonData} />
        </div>

        {textAfter && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            {formatPlainText(textAfter)}
          </div>
        )}
      </div>
    );
  }

  // Generate plain text from cleanHtml for copying
  let fallbackText = '';
  try {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.innerHTML = cleanHtml;
    fallbackText = fallbackDiv.textContent || fallbackDiv.innerText || '';
  } catch (e) { }

  return (
    <div className="relative selection:bg-blue-500/30 selection:text-slate-900 dark:selection:text-white select-text">
      <div className="absolute top-3 right-3 z-10">
        <CopyButton textToCopy={fallbackText} />
      </div>
      <div
        onClick={(e) => {
          if (e.target && e.target.tagName === 'IMG' && e.target.src && onImageClick) {
            e.stopPropagation();
            onImageClick(e.target.src);
          }
        }}
        className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl text-slate-700 dark:text-slate-300 text-sm border border-slate-100 dark:border-slate-700 prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:my-2 prose-headings:mb-3 prose-headings:mt-4 prose-ul:my-2 prose-li:my-0 leading-normal task-description-content pr-20 select-text"
        dangerouslySetInnerHTML={{ __html: cleanHtml || '<span class="italic !text-slate-400" style="color: #94a3b8;">No description provided.</span>' }}
      />
    </div>
  );
});

const fmtRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const formattedStr = dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(formattedStr);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
};

const fmtLogTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') || dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).toUpperCase();
};

// ── Image & Resource Renderers ───────────────────────────────────────────────
const RefImagesRenderer = ({ imagesJson }) => {
  if (!imagesJson) return null;
  let imageList = [];
  try {
    if (typeof imagesJson === 'string' && (imagesJson.trim().startsWith('[') || imagesJson.trim().startsWith('{'))) {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed)) imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
    } else if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') {
      imageList = [imagesJson.trim()];
    }
  } catch (e) {
    if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') imageList = [imagesJson.trim()];
  }
  if (imageList.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Images / Mockups</h4>
      <div className="flex flex-wrap gap-3">
        {imageList.map((img, idx) => (
          <a key={idx} href={`${API_BASE}${img}`} target="_blank" rel="noopener noreferrer"
            className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:scale-105 shrink-0 block bg-white/5">
            <img src={`${API_BASE}${img}`} className="w-full h-full object-cover" alt={`Ref ${idx + 1}`} />
          </a>
        ))}
      </div>
    </div>
  );
};

const VisualWorkImageRenderer = ({ imgPath }) => {
  if (!imgPath) return null;
  let imageList = [];
  try {
    if (typeof imgPath === 'string' && (imgPath.trim().startsWith('[') || imgPath.trim().startsWith('{'))) {
      const parsed = JSON.parse(imgPath);
      if (Array.isArray(parsed)) imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
    } else if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') {
      imageList = [imgPath.trim()];
    }
  } catch (e) {
    if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') imageList = [imgPath.trim()];
  }
  if (imageList.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-emerald-400/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        Staff Uploaded Work Image
      </h4>
      <div className="flex flex-wrap gap-3">
        {imageList.map((img, idx) => (
          <div key={idx} className="max-w-md rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg bg-white/5">
            <a href={`${API_BASE}${img}`} target="_blank" rel="noopener noreferrer">
              <img src={`${API_BASE}${img}`} className="w-full max-h-72 object-contain hover:opacity-90 transition-opacity" alt={`Staff Work ${idx + 1}`} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

const RefLinksRenderer = ({ linksJson }) => {
  if (!linksJson) return null;
  let linkList = [];
  try {
    if (typeof linksJson === 'string' && (linksJson.trim().startsWith('[') || linksJson.trim().startsWith('{'))) {
      const parsed = JSON.parse(linksJson);
      if (Array.isArray(parsed)) linkList = parsed.filter(lnk => typeof lnk === 'string' && lnk.trim() !== '');
    } else if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') {
      linkList = [linksJson.trim()];
    }
  } catch (e) {
    if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') linkList = [linksJson.trim()];
  }
  if (linkList.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Resources & Links</h4>
      <div className="flex flex-col gap-1.5 pl-1">
        {linkList.map((lnk, idx) => (
          <a key={idx} href={lnk} target="_blank" rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1.5">
            <FiLink size={12} /> {lnk}
          </a>
        ))}
      </div>
    </div>
  );
};

// ── Rejection Screenshot Renderer ─────────────────────────────────────────
const RejectionImageRenderer = ({ imgPath }) => {
  if (!imgPath || imgPath.trim() === '' || imgPath.trim() === 'null') return null;
  return (
    <div className="space-y-2">
      <h4 className="text-red-400/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
        <FiImage size={12} /> Reviewer Screenshot / Annotation
      </h4>
      <div className="rounded-xl overflow-hidden border border-red-500/25 bg-red-500/5 max-w-md">
        <a href={`${API_BASE}${imgPath}`} target="_blank" rel="noopener noreferrer">
          <img
            src={`${API_BASE}${imgPath}`}
            className="w-full max-h-64 object-contain hover:opacity-90 transition-opacity"
            alt="Rejection Screenshot"
          />
        </a>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RejectedReviews = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const requestedTaskId = searchParams.get('taskId') || searchParams.get('ttaskId') || searchParams.get('task_id') || location.state?.taskId;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [zenMode, setZenMode] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [modalTab, setModalTab] = useState('submission'); // 'submission' | 'instructions'
  const [selectedImage, setSelectedImage] = useState(null);

  const [systemSettings, setSystemSettings] = useState({
    reviewer_delivery_bonus: 5,
    reviewer_approval_credit: 2,
    reviewer_rejection_credit: 1,
    staff_rejection_penalty: 1,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/settings/get_system_settings.php`);
        if (res.data?.status === 'success' && res.data.settings) {
          setSystemSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      }
    };
    loadSettings();
  }, []);

  const fetchRejected = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}api/reviewer/get_rejected_reviews.php?reviewer_user_id=${currentUser.id}`
      );
      if (res.data.status === 'success') setTasks(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRejected(); }, [currentUser]);

  const handleCloseModal = () => {
    setActiveTask(null);
    setZenMode(false);
    const newParams = new URLSearchParams(searchParams);
    let changed = false;
    if (newParams.has('taskId')) { newParams.delete('taskId'); changed = true; }
    if (newParams.has('ttaskId')) { newParams.delete('ttaskId'); changed = true; }
    if (newParams.has('task_id')) { newParams.delete('task_id'); changed = true; }
    if (changed) {
      setSearchParams(newParams, { replace: true });
    }
  };

  // Keyboard ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (activeTask && e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTask, searchParams]);

  const staffList = useMemo(() => {
    const names = {};
    tasks.forEach(t => { if (t.staff_name) names[t.staff_name] = true; });
    return Object.keys(names);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchSearch = searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.priority || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStaff = selectedStaff === '' || t.staff_name === selectedStaff;
      let matchDate = true;
      if (selectedDate !== '') {
        const taskDatePart = t.rejected_at ? t.rejected_at.split(' ')[0] : '';
        matchDate = taskDatePart === selectedDate;
      }
      return matchSearch && matchStaff && matchDate;
    });

    result.sort((a, b) => {
      const timeA = new Date((a.rejected_at || '').replace(' ', 'T') + 'Z').getTime();
      const timeB = new Date((b.rejected_at || '').replace(' ', 'T') + 'Z').getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [tasks, searchQuery, selectedStaff, selectedDate, sortOrder]);

  const openTask = async (task) => {
    setActiveTask(task);
    const taskId = task.task_id || task.id;
    if (!taskId) return;

    if (!taskLogs[taskId]) {
      setLoadingLogs(prev => ({ ...prev, [taskId]: true }));
      try {
        const res = await axios.get(`${API_BASE}api/admin/tasks/get_task_logs.php?task_id=${taskId}`);
        if (res.data.status === 'success') setTaskLogs(prev => ({ ...prev, [taskId]: res.data.data || [] }));
      } catch (e) { console.error(e); }
      finally { setLoadingLogs(prev => ({ ...prev, [taskId]: false })); }
    }
  };

  // Auto-open modal when requestedTaskId is in URL or location.state
  useEffect(() => {
    if (!requestedTaskId) return;

    // 1. Check in already loaded tasks
    const matched = tasks.find(t => String(t.task_id || t.id) === String(requestedTaskId));
    if (matched) {
      openTask(matched);
      return;
    }

    // 2. Fetch directly from API
    let isMounted = true;
    const fetchTargetTask = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/tasks/get_task_details.php?task_id=${requestedTaskId}`);
        if (isMounted && res.data.status === 'success' && res.data.data) {
          openTask(res.data.data);
        }
      } catch (err) {
        console.error('Failed to auto-open target task details in rejected:', err);
      }
    };

    fetchTargetTask();
    return () => { isMounted = false; };
  }, [requestedTaskId, tasks]);

  if (loading) return (
    <div className="mx-auto space-y-6 animate-pulse p-2">
      <div className="h-10 bg-white/5 rounded-xl w-1/4 mb-4"></div>
      <div className="h-16 bg-white/5 rounded-2xl w-full mb-6"></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-44 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FiX className="text-rose-600 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 p-1 rounded-lg" size={28} />
          Rejected Submissions
        </h1>
        <p className="text-slate-500 dark:text-white/50 text-sm mt-1">
          Tasks you sent back for revision. Staff must fix and resubmit these.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-rose-200 dark:border-red-500/20 bg-rose-50/50 dark:bg-red-500/5">
          <p className="text-rose-600 dark:text-red-400 text-3xl font-black">{tasks.length}</p>
          <p className="text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-wider mt-1">Total Rejected</p>
        </div>
        {['High', 'Medium', 'Low'].map(p => (
          <div key={p} className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-800/60">
            <p className={`text-3xl font-black ${p === 'High' ? 'text-rose-600 dark:text-red-400' : p === 'Medium' ? 'text-amber-600 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {tasks.filter(t => t.priority === p).length}
            </p>
            <p className="text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-wider mt-1">{p} Priority</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-dark-900/60">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <input
            type="text"
            placeholder="Search by title, staff or priority..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-rose-500/50 transition-all font-medium"
          />
        </div>

        {/* Staff Filter */}
        <div className="relative w-full md:w-56">
          <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
          <select
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
            className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-9 py-2.5 text-xs outline-none focus:border-rose-500/50 appearance-none transition-all cursor-pointer font-medium"
          >
            <option value="">All Staff Members</option>
            {staffList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-52">
          <FiCalendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-rose-500/50 transition-all cursor-pointer font-medium"
          />
        </div>

        {/* Sort */}
        <div className="relative w-full md:w-44">
          <FiFilter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-9 py-2.5 text-xs outline-none focus:border-rose-500/50 appearance-none transition-all cursor-pointer font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
        </div>

        {/* Clear */}
        {(searchQuery || selectedStaff || selectedDate || sortOrder !== 'newest') && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedStaff(''); setSelectedDate(''); setSortOrder('newest'); }}
            className="w-full md:w-auto shrink-0 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900/40">
          <FiFileText className="mx-auto text-slate-300 dark:text-white/20 w-12 h-12 mb-3" />
          <h2 className="text-slate-900 dark:text-white font-bold text-lg">No rejected submissions</h2>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-1">
            {tasks.length === 0 ? "Great! You haven't rejected any tasks." : "No rejected tasks match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4">
          {filteredTasks.map((t) => (
            <div
              key={t.task_id}
              onClick={() => openTask(t)}
              className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-red-500/20 hover:border-rose-400 dark:hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] relative group bg-white dark:bg-dark-900/60 shadow-xs hover:shadow-md overflow-hidden"
            >
              {/* Task Card Thumbnail Banner (like Admin Panel) */}
              {(() => {
                let firstImg = null;
                if (t.visual_image) {
                  try {
                    const parsed = Array.isArray(t.visual_image) ? t.visual_image : JSON.parse(t.visual_image);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      firstImg = parsed[0];
                    } else if (typeof parsed === 'string' && parsed) {
                      firstImg = parsed;
                    }
                  } catch (e) {
                    if (typeof t.visual_image === 'string' && t.visual_image.trim()) {
                      const cleaned = t.visual_image.replace(/[\[\]"]/g, '').split(',')[0].trim();
                      if (cleaned) firstImg = cleaned;
                    }
                  }
                }
                if (!firstImg && t.final_image_url) firstImg = t.final_image_url;
                if (!firstImg && t.ref_image) firstImg = t.ref_image;
                if (!firstImg && (t.deliverables || t.files)) {
                  try {
                    const files = typeof (t.deliverables || t.files) === 'string' ? JSON.parse(t.deliverables || t.files) : (t.deliverables || t.files);
                    if (Array.isArray(files)) {
                      const imgF = files.find(f => {
                        const p = typeof f === 'string' ? f : (f?.file_path || f?.path || f?.url || '');
                        return /\.(png|jpe?g|webp|gif|svg)$/i.test(p);
                      });
                      if (imgF) firstImg = typeof imgF === 'string' ? imgF : (imgF.file_path || imgF.path || imgF.url);
                    }
                  } catch (e) { }
                }

                const srcUrl = firstImg
                  ? (firstImg.startsWith('http') ? firstImg : `${API_BASE}${firstImg.startsWith('/') ? firstImg.substring(1) : firstImg}`)
                  : '/no-image-placeholder.jpg';

                return (
                  <div className="w-[calc(100%+2.5rem)] h-36 -mt-5 -mx-5 mb-3.5 bg-slate-900 border-b border-rose-500/20 overflow-hidden relative flex-shrink-0">
                    {firstImg ? (
                      <div className="relative w-full h-full overflow-hidden bg-slate-950/20">
                        <img
                          src={srcUrl}
                          alt="Task Work"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain bg-slate-900/40 group-hover:scale-105 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/no-image-placeholder.jpg';
                            e.currentTarget.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="relative w-full h-full overflow-hidden bg-slate-900/80">
                        <img
                          src="/no-image-placeholder.jpg"
                          alt="No Image Available"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/80 backdrop-blur-md shadow-sm">
                        Rejected
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 z-10 shadow-md">
                      <FiEye size={10} /> Inspect
                    </div>
                  </div>
                );
              })()}

              <div>
                {/* Top row: Avatar + Priority */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-rose-500/30">
                    {t.staff_avatar
                      ? <img src={`${API_BASE}${t.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                      : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400">{t.staff_name?.[0]}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-white text-xs font-bold truncate leading-tight">{t.staff_name}</p>
                    <p className="text-slate-500 dark:text-white/40 text-[10px] truncate mt-0.5">{t.department_name}</p>
                  </div>
                </div>

                {/* Task title */}
                <h3 className="text-slate-900 dark:text-white font-bold text-sm line-clamp-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {t.title}
                </h3>

                {/* Rejection reason preview */}
                {t.rejection_reason && (
                  <div className="mt-2.5 p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-500/20 flex items-start gap-1.5">
                    <FiMessageSquare size={12} className="text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">{t.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-4 text-[11px]">
                <span className="text-slate-400 dark:text-white/40 flex items-center gap-1 font-medium">
                  <FiCalendar size={12} /> {fmtRelativeTime(t.rejected_at)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${t.priority === 'High' ? 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-500/10'
                    : t.priority === 'Medium' ? 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-500/10'
                      : 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                    }`}>{t.priority}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform border-l border-slate-200 dark:border-white/10 pl-2">
                    Inspect <FiEye size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {activeTask && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center animate-fade-in ${zenMode ? 'p-0' : 'p-4 lg:p-6'}`}>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 transition-colors duration-500 ${zenMode ? 'bg-dark-950' : 'bg-black/75 backdrop-blur-md'}`}
            onClick={handleCloseModal}
          />

          {/* Modal Container */}
          <div className={`relative z-10 glass rounded-3xl border border-slate-200 dark:border-red-500/20 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 bg-white dark:bg-dark-900 ${zenMode ? 'w-screen h-screen rounded-none border-0' : 'w-full max-w-[1500px] h-[90vh] max-h-[90vh]'
            }`}>

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/90 dark:bg-dark-900/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-red-500/30">
                  {activeTask.staff_avatar
                    ? <img src={`${API_BASE}${activeTask.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                    : <span className="w-full h-full flex items-center justify-center text-sm font-bold text-rose-600 dark:text-rose-400">{activeTask.staff_name?.[0]}</span>
                  }
                </div>
                <div>
                  <h2 className="text-slate-900 dark:text-white font-bold text-sm leading-tight">{activeTask.staff_name}</h2>
                  <p className="text-slate-500 dark:text-white/50 text-[11px] mt-0.5 flex items-center gap-1.5 font-medium">
                    {activeTask.department_name}
                    <span className="text-slate-300 dark:text-white/20">•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Rejected {fmtRelativeTime(activeTask.rejected_at)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${activeTask.priority === 'High' ? 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10'
                  : activeTask.priority === 'Medium' ? 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                  }`}>{activeTask.priority} Priority</span>

                <button
                  onClick={() => setZenMode(!zenMode)}
                  className="text-slate-400 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  title="Toggle Zen Mode"
                >
                  {zenMode ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                </button>

                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-800 dark:text-white/40 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6 overscroll-contain">
              {/* Task Title */}
              <div className="space-y-2">
                <h1 className="text-slate-900 dark:text-white font-extrabold text-xl lg:text-2xl leading-snug tracking-tight">{activeTask.title}</h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-3 py-1 rounded-full shadow-2xs">
                  <FiX size={13} className="stroke-[3]" /> Rejected Submission
                </span>
              </div>

              {/* ── Rejection Reason BOX (highlighted & ultra high contrast in both themes) ── */}
              {activeTask.rejection_reason && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        <FiMessageSquare size={14} />
                      </span>
                      <span>Rejection Reason & Revision Feedback</span>
                    </h3>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Action Required</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#ffffff] dark:bg-dark-900/90 border border-rose-200 dark:border-rose-500/20 text-slate-900 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-medium select-text shadow-xs">
                    {activeTask.rejection_reason}
                  </div>
                  {/* Rejection Screenshot */}
                  {activeTask.rejection_image && (
                    <RejectionImageRenderer imgPath={activeTask.rejection_image} />
                  )}
                </div>
              )}

              {/* 2-Tab Navigation + Reviewer QA & Staff Penalty Info */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setModalTab('submission')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer ${modalTab === 'submission'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <FiPackage size={15} className={modalTab === 'submission' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/40'} />
                    <span>Submitted Deliverables</span>
                    {activeTask.submissions && activeTask.submissions.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-900 dark:text-emerald-200">
                        {activeTask.submissions.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('instructions')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer ${modalTab === 'instructions'
                      ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/40 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <FiFileText size={15} className={modalTab === 'instructions' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-white/40'} />
                    <span>Task Brief & Instructions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('credits')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer ${modalTab === 'credits'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <FaCoins size={14} className={modalTab === 'credits' ? 'text-amber-500' : 'text-slate-400 dark:text-white/40'} />
                    <span>Credits & Rewards</span>
                  </button>
                </div>

                {/* Reviewer QA Reward & Staff Penalty Badges */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Reviewer QA Credit Earned */}
                  <button
                    type="button"
                    onClick={() => setModalTab('credits')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 font-bold text-xs shadow-xs hover:bg-amber-200/80 dark:hover:border-amber-500/60 transition-all cursor-pointer"
                    title="Click to view full credit breakdown"
                  >
                    <FaCoins size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300/80">Reviewer QA:</span>
                    <span className="font-black text-amber-950 dark:text-amber-200">
                      +{systemSettings.reviewer_rejection_credit || 1} Credit{(systemSettings.reviewer_rejection_credit || 1) > 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Staff Deduction Penalty */}
                  <button
                    type="button"
                    onClick={() => setModalTab('credits')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100/80 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-300 font-bold text-xs shadow-xs hover:bg-rose-200/80 dark:hover:border-rose-500/60 transition-all cursor-pointer"
                    title="Click to view full staff credit & penalty history"
                  >
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400/80">Staff Penalty:</span>
                    <span className="font-black text-rose-950 dark:text-rose-200">
                      -{systemSettings.staff_rejection_penalty || 1} Credit{(systemSettings.staff_rejection_penalty || 1) > 1 ? 's' : ''}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Active Tab Content */}
                <div className="lg:col-span-2 space-y-6">
                  {modalTab === 'submission' ? (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Task Deliverables (Cloudflare R2 Direct Submissions + Links) */}
                      <TaskDeliverablesViewer
                        submissions={activeTask.submissions}
                        submissionLink={activeTask.submission_link}
                        totalTimeSpent={activeTask.total_time_spent}
                        submittedAt={activeTask.submitted_at}
                        onImageClick={(url) => setSelectedImage(url)}
                      />

                      {/* Legacy Staff Work Image */}
                      <VisualWorkImageRenderer imgPath={activeTask.visual_image} />
                    </div>
                  ) : modalTab === 'credits' ? (
                    <div className="animate-in fade-in duration-200">
                      <TaskCreditsTab task={activeTask} />
                    </div>
                  ) : (
                    /* ── TAB 2: TASK BRIEF & INSTRUCTIONS ── */
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Pre-assigned Drive Folder / Cloud Proof Link */}
                      {activeTask.submission_link && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                              <FiLink size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Assigned Submission Folder / Cloud Link
                              </h4>
                              <a
                                href={activeTask.submission_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-300 hover:underline truncate block mt-0.5 font-mono"
                              >
                                {activeTask.submission_link}
                              </a>
                            </div>
                          </div>
                          <a
                            href={activeTask.submission_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-slate-950 transition-all shrink-0"
                            title="Open External Link"
                          >
                            <FiExternalLink size={16} />
                          </a>
                        </div>
                      )}

                      {/* Quick Info & Meta Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Assigned Date */}
                        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <FiCalendar className="text-blue-500 dark:text-blue-400" /> Assigned Date
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {new Date(activeTask.assign_date || activeTask.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        {/* Deadline */}
                        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <FiClock className="text-amber-500 dark:text-amber-400" /> Deadline
                          </p>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {activeTask.deadline
                              ? new Date(activeTask.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'No deadline'}
                            {activeTask.deadline_time && (
                              <span className="ml-1.5 text-xs text-slate-500 dark:text-white/50">
                                {new Date('1970-01-01T' + activeTask.deadline_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Working Time */}
                        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <FiClock className="text-purple-500 dark:text-purple-400" /> Working Time
                            </span>
                            {activeTask.total_time_spent > 0 && Number(activeTask.total_time_spent) < 120 && (
                              <span className="text-[9px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                ⚡ Fast Submit
                              </span>
                            )}
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm">
                            {formatTimeSpent(activeTask.total_time_spent) || '0m'}
                          </p>
                        </div>
                      </div>

                      {/* Reference Materials (Images & Links) */}
                      {(activeTask.ref_links || activeTask.ref_image || activeTask.visual_image) && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <FiImage className="text-purple-500 dark:text-purple-400" size={14} /> Reference Materials
                          </h4>

                          {/* Reference Links */}
                          {activeTask.ref_links && (() => {
                            let links = [];
                            try {
                              const parsed = JSON.parse(activeTask.ref_links);
                              links = Array.isArray(parsed) ? parsed : [activeTask.ref_links];
                            } catch {
                              links = [activeTask.ref_links];
                            }
                            links = links.filter(l => l && typeof l === 'string' && l.trim());
                            if (links.length === 0) return null;

                            return (
                              <div className="space-y-2">
                                {links.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400 hover:underline bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl transition-all"
                                  >
                                    <FiLink size={14} /> <span>{link}</span>
                                  </a>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Target Visual Images */}
                          {activeTask.visual_image && (() => {
                            let imgs = [];
                            try {
                              const parsed = JSON.parse(activeTask.visual_image);
                              imgs = Array.isArray(parsed) ? parsed : [activeTask.visual_image];
                            } catch {
                              imgs = [activeTask.visual_image];
                            }
                            imgs = imgs.filter(img => img && typeof img === 'string' && img.trim());
                            if (imgs.length === 0) return null;

                            return (
                              <div className="space-y-2 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                                <p className="text-[11px] font-bold text-slate-600 dark:text-white/50 uppercase tracking-wider flex items-center gap-2">
                                  <FiImage size={13} className="text-blue-500 dark:text-blue-400" /> Target Visual Image
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  {imgs.map((imgUrl, idx) => {
                                    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                                    return (
                                      <div
                                        key={idx}
                                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-black/40 hover:border-blue-400 transition-all group aspect-video"
                                      >
                                        <img
                                          src={fullUrl}
                                          alt={`Visual ${idx + 1}`}
                                          onClick={() => setSelectedImage(fullUrl)}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                        />
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(fullUrl);
                                            }}
                                            className="p-2 rounded-xl bg-black/70 hover:bg-emerald-600 text-white transition-all shadow-lg backdrop-blur-sm flex items-center gap-1 text-xs font-bold"
                                            title="Download Original High-Res Image"
                                          >
                                            <FiDownload size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Reference Images */}
                          {activeTask.ref_image && (() => {
                            let imgs = [];
                            try {
                              const parsed = JSON.parse(activeTask.ref_image);
                              imgs = Array.isArray(parsed) ? parsed : [activeTask.ref_image];
                            } catch {
                              imgs = [activeTask.ref_image];
                            }
                            imgs = imgs.filter(img => img && typeof img === 'string' && img.trim());
                            if (imgs.length === 0) return null;

                            return (
                              <div className="space-y-2 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                                <p className="text-[11px] font-bold text-slate-600 dark:text-white/50 uppercase tracking-wider flex items-center gap-2">
                                  <FiImage size={13} className="text-purple-500 dark:text-purple-400" /> Reference Brief Images ({imgs.length})
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                                  {imgs.map((imgUrl, idx) => {
                                    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                                    return (
                                      <div
                                        key={idx}
                                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 hover:border-purple-400 transition-all group aspect-video"
                                      >
                                        <img
                                          src={fullUrl}
                                          alt={`Reference ${idx + 1}`}
                                          onClick={() => setSelectedImage(fullUrl)}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                        />
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(fullUrl);
                                            }}
                                            className="p-1.5 rounded-xl bg-black/70 hover:bg-emerald-600 text-white transition-all shadow-lg backdrop-blur-sm flex items-center gap-1 text-xs font-bold"
                                            title="Download Original High-Res Image"
                                          >
                                            <FiDownload size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Sub-tasks / Checklist Section */}
                      {activeTask.checklists && Array.isArray(activeTask.checklists) && activeTask.checklists.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <FiCheckSquare className="text-blue-500 dark:text-blue-400" size={14} /> Sub-tasks & Checklist
                          </h4>
                          <div className="grid gap-2">
                            {activeTask.checklists.map((cl, idx) => {
                              const isCompleted = cl.is_completed === true || cl.is_completed === 1 || cl.is_completed === '1' || String(cl.is_completed).toLowerCase() === 'true';
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${isCompleted
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-slate-50 dark:bg-dark-800/60 border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200'
                                    }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${isCompleted
                                      ? 'bg-emerald-500 border-emerald-500 text-[#ffffff] shadow-xs'
                                      : 'border-slate-300 dark:border-dark-600 bg-[#ffffff] dark:bg-dark-800'
                                      }`}
                                  >
                                    {isCompleted ? (
                                      <FiCheck size={12} className="text-[#ffffff] stroke-[3]" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-xs bg-slate-300 dark:bg-slate-600" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs font-medium ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                                      }`}
                                  >
                                    {cl.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Specifications & Description */}
                      <div className="space-y-3">
                        {activeTask.blueprint_variants && activeTask.blueprint_variants.length > 0 ? (
                          <AgenticBlueprintViewer variants={activeTask.blueprint_variants} />
                        ) : (
                          <>
                            <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                              <FiFileText className="text-blue-500 dark:text-blue-400" size={14} /> Task Description & Specifications
                            </h4>
                            <DescriptionRenderer
                              htmlContent={activeTask.description}
                              onImageClick={(url) => setSelectedImage(url.startsWith('http') ? url : `${API_BASE}${url}`)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Checklist, Ref Images, Links, Logs */}
                <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6">
                  {modalTab === 'submission' && (
                    <>
                      {/* Checklist */}
                      {activeTask.checklists && Array.isArray(activeTask.checklists) && activeTask.checklists.length > 0 && (
                        <div>
                          <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Checklist Status</h4>
                          <div className="flex flex-col gap-2 pl-1">
                            {activeTask.checklists.map((item, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2 text-xs text-white/60">
                                <input
                                  type="checkbox"
                                  checked={item.is_completed}
                                  readOnly
                                  className="rounded border-white/10 bg-white/5 text-brand-500 focus:ring-0 cursor-default"
                                />
                                <span className={item.is_completed ? 'line-through text-white/30' : ''}>{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reference Images */}
                      <RefImagesRenderer imagesJson={activeTask.ref_image} />

                      {/* Reference Links */}
                      <RefLinksRenderer linksJson={activeTask.ref_links} />
                    </>
                  )}

                  {/* Task Timeline Logs */}
                  <TaskTimeline
                    logs={taskLogs[activeTask.task_id]}
                    loading={loadingLogs[activeTask.task_id]}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-dark-900/90 backdrop-blur-md flex items-center justify-center gap-3 rounded-b-3xl">
              <div className="w-full max-w-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 py-3 px-5 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <FiX size={14} className="stroke-[3]" />
                  </span>
                  <span className="text-slate-700 dark:text-white/80 text-xs font-semibold">
                    Rejected by{' '}
                    <span className="text-rose-600 dark:text-red-400 font-bold">{activeTask.reviewed_by_name || 'Reviewer'}</span>
                    {' '}{activeTask.rejected_at ? fmtRelativeTime(activeTask.rejected_at) : ''}
                  </span>
                </div>
                <span className="text-slate-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                  Awaiting Resubmission
                </span>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Close Lightbox (Esc)"
          >
            <FiX size={24} />
          </button>
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Enlarged Preview"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
            <div className="mt-4 flex items-center gap-3">
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <FiExternalLink size={14} /> Open in New Tab
              </a>
              <button
                type="button"
                onClick={() => downloadFile(selectedImage)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
              >
                <FiDownload size={14} /> Download Original
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RejectedReviews;
