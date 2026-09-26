import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FiX,
  FiClock,
  FiCheckCircle,
  FiAlertOctagon,
  FiFileText,
  FiDownload,
  FiLink,
  FiLayers,
  FiUser,
  FiCalendar,
  FiExternalLink,
  FiRefreshCw,
  FiStar,
  FiCode,
  FiTag,
  FiCheckSquare,
  FiAlertCircle,
  FiPackage,
  FiMessageSquare
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';
import { HiSparkles } from 'react-icons/hi';
import TaskDeliverablesViewer from './TaskDeliverablesViewer';
import AgenticBlueprintViewer from './AgenticBlueprintViewer';
import MarketplaceSubmissions from './MarketplaceSubmissions';
import { downloadFile } from '../utils/fileDownloader';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

// ── JSON & Spec Viewer Helpers ───────────────────────────────────────────────
const isColorHex = (str) => typeof str === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(str);

const DynamicJsonViewer = ({ data, level = 0 }) => {
  if (data === null) return <span className="text-white/40 italic text-xs">null</span>;
  if (typeof data === 'boolean') {
    return (
      <span className={`text-xs ${data ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}`}>
        {data ? 'True' : 'False'}
      </span>
    );
  }
  if (typeof data === 'number') return <span className="text-blue-400 font-medium text-xs">{data}</span>;
  if (typeof data === 'string') {
    if (isColorHex(data)) {
      return (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full shadow-xs inline-block shrink-0 border border-white/10" style={{ backgroundColor: data }} />
          <span className="text-white/70 font-medium text-xs">{data}</span>
        </span>
      );
    }
    return <span className="text-white/70 text-xs leading-relaxed">{data}</span>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="flex flex-col gap-1 mt-1 list-disc list-inside text-white/30 marker:text-white/20 pl-1">
        {data.map((item, idx) => (
          <li key={idx} className="text-xs">
            <span className="inline-block align-top ml-[-4px] w-[calc(100%-12px)]">
              <DynamicJsonViewer data={item} level={level + 1} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return (
      <div className={`flex flex-col gap-2 ${level > 0 ? 'mt-1.5 pl-3 border-l-2 border-white/5' : ''}`}>
        {Object.entries(data).map(([key, val]) => {
          const isComplex = typeof val === 'object' && val !== null;
          return (
            <div key={key} className={`flex ${isComplex ? 'flex-col' : 'items-start gap-3'}`}>
              <span className={`text-[10px] font-bold text-white/40 uppercase shrink-0 ${!isComplex ? 'w-1/3 min-w-[120px] max-w-[150px] pt-0.5' : 'mb-0.5 text-white/70'}`}>
                {key.replace(/_/g, ' ')}
              </span>
              <div className={`${isComplex ? 'w-full' : 'flex-1 break-words'}`}>
                <DynamicJsonViewer data={val} level={level + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const DescriptionRenderer = ({ htmlContent }) => {
  let jsonData = null;
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let rawText = tempDiv.textContent || tempDiv.innerText || '';
    rawText = rawText.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (rawText.startsWith('{') || rawText.startsWith('[')) {
      jsonData = JSON.parse(rawText);
    }
  } catch (e) {
    jsonData = null;
  }

  if (jsonData) {
    return (
      <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[11px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiCode size={14} />
            Structured Specifications (JSON)
          </h4>
        </div>
        <DynamicJsonViewer data={jsonData} />
      </div>
    );
  }

  return (
    <div
      className="text-white/70 text-xs leading-relaxed max-w-none task-description-html"
      dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="italic text-white/30">No description provided.</p>' }}
    />
  );
};

const TaskDetailsModal = ({ isOpen, onClose, taskId, initialTask = null }) => {
  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('deliverables'); // 'deliverables' | 'instructions' | 'marketplace' | 'blueprint' | 'audit' | 'timeline'
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTask && initialTask.id === taskId) {
        setTask(initialTask);
      } else if (taskId) {
        fetchTaskDetails(taskId);
      }
    } else {
      setSelectedImage(null);
    }
  }, [isOpen, taskId, initialTask]);

  const fetchTaskDetails = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/tasks/get_task_details.php?task_id=${id}`);
      if (res.data.status === 'success' && res.data.task) {
        setTask(res.data.task);
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusBadge = (status) => {
    const map = {
      Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'In Review': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      'In Progress': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      'To-Do': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      Rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider ${map[status] || 'bg-slate-500/15 text-slate-400'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {status}
      </span>
    );
  };

  const priorityBadge = (priority) => {
    const map = {
      Urgent: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      High: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      Medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      Low: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${map[priority] || 'bg-slate-500/15 text-slate-400'}`}>
        {priority || 'Normal'}
      </span>
    );
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-4xl bg-dark-900 border border-dark-700/80 shadow-2xl rounded-3xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-dark-950 via-dark-900 to-dark-950 border-b border-dark-700/80 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/15 px-2.5 py-1 rounded-xl border border-brand-500/30">
                    Task #{task?.task_id || task?.id || taskId}
                  </span>
                  {task?.status && statusBadge(task.status)}
                  {task?.priority && priorityBadge(task.priority)}
                  {task?.category && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-dark-800 text-white/80 border border-dark-700">
                      {task.category}
                    </span>
                  )}
                  {task?.credit && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      +{task.credit} Credits
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight break-words">
                  {loading ? 'Loading Task...' : task?.title || `Task #${taskId}`}
                </h2>

                {/* Designer / Assignee Info */}
                <div className="flex items-center gap-3 pt-1 text-xs text-white/60 flex-wrap">
                  {task?.staff_name && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold flex items-center justify-center overflow-hidden border border-brand-500/30">
                        {task.staff_avatar ? (
                          <img
                            src={task.staff_avatar.startsWith('http') ? task.staff_avatar : `${API_BASE}/${task.staff_avatar}`}
                            alt={task.staff_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          task.staff_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-semibold text-white/90">{task.staff_name}</span>
                      {task.department_name && <span className="text-white/40">({task.department_name})</span>}
                    </div>
                  )}

                  {task?.created_at && (
                    <span className="flex items-center gap-1">
                      <FiCalendar size={13} />
                      {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}

                  {task?.total_time_spent > 0 && (
                    <span className="flex items-center gap-1 text-amber-300">
                      <FiClock size={13} />
                      {Math.floor(task.total_time_spent / 60)} mins spent
                    </span>
                  )}
                </div>
              </div>

              {/* Close & Refresh */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchTaskDetails(taskId)}
                  disabled={loading}
                  className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Refresh Task"
                >
                  <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs + Credit Info */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto mt-5 scrollbar-none border-t border-dark-700/60 pt-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'deliverables', label: 'Deliverables & Files', icon: FiPackage },
                  { key: 'instructions', label: 'Instructions & Specs', icon: FiFileText },
                  { key: 'marketplace', label: 'Marketplace Delivery', icon: FiTag },
                  { key: 'blueprint', label: 'Agentic Blueprint', icon: HiSparkles },
                  { key: 'audit', label: 'Review & QA Audit', icon: FiStar },
                  { key: 'timeline', label: 'Timeline Logs', icon: FiClock }
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'bg-dark-800/80 text-white/60 hover:text-white hover:bg-dark-800'
                      }`}
                    >
                      <Icon size={13} className={isActive ? 'text-white' : 'text-white/40'} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reviewer & Staff Credit Badges */}
              {task && (
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Reviewer Reward */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-bold text-xs shadow-xs" title="Reviewer credit reward for review / QA">
                    <FaCoins size={13} className="text-amber-400 shrink-0" />
                    <span className="text-[11px] text-amber-400/80">Reviewer:</span>
                    <span className="font-extrabold text-amber-300">
                      +{(task.final_file_url || task.final_image_url) ? 2 : 1} Credit
                    </span>
                  </div>

                  {/* Staff Reward Value */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-xs shadow-xs" title="Staff completion reward value">
                    <span className="text-[11px] text-emerald-400/80">Staff:</span>
                    <span className="font-extrabold text-emerald-300">
                      +{task.credit || task.category_credit || 5} Credits
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-dark-950">
            {loading ? (
              <div className="py-24 text-center text-white/40">
                <FiRefreshCw className="animate-spin text-3xl mx-auto mb-2 text-brand-400" />
                <p className="text-xs font-semibold">Fetching complete task data...</p>
              </div>
            ) : !task ? (
              <div className="py-20 text-center text-white/40">
                <FiAlertOctagon size={32} className="mx-auto mb-2 text-rose-400" />
                <p className="text-sm font-bold text-white">Task Details Not Found</p>
                <p className="text-xs text-white/40 mt-1">This task record might have been removed or archived.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* TAB 1: DELIVERABLES & FILES */}
                {activeTab === 'deliverables' && (
                  <div className="space-y-6">
                    {/* Visual Work Image Preview */}
                    {task.visual_image && (
                      <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Designer Uploaded Work Preview
                        </h4>
                        <div className="max-w-md rounded-xl overflow-hidden border border-emerald-500/30 bg-dark-950">
                          <img
                            src={`${API_BASE}${task.visual_image}`}
                            alt="Designer Work"
                            className="w-full max-h-72 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImage(`${API_BASE}${task.visual_image}`)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Task Deliverables Component */}
                    <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FiPackage className="text-brand-400" /> Submissions & Deliverable Files
                      </h4>

                      <TaskDeliverablesViewer
                        submissions={task.submissions || []}
                        submissionLink={task.submission_link}
                        onImageClick={(url) => setSelectedImage(url)}
                        totalTimeSpent={task.total_time_spent}
                        submittedAt={task.submitted_at}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: INSTRUCTIONS & SPECS */}
                {activeTab === 'instructions' && (
                  <div className="space-y-6">
                    {/* HTML / Structured JSON Description */}
                    <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FiFileText className="text-brand-400" /> Task Description & Instructions
                      </h4>
                      <DescriptionRenderer htmlContent={task.description} />
                    </div>

                    {/* Checklists */}
                    {Array.isArray(task.checklists) && task.checklists.length > 0 && (
                      <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <FiCheckSquare className="text-brand-400" /> Task Checklists
                        </h4>
                        <div className="space-y-2">
                          {task.checklists.map((chk, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 text-xs text-white/80 p-2.5 rounded-xl bg-dark-950 border border-dark-700/60">
                              <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${chk.completed ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-white/40 border border-dark-700'}`}>
                                {chk.completed ? '✓' : ''}
                              </span>
                              <span className={chk.completed ? 'line-through text-white/40' : ''}>
                                {chk.text || chk.label || chk}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reference Images */}
                    {task.ref_image && (
                      <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reference Images & Mockups</h4>
                        <div className="flex flex-wrap gap-3">
                          <img
                            src={`${API_BASE}${task.ref_image}`}
                            alt="Reference"
                            className="w-32 h-32 rounded-xl object-cover border border-dark-700 cursor-pointer hover:border-brand-500 transition-all"
                            onClick={() => setSelectedImage(`${API_BASE}${task.ref_image}`)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: MARKETPLACE DELIVERY */}
                {activeTab === 'marketplace' && (
                  <div className="space-y-4">
                    <MarketplaceSubmissions
                      taskId={task.task_id || task.id}
                      taskTitle={task.title}
                      categoryName={task.category}
                      previewImageUrl={task.visual_image || task.final_image_url}
                      onSubmissionSuccess={() => fetchTaskDetails(task.task_id || task.id)}
                    />
                  </div>
                )}

                {/* TAB 4: AGENTIC BLUEPRINT */}
                {activeTab === 'blueprint' && (
                  <div className="space-y-4">
                    <AgenticBlueprintViewer
                      variants={task.blueprint_variants || []}
                      taskTitle={task.title}
                      taskId={task.task_id || task.id}
                    />
                  </div>
                )}

                {/* TAB 5: REVIEW AUDIT & QA */}
                {activeTab === 'audit' && (
                  <div className="space-y-5">
                    {/* Quality Ratings */}
                    <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FiStar className="text-amber-400" /> Evaluation Scores & Remarks
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 text-center">
                          <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Overall Rating</span>
                          <span className="text-2xl font-black text-amber-400">
                            ★ {Number(task.rating || 5.0).toFixed(1)} / 5.0
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 text-center">
                          <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Reviewed By</span>
                          <span className="text-sm font-bold text-white">
                            {task.reviewed_by_name || 'Lead Reviewer'}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 text-center">
                          <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Reviewed At</span>
                          <span className="text-xs font-semibold text-white/70">
                            {task.reviewed_at ? new Date(task.reviewed_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Notes */}
                      {task.review_feedback && (
                        <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-brand-400 block">Review Feedback</span>
                          <p className="text-xs text-white/80 leading-relaxed font-medium">"{task.review_feedback}"</p>
                        </div>
                      )}

                      {/* Review Tags */}
                      {Array.isArray(task.review_tags) && task.review_tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2">
                          {task.review_tags.map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-brand-500/15 text-brand-400 border border-brand-500/25 text-xs font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rejection Comments if any */}
                    {Array.isArray(task.comments) && task.comments.length > 0 && (
                      <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3">
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                          <FiMessageSquare /> Feedback & Revision History
                        </h4>
                        <div className="space-y-2.5">
                          {task.comments.map((c) => (
                            <div key={c.id} className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                              <div className="flex items-center justify-between text-white/40 text-[10px] mb-1">
                                <span className="font-bold text-rose-300">{c.reviewer_name || 'Reviewer'}</span>
                                <span>{new Date(c.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-white/90 leading-relaxed italic">"{c.comment}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: TIMELINE & LOGS */}
                {activeTab === 'timeline' && (
                  <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FiClock className="text-brand-400" /> Task Status Transition Logs
                    </h4>

                    {Array.isArray(task.logs) && task.logs.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-dark-700 space-y-4 ml-2">
                        {task.logs.map((l) => (
                          <div key={l.id} className="relative text-xs">
                            <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-dark-900" />
                            <div className="p-3 rounded-xl bg-dark-950 border border-dark-700/60">
                              <p className="font-bold text-white">
                                {l.status_from ? `Changed from ${l.status_from} to ${l.status_to}` : `Task Created (${l.status_to})`}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                                <span>By: {l.changed_by_name || 'System / Admin'}</span>
                                <span>•</span>
                                <span>{new Date(l.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 py-6 text-center">No history logs recorded for this task.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Full Image Preview Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[100002] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <img src={selectedImage} alt="Full Preview" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
        )}
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default TaskDetailsModal;
