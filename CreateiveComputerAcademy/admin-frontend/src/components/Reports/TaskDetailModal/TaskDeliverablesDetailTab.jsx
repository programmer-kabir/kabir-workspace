import React from 'react';
import {
  FiCheckCircle,
  FiFile,
  FiImage,
  FiLink,
  FiDownload,
  FiExternalLink
} from 'react-icons/fi';

/**
 * TaskDeliverablesDetailTab
 * Renders Primary Link, Reviewer Final Delivery, and Uploaded Submission Files.
 */
const TaskDeliverablesDetailTab = ({
  selectedTaskModal,
  formatDateTime
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Submission Link Card */}
      {selectedTaskModal.submission_link ? (
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiLink />
              <span>Primary Deliverable External Link</span>
            </p>
            <p className="text-xs text-emerald-950 dark:text-emerald-100 font-semibold break-all">
              {selectedTaskModal.submission_link}
            </p>
          </div>
          <a
            href={selectedTaskModal.submission_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <span>Open Link</span>
            <FiExternalLink size={13} />
          </a>
        </div>
      ) : null}

      {/* Reviewer Stock-Ready Final Delivery */}
      {selectedTaskModal.final_delivery && (
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiCheckCircle />
              <span>Reviewer Final Stock-Ready Delivery</span>
            </h4>
            <span className="text-[10px] font-bold bg-indigo-200/70 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded">
              Approved & Packaged
            </span>
          </div>

          {selectedTaskModal.final_delivery.fix_notes && (
            <p className="text-xs text-indigo-900 dark:text-indigo-200 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl">
              <span className="font-bold">Fix Notes:</span> {selectedTaskModal.final_delivery.fix_notes}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {selectedTaskModal.final_delivery.final_file_url && (
              <a
                href={selectedTaskModal.final_delivery.final_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                <FiDownload size={13} />
                <span>Download Final Source File</span>
              </a>
            )}
            {selectedTaskModal.final_delivery.final_image_url && (
              <a
                href={selectedTaskModal.final_delivery.final_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <FiImage size={13} />
                <span>View Final Preview</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Submissions Files */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <FiFile size={13} />
          <span>Uploaded Submission Files ({selectedTaskModal.submissions?.length || 0})</span>
        </h4>

        {selectedTaskModal.submissions && selectedTaskModal.submissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedTaskModal.submissions.map((sub, idx) => {
              const isImg = sub.file_ext?.match(/(jpg|jpeg|png|webp|gif)/i) || sub.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isImg ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0">
                        <img src={sub.file_url} alt={sub.file_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black text-xs flex-shrink-0 uppercase border border-blue-100 dark:border-blue-900/50">
                        {sub.file_ext || 'FILE'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
                        {sub.file_name || `Submission #${idx + 1}`}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {sub.file_size ? `${Math.round(sub.file_size / 1024)} KB` : 'Uploaded'} • {formatDateTime ? formatDateTime(sub.created_at) : sub.created_at}
                      </p>
                    </div>
                  </div>

                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs transition-colors shrink-0"
                    title="Download / Open File"
                  >
                    <FiDownload size={14} />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          !selectedTaskModal.submission_link && !selectedTaskModal.final_delivery && (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
              No files or submission links uploaded for this task yet.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TaskDeliverablesDetailTab;
