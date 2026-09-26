import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiCheckSquare, FiCalendar, FiUploadCloud, FiLink,
  FiCheckCircle, FiClock, FiAlertCircle, FiX, FiExternalLink,
  FiLayers, FiAward, FiBookOpen
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Assignments = () => {
  const { currentUser } = useAuth();
  const { activeCourse, courses, selectCourse } = useCourse();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, submitted

  // Submit Modal
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const courseParam = activeCourse?.course_id ? `&course_id=${activeCourse.course_id}` : '';
      const res = await axios.get(`${API_BASE}api/student/assignments.php?user_id=${currentUser.id}${courseParam}`);
      if (res.data.status === 'success') {
        setAssignments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentUser?.id, activeCourse?.course_id]);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionLink) {
      toast.error('Please provide your project link (Google Drive, GitHub, Figma, etc.).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}api/student/assignments.php`, {
        assignment_id: activeAssignment.id,
        user_id: currentUser.id,
        submission_link: submissionLink,
        notes: submissionNotes
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Assignment submitted successfully!');
        setActiveAssignment(null);
        setSubmissionLink('');
        setSubmissionNotes('');
        fetchAssignments();
      } else {
        toast.error(res.data.message || 'Failed to submit assignment.');
      }
    } catch (err) {
      toast.error('Error submitting assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'submitted') return !!a.submission_id;
    if (filter === 'pending') return !a.submission_id;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 mx-auto ">
      {/* Header with Active Course Indicator */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-2xl">
            <FiCheckSquare size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Course Assignments & Practical Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Course: <span className="font-bold text-slate-700 dark:text-slate-200">{activeCourse?.course_title || 'Enrolled Course'}</span>
            </p>
          </div>
        </div>

        {/* Multi-Course Switcher if enrolled in multiple */}
        {courses && courses.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {courses.map((c) => (
              <button
                key={c.course_id}
                onClick={() => selectCourse(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCourse?.course_id === c.course_id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {c.course_code || c.course_title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          All Tasks ({assignments.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Pending ({assignments.filter(a => !a.submission_id).length})
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'submitted'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Submitted ({assignments.filter(a => !!a.submission_id).length})
        </button>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold">Loading Assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center">
          <FiCheckSquare size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Assignments in this view</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {filter === 'pending' ? 'Great job! You have submitted all assigned coursework.' : 'No tasks assigned for this course yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map((assignment) => {
            const isSubmitted = !!assignment.submission_id;
            return (
              <div
                key={assignment.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all p-6 flex flex-col justify-between ${
                  isSubmitted
                    ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/10'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {assignment.course_title || 'Core Project'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                        isSubmitted
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isSubmitted ? <FiCheckCircle size={11} /> : <FiClock size={11} />}
                      {isSubmitted ? (assignment.submission_status || 'Submitted') : 'Pending'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {assignment.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {assignment.description || 'No detailed instructions provided.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <FiCalendar size={13} className="text-indigo-500" />
                      Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Marks: {assignment.total_marks || 100}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isSubmitted ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={assignment.submission_link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <FiExternalLink size={12} /> View Submission
                        </a>
                        {assignment.marks_obtained !== null && (
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            Score: {assignment.marks_obtained}/{assignment.total_marks || 100}
                          </span>
                        )}
                      </div>
                      {assignment.feedback && (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Feedback: </span>
                          {assignment.feedback}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setActiveAssignment(assignment);
                          setSubmissionLink(assignment.submission_link || '');
                          setSubmissionNotes(assignment.student_notes || '');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Resubmit Project
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveAssignment(assignment);
                        setSubmissionLink('');
                        setSubmissionNotes('');
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 text-xs transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FiUploadCloud size={14} />
                      <span>Submit Assignment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setActiveAssignment(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl">
                <FiUploadCloud size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Submit Work
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">{activeAssignment.title}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Project Link (Google Drive / GitHub / Figma / Behance) *
                </label>
                <div className="relative">
                  <FiLink className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Notes / Explanation (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe your project solution..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center gap-2"
                >
                  <FiUploadCloud size={14} />
                  <span>{submitting ? 'Submitting...' : 'Confirm Submission'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
