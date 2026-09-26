import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiX, FiCheckCircle,
  FiBookOpen, FiUserCheck, FiClock, FiCalendar, FiAward, FiArrowUpRight,
  FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiChevronRight, FiFilter,
  FiRepeat, FiLayers, FiZap
} from 'react-icons/fi';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_STUDENT_FORM = {
  id: '',
  name: '',
  email: '',
  phone: '',
  guardian_phone: '',
  course_id: '',
  course_name: '',
  student_code: '',
  enrollment_date: new Date().toISOString().split('T')[0],
  password: '',
  status: 'active'
};

const EMPTY_PROMOTE_FORM = {
  user_id: '',
  student_name: '',
  student_code: '',
  course_name: '',
  employee_code: '',
  department_id: '',
  designation: 'Junior Instructor',
  employment_type: 'Full-time',
  employment_status: 'active',
  joining_date: new Date().toISOString().split('T')[0],
  shift_start: '09:00:00',
  shift_end: '17:00:00',
  allocated_break_minutes: 60,
  has_tiffin_break: 1,
  tiffin_start_time: '13:20',
  tiffin_end_time: '14:00',
  tiffin_duration_minutes: 40
};

const StudentDirectory = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Student Form Modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentFormData, setStudentFormData] = useState(EMPTY_STUDENT_FORM);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);

  // Promotion Modal state
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteFormData, setPromoteFormData] = useState(EMPTY_PROMOTE_FORM);
  const [promoting, setPromoting] = useState(false);

  // Course Transfer Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ user_id: '', student_name: '', current_course: '', new_course_id: '', new_course_name: '' });
  const [transferring, setTransferring] = useState(false);

  // Multi-Course Enrollment Modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollData, setEnrollData] = useState({ user_id: '', student_name: '', course_id: '', admin_override: true });
  const [enrolling, setEnrolling] = useState(false);

  // Modern Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Deactivate',
    confirmVariant: 'danger',
    loading: false,
    onConfirm: null
  });

  // Fetch initial dependencies
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [stuRes, deptRes, crsRes] = await Promise.all([
        axios.get(`${API_BASE}api/admin/students/get_students.php`),
        axios.get(`${API_BASE}api/admin/departments/get_departments.php`),
        axios.get(`${API_BASE}api/admin/courses/get_courses.php`)
      ]);

      if (stuRes.data.status === 'success') setStudents(stuRes.data.data || []);
      if (deptRes.data.status === 'success') setDepartments(deptRes.data.data || []);
      if (crsRes.data.status === 'success') setCourses(crsRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Network error loading student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const refreshStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/admin/students/get_students.php`);
      if (res.data.status === 'success') setStudents(res.data.data || []);
    } catch (err) {}
  };

  // Save / Update Student
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentFormData.name || !studentFormData.email || (!studentFormData.course_name && !studentFormData.course_id)) {
      toast.error('Name, Email, and Course are required!');
      return;
    }

    try {
      setSavingStudent(true);
      const res = await axios.post(`${API_BASE}api/admin/students/save_student.php`, studentFormData);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Student saved successfully!');
        setShowStudentModal(false);
        setStudentFormData(EMPTY_STUDENT_FORM);
        refreshStudents();
      } else {
        toast.error(res.data.message || 'Failed to save student.');
      }
    } catch (err) {
      toast.error('Server error saving student.');
    } finally {
      setSavingStudent(false);
    }
  };

  // Open Promotion Modal
  const openPromoteModal = (stu) => {
    setPromoteFormData({
      ...EMPTY_PROMOTE_FORM,
      user_id: stu.id,
      student_name: stu.name,
      student_code: stu.student_code || 'N/A',
      course_name: stu.course_name || '',
      employee_code: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department_id: departments[0]?.id || '',
      designation: 'Assistant Instructor'
    });
    setShowPromoteModal(true);
  };

  // Handle Promote to Staff Submit
  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!promoteFormData.designation || !promoteFormData.employee_code) {
      toast.error('Designation and Employee Code are required!');
      return;
    }

    try {
      setPromoting(true);
      const res = await axios.post(`${API_BASE}api/admin/students/promote_student.php`, promoteFormData);
      if (res.data.status === 'success') {
        toast.success(`🎉 ${promoteFormData.student_name} has been promoted to Staff!`);
        setShowPromoteModal(false);
        refreshStudents();
      } else {
        toast.error(res.data.message || 'Promotion failed.');
      }
    } catch (err) {
      toast.error('Error promoting student to staff.');
    } finally {
      setPromoting(false);
    }
  };

  // Handle Course Transfer Submit
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferData.new_course_id && !transferData.new_course_name) {
      toast.error('Please select a target course.');
      return;
    }

    try {
      setTransferring(true);
      const res = await axios.post(`${API_BASE}api/admin/students/transfer_course.php`, {
        user_id: transferData.user_id,
        new_course_id: transferData.new_course_id,
        new_course_name: transferData.new_course_name
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Course transferred successfully!');
        setShowTransferModal(false);
        refreshStudents();
      } else {
        toast.error(res.data.message || 'Transfer failed.');
      }
    } catch (err) {
      toast.error('Error transferring student.');
    } finally {
      setTransferring(false);
    }
  };

  // Handle Multi-Course Enrollment
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollData.user_id || !enrollData.course_id) {
      toast.error('Please select a course to enroll.');
      return;
    }

    try {
      setEnrolling(true);
      const res = await axios.post(`${API_BASE}api/admin/students/enroll_student.php`, enrollData);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Enrolled in course successfully!');
        setShowEnrollModal(false);
        refreshStudents();
      } else {
        toast.error(res.data.message || 'Failed to enroll student in course.');
      }
    } catch (err) {
      toast.error('Error enrolling student.');
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Deactivate
  const handleDeleteStudent = (id, name) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Deactivate Student Account?',
      message: `Are you sure you want to deactivate ${name}'s account? The student will no longer be able to log in to the portal.`,
      confirmText: 'Deactivate Student',
      confirmVariant: 'danger',
      loading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm(prev => ({ ...prev, loading: true }));
          const res = await axios.post(`${API_BASE}api/admin/students/delete_student.php`, { id });
          if (res.data.status === 'success') {
            toast.success('Student account deactivated.');
            setDeleteConfirm(prev => ({ ...prev, isOpen: false, loading: false }));
            refreshStudents();
          } else {
            toast.error(res.data.message || 'Failed to delete student.');
            setDeleteConfirm(prev => ({ ...prev, loading: false }));
          }
        } catch (err) {
          toast.error('Server error deactivating student.');
          setDeleteConfirm(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // Filtered list
  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.student_code && s.student_code.toLowerCase().includes(q)) ||
      (s.course_name && s.course_name.toLowerCase().includes(q)) ||
      (s.all_course_names && s.all_course_names.some(c => c.toLowerCase().includes(q)));

    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'promoted' ? s.student_status === 'promoted_to_staff' || s.role === 'staff' :
      s.student_status === statusFilter;

    const matchCourse = courseFilter === 'all' ? true : (
      s.course_name === courseFilter || 
      (s.all_course_names && s.all_course_names.includes(courseFilter))
    );

    return matchSearch && matchStatus && matchCourse;
  });

  // Unique lists for filters
  const uniqueCourses = courses.length > 0 ? courses.map(c => c.title) : Array.from(new Set(students.map(s => s.course_name).filter(Boolean)));

  // KPIs
  const totalCount = students.length;
  const activeCount = students.filter(s => s.student_status === 'active').length;
  const promotedCount = students.filter(s => s.student_status === 'promoted_to_staff' || s.employee_code).length;
  const presentTodayCount = students.filter(s => s.today_attendance_status === 'Present' || s.today_check_in).length;

  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <FiBookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Student Directory & Enrollments</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage enrolled students, multi-course access, and Staff promotion.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const defaultCourseObj = courses[0] || null;
            setStudentFormData({
              ...EMPTY_STUDENT_FORM,
              course_id: defaultCourseObj ? defaultCourseObj.id : '',
              course_name: defaultCourseObj ? defaultCourseObj.title : 'Graphic Design & Multimedia',
              student_code: `STU-${Math.floor(1000 + Math.random() * 9000)}`
            });
            setIsEditMode(false);
            setShowStudentModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <FiUserPlus size={18} />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <FiBookOpen size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiUserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Students</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <FiAward size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promoted to Staff</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{promotedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiClock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{presentTodayCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name, code, email, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Course filter */}
          <div className="w-56">
            <CustomSelect
              value={courseFilter}
              onChange={(val) => setCourseFilter(val)}
              placeholder="All Courses"
              icon={FiBookOpen}
              searchable={true}
              options={[
                { value: 'all', label: 'All Courses' },
                ...uniqueCourses.map(c => ({ value: c, label: c }))
              ]}
            />
          </div>

          {/* Status filter */}
          <div className="w-48">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="All Status"
              icon={FiFilter}
              searchable={false}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active Students', dot: 'bg-emerald-500' },
                { value: 'promoted', label: 'Promoted to Staff', dot: 'bg-indigo-500' },
                { value: 'completed', label: 'Course Completed', dot: 'bg-blue-500' },
                { value: 'dropped', label: 'Dropped / Inactive', dot: 'bg-slate-400' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading Students Directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FiBookOpen size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">No students found</p>
            <p className="text-sm mt-1">Try changing your filters or add a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Enrolled Course</th>
                  <th className="px-6 py-4">Attendance (Shared)</th>
                  <th className="px-6 py-4">Status & Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredStudents.map((stu) => {
                  const isPromoted = stu.student_status === 'promoted_to_staff' || stu.role === 'staff' || !!stu.employee_code;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                            {stu.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {stu.name}
                              {isPromoted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                  <FiAward size={10} /> Staff
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{stu.email}</p>
                            {stu.phone && <p className="text-[11px] text-slate-400 mt-0.5">{stu.phone}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          {stu.student_code || 'N/A'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {stu.enrolled_courses && stu.enrolled_courses.length > 0 ? (
                          <div className="space-y-1.5 max-w-xs">
                            {stu.enrolled_courses.map((ec, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                  {ec.course_name}
                                </span>
                                {ec.course_code && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono border border-indigo-100 dark:border-indigo-900">
                                    {ec.course_code}
                                  </span>
                                )}
                              </div>
                            ))}
                            {stu.courses_count > 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                {stu.courses_count} Courses Enrolled
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-400 text-xs">
                            {stu.course_name || 'No active courses'}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">Enrolled: {stu.enrollment_date || 'N/A'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            stu.today_attendance_status === 'Present' || stu.today_check_in
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}>
                            {stu.today_check_in ? `In: ${stu.today_check_in.slice(0,5)}` : 'Not In Today'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                          Total Present: {stu.total_present_days || 0} days
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {isPromoted ? (
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                              Promoted to Staff
                            </span>
                            {stu.designation && <p className="text-xs text-slate-400 font-bold">{stu.designation}</p>}
                          </div>
                        ) : stu.student_status === 'completed' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            Active Student
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Typing Analytics Report button */}
                          <a
                            href={`/typing-reports?user_id=${stu.id}`}
                            title="View Student Touch Typing Analytics Report"
                            className="p-2 text-slate-400 hover:text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                          >
                            <FiZap size={16} />
                          </a>

                          {/* Transfer Course button */}
                          <button
                            onClick={() => {
                              setTransferData({
                                user_id: stu.id,
                                student_name: stu.name,
                                current_course: stu.course_name || '',
                                new_course_id: courses[0]?.id || '',
                                new_course_name: courses[0]?.title || ''
                              });
                              setShowTransferModal(true);
                            }}
                            title="Transfer Student to Another Course"
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          >
                            <FiRepeat size={16} />
                          </button>

                          {/* Multi-Course Enroll button */}
                          <button
                            onClick={() => {
                              const targetCourse = courses[0]?.id || '';
                              setEnrollData({
                                user_id: stu.id,
                                student_name: stu.name,
                                course_id: targetCourse,
                                admin_override: true
                              });
                              setShowEnrollModal(true);
                            }}
                            title="Enroll in Additional Course (Multi-Course)"
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                          >
                            <FiLayers size={16} />
                          </button>

                          {!isPromoted && (
                            <button
                              onClick={() => openPromoteModal(stu)}
                              title="Promote this student to Academy Staff"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <FiArrowUpRight size={14} />
                              <span>Promote to Staff</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setStudentFormData({
                                id: stu.id,
                                name: stu.name,
                                email: stu.email,
                                phone: stu.phone || '',
                                guardian_phone: stu.guardian_phone || '',
                                course_id: stu.course_id || courses.find(c => c.title === stu.course_name)?.id || '',
                                course_name: stu.course_name || '',
                                student_code: stu.student_code || '',
                                enrollment_date: stu.enrollment_date || new Date().toISOString().split('T')[0],
                                password: '',
                                status: stu.student_status || 'active'
                              });
                              setIsEditMode(true);
                              setShowStudentModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                            title="Edit Student"
                          >
                            <FiEdit2 size={16} />
                          </button>

                          <button
                            onClick={() => handleDeleteStudent(stu.id, stu.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                            title="Deactivate Student"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add / Edit Student Modal */}
      {showStudentModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">
                  <FiBookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {isEditMode ? 'Edit Student Details' : 'Enroll New Student'}
                  </h2>
                  <p className="text-xs text-slate-400">Select Course for student access.</p>
                </div>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakil Ahmed"
                    value={studentFormData.name}
                    onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course *</label>
                <CustomSelect
                  value={studentFormData.course_id || (courses.find(c => c.title === studentFormData.course_name)?.id || '')}
                  onChange={(selCid) => {
                    const cObj = courses.find(c => String(c.id) === String(selCid));
                    setStudentFormData({
                      ...studentFormData,
                      course_id: selCid,
                      course_name: cObj ? cObj.title : studentFormData.course_name
                    });
                  }}
                  placeholder="Select Course"
                  icon={FiBookOpen}
                  searchable={true}
                  options={courses.map(c => ({
                    value: c.id,
                    label: c.title,
                    badge: c.course_code
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Code</label>
                  <input
                    type="text"
                    placeholder="STU-1001"
                    value={studentFormData.student_code}
                    onChange={(e) => setStudentFormData({ ...studentFormData, student_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Phone</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={studentFormData.phone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    placeholder="018xxxxxxxx"
                    value={studentFormData.guardian_phone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, guardian_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isEditMode ? 'New Password (Leave blank to keep)' : 'Initial Password'}
                  </label>
                  <input
                    type="password"
                    placeholder={isEditMode ? '••••••••' : 'Default: 12345678'}
                    value={studentFormData.password}
                    onChange={(e) => setStudentFormData({ ...studentFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingStudent ? 'Saving...' : isEditMode ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Course Transfer Modal */}
      {showTransferModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                  <FiRepeat size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Course Transfer</h3>
                  <p className="text-xs text-slate-400">{transferData.student_name}</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs space-y-1">
                <p className="text-slate-400 font-medium">Current Course: <span className="font-bold text-slate-800 dark:text-slate-200">{transferData.current_course || 'N/A'}</span></p>
                <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">✓ Past attendance history & assignments will remain intact.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Target Course *</label>
                <select
                  required
                  value={transferData.new_course_id || ''}
                  onChange={(e) => {
                    const selCid = e.target.value;
                    const cObj = courses.find(c => String(c.id) === String(selCid));
                    setTransferData({
                      ...transferData,
                      new_course_id: selCid,
                      new_course_name: cObj?.title || ''
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  <option value="">Select Target Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.course_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {transferring ? 'Transferring...' : 'Confirm Course Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Promote to Staff Modal */}
      {showPromoteModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-transparent border-b border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
                  <FiAward size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Promote Student to Academy Staff
                  </h2>
                  <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold">
                    Promoting: <span className="font-black text-slate-900 dark:text-white">{promoteFormData.student_name}</span> ({promoteFormData.student_code})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPromoteModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handlePromoteSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 font-medium">
                💡 <b>How it works:</b> The student will be given the <b>Staff</b> role in the database. Their existing credentials and past attendance logs will be preserved intact. They can immediately log into the <b>Staff Portal (:5174)</b>!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">New Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={promoteFormData.employee_code}
                    onChange={(e) => setPromoteFormData({ ...promoteFormData, employee_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Instructor / Mentor"
                    value={promoteFormData.designation}
                    onChange={(e) => setPromoteFormData({ ...promoteFormData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={promoteFormData.department_id}
                    onChange={(e) => setPromoteFormData({ ...promoteFormData, department_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employment Type</label>
                  <select
                    value={promoteFormData.employment_type}
                    onChange={(e) => setPromoteFormData({ ...promoteFormData, employment_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promoting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {promoting ? 'Promoting...' : 'Confirm & Promote to Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 4: Multi-Course Enrollment Modal */}
      {showEnrollModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border border-indigo-200 dark:border-indigo-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
                  <FiLayers size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Enroll in Additional Course
                  </h2>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    Student: <span className="font-black text-slate-900 dark:text-white">{enrollData.student_name}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-300">
                ✨ <b>Multi-Course Enrollment:</b> This will add a second/parallel enrollment for this student. They can seamlessly switch between their courses on the Student Portal!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Target Course *
                </label>
                <select
                  required
                  value={enrollData.course_id}
                  onChange={(e) => {
                    setEnrollData({
                      ...enrollData,
                      course_id: e.target.value
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.course_code}) [{c.category}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {enrolling ? 'Enrolling...' : 'Confirm Additional Enrollment'}
                </button>
              </div>
            </form>
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

export default StudentDirectory;
