import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CourseContext = createContext();
export const useCourse = () => useContext(CourseContext);

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ACTIVE_COURSE_KEY = 'cca_active_course_id';

export const CourseProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const fetchStudentCourses = async () => {
    if (!currentUser?.id) {
      setCourses([]);
      setActiveCourse(null);
      return;
    }

    try {
      setLoadingCourses(true);
      const res = await axios.get(`${API_BASE}api/student/get_my_courses.php?user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        const list = res.data.data || [];
        setCourses(list);

        const savedCourseId = localStorage.getItem(ACTIVE_COURSE_KEY);
        if (savedCourseId && list.length > 0) {
          const matched = list.find(c => String(c.course_id) === String(savedCourseId) || String(c.enrollment_id) === String(savedCourseId));
          if (matched) {
            setActiveCourse(matched);
          } else {
            setActiveCourse(list[0]);
            localStorage.setItem(ACTIVE_COURSE_KEY, list[0].course_id);
          }
        } else if (list.length > 0) {
          setActiveCourse(list[0]);
          localStorage.setItem(ACTIVE_COURSE_KEY, list[0].course_id);
        } else {
          setActiveCourse(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch student courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchStudentCourses();
  }, [currentUser?.id]);

  const selectCourse = (courseOrId) => {
    let target = null;
    if (typeof courseOrId === 'object' && courseOrId !== null) {
      target = courseOrId;
    } else {
      target = courses.find(c => String(c.course_id) === String(courseOrId) || String(c.enrollment_id) === String(courseOrId));
    }

    if (target) {
      setActiveCourse(target);
      localStorage.setItem(ACTIVE_COURSE_KEY, target.course_id);
    }
  };

  const value = {
    courses,
    activeCourse,
    setActiveCourse,
    selectCourse,
    refreshCourses: fetchStudentCourses,
    loadingCourses
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};
