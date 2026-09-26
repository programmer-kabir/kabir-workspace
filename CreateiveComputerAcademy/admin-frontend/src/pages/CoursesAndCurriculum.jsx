import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiLayers, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiBookOpen,
  FiAward, FiFolder, FiUserCheck, FiChevronRight, FiChevronDown,
  FiGrid, FiList, FiPlay, FiClock, FiVideo, FiFileText, FiLink,
  FiExternalLink, FiEye, FiPaperclip, FiUploadCloud, FiImage,
  FiCheckCircle, FiLoader
} from 'react-icons/fi';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_COURSE = {
  id: '',
  title: '',
  course_code: '',
  category: 'Creative & Design',
  thumbnail_url: '',
  banner_url: '',
  description: '',
  duration_months: 3,
  total_classes: 36,
  fee_amount: 0,
  status: 'active'
};

const EMPTY_MILESTONE = {
  id: '',
  course_id: '',
  milestone_no: 1,
  title: '',
  description: '',
  order_index: 1,
  status: 'active'
};

const EMPTY_MODULE = {
  id: '',
  course_id: '',
  milestone_id: '',
  module_no: 1,
  title: '',
  description: '',
  duration_classes: 6,
  status: 'active'
};

const EMPTY_LESSON = {
  id: '',
  course_id: '',
  milestone_id: '',
  module_id: '',
  lesson_no: 1,
  title: '',
  video_type: 'youtube',
  video_url: '',
  duration_minutes: '10:00',
  summary: '',
  resources_json: '[]',
  is_free_preview: 0,
  status: 'active'
};

const EMPTY_ASSIGNMENT = {
  id: '',
  course_id: '',
  milestone_id: '',
  module_id: '',
  assignment_no: 1,
  title: '',
  description: '',
  total_marks: 100,
  pass_marks: 50,
  resources_json: '[]',
  order_index: 99,
  status: 'active'
};

const EMPTY_QUIZ = {
  id: '',
  course_id: '',
  milestone_id: '',
  module_id: '',
  title: '',
  description: '',
  time_limit_minutes: 10,
  passing_score_percent: 70,
  order_index: 99,
  status: 'active'
};

const EMPTY_QUESTION = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  explanation: ''
};

