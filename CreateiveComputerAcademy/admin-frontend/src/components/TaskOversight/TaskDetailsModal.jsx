import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiTarget,
  FiEdit2,
  FiX,
  FiFlag,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiLink,
  FiDownload,
  FiMessageSquare,
  FiSend,
  FiTrash2,
  FiImage,
  FiFileText,
  FiPackage,
  FiShoppingBag
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import AgenticBlueprintViewer from '../AgenticBlueprintViewer';
import { DescriptionRenderer } from './TaskDescriptionRenderer';
import TaskDeliverablesViewer from '../TaskDeliverablesViewer';
import MarketplaceSubmissions from '../MarketplaceSubmissions';

export const TaskDetailsModal = ({
  isOpen,
  detailsTask,
  onClose,
  openEditModal,
  setTaskToDelete,
  setLightboxImage,
  currentUser,
  apiBase = import.meta.env.VITE_API_BASE_URL || '/',
  comments = [],
  newComment,
  setNewComment,
  commentImage,
  setCommentImage,
  commentImagePreview,
  setCommentImagePreview,
  commentsLoading,
  addingComment,
  commentsEndRef,
  editingCommentId,
  setEditingCommentId,
  editCommentText,
  setEditCommentText,
  handleAddComment,
  handleSaveEdit,
  handleDeleteComment,
  detailsTab = 'comments',
  setDetailsTab
}) => {
  const [contentTab, setContentTab] = useState('brief'); // 'brief' | 'submissions' | 'reviewer' | 'markets'

  if (!isOpen || !detailsTask) return null;

  const hasSubmissions = Boolean(
    (detailsTask.submissions && detailsTask.submissions.length > 0) ||
      detailsTask.submission_link
  );
  const submissionsCount =
    (detailsTask.submissions?.length || 0) + (detailsTask.submission_link ? 1 : 0);
  const hasFinalDelivery = Boolean(detailsTask.final_delivery);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-[1540px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiTarget size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Task Details</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">ID: #{detailsTask.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const taskToEdit = detailsTask;
                onClose();
                openEditModal(taskToEdit);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 shadow-sm cursor-pointer"
            >
              <FiEdit2 size={13} /> {detailsTask.blueprint_data ? 'Edit AI Blueprint' : 'Edit Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left Column: Details & Content Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Top Meta Header: Badges + Title */}
            <div className="p-6 pb-3 space-y-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                  {detailsTask.category}
                </span>
                {(detailsTask.creation_mode === 'agentic' || Boolean(detailsTask.blueprint_data)) && (
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm">
                    <HiSparkles size={13} className="text-amber-500" /> Agentic AI Task
                  </span>
                )}
                {detailsTask.priority && detailsTask.priority !== 'Medium' && (
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                      detailsTask.priority === 'High'
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/50'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'
                    }`}
                  >
                    <FiFlag size={14} /> {detailsTask.priority} Priority
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    detailsTask.status === 'In Review'
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900/50'
                      : detailsTask.status === 'Completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'
                      : detailsTask.status === 'In Progress'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {detailsTask.status}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                {detailsTask.title}
              </h2>

              {/* Navigation Tabs Bar for Content */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 custom-scrollbar">
                {/* Tab 1: Brief & Instructions */}
                <button
                  type="button"
                  onClick={() => setContentTab('brief')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentTab === 'brief'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FiFileText size={14} className={contentTab === 'brief' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                  <span>Task Brief & Instructions</span>
                </button>

                {/* Tab 2: My Submissions */}
                <button
                  type="button"
                  onClick={() => setContentTab('submissions')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentTab === 'submissions'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FiPackage size={14} className={contentTab === 'submissions' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                  <span>My Submissions</span>
                  {hasSubmissions && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                      {submissionsCount}
                    </span>
                  )}
                </button>

                {/* Tab 3: Reviewer Final Version */}
                <button
                  type="button"
                  onClick={() => setContentTab('reviewer')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentTab === 'reviewer'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <HiSparkles size={15} className="text-amber-500" />
                  <span>Reviewer Final Version</span>
                  {hasFinalDelivery && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold uppercase tracking-wide">
                      STOCK-READY
                    </span>
                  )}
                </button>

                {/* Tab 4: Markets */}
                <button
                  type="button"
                  onClick={() => setContentTab('markets')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentTab === 'markets'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FiShoppingBag size={14} className={contentTab === 'markets' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                  <span>Markets</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Area for the selected tab */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {/* ── TAB 1: TASK BRIEF & INSTRUCTIONS ── */}
              {contentTab === 'brief' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Specifications & Description (Adaptive: Agentic Blueprint vs Classic Description) */}
                  <div className="space-y-2">
                    {detailsTask.blueprint_data ||
                    (detailsTask.blueprint_variants && detailsTask.blueprint_variants.length > 0) ? (
                      <AgenticBlueprintViewer
                        blueprint={detailsTask.blueprint_data}
                        variants={detailsTask.blueprint_variants || []}
                      />
                    ) : (
                      <>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Description & Instructions
                        </h4>
                        <DescriptionRenderer htmlContent={detailsTask.description} />
                      </>
                    )}
                  </div>

                  {/* Assigned Info & Dates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Assignee Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        {detailsTask.assigned_to_avatar ? (
                          <img
                            src={`${apiBase}${detailsTask.assigned_to_avatar}`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm uppercase">
                            {detailsTask.assigned_to_name
                              ? detailsTask.assigned_to_name.charAt(0)
                              : '?'}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Assigned To
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                          {detailsTask.assigned_to_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    {/* Date Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <FiCalendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Date Assigned
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {new Date(
                            detailsTask.assign_date || detailsTask.created_at
                          ).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Time Spent Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <FiClock size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Time Spent
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {(() => {
                            let totalSecs = parseInt(detailsTask.total_time_spent || 0, 10);
                            if (
                              detailsTask.timer_status === 'Running' &&
                              detailsTask.session_start_time
                            ) {
                              let cleanStr = String(detailsTask.session_start_time)
                                .trim()
                                .replace(' ', 'T');
                              if (!cleanStr.includes('+') && !cleanStr.endsWith('Z')) {
                                cleanStr += '+06:00';
                              }
                              const start = new Date(cleanStr).getTime();
                              if (!isNaN(start)) {
                                const now = Date.now();
                                totalSecs += Math.max(0, Math.floor((now - start) / 1000));
                              }
                            }
                            const hrs = Math.floor(totalSecs / 3600);
                            const mins = Math.floor((totalSecs % 3600) / 60);
                            return `${hrs}h ${mins}m`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklists */}
                  {detailsTask.checklists && detailsTask.checklists.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Sub-tasks / Checklist
                      </h4>
                      <div className="space-y-2">
                        {detailsTask.checklists.map((cl, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              cl.is_completed
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                                cl.is_completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 bg-white dark:bg-slate-800'
                              }`}
                            >
                              {cl.is_completed && <FiCheckCircle size={14} />}
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                cl.is_completed
                                  ? 'text-emerald-700 dark:text-emerald-300 line-through opacity-70'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {cl.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reference Links */}
                  {detailsTask.ref_links && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Reference Links
                      </h4>
                      <div className="flex flex-col gap-2">
                        {(() => {
                          let links = [];
                          try {
                            const parsed = JSON.parse(detailsTask.ref_links);
                            links = Array.isArray(parsed) ? parsed : [detailsTask.ref_links];
                          } catch {
                            links = [detailsTask.ref_links];
                          }
                          links = links.filter((l) => l && l.trim());

                          if (links.length === 0)
                            return (
                              <p className="text-sm text-slate-400 italic">
                                No reference links provided.
                              </p>
                            );

                          return links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold text-sm transition-all truncate"
                            >
                              <FiLink size={14} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate">{link}</span>
                            </a>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Target Visual Images */}
                  {detailsTask.visual_image && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <FiTarget size={12} /> Target Visual Image
                      </h4>
                      {(() => {
                        let imgs = [];
                        try {
                          const parsed = JSON.parse(detailsTask.visual_image);
                          imgs = Array.isArray(parsed) ? parsed : [detailsTask.visual_image];
                        } catch {
                          imgs = detailsTask.visual_image ? [detailsTask.visual_image] : [];
                        }
                        imgs = imgs.filter(
                          (img) => img && typeof img === 'string' && img.trim()
                        );

                        if (imgs.length === 0) return null;

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {imgs.map((imgUrl, idx) => {
                              const fullUrl = `${apiBase}${imgUrl}`;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImage(fullUrl);
                                  }}
                                  className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-indigo-100 bg-indigo-50/30 hover:shadow-md hover:border-indigo-300 transition-all group outline-none cursor-pointer"
                                >
                                  <img
                                    src={fullUrl}
                                    alt={`Target Visual ${idx + 1}`}
                                    className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Reference Images */}
                  {detailsTask.ref_image && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Reference Images
                      </h4>
                      {(() => {
                        let imgs = [];
                        try {
                          const parsed = JSON.parse(detailsTask.ref_image);
                          imgs = Array.isArray(parsed) ? parsed : [detailsTask.ref_image];
                        } catch {
                          imgs = detailsTask.ref_image ? [detailsTask.ref_image] : [];
                        }
                        imgs = imgs.filter((img) => img && img.trim());

                        if (imgs.length === 0)
                          return (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                              No reference images uploaded.
                            </p>
                          );

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {imgs.map((imgUrl, idx) => {
                              const fullUrl = `${apiBase}${imgUrl}`;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImage(fullUrl);
                                  }}
                                  className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md hover:border-slate-300 transition-all group outline-none cursor-pointer"
                                >
                                  <img
                                    src={fullUrl}
                                    alt={`Reference ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: MY SUBMISSIONS (DELIVERABLES) ── */}
              {contentTab === 'submissions' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {hasSubmissions ? (
                    <div className="space-y-3">
                      {detailsTask.final_delivery && (
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider pl-1">
                          Staff Original Submission (Preserved History)
                        </p>
                      )}
                      <TaskDeliverablesViewer
                        submissions={detailsTask.submissions}
                        submissionLink={detailsTask.submission_link}
                        onImageClick={(url) => setLightboxImage(url)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-3">
                        <FiPackage size={22} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                        No Submissions Yet
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs">
                        The assigned staff member has not uploaded any work files or submitted a link for this task yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3: REVIEWER FINAL VERSION (STOCK-READY) ── */}
              {contentTab === 'reviewer' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {detailsTask.final_delivery ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 via-indigo-900/5 to-slate-900/10 dark:bg-blue-950/20 border border-blue-500/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-500 flex items-center justify-center">
                            <HiSparkles size={18} className="text-amber-500" />
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                              Reviewer Corrected Stock Version
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[9px] font-bold">
                                Stock-Ready
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              Corrected by {detailsTask.final_delivery.reviewer_name || 'Reviewer'} • Ready for Stock Upload
                            </p>
                          </div>
                        </div>

                        {detailsTask.final_delivery.final_file_url && (
                          <a
                            href={
                              detailsTask.final_delivery.final_file_url.startsWith('http')
                                ? detailsTask.final_delivery.final_file_url
                                : `${apiBase}${detailsTask.final_delivery.final_file_url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                          >
                            <FiDownload size={13} /> Download Final Stock PSD
                          </a>
                        )}
                      </div>

                      {detailsTask.final_delivery.fix_notes && (
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                            Correction Remarks:
                          </span>
                          {detailsTask.final_delivery.fix_notes}
                        </div>
                      )}

                      {detailsTask.final_delivery.final_image_url && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Final Stock Preview Image
                          </p>
                          <div className="max-w-md rounded-xl overflow-hidden border border-blue-500/20 bg-slate-100 dark:bg-slate-950">
                            <img
                              src={
                                detailsTask.final_delivery.final_image_url.startsWith('http')
                                  ? detailsTask.final_delivery.final_image_url
                                  : `${apiBase}${detailsTask.final_delivery.final_image_url}`
                              }
                              alt="Final Stock Preview"
                              onClick={() =>
                                setLightboxImage(
                                  detailsTask.final_delivery.final_image_url.startsWith('http')
                                    ? detailsTask.final_delivery.final_image_url
                                    : `${apiBase}${detailsTask.final_delivery.final_image_url}`
                                )
                              }
                              className="w-full max-h-72 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-3">
                        <HiSparkles size={22} className="text-amber-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                        No Final Stock Delivery Yet
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Reviewer has not uploaded a final corrected stock-ready version for this task.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 4: MARKETS & MARKETPLACE SUBMISSIONS ── */}
              {contentTab === 'markets' && (
                <div className="animate-in fade-in duration-200">
                  <MarketplaceSubmissions
                    taskId={detailsTask.id}
                    userId={detailsTask.assigned_to_user_id || detailsTask.user_id || detailsTask.assigned_to}
                    addedBy={currentUser?.id}
                    addedByRole="admin"
                    canManage={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ──────── RIGHT COLUMN: COMMENTS & HISTORY ──────── */}
          <div className="w-full lg:w-[400px] xl:w-[480px] flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 overflow-hidden flex-shrink-0">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-4 px-6 pt-6 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDetailsTab('comments')}
                className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
                  detailsTab === 'comments' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiMessageSquare size={14} /> Comments
                  {comments.length > 0 && (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </div>
                {detailsTab === 'comments' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('history')}
                className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
                  detailsTab === 'history' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiClock size={14} /> Activity Timeline
                </div>
                {detailsTab === 'history' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            </div>

            {detailsTab === 'comments' && (
              <>
                {/* Comment list */}
                <div className="space-y-3 flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
                  {commentsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                      No comments yet. Add a note below!
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isOwner = currentUser?.id && String(c.user_id) === String(currentUser.id);
                      const isEditing = editingCommentId === c.id;

                      return (
                        <div
                          key={c.id}
                          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs space-y-2 group transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {c.avatar ? (
                                <img
                                  src={`${apiBase}${c.avatar}`}
                                  alt="Avatar"
                                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] uppercase">
                                  {c.user_name ? c.user_name.charAt(0) : '?'}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                  {c.user_name}
                                </span>
                                {c.role && (
                                  <span className="ml-1.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md">
                                    {c.role}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-400">
                                {new Date(c.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isOwner && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentText(c.comment);
                                    }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                  >
                                    <FiEdit2 size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <FiTrash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="space-y-2 mt-1">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full text-xs p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/20 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                rows={2}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(c.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-lg shadow-xs hover:bg-blue-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {c.comment}
                            </p>
                          )}

                          {c.image_url && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 max-w-[200px]">
                              <img
                                src={`${apiBase}${c.image_url}`}
                                alt="Attachment"
                                className="w-full h-auto object-cover cursor-pointer hover:opacity-95"
                                onClick={() => setLightboxImage(`${apiBase}${c.image_url}`)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
                  {commentImagePreview && (
                    <div className="relative inline-block w-fit">
                      <img
                        src={commentImagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCommentImage(null);
                          setCommentImagePreview(null);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors">
                      <FiImage size={16} />
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
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      placeholder="Write a comment or note..."
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={addingComment || (!newComment.trim() && !commentImage)}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {addingComment ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSend size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {detailsTab === 'history' && (
              <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                {detailsTask.history && detailsTask.history.length > 0 ? (
                  <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-6 space-y-6">
                    {detailsTask.history.map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 ring-4 ring-slate-100 dark:ring-slate-800">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        </span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {h.action || 'Status Changed'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {new Date(h.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No status history logs available for this task.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              const taskToDel = detailsTask;
              onClose();
              setTaskToDelete(taskToDel);
            }}
            className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FiTrash2 size={14} /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const taskToEdit = detailsTask;
                onClose();
                openEditModal(taskToEdit);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiEdit2 size={13} /> Edit Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskDetailsModal;
