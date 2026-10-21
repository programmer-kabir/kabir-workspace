import React from 'react';
import {
  FiTag,
  FiMessageSquare,
  FiXCircle
} from 'react-icons/fi';

/**
 * TaskReviewTab
 * Renders Review Quality Score, Evaluation Tags, Reviewer Feedback, and Admin Rejection Notes.
 */
const TaskReviewTab = ({
  selectedTaskModal,
  hasReview,
  formatDateTime
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Rating & Reviewer Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-slate-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Quality Score & Review</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {selectedTaskModal.rating ? `${selectedTaskModal.rating} / 5` : 'Not Rated Yet'}
            </span>
            {selectedTaskModal.rating && (
              <div className="flex text-amber-500 text-sm">
                {Array.from({ length: Math.min(5, Math.max(1, parseInt(selectedTaskModal.rating) || 5)) }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Reviewer</p>
          <p className="font-black text-slate-800 dark:text-slate-100 text-xs">
            {selectedTaskModal.reviewer_name || 'QA Reviewer'}
          </p>
          {selectedTaskModal.reviewed_at && (
            <p className="text-[10px] text-slate-400">
              {formatDateTime ? formatDateTime(selectedTaskModal.reviewed_at) : selectedTaskModal.reviewed_at}
            </p>
          )}
        </div>
      </div>

      {/* Review Tags */}
      {selectedTaskModal.tags && selectedTaskModal.tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <FiTag size={13} className="text-amber-500" />
            <span>Evaluation Tags</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedTaskModal.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviewer Feedback Notes */}
      {selectedTaskModal.feedback_notes && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <FiMessageSquare size={13} className="text-blue-500" />
            <span>Reviewer Feedback Notes</span>
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            {selectedTaskModal.feedback_notes}
          </p>
        </div>
      )}

      {/* Admin Rejection / Correction Notes */}
      {selectedTaskModal.admin_note && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-1.5">
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiXCircle />
            <span>Rejection Reason & Revision Requirements</span>
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
            {selectedTaskModal.admin_note}
          </p>
        </div>
      )}

      {!hasReview && (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
          No review evaluation or feedback recorded for this task yet.
        </div>
      )}
    </div>
  );
};

export default TaskReviewTab;
