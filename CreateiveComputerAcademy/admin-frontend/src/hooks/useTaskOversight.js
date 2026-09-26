import { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTaskActions } from './useTaskActions';

export const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  category: '',
  priority: 'Medium',
  assigned_to: '',
  assign_date: new Date().toISOString().split('T')[0],
  deadline: '',
  deadline_time: '',
  ref_links: [''],
  ref_image: [],
  visual_image: [],
  checklists: [],
  submission_link: '',
  custom_credit: '',
};

// Module-level in-memory cache: persists across SPA navigation with 0ms latency
let memoryTaskCache = null;
let memoryStaffCache = null;
let memoryWorkloadsCache = null;
let memoryDeptsCache = null;

export const useTaskOversight = () => {
  const { currentUser } = useAuth();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

  const [tasks, setTasksState] = useState(() => {
    if (memoryTaskCache && memoryTaskCache.length > 0) return memoryTaskCache;
    try {
      const cached = sessionStorage.getItem('cca_admin_tasks');
      const parsed = cached ? JSON.parse(cached) : [];
      if (parsed.length > 0) memoryTaskCache = parsed;
      return parsed;
    } catch {
      return [];
    }
  });

  const setTasks = (val) => {
    setTasksState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      memoryTaskCache = next;
      return next;
    });
  };

  const [staff, setStaffState] = useState(() => {
    if (memoryStaffCache && memoryStaffCache.length > 0) return memoryStaffCache;
    try {
      const cached = sessionStorage.getItem('cca_admin_staff');
      const parsed = cached ? JSON.parse(cached) : [];
      if (parsed.length > 0) memoryStaffCache = parsed;
      return parsed;
    } catch {
      return [];
    }
  });

  const setStaff = (val) => {
    setStaffState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      memoryStaffCache = next;
      return next;
    });
  };

  const [workloads, setWorkloadsState] = useState(() => {
    if (memoryWorkloadsCache && Object.keys(memoryWorkloadsCache).length > 0) return memoryWorkloadsCache;
    try {
      const cached = sessionStorage.getItem('cca_admin_workloads');
      const parsed = cached ? JSON.parse(cached) : {};
      if (Object.keys(parsed).length > 0) memoryWorkloadsCache = parsed;
      return parsed;
    } catch {
      return {};
    }
  });

  const setWorkloads = (val) => {
    setWorkloadsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      memoryWorkloadsCache = next;
      return next;
    });
  };

  const [departments, setDepartmentsState] = useState(() => {
    if (memoryDeptsCache && memoryDeptsCache.length > 0) return memoryDeptsCache;
    try {
      const cached = sessionStorage.getItem('cca_admin_depts');
      const parsed = cached ? JSON.parse(cached) : [];
      if (parsed.length > 0) memoryDeptsCache = parsed;
      return parsed;
    } catch {
      return [];
    }
  });

  const setDepartments = (val) => {
    setDepartmentsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      memoryDeptsCache = next;
      return next;
    });
  };

  const [loading, setLoading] = useState(() => {
    if (memoryTaskCache && memoryTaskCache.length > 0) return false;
    try {
      const cached = sessionStorage.getItem('cca_admin_tasks');
      return !(cached && JSON.parse(cached).length > 0);
    } catch {
      return true;
    }
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState(null);
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'staff'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all'); // 'all' | 'unassigned' | name
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('all');
  const [selectedChildCategoryFilter, setSelectedChildCategoryFilter] = useState('all');

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

  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState(null);
  const [activeHistoryLogs, setActiveHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [detailsTab, setDetailsTab] = useState('comments'); // 'comments' | 'history'
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Comments for details modal
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);

  // Reject Modal
  const [rejectTask, setRejectTask] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Lightbox and Zoom state
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxScale, setLightboxScale] = useState(2);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState(EMPTY_TASK_FORM);
  const [taskCreationMode, setTaskCreationMode] = useState('agentic');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editUiMode, setEditUiMode] = useState('agentic');

  const createEditorRef = useRef(null);
  const editEditorRef = useRef(null);

  // Auto-sync editUiMode based on task type
  useEffect(() => {
    if (editTask) {
      if (
        editTask.creation_mode === 'agentic' ||
        Boolean(editTask.blueprint_data) ||
        (Array.isArray(editTask.blueprint_variants) && editTask.blueprint_variants.length > 0)
      ) {
        setEditUiMode('agentic');
      } else {
        setEditUiMode('manual');
      }
    }
  }, [editTask?.task_id, editTask?.id]);

  // Sync default Task Creation Mode from user settings
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchUserSettings = async () => {
      try {
        const res = await axios.post(`${API_BASE}api/settings/get_user_settings.php`, {
          user_id: currentUser.id
        });
        if (res.data.status === 'success' && res.data.settings?.task_creation_mode) {
          setTaskCreationMode(res.data.settings.task_creation_mode);
        }
      } catch (e) {
        console.error('Failed to load user task settings:', e);
      }
    };
    fetchUserSettings();
  }, [currentUser, API_BASE]);

  const {
    handleDeleteComment,
    handleSaveEdit,
    handleAddComment,
    fetchTaskHistory,
    fetchComments,
    joditConfig,
    fetchTasksAndStaff,
    handleCreateTask,
    openEditModal,
    handleEditTask,
    handleDeleteTask,
    handleDuplicateTask,
    handleStatusChange,
    filteredTasks,
    stats,
    renderColumns,
    getColStyle,
    handleRejectClick,
    submitReject
  } = useTaskActions({
    apiBase: API_BASE,
    currentUser,
    setTasks,
    setComments,
    setAddingComment,
    setNewComment,
    setCommentImage,
    setCommentImagePreview,
    commentsEndRef,
    setCommentsLoading,
    setHistoryTask,
    setIsHistoryOpen,
    setLoadingHistory,
    setActiveHistoryLogs,
    setEditingCommentId,
    editCommentText,
    setEditCommentText,
    setStaff,
    setDepartments,
    setWorkloads,
    setLoading,
    newTask,
    setNewTask,
    setActionLoading,
    setIsCreateOpen,
    departments,
    EMPTY_TASK_FORM,
    staff,
    editTask,
    setEditTask,
    setIsEditOpen,
    taskToDelete,
    setTaskToDelete,
    setIsDetailsOpen,
    setDetailsTask,
    tasks,
    dateFilter,
    customDateRange,
    searchTerm,
    selectedDeptFilter,
    selectedCategoryFilter,
    selectedSubcategoryFilter,
    selectedChildCategoryFilter,
    selectedStaffFilter,
    groupBy,
    rejectTask,
    setRejectTask,
    rejectReason,
    setRejectReason
  });

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxScale(2);
    setIsHovered(false);
    setZoomPos({ x: 50, y: 50 });
  };

  // Comments logic for details modal
  useEffect(() => {
    if (detailsTask?.id) {
      fetchComments(detailsTask.id);

      const pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2'
      });
      const channel = pusher.subscribe(`task-comments-${detailsTask.id}`);

      channel.bind('new-comment', function (newComment) {
        setComments((prev) => {
          if (prev.find((c) => String(c.id) === String(newComment.id))) return prev;
          return [...prev, newComment];
        });
        setTimeout(
          () => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
          100
        );
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        pusher.disconnect();
      };
    } else {
      setComments([]);
      setNewComment('');
    }
  }, [detailsTask?.id]);

  useEffect(() => {
    fetchTasksAndStaff();
  }, []);

  return {
    // Auth & Env
    currentUser,
    API_BASE,

    // Core Data & Loading
    tasks,
    setTasks,
    staff,
    setStaff,
    workloads,
    departments,
    loading,
    actionLoading,
    setActionLoading,

    // Filters
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    activeTab,
    setActiveTab,
    groupBy,
    setGroupBy,
    searchTerm,
    setSearchTerm,
    selectedStaffFilter,
    setSelectedStaffFilter,
    selectedDeptFilter,
    setSelectedDeptFilter,
    selectedCategoryFilter,
    selectedSubcategoryFilter,
    selectedChildCategoryFilter,
    handleCategoryFilterChange,
    handleSubcategoryFilterChange,
    handleChildCategoryFilterChange,

    // Stats & Columns
    filteredTasks,
    stats,
    renderColumns,
    getColStyle,

    // History Modal
    isHistoryOpen,
    setIsHistoryOpen,
    historyTask,
    setHistoryTask,
    activeHistoryLogs,
    setActiveHistoryLogs,
    loadingHistory,
    fetchTaskHistory,

    // Details Modal & Comments
    isDetailsOpen,
    setIsDetailsOpen,
    detailsTask,
    setDetailsTask,
    detailsTab,
    setDetailsTab,
    taskToDelete,
    setTaskToDelete,
    comments,
    setComments,
    newComment,
    setNewComment,
    commentsLoading,
    addingComment,
    commentsEndRef,
    editingCommentId,
    setEditingCommentId,
    editCommentText,
    setEditCommentText,
    commentImage,
    setCommentImage,
    commentImagePreview,
    setCommentImagePreview,
    handleAddComment,
    handleSaveEdit,
    handleDeleteComment,

    // Reject Modal
    rejectTask,
    setRejectTask,
    rejectReason,
    setRejectReason,
    handleRejectClick,
    submitReject,

    // Lightbox
    lightboxImage,
    setLightboxImage,
    lightboxScale,
    setLightboxScale,
    zoomPos,
    setZoomPos,
    isHovered,
    setIsHovered,
    closeLightbox,

    // Create Modal
    isCreateOpen,
    setIsCreateOpen,
    newTask,
    setNewTask,
    taskCreationMode,
    setTaskCreationMode,
    createEditorRef,
    handleCreateTask,
    EMPTY_TASK_FORM,

    // Edit Modal
    isEditOpen,
    setIsEditOpen,
    editTask,
    setEditTask,
    editUiMode,
    setEditUiMode,
    editEditorRef,
    openEditModal,
    handleEditTask,
    handleDeleteTask,
    handleDuplicateTask,
    handleStatusChange,
    joditConfig
  };
};

export default useTaskOversight;
