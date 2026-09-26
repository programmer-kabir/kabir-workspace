import React from 'react';
import {
  FiCalendar,
  FiClock,
  FiLink,
  FiCopy,
  FiCheck,
  FiTarget
} from 'react-icons/fi';
import AgenticBlueprintViewer from '../../AgenticBlueprintViewer';
import { DescriptionRenderer } from '../../TaskOversight/TaskDescriptionRenderer';

/**
 * TaskOverviewTab
 * Renders Overview, Agentic AI Blueprint or Manual Description, Checklists, and Visual References.
 */
const TaskOverviewTab = ({
  selectedTaskModal,
  isAgentic,
  blueprintObj,
  variantsList,
  specs,
  showRawJson,
  setShowRawJson,
  copiedJson,
  setCopiedJson,
  tAssigned,
  workDuration,
  checklists,
  refLinks,
  visualImgs,
  refImgs,
  setLightboxImage,
  formatDateTime,
  API_BASE
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {isAgentic ? (
        /* ── 1. AGENTIC AI BLUEPRINT MODE ── */
        <div className="space-y-5">
          <AgenticBlueprintViewer
            blueprint={blueprintObj}
            variants={variantsList}
          />

          {/* Raw JSON Debug View */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">Want to inspect the raw JSON specification?</span>
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
            </button>
          </div>

          {showRawJson && (
            <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto relative font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(blueprintObj || specs, null, 2));
                  if (setCopiedJson) {
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }
                }}
                className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white shadow-xs flex items-center gap-1"
              >
                <FiCopy size={11} />
                <span>{copiedJson ? 'Copied!' : 'Copy'}</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed pr-12">
                {JSON.stringify(blueprintObj || specs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* ── 2. MANUAL TASK MODE ── */
        <div className="space-y-5">
          {/* Task Description & Rich Instructions (Top) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Description & Instructions
            </h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <DescriptionRenderer htmlContent={selectedTaskModal.description} />
            </div>
          </div>

          {/* Assigned Info & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Assignee Card */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                {selectedTaskModal.assigned_to_avatar ? (
                  <img src={`${API_BASE}${selectedTaskModal.assigned_to_avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-sm uppercase">
                    {selectedTaskModal.assigned_to_name ? selectedTaskModal.assigned_to_name.charAt(0) : 'S'}
                  </div>
                )}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Staff</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{selectedTaskModal.assigned_to_name || selectedTaskModal.employee_name || 'Staff'}</p>
              </div>
            </div>

            {/* Date Card */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <FiCalendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Assigned</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {formatDateTime ? formatDateTime(tAssigned) : (tAssigned || 'Assigned')}
                </p>
              </div>
            </div>

            {/* Time Spent Card */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <FiClock size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Time Spent</p>
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                  {workDuration || 'In Progress'}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-tasks / Checklists */}
          {checklists.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Sub-tasks / Checklist ({checklists.filter(c => c.is_completed).length}/{checklists.length})
              </h4>
              <div className="space-y-2">
                {checklists.map((cl, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cl.is_completed
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border ${cl.is_completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                      {cl.is_completed && <FiCheck size={13} />}
                    </div>
                    <span className={`text-xs font-bold ${cl.is_completed ? 'line-through opacity-75' : ''}`}>
                      {cl.title || cl.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference Links */}
          {refLinks.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reference Links</h4>
              <div className="flex flex-col gap-2">
                {refLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-xs transition-all truncate"
                  >
                    <FiLink size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Target Visual Images */}
          {visualImgs.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <FiTarget size={13} /> Target Visual Image
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visualImgs.map((imgUrl, idx) => {
                  const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (setLightboxImage) setLightboxImage(fullUrl); }}
                      className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 hover:shadow-md hover:border-indigo-400 transition-all group outline-none"
                    >
                      <img src={fullUrl} alt={`Target Visual ${idx + 1}`} className="w-full h-full object-contain bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform duration-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reference Images */}
          {refImgs.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reference Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {refImgs.map((imgUrl, idx) => {
                  const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (setLightboxImage) setLightboxImage(fullUrl); }}
                      className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:shadow-md hover:border-slate-300 transition-all group outline-none"
                    >
                      <img src={fullUrl} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskOverviewTab;
