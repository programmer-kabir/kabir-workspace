import React from 'react';
import { createPortal } from 'react-dom';
import {
  FiClock,
  FiFileText,
  FiStar,
  FiExternalLink,
  FiX,
  FiFolder,
  FiShoppingCart,
  FiFlag
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import TaskOverviewTab from './TaskDetailModal/TaskOverviewTab';
import TaskTimelineTab from './TaskDetailModal/TaskTimelineTab';
import TaskDeliverablesDetailTab from './TaskDetailModal/TaskDeliverablesDetailTab';
import TaskMarketplacesTab from './TaskDetailModal/TaskMarketplacesTab';
import TaskReviewTab from './TaskDetailModal/TaskReviewTab';

/**
 * TaskDetailModal Component
 * 5-Tab Modular Modal Popup for inspecting Task Specifications (Agentic vs Manual),
 * Timelines, Deliverables, Marketplaces, and Review & Feedback.
 */
const TaskDetailModal = ({
  selectedTaskModal,
  setSelectedTaskModal,
  modalActiveTab,
  setModalActiveTab,
  showRawJson,
  setShowRawJson,
  copiedJson,
  setCopiedJson,
  setLightboxImage,
  parseTaskSpecs,
  formatDateTime,
  formatDurationSeconds,
  formatDurationBetween,
  API_BASE = import.meta.env.VITE_API_BASE_URL || '/'
}) => {
  if (!selectedTaskModal) return null;

  const specs = parseTaskSpecs ? parseTaskSpecs(selectedTaskModal.description) : null;
  const hasSubmissions = (selectedTaskModal.submissions && selectedTaskModal.submissions.length > 0) || Boolean(selectedTaskModal.submission_link) || Boolean(selectedTaskModal.final_delivery);
  const hasMarketplaces = selectedTaskModal.marketplaces && selectedTaskModal.marketplaces.length > 0;
  const hasReview = Boolean(selectedTaskModal.rating || selectedTaskModal.feedback_notes || (selectedTaskModal.tags && selectedTaskModal.tags.length > 0) || selectedTaskModal.admin_note);

  // Parse Agentic Blueprint data
  let blueprintObj = selectedTaskModal.blueprint_data;
  if (typeof blueprintObj === 'string') {
    try { blueprintObj = JSON.parse(blueprintObj); } catch { blueprintObj = null; }
  }
  if (!blueprintObj && specs && (specs.color_palette || specs.typography || specs.layer_tree || specs.layout_breakdown || specs.assets_links || specs.doc_format || specs.canvas_specifications)) {
    blueprintObj = specs;
  }

  let variantsList = selectedTaskModal.blueprint_variants || [];
  if (typeof variantsList === 'string') {
    try { variantsList = JSON.parse(variantsList); } catch { variantsList = []; }
  }

  const isAgentic = selectedTaskModal.creation_mode === 'agentic' || Boolean(blueprintObj) || (Array.isArray(variantsList) && variantsList.length > 0);

  // Compute accurate timestamps
  const tAssigned = selectedTaskModal.assigned_at || selectedTaskModal.assign_date || selectedTaskModal.created_at;
  const tInProgress = selectedTaskModal.in_progress_at || (['In Progress', 'In Review', 'Completed'].includes(selectedTaskModal.status) ? selectedTaskModal.in_progress_at : null);
  const tSubmitted = selectedTaskModal.submitted_at || (['In Review', 'Completed'].includes(selectedTaskModal.status) ? selectedTaskModal.submitted_at : null);
  const tCompleted = selectedTaskModal.status === 'Completed'
    ? (selectedTaskModal.completed_at || selectedTaskModal.updated_at || selectedTaskModal.created_at)
    : null;

  // Computed Duration Strings
  const startReactionDuration = formatDurationBetween ? formatDurationBetween(tAssigned, tInProgress) : null;
  const workDuration = selectedTaskModal.work_duration_seconds
    ? (formatDurationSeconds ? formatDurationSeconds(selectedTaskModal.work_duration_seconds) : `${selectedTaskModal.work_duration_seconds}s`)
    : (formatDurationBetween ? formatDurationBetween(tInProgress, tSubmitted) : null);
  const reviewDuration = selectedTaskModal.review_duration_seconds
    ? (formatDurationSeconds ? formatDurationSeconds(selectedTaskModal.review_duration_seconds) : `${selectedTaskModal.review_duration_seconds}s`)
    : (formatDurationBetween ? formatDurationBetween(tSubmitted, tCompleted) : null);
  const totalTurnaround = selectedTaskModal.total_duration_seconds
    ? (formatDurationSeconds ? formatDurationSeconds(selectedTaskModal.total_duration_seconds) : `${selectedTaskModal.total_duration_seconds}s`)
    : (formatDurationBetween ? formatDurationBetween(tAssigned, tCompleted) : null);

  // Checklists & Reference Links Parser
  let checklists = selectedTaskModal.checklists || [];
  if (typeof checklists === 'string') {
    try { checklists = JSON.parse(checklists); } catch { checklists = []; }
  }

  let refLinks = [];
  if (selectedTaskModal.ref_links) {
    try {
      const parsed = JSON.parse(selectedTaskModal.ref_links);
      refLinks = Array.isArray(parsed) ? parsed : [selectedTaskModal.ref_links];
    } catch {
      refLinks = [selectedTaskModal.ref_links];
    }
    refLinks = refLinks.filter(l => l && typeof l === 'string' && l.trim());
  }

  // Visual Images & Reference Images Parser
  let visualImgs = [];
  if (selectedTaskModal.visual_image) {
    try {
      const parsed = JSON.parse(selectedTaskModal.visual_image);
      visualImgs = Array.isArray(parsed) ? parsed : [selectedTaskModal.visual_image];
    } catch {
      visualImgs = [selectedTaskModal.visual_image];
    }
    visualImgs = visualImgs.filter(img => img && typeof img === 'string' && img.trim());
  }

  let refImgs = [];
  if (selectedTaskModal.ref_image) {
    try {
      const parsed = JSON.parse(selectedTaskModal.ref_image);
      refImgs = Array.isArray(parsed) ? parsed : [selectedTaskModal.ref_image];
    } catch {
      refImgs = [selectedTaskModal.ref_image];
    }
    refImgs = refImgs.filter(img => img && typeof img === 'string' && img.trim());
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl xl:max-w-6xl h-[88vh] max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${selectedTaskModal.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400' :
                selectedTaskModal.status === 'In Review' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-400' :
                  selectedTaskModal.status === 'Rejected' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400' :
                    selectedTaskModal.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400' :
                      'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}>
                {selectedTaskModal.status || 'To-Do'}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">
                {selectedTaskModal.category || 'General'}
              </span>
              {isAgentic && (
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-xs">
                  <HiSparkles size={13} className="text-amber-500" /> Agentic AI Task
                </span>
              )}
              {selectedTaskModal.priority && selectedTaskModal.priority !== 'Medium' && (
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${selectedTaskModal.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                  <FiFlag size={12} /> {selectedTaskModal.priority}
                </span>
              )}
              {selectedTaskModal.was_delayed && (
                <span className="bg-rose-100 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                  Delayed
                </span>
              )}
              {selectedTaskModal.was_resubmitted && (
                <span className="bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                  Resubmitted ({selectedTaskModal.resubmit_count}x)
                </span>
              )}
              <span className="text-xs font-mono font-bold text-slate-400 ml-auto mr-1 hidden sm:inline">
                Task #{selectedTaskModal.id}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">
              {selectedTaskModal.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTaskModal(null)}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors shrink-0"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setModalActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${modalActiveTab === 'overview'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
          >
            <FiFileText size={14} />
            <span>Overview & Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${modalActiveTab === 'timeline'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
          >
            <FiClock size={14} />
            <span>Timeline & Duration</span>
            {workDuration && (
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold px-1.5 py-0.2 rounded-full">
                {workDuration}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('deliverables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${modalActiveTab === 'deliverables'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
          >
            <FiFolder size={14} />
            <span>Deliverables & Files</span>
            {hasSubmissions && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black px-1.5 py-0.2 rounded-full">
                {(selectedTaskModal.submissions?.length || 0) + (selectedTaskModal.submission_link ? 1 : 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('marketplaces')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${modalActiveTab === 'marketplaces'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
          >
            <FiShoppingCart size={14} />
            <span>Marketplaces</span>
            {hasMarketplaces && (
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black px-1.5 py-0.2 rounded-full">
                {selectedTaskModal.marketplaces.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${modalActiveTab === 'review'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
          >
            <FiStar size={14} />
            <span>Review & Feedback</span>
            {selectedTaskModal.rating && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-black px-1.5 py-0.2 rounded-full">
                ★ {selectedTaskModal.rating}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body: Active Tab Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5 text-xs flex-1 min-h-0 custom-scrollbar">

          {/* TAB 1: OVERVIEW & SPECIFICATIONS */}
          {modalActiveTab === 'overview' && (
            <TaskOverviewTab
              selectedTaskModal={selectedTaskModal}
              isAgentic={isAgentic}
              blueprintObj={blueprintObj}
              variantsList={variantsList}
              specs={specs}
              showRawJson={showRawJson}
              setShowRawJson={setShowRawJson}
              copiedJson={copiedJson}
              setCopiedJson={setCopiedJson}
              tAssigned={tAssigned}
              workDuration={workDuration}
              checklists={checklists}
              refLinks={refLinks}
              visualImgs={visualImgs}
              refImgs={refImgs}
              setLightboxImage={setLightboxImage}
              formatDateTime={formatDateTime}
              API_BASE={API_BASE}
            />
          )}

          {/* TAB 2: TIMELINE & DURATION ANALYTICS */}
          {modalActiveTab === 'timeline' && (
            <TaskTimelineTab
              selectedTaskModal={selectedTaskModal}
              startReactionDuration={startReactionDuration}
              workDuration={workDuration}
              reviewDuration={reviewDuration}
              totalTurnaround={totalTurnaround}
              tAssigned={tAssigned}
              tInProgress={tInProgress}
              tSubmitted={tSubmitted}
              tCompleted={tCompleted}
              formatDateTime={formatDateTime}
            />
          )}

          {/* TAB 3: DELIVERABLES & FILES */}
          {modalActiveTab === 'deliverables' && (
            <TaskDeliverablesDetailTab
              selectedTaskModal={selectedTaskModal}
              formatDateTime={formatDateTime}
            />
          )}

          {/* TAB 4: MARKETPLACES & DISTRIBUTION */}
          {modalActiveTab === 'marketplaces' && (
            <TaskMarketplacesTab
              selectedTaskModal={selectedTaskModal}
              formatDateTime={formatDateTime}
            />
          )}

          {/* TAB 5: REVIEW & FEEDBACK */}
          {modalActiveTab === 'review' && (
            <TaskReviewTab
              selectedTaskModal={selectedTaskModal}
              hasReview={hasReview}
              formatDateTime={formatDateTime}
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-bold text-slate-400">
            Status: <span className="text-slate-700 dark:text-slate-200">{selectedTaskModal.status || 'To-Do'}</span>
            {workDuration && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold">• Work: {workDuration}</span>}
          </div>
          <div className="flex items-center gap-2">
            {selectedTaskModal.submission_link && (
              <a
                href={selectedTaskModal.submission_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                <FiExternalLink size={12} />
                <span>Open Link</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setSelectedTaskModal(null)}
              className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
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

export default TaskDetailModal;
