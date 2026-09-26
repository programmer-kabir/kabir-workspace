import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen, FiCompass, FiCheckCircle, FiSearch, FiLayers,
  FiClock, FiVideo, FiUsers, FiArrowRight, FiCheck, FiChevronDown,
  FiChevronUp, FiAward, FiBook
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_COLORS = {
  'Creative & Design': 'from-pink-500/20 via-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
  'Web & Software': 'from-blue-500/20 via-cyan-500/20 to-teal-500/20 border-blue-500/30 text-blue-400',
  'Office & Productivity': 'from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
  'Digital Marketing': 'from-emerald-500/20 via-teal-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
  'default': 'from-indigo-500/20 via-purple-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400'
};

const BrowseCourses = () => {
  const { currentUser } = useAuth();
  const { refreshCourses, selectCourse, activeCourse } = useCourse();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedSyllabusId, setExpandedSyllabusId] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const userParam = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const res = await axios.get(`${API_BASE}api/student/get_all_courses.php${userParam}`);
      if (res.data.status === 'success') {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      toast.error('Could not load course catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentUser?.id]);

  const handleEnroll = async (course) => {
    if (!currentUser?.id) {
      toast.error('Please login first to enroll.');
      return;
    }

    try {
      setEnrollingId(course.id);
      const res = await axios.post(`${API_BASE}api/student/enroll_course.php`, {
        user_id: currentUser.id,
        course_id: course.id
      });

      if (res.data.status === 'success' || res.data.status === 'info') {
        toast.success(res.data.message || `Successfully enrolled in ${course.title}!`);
        await refreshCourses();
        fetchCourses();
        selectCourse(course.id);
      } else {
        toast.error(res.data.message || 'Enrollment failed.');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error('Failed to enroll. Please try again.');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleGoToCourse = (course) => {
    selectCourse(course.id);
    toast.success(`Opening video classroom for ${course.title}!`);
    navigate(`/learn/${course.id}`);
  };

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

  const filteredCourses = courses.filter(c => {
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchSearch =
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.course_code?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-6 sm:p-8 md:p-10 border border-indigo-500/20 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <HiSparkles size={14} className="text-amber-400" />
              <span>Explore Course Catalog & Self-Paced Learning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Unlock New Skills with Expert-Led Courses
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Browse all academy programs. Enroll anytime on-demand with instant 24/7 access to video modules, downloadable asset packs, and assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shrink-0">
            <div className="text-center px-4">
              <p className="text-2xl font-black text-white">{courses.length}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available Courses</p>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-center px-4">
              <p className="text-2xl font-black text-emerald-400">
                {courses.filter(c => c.is_enrolled).length}
              </p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">My Enrolled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search courses by name, topic, software (e.g. Photoshop, React, Excel)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading course catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <FiBookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses match your search</h3>
          <p className="text-sm text-slate-400">Try searching with different keywords or switch categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = !!course.is_enrolled;
            const isActive = activeCourse && String(activeCourse.course_id) === String(course.id);
            const isSyllabusOpen = expandedSyllabusId === course.id;
            const catBadgeClass = CATEGORY_COLORS[course.category] || CATEGORY_COLORS['default'];

            return (
              <div
                key={course.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                  isActive
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : isEnrolled
                    ? 'border-emerald-500/40 dark:border-emerald-500/30'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Card Top Banner & Picture */}
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    {course.banner_url ? (
                      <img
                        src={course.banner_url}
                        alt={`${course.title} Banner`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${catBadgeClass}`}></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30"></div>

                    {/* Category and Code overlay badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                        {course.category || 'Specialized Track'}
                      </span>
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-black/60 text-indigo-300 backdrop-blur-md border border-white/10">
                        {course.course_code}
                      </span>
                    </div>

                    {/* Floating Course Thumbnail / Pic + Title on bottom of banner */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end gap-3 z-10">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={`${course.title} Thumbnail`}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white/80 dark:border-slate-800 shadow-lg shrink-0 bg-white dark:bg-slate-800"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center border-2 border-white/80 shadow-lg shrink-0">
                          {course.course_code?.slice(0, 2) || 'C'}
                        </div>
                      )}

                      <h3 className="text-base font-black text-white line-clamp-2 leading-tight drop-shadow-md">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Course Details Body */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {course.description || 'Comprehensive curriculum covering core principles, real-world case studies, and hands-on portfolio projects.'}
                    </p>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <FiLayers size={15} className="text-indigo-500 shrink-0" />
                        <span className="truncate">{course.total_modules_count || 0} Modules</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <FiClock size={15} className="text-purple-500 shrink-0" />
                        <span className="truncate">{course.duration_months || 3} Months</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <FiVideo size={15} className="text-blue-500 shrink-0" />
                        <span className="truncate">{course.total_classes || 36} Classes</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <FiUsers size={15} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{course.total_enrolled_students || 0} Students</span>
                      </div>
                    </div>

                    {/* Expandable Syllabus Preview */}
                    {course.modules_preview && course.modules_preview.length > 0 && (
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                        <button
                          onClick={() => setExpandedSyllabusId(isSyllabusOpen ? null : course.id)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <FiBook size={14} className="text-indigo-500" />
                            <span>Syllabus Outline ({course.modules_preview.length} Topics)</span>
                          </span>
                          {isSyllabusOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                        </button>

                        {isSyllabusOpen && (
                          <div className="p-3 bg-white dark:bg-slate-900 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                            {course.modules_preview.map((mod) => (
                              <div key={mod.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  M{mod.module_no}: {mod.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {mod.duration_classes} classes
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 pt-0">
                  {isEnrolled ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 px-1">
                        <span className="flex items-center gap-1">
                          <FiCheckCircle size={14} />
                          <span>Enrolled & Ready</span>
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            Active in Player
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleGoToCourse(course)}
                        className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        <span>{isActive ? 'Continue Learning' : 'Switch to this Course'}</span>
                        <FiArrowRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course)}
                      disabled={enrollingId === course.id}
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {enrollingId === course.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <HiSparkles size={16} />
                          <span>Enroll in Course</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseCourses;