const CoursesAndCurriculum = () => {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'curriculum'

  // Data states
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [savingCourse, setSavingCourse] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  // Curriculum Tree State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [curriculumData, setCurriculumData] = useState(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  // Milestone Modal
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState(EMPTY_MILESTONE);
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Module Modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [savingModule, setSavingModule] = useState(false);

  // Lesson Modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [savingLesson, setSavingLesson] = useState(false);
  const [resourceInputs, setResourceInputs] = useState([{ title: '', url: '' }]);

  // Quiz Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Assignment Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT);
  const [asgResourceInputs, setAsgResourceInputs] = useState([{ title: '', url: '' }]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Video Preview Modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');

  // Modern Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    confirmVariant: 'danger',
    loading: false,
    onConfirm: null
  });

  // Fetch initial courses list
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const crsRes = await axios.get(`${API_BASE}api/admin/courses/get_courses.php`);
      if (crsRes.data.status === 'success') {
        const crsList = crsRes.data.data || [];
        setCourses(crsList);
        if (crsList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(crsList[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch full curriculum when selectedCourseId changes or when switching to curriculum tab
  const fetchCurriculum = async (cId = selectedCourseId, options = {}) => {
    if (!cId) return;
    try {
      setLoadingCurriculum(true);
      const res = await axios.get(`${API_BASE}api/student/courses/get_course_curriculum.php?course_id=${cId}`);
      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setCurriculumData(data);

        const {
          preserveExpanded = true,
          ensureOpenMilestoneId = null,
          ensureOpenModuleId = null
        } = options;

        setExpandedMilestones(prev => {
          if (preserveExpanded && Object.keys(prev).length > 0) {
            const next = { ...prev };
            if (ensureOpenMilestoneId) {
              next[ensureOpenMilestoneId] = true;
            }
            return next;
          }

          // Initial load: expand only the first milestone (or ensureOpenMilestoneId if provided)
          const mExp = {};
          (data.milestones || []).forEach((ms, idx) => {
            mExp[ms.id] = ensureOpenMilestoneId ? ms.id === ensureOpenMilestoneId : idx === 0;
          });
          if (ensureOpenMilestoneId) {
            mExp[ensureOpenMilestoneId] = true;
          }
          return mExp;
        });

        setExpandedModules(prev => {
          if (preserveExpanded && Object.keys(prev).length > 0) {
            const next = { ...prev };
            if (ensureOpenModuleId) {
              next[ensureOpenModuleId] = true;
            }
            return next;
          }

          // Initial load: expand only the first module of the first milestone
          const modExp = {};
          (data.milestones || []).forEach((ms, msIdx) => {
            (ms.modules || []).forEach((mod, modIdx) => {
              modExp[mod.id] = ensureOpenModuleId ? mod.id === ensureOpenModuleId : (msIdx === 0 && modIdx === 0);
            });
          });
          if (ensureOpenModuleId) {
            modExp[ensureOpenModuleId] = true;
          }
          return modExp;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const handleExpandAll = () => {
    if (!curriculumData?.milestones) return;
    const mExp = {};
    const modExp = {};
    curriculumData.milestones.forEach(ms => {
      mExp[ms.id] = true;
      (ms.modules || []).forEach(mod => {
        modExp[mod.id] = true;
      });
    });
    setExpandedMilestones(mExp);
    setExpandedModules(modExp);
  };

  const handleCollapseAll = () => {
    setExpandedMilestones({});
    setExpandedModules({});
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCurriculum(selectedCourseId, { preserveExpanded: false });
    }
  }, [selectedCourseId]);

  // Handle Course Image Upload (Cover or Banner)
  const handleImageUpload = async (file, type) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    const isCover = type === 'cover';
    if (isCover) setUploadingCover(true);
    else setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      formData.append('course_title', courseForm.title || '');
      formData.append('course_code', courseForm.course_code || '');

      const res = await axios.post(`${API_BASE}api/admin/courses/upload_course_media.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || `${isCover ? 'Cover' : 'Banner'} uploaded & converted to WebP!`);
        if (isCover) {
          setCourseForm(prev => ({ ...prev, thumbnail_url: res.data.url }));
        } else {
          setCourseForm(prev => ({ ...prev, banner_url: res.data.url }));
        }
      } else {
        toast.error(res.data.message || 'Failed to upload image.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network or server error during image upload.');
    } finally {
      if (isCover) setUploadingCover(false);
      else setUploadingBanner(false);
    }
  };

  // Save Course Submit
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title) {
      toast.error('Course title is required!');
      return;
    }

    try {
      setSavingCourse(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/save_course.php`, courseForm);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Course saved successfully!');
        setShowCourseModal(false);
        setCourseForm(EMPTY_COURSE);
        fetchCourses();
      } else {
        toast.error(res.data.message || 'Failed to save course.');
      }
    } catch (err) {
      toast.error('Error saving course.');
    } finally {
      setSavingCourse(false);
    }
  };

  // Save Milestone Submit
  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.title || !selectedCourseId) {
      toast.error('Milestone title and course are required!');
      return;
    }

    try {
      setSavingMilestone(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/milestones/save_milestone.php`, {
        ...milestoneForm,
        course_id: selectedCourseId
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Milestone saved!');
        const savedMsId = res.data.milestone_id || res.data.id || milestoneForm.id;
        setShowMilestoneModal(false);
        setMilestoneForm(EMPTY_MILESTONE);
        fetchCurriculum(selectedCourseId, {
          preserveExpanded: true,
          ensureOpenMilestoneId: savedMsId
        });
      } else {
        toast.error(res.data.message || 'Failed to save milestone.');
      }
    } catch (err) {
      toast.error('Error saving milestone.');
    } finally {
      setSavingMilestone(false);
    }
  };

  // Delete Milestone
  const handleDeleteMilestone = (mId, mTitle = '') => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Milestone?',
      message: `Are you sure you want to delete "${mTitle || 'this milestone'}"? Associated modules will become unassigned.`,
      confirmText: 'Delete Milestone',
      confirmVariant: 'danger',
      loading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm(prev => ({ ...prev, loading: true }));
          const res = await axios.post(`${API_BASE}api/admin/courses/milestones/delete_milestone.php`, { id: mId });
          if (res.data.status === 'success') {
            toast.success('Milestone deleted successfully.');
            setDeleteConfirm(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchCurriculum(selectedCourseId, { preserveExpanded: true });
          } else {
            toast.error(res.data.message || 'Failed to delete milestone.');
            setDeleteConfirm(prev => ({ ...prev, loading: false }));
          }
        } catch (err) {
          toast.error('Failed to delete milestone.');
          setDeleteConfirm(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // Save Module Submit
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.title || !selectedCourseId) {
      toast.error('Module title is required!');
      return;
    }

    try {
      setSavingModule(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/save_module.php`, {
        ...moduleForm,
        course_id: selectedCourseId
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Module saved!');
        const currentMsId = moduleForm.milestone_id;
        const savedModId = res.data.module_id || res.data.id || moduleForm.id;
        setShowModuleModal(false);
        setModuleForm(EMPTY_MODULE);
        fetchCurriculum(selectedCourseId, {
          preserveExpanded: true,
          ensureOpenMilestoneId: currentMsId,
          ensureOpenModuleId: savedModId
        });
      } else {
        toast.error(res.data.message || 'Failed to save module.');
      }
    } catch (err) {
      toast.error('Error saving module.');
    } finally {
      setSavingModule(false);
    }
  };

  // Save Lesson Submit
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title || !lessonForm.video_url || !lessonForm.module_id) {
      toast.error('Module, Lesson Title, and Video URL are required!');
      return;
    }

    const filteredResources = resourceInputs.filter(r => r.title.trim() && r.url.trim());

    try {
      setSavingLesson(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/lessons/save_lesson.php`, {
        ...lessonForm,
        course_id: selectedCourseId,
        resources_json: JSON.stringify(filteredResources)
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Video lesson saved!');
        const currentMsId = lessonForm.milestone_id;
        const currentModId = lessonForm.module_id;
        setShowLessonModal(false);
        setLessonForm(EMPTY_LESSON);
        fetchCurriculum(selectedCourseId, {
          preserveExpanded: true,
          ensureOpenMilestoneId: currentMsId,
          ensureOpenModuleId: currentModId
        });
      } else {
        toast.error(res.data.message || 'Failed to save lesson.');
      }
    } catch (err) {
      toast.error('Error saving lesson.');
    } finally {
      setSavingLesson(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = (lId, lTitle = '') => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Video Lesson?',
      message: `Are you sure you want to permanently delete "${lTitle || 'this video lesson'}"? This action cannot be undone.`,
      confirmText: 'Delete Lesson',
      confirmVariant: 'danger',
      loading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm(prev => ({ ...prev, loading: true }));
          const res = await axios.post(`${API_BASE}api/admin/courses/lessons/delete_lesson.php`, { id: lId });
          if (res.data.status === 'success') {
            toast.success('Lesson deleted successfully.');
            setDeleteConfirm(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchCurriculum(selectedCourseId, { preserveExpanded: true });
          } else {
            toast.error(res.data.message || 'Failed to delete lesson.');
            setDeleteConfirm(prev => ({ ...prev, loading: false }));
          }
        } catch (err) {
          toast.error('Failed to delete lesson.');
          setDeleteConfirm(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const openAddLessonModal = (mod, ms) => {
    const existingCount = (mod.lessons || []).length;
    setLessonForm({
      ...EMPTY_LESSON,
      course_id: selectedCourseId,
      milestone_id: ms?.id || mod.milestone_id || '',
      module_id: mod.id,
      lesson_no: existingCount + 1
    });
    setResourceInputs([{ title: '', url: '' }]);
    setShowLessonModal(true);
  };

  const openEditLessonModal = (les) => {
    setLessonForm({
      ...les,
      resources_json: JSON.stringify(les.resources || [])
    });
    setResourceInputs(les.resources && les.resources.length > 0 ? les.resources : [{ title: '', url: '' }]);
    setShowLessonModal(true);
  };

  // ── Quiz Assessment Handlers ─────────────────────────────────────────────
  // ── Quiz Assessment Handlers ─────────────────────────────────────────────
  const openAddQuizModal = (mod, ms) => {
    const existingCount = (mod.lessons || []).length;
    setQuizForm({
      ...EMPTY_QUIZ,
      course_id: selectedCourseId,
      milestone_id: ms?.id || mod.milestone_id || '',
      module_id: mod.id,
      title: `${mod.title} - Assessment Quiz`,
      order_index: existingCount + 1
    });
    setQuizQuestions([
      { question_text: '', question_type: 'single_choice', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', correct_answer_text: '', explanation: '', marks: 1 },
      { question_text: '', question_type: 'short_answer', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: '', correct_answer_text: '', explanation: '', marks: 1 },
      { question_text: '', question_type: 'true_false', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'true', correct_answer_text: '', explanation: '', marks: 1 }
    ]);
    setShowQuizModal(true);
  };

  const openEditQuizModal = async (quizItem) => {
    const qId = quizItem.quiz_id || quizItem.id;
    try {
      const res = await axios.get(`${API_BASE}api/admin/courses/quizzes/get_quizzes.php?id=${qId}`);
      if (res.data.status === 'success' && res.data.data) {
        const qData = res.data.data;
        setQuizForm({
          id: qData.id,
          course_id: qData.course_id,
          milestone_id: qData.milestone_id || '',
          module_id: qData.module_id,
          title: qData.title || '',
          description: qData.description || '',
          time_limit_minutes: qData.time_limit_minutes || 10,
          passing_score_percent: qData.passing_score_percent || 70,
          order_index: qData.order_index || 99,
          status: qData.status || 'active'
        });
        setQuizQuestions(
          (qData.questions && qData.questions.length > 0)
            ? qData.questions.map(q => ({
              ...q,
              question_type: q.question_type || 'single_choice',
              correct_answer_text: q.correct_answer_text || '',
              marks: q.marks || 1
            }))
            : [{ question_text: '', question_type: 'single_choice', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', correct_answer_text: '', explanation: '', marks: 1 }]
        );
        setShowQuizModal(true);
      } else {
        toast.error('Could not load quiz details.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching quiz details.');
    }
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizForm.title || !quizForm.module_id) {
      toast.error('Module and Quiz Title are required!');
      return;
    }

    const validQuestions = quizQuestions.filter(q => {
      if (!q.question_text || !q.question_text.trim()) return false;
      if (q.question_type === 'short_answer') {
        return !!(q.correct_answer_text && q.correct_answer_text.trim());
      }
      if (q.question_type === 'true_false') {
        return true;
      }
      return !!(q.option_a && q.option_a.trim());
    });

    if (validQuestions.length === 0) {
      toast.error('Please add at least 1 complete question with question text and correct answer/options.');
      return;
    }

    try {
      setSavingQuiz(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/quizzes/save_quiz.php`, {
        ...quizForm,
        course_id: selectedCourseId,
        questions: validQuestions
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Quiz Assessment saved successfully!');
        const currentMsId = quizForm.milestone_id;
        const currentModId = quizForm.module_id;
        setShowQuizModal(false);
        setQuizForm(EMPTY_QUIZ);
        setQuizQuestions([]);
        fetchCurriculum(selectedCourseId, {
          preserveExpanded: true,
          ensureOpenMilestoneId: currentMsId,
          ensureOpenModuleId: currentModId
        });
      } else {
        toast.error(res.data.message || 'Failed to save quiz.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = (qId, qTitle = '') => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Assessment Quiz?',
      message: `Are you sure you want to delete "${qTitle || 'this Quiz'}" and all of its associated questions? This action cannot be undone.`,
      confirmText: 'Delete Quiz',
      confirmVariant: 'danger',
      loading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm(prev => ({ ...prev, loading: true }));
          const res = await axios.post(`${API_BASE}api/admin/courses/quizzes/delete_quiz.php`, { id: qId });
          if (res.data.status === 'success') {
            toast.success('Quiz deleted successfully.');
            setDeleteConfirm(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchCurriculum(selectedCourseId, { preserveExpanded: true });
          } else {
            toast.error(res.data.message || 'Failed to delete quiz.');
            setDeleteConfirm(prev => ({ ...prev, loading: false }));
          }
        } catch (err) {
          toast.error('Failed to delete quiz.');
          setDeleteConfirm(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleAddQuestionRow = (type = 'single_choice') => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question_text: '',
        question_type: type,
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: type === 'true_false' ? 'true' : 'a',
        correct_answer_text: '',
        explanation: '',
        marks: 1
      }
    ]);
  };

  const handleRemoveQuestionRow = (idx) => {
    if (quizQuestions.length <= 1) {
      toast.error('At least one question is required.');
      return;
    }
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  };

  const handleQuestionFieldChange = (idx, field, val) => {
    const copy = [...quizQuestions];
    copy[idx] = { ...copy[idx], [field]: val };
    setQuizQuestions(copy);
  };

  // ── Assignment Handlers ────────────────────────────────────────────────
  const openAddAssignmentModal = (mod, ms) => {
    const existingCount = (mod.lessons || []).length;
    setAssignmentForm({
      ...EMPTY_ASSIGNMENT,
      course_id: selectedCourseId,
      milestone_id: ms?.id || mod.milestone_id || '',
      module_id: mod.id,
      assignment_no: existingCount + 1,
      title: `${mod.title} - Project Assignment`,
      order_index: existingCount + 1
    });
    setAsgResourceInputs([{ title: '', url: '' }]);
    setShowAssignmentModal(true);
  };

  const openEditAssignmentModal = (asg) => {
    setAssignmentForm({
      ...asg,
      resources_json: JSON.stringify(asg.resources || [])
    });
    setAsgResourceInputs(asg.resources && asg.resources.length > 0 ? asg.resources : [{ title: '', url: '' }]);
    setShowAssignmentModal(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.module_id || !selectedCourseId) {
      toast.error('Module and Assignment Title are required!');
      return;
    }

    const filteredResources = asgResourceInputs.filter(r => r.title.trim() && r.url.trim());

    try {
      setSavingAssignment(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/assignments/save_assignment.php`, {
        ...assignmentForm,
        course_id: selectedCourseId,
        resources_json: JSON.stringify(filteredResources)
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Assignment saved successfully!');
        const currentMsId = assignmentForm.milestone_id;
        const currentModId = assignmentForm.module_id;
        setShowAssignmentModal(false);
        setAssignmentForm(EMPTY_ASSIGNMENT);
        fetchCurriculum(selectedCourseId, {
          preserveExpanded: true,
          ensureOpenMilestoneId: currentMsId,
          ensureOpenModuleId: currentModId
        });
      } else {
        toast.error(res.data.message || 'Failed to save assignment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving assignment.');
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = (aId, aTitle = '') => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Practical Assignment?',
      message: `Are you sure you want to delete "${aTitle || 'this Assignment'}" and all of its student submissions? This action cannot be undone.`,
      confirmText: 'Delete Assignment',
      confirmVariant: 'danger',
      loading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm(prev => ({ ...prev, loading: true }));
          const res = await axios.post(`${API_BASE}api/admin/courses/assignments/delete_assignment.php`, { id: aId });
          if (res.data.status === 'success') {
            toast.success('Assignment deleted successfully.');
            setDeleteConfirm(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchCurriculum(selectedCourseId, { preserveExpanded: true });
          } else {
            toast.error(res.data.message || 'Failed to delete assignment.');
            setDeleteConfirm(prev => ({ ...prev, loading: false }));
          }
        } catch (err) {
          toast.error('Failed to delete assignment.');
          setDeleteConfirm(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const filteredCourses = courses.filter(c => {
    const matchCat = selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter;
    const matchSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const uniqueCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));

  return (
    <div className="space-y-6 mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <FiBookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Courses & Curriculum Hub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage self-paced programs with Milestones, Modules, and 5-9 Video Lessons per topic.
            </p>
          </div>
        </div>

        {/* Action Button depending on Tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'courses' ? (
            <button
              onClick={() => {
                setCourseForm({
                  ...EMPTY_COURSE,
                  course_code: `CRS-${Math.floor(100 + Math.random() * 900)}`
                });
                setShowCourseModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <FiPlus size={18} />
              <span>Create New Course</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const msList = curriculumData?.milestones || [];
                  setMilestoneForm({
                    ...EMPTY_MILESTONE,
                    course_id: selectedCourseId,
                    milestone_no: msList.length + 1
                  });
                  setShowMilestoneModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer text-xs"
              >
                <FiPlus size={16} />
                <span>Add Milestone</span>
              </button>
              <button
                onClick={() => {
                  const msList = curriculumData?.milestones || [];
                  const defaultMId = msList.length > 0 ? msList[0].id : '';
                  setModuleForm({
                    ...EMPTY_MODULE,
                    course_id: selectedCourseId,
                    milestone_id: defaultMId,
                    module_no: 1
                  });
                  setShowModuleModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer text-xs"
              >
                <FiPlus size={16} />
                <span>Add Module</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'courses'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <FiBookOpen size={16} />
          <span>Courses Master ({courses.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('curriculum');
            if (selectedCourseId) fetchCurriculum(selectedCourseId);
          }}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'curriculum'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <FiLayers size={16} />
          <span>Curriculum Studio (Milestones & Videos)</span>
        </button>
      </div>

      {/* TAB 1: Courses Master */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${selectedCategoryFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
              >
                All Categories
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${selectedCategoryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Course Info</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Duration & Classes</th>
                    <th className="px-6 py-4">Modules</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {c.thumbnail_url ? (
                            <img src={c.thumbnail_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black flex items-center justify-center text-xs">
                              {c.course_code?.slice(0, 3) || 'CRS'}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{c.title}</p>
                            <p className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{c.course_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{c.duration_months} Months</p>
                        <p className="text-xs text-slate-400">{c.total_classes} Classes</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {c.total_modules_count || 0} Modules
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCourseId(c.id);
                              setActiveTab('curriculum');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <FiLayers size={13} />
                            <span>Curriculum</span>
                          </button>
                          <button
                            onClick={() => {
                              setCourseForm(c);
                              setShowCourseModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-purple-600 rounded-lg cursor-pointer transition-colors"
                          >
                            <FiEdit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Curriculum Studio (Milestones -> Modules -> 5-9 Video Lessons) */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Course Selector Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Active Course:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>🏆 {curriculumData?.stats?.total_milestones || 0} Milestones</span>
                <span>📁 {curriculumData?.stats?.total_modules || 0} Modules</span>
                <span className="text-indigo-600 dark:text-indigo-400">🎬 {curriculumData?.stats?.total_lessons || 0} Video Lessons</span>
              </div>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Expand all milestones and modules"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Collapse all milestones and modules"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Curriculum Tree View */}
          {loadingCurriculum ? (
            <div className="p-12 text-center text-slate-400 font-bold">Loading curriculum tree...</div>
          ) : (
            <div className="space-y-4">
              {(curriculumData?.milestones || []).length === 0 ? (
                <div className="p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 text-center space-y-3">
                  <FiLayers size={40} className="mx-auto text-slate-400 opacity-50" />
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Milestones Added Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Start by adding Milestone 1 to group your course modules and 5-9 video lessons.
                  </p>
                  <button
                    onClick={() => {
                      setMilestoneForm({ ...EMPTY_MILESTONE, course_id: selectedCourseId, milestone_no: 1 });
                      setShowMilestoneModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700"
                  >
                    + Create First Milestone
                  </button>
                </div>
              ) : (
                (curriculumData?.milestones || []).map((ms, msIdx) => {
                  const isMsOpen = !!expandedMilestones[ms.id];
                  return (
                    <div
                      key={ms.id || msIdx}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs"
                    >
                      {/* Milestone Header */}
                      <div className="p-5 bg-gradient-to-r from-indigo-950/20 via-slate-900/10 to-transparent dark:from-indigo-950/40 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div
                          onClick={() => setExpandedMilestones(prev => ({ ...prev, [ms.id]: !prev[ms.id] }))}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <span className="p-2 rounded-xl bg-indigo-600 text-white font-black text-xs shrink-0">
                            M{ms.milestone_no || msIdx + 1}
                          </span>
                          <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{ms.title}</span>
                              <span className="text-xs font-normal text-slate-400">
                                ({ms.modules?.length || 0} Modules • {ms.total_lessons || 0} Lessons)
                              </span>
                            </h3>
                            {ms.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ms.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Milestone Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setModuleForm({
                                ...EMPTY_MODULE,
                                course_id: selectedCourseId,
                                milestone_id: ms.id,
                                module_no: (ms.modules?.length || 0) + 1
                              });
                              setShowModuleModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FiPlus size={13} />
                            <span>Add Module</span>
                          </button>

                          <button
                            onClick={() => {
                              setMilestoneForm(ms);
                              setShowMilestoneModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                            title="Edit Milestone"
                          >
                            <FiEdit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteMilestone(ms.id, ms.title)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Delete Milestone"
                          >
                            <FiTrash2 size={14} />
                          </button>

                          <button
                            onClick={() => setExpandedMilestones(prev => ({ ...prev, [ms.id]: !prev[ms.id] }))}
                            className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            {isMsOpen ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Modules & Lessons under this Milestone */}
                      {isMsOpen && (
                        <div className="p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
                          {(ms.modules || []).length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              No modules added in this milestone yet. Click "+ Add Module" above.
                            </div>
                          ) : (
                            (ms.modules || []).map((mod, modIdx) => {
                              const isModOpen = !!expandedModules[mod.id];
                              const lessonsList = mod.lessons || [];

                              return (
                                <div
                                  key={mod.id || modIdx}
                                  className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs"
                                >
                                  {/* Module Header */}
                                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/50">
                                    <div
                                      onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                      className="flex items-center gap-3 cursor-pointer flex-1"
                                    >
                                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center text-xs shrink-0">
                                        M{mod.module_no}
                                      </div>
                                      <div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                          {mod.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-400">
                                          {lessonsList.length} Video Lessons ({lessonsList.length >= 5 ? '✅ Standard 5-9 Set' : `${5 - lessonsList.length} more recommended`})
                                        </p>
                                      </div>
                                    </div>

                                    {/* Module Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => openAddLessonModal(mod, ms)}
                                        className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Add a video lecture"
                                      >
                                        <FiPlus size={13} />
                                        <span>Add Video</span>
                                      </button>

                                      <button
                                        onClick={() => openAddAssignmentModal(mod, ms)}
                                        className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600 text-amber-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Add a hands-on project assignment"
                                      >
                                        <FiFolder size={13} />
                                        <span>Add Assignment</span>
                                      </button>

                                      <button
                                        onClick={() => openAddQuizModal(mod, ms)}
                                        className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Add an MCQ Assessment anywhere in this module"
                                      >
                                        <FiAward size={13} />
                                        <span>Add MCQ Quiz</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setModuleForm(mod);
                                          setShowModuleModal(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                                        title="Edit Module"
                                      >
                                        <FiEdit2 size={13} />
                                      </button>

                                      <button
                                        onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                                      >
                                        {isModOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Video Lessons & Quizzes Table */}
                                  {isModOpen && (
                                    <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60">
                                      {lessonsList.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">
                                          No content added yet. Click "+ Add Video" or "+ Add MCQ Quiz" to build this module.
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {lessonsList.map((les, lIdx) => {
                                            const isQuiz = les.item_type === 'quiz';

                                            if (les.item_type === 'assignment') {
                                              return (
                                                <div
                                                  key={`assignment-${les.id || les.assignment_id}`}
                                                  className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-850 flex items-center justify-between gap-3 text-xs transition-all hover:shadow-xs"
                                                >
                                                  <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-[10px] shrink-0 shadow-xs">
                                                      📁
                                                    </span>
                                                    <div className="min-w-0">
                                                      <p className="font-bold text-slate-900 dark:text-amber-100 truncate flex items-center gap-2">
                                                        <span>{les.title}</span>
                                                        <span className="px-1.5 py-0.5 bg-amber-200/80 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-extrabold text-[9px] rounded-md tracking-wider">
                                                          ASSIGNMENT
                                                        </span>
                                                      </p>
                                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5 mt-0.5 font-medium">
                                                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                                                          ⭐ {les.total_marks || 100} Marks (Pass: {les.pass_marks || 50})
                                                        </span>
                                                        <span>•</span>
                                                        <span>📎 {(les.resources || []).length} Starter Files</span>
                                                      </p>
                                                    </div>
                                                  </div>

                                                  {/* Assignment Actions */}
                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                      onClick={() => openEditAssignmentModal(les)}
                                                      className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 rounded-lg cursor-pointer transition-colors"
                                                      title="Edit Assignment"
                                                    >
                                                      <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteAssignment(les.assignment_id || les.id, les.title)}
                                                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                                                      title="Delete Assignment"
                                                    >
                                                      <FiTrash2 size={14} />
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            }

                                            if (isQuiz) {
                                              return (
                                                <div
                                                  key={`quiz-${les.id || les.quiz_id}`}
                                                  className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-850 flex items-center justify-between gap-3 text-xs transition-all hover:shadow-xs"
                                                >
                                                  <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 shadow-xs">
                                                      🧠
                                                    </span>
                                                    <div className="min-w-0">
                                                      <p className="font-bold text-slate-900 dark:text-purple-100 truncate flex items-center gap-2">
                                                        <span>{les.title}</span>
                                                        <span className="px-1.5 py-0.5 bg-purple-200/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-[9px] rounded-md tracking-wider">
                                                          MCQ QUIZ
                                                        </span>
                                                      </p>
                                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5 mt-0.5 font-medium">
                                                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                                                          {les.question_count || 5} Questions
                                                        </span>
                                                        <span>•</span>
                                                        <span>⏱️ {les.time_limit_minutes || 10} Mins</span>
                                                        <span>•</span>
                                                        <span>🎯 {les.passing_score_percent || 70}% Pass Criteria</span>
                                                      </p>
                                                    </div>
                                                  </div>

                                                  {/* Quiz Actions */}
                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                      onClick={() => openEditQuizModal(les)}
                                                      className="p-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 rounded-lg cursor-pointer transition-colors"
                                                      title="Edit Quiz & Questions"
                                                    >
                                                      <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteQuiz(les.quiz_id || les.id, les.title)}
                                                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                                                      title="Delete Quiz"
                                                    >
                                                      <FiTrash2 size={14} />
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            }

                                            return (
                                              <div
                                                key={`lesson-${les.id}`}
                                                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                                              >
                                                <div className="flex items-center gap-3 min-w-0">
                                                  <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-black flex items-center justify-center text-[10px] shrink-0">
                                                    {les.lesson_no || lIdx + 1}
                                                  </span>
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">
                                                      {les.title}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                      <span className="flex items-center gap-1 font-mono">
                                                        <FiClock size={11} />
                                                        {les.duration_minutes}
                                                      </span>
                                                      <span className="uppercase font-bold text-indigo-500">
                                                        [{les.video_type}]
                                                      </span>
                                                      {les.is_free_preview && (
                                                        <span className="text-amber-500 font-bold">★ Free Preview</span>
                                                      )}
                                                    </p>
                                                  </div>
                                                </div>

                                                {/* Lesson Actions */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  <button
                                                    onClick={() => setPreviewVideoUrl(les.video_url)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg cursor-pointer"
                                                    title="Preview Video"
                                                  >
                                                    <FiEye size={14} />
                                                  </button>
                                                  <button
                                                    onClick={() => openEditLessonModal(les)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg cursor-pointer"
                                                    title="Edit Lesson"
                                                  >
                                                    <FiEdit2 size={14} />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteLesson(les.id, les.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                                    title="Delete Lesson"
                                                  >
                                                    <FiTrash2 size={14} />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Course Create / Edit */}
      {showCourseModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-xl">
                  <FiBookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {courseForm.id ? 'Edit Course' : 'Create New Course'}
                  </h2>
                  <p className="text-xs text-slate-400">Configure course details, duration, category, and total classes.</p>
                </div>
              </div>
              <button onClick={() => setShowCourseModal(false)} className="p-2 text-slate-400 hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphic Design & Multimedia Masterclass"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GDM-101"
                    value={courseForm.course_code}
                    onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer"
                  >
                    <option value="Creative & Design">Creative & Design</option>
                    <option value="Web & Software">Web & Software</option>
                    <option value="Office & Productivity">Office & Productivity</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Database & Systems">Database & Systems</option>
                    <option value="Adobe After Effects">Adobe After Effects </option>
                  </select>
                </div>
              </div>

              {/* Picture (1:1) and Banner (16:9) Uploaders */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FiImage className="text-purple-500" size={14} /> Course Media (Cloudflare R2 • WebP)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(prev => !prev)}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    {showManualUrl ? 'Hide manual URL fields' : 'Or enter URLs manually'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Course Cover (Square 1:1) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Course Cover (Square 1:1)
                    </label>

                    {courseForm.thumbnail_url ? (
                      <div className="relative group rounded-2xl border border-purple-200 dark:border-purple-900/50 p-3 bg-purple-50/40 dark:bg-purple-950/20 flex items-center gap-3">
                        <img
                          src={courseForm.thumbnail_url}
                          alt="Cover preview"
                          className="w-16 h-16 rounded-xl object-cover border border-purple-300 dark:border-purple-800 shadow-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            <FiCheckCircle size={12} /> WebP on R2
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-full font-mono">
                            {courseForm.thumbnail_url}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleImageUpload(e.target.files[0], 'cover');
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => setCourseForm(prev => ({ ...prev, thumbnail_url: '' }))}
                              className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        uploadingCover
                          ? 'border-purple-400 bg-purple-50/30 dark:bg-purple-950/20 pointer-events-none'
                          : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-purple-50/20'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCover}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0], 'cover');
                              e.target.value = '';
                            }
                          }}
                        />
                        {uploadingCover ? (
                          <div className="flex flex-col items-center gap-2 text-purple-600 dark:text-purple-400 py-2">
                            <FiLoader size={24} className="animate-spin" />
                            <span className="text-xs font-bold animate-pulse">Converting to WebP & Uploading to R2...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center gap-1.5 py-1">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                              <FiUploadCloud size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Click or drop square cover
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Auto-renamed & saved to cca-student/course/cover/
                            </span>
                          </div>
                        )}
                      </label>
                    )}

                    {showManualUrl && (
                      <input
                        type="url"
                        placeholder="Or paste direct URL: https://.../cover.webp"
                        value={courseForm.thumbnail_url || ''}
                        onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                      />
                    )}
                  </div>

                  {/* Course Banner (Wide 16:9) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Course Banner (Wide 16:9 Cover)
                    </label>

                    {courseForm.banner_url ? (
                      <div className="relative group rounded-2xl border border-indigo-200 dark:border-indigo-900/50 p-3 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center gap-3">
                        <img
                          src={courseForm.banner_url}
                          alt="Banner preview"
                          className="w-24 h-14 rounded-xl object-cover border border-indigo-300 dark:border-indigo-800 shadow-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            <FiCheckCircle size={12} /> WebP on R2
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-full font-mono">
                            {courseForm.banner_url}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleImageUpload(e.target.files[0], 'banner');
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => setCourseForm(prev => ({ ...prev, banner_url: '' }))}
                              className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        uploadingBanner
                          ? 'border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 pointer-events-none'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/20'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingBanner}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0], 'banner');
                              e.target.value = '';
                            }
                          }}
                        />
                        {uploadingBanner ? (
                          <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400 py-2">
                            <FiLoader size={24} className="animate-spin" />
                            <span className="text-xs font-bold animate-pulse">Converting to WebP & Uploading to R2...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center gap-1.5 py-1">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                              <FiUploadCloud size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Click or drop 16:9 banner
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Auto-renamed & saved to cca-student/course/banner/
                            </span>
                          </div>
                        )}
                      </label>
                    )}

                    {showManualUrl && (
                      <input
                        type="url"
                        placeholder="Or paste direct URL: https://.../banner.webp"
                        value={courseForm.banner_url || ''}
                        onChange={(e) => setCourseForm({ ...courseForm, banner_url: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingCourse ? 'Saving...' : courseForm.id ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Milestone Create / Edit */}
      {showMilestoneModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {milestoneForm.id ? 'Edit Milestone' : 'Add Course Milestone'}
              </h2>
              <button onClick={() => setShowMilestoneModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Milestone No *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={milestoneForm.milestone_no}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_no: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1: Web Foundation & HTML/CSS"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Goal</label>
                <textarea
                  rows="3"
                  placeholder="Core achievement goals in this milestone..."
                  value={milestoneForm.description || ''}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={savingMilestone} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md">
                  {savingMilestone ? 'Saving...' : milestoneForm.id ? 'Update Milestone' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Module Create / Edit */}
      {showModuleModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {moduleForm.id ? 'Edit Module' : 'Add Course Module'}
              </h2>
              <button onClick={() => setShowModuleModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assign to Milestone</label>
                <select
                  value={moduleForm.milestone_id || ''}
                  onChange={(e) => setModuleForm({ ...moduleForm, milestone_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer font-bold"
                >
                  <option value="">-- Select Milestone --</option>
                  {(curriculumData?.milestones || []).map(m => (
                    <option key={m.id} value={m.id}>M{m.milestone_no}: {m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module No *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={moduleForm.module_no}
                  onChange={(e) => setModuleForm({ ...moduleForm, module_no: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 01: CSS Box Model & Modern Flexbox"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={savingModule} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md">
                  {savingModule ? 'Saving...' : moduleForm.id ? 'Update Module' : 'Add Module'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Assignment Create / Edit */}
      {showAssignmentModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-xl">
                  <FiFolder size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {assignmentForm.id ? 'Edit Assignment Task' : 'Add Practical Assignment'}
                  </h2>
                  <p className="text-xs text-slate-400">Set project brief, instructions, total marks, and starter assets.</p>
                </div>
              </div>
              <button onClick={() => setShowAssignmentModal(false)} className="p-2 text-slate-400 hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project No</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assignmentForm.assignment_no}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assignment_no: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={assignmentForm.total_marks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, total_marks: parseInt(e.target.value) || 100 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pass Marks</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assignmentForm.pass_marks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, pass_marks: parseInt(e.target.value) || 50 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photoshop Social Media Poster Design Task"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Project Brief & Requirements (Detailed Instructions) *
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Explain what the student needs to build, design requirements, image dimensions, guidelines, and what link format to submit..."
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                ></textarea>
              </div>

              {/* Starter File Downloads */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Downloadable Starter Assets / Demo Files
                  </label>
                  <button
                    type="button"
                    onClick={() => setAsgResourceInputs([...asgResourceInputs, { title: '', url: '' }])}
                    className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                  >
                    <FiPlus size={12} />
                    <span>Add File Link</span>
                  </button>
                </div>

                {asgResourceInputs.map((res, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Asset Title (e.g. Demo Assets ZIP / Figma Starter)"
                      value={res.title}
                      onChange={(e) => {
                        const copy = [...asgResourceInputs];
                        copy[rIdx].title = e.target.value;
                        setAsgResourceInputs(copy);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                    <input
                      type="url"
                      placeholder="Download URL (https://drive.google.com/...)"
                      value={res.url}
                      onChange={(e) => {
                        const copy = [...asgResourceInputs];
                        copy[rIdx].url = e.target.value;
                        setAsgResourceInputs(copy);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                    {asgResourceInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAsgResourceInputs(asgResourceInputs.filter((_, i) => i !== rIdx))}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssignment}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingAssignment ? 'Saving Assignment...' : assignmentForm.id ? 'Update Assignment' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Video Lesson Create / Edit */}
      {showLessonModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
                  <FiVideo size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {lessonForm.id ? 'Edit Video Lesson' : 'Add Video Lesson'}
                  </h2>
                  <p className="text-xs text-slate-400">Provide video class lecture URL, duration, notes, and asset links.</p>
                </div>
              </div>
              <button onClick={() => setShowLessonModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lesson No</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lessonForm.lesson_no}
                    onChange={(e) => setLessonForm({ ...lessonForm, lesson_no: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Video Type</label>
                  <select
                    value={lessonForm.video_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer font-bold"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="drive">Google Drive</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="direct">Direct MP4 Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (min)</label>
                  <input
                    type="text"
                    placeholder="12:30"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1-1 Introduction to Modern Flexbox & Container Properties"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Video URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or Drive preview URL"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lecture Notes & Summary</label>
                <textarea
                  rows="3"
                  placeholder="Detailed breakdown, key takeaways, practice instructions..."
                  value={lessonForm.summary || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                ></textarea>
              </div>

              {/* Resource Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downloadable Resources</label>
                  <button
                    type="button"
                    onClick={() => setResourceInputs([...resourceInputs, { title: '', url: '' }])}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-400 cursor-pointer"
                  >
                    + Add File Link
                  </button>
                </div>
                <div className="space-y-2">
                  {resourceInputs.map((res, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Resource Title (e.g. Cheat Sheet PDF)"
                        value={res.title}
                        onChange={(e) => {
                          const copy = [...resourceInputs];
                          copy[idx].title = e.target.value;
                          setResourceInputs(copy);
                        }}
                        className="w-1/2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                      />
                      <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={res.url}
                        onChange={(e) => {
                          const copy = [...resourceInputs];
                          copy[idx].url = e.target.value;
                          setResourceInputs(copy);
                        }}
                        className="w-1/2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="freePreviewCheck"
                  checked={!!lessonForm.is_free_preview}
                  onChange={(e) => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked ? 1 : 0 })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="freePreviewCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Allow Free Preview (Available to non-enrolled students)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowLessonModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={savingLesson} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md">
                  {savingLesson ? 'Saving...' : lessonForm.id ? 'Update Video Lesson' : 'Add Video Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: MCQ Quiz Assessment Builder */}
      {showQuizModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-md">
                  <FiAward size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{quizForm.id ? 'Edit Quiz Assessment' : 'Create MCQ Quiz Assessment'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold">
                      🧠 Interactive Exam
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set passing criteria, countdown timer, and 5-10 multiple choice questions with explanations.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowQuizModal(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveQuiz} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Quiz General Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚙️ Quiz Parameters & Timing</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Module 01 Assessment: HTML5 & Modern Semantic Web"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Time Limit (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      required
                      value={quizForm.time_limit_minutes}
                      onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: parseInt(e.target.value) || 10 })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Pass Score (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={quizForm.passing_score_percent}
                      onChange={(e) => setQuizForm({ ...quizForm, passing_score_percent: parseInt(e.target.value) || 70 })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Order / Position Index
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quizForm.order_index}
                      onChange={(e) => setQuizForm({ ...quizForm, order_index: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Brief Instructions / Description (Optional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Instructions for students before they start the assessment..."
                    value={quizForm.description || ''}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  ></textarea>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Questions Set</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                        {quizQuestions.length} Questions
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Support for MCQs, Direct Question & Answer (Short Answer), and True/False questions.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddQuestionRow('single_choice')}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <FiPlus size={13} />
                      <span>+ MCQ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionRow('short_answer')}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <FiPlus size={13} />
                      <span>+ Direct Q&A (Short Ans)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionRow('true_false')}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <FiPlus size={13} />
                      <span>+ True/False</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => {
                    const qType = q.question_type || 'single_choice';

                    return (
                      <div
                        key={qIdx}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/40 space-y-3.5 shadow-xs"
                      >
                        {/* Question Header & Type Selector */}
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold">
                              {qIdx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              Question {qIdx + 1}
                            </span>
                          </div>

                          {/* Question Type Switcher */}
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQuestionFieldChange(qIdx, 'question_type', 'single_choice')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${qType === 'single_choice'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                              🔘 MCQ (4 Options)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuestionFieldChange(qIdx, 'question_type', 'short_answer')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${qType === 'short_answer'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                              ✍️ Direct Q&A (Short Ans)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuestionFieldChange(qIdx, 'question_type', 'true_false')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${qType === 'true_false'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                              ⚖️ True/False
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionRow(qIdx)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg cursor-pointer"
                            title="Delete this question"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Question / Prompt Text *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={
                              qType === 'short_answer'
                                ? "e.g. CPU এর পূর্ণরূপ কী? অথবা What shortcut key saves a document in MS Word?"
                                : qType === 'true_false'
                                  ? "e.g. HTML হলো একটি প্রোগ্রামিং ল্যাঙ্গুয়েজ (True / False)"
                                  : "e.g. Which CSS property is used to create a flex container?"
                            }
                            value={q.question_text}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'question_text', e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                          />
                        </div>

                        {/* TYPE 1: DIRECT QUESTION & ANSWER (SHORT ANSWER) */}
                        {qType === 'short_answer' && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                                ✍️ Accepted Correct Answer / Keywords *
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">Case-insensitive auto evaluation</span>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="যেমন: Central Processing Unit অথবা একাধিক বিকল্প উত্তর: Ctrl+S, Ctrl + S, Control S"
                              value={q.correct_answer_text || ''}
                              onChange={(e) => handleQuestionFieldChange(qIdx, 'correct_answer_text', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-950 dark:text-emerald-200"
                            />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              💡 শিক্ষার্থী এই উত্তরটি অথবা কমা (,) দিয়ে আলাদা করা যেকোনো বিকল্প কীওয়ার্ড লিখলে সঠিক গণ্য করা হবে।
                            </p>
                          </div>
                        )}

                        {/* TYPE 2: TRUE / FALSE */}
                        {qType === 'true_false' && (
                          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
                            <label className="text-[11px] font-black uppercase text-blue-800 dark:text-blue-300 block">
                              ⚖️ Select the Correct Verdict
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleQuestionFieldChange(qIdx, 'correct_option', 'true')}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${(q.correct_option || 'true') === 'true'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                              >
                                ✅ True (সত্য)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuestionFieldChange(qIdx, 'correct_option', 'false')}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${(q.correct_option || 'true') === 'false'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                              >
                                ❌ False (মিথ্যা)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TYPE 3: 4 OPTIONS MCQ */}
                        {qType === 'single_choice' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {['a', 'b', 'c', 'd'].map((optKey) => {
                              const isCorrect = (q.correct_option || 'a').toLowerCase() === optKey;
                              const fieldName = `option_${optKey}`;

                              return (
                                <div
                                  key={optKey}
                                  className={`p-2 rounded-xl border transition-all ${isCorrect
                                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                                    }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">
                                      Option {optKey.toUpperCase()}
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleQuestionFieldChange(qIdx, 'correct_option', optKey)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${isCorrect
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                                        }`}
                                    >
                                      {isCorrect ? '✓ Correct Answer' : 'Set as Correct'}
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    required={optKey === 'a' || optKey === 'b'}
                                    placeholder={`Text for option ${optKey.toUpperCase()}...`}
                                    value={q[fieldName] || ''}
                                    onChange={(e) => handleQuestionFieldChange(qIdx, fieldName, e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-white"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Explanation */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            💡 Instructor Explanation / Reason (Shown to student on review)
                          </label>
                          <textarea
                            rows="1.5"
                            placeholder="Explain why this answer is correct and provide learning hints..."
                            value={q.explanation || ''}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'explanation', e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                          ></textarea>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddQuestionRow('single_choice')}
                    className="flex-1 py-3 border-2 border-dashed border-purple-300 dark:border-purple-800/80 hover:border-purple-500 dark:hover:border-purple-600 text-purple-600 dark:text-purple-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FiPlus size={16} />
                    <span>+ Add MCQ Question</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestionRow('short_answer')}
                    className="flex-1 py-3 border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FiPlus size={16} />
                    <span>+ Add Direct Q&A Question</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestionRow('true_false')}
                    className="flex-1 py-3 border-2 border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FiPlus size={16} />
                    <span>+ Add True/False Question</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 py-2">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingQuiz ? 'Saving Quiz & Questions...' : quizForm.id ? 'Update Quiz Assessment' : 'Publish MCQ Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-700 shadow-2xl">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300">Video Link Preview</span>
              <button onClick={() => setPreviewVideoUrl('')} className="p-1.5 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={previewVideoUrl.replace('watch?v=', 'embed/')}
                title="Preview"
                className="w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        {...deleteConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CoursesAndCurriculum;
