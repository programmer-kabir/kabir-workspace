import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiFileText, FiFolder, FiDownload, FiExternalLink, FiSend,
  FiCheckCircle, FiClock, FiAlertTriangle, FiArrowRight,
  FiLink, FiEdit3, FiAward, FiCheck, FiPaperclip, FiUploadCloud,
  FiTrash2, FiFile, FiInfo, FiPlus, FiLoader, FiX, FiCheckSquare,
  FiZap
} from 'react-icons/fi';
import {
  HiAcademicCap, HiCheckBadge, HiOutlineTrophy, HiLightBulb
} from 'react-icons/hi2';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CreateiveComputerAcademy/server/';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileBadge = (ext = '') => {
  const extLower = (ext || '').toLowerCase();
  if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
  if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
  if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(extLower)) return { label: 'IMG', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
  return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
};

const AssignmentEngine = ({
  assignment,
  courseId,
  user,
  onComplete,
  onNextLesson,
  hasNextLesson
}) => {
  const [submissionTab, setSubmissionTab] = useState('both'); // 'link' | 'file' | 'both'
  const [submissionLink, setSubmissionLink] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileProgressMap, setFileProgressMap] = useState({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionData, setSubmissionData] = useState(assignment?.submission || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const sub = assignment?.submission || null;
    setSubmissionData(sub);
    if (sub) {
      setSubmissionLink(sub.submission_link || '');
      setNotes(sub.notes || '');

      let initialFiles = [];
      if (Array.isArray(sub.files) && sub.files.length > 0) {
        initialFiles = sub.files;
      } else if (sub.files_json) {
        try {
          const parsed = JSON.parse(sub.files_json);
          if (Array.isArray(parsed)) initialFiles = parsed;
        } catch (e) {}
      } else if (sub.file_url) {
        initialFiles = [{
          name: sub.file_name || 'Uploaded Project File',
          url: sub.file_url,
          size: sub.file_size || 0,
          ext: (sub.file_name || '').split('.').pop() || 'file'
        }];
      }
      setUploadedFiles(initialFiles);
      setIsEditing(false);
    } else {
      setSubmissionLink('');
      setUploadedFiles([]);
      setNotes('');
      setIsEditing(true);
    }
  }, [assignment?.id, assignment?.submission]);

  // Upload single file worker to R2
  const uploadSingleFileWorker = async (fileItem, index) => {
    const fileName = fileItem.name;
    setFileProgressMap(prev => ({ ...prev, [fileName]: 10 }));

    const formData = new FormData();
    formData.append('assignment_id', assignment.id || assignment.assignment_id);
    formData.append('course_id', courseId || 0);
    formData.append('user_id', user?.id || user?.student_id || 0);
    formData.append('index', index + 1);
    formData.append('file', fileItem);

    const res = await axios.post(`${API_BASE}api/student/courses/upload_single_assignment_file.php`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (pe) => {
        if (pe.total) {
          const p = Math.round((pe.loaded * 100) / pe.total);
          setFileProgressMap(prev => ({ ...prev, [fileName]: p }));
        }
      }
    });

    if (res.data?.status === 'success' && res.data.file) {
      setFileProgressMap(prev => ({ ...prev, [fileName]: 100 }));
      return res.data.file;
    } else {
      throw new Error(res.data?.message || 'File upload failed');
    }
  };

  // Multi-file parallel uploader
  const handleMultipleFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const fileArr = Array.from(filesList);
    const userId = user?.id || user?.student_id || 0;
    if (!userId) {
      toast.error('Please log in to upload files.');
      return;
    }

    setUploadingFiles(true);
    const CONCURRENCY = 3;
    let activeIndex = 0;
    const successful = [];
    const errors = [];

    const worker = async () => {
      while (activeIndex < fileArr.length) {
        const curIdx = activeIndex++;
        const curFile = fileArr[curIdx];

        if (curFile.size > 200 * 1024 * 1024) {
          toast.error(`${curFile.name} exceeds 200MB limit.`);
          setFileProgressMap(prev => ({ ...prev, [curFile.name]: -1 }));
          continue;
        }

        try {
          const uploadedResult = await uploadSingleFileWorker(curFile, curIdx);
          successful.push(uploadedResult);
          setUploadedFiles(prev => [...prev, uploadedResult]);
        } catch (err) {
          console.error(`Upload error for ${curFile.name}:`, err);
          errors.push(curFile.name);
          setFileProgressMap(prev => ({ ...prev, [curFile.name]: -1 }));
        }
      }
    };

    try {
      const workers = [];
      const count = Math.min(CONCURRENCY, fileArr.length);
      for (let i = 0; i < count; i++) {
        workers.push(worker());
      }
      await Promise.all(workers);

      if (successful.length > 0) {
        toast.success(`⚡ ${successful.length} টি ফাইল সফলভাবে আপলোড সম্পন্ন হয়েছে!`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} টি ফাইল আপলোডে সমস্যা হয়েছে।`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleMultipleFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (indexToRemove) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasLink = !!submissionLink.trim();
    const hasFiles = uploadedFiles && uploadedFiles.length > 0;

    if (!hasLink && !hasFiles) {
      toast.error('অনুগ্রহ করে এক বা একাধিক প্রজেক্ট ফাইল আপলোড করুন অথবা গুগল ড্রাইভ/লাইভ লিংক দিন।');
      return;
    }

    const userId = user?.id || user?.student_id || 0;
    if (!userId) {
      toast.error('Please log in to submit your assignment.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        assignment_id: assignment.id || assignment.assignment_id,
        course_id: courseId || 0,
        user_id: userId,
        submission_link: submissionLink.trim(),
        notes: notes.trim(),
        files: uploadedFiles
      };

      const res = await axios.post(`${API_BASE}api/student/courses/assignment_submission.php`, payload);

      if (res.data.status === 'success') {
        toast.success(res.data.message || '🎉 Assignment submitted successfully!');
        setSubmissionData(res.data.data);
        setIsEditing(false);

        // Fire celebration confetti
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch (e) {}

        if (typeof onComplete === 'function') {
          onComplete(assignment.id, true);
        }
      } else {
        toast.error(res.data.message || 'Failed to submit assignment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error submitting assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const submittedFilesList = (submissionData?.files && Array.isArray(submissionData.files) && submissionData.files.length > 0)
    ? submissionData.files
    : (submissionData?.file_url ? [{
        name: submissionData.file_name || 'Uploaded Project File',
        url: submissionData.file_url,
        size: submissionData.file_size || 0,
        ext: (submissionData.file_name || '').split('.').pop() || 'file'
      }] : []);

  const isSubmitted = !!submissionData?.submission_link || submittedFilesList.length > 0 || !!submissionData?.id;
  const isReviewed = submissionData?.status === 'reviewed';
  const marksObtained = submissionData?.marks_obtained;
  const totalMarks = assignment?.total_marks || 100;
  const passMarks = assignment?.pass_marks || 50;
  const isPassed = marksObtained !== null && marksObtained !== undefined ? marksObtained >= passMarks : false;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Hero Assignment Card */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl p-6 sm:p-10 space-y-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors">
        
        {/* Header Banner */}
        <div className="flex items-start justify-between gap-4 flex-wrap pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 text-xs font-black uppercase tracking-wider font-mono">
              <FiFolder size={15} />
              <span>Practical Hands-on Project</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {assignment?.title || 'Practical Module Assignment'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Complete the hands-on project task according to the brief below. Upload your multiple project files directly or share a Google Drive link for instructor review.
            </p>
          </div>

          {/* Submission Status Pill */}
          <div className="shrink-0">
            {isReviewed ? (
              <span className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-xs ${
                isPassed
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
              }`}>
                <HiCheckBadge size={16} />
                <span>Reviewed • {marksObtained}/{totalMarks} Marks</span>
              </span>
            ) : isSubmitted ? (
              <span className="px-4 py-2 rounded-2xl text-xs font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 flex items-center gap-1.5 shadow-xs">
                <FiCheckCircle size={15} />
                <span>Submitted • Awaiting Review</span>
              </span>
            ) : (
              <span className="px-4 py-2 rounded-2xl text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shadow-xs">
                <FiClock size={15} />
                <span>Pending Submission</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{totalMarks} Marks</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pass Requirement</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{passMarks} Marks</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submission Format</span>
            <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
              <FiZap size={13} />
              <span>Multi-File & Drive Link</span>
            </p>
          </div>
        </div>

        {/* Project Brief & Requirements Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FiFileText size={16} className="text-amber-600 dark:text-amber-400" />
            <span>প্রজেক্টের বিস্তারিত নির্দেশনা (Project Brief & Requirements)</span>
          </h3>

          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
            {assignment?.description || 'No detailed instructions provided for this project task.'}
          </div>
        </div>

        {/* Starter Resources / Attachment Packs */}
        {assignment?.resources && assignment.resources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FiPaperclip size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>প্রয়োজনীয় রিসোর্স ও ফাইল ডাউনলোড (Starter Assets):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignment.resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 flex items-center justify-between gap-3 text-xs font-bold text-indigo-950 dark:text-indigo-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                      <FiDownload size={14} />
                    </span>
                    <span className="truncate">{res.title || 'Download Project Resource'}</span>
                  </div>
                  <FiExternalLink size={14} className="text-slate-400 shrink-0 group-hover:text-indigo-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMISSION STATE 1: ALREADY SUBMITTED REVIEW CARD ── */}
        {isSubmitted && !isEditing && (
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className={`p-6 rounded-3xl border-2 space-y-4 ${
              isReviewed
                ? isPassed
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80'
                  : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80'
                : 'bg-slate-50 dark:bg-slate-900/60 border-indigo-200 dark:border-indigo-900/60'
            }`}>
              
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-3 w-full max-w-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    আপনার জমাকৃত প্রজেক্ট ফাইল ও লিংক (Your Submissions)
                  </span>

                  {/* Uploaded Multi-Files List */}
                  {submittedFilesList.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FiFolder size={14} className="text-indigo-600" />
                        <span>আপলোডকৃত প্রজেক্ট ফাইলসমূহ ({submittedFilesList.length} টি):</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {submittedFilesList.map((fItem, fIdx) => {
                          const badge = getFileBadge(fItem.ext || fItem.name?.split('.').pop());
                          const directUrl = fItem.url?.startsWith('http') ? fItem.url : `${API_BASE}${fItem.url}`;
                          return (
                            <div key={fIdx} className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs group">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black border shrink-0 ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]" title={fItem.name}>
                                    {fItem.name}
                                  </p>
                                  {fItem.size > 0 && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      {formatBytes(fItem.size)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <a
                                href={directUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-all shrink-0"
                                title="Download File"
                              >
                                <FiDownload size={14} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submitted Link Item */}
                  {submissionData.submission_link && (
                    <div className="pt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        লাইভ / ড্রাইভ লিংক:
                      </span>
                      <div className="flex items-center gap-2">
                        <FiLink size={14} className="text-indigo-600 shrink-0" />
                        <a
                          href={submissionData.submission_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-md"
                        >
                          <span className="truncate">{submissionData.submission_link}</span>
                          <FiExternalLink size={12} className="shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                >
                  <FiEdit3 size={13} />
                  <span>Update / Resubmit</span>
                </button>
              </div>

              {submissionData.notes && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Student Notes:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 whitespace-pre-line">
                    {submissionData.notes}
                  </p>
                </div>
              )}

              {/* Reviewer Feedback & Grade */}
              {isReviewed && (
                <div className="pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <HiLightBulb size={15} />
                      <span>Instructor Review & Score:</span>
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs font-mono">
                      {marksObtained} / {totalMarks}
                    </span>
                  </div>
                  {submissionData.feedback && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                      "{submissionData.feedback}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Next Lesson Action */}
            {hasNextLesson && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={onNextLesson}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Next Lesson</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMISSION STATE 2: LIVE MULTI-FILE SUBMISSION FORM ── */}
        {(!isSubmitted || isEditing) && (
          <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FiSend size={14} className="text-indigo-600" />
                <span>আপনার তৈরি করা প্রজেক্ট জমা দিন (Submit Project Task):</span>
              </h4>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSubmissionTab('file')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    submissionTab === 'file'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FiUploadCloud size={13} />
                  <span>ফাইল আপলোড</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionTab('link')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    submissionTab === 'link'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FiLink size={13} />
                  <span>ড্রাইভ লিংক</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionTab('both')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    submissionTab === 'both'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>দুটোই (Both)</span>
                </button>
              </div>
            </div>

            {/* 1. HIGH-SPEED MULTI-FILE UPLOAD ZONE */}
            {(submissionTab === 'file' || submissionTab === 'both') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    📁 প্রজেক্ট ফাইল আপলোড (একসাথে একাধিক ফাইল আপলোড করা যাবে) {submissionTab === 'file' ? '*' : '(যদি থাকে)'}
                  </label>
                  {uploadedFiles.length > 0 && (
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {uploadedFiles.length} টি ফাইল যুক্ত হয়েছে
                    </span>
                  )}
                </div>
                
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".zip,.rar,.7z,.tar,.gz,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.psd,.ai,.xd,.fig,.png,.jpg,.jpeg,.webp,.mp4"
                />

                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[0.99]'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#070b14]/50 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-[#070b14]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                    {uploadingFiles ? <FiLoader size={24} className="animate-spin" /> : <FiUploadCloud size={24} />}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {uploadingFiles ? 'ফাইল ক্লাউডে আপলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' : 'কম্পিউটার থেকে একাধিক ফাইল সিলেক্ট করতে ক্লিক করুন অথবা টেনে এনে ছেড়ে দিন'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    হাই-স্পিড মাল্টি-ফাইল আপলোড: ZIP, PSD, AI, PDF, DOCX, PNG, JPG (প্রতিটি সর্বোচ্চ ২০০MB)
                  </p>
                </div>

                {/* Active Uploading / Uploaded Files Grid */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {uploadedFiles.map((fileObj, idx) => {
                      const badge = getFileBadge(fileObj.ext || fileObj.name?.split('.').pop());
                      const prog = fileProgressMap[fileObj.name] || 100;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 relative overflow-hidden"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black border shrink-0 ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]" title={fileObj.name}>
                                {fileObj.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {formatBytes(fileObj.size)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                            title="Remove file"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. DRIVE / LIVE LINK INPUT */}
            {(submissionTab === 'link' || submissionTab === 'both') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  🔗 প্রজেক্ট বা ড্রাইভ লিংক (Google Drive / Figma / GitHub / Behance / Dropbox) {submissionTab === 'link' ? '*' : '(যদি থাকে)'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/... or https://www.figma.com/file/..."
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  <FiLink size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  💡 Google Drive লিংক দেওয়ার ক্ষেত্রে নিশ্চিত করুন যে ফাইলের অ্যাক্সেস "Anyone with the link can view" দেওয়া আছে।
                </p>
              </div>
            )}

            {/* 3. STUDENT NOTES */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                📝 কোনো বিশেষ মন্তব্য বা নোট (Optional Notes)
              </label>
              <textarea
                rows="2"
                placeholder="প্রজেক্টটি তৈরি করার অভিজ্ঞতা, ব্যবহৃত টুলস বা শিক্ষককে জানানোর মতো কোনো মন্তব্য থাকলে এখানে লিখুন..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isSubmitted && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || uploadingFiles}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSend size={16} />
                <span>{submitting ? 'Submitting Project...' : isSubmitted ? 'Save Updated Submission' : 'Submit Assignment Project'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AssignmentEngine;
