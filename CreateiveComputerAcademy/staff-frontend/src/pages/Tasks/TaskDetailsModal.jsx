import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  FiClock, FiCheckCircle, FiPlayCircle, FiEye, FiSearch, FiFilter,
  FiCalendar, FiX, FiInfo, FiLink, FiDownload,
  FiSend, FiMessageSquare, FiTrash2, FiEdit2, FiImage, FiFlag,
  FiPauseCircle, FiCheckSquare, FiCode, FiExternalLink, FiUploadCloud,
  FiPackage, FiFileText, FiAlertTriangle, FiAlertCircle, FiStar, FiAward, FiLock
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import MarketplaceSubmissions from '../../components/MarketplaceSubmissions';
import TaskFileUploader from '../../components/TaskFileUploader';
import TaskDeliverablesViewer from '../../components/TaskDeliverablesViewer';
import AgenticBlueprintViewer from '../../components/AgenticBlueprintViewer';
import AIQualityScanner from '../../components/AIQualityScanner';
import { downloadFile } from '../../utils/fileDownloader';
import DownloadStartPromptModal from './DownloadStartPromptModal';

const TaskDetailsModal = (props) => {
  const {
    selectedTask, setSelectedTask, API_BASE, currentUser,
    handleStartTask, handleClaimTask, handleToggleTimer, formatTimeSpent,
    stripHtml, DynamicJsonViewer, DescriptionRenderer,
    comments, newComment, setNewComment, commentsLoading, addingComment,
    handleCommentSubmit, handleLoadComments, handleDeleteComment, handleSaveEdit,
    editingCommentId, setEditingCommentId, editCommentText, setEditCommentText,
    commentImagePreview, setCommentImagePreview, setCommentImage, commentImage,
    lightboxImage, setLightboxImage, lightboxScale, setLightboxScale,
    zoomPos, setZoomPos, isHovered, setIsHovered, closeLightbox,
    detailsTab, setDetailsTab, submissionLink, setSubmissionLink,
    handleSubmitWork, isSubmittingWork, commentsEndRef
  } = props;

  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [taskTab, setTaskTab] = useState('brief'); // 'brief' | 'deliverables' | 'reviewer_final'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const [pendingDownload, setPendingDownload] = useState(null);

  const handleSafeDownload = (url, fileName = null) => {
    if (!selectedTask || !url) return;
    if (selectedTask.status === 'To-Do' || selectedTask.status === 'Rejected') {
      setPendingDownload({ url, fileName });
    } else {
      downloadFile(url, fileName);
    }
  };

  const handleConfirmStartAndDownload = async () => {
    if (!pendingDownload || !selectedTask) return;
    const { url, fileName } = pendingDownload;
    setPendingDownload(null);

    if (handleStartTask) {
      await handleStartTask(null, selectedTask.id);
    }
    downloadFile(url, fileName);
  };

  useEffect(() => {
    if (selectedTask?.status !== 'In Progress') {
      setCooldownSecs(0);
      return;
    }

    const computeRemaining = () => {
      const startTimeStr = selectedTask.in_progress_at || selectedTask.session_start_time || selectedTask.updated_at || selectedTask.created_at;
      if (!startTimeStr) return 0;

      const parsedStart = new Date(startTimeStr.replace(' ', 'T')).getTime();
      if (isNaN(parsedStart)) return 0;

      const now = Date.now();
      const elapsedSecs = Math.max(0, Math.floor((now - parsedStart) / 1000));
      const minReqSecs = 1 * 60; 
      return Math.max(0, minReqSecs - elapsedSecs);
    };

    const initialRem = computeRemaining();
    setCooldownSecs(initialRem);

    if (initialRem <= 0) return;

    const timer = setInterval(() => {
      setCooldownSecs(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTask?.id, selectedTask?.status, selectedTask?.in_progress_at, selectedTask?.session_start_time]);

  const formatCooldown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs < 10 ? '0' : ''}${remSecs}s`;
  };

  const blueprintData = React.useMemo(() => {
    if (!selectedTask?.blueprint_data) return null;
    if (typeof selectedTask.blueprint_data === 'string') {
      try {
        return JSON.parse(selectedTask.blueprint_data);
      } catch (e) {
        return null;
      }
    }
    return selectedTask.blueprint_data;
  }, [selectedTask?.blueprint_data]);

  useEffect(() => {
    setSubmissionFiles([]);
    setIsScannerOpen(false);
    if (selectedTask?.final_delivery) {
      setTaskTab('reviewer_final');
    } else if (selectedTask?.status === 'In Review' || selectedTask?.status === 'Completed' || (selectedTask?.submissions && selectedTask.submissions.length > 0)) {
      setTaskTab('deliverables');
    } else {
      setTaskTab('brief');
    }
  }, [selectedTask?.id]);

  useEffect(() => {
    if (isScannerOpen && (!submissionFiles || submissionFiles.length === 0)) {
      setIsScannerOpen(false);
    }
  }, [submissionFiles, isScannerOpen]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'In Review':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Rejected':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'To-Do':
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <>
      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-white/10 shadow-2xl rounded-none sm:rounded-3xl w-full max-w-[1500px] h-full sm:h-auto sm:max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 select-text text-slate-800 dark:text-slate-100"
          >
            {/* ──────── Modal Header ──────── */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                  <FiInfo size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                      ID #{selectedTask.id}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white/60 bg-slate-100 dark:bg-white/5 px-2 sm:px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                      {selectedTask.category || 'General'}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-md border ${getStatusBadge(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                    {(Number(selectedTask.is_self_created) === 1 || selectedTask.is_self_created === true) && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
                        <HiSparkles size={12} className="text-amber-400" /> Self-Initiated
                      </span>
                    )}
                    {(selectedTask?.creation_mode === 'agentic' || Boolean(blueprintData) || (Array.isArray(selectedTask?.blueprint_variants) && selectedTask.blueprint_variants.length > 0)) && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1 font-mono">
                        <HiSparkles size={12} className="text-amber-400" /> AI Blueprint
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all outline-none cursor-pointer"
                  title="Close (Esc)"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* ──────── Modal Body (Left: Brief/Deliverables, Right: Comments/Activity) ──────── */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

              {/* ──────── LEFT: MAIN CONTENT ──────── */}
              <div className="w-full lg:w-[75%] p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 flex flex-col space-y-5 sm:space-y-6 bg-white dark:bg-transparent">

                {/* Title & Rejection Banner */}
                <div className="space-y-4">
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                    {selectedTask.title}
                  </h2>

                  {/* View-Only Mode Banner for To-Do / Rejected */}
                  {(selectedTask.status === 'To-Do' || selectedTask.status === 'Rejected') && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 dark:border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                          <FiEye size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              {selectedTask.status === 'Rejected' ? 'Revision Needed (View Mode)' : 'Viewing Mode'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                              Timer Not Started
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5 leading-snug">
                            You are currently previewing this task. Click start when you are ready to begin working.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleStartTask && handleStartTask(e, selectedTask.id)}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      >
                        <FiPlayCircle size={16} />
                        <span>{selectedTask.status === 'Rejected' ? 'Restart & Fix Task' : 'Start Task Now'}</span>
                      </button>
                    </div>
                  )}

                  {/* If Rejected: Sleek Rejection Alert Card */}
                  {selectedTask.status === 'Rejected' && (selectedTask.rejection_reason || selectedTask.rejection_image) && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-gradient-to-br dark:from-red-950/40 dark:via-red-900/20 dark:to-slate-900/50 border border-red-200 dark:border-red-500/30 shadow-lg space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/20 text-red-500 dark:text-red-400 rounded-xl shrink-0 mt-0.5">
                          <FiAlertTriangle size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                            Revision Required — Reviewer Feedback
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-white/90 leading-relaxed mt-1 whitespace-pre-wrap">
                            {selectedTask.rejection_reason || 'Please review the comments and resubmit once revised.'}
                          </p>
                        </div>
                      </div>

                      {selectedTask.rejection_image && (
                        <div className="pl-10 pt-1">
                          <p className="text-[10px] font-bold text-red-600 dark:text-red-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <FiImage size={12} /> Issue Screenshot Attachment (Click to Zoom)
                          </p>
                          <button
                            type="button"
                            onClick={() => setLightboxImage(`${API_BASE}${selectedTask.rejection_image}`)}
                            className="relative block rounded-2xl overflow-hidden border border-red-300 dark:border-red-500/40 hover:border-red-400 transition-all max-w-sm outline-none group aspect-video"
                          >
                            <img
                              src={`${API_BASE}${selectedTask.rejection_image}`}
                              alt="Rejection Screenshot"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold flex items-center gap-1.5">
                                <FiEye size={14} /> Zoom Image
                              </span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Segmented 3-Tab Navigation */}
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTaskTab('brief')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${taskTab === 'brief'
                        ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                        : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                      <FiFileText size={15} className={taskTab === 'brief' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-white/40'} />
                      <span>Task Brief & Instructions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaskTab('deliverables')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${taskTab === 'deliverables'
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                      <FiPackage size={15} className={taskTab === 'deliverables' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-white/40'} />
                      <span>My Submissions</span>
                      {selectedTask.submissions && selectedTask.submissions.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-200">
                          {selectedTask.submissions.length}
                        </span>
                      )}
                    </button>

                    {/* Dedicated 3rd Tab: Reviewer Final Version */}
                    {selectedTask.final_delivery && (
                      <button
                        type="button"
                        onClick={() => setTaskTab('reviewer_final')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${taskTab === 'reviewer_final'
                          ? 'bg-gradient-to-r from-blue-600/15 to-indigo-600/15 dark:from-blue-600/30 dark:to-indigo-600/30 text-blue-700 dark:text-white border border-blue-500/40 dark:border-blue-500/50 shadow-sm shadow-blue-500/10'
                          : 'text-blue-600 dark:text-blue-300/70 hover:text-blue-700 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent'
                          }`}
                      >
                        <HiSparkles size={16} className="text-amber-500 dark:text-amber-400" />
                        <span>Reviewer Final Version</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[9px] font-black uppercase">
                          Stock-Ready
                        </span>
                      </button>
                    )}

                    {/* 4th Tab: Marketplace Submissions (Completed/In Review only) */}
                    {(selectedTask.status === 'Completed' || selectedTask.status === 'In Review') && (
                      <button
                        type="button"
                        onClick={() => setTaskTab('markets')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${taskTab === 'markets'
                          ? 'bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/10'
                          : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                      >
                        <span>📦</span>
                        <span>Markets</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── TAB 1: REVIEWER FINAL VERSION ── */}
                {taskTab === 'reviewer_final' && selectedTask.final_delivery ? (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="p-6 sm:p-7 rounded-3xl bg-slate-50 dark:bg-gradient-to-br dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-slate-200 dark:border-blue-500/30 space-y-5 shadow-sm dark:shadow-xl">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                            <HiSparkles size={24} className="text-amber-500 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-slate-900 dark:text-white font-black text-base tracking-wide">
                                Reviewer Corrected Stock Version
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 text-[10px] font-bold">
                                Stock-Ready
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-white/50 text-xs mt-0.5">
                              Approved & Verified by <strong className="text-blue-600 dark:text-blue-300">{selectedTask.final_delivery.reviewer_name || 'Reviewer'}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {selectedTask.final_delivery.final_image_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = selectedTask.final_delivery.final_image_url.startsWith('http')
                                  ? selectedTask.final_delivery.final_image_url
                                  : `${API_BASE}${selectedTask.final_delivery.final_image_url}`;
                                handleSafeDownload(url, `${selectedTask.id}_final_preview.jpg`);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm"
                            >
                              <FiDownload size={14} className="text-slate-500 dark:text-white/70" /> Download Preview JPG
                            </button>
                          )}

                          {selectedTask.final_delivery.final_file_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = selectedTask.final_delivery.final_file_url.startsWith('http')
                                  ? selectedTask.final_delivery.final_file_url
                                  : `${API_BASE}${selectedTask.final_delivery.final_file_url}`;
                                handleSafeDownload(url);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-500/20"
                            >
                              <FiDownload size={15} /> Download Final PSD
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reviewer Fix Notes */}
                      {selectedTask.final_delivery.fix_notes && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-white/80 space-y-1">
                          <span className="text-slate-400 dark:text-white/40 font-bold uppercase text-[10px] block tracking-wider">
                            Correction Remarks & Guidance:
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{selectedTask.final_delivery.fix_notes}</p>
                        </div>
                      )}

                      {/* Reviewer Final Preview Image */}
                      {selectedTask.final_delivery.final_image_url && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-slate-500 dark:text-white/40 font-bold uppercase text-[10px] tracking-wider">
                              Final Approved Preview Image (Click to Zoom)
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = selectedTask.final_delivery.final_image_url.startsWith('http')
                                  ? selectedTask.final_delivery.final_image_url
                                  : `${API_BASE}${selectedTask.final_delivery.final_image_url}`;
                                handleSafeDownload(url, `${selectedTask.id}_final_preview.jpg`);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                              <FiDownload size={12} /> Download Image
                            </button>
                          </div>

                          <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-blue-500/30 bg-white dark:bg-black/40 shadow-sm dark:shadow-md group relative cursor-pointer"
                            onClick={() => setLightboxImage(selectedTask.final_delivery.final_image_url.startsWith('http') ? selectedTask.final_delivery.final_image_url : `${API_BASE}${selectedTask.final_delivery.final_image_url}`)}>
                            <img
                              src={selectedTask.final_delivery.final_image_url.startsWith('http') ? selectedTask.final_delivery.final_image_url : `${API_BASE}${selectedTask.final_delivery.final_image_url}`}
                              alt="Final Stock Preview"
                              className="w-full max-h-80 object-contain group-hover:scale-[1.02] transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                <FiEye size={14} /> Zoom Image
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : taskTab === 'markets' ? (
                  /* ── TAB: MARKETPLACE SUBMISSIONS ── */
                  <div className="animate-in fade-in duration-200">
                    <MarketplaceSubmissions
                      taskId={selectedTask.id}
                      userId={currentUser?.id}
                      addedBy={null}
                      addedByRole={null}
                      canManage={false}
                    />
                  </div>
                ) : taskTab === 'deliverables' ? (
                  /* ── TAB 2: MY SUBMISSIONS & DELIVERABLES ── */

                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Active Upload & AI Scanner Area for In Progress / Rejected Tasks */}
                    {(selectedTask.status === 'In Progress' || selectedTask.status === 'Rejected') && (
                      <div className="space-y-5 p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            <FiUploadCloud className="text-blue-500 dark:text-blue-400" size={17} />
                            Submit Deliverables & Final Output
                          </label>
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                            Cloudflare R2 Direct
                          </span>
                        </div>

                        {selectedTask.status === 'In Progress' && cooldownSecs > 0 && (
                          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-in fade-in">
                            <FiLock size={16} className="text-amber-500 shrink-0 animate-pulse" />
                            <span>
                              To ensure work quality, a minimum 20-minute active work session is required before submission. Unlocks in: <strong className="font-mono text-amber-900 dark:text-amber-200">{formatCooldown(cooldownSecs)}</strong>
                            </span>
                          </div>
                        )}

                        <TaskFileUploader
                          files={submissionFiles}
                          setFiles={setSubmissionFiles}
                          taskId={selectedTask.id}
                          userId={currentUser?.id}
                          disabled={selectedTask.status === 'In Progress' && cooldownSecs > 0}
                          lockRemainingText={formatCooldown(cooldownSecs)}
                        />

                        {/* Optional Submission Link Input */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                            <FiLink size={13} className="text-blue-500 dark:text-blue-400" />
                            <span>Optional External Folder / Link (Google Drive, Figma, Proof URL)</span>
                          </label>
                          <input
                            type="url"
                            placeholder={selectedTask.status === 'In Progress' && cooldownSecs > 0 ? "Link submission locked during 20-min work period..." : "https://drive.google.com/... or https://figma.com/..."}
                            value={submissionLink || ''}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                            disabled={selectedTask.status === 'In Progress' && cooldownSecs > 0}
                            className={`w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none transition-all font-mono ${selectedTask.status === 'In Progress' && cooldownSecs > 0
                                ? 'bg-slate-100 dark:bg-white/[0.02] cursor-not-allowed opacity-60'
                                : 'bg-white dark:bg-white/[0.04] focus:border-blue-500 focus:bg-white dark:focus:bg-white/[0.07]'
                              }`}
                          />
                        </div>

                        {/* Real AI Quality Inspector Deck */}
                        {isScannerOpen && submissionFiles.length > 0 && (() => {
                          const previewFileObj = submissionFiles.find(f => {
                            const name = f?.name || f?.file?.name || (typeof f === 'string' ? f : '');
                            return /\.(jpg|jpeg|png|webp|gif)$/i.test(name) || (f?.file && f.file.type?.startsWith('image/'));
                          }) || submissionFiles[0];

                          const previewImageSrc = previewFileObj?.url || (previewFileObj?.file instanceof Blob ? previewFileObj.file : previewFileObj) || null;

                          return (
                            <AIQualityScanner
                              isOpen={isScannerOpen}
                              onClose={() => setIsScannerOpen(false)}
                              task={selectedTask}
                              file={previewFileObj?.file || (previewFileObj instanceof Blob ? previewFileObj : null)}
                              imageUrl={typeof previewImageSrc === 'string' ? previewImageSrc : null}
                              submissionFiles={submissionFiles}
                              onProceedSubmit={() => {
                                setIsScannerOpen(false);
                                handleSubmitWork(submissionLink?.trim() || selectedTask.submission_link, submissionFiles);
                              }}
                            />
                          );
                        })()}
                      </div>
                    )}

                    {/* Previous Submissions History */}
                    {selectedTask.submissions && selectedTask.submissions.length > 0 && (
                      <TaskDeliverablesViewer
                        submissions={selectedTask.submissions}
                        submissionLink={selectedTask.submission_link}
                        totalTimeSpent={selectedTask.total_time_spent}
                        submittedAt={selectedTask.submitted_at}
                        onImageClick={(url) => setLightboxImage(url)}
                      />
                    )}
                  </div>
                ) : (
                  /* ── TAB 2: TASK BRIEF & INSTRUCTIONS ── */
                  <div className="space-y-6 animate-in fade-in duration-200">

                    {/* ⭐ Review Evaluation Card (for Completed Tasks) */}
                    {selectedTask.status === 'Completed' && (selectedTask.review || selectedTask.rating || selectedTask.feedback_notes) && (
                      (() => {
                        const rev = selectedTask.review || {
                          rating: selectedTask.rating,
                          feedback_notes: selectedTask.feedback_notes,
                          tags: selectedTask.tags || selectedTask.review_tags || [],
                          reviewer_name: selectedTask.reviewer_name || selectedTask.reviewed_by_name || 'Reviewer'
                        };
                        const ratingVal = rev.rating ? Number(rev.rating) : 5;
                        return (
                          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 space-y-3 shadow-sm dark:shadow-md">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                                  <FiAward size={18} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                    Official Review Evaluation
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Evaluated by <strong className="text-slate-700 dark:text-slate-200">{rev.reviewer_name || 'Reviewer'}</strong>
                                  </p>
                                </div>
                              </div>

                              {ratingVal && (
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-black text-xs flex items-center gap-1.5 shadow-sm">
                                  <FiStar size={13} className="fill-amber-500 text-amber-500" /> {ratingVal} / 5 Stars
                                </span>
                              )}
                            </div>

                            {/* Stars icon row */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar
                                  key={star}
                                  size={20}
                                  className={`${star <= ratingVal
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                                    : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                />
                              ))}
                            </div>

                            {/* Reviewer Feedback Notes */}
                            {rev.feedback_notes && (
                              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-amber-500/20 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                "{rev.feedback_notes}"
                              </div>
                            )}

                            {/* Review Tags */}
                            {Array.isArray(rev.tags) && rev.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {rev.tags.map((tag, idx) => (
                                  <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {/* Pre-assigned Drive Folder Link */}
                    {selectedTask.submission_link && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 to-transparent">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                            <FiLink size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              Assigned Submission Folder
                            </h4>
                            <a
                              href={selectedTask.submission_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-300 hover:text-emerald-300 hover:underline truncate block mt-0.5 font-mono"
                            >
                              {selectedTask.submission_link}
                            </a>
                          </div>
                        </div>
                        <a
                          href={selectedTask.submission_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 transition-colors shrink-0"
                        >
                          <FiExternalLink size={15} />
                        </a>
                      </div>
                    )}

                    {/* Meta Stats Bar: Assigned Date, Deadline, Time Spent */}
                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <FiCalendar className="text-blue-500 dark:text-blue-400" /> Assigned Date
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {new Date(selectedTask.assign_date || selectedTask.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${selectedTask.deadline_status === 'overdue'
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                        : 'bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10'
                        }`}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${selectedTask.deadline_status === 'overdue' ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-slate-500 dark:text-white/40'
                          }`}>
                          <FiClock className={selectedTask.deadline_status === 'overdue' ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'} /> Deadline
                        </p>
                        <p className={`font-semibold text-sm ${selectedTask.deadline_status === 'overdue' ? 'text-red-600 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>
                          {selectedTask.deadline
                            ? new Date(selectedTask.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'No deadline'
                          }
                          {selectedTask.deadline_time && (
                            <span className="ml-1.5 text-xs text-slate-500 dark:text-white/50">
                              {new Date('1970-01-01T' + selectedTask.deadline_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><FiClock className="text-purple-500 dark:text-purple-400" /> Working Time</span>
                          {selectedTask.total_time_spent > 0 && Number(selectedTask.total_time_spent) < 120 && (
                            <span className="text-[9px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse">
                              ⚡ Fast Submit
                            </span>
                          )}
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm flex items-center gap-2">
                          <span>{formatTimeSpent(selectedTask)}</span>
                          {selectedTask.status === 'In Progress' && selectedTask.timer_status === 'Running' && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-sans font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span> Live
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* References (Images & Links) - Moved to top */}
                    {(selectedTask.ref_links || selectedTask.ref_image || selectedTask.visual_image) && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <FiImage className="text-purple-500 dark:text-purple-400" size={14} /> Reference Materials
                        </h4>

                        {/* Reference Links */}
                        {selectedTask.ref_links && (() => {
                          let links = [];
                          try {
                            const parsed = JSON.parse(selectedTask.ref_links);
                            links = Array.isArray(parsed) ? parsed : [selectedTask.ref_links];
                          } catch {
                            links = [selectedTask.ref_links];
                          }
                          links = links.filter(l => l && l.trim());
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

                        {/* Visual Images (Target) */}
                        {selectedTask.visual_image && (() => {
                          let imgs = [];
                          try {
                            const parsed = JSON.parse(selectedTask.visual_image);
                            imgs = Array.isArray(parsed) ? parsed : [selectedTask.visual_image];
                          } catch {
                            imgs = [selectedTask.visual_image];
                          }
                          imgs = imgs.filter(img => img && img.trim());
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
                                        onClick={() => setLightboxImage(fullUrl)}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                      />
                                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSafeDownload(fullUrl);
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
                        {selectedTask.ref_image && (() => {
                          let imgs = [];
                          try {
                            const parsed = JSON.parse(selectedTask.ref_image);
                            imgs = Array.isArray(parsed) ? parsed : [selectedTask.ref_image];
                          } catch {
                            imgs = [selectedTask.ref_image];
                          }
                          imgs = imgs.filter(img => img && img.trim());
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
                                        onClick={() => setLightboxImage(fullUrl)}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                      />
                                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSafeDownload(fullUrl);
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
                    {selectedTask.checklists && selectedTask.checklists.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <FiCheckSquare className="text-blue-500 dark:text-blue-400" size={14} /> Sub-tasks & Checklist
                        </h4>
                        <div className="grid gap-2">
                          {selectedTask.checklists.map((cl, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleToggleChecklist && handleToggleChecklist(idx)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${cl.is_completed
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                }`}
                            >
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${cl.is_completed
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5'
                                }`}>
                                <FiCheckSquare size={13} className={cl.is_completed ? 'opacity-100 text-white' : 'opacity-0'} />
                              </div>
                              <span className={`text-xs font-medium ${cl.is_completed ? 'line-through text-slate-400 dark:text-white/40' : 'text-slate-900 dark:text-white'}`}>
                                {cl.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specifications & Description (Adaptive: Agentic Blueprint Studio vs Classic Description) */}
                    <div className="space-y-2">
                      {blueprintData || (selectedTask.blueprint_variants && selectedTask.blueprint_variants.length > 0) ? (
                        <AgenticBlueprintViewer
                          blueprint={blueprintData}
                          variants={selectedTask.blueprint_variants || []}
                        />
                      ) : (
                        <>
                          <h4 className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <FiFileText className="text-blue-500 dark:text-blue-400" size={14} /> Task Description & Specifications
                          </h4>
                          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                            <DescriptionRenderer
                              htmlContent={selectedTask.description}
                              onImageClick={(url) => setLightboxImage(url.startsWith('http') ? url : `${API_BASE}${url}`)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                )}

              </div> {/* End of LEFT column */}

              {/* ──────── RIGHT: COMMENTS & ACTIVITY ──────── */}
              <div className="w-full lg:w-[35%] flex flex-col bg-slate-50/70 dark:bg-slate-950/40 relative">

                {/* Comments / Activity Switcher */}
                <div className="px-6 pt-5 pb-0 border-b border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 flex gap-6">
                  <button
                    onClick={() => setDetailsTab('comments')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 ${detailsTab === 'comments' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
                      }`}
                  >
                    <FiMessageSquare size={14} />
                    <span>Comments</span>
                    {comments.length > 0 && (
                      <span className="bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {comments.length}
                      </span>
                    )}
                    {detailsTab === 'comments' && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full shadow-sm shadow-blue-500" />
                    )}
                  </button>

                  <button
                    onClick={() => setDetailsTab('history')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 ${detailsTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
                      }`}
                  >
                    <FiClock size={14} />
                    <span>Activity Log</span>
                    {detailsTab === 'history' && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full shadow-sm shadow-blue-500" />
                    )}
                  </button>
                </div>

                {/* Stream Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  {detailsTab === 'comments' && (
                    <>
                      {commentsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                          <FiMessageSquare className="mx-auto text-slate-300 dark:text-white/10 mb-2" size={28} />
                          <p className="text-xs text-slate-500 dark:text-white/40 font-semibold">No comments yet. Start the conversation!</p>
                        </div>
                      ) : (
                        comments.map(c => {
                          const isMe = c.user_id === currentUser.id;
                          return (
                            <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                                {c.profile_picture ? (
                                  <img src={`${API_BASE}${c.profile_picture}`} alt={c.user_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-black uppercase">
                                    {c.user_name?.charAt(0)}
                                  </div>
                                )}
                              </div>

                              {/* Bubble */}
                              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  {!isMe && <span className="text-[11px] font-bold text-slate-600 dark:text-white/60">{c.user_name}</span>}
                                  {c.user_role === 'admin' && (
                                    <span className="text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded border border-blue-500/30">
                                      Admin
                                    </span>
                                  )}
                                </div>

                                {editingCommentId === c.id ? (
                                  <div className="flex flex-col gap-2 w-full min-w-[220px]">
                                    <textarea
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      autoFocus
                                      className="w-full px-3 py-2 text-xs border border-blue-500 rounded-xl outline-none resize-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveEdit(c.id)}
                                        className="flex-1 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-all"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                        className="flex-1 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed relative group border ${isMe
                                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-sm'
                                    : 'bg-white dark:bg-white/[0.05] text-slate-800 dark:text-white/90 border-slate-200 dark:border-white/10 rounded-tl-none shadow-sm'
                                    }`}>
                                    {c.image && (
                                      <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightboxImage(`${API_BASE}${c.image}`)}>
                                        <img src={`${API_BASE}${c.image}`} alt="Attachment" className="max-h-48 object-cover rounded-xl" />
                                      </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{c.comment}</p>
                                    {isMe && (
                                      <div className="absolute -top-3 left-1 hidden group-hover:flex gap-1">
                                        <button
                                          onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }}
                                          className="w-5 h-5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white rounded-full flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white"
                                          title="Edit"
                                        >
                                          <FiEdit2 size={9} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(c.id)}
                                          className="w-5 h-5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 hover:text-white"
                                          title="Delete"
                                        >
                                          <FiTrash2 size={9} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <span className={`text-[10px] text-slate-400 dark:text-white/30 mt-1 font-mono ${isMe ? 'text-right' : ''}`}>
                                  {(() => {
                                    if (!c.created_at) return '';
                                    let str = String(c.created_at).trim().replace(' ', 'T');
                                    if (!str.includes('+') && !str.endsWith('Z')) str += '+06:00';
                                    return new Date(str).toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
                                  })()}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={commentsEndRef} />
                    </>
                  )}

                  {detailsTab === 'history' && (
                    <div className="space-y-4">
                      {(!selectedTask.history || selectedTask.history.length === 0) ? (
                        <p className="text-xs text-slate-400 dark:text-white/40 italic text-center py-8">No activity logs recorded yet.</p>
                      ) : (
                        <div className="relative border-l border-slate-200 dark:border-white/10 ml-3 space-y-6 pb-4 pt-2">
                          {selectedTask.history.map((h, i) => (
                            <div key={i} className="relative pl-6">
                              <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full -left-[5px] top-1 ring-4 ring-slate-100 dark:ring-slate-900" />
                              <p className="text-xs font-bold text-slate-800 dark:text-white/90">{h.action_text}</p>
                              <p className="text-[10px] text-slate-400 dark:text-white/40 font-mono mt-1">
                                By {h.performed_by_name} • {new Date(h.created_at.includes('T') || h.created_at.includes('Z') ? h.created_at : h.created_at.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Add Comment Input Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 mt-auto sticky bottom-0 z-10">
                  {commentImagePreview && (
                    <div className="mb-2 relative inline-block">
                      <img src={commentImagePreview} alt="Preview" className="h-16 rounded-xl object-cover border border-slate-300 dark:border-white/20" />
                      <button
                        type="button"
                        onClick={() => { setCommentImage(null); setCommentImagePreview(null); }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-sm"
                      >
                        <FiX size={11} />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                    <label className="shrink-0 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 flex items-center justify-center cursor-pointer transition-colors" title="Attach Image">
                      <FiImage size={15} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCommentImage(file);
                            setCommentImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={(!newComment.trim() && !commentImage) || addingComment}
                      className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-sm"
                    >
                      {addingComment ? <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div> : <FiSend size={13} />}
                    </button>
                  </form>
                </div>

              </div>
            </div>

            {/* ──────── Modal Footer (Ultra Slim Unified Action Bar) ──────── */}
            <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
              {/* Left: Working Time & Live Status / Quick Scanner Toggle */}
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-wrap">
                {selectedTask.status === 'In Progress' ? (
                  <>
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
                        <FiClock className="text-purple-500 dark:text-purple-400" size={13} /> Time:
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {formatTimeSpent(selectedTask)}
                      </span>
                      {selectedTask.timer_status === 'Running' && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-sans font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:text-emerald-400 animate-ping"></span> Live
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTaskTab('deliverables');
                        setIsScannerOpen(prev => !prev);
                      }}
                      className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer ${isScannerOpen
                          ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        }`}
                    >
                      <HiSparkles size={13} className={isScannerOpen ? 'text-white' : 'text-amber-400 animate-pulse'} />
                      <span>{isScannerOpen ? 'Hide Scanner' : '✨ AI Inspector'}</span>
                    </button>
                  </>
                ) : selectedTask.status === 'Rejected' ? (
                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs">
                    <FiAlertCircle size={13} /> Revision Required
                  </span>
                ) : selectedTask.status === 'In Review' ? (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs">
                    <FiClock size={13} /> Awaiting Reviewer
                  </span>
                ) : selectedTask.status === 'Completed' ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs">
                    <FiCheckCircle size={13} /> Completed
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-white/50">
                    <FiInfo size={13} /> Ready to start
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 font-bold rounded-xl transition-colors text-xs"
                >
                  Close
                </button>

                {selectedTask.status === 'In Progress' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (cooldownSecs > 0) return;
                      if (taskTab !== 'deliverables') {
                        setTaskTab('deliverables');
                      }
                      handleSubmitWork(submissionLink?.trim() || selectedTask.submission_link, submissionFiles);
                    }}
                    disabled={cooldownSecs > 0 || isSubmittingWork || (submissionFiles.length === 0 && !submissionLink?.trim() && !selectedTask.submission_link)}
                    className={`px-5 py-2 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer ${cooldownSecs > 0
                        ? 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40 cursor-not-allowed border border-slate-300 dark:border-white/10 shadow-none'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/20 disabled:opacity-40'
                      }`}
                    title={cooldownSecs > 0 ? `Minimum 20 minutes of work required before submitting (Remaining: ${formatCooldown(cooldownSecs)})` : 'Submit Work for Review'}
                  >
                    {isSubmittingWork ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : cooldownSecs > 0 ? (
                      <FiLock size={14} className="text-amber-500 dark:text-amber-400 animate-pulse" />
                    ) : (
                      <FiCheckCircle size={14} />
                    )}
                    <span>
                      {isSubmittingWork
                        ? 'Submitting...'
                        : cooldownSecs > 0
                          ? `Available in ${formatCooldown(cooldownSecs)}`
                          : 'Submit Work for Review'}
                    </span>
                  </button>
                ) : selectedTask.status === 'Rejected' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (taskTab !== 'deliverables') {
                        setTaskTab('deliverables');
                      } else {
                        handleSubmitWork(submissionLink?.trim() || selectedTask.submission_link, submissionFiles);
                      }
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 text-xs"
                  >
                    <FiCheckCircle size={14} />
                    <span>{taskTab === 'deliverables' ? 'Resubmit for Review' : 'Upload Revised Files'}</span>
                  </button>
                ) : selectedTask.status === 'To-Do' ? (
                  <button
                    onClick={(e) => { handleStartTask(e, selectedTask.id); setSelectedTask(null); }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-950/20 flex items-center gap-2 text-xs active:scale-95"
                  >
                    <FiPlayCircle size={15} /> Start Task
                  </button>
                ) : selectedTask.status === 'Unassigned' && handleClaimTask ? (
                  <button
                    onClick={(e) => { handleClaimTask(e, selectedTask); }}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs active:scale-95"
                  >
                    <FiCheckSquare size={15} /> Claim Task
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Lightbox Modal with Zoom ── */}
      {lightboxImage && createPortal(
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-zoom-out" onClick={closeLightbox} />

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg outline-none"
            title="Close Preview"
          >
            <FiX size={24} />
          </button>

          {/* Zoom controls bar */}
          <div className="absolute bottom-6 z-10 bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center gap-4 text-white shadow-2xl">
            <button
              onClick={() => setLightboxScale(prev => Math.max(0.5, prev - 0.25))}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors font-bold text-lg w-8 h-8 flex items-center justify-center outline-none"
              title="Zoom Out"
            >
              -
            </button>
            <span className="text-xs font-bold font-mono tracking-wider w-12 text-center select-none text-white/80">
              {Math.round(lightboxScale * 100)}%
            </span>
            <button
              onClick={() => setLightboxScale(prev => Math.min(3, prev + 0.25))}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors font-bold text-lg w-8 h-8 flex items-center justify-center outline-none"
              title="Zoom In"
            >
              +
            </button>
            <div className="h-4 w-[1px] bg-white/20" />
            <button
              onClick={() => setLightboxScale(2)}
              className="text-xs font-bold hover:text-blue-400 transition-colors outline-none"
            >
              Reset
            </button>
            <div className="h-4 w-[1px] bg-white/20" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSafeDownload(lightboxImage);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors outline-none cursor-pointer"
              title="Download Original High-Res File"
            >
              <FiDownload size={14} />
              <span>Download</span>
            </button>
          </div>

          {/* Image display */}
          <div className="relative max-w-full max-h-[82vh] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Reference Zoom View"
              onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                setZoomPos({ x, y });
                setIsHovered(true);
              }}
              onMouseLeave={() => setIsHovered(false)}
              className="rounded-2xl transition-transform duration-100 ease-out select-none cursor-crosshair"
              style={{
                transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                transform: isHovered ? `scale(${lightboxScale})` : 'scale(1)',
                maxHeight: '78vh',
                maxWidth: '90vw',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Auto-Start & Download Confirmation Modal */}
      <DownloadStartPromptModal
        isOpen={!!pendingDownload}
        onClose={() => setPendingDownload(null)}
        onConfirm={handleConfirmStartAndDownload}
        pendingDownload={pendingDownload}
      />
    </>
  );
};

export default TaskDetailsModal;
