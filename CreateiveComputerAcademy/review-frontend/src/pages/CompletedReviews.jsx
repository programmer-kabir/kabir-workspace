import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiClock, FiCheck, FiX, FiCode, FiLink, FiChevronDown,
  FiAlertCircle, FiMessageSquare, FiSend, FiPlusCircle,
  FiSearch, FiCalendar, FiUsers, FiFileText, FiEye, FiFilter, FiCheckCircle, FiPackage, FiExternalLink, FiDownload, FiStar, FiTag, FiAward,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiCheckSquare, FiImage, FiLayers, FiAlertTriangle, FiCopy
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';
import { HiSparkles } from 'react-icons/hi';
import MarketplaceSubmissions from '../components/MarketplaceSubmissions';
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

const getDeliverablesCount = (t) => {
  let count = 0;
  if (Array.isArray(t.submissions) && t.submissions.length > 0) count += t.submissions.length;
  else if (t.submission_link) count += 1;
  return count > 0 ? `${count} File${count > 1 ? 's' : ''}` : null;
};

const getCleanDescriptionSnippet = (htmlOrJson, maxLength = 130) => {
  if (!htmlOrJson) return null;
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlOrJson;
    let rawText = tempDiv.textContent || tempDiv.innerText || '';
    rawText = rawText.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (rawText.startsWith('{') || rawText.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawText);
        const values = Object.entries(parsed)
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(' • ');
        return values.length > maxLength ? values.substring(0, maxLength) + '…' : values;
      } catch (e) {
        return null;
      }
    }
    if (!rawText) return null;
    return rawText.length > maxLength ? rawText.substring(0, maxLength) + '…' : rawText;
  } catch (e) {
    return null;
  }
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
      <div className="flex flex-col gap-4 selection:bg-blue-500/30 selection:text-slate-900 dark:selection:text-white">
        {textBefore && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-100 dark:border-slate-700 relative select-text task-description-content">
            <div className="absolute top-3 right-3">
              <CopyButton textToCopy={textBefore} />
            </div>
            {formatPlainText(textBefore)}
          </div>
        )}

        <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
          <div className="absolute top-3 right-3 z-10">
            <CopyButton textToCopy={JSON.stringify(jsonData, null, 2)} />
          </div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <FiCode size={16} className="text-blue-500" />
              Structured JSON Data
            </h4>
          </div>
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <DynamicJsonViewer data={jsonData} />
          </div>
        </div>

        {textAfter && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-100 dark:border-slate-700 relative select-text task-description-content">
            <div className="absolute top-3 right-3">
              <CopyButton textToCopy={textAfter} />
            </div>
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

const TaskTimeline = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-xs text-white/40">
        <div className="w-3.5 h-3.5 border border-white/20 border-t-transparent rounded-full animate-spin" />
        <span>Loading logs...</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return null;
  }

  const cronLogs = [...logs].reverse();

  return (
    <div className="space-y-3">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Task History Logs</h4>

      <div className="relative pl-5 border-l border-white/5 space-y-5 ml-1 pt-1 pb-1">
        {cronLogs.map((log) => {
          const isCreation = !log.status_from;
          const statusText = isCreation
            ? "Task Created & Assigned"
            : `Status changed to: ${log.status_to}`;
          const actor = log.changed_by_name || 'ADMIN';
          const timeText = fmtLogTime(log.created_at);

          return (
            <div key={log.id} className="relative">
              <span className="absolute left-0 -translate-x-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-dark-900 block" />

              <div>
                <p className="text-white text-xs font-bold leading-tight">{statusText}</p>
                <p className="text-white/40 text-[9px] uppercase font-semibold tracking-wide mt-1">
                  BY {actor} <span className="text-white/20 px-1">•</span> {timeText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Image & Resource Renderers ───────────────────────────────────────────────
const RefImagesRenderer = ({ imagesJson }) => {
  if (!imagesJson) return null;

  let imageList = [];
  try {
    if (typeof imagesJson === 'string' && (imagesJson.trim().startsWith('[') || imagesJson.trim().startsWith('{'))) {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed)) {
        imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
      }
    } else if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') {
      imageList = [imagesJson.trim()];
    }
  } catch (e) {
    if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') {
      imageList = [imagesJson.trim()];
    }
  }

  if (imageList.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Images / Mockups</h4>
      <div className="flex flex-wrap gap-3">
        {imageList.map((img, idx) => (
          <a
            key={idx}
            href={`${API_BASE}${img}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:scale-105 shrink-0 block bg-white/5"
          >
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
      if (Array.isArray(parsed)) {
        imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
      }
    } else if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') {
      imageList = [imgPath.trim()];
    }
  } catch (e) {
    if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') {
      imageList = [imgPath.trim()];
    }
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
      if (Array.isArray(parsed)) {
        linkList = parsed.filter(lnk => typeof lnk === 'string' && lnk.trim() !== '');
      }
    } else if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') {
      linkList = [linksJson.trim()];
    }
  } catch (e) {
    if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') {
      linkList = [linksJson.trim()];
    }
  }

  if (linkList.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Resources & Links</h4>
      <div className="flex flex-col gap-1.5 pl-1">
        {linkList.map((lnk, idx) => (
          <a
            key={idx}
            href={lnk}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1.5"
          >
            <FiLink size={12} /> {lnk}
          </a>
        ))}
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const CompletedReviews = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const requestedTaskId = searchParams.get('taskId') || searchParams.get('ttaskId') || searchParams.get('task_id') || location.state?.taskId;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewTask, setActiveReviewTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [modalTab, setModalTab] = useState('submission'); // 'submission' | 'instructions'
  const [selectedImage, setSelectedImage] = useState(null);

  // Server-side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    total_pages: 1,
    from: 0,
    to: 0
  });

  const fetchCompleted = async (page = 1, limit = pageSize) => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reviewer_user_id: currentUser.id,
        page: page.toString(),
        limit: limit.toString(),
        sort: sortOrder
      });

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedStaff) params.append('staff_name', selectedStaff);
      if (selectedDate) params.append('date', selectedDate);

      const res = await axios.get(`${API_BASE}api/reviewer/get_completed_reviews.php?${params.toString()}`);
      if (res.data.status === 'success') {
        setTasks(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
          setCurrentPage(res.data.pagination.page);
        }
        if (res.data.staff_list && res.data.staff_list.length > 0) {
          setStaffList(res.data.staff_list);
        }
      }
    } catch (e) {
      console.error('Failed to fetch completed reviews', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompleted(currentPage, pageSize);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentUser, searchQuery, selectedStaff, selectedDate, sortOrder, currentPage, pageSize]);

  const selectTaskForReview = async (task) => {
    setActiveReviewTask(task);
    const taskId = task.task_id || task.id;
    if (!taskId) return;

    if (!taskLogs[taskId]) {
      setLoadingLogs(prev => ({ ...prev, [taskId]: true }));
      try {
        const res = await axios.get(`${API_BASE}api/admin/tasks/get_task_logs.php?task_id=${taskId}`);
        if (res.data.status === 'success') {
          setTaskLogs(prev => ({ ...prev, [taskId]: res.data.data || [] }));
        }
      } catch (e) {
        console.error("Failed to load logs for task " + taskId, e);
      } finally {
        setLoadingLogs(prev => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const handleCloseModal = () => {
    setActiveReviewTask(null);
    const newParams = new URLSearchParams(searchParams);
    let changed = false;
    if (newParams.has('taskId')) { newParams.delete('taskId'); changed = true; }
    if (newParams.has('ttaskId')) { newParams.delete('ttaskId'); changed = true; }
    if (newParams.has('task_id')) { newParams.delete('task_id'); changed = true; }
    if (changed) {
      setSearchParams(newParams, { replace: true });
    }
  };

  // Keyboard ESC to close active modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (activeReviewTask && e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReviewTask, searchParams]);

  // Auto-open modal when requestedTaskId is in URL or location.state
  useEffect(() => {
    if (!requestedTaskId) return;

    // 1. Check in already loaded tasks
    const matched = tasks.find(t => String(t.task_id || t.id) === String(requestedTaskId));
    if (matched) {
      selectTaskForReview(matched);
      return;
    }

    // 2. Fetch directly from API
    let isMounted = true;
    const fetchTargetTask = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/tasks/get_task_details.php?task_id=${requestedTaskId}`);
        if (isMounted && res.data.status === 'success' && res.data.data) {
          selectTaskForReview(res.data.data);
        }
      } catch (err) {
        console.error('Failed to auto-open target task details:', err);
      }
    };

    fetchTargetTask();
    return () => { isMounted = false; };
  }, [requestedTaskId, tasks]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize) => {
    const sizeNum = parseInt(newSize, 10);
    if (!isNaN(sizeNum) && sizeNum > 0) {
      setPageSize(sizeNum);
      setCurrentPage(1);
    }
  };

  const handleJumpPage = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= pagination.total_pages) {
      handlePageChange(p);
      setJumpPageInput('');
    }
  };

  const getPaginationPages = () => {
    const total = pagination.total_pages;
    const current = currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  if (loading && tasks.length === 0) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <FiCheckCircle className="text-emerald-400" size={28} /> Completed Reviews
            </h1>
            {pagination.total > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black shadow-xs">
                {pagination.total} Total
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-1 font-medium">Review task history, approved deliverables, and quality ratings.</p>
        </div>

        {pagination.total_pages > 1 && (
          <div className="flex items-center gap-2 text-xs font-bold text-white/50 bg-white/5 px-3.5 py-2 rounded-xl border border-white/5 self-start md:self-auto">
            <span>Page <strong className="text-emerald-400 font-extrabold">{pagination.page}</strong> of {pagination.total_pages}</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-3.5">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by title or priority…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium"
          />
        </div>

        {/* Staff dropdown */}
        <div className="relative w-full md:w-64">
          <FiUsers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <select
            value={selectedStaff}
            onChange={e => { setSelectedStaff(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:border-emerald-500/50 appearance-none transition-all cursor-pointer font-medium"
          >
            <option value="">All Staff Members</option>
            {staffList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-52 shrink-0">
          <FiCalendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-medium"
          />
        </div>

        {/* Sort Filter */}
        <div className="relative w-full md:w-44 shrink-0">
          <FiFilter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <select
            value={sortOrder}
            onChange={e => { setSortOrder(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:border-emerald-500/50 appearance-none transition-all cursor-pointer font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedStaff || selectedDate || sortOrder !== 'newest') && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedStaff(''); setSelectedDate(''); setSortOrder('newest'); setCurrentPage(1); }}
            className="w-full md:w-auto shrink-0 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiX size={15} /> Clear
          </button>
        )}
      </div>

      {/* Task Cards Grid */}
      {tasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <FiCheckCircle className="mx-auto text-emerald-400 w-12 h-12 bg-emerald-500/10 p-2 rounded-full mb-3" />
          <h2 className="text-white font-bold text-lg">No completed reviews found</h2>
          <p className="text-white/40 text-sm mt-1">
            {pagination.total === 0 ? "You haven't approved any tasks yet." : "No completed tasks match your filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-5">
            {tasks.map((t, index) => {
              const itemNumber = (pagination.from || 1) + index;
              return (
                <div
                  key={t.task_id}
                  onClick={() => selectTaskForReview(t)}
                  className="glass rounded-2xl p-5 lg:p-6 border border-white/10 dark:border-white/5 hover:border-emerald-500/40 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[190px] relative group overflow-hidden"
                  style={{
                    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 12px 24px -4px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {/* Subtle top light sheen on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

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
                      <div className="w-[calc(100%+2.5rem)] lg:w-[calc(100%+3rem)] h-36 sm:h-40 -mt-5 lg:-mt-6 -mx-5 lg:-mx-6 mb-3.5 bg-slate-900 border-b border-white/10 overflow-hidden relative flex-shrink-0">
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

                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 z-10 shadow-md">
                          <FiEye size={10} /> Inspect Work
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    {/* Top row: Profile & Priority */}
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/10 shadow-2xs">
                          {t.staff_avatar
                            ? <img src={`${API_BASE}${t.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                            : <span className="w-full h-full flex items-center justify-center text-sm font-black text-slate-700 dark:text-white/50">{t.staff_name?.[0]}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-black text-sm lg:text-[15px] truncate leading-tight">{t.staff_name}</p>
                          <p className="text-white/50 text-xs font-semibold truncate mt-0.5">{t.department_name || 'CCA Academy'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <span className="text-white/50 font-black text-xs">#{itemNumber}</span>
                        {t.rating && (
                          <span className="px-2 py-0.5 rounded-full border text-xs font-bold text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 flex items-center gap-1 shadow-2xs">
                            <FiStar className="fill-amber-400 text-amber-400" size={11} /> {t.rating}/5
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full border text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-2xs">
                          Completed
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-extrabold uppercase tracking-wider shadow-2xs ${t.priority === 'High' ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10'
                          : t.priority === 'Medium' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                            : 'text-slate-600 dark:text-slate-400 border-slate-500/30 bg-slate-500/10'
                          }`}>{t.priority}</span>
                      </div>
                    </div>

                    {/* Task Title */}
                    <h3 className="text-white font-extrabold text-base lg:text-[17px] line-clamp-2 mt-1.5 leading-snug group-hover:text-emerald-400 transition-colors">
                      {t.title}
                    </h3>

                    {/* Task Description Snippet */}
                    {getCleanDescriptionSnippet(t.description) && (
                      <p className="text-white/60 dark:text-white/60 text-xs line-clamp-2 mt-1.5 leading-relaxed font-normal">
                        {getCleanDescriptionSnippet(t.description)}
                      </p>
                    )}

                    {/* Middle Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {t.category && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-white/70 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                          <FiTag size={11} className="text-emerald-500" />
                          <span className="truncate max-w-[120px]">{t.category}</span>
                        </span>
                      )}

                      {formatTimeSpent(t.total_time_spent) && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                          <FiClock size={11} className="text-blue-500" />
                          <span>{formatTimeSpent(t.total_time_spent)}</span>
                        </span>
                      )}

                      {getDeliverablesCount(t) && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                          <FiPackage size={11} className="text-purple-500" />
                          <span>{getDeliverablesCount(t)}</span>
                        </span>
                      )}

                      {t.blueprint_variants?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                          <HiSparkles size={11} className="text-amber-500" />
                          <span>AI Blueprint</span>
                        </span>
                      )}
                    </div>

                    {/* Rating feedback snippet if present */}
                    {t.feedback_notes && (
                      <p className="text-xs text-slate-600 dark:text-white/60 italic line-clamp-1 mt-2.5 bg-slate-50 dark:bg-white/[0.02] px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/5">
                        "{t.feedback_notes}"
                      </p>
                    )}
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3.5 mt-3.5 text-xs">
                    <span className="text-white/50 font-bold flex items-center gap-1.5">
                      <FiCalendar size={13} className="text-white/40" /> Approved {fmtRelativeTime(t.reviewed_at || t.updated_at)}
                    </span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                      Details <FiEye size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modern Premium Server-Side Pagination Bar */}
          {pagination.total > 0 && (
            <div className="pagination-container rounded-2xl p-4 lg:p-5 flex flex-col xl:flex-row items-center justify-between gap-4 mt-6">
              {/* Left Side: Summary & Page Size Selector */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5 w-full xl:w-auto">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-slate-600 dark:text-white/70 font-medium">
                    Showing <strong className="text-slate-900 dark:text-white font-extrabold">{pagination.from}</strong> – <strong className="text-slate-900 dark:text-white font-extrabold">{pagination.to}</strong> of <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{pagination.total}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-white/50 font-semibold">Per Page:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(e.target.value)}
                      className="bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer transition-all appearance-none"
                    >
                      <option value="5">5 / page</option>
                      <option value="10">10 / page</option>
                      <option value="25">25 / page</option>
                      <option value="50">50 / page</option>
                      <option value="100">100 / page</option>
                    </select>
                    <FiChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Right Side: Page Navigation Buttons & Quick Jump */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full xl:w-auto">
                {/* Navigation Pills Group */}
                <div className="pagination-group flex items-center gap-1.5 p-1.5 rounded-2xl shadow-xs">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage <= 1 || loading}
                    className="pagination-btn p-2 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                    title="First Page"
                  >
                    <FiChevronsLeft size={15} />
                  </button>

                  {/* Previous Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="pagination-btn py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 shadow-2xs"
                    title="Previous Page"
                  >
                    <FiChevronLeft size={15} />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10 mx-0.5" />

                  {/* Numbered Page Buttons */}
                  {getPaginationPages().map((p, idx) => (
                    typeof p === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(p)}
                        className={`min-w-[34px] h-[34px] px-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center ${currentPage === p
                          ? 'pagination-btn-active'
                          : 'pagination-btn shadow-2xs'
                          }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={idx} className="px-1.5 text-slate-400 dark:text-white/30 text-xs font-bold select-none">
                        •••
                      </span>
                    )
                  ))}

                  <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10 mx-0.5" />

                  {/* Next Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.total_pages || loading}
                    className="pagination-btn py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 shadow-2xs"
                    title="Next Page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight size={15} />
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={currentPage >= pagination.total_pages || loading}
                    className="pagination-btn p-2 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                    title="Last Page"
                  >
                    <FiChevronsRight size={15} />
                  </button>
                </div>

                {/* Quick Jump Input (when more than 3 pages exist) */}
                {pagination.total_pages > 3 && (
                  <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-xs ml-1">
                    <span className="text-slate-500 dark:text-white/40 text-[11px] font-semibold hidden md:inline">Go to:</span>
                    <input
                      type="number"
                      min={1}
                      max={pagination.total_pages}
                      placeholder="#"
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      className="w-12 text-center bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-1.5 text-xs font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                    />
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detailed Completed Review Overlay Modal (Identical to PendingReviews layout) */}
      {activeReviewTask && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={handleCloseModal}
          />

          {/* Modal Container */}
          <div className="relative z-10 glass rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-[1500px] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in bg-white dark:bg-dark-900">
            {/* Modal Header */}
            <div className="p-5 lg:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/90 dark:bg-dark-900/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/10">
                  {activeReviewTask.staff_avatar
                    ? <img src={`${API_BASE}${activeReviewTask.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                    : <span className="w-full h-full flex items-center justify-center text-base font-black text-slate-700 dark:text-white/50">{activeReviewTask.staff_name?.[0]}</span>
                  }
                </div>
                <div>
                  <h2 className="text-slate-900 dark:text-white font-black text-base lg:text-lg leading-tight">{activeReviewTask.staff_name}</h2>
                  <p className="text-slate-500 dark:text-white/50 text-xs font-semibold mt-0.5">
                    {activeReviewTask.department_name} • Approved {fmtRelativeTime(activeReviewTask.reviewed_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full border text-xs font-bold ${activeReviewTask.priority === 'High' ? 'text-red-500 border-red-500/30 bg-red-500/10'
                  : activeReviewTask.priority === 'Medium' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                    : 'text-slate-600 dark:text-slate-400 border-slate-500/30 bg-slate-500/10'
                  }`}>{activeReviewTask.priority} Priority</span>

                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-800 dark:text-white/40 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6 overscroll-contain">
              {/* Task Title & Tabs Header */}
              <div className="space-y-4">
                <h1 className="text-slate-900 dark:text-white font-extrabold text-2xl lg:text-3xl leading-snug tracking-tight">
                  {activeReviewTask.title}
                </h1>

                {/* 3-Tab Navigation + Credit Summary */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setModalTab('submission')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer ${modalTab === 'submission'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                      <FiPackage size={15} className={modalTab === 'submission' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/40'} />
                      <span>Submitted Deliverables</span>
                      {activeReviewTask.submissions && activeReviewTask.submissions.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-800 dark:text-emerald-200">
                          {activeReviewTask.submissions.length}
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
                      onClick={() => setModalTab('markets')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer ${modalTab === 'markets'
                        ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/40 shadow-xs'
                        : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                      <span>📦</span>
                      <span>Marketplace Submissions</span>
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

                  {/* Credit Rewards Info */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Reviewer Reward */}
                    <button
                      type="button"
                      onClick={() => setModalTab('credits')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 font-bold text-xs shadow-xs hover:bg-amber-200/80 dark:hover:border-amber-500/60 transition-all cursor-pointer"
                      title="Click to view full credit breakdown"
                    >
                      <FaCoins size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300/80">Reviewer:</span>
                      <span className="font-black text-amber-950 dark:text-amber-200">
                        +{(activeReviewTask.final_file_url || activeReviewTask.final_image_url) ? 2 : 1} Credit
                      </span>
                    </button>

                    {/* Staff Reward */}
                    <button
                      type="button"
                      onClick={() => setModalTab('credits')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 font-bold text-xs shadow-xs hover:bg-emerald-200/80 dark:hover:border-emerald-500/60 transition-all cursor-pointer"
                      title="Click to view full staff credit & penalty history"
                    >
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300/80">Staff:</span>
                      <span className="font-black text-emerald-950 dark:text-emerald-200">
                        +{activeReviewTask.credit || activeReviewTask.category_credit || 5} Credits
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column (2/3 width): Active Tab Content */}
                <div className="lg:col-span-2 space-y-6">
                  {modalTab === 'submission' ? (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* 🌟 Reviewer Final Stock-Ready Production Delivery */}
                      {(activeReviewTask.final_file_url || activeReviewTask.final_image_url) && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-dark-900 border border-blue-500/30 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                                <HiSparkles size={18} className="text-amber-300" />
                              </span>
                              <div>
                                <h3 className="text-white font-black text-sm flex items-center gap-2">
                                  Reviewer Corrected Stock Version
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold">
                                    Stock-Ready
                                  </span>
                                </h3>
                                <p className="text-white/40 text-[10px]">
                                  Corrected by {activeReviewTask.reviewed_by_name || 'Reviewer'} • Ready for Stock Upload
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {activeReviewTask.final_image_url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = activeReviewTask.final_image_url.startsWith('http')
                                      ? activeReviewTask.final_image_url
                                      : `${API_BASE}${activeReviewTask.final_image_url}`;
                                    downloadFile(url, `${activeReviewTask.task_id}_preview.jpg`);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                                >
                                  <FiDownload size={13} /> Download Preview JPG
                                </button>
                              )}

                              {activeReviewTask.final_file_url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = activeReviewTask.final_file_url.startsWith('http')
                                      ? activeReviewTask.final_file_url
                                      : `${API_BASE}${activeReviewTask.final_file_url}`;
                                    downloadFile(url);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-950/50"
                                >
                                  <FiDownload size={14} /> Download Final Stock File
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Fix notes */}
                          {activeReviewTask.fix_notes && (
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
                              <span className="text-white/40 font-bold uppercase text-[10px] block mb-0.5">Correction Remarks:</span>
                              {activeReviewTask.fix_notes}
                            </div>
                          )}

                          {/* Final image preview */}
                          {activeReviewTask.final_image_url && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-white/40 font-bold uppercase text-[10px]">Final Stock Preview Image</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = activeReviewTask.final_image_url.startsWith('http')
                                      ? activeReviewTask.final_image_url
                                      : `${API_BASE}${activeReviewTask.final_image_url}`;
                                    downloadFile(url, `${activeReviewTask.task_id}_preview.jpg`);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 hover:underline"
                                >
                                  <FiDownload size={12} /> Download Image
                                </button>
                              </div>
                              <div className="max-w-md rounded-xl overflow-hidden border border-blue-500/20 bg-black/40">
                                <img
                                  src={activeReviewTask.final_image_url.startsWith('http') ? activeReviewTask.final_image_url : `${API_BASE}${activeReviewTask.final_image_url}`}
                                  className="w-full max-h-72 object-contain hover:opacity-90 transition-opacity cursor-pointer"
                                  alt="Final Stock Preview"
                                  onClick={() => setSelectedImage(activeReviewTask.final_image_url.startsWith('http') ? activeReviewTask.final_image_url : `${API_BASE}${activeReviewTask.final_image_url}`)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Task Deliverables (Cloudflare R2 Direct Submissions + Links) */}
                      <div className="space-y-2">
                        {(activeReviewTask.final_file_url || activeReviewTask.final_image_url) && (
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">
                            Staff Original Submission (Preserved History)
                          </p>
                        )}
                        <TaskDeliverablesViewer
                          submissions={activeReviewTask.submissions}
                          submissionLink={activeReviewTask.submission_link}
                          totalTimeSpent={activeReviewTask.total_time_spent}
                          submittedAt={activeReviewTask.submitted_at}
                          onImageClick={(url) => setSelectedImage(url)}
                        />
                      </div>

                      {/* Legacy Staff Uploaded Work Image */}
                      <VisualWorkImageRenderer imgPath={activeReviewTask.visual_image} />
                    </div>
                  ) : modalTab === 'markets' ? (
                    <div className="animate-in fade-in duration-200">
                      <MarketplaceSubmissions
                        taskId={activeReviewTask.task_id}
                        userId={activeReviewTask.staff_user_id || activeReviewTask.user_id || activeReviewTask.employee_id}
                        addedBy={currentUser?.id}
                        addedByRole="reviewer"
                        canManage={true}
                      />
                    </div>
                  ) : modalTab === 'credits' ? (
                    <div className="animate-in fade-in duration-200">
                      <TaskCreditsTab task={activeReviewTask} />
                    </div>
                  ) : (
                    /* ── TAB 2: TASK BRIEF & INSTRUCTIONS ── */
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Pre-assigned Drive Folder / Cloud Proof Link */}
                      {activeReviewTask.submission_link && (
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
                                href={activeReviewTask.submission_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-300 hover:underline truncate block mt-0.5 font-mono"
                              >
                                {activeReviewTask.submission_link}
                              </a>
                            </div>
                          </div>
                          <a
                            href={activeReviewTask.submission_link}
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
                            {new Date(activeReviewTask.assign_date || activeReviewTask.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        {/* Deadline */}
                        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <FiClock className="text-amber-500 dark:text-amber-400" /> Deadline
                          </p>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {activeReviewTask.deadline
                              ? new Date(activeReviewTask.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'No deadline'}
                            {activeReviewTask.deadline_time && (
                              <span className="ml-1.5 text-xs text-slate-500 dark:text-white/50">
                                {new Date('1970-01-01T' + activeReviewTask.deadline_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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
                            {activeReviewTask.total_time_spent > 0 && Number(activeReviewTask.total_time_spent) < 120 && (
                              <span className="text-[9px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                ⚡ Fast Submit
                              </span>
                            )}
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm">
                            {formatTimeSpent(activeReviewTask.total_time_spent) || '0m'}
                          </p>
                        </div>
                      </div>

                      {/* Reference Materials (Images & Links) */}
                      {(activeReviewTask.ref_links || activeReviewTask.ref_image || activeReviewTask.visual_image) && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <FiImage className="text-purple-500 dark:text-purple-400" size={14} /> Reference Materials
                          </h4>

                          {/* Reference Links */}
                          {activeReviewTask.ref_links && (() => {
                            let links = [];
                            try {
                              const parsed = JSON.parse(activeReviewTask.ref_links);
                              links = Array.isArray(parsed) ? parsed : [activeReviewTask.ref_links];
                            } catch {
                              links = [activeReviewTask.ref_links];
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
                          {activeReviewTask.visual_image && (() => {
                            let imgs = [];
                            try {
                              const parsed = JSON.parse(activeReviewTask.visual_image);
                              imgs = Array.isArray(parsed) ? parsed : [activeReviewTask.visual_image];
                            } catch {
                              imgs = [activeReviewTask.visual_image];
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
                          {activeReviewTask.ref_image && (() => {
                            let imgs = [];
                            try {
                              const parsed = JSON.parse(activeReviewTask.ref_image);
                              imgs = Array.isArray(parsed) ? parsed : [activeReviewTask.ref_image];
                            } catch {
                              imgs = [activeReviewTask.ref_image];
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
                      {activeReviewTask.checklists && Array.isArray(activeReviewTask.checklists) && activeReviewTask.checklists.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <FiCheckSquare className="text-blue-500 dark:text-blue-400" size={14} /> Sub-tasks & Checklist
                          </h4>
                          <div className="grid gap-2">
                            {activeReviewTask.checklists.map((cl, idx) => {
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
                        {activeReviewTask.blueprint_variants && activeReviewTask.blueprint_variants.length > 0 ? (
                          <AgenticBlueprintViewer variants={activeReviewTask.blueprint_variants} />
                        ) : (
                          <>
                            <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                              <FiFileText className="text-blue-500 dark:text-blue-400" size={14} /> Task Description & Specifications
                            </h4>
                            <DescriptionRenderer
                              htmlContent={activeReviewTask.description}
                              onImageClick={(url) => setSelectedImage(url.startsWith('http') ? url : `${API_BASE}${url}`)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column (1/3 width): Review Evaluation & References */}
                <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/5 pt-6 lg:pt-0 lg:pl-6">

                  {/* ⭐ Review Evaluation Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-brand-500/5 to-transparent border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiAward size={14} /> Review Evaluation
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black text-xs flex items-center gap-1">
                        <FiStar size={12} className="fill-amber-400 text-amber-400" /> {activeReviewTask.rating || 5} / 5 Stars
                      </span>
                    </div>

                    {/* Star display */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          size={18}
                          className={`${star <= (activeReviewTask.rating || 5)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                            : 'text-slate-300 dark:text-white/20'
                            }`}
                        />
                      ))}
                    </div>

                    {/* Reviewer Feedback Notes */}
                    {activeReviewTask.feedback_notes && (
                      <div className="p-3 rounded-xl bg-[#ffffff] dark:bg-dark-800/60 border border-amber-500/20 dark:border-white/5 text-xs text-slate-700 dark:text-white/80 leading-relaxed italic">
                        "{activeReviewTask.feedback_notes}"
                      </div>
                    )}

                    {/* Review Tags */}
                    {activeReviewTask.review_tags && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(typeof activeReviewTask.review_tags === 'string'
                          ? (activeReviewTask.review_tags.startsWith('[') ? JSON.parse(activeReviewTask.review_tags) : activeReviewTask.review_tags.split(','))
                          : activeReviewTask.review_tags
                        ).map((tag, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Task History Logs */}
                  <TaskTimeline logs={taskLogs[activeReviewTask.task_id]} loading={loadingLogs[activeReviewTask.task_id]} />
                </div>
              </div>
            </div>

            {/* Modal Footer (Sticky Bottom Action Bar) */}
            <div className="p-5 border-t border-white/5 bg-dark-900/90 backdrop-blur-md flex items-center justify-center gap-3 rounded-b-3xl">
              <div className="w-full max-w-md bg-emerald-500/10 border border-emerald-500/20 py-3 px-5 rounded-2xl flex items-center justify-center gap-2.5">
                <FiCheckCircle className="text-emerald-400 shrink-0" size={16} />
                <span className="text-white text-xs font-semibold">
                  Approved by{' '}
                  <span className="text-emerald-400 font-bold">
                    {activeReviewTask.reviewed_by_name || 'Reviewer'}
                  </span>{' '}
                  {activeReviewTask.reviewed_at ? fmtRelativeTime(activeReviewTask.reviewed_at) : ''}
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
              <a
                href={selectedImage}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
              >
                <FiDownload size={14} /> Download Original
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CompletedReviews;
