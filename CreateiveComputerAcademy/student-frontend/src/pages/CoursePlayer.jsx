import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiPlay, FiCheckCircle, FiCircle, FiChevronDown, FiChevronRight,
  FiBookOpen, FiDownload, FiArrowLeft, FiArrowRight, FiAward,
  FiClock, FiFileText, FiLayers, FiMaximize2,
  FiMenu, FiX, FiCheck, FiExternalLink, FiLock, FiSearch,
  FiSidebar, FiGrid, FiCompass, FiTv, FiFolder, FiCheckSquare,
  FiEdit2, FiTrash2, FiCopy, FiMessageSquare, FiSend, FiThumbsUp,
  FiTag, FiShare2, FiHelpCircle, FiCornerDownRight, FiPlus,
  FiCode, FiList, FiZap, FiFilter, FiBook, FiPrinter,
  FiBold, FiItalic, FiSquare, FiSliders, FiLayout, FiColumns,
  FiShare, FiBookmark, FiList as FiListIcon
} from 'react-icons/fi';
import {
  HiSparkles, HiAcademicCap, HiPlay, HiLockClosed, HiCheckBadge,
  HiPencilSquare, HiChatBubbleLeftRight, HiDocumentArrowDown, HiBookmark,
  HiLightBulb, HiCommandLine, HiTag, HiOutlineDocumentText,
  HiOutlineClipboardDocumentCheck, HiOutlineSparkles, HiOutlinePrinter
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import CustomLMSPlayer, { formatTime } from '../components/CustomLMSPlayer';
import ThemeToggle from '../components/ThemeToggle';
import QuizEngine from '../components/QuizEngine';
import AssignmentEngine from '../components/AssignmentEngine';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const NOTE_TAGS = [
  { id: 'indigo', label: 'General Note', icon: <HiLightBulb size={13} />, dot: 'bg-indigo-600', ring: 'ring-indigo-500', badge: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', bg: 'bg-indigo-50/60 dark:bg-indigo-950/30', border: 'border-indigo-200/90 dark:border-indigo-800/60' },
  { id: 'emerald', label: 'Key Concept', icon: <HiSparkles size={13} />, dot: 'bg-emerald-600', ring: 'ring-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', bg: 'bg-emerald-50/60 dark:bg-emerald-950/30', border: 'border-emerald-200/90 dark:border-emerald-800/60' },
  { id: 'amber', label: 'Shortcut / Tip', icon: <FiZap size={13} />, dot: 'bg-amber-600', ring: 'ring-amber-500', badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', bg: 'bg-amber-50/60 dark:bg-amber-950/30', border: 'border-amber-200/90 dark:border-amber-800/60' },
  { id: 'rose', label: 'Important / Exam', icon: <HiBookmark size={13} />, dot: 'bg-rose-600', ring: 'ring-rose-500', badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', bg: 'bg-rose-50/60 dark:bg-rose-950/30', border: 'border-rose-200/90 dark:border-rose-800/60' },
  { id: 'purple', label: 'Code / Syntax', icon: <HiCommandLine size={13} />, dot: 'bg-purple-600', ring: 'ring-purple-500', badge: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', bg: 'bg-purple-50/60 dark:bg-purple-950/30', border: 'border-purple-200/90 dark:border-purple-800/60' },
];

// Inline parser for bold, italic, bold-italic, code, and strikethrough tags
const renderInlineStyles = (lineStr) => {
  if (!lineStr) return ' ';
  const parts = [];
  // Match bold-italic (***text***), bold (**text**), italic (*text* or _text_), code (`text`), strikethrough (~~text~~)
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|~~[^~]+~~)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(lineStr)) !== null) {
    if (match.index > lastIndex) {
      parts.push(lineStr.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('***') && token.endsWith('***') && token.length > 6) {
      parts.push(
        <strong key={match.index} className="font-black italic text-slate-900 dark:text-white">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      parts.push(
        <strong key={match.index} className="font-black text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      parts.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200 font-medium">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('_') && token.endsWith('_') && token.length > 2) {
      parts.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200 font-medium">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~') && token.length > 4) {
      parts.push(
        <span key={match.index} className="line-through text-slate-400 dark:text-slate-500">
          {token.slice(2, -2)}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < lineStr.length) {
    parts.push(lineStr.substring(lastIndex));
  }
  return parts.length > 0 ? parts : lineStr;
};

// Rich note renderer with interactive checkboxes, quotes, code, and bullets
const renderRichNoteContent = (text, noteId, onToggleCheckbox) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm font-sans leading-relaxed">
      {lines.map((line, idx) => {
        // Universal Checkbox detection: "- [ ] ", "- [] ", "[ ] ", "[] ", "- [x] ", "[x] "
        const checkboxMatch = /^\s*(?:[-*•]\s*)?\[\s*([xX]?)\s*\]\s*(.*)$/.exec(line);

        if (checkboxMatch) {
          const isDone = checkboxMatch[1].toLowerCase() === 'x';
          const taskText = checkboxMatch[2] || '';
          return (
            <div
              key={idx}
              onClick={() => onToggleCheckbox && onToggleCheckbox(noteId, text, idx, !isDone)}
              className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none group/item"
              title="Click to toggle checkbox"
            >
              <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                isDone
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover/item:border-indigo-500'
              }`}>
                {isDone && <FiCheck size={11} className="stroke-[3]" />}
              </div>
              <span className={`flex-1 transition-all ${isDone ? 'line-through text-slate-400 dark:text-slate-500 font-normal' : 'text-slate-800 dark:text-slate-100 font-medium'}`}>
                {renderInlineStyles(taskText)}
              </span>
            </div>
          );
        }

        // Callout Quote: "> text"
        if (line.trim().startsWith('>')) {
          const quoteText = line.replace(/^\s*>\s*/, '');
          return (
            <div key={idx} className="pl-3 py-1 border-l-3 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-r-xl my-1 text-slate-700 dark:text-slate-300 italic font-medium">
              {renderInlineStyles(quoteText)}
            </div>
          );
        }

        // Shortcut badge: "⚡ text"
        if (line.trim().startsWith('⚡')) {
          const textAfter = line.replace(/^\s*⚡\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 p-1.5 px-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 my-1 text-amber-950 dark:text-amber-200 text-xs sm:text-sm">
              <span className="text-sm shrink-0">⚡</span>
              <span className="font-semibold flex-1">{renderInlineStyles(textAfter)}</span>
            </div>
          );
        }

        // Concept badge: "💡 text"
        if (line.trim().startsWith('💡')) {
          const textAfter = line.replace(/^\s*💡\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 p-1.5 px-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 my-1 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm">
              <span className="text-sm shrink-0">💡</span>
              <span className="font-semibold flex-1">{renderInlineStyles(textAfter)}</span>
            </div>
          );
        }

        // Rule badge: "📌 text"
        if (line.trim().startsWith('📌')) {
          const textAfter = line.replace(/^\s*📌\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 p-1.5 px-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 my-1 text-rose-950 dark:text-rose-200 text-xs sm:text-sm">
              <span className="text-sm shrink-0">📌</span>
              <span className="font-semibold flex-1">{renderInlineStyles(textAfter)}</span>
            </div>
          );
        }

        // Bullet line: "• " or "- " or "* "
        if (/^\s*(•|-|\*)\s+(.*)/.test(line)) {
          const bulletText = line.replace(/^\s*(•|-|\*)\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
              <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">
                {renderInlineStyles(bulletText)}
              </span>
            </div>
          );
        }

        // Standard line
        return (
          <div key={idx} className="min-h-[1.2em]">
            {renderInlineStyles(line)}
          </div>
        );
      })}
    </div>
  );
};

// ── Rich Lecture Summary Markdown Parser & Renderer ──────────────────────────
const renderLectureSummary = (summaryText) => {
  if (!summaryText) {
    return (
      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed italic">
        In this class, the instructor walks through core methodologies, hands-on techniques, and practical real-world exercises. Watch with focus and execute the practice tasks side by side.
      </p>
    );
  }

  const lines = summaryText.split('\n');

  return (
    <div className="space-y-2 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();

        // 1. Empty line -> Paragraph vertical spacer
        if (!line) {
          return <div key={idx} className="h-1.5" />;
        }

        // 2. Horizontal divider: --- or *** or ___
        if (/^(\*\*\*|---|___)$/.test(line)) {
          return <hr key={idx} className="my-3.5 border-slate-200 dark:border-slate-800" />;
        }

        // 3. Headings
        // # Heading 1
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              {renderInlineStyles(line.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // ## Heading 2
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-3.5 mb-1.5">
              {renderInlineStyles(line.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        // ### Heading 3 (e.g. Course Title, Key Project Section)
        if (line.startsWith('### ')) {
          return (
            <div key={idx} className="mt-4 mb-2 p-3 rounded-2xl bg-indigo-50/75 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center gap-2.5 shadow-2xs">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                📌
              </span>
              <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                {renderInlineStyles(line.replace(/^###\s+/, ''))}
              </h4>
            </div>
          );
        }

        // #### Heading 4 (e.g. Class 1, Class 2, Modules)
        if (line.startsWith('#### ')) {
          return (
            <div key={idx} className="mt-5 mb-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 first:border-0 first:pt-0">
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider shrink-0 border border-purple-200/60 dark:border-purple-800/60">
                পাঠ / ক্লাস
              </span>
              <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {renderInlineStyles(line.replace(/^####\s+/, ''))}
              </h5>
            </div>
          );
        }

        // 4. Highlight lines for Goals/Objectives (e.g., **উদ্দেশ্য:**, **লক্ষ্য:**, ***ফাইনাল প্রজেক্ট***)
        if (/^\s*(\*\*|__)(উদ্দেশ্য|লক্ষ্য|Goal|Objective|Target):/i.test(line) || /^\s*\*\*\*.*\*\*\*$/.test(line)) {
          return (
            <div key={idx} className="p-2.5 px-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 my-2 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-2.5 shadow-2xs">
              <span className="text-sm shrink-0 mt-0.5">🎯</span>
              <div className="flex-1 font-medium leading-relaxed">
                {renderInlineStyles(line)}
              </div>
            </div>
          );
        }

        // 5. Blockquotes: > Quote
        if (line.startsWith('>')) {
          return (
            <div key={idx} className="pl-3.5 py-1.5 border-l-3 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-r-xl my-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm italic">
              {renderInlineStyles(line.replace(/^>\s*/, ''))}
            </div>
          );
        }

        // 6. Bullet points: * Item or - Item or • Item
        if (/^\s*(\*|-|•)\s+/.test(rawLine)) {
          const bulletContent = line.replace(/^(\*|-|•)\s+/, '');
          const indent = rawLine.search(/\S/);
          const isNested = indent > 1;

          return (
            <div key={idx} className={`flex items-start gap-2.5 ${isNested ? 'pl-6' : 'pl-2'} py-1 group`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1 font-medium">
                {renderInlineStyles(bulletContent)}
              </div>
            </div>
          );
        }

        // 7. Standard line / paragraph
        return (
          <p key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {renderInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
};

const CoursePlayer = () => {
  const { courseSlug, lessonSlug, courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeCourse, courses, selectCourse } = useCourse();

  const playerRef = useRef(null);
  const noteTextareaRef = useRef(null);

  // State
  const [curriculumData, setCurriculumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [markingComplete, setMarkingComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('mynotes'); // Default to mynotes for rich productivity!
  const [searchQuery, setSearchQuery] = useState('');

  // Video Time State
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // ── Personal Notebook State ───────────────────────────────────────────────
  const [personalNotes, setPersonalNotes] = useState([]);
  const [courseAllNotes, setCourseAllNotes] = useState([]);
  const [notebookScope, setNotebookScope] = useState('lesson'); // 'lesson' | 'course'
  const [notebookViewMode, setNotebookViewMode] = useState('timeline'); // 'timeline' | 'cards'
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTimestampSec, setNoteTimestampSec] = useState(0);
  const [noteTagId, setNoteTagId] = useState('indigo');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [notesFilterTag, setNotesFilterTag] = useState('all');
  const [notesSearch, setNotesSearch] = useState('');

  // ── Q&A Discussion State ──────────────────────────────────────────────────
  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [showAskBox, setShowAskBox] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionDetails, setNewQuestionDetails] = useState('');
  const [attachTimeInQuestion, setAttachTimeInQuestion] = useState(true);
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [activeReplyBoxId, setActiveReplyBoxId] = useState(null);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingReply, setSubmittingReply] = useState(false);

  const effectiveCourseIdentifier = courseSlug || courseId || activeCourse?.slug || activeCourse?.course_id || (courses.length > 0 ? (courses[0].slug || courses[0].course_id) : null);

  // Fetch full curriculum tree
  const fetchCurriculum = async (targetIdentifier) => {
    if (!targetIdentifier) return;
    try {
      setLoading(true);
      const userParam = currentUser?.id ? `&user_id=${currentUser.id}` : '';
      const res = await axios.get(`${API_BASE}api/student/courses/get_course_curriculum.php?course_id=${encodeURIComponent(targetIdentifier)}${userParam}`);

      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setCurriculumData(data);

        // Auto expand all milestones and modules
        const mExp = {};
        const modExp = {};
        (data.milestones || []).forEach(ms => {
          mExp[ms.id] = true;
          (ms.modules || []).forEach(mod => {
            modExp[mod.id] = true;
          });
        });
        setExpandedMilestones(mExp);
        setExpandedModules(modExp);

        // Flatten all lessons
        const allFlatLessons = [];
        (data.milestones || []).forEach(ms => {
          (ms.modules || []).forEach(mod => {
            (mod.lessons || []).forEach(l => {
              allFlatLessons.push(l);
            });
          });
        });

        // Find active lesson (by URL lessonSlug, or server active_lesson_id/slug, or first lesson)
        let foundLesson = null;
        if (lessonSlug) {
          foundLesson = allFlatLessons.find(l => l.slug === lessonSlug || String(l.id) === String(lessonSlug));
        }

        if (!foundLesson) {
          const targetLessonId = data.stats?.active_lesson_id;
          const targetLessonSlug = data.stats?.active_lesson_slug;
          if (targetLessonSlug) {
            foundLesson = allFlatLessons.find(l => l.slug === targetLessonSlug);
          } else if (targetLessonId) {
            foundLesson = allFlatLessons.find(l => l.id === targetLessonId);
          }
        }

        if (!foundLesson && allFlatLessons.length > 0) {
          foundLesson = allFlatLessons[0];
        }

        setActiveLesson(foundLesson);

        // Sync clean browser URL
        if (foundLesson && data.course) {
          const cSlug = data.course.slug || slugify(data.course.title);
          const lSlug = foundLesson.slug || `lesson-${foundLesson.id}`;
          window.history.replaceState(null, '', `/courses/${cSlug}/learn/${lSlug}`);
        }
      } else {
        toast.error(res.data.message || 'Failed to load course curriculum.');
      }
    } catch (err) {
      console.error('Curriculum error:', err);
      toast.error('Network error loading course content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveCourseIdentifier) {
      fetchCurriculum(effectiveCourseIdentifier);
    }
  }, [effectiveCourseIdentifier, currentUser?.id]);

  // ── Fetch Personal Notes for Active Lesson & Entire Course ─────────────────
  const fetchPersonalNotes = async () => {
    if (!currentUser?.id || !activeLesson?.id) return;
    try {
      setLoadingNotes(true);
      const res = await axios.get(`${API_BASE}api/student/courses/notes.php?user_id=${currentUser.id}&lesson_id=${activeLesson.id}`);
      if (res.data.status === 'success') {
        setPersonalNotes(res.data.data || []);
      }

      // Also fetch full course notes for comprehensive study view
      const courseIdNum = curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id;
      if (courseIdNum) {
        const cRes = await axios.get(`${API_BASE}api/student/courses/notes.php?user_id=${currentUser.id}&course_id=${courseIdNum}`);
        if (cRes.data.status === 'success') {
          setCourseAllNotes(cRes.data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching personal notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  // ── Fetch Q&A Discussions for Active Lesson ───────────────────────────────
  const fetchDiscussions = async () => {
    if (!activeLesson?.id) return;
    try {
      setLoadingDiscussions(true);
      const res = await axios.get(`${API_BASE}api/student/courses/discussions.php?lesson_id=${activeLesson.id}`);
      if (res.data.status === 'success') {
        setDiscussions(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  useEffect(() => {
    if (activeLesson?.id) {
      fetchPersonalNotes();
      fetchDiscussions();
      setNoteTimestampSec(0);
      setNewNoteText('');
      setEditingNoteId(null);
    }
  }, [activeLesson?.id, currentUser?.id]);

  // Flatten all lessons in order for Next/Previous buttons
  const allLessonsList = useMemo(() => {
    if (!curriculumData?.milestones) return [];
    const list = [];
    curriculumData.milestones.forEach(ms => {
      (ms.modules || []).forEach(mod => {
        (mod.lessons || []).forEach(les => {
          list.push({ ...les, milestoneTitle: ms.title, moduleTitle: mod.title });
        });
      });
    });
    return list;
  }, [curriculumData]);

  // Helper to distinguish video lessons from quizzes by unique item key
  const getItemKey = (item) => {
    if (!item) return '';
    if (item.item_type === 'quiz') return `quiz_${item.quiz_id || item.id}`;
    if (item.item_type === 'assignment') return `assignment_${item.assignment_id || item.id}`;
    return `lesson_${item.id}`;
  };

  // Compute Unlocked Status: Strictly sequential linear progression
  // First item is always unlocked; subsequent items unlock ONLY if ALL preceding items are completed
  const unlockedItemKeys = useMemo(() => {
    const map = {};
    if (allLessonsList.length === 0) return map;

    map[getItemKey(allLessonsList[0])] = true;

    for (let i = 0; i < allLessonsList.length; i++) {
      const currentL = allLessonsList[i];
      const currentKey = getItemKey(currentL);

      if (currentL.is_completed) {
        map[currentKey] = true;
        if (i + 1 < allLessonsList.length) {
          map[getItemKey(allLessonsList[i + 1])] = true;
        }
      } else {
        // Strict stop: if this item is not completed, no subsequent item can be unlocked
        break;
      }
    }
    return map;
  }, [allLessonsList]);

  const isItemUnlocked = (item) => {
    if (!item) return false;
    return !!unlockedItemKeys[getItemKey(item)];
  };

  // Select lesson & update clean URL in browser address bar (Enforces Lock)
  const handleSelectLesson = (les) => {
    const isUnlocked = isItemUnlocked(les);
    if (!isUnlocked) {
      toast.warning('🔒 This lesson is locked. Please complete preceding classes first!');
      return;
    }
    setActiveLesson(les);
    const cSlug = curriculumData?.course?.slug || slugify(curriculumData?.course?.title) || 'course';
    const lSlug = les.slug || `lesson-${les.id}`;
    window.history.replaceState(null, '', `/courses/${cSlug}/learn/${lSlug}`);
  };

  const activeKey = getItemKey(activeLesson);
  const currentIndex = allLessonsList.findIndex(l => getItemKey(l) === activeKey);
  const prevLesson = currentIndex > 0 ? allLessonsList[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessonsList.length - 1 ? allLessonsList[currentIndex + 1] : null;

  // Toggle Lesson Completion
  const handleToggleComplete = async (lesson, markAs = !lesson.is_completed) => {
    const isUnlocked = isItemUnlocked(lesson);
    if (!isUnlocked) {
      toast.warning('🔒 This lesson is locked. Please complete preceding classes first.');
      return;
    }

    const courseIdNum = curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id;
    if (!currentUser?.id || !courseIdNum) {
      toast.error('Please log in to track your learning progress.');
      return;
    }

    try {
      setMarkingComplete(true);
      const res = await axios.post(`${API_BASE}api/student/courses/update_lesson_progress.php`, {
        user_id: currentUser.id,
        course_id: courseIdNum,
        lesson_id: lesson.id,
        is_completed: markAs ? 1 : 0
      });

      if (res.data.status === 'success') {
        toast.success(markAs ? '🎉 Class completed! Next class unlocked 🔓' : 'Progress updated.');
        
        // Optimistically update curriculumData state
        setCurriculumData(prev => {
          if (!prev) return prev;
          let completedDelta = 0;
          const updatedMilestones = prev.milestones.map(ms => ({
            ...ms,
            modules: ms.modules.map(mod => ({
              ...mod,
              lessons: mod.lessons.map(l => {
                if (l.id === lesson.id) {
                  if (l.is_completed !== markAs) {
                    completedDelta = markAs ? 1 : -1;
                  }
                  return { ...l, is_completed: markAs };
                }
                return l;
              })
            }))
          }));

          const newCompleted = Math.max(0, (prev.stats.completed_lessons || 0) + completedDelta);
          const newPercent = prev.stats.total_lessons > 0 ? Math.round((newCompleted / prev.stats.total_lessons) * 100) : 0;

          return {
            ...prev,
            milestones: updatedMilestones,
            stats: {
              ...prev.stats,
              completed_lessons: newCompleted,
              progress_percent: newPercent
            }
          };
        });

        if (activeLesson?.id === lesson.id) {
          setActiveLesson(prev => ({ ...prev, is_completed: markAs }));
        }
      }
    } catch (err) {
      toast.error('Failed to update lesson progress.');
    } finally {
      setMarkingComplete(false);
    }
  };

  const toggleMilestone = (mId) => {
    setExpandedMilestones(prev => ({ ...prev, [mId]: !prev[mId] }));
  };

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  // ── Seek Video to exact timestamp ─────────────────────────────────────────
  const handleSeekTo = (seconds) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds);
      toast.success(`Jumped video to ${formatTime(seconds)}`);
    }
  };

  // ── Capture Current Player Timestamp ──────────────────────────────────────
  const handleCaptureTimestamp = () => {
    const sec = Math.floor(currentVideoTime || 0);
    setNoteTimestampSec(sec);
    toast.info(`Synced note to ${formatTime(sec)} ⏱️`);
    if (noteTextareaRef.current) {
      noteTextareaRef.current.focus();
    }
  };

  // ── Insert Quick Snippets / Markdown ──────────────────────────────────────
  const handleInsertSnippet = (prefix) => {
    setNewNoteText(prev => prev ? `${prev}\n${prefix}` : prefix);
    if (noteTextareaRef.current) {
      noteTextareaRef.current.focus();
    }
  };

  // ── Wrap Selected Text or Insert Formatting ───────────────────────────────
  const handleWrapFormat = (formatType) => {
    const textarea = noteTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newNoteText.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    const needsNewLine = start > 0 && newNoteText[start - 1] !== '\n';
    const prefixNewline = needsNewLine ? '\n' : '';

    switch (formatType) {
      case 'bold':
        if (selectedText) {
          replacement = `**${selectedText}**`;
          newCursorPos = end + 4;
        } else {
          replacement = '****';
          newCursorPos = start + 2; // cursor right between ** and **
        }
        break;

      case 'italic':
        if (selectedText) {
          replacement = `*${selectedText}*`;
          newCursorPos = end + 2;
        } else {
          replacement = '**';
          newCursorPos = start + 1; // cursor right between * and *
        }
        break;

      case 'code':
        if (selectedText) {
          replacement = `\`${selectedText}\``;
          newCursorPos = end + 2;
        } else {
          replacement = '``';
          newCursorPos = start + 1; // cursor right between ` and `
        }
        break;

      case 'task':
        replacement = `${prefixNewline}- [ ] ${selectedText}`;
        newCursorPos = start + replacement.length;
        break;

      case 'bullet':
        replacement = `${prefixNewline}• ${selectedText}`;
        newCursorPos = start + replacement.length;
        break;

      case 'quote':
        replacement = `${prefixNewline}> ${selectedText}`;
        newCursorPos = start + replacement.length;
        break;

      case 'shortcut':
        setNoteTagId('amber'); // Auto select Shortcut / Tip tag
        replacement = `${prefixNewline}⚡ ${selectedText}`;
        newCursorPos = start + replacement.length;
        toast.info('Category set to Shortcut / Tip ⚡');
        break;

      case 'concept':
        setNoteTagId('emerald'); // Auto select Key Concept tag
        replacement = `${prefixNewline}💡 ${selectedText}`;
        newCursorPos = start + replacement.length;
        toast.info('Category set to Key Concept 💡');
        break;

      case 'rule':
        setNoteTagId('rose'); // Auto select Important / Exam tag
        replacement = `${prefixNewline}📌 ${selectedText}`;
        newCursorPos = start + replacement.length;
        toast.info('Category set to Important / Exam 📌');
        break;

      default:
        return;
    }

    const updated = newNoteText.substring(0, start) + replacement + newNoteText.substring(end);
    setNewNoteText(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // ── Save Personal Note ────────────────────────────────────────────────────
  const handleSaveNote = async (e) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) {
      toast.error('Please type your note text.');
      return;
    }

    const courseIdNum = curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id;
    if (!currentUser?.id || !courseIdNum || !activeLesson?.id) {
      toast.error('Please log in to save notes.');
      return;
    }

    const finalSec = noteTimestampSec > 0 ? noteTimestampSec : Math.floor(currentVideoTime || 0);

    try {
      setSavingNote(true);
      const res = await axios.post(`${API_BASE}api/student/courses/notes.php`, {
        action: 'create',
        user_id: currentUser.id,
        course_id: courseIdNum,
        lesson_id: activeLesson.id,
        note_text: newNoteText.trim(),
        timestamp_seconds: finalSec,
        timestamp_formatted: formatTime(finalSec),
        color_tag: noteTagId
      });

      if (res.data.status === 'success') {
        toast.success('Note saved in your notebook! 📓');
        setNewNoteText('');
        setNoteTimestampSec(0);
        fetchPersonalNotes();
      } else {
        toast.error(res.data.message || 'Failed to save note.');
      }
    } catch (err) {
      toast.error('Error saving personal note.');
    } finally {
      setSavingNote(false);
    }
  };

  // ── Delete Personal Note ──────────────────────────────────────────────────
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/student/courses/notes.php`, {
        action: 'delete',
        user_id: currentUser.id,
        note_id: noteId
      });
      if (res.data.status === 'success') {
        toast.success('Note removed.');
        setPersonalNotes(prev => prev.filter(n => n.id !== noteId));
        setCourseAllNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (err) {
      toast.error('Failed to delete note.');
    }
  };

  // ── Update Personal Note ──────────────────────────────────────────────────
  const handleUpdateNote = async (noteId) => {
    if (!editNoteText.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}api/student/courses/notes.php`, {
        action: 'update',
        user_id: currentUser.id,
        note_id: noteId,
        note_text: editNoteText.trim()
      });
      if (res.data.status === 'success') {
        toast.success('Note updated!');
        setEditingNoteId(null);
        fetchPersonalNotes();
      }
    } catch (err) {
      toast.error('Failed to update note.');
    }
  };

  // ── Interactive Checkbox Toggle Inside Saved Notes ────────────────────────
  const handleToggleNoteCheckbox = async (noteId, fullText, lineIdx, willBeDone) => {
    const lines = fullText.split('\n');
    if (lineIdx >= 0 && lineIdx < lines.length) {
      const curLine = lines[lineIdx];
      if (willBeDone) {
        lines[lineIdx] = curLine.replace(/\[\s*\]/, '[x]');
      } else {
        lines[lineIdx] = curLine.replace(/\[(x|X)\]/, '[ ]');
      }
      const updatedFullText = lines.join('\n');

      // Optimistic update
      setPersonalNotes(prev => prev.map(n => n.id === noteId ? { ...n, note_text: updatedFullText } : n));
      setCourseAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, note_text: updatedFullText } : n));

      try {
        await axios.post(`${API_BASE}api/student/courses/notes.php`, {
          action: 'update',
          user_id: currentUser.id,
          note_id: noteId,
          note_text: updatedFullText
        });
      } catch (err) {
        console.error('Failed to update checkbox status');
      }
    }
  };

  // ── Export Notes as TXT / Markdown ────────────────────────────────────────
  const handleExportNotes = () => {
    const listToExport = notebookScope === 'course' ? courseAllNotes : personalNotes;
    if (listToExport.length === 0) {
      toast.info('No notes to export.');
      return;
    }
    const content = listToExport.map(n => `[${n.timestamp_formatted || '00:00'}] ${n.lesson_title ? `(${n.lesson_title}) ` : ''}\nCategory: ${n.color_tag || 'General'}\n${n.note_text}\n-----------------------------------\n`).join('\n');
    const blob = new Blob([`# Study Notes: ${curriculumData?.course?.title || 'Creative Computer Academy'}\nStudent: ${currentUser?.name || 'Student'}\nExported Date: ${new Date().toLocaleDateString()}\nTotal Notes: ${listToExport.length}\n\n` + content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(curriculumData?.course?.title || 'course')}-study-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes exported as Markdown file! 📝');
  };

  // ── Print Study Guide ─────────────────────────────────────────────────────
  const handlePrintStudyGuide = () => {
    const notesToPrint = notebookScope === 'course' ? courseAllNotes : personalNotes;
    if (notesToPrint.length === 0) {
      toast.info('No notes available to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to generate print guide.');
      return;
    }

    const courseTitle = curriculumData?.course?.title || activeCourse?.title || 'Course Notes';
    const studentName = currentUser?.name || currentUser?.student_info?.student_name || 'Student';

    const notesHtml = notesToPrint.map((n, i) => `
      <div style="margin-bottom: 18px; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; background: #f8fafc; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 12px; color: #475569; font-weight: bold;">
          <span>#${i + 1} • ⏱️ ${n.timestamp_formatted || '00:00'} ${n.lesson_title ? `| Lecture: ${n.lesson_title}` : ''}</span>
          <span style="text-transform: uppercase; background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 9999px; font-size: 11px;">${n.color_tag || 'Note'}</span>
        </div>
        <div style="font-size: 13.5px; line-height: 1.65; color: #0f172a; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">${n.note_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div style="margin-top: 10px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 6px;">Saved: ${new Date(n.created_at).toLocaleString()}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Study Guide - ${courseTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0 0 6px 0; color: #1e1b4b; font-size: 22px; font-weight: 800; }
            .meta { font-size: 12px; color: #475569; line-height: 1.5; }
            .badge { background: #4f46e5; color: white; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>📖 Personal Study Notebook & Key Takeaways</h1>
              <div class="meta">
                <strong>Course:</strong> ${courseTitle}<br/>
                <strong>Student:</strong> ${studentName} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}
              </div>
            </div>
            <div>
              <span class="badge">${notesToPrint.length} Notes Captured</span>
            </div>
          </div>
          <div>${notesHtml}</div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Filtered Notes ────────────────────────────────────────────────────────
  const displayedNotes = useMemo(() => {
    const source = notebookScope === 'course' ? courseAllNotes : personalNotes;
    return source.filter(n => {
      const matchTag = notesFilterTag === 'all' || n.color_tag === notesFilterTag;
      const matchSearch = !notesSearch || (n.note_text && n.note_text.toLowerCase().includes(notesSearch.toLowerCase()));
      return matchTag && matchSearch;
    });
  }, [notebookScope, courseAllNotes, personalNotes, notesFilterTag, notesSearch]);

  // ── Post Q&A Question ─────────────────────────────────────────────────────
  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionTitle.trim()) {
      toast.error('Please enter a question title.');
      return;
    }

    const courseIdNum = curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id;
    if (!currentUser?.id || !courseIdNum || !activeLesson?.id) {
      toast.error('Please log in to post questions.');
      return;
    }

    try {
      setPostingQuestion(true);
      const res = await axios.post(`${API_BASE}api/student/courses/discussions.php`, {
        action: 'create_question',
        user_id: currentUser.id,
        course_id: courseIdNum,
        lesson_id: activeLesson.id,
        question_title: newQuestionTitle.trim(),
        question_details: newQuestionDetails.trim(),
        timestamp_seconds: attachTimeInQuestion ? Math.floor(currentVideoTime) : 0,
        timestamp_formatted: attachTimeInQuestion ? formatTime(Math.floor(currentVideoTime)) : null
      });

      if (res.data.status === 'success') {
        toast.success('Your question has been posted to the class discussion! 💬');
        setNewQuestionTitle('');
        setNewQuestionDetails('');
        setShowAskBox(false);
        fetchDiscussions();
      } else {
        toast.error(res.data.message || 'Failed to post question.');
      }
    } catch (err) {
      toast.error('Error posting question.');
    } finally {
      setPostingQuestion(false);
    }
  };

  // ── Post Reply to Question ────────────────────────────────────────────────
  const handlePostReply = async (discId) => {
    const text = (replyTextMap[discId] || '').trim();
    if (!text) {
      toast.error('Please enter a reply.');
      return;
    }

    try {
      setSubmittingReply(true);
      const res = await axios.post(`${API_BASE}api/student/courses/discussions.php`, {
        action: 'reply',
        user_id: currentUser.id,
        discussion_id: discId,
        reply_text: text
      });

      if (res.data.status === 'success') {
        toast.success('Reply added!');
        setReplyTextMap(prev => ({ ...prev, [discId]: '' }));
        setActiveReplyBoxId(null);
        fetchDiscussions();
      }
    } catch (err) {
      toast.error('Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // ── Upvote Question ───────────────────────────────────────────────────────
  const handleUpvote = async (discId) => {
    try {
      await axios.post(`${API_BASE}api/student/courses/discussions.php`, {
        action: 'upvote',
        user_id: currentUser.id,
        discussion_id: discId
      });
      setDiscussions(prev => prev.map(d => d.id === discId ? { ...d, upvotes: d.upvotes + 1 } : d));
      toast.success('Upvoted!');
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-[#070b14] flex flex-col items-center justify-center text-slate-800 dark:text-white space-y-4 transition-colors">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <HiAcademicCap className="text-indigo-600 dark:text-indigo-400 text-xl" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-slate-800 dark:text-slate-100">Preparing Classroom...</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Loading syllabus, notebook and video player</p>
        </div>
      </div>
    );
  }

  const course = curriculumData?.course;
  const stats = curriculumData?.stats || { progress_percent: 0, completed_lessons: 0, total_lessons: 0 };

  return (
    <div className="h-screen w-full bg-[#f8fafc] dark:bg-[#070b14] text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors selection:bg-indigo-500 selection:text-white">
      
      {/* ── TOP ULTRA-MODERN HEADER BAR ────────────────────────────────────────── */}
      <header className="h-16 shrink-0 bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30 transition-colors shadow-xs">
        {/* Left: Sidebar Toggle, Navigation & Active Course Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
              sidebarOpen
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title={sidebarOpen ? "Hide Curriculum Sidebar" : "Show Curriculum Sidebar"}
          >
            <FiSidebar size={17} />
            <span className="hidden xl:inline text-xs font-bold">Curriculum</span>
          </button>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white text-xs font-bold transition-all shrink-0 shadow-xs"
            title="Return to Student Dashboard"
          >
            <FiArrowLeft size={14} />
            <span className="hidden sm:inline">Portal</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* Active Course Badge & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {course?.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt=""
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-xs font-black text-xs">
                <FiBookOpen size={16} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">
                {course?.title || 'Learning Classroom'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-mono border border-indigo-100 dark:border-indigo-900">
                  {course?.course_code || 'CCA'}
                </span>
                <span>•</span>
                <span>{stats.total_lessons} Classes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Current Lesson Indicator Badge on Wide Screens */}
        {activeLesson && (
          <div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Lesson {activeLesson.lesson_no}:</span>
            <span className="truncate max-w-xs">{activeLesson.title}</span>
          </div>
        )}

        {/* Right: Progress Tracker & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Circular/Pill Progress Display */}
          <div className="flex items-center gap-3 bg-slate-100/90 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
            <div className="w-20 sm:w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700 rounded-full shadow-xs"
                style={{ width: `${stats.progress_percent}%` }}
              ></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {stats.progress_percent}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">
                ({stats.completed_lessons}/{stats.total_lessons})
              </span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </header>

      {/* ── MAIN WORKSPACE: LEFT CURRICULUM DRAWER + RIGHT CINEMA STAGE ─────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ── 1. LEFT CURRICULUM ROADMAP (Modern Accordion) ─────────────────────── */}
        {sidebarOpen && (
          <aside className="w-80 md:w-92 lg:w-[380px] border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b101b] flex flex-col shrink-0 overflow-hidden z-20 transition-all shadow-xl shadow-slate-200/40 dark:shadow-none">
            
            {/* Sidebar Top Header with Search & Stats */}
            <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0e1424]/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/30">
                    <FiLayers size={14} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Curriculum Roadmap
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {curriculumData?.milestones?.length || 0} Milestones • {stats.completed_lessons}/{stats.total_lessons} Completed
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search lecture, topic or lesson #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Tree Accordion (Milestones -> Modules -> Video Lessons) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {(curriculumData?.milestones || []).map((ms, msIdx) => {
                const isMsExpanded = !!expandedMilestones[ms.id];
                
                // Filter modules & lessons if searching
                const filteredModules = (ms.modules || []).map(mod => {
                  const matchingLessons = (mod.lessons || []).filter(l =>
                    !searchQuery ||
                    l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(l.lesson_no).includes(searchQuery)
                  );
                  return { ...mod, filteredLessons: matchingLessons };
                }).filter(mod => !searchQuery || mod.filteredLessons.length > 0);

                if (searchQuery && filteredModules.length === 0) return null;

                const msDoneCount = (ms.modules || []).reduce((acc, m) => acc + (m.lessons || []).filter(l => l.is_completed).length, 0);
                const msTotalCount = (ms.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);
                const msProgress = msTotalCount > 0 ? Math.round((msDoneCount / msTotalCount) * 100) : 0;

                return (
                  <div
                    key={ms.id || msIdx}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1424] overflow-hidden shadow-xs transition-all hover:border-indigo-300 dark:hover:border-slate-700"
                  >
                    {/* Milestone Accordion Header */}
                    <button
                      onClick={() => toggleMilestone(ms.id)}
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs font-mono">
                          M{ms.milestone_no || msIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                            {ms.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${msProgress}%` }}></div>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                              {msDoneCount}/{msTotalCount} Done
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 shrink-0">
                        {isMsExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                      </span>
                    </button>

                    {/* Modules inside Milestone */}
                    {isMsExpanded && (
                      <div className="p-2.5 space-y-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#070b14]/60">
                        {filteredModules.map((mod, modIdx) => {
                          const isModExpanded = !!expandedModules[mod.id];
                          const lessonList = searchQuery ? mod.filteredLessons : (mod.lessons || []);

                          return (
                            <div
                              key={mod.id || modIdx}
                              className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111827] overflow-hidden shadow-2xs"
                            >
                              {/* Module Header */}
                              <button
                                onClick={() => toggleModule(mod.id)}
                                className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FiFolder size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {mod.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold shrink-0">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                    {lessonList.length} Classes
                                  </span>
                                  {isModExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                </div>
                              </button>

                              {/* Lesson Items */}
                              {isModExpanded && (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#070b14]/70">
                                  {lessonList.map((les) => {
                                    const isCurrent = getItemKey(activeLesson) === getItemKey(les);
                                    const isUnlocked = isItemUnlocked(les);

                                    return (
                                      <div
                                        key={getItemKey(les)}
                                        onClick={() => handleSelectLesson(les)}
                                        className={`p-2.5 pl-3 flex items-center justify-between gap-2.5 text-left transition-all group ${
                                          !isUnlocked
                                            ? 'opacity-55 cursor-not-allowed bg-slate-50/40 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500'
                                            : isCurrent
                                            ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-l-4 border-indigo-600 dark:border-indigo-400 text-indigo-950 dark:text-white shadow-2xs cursor-pointer'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-pointer'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          {/* Status Icon */}
                                          <div className="shrink-0">
                                            {!isUnlocked ? (
                                              <div className="w-5 h-5 rounded-md bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                <HiLockClosed size={12} />
                                              </div>
                                            ) : les.is_completed ? (
                                              <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                                                <HiCheckBadge size={15} />
                                              </div>
                                            ) : isCurrent ? (
                                              <div className={`w-5 h-5 rounded-md text-white flex items-center justify-center shadow-xs animate-pulse ${
                                                les.item_type === 'quiz' ? 'bg-purple-600 shadow-purple-600/40' : les.item_type === 'assignment' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-indigo-600 shadow-indigo-600/40'
                                              }`}>
                                                {les.item_type === 'quiz' ? (
                                                  <span className="text-[10px]">🧠</span>
                                                ) : (
                                                  <HiPlay size={12} className="ml-0.5" />
                                                )}
                                              </div>
                                            ) : les.item_type === 'quiz' ? (
                                              <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                                <span className="text-[10px]">🧠</span>
                                              </div>
                                            ) : (
                                              <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                <HiPlay size={11} className="ml-0.5" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Title & Metadata */}
                                          <div className="min-w-0">
                                            <p className={`text-xs truncate ${
                                              !isUnlocked
                                                ? 'text-slate-400 dark:text-slate-500 font-medium'
                                                : isCurrent
                                                ? les.item_type === 'quiz'
                                                  ? 'font-black text-purple-900 dark:text-purple-200'
                                                  : 'font-black text-indigo-900 dark:text-indigo-200'
                                                : 'font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                            }`}>
                                              {les.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
                                              {les.item_type === 'quiz' ? (
                                                <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                                                  <span>🧠 Assessment</span>
                                                  <span>•</span>
                                                  <span>{les.question_count || 5} Qs</span>
                                                </span>
                                              ) : (
                                                <span className="flex items-center gap-1">
                                                  <FiClock size={10} />
                                                  {les.duration_minutes || '10:00'}
                                                </span>
                                              )}
                                              {!isUnlocked && (
                                                <span className="text-amber-500/90 font-bold">🔒 Locked</span>
                                              )}
                                              {les.is_completed && (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                  {les.item_type === 'quiz' ? 'Passed ✅' : les.item_type === 'assignment' ? 'Submitted ✅' : 'Completed'}
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Mark Checkmark Button (for regular lessons) */}
                                        {isUnlocked && les.item_type !== 'quiz' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleComplete(les, !les.is_completed);
                                            }}
                                            className={`p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                                              les.is_completed
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100'
                                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                            title={les.is_completed ? "Mark as Incomplete" : "Mark as Completed"}
                                          >
                                            <FiCheck size={12} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ── 2. RIGHT MAIN WORKSPACE: CINEMA PLAYER OR INTERACTIVE QUIZ ENGINE ─── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeLesson ? (
            !isItemUnlocked(activeLesson) ? (
              <div className="max-w-lg mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0d1322] border-2 border-amber-300 dark:border-amber-700/80 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                  <HiLockClosed size={36} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    🔒 এই ক্লাসটি এখনও লকড রয়েছে
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                    ধারাবাহিক নিয়ম অনুযায়ী পূর্বের সকল ভিডিও ক্লাস এবং কুইজ সম্পন্ন না করা পর্যন্ত এই কন্টেন্টটি চালু করা যাবে না।
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstUnlocked = allLessonsList.find(l => isItemUnlocked(l) && !l.is_completed) || allLessonsList.find(l => isItemUnlocked(l)) || allLessonsList[0];
                      if (firstUnlocked) handleSelectLesson(firstUnlocked);
                    }}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    বর্তমান আনলক ক্লাসে যান →
                  </button>
                </div>
              </div>
            ) : activeLesson.item_type === 'quiz' ? (
              /* 🧠 Interactive MCQ Quiz Assessment Engine */
              <QuizEngine
                quizId={activeLesson.quiz_id || activeLesson.id}
                courseId={curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id}
                user={currentUser}
                onComplete={(qId, isPassed) => {
                  handleToggleComplete(activeLesson, isPassed);
                }}
                onNextLesson={() => nextLesson && handleSelectLesson(nextLesson)}
                hasNextLesson={!!nextLesson}
              />
            ) : activeLesson.item_type === 'assignment' ? (
              /* 📁 Hands-on Practical Project Assignment Engine */
              <AssignmentEngine
                assignment={activeLesson}
                courseId={curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id}
                user={currentUser}
                onComplete={(aId, isSubmitted) => {
                  handleToggleComplete(activeLesson, isSubmitted);
                }}
                onNextLesson={() => nextLesson && handleSelectLesson(nextLesson)}
                hasNextLesson={!!nextLesson}
              />
            ) : (
              /* 🎬 Cinema Video Player Stage & Interactive Lesson Hub */
              <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Cinema Frame Video Player Container */}
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/30 dark:shadow-black/70 border border-slate-200/90 dark:border-slate-800/90 bg-black">
                  <CustomLMSPlayer
                    ref={playerRef}
                    videoUrl={activeLesson.video_url}
                    title={activeLesson.title}
                    watermarkText={currentUser?.email || currentUser?.student_info?.student_code || 'Creative Computer Academy'}
                    onPrev={() => prevLesson && handleSelectLesson(prevLesson)}
                    onNext={() => nextLesson && handleSelectLesson(nextLesson)}
                    hasPrev={!!prevLesson}
                    hasNext={!!nextLesson}
                    onEnded={() => handleToggleComplete(activeLesson, true)}
                    onProgressUpdate={(cur, dur) => {
                      setCurrentVideoTime(cur);
                      setVideoDuration(dur);
                    }}
                  />
                </div>

                {/* Lesson Action Bar & Navigation Control */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Title & Badge */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/15 dark:from-indigo-500/25 dark:to-purple-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0 font-mono shadow-2xs">
                      Lesson {activeLesson.lesson_no}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
                        {activeLesson.title}
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                        {activeLesson.milestoneTitle || course?.title}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Mark Done, Prev, Next */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                    
                    {/* Mark as Completed */}
                    <button
                      onClick={() => handleToggleComplete(activeLesson, !activeLesson.is_completed)}
                      disabled={markingComplete}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                        activeLesson.is_completed
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {activeLesson.is_completed ? (
                        <>
                          <HiCheckBadge size={17} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Completed ✅</span>
                        </>
                      ) : (
                        <>
                          <FiCheckSquare size={15} />
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>

                    {/* Previous Lesson */}
                    <button
                      onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                      disabled={!prevLesson}
                      className={`px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer ${
                        !prevLesson ? 'opacity-35 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Next Lesson */}
                    <button
                      onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                      disabled={!nextLesson || !isItemUnlocked(nextLesson)}
                      className={`px-5 sm:px-7 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        !nextLesson || !isItemUnlocked(nextLesson)
                          ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                          : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.97]'
                      }`}
                      title={!isItemUnlocked(nextLesson) ? "Complete this class first to unlock next" : "Go to next class"}
                    >
                      <span>Next</span>
                      {!isItemUnlocked(nextLesson) && nextLesson ? (
                        <HiLockClosed size={13} className="text-slate-300" />
                      ) : (
                        <FiArrowRight size={14} />
                      )}
                    </button>
                  </div>
                </div>

              {/* ── INTERACTIVE LESSON HUB (TABS: Notes, Notebook, Q&A, Resources) ─── */}
              <div className="bg-white dark:bg-[#0d1322] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-7 space-y-6 shadow-sm transition-colors">
                
                {/* 🌟 Segmented Track Tab Selector (Linear / Apple Style) */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs gap-1.5 flex-wrap">
                    
                    {/* Tab 1: Personal Notebook (Highlighted First) */}
                    <button
                      onClick={() => setActiveTab('mynotes')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'mynotes'
                          ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <HiPencilSquare size={16} className={activeTab === 'mynotes' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                      <span>My Notebook</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                        {personalNotes.length}
                      </span>
                    </button>

                    {/* Tab 2: Lesson Notes */}
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'notes'
                          ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FiFileText size={14} className={activeTab === 'notes' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                      <span>Lecture Summary</span>
                    </button>

                    {/* Tab 3: Q&A Discussion */}
                    <button
                      onClick={() => setActiveTab('qa')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'qa'
                          ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <HiChatBubbleLeftRight size={15} className={activeTab === 'qa' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                      <span>Q&A Discussion</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {discussions.length}
                      </span>
                    </button>

                    {/* Tab 4: Resources */}
                    <button
                      onClick={() => setActiveTab('resources')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'resources'
                          ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FiDownload size={14} className={activeTab === 'resources' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                      <span>Resources</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {activeLesson.resources?.length || 0}
                      </span>
                    </button>
                  </div>

                  {activeTab === 'mynotes' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Scope Toggle: This Lesson vs All Course Notes */}
                      <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          onClick={() => setNotebookScope('lesson')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            notebookScope === 'lesson'
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          This Class ({personalNotes.length})
                        </button>
                        <button
                          onClick={() => setNotebookScope('course')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            notebookScope === 'course'
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          All Course ({courseAllNotes.length})
                        </button>
                      </div>

                      {/* View Mode Toggle: Timeline vs Grid Cards */}
                      <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          onClick={() => setNotebookViewMode('timeline')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            notebookViewMode === 'timeline'
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                          title="Timeline View"
                        >
                          <FiList size={14} />
                        </button>
                        <button
                          onClick={() => setNotebookViewMode('cards')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            notebookViewMode === 'cards'
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                          title="Card Grid View"
                        >
                          <FiGrid size={14} />
                        </button>
                      </div>

                      {/* Print Study Guide */}
                      <button
                        onClick={handlePrintStudyGuide}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Print clean formatted Study Guide"
                      >
                        <FiPrinter size={13} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden md:inline">Print Guide</span>
                      </button>

                      {/* Export Markdown */}
                      <button
                        onClick={handleExportNotes}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Export notes as Markdown (.md) document"
                      >
                        <FiDownload size={13} />
                        <span className="hidden md:inline">Export .MD</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ── TAB 1: PERSONAL NOTEBOOK (Masterclass / Notion Grade) ─────────── */}
                {activeTab === 'mynotes' && (
                  <div className="space-y-6">
                    
                    {/* 🌟 Rich Interactive Note Composer Box */}
                    <div className="rounded-3xl bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-[#0d1322] dark:via-[#090e1a] dark:to-[#0d1322] border-2 border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-sm hover:border-indigo-300 dark:hover:border-slate-700 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/20 transition-all">
                      
                      {/* Top Formatting Ribbon & Live Video Sync */}
                      <div className="px-3.5 py-2.5 bg-slate-50/90 dark:bg-[#070b14]/90 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                        
                        {/* Live Video Timestamp Sync Pill */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCaptureTimestamp}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-mono font-black flex items-center gap-2 cursor-pointer transition-all shadow-xs shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
                            title="Click to lock this note to current video time"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span>Sync Video: {formatTime(noteTimestampSec || Math.floor(currentVideoTime))}</span>
                          </button>

                          {noteTimestampSec > 0 && (
                            <button
                              type="button"
                              onClick={() => setNoteTimestampSec(0)}
                              className="text-[10px] text-slate-400 hover:text-rose-500 underline font-semibold transition-colors"
                              title="Reset timestamp"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        {/* Rich Formatting Toolset */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Bold */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('bold')}
                            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs transition-colors cursor-pointer"
                            title="Bold text (**text**)"
                          >
                            <FiBold size={13} />
                          </button>

                          {/* Italic */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('italic')}
                            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                            title="Italic text (*text*)"
                          >
                            <FiItalic size={13} />
                          </button>

                          {/* Inline Code */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('code')}
                            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs transition-colors cursor-pointer"
                            title="Code snippet (`code`)"
                          >
                            <FiCode size={13} />
                          </button>

                          {/* Task Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('task')}
                            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-xs transition-colors cursor-pointer"
                            title="Insert interactive Checklist task (- [ ])"
                          >
                            <FiCheckSquare size={13} />
                          </button>

                          {/* Bullet List */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('bullet')}
                            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                            title="Bullet point (• item)"
                          >
                            <FiList size={13} />
                          </button>

                          {/* Quote / Takeaway */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('quote')}
                            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs transition-colors cursor-pointer"
                            title="Callout Quote (> rule)"
                          >
                            <span className="font-serif font-black text-sm leading-none">❝</span>
                          </button>

                          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                          {/* Quick Preset Buttons */}
                          <button
                            type="button"
                            onClick={() => handleWrapFormat('shortcut')}
                            className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Insert Shortcut template"
                          >
                            <FiZap size={11} className="text-amber-500" />
                            <span>Shortcut</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWrapFormat('concept')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Insert Core Concept template"
                          >
                            <HiSparkles size={11} className="text-emerald-500" />
                            <span>Concept</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWrapFormat('rule')}
                            className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Insert Rule / Important template"
                          >
                            <HiBookmark size={11} className="text-rose-500" />
                            <span>Rule</span>
                          </button>
                        </div>
                      </div>

                      {/* Note Writing Surface */}
                      <div className="relative">
                        <textarea
                          ref={noteTextareaRef}
                          rows={4}
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNote();
                            }
                          }}
                          placeholder="Write your study notes, keyboard shortcuts, code snippets or checklists here... (Tip: Press Ctrl+Enter to save instantly)"
                          className="w-full p-4 sm:p-5 text-xs sm:text-sm bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none leading-relaxed font-sans"
                        />
                      </div>

                      {/* Bottom Composer Bar: Categories, Stats & Save */}
                      <div className="px-4 py-3 bg-slate-50/70 dark:bg-[#070b14]/70 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                        
                        {/* Note Mood / Category Tag Selector */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-400 mr-1">Tag:</span>
                          {NOTE_TAGS.map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setNoteTagId(t.id)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                noteTagId === t.id
                                  ? `${t.badge} shadow-xs scale-105 border font-black`
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${t.dot}`}></span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Save Action & Word Count */}
                        <div className="flex items-center gap-3">
                          {newNoteText && (
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                              {newNoteText.trim().split(/\s+/).filter(Boolean).length} words • {newNoteText.length} chars
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            Ctrl + Enter
                          </span>
                          <button
                            type="button"
                            onClick={handleSaveNote}
                            disabled={savingNote || !newNoteText.trim()}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <FiCheck size={15} />
                            <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 🔍 Filter & Search Bar for Notes */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                      {/* Tag Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                        <button
                          onClick={() => setNotesFilterTag('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            notesFilterTag === 'all'
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          All ({notebookScope === 'course' ? courseAllNotes.length : personalNotes.length})
                        </button>
                        {NOTE_TAGS.map(t => {
                          const count = (notebookScope === 'course' ? courseAllNotes : personalNotes).filter(n => n.color_tag === t.id).length;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setNotesFilterTag(t.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                notesFilterTag === t.id
                                  ? `${t.badge} shadow-xs border font-black`
                                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`}></span>
                              <span>{t.label}</span>
                              {count > 0 && <span className="text-[10px] font-mono opacity-80">({count})</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Notes Search input */}
                      <div className="relative w-full sm:w-64">
                        <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search inside saved notes..."
                          value={notesSearch}
                          onChange={(e) => setNotesSearch(e.target.value)}
                          className="w-full pl-8.5 pr-7 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-2xs"
                        />
                        {notesSearch && (
                          <button onClick={() => setNotesSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <FiX size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 📜 Notes Stream (Timeline or Grid Cards) */}
                    {loadingNotes ? (
                      <div className="py-12 text-center text-xs text-slate-400">Loading your notebook stream...</div>
                    ) : displayedNotes.length > 0 ? (
                      notebookViewMode === 'cards' ? (
                        /* ── Card Grid View Mode ── */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {displayedNotes.map((note) => {
                            const tagObj = NOTE_TAGS.find(t => t.id === note.color_tag) || NOTE_TAGS[0];
                            const isEditing = editingNoteId === note.id;

                            return (
                              <div
                                key={note.id}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all ${tagObj.bg} ${tagObj.border} flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 group`}
                              >
                                {/* Card Top Row */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Video Jump Timestamp Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleSeekTo(note.timestamp_seconds)}
                                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-slate-200/90 dark:border-slate-700 text-xs font-mono font-black flex items-center gap-1.5 shadow-2xs hover:scale-105 hover:border-indigo-500 cursor-pointer transition-all"
                                      title="Seek video to this timestamp"
                                    >
                                      <FiPlay size={10} className="fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
                                      <span>{note.timestamp_formatted || '00:00'}</span>
                                    </button>

                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${tagObj.badge}`}>
                                      {tagObj.icon}
                                      <span>{tagObj.label}</span>
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(note.note_text);
                                        toast.success('Note copied!');
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                                      title="Copy text"
                                    >
                                      <FiCopy size={13} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (isEditing) {
                                          setEditingNoteId(null);
                                        } else {
                                          setEditingNoteId(note.id);
                                          setEditNoteText(note.note_text);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                      title="Edit note"
                                    >
                                      <FiEdit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNote(note.id)}
                                      className="p-1.5 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Delete note"
                                    >
                                      <FiTrash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                {notebookScope === 'course' && note.lesson_title && (
                                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-800 truncate">
                                    Lecture {note.lesson_no}: {note.lesson_title}
                                  </div>
                                )}

                                {/* Content or Inline Editor */}
                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="space-y-2 pt-1">
                                      <textarea
                                        rows={3}
                                        value={editNoteText}
                                        onChange={(e) => setEditNoteText(e.target.value)}
                                        className="w-full p-3 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                      />
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setEditingNoteId(null)}
                                          className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateNote(note.id)}
                                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    renderRichNoteContent(note.note_text, note.id, handleToggleNoteCheckbox)
                                  )}
                                </div>

                                {/* Date Footer */}
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-between pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                                  <span>{new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* ── Timeline View Mode ── */
                        <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-indigo-200 dark:border-indigo-950 ml-3 sm:ml-4">
                          {displayedNotes.map((note) => {
                            const tagObj = NOTE_TAGS.find(t => t.id === note.color_tag) || NOTE_TAGS[0];
                            const isEditing = editingNoteId === note.id;

                            return (
                              <div key={note.id} className="relative group">
                                
                                {/* Left Timeline Node Dot */}
                                <div className={`absolute -left-[31px] sm:-left-[39px] top-4.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#0d1322] ${tagObj.dot} shadow-xs transition-transform group-hover:scale-125`}></div>

                                {/* Note Card */}
                                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${tagObj.bg} ${tagObj.border} space-y-3 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500`}>
                                  
                                  {/* Card Top Row: Timestamp, Tag Badge & Quick Actions */}
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Video Jump Timestamp Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleSeekTo(note.timestamp_seconds)}
                                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-slate-200/90 dark:border-slate-700 text-xs font-mono font-black flex items-center gap-1.5 shadow-2xs hover:scale-105 hover:border-indigo-500 cursor-pointer transition-all"
                                        title="Click to seek video directly to this timestamp"
                                      >
                                        <FiPlay size={10} className="fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
                                        <span>{note.timestamp_formatted || '00:00'}</span>
                                      </button>

                                      {/* Category Pill */}
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${tagObj.badge}`}>
                                        {tagObj.icon}
                                        <span>{tagObj.label}</span>
                                      </span>

                                      {/* If Course View: Lesson Title */}
                                      {notebookScope === 'course' && note.lesson_title && (
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800 truncate max-w-xs">
                                          Lecture {note.lesson_no}: {note.lesson_title}
                                        </span>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(note.note_text);
                                          toast.success('Note text copied!');
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                                        title="Copy text"
                                      >
                                        <FiCopy size={13} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingNoteId(null);
                                          } else {
                                            setEditingNoteId(note.id);
                                            setEditNoteText(note.note_text);
                                          }
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                        title="Edit note"
                                      >
                                        <FiEdit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="p-1.5 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                        title="Delete note"
                                      >
                                        <FiTrash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Body Content with Rich Checkbox and Markdown Parser */}
                                  {isEditing ? (
                                    <div className="space-y-2 pt-1">
                                      <textarea
                                        rows={3}
                                        value={editNoteText}
                                        onChange={(e) => setEditNoteText(e.target.value)}
                                        className="w-full p-3 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                      />
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setEditingNoteId(null)}
                                          className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateNote(note.id)}
                                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                                        >
                                          Update Note
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    renderRichNoteContent(note.note_text, note.id, handleToggleNoteCheckbox)
                                  )}

                                  {/* Date Footer */}
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-between pt-1">
                                    <span>Saved on {new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      /* 🌟 Rich Interactive Empty State with 1-Click Template Launchers */
                      <div className="py-10 px-6 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-xs">
                          <HiPencilSquare size={28} />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-sm font-black text-slate-800 dark:text-slate-200">
                            {notesSearch || notesFilterTag !== 'all' ? 'No matching notes found' : 'Your Personal Study Notebook is Ready'}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            {notesSearch || notesFilterTag !== 'all'
                              ? 'Try clearing your search query or switching tag filter to "All".'
                              : 'Take live timestamped notes while watching! Click any quick template below or start typing in the box above.'}
                          </p>
                        </div>

                        {!notesSearch && notesFilterTag === 'all' && (
                          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleWrapFormat('task');
                                noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <FiCheckSquare size={13} className="text-emerald-500" />
                              <span>+ Add Action Checklist</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleWrapFormat('shortcut');
                                noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <FiZap size={13} className="text-amber-500" />
                              <span>+ Add Keybind Shortcut</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleWrapFormat('concept');
                                noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <HiSparkles size={13} className="text-indigo-500" />
                              <span>+ Add Core Concept</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 2: Official Instructor Summary & Pro Tips ──────────────────── */}
                {activeTab === 'notes' && (
                  <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#070b14]/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
                      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-sm shadow-2xs">
                            📑
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              Lecture Summary & Key Takeaways
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              Official class notes, structured milestones, and study guide
                            </p>
                          </div>
                        </div>

                        {activeLesson.summary && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeLesson.summary);
                              toast.success('Lecture summary copied to clipboard! 📋');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                            title="Copy summary text"
                          >
                            <FiCopy size={12} />
                            <span>Copy Notes</span>
                          </button>
                        )}
                      </div>

                      {renderLectureSummary(activeLesson.summary)}
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
                        <HiSparkles size={18} />
                      </div>
                      <div>
                        <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">Instructor Pro-Tip</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          Consistent practice is key to mastery! Make sure to take notes in your personal notebook, download the attached project source files, and test each concept on your own computer before moving forward.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: Q&A & COMMUNITY DISCUSSION ─────────────────────────────── */}
                {activeTab === 'qa' && (
                  <div className="space-y-6">
                    {/* Top Action / Ask Question Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <HiChatBubbleLeftRight size={16} className="text-indigo-600 dark:text-indigo-400" />
                          <span>Class Q&A & Discussions ({discussions.length})</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Ask questions about this lecture and receive answers from instructors and fellow students.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowAskBox(!showAskBox)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <FiHelpCircle size={14} />
                        <span>{showAskBox ? 'Cancel' : 'Ask Question'}</span>
                      </button>
                    </div>

                    {/* Ask Question Form */}
                    {showAskBox && (
                      <form onSubmit={handlePostQuestion} className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-3 shadow-xs">
                        <h5 className="text-xs font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
                          <FiSend size={13} className="text-indigo-600 dark:text-indigo-400" />
                          <span>Post Your Question</span>
                        </h5>

                        <input
                          type="text"
                          required
                          value={newQuestionTitle}
                          onChange={(e) => setNewQuestionTitle(e.target.value)}
                          placeholder="What is your question? (e.g., How do we apply this gradient tool properly?)"
                          className="w-full p-3 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />

                        <textarea
                          rows={3}
                          value={newQuestionDetails}
                          onChange={(e) => setNewQuestionDetails(e.target.value)}
                          placeholder="Provide context or details so instructors can provide the exact steps..."
                          className="w-full p-3 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attachTimeInQuestion}
                              onChange={(e) => setAttachTimeInQuestion(e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span>Attach video timestamp ({formatTime(Math.floor(currentVideoTime))})</span>
                          </label>

                          <button
                            type="submit"
                            disabled={postingQuestion || !newQuestionTitle.trim()}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FiSend size={13} />
                            <span>{postingQuestion ? 'Posting...' : 'Post Question'}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Discussions List */}
                    {loadingDiscussions ? (
                      <div className="py-8 text-center text-xs text-slate-400">Loading discussions...</div>
                    ) : discussions.length > 0 ? (
                      <div className="space-y-4">
                        {discussions.map((disc) => (
                          <div
                            key={disc.id}
                            className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#070b14]/70 border border-slate-200/90 dark:border-slate-800/90 space-y-3.5 shadow-2xs"
                          >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                  {disc.author_name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {disc.author_name || 'Student'}
                                    </span>
                                    {disc.status === 'pinned' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                        📌 Pinned
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {new Date(disc.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {/* Timestamp pill if attached */}
                              {disc.timestamp_formatted && (
                                <button
                                  type="button"
                                  onClick={() => handleSeekTo(disc.timestamp_seconds)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs hover:scale-105 cursor-pointer shrink-0"
                                  title="Jump to video question timestamp"
                                >
                                  <FiPlay size={10} className="fill-indigo-600 text-indigo-600" />
                                  <span>{disc.timestamp_formatted}</span>
                                </button>
                              )}
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-1">
                              <h5 className="text-sm font-black text-slate-900 dark:text-white">
                                {disc.question_title}
                              </h5>
                              {disc.question_details && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {disc.question_details}
                                </p>
                              )}
                            </div>

                            {/* Actions (Upvote, Reply Toggle) */}
                            <div className="flex items-center gap-4 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                              <button
                                onClick={() => handleUpvote(disc.id)}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              >
                                <FiThumbsUp size={13} />
                                <span>{disc.upvotes || 0} Upvotes</span>
                              </button>

                              <button
                                onClick={() => setActiveReplyBoxId(activeReplyBoxId === disc.id ? null : disc.id)}
                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                <FiMessageSquare size={13} />
                                <span>Reply ({disc.replies?.length || 0})</span>
                              </button>
                            </div>

                            {/* Replies List */}
                            {disc.replies && disc.replies.length > 0 && (
                              <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-2.5 pt-1">
                                {disc.replies.map((rep) => (
                                  <div
                                    key={rep.id}
                                    className={`p-3 rounded-xl border ${
                                      rep.is_instructor
                                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/60 dark:to-slate-900 border-indigo-200 dark:border-indigo-800'
                                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                                    } space-y-1 shadow-2xs`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                          {rep.author_name || 'Participant'}
                                        </span>
                                        {rep.is_instructor ? (
                                          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                                            👨‍🏫 Instructor
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                            Student
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400">
                                        {new Date(rep.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                      {rep.reply_text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Box */}
                            {activeReplyBoxId === disc.id && (
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Write a reply or answer..."
                                  value={replyTextMap[disc.id] || ''}
                                  onChange={(e) => setReplyTextMap(prev => ({ ...prev, [disc.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(disc.id); }}
                                  className="flex-1 p-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => handlePostReply(disc.id)}
                                  disabled={submittingReply || !replyTextMap[disc.id]?.trim()}
                                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <FiSend size={12} />
                                  <span>Send</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-6 space-y-1.5">
                        <HiChatBubbleLeftRight size={24} className="mx-auto text-indigo-500/70" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No questions yet for this lecture</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Be the first to post a question or doubt for the instructor and classmates!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 4: Downloadable Class Assets & Handouts ────────────────────── */}
                {activeTab === 'resources' && (
                  <div className="space-y-4">
                    {activeLesson.resources && activeLesson.resources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {activeLesson.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#070b14]/70 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0 shadow-2xs">
                                <FiDownload size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                  {res.title || `Resource File #${rIdx + 1}`}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                  Click to download project asset
                                </p>
                              </div>
                            </div>
                            <FiExternalLink size={15} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-6 space-y-1.5">
                        <FiDownload size={24} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No attached files</p>
                        <p className="text-[11px] text-slate-400">All exercises are covered in the video class.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            )
          ) : (
            <div className="text-center py-24 space-y-4">
              <FiBookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">No Lesson Selected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                Please select a video lecture from the curriculum roadmap on the left to start learning.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CoursePlayer;
