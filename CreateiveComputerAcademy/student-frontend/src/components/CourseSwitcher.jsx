import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookOpen, FiChevronDown, FiCheck, FiLayers, FiPlayCircle, FiAward } from 'react-icons/fi';
import { useCourse } from '../context/CourseContext';
import { toast } from 'sonner';

const CourseSwitcher = () => {
  const { courses, activeCourse, selectCourse, loadingCourses } = useCourse();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loadingCourses) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse text-xs text-slate-500">
        <div className="w-3 h-3 rounded-full bg-slate-400" />
        <span>Loading Courses...</span>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500">
        <FiBookOpen size={14} />
        <span>General Student</span>
      </div>
    );
  }

  const handleSelect = (course) => {
    if (activeCourse?.course_id === course.course_id) {
      setIsOpen(false);
      return;
    }
    selectCourse(course);
    setIsOpen(false);
    toast.success(`Switched to ${course.course_title}`, {
      description: 'Your dashboard, video modules, and assignments are now updated.'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-600/60 shadow-sm shadow-indigo-500/10'
            : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <FiBookOpen size={13} />
        </div>

        <div className="hidden sm:block max-w-[200px] md:max-w-[280px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Active Course:
            </span>
            <span className="text-[10px] px-1.5 py-0.2 font-bold rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
              {activeCourse?.course_code || 'CCA'}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {activeCourse?.course_title || 'Select Course'}
          </p>
        </div>

        {/* Multi-course count indicator if > 1 */}
        {courses.length > 1 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50">
            {courses.length} Courses
          </span>
        )}

        <FiChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 md:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiLayers className="text-indigo-600 dark:text-indigo-400 text-sm" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  My Enrolled Courses
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
              </span>
            </div>

            {/* Course List */}
            <div className="mt-1 space-y-1 max-h-80 overflow-y-auto pr-0.5">
              {courses.map((course) => {
                const isSelected = activeCourse?.course_id === course.course_id;
                return (
                  <button
                    key={course.course_id}
                    onClick={() => handleSelect(course)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-black text-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isSelected ? <FiCheck size={16} /> : <FiPlayCircle size={15} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {course.course_title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 uppercase ${
                            course.enrollment_status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {course.enrollment_status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {course.course_code}
                        </span>
                        <span>•</span>
                        <span>{course.total_modules || 6} Modules</span>
                        <span>•</span>
                        <span>{course.total_classes || 36} Video Lessons</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500">
              <span>💡 Switch course anytime to resume your recorded lessons</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseSwitcher;
