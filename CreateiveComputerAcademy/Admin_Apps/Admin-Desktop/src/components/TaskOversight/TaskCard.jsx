import React, { useMemo } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiLink, FiEdit2, FiCalendar, FiCopy, FiFlag, FiEye } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { extractJsonFromHtml } from './TaskDescriptionRenderer';

export const TaskCard = React.memo(({ task, isReview, apiBase, onEdit, onDuplicate, onViewHistory, onOpenDetails, onStatusChange, onReject, actionLoading, innerRef, draggableProps, dragHandleProps, isDragging }) => {
    const { jsonData, remainingHtml, hasRemainingText } = useMemo(() => extractJsonFromHtml(task.description || ''), [task.description]);

    const isPastDeadline = task.deadline && new Date() > new Date(task.deadline + 'T' + (task.deadline_time || '23:59:59'));
    const isTodayDeadline = task.deadline && new Date().toISOString().split('T')[0] === task.deadline;

    return (
    <div
        ref={innerRef}
        {...draggableProps}
        {...dragHandleProps}
        onClick={() => onOpenDetails(task)}
        className={`group relative bg-white dark:bg-slate-800 rounded-2xl border p-4 sm:p-5 flex flex-col h-full transition-all duration-300 ease-out cursor-pointer overflow-hidden
      ${isDragging
                ? 'shadow-2xl border-blue-500 ring-4 ring-blue-500/15 scale-[1.03] rotate-1 z-50 bg-white dark:bg-slate-800 cursor-grabbing'
                : 'border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:-translate-y-1.5'
            }`}
        style={{
            boxShadow: isDragging ? undefined : '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 12px 24px -6px rgba(0, 0, 0, 0.03)'
        }}
    >
        {/* Subtle Top 3D Accent Reflection on Hover */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Thumbnail Image Container with 3D Depth */}
        <div className="w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] h-40 -mt-4 sm:-mt-5 -mx-4 sm:-mx-5 mb-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 rounded-t-2xl overflow-hidden flex-shrink-0 relative">
            {(() => {
                let firstImg = null;
                if (task.visual_image) {
                    try {
                        const parsed = Array.isArray(task.visual_image) ? task.visual_image : JSON.parse(task.visual_image);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            firstImg = parsed[0];
                        } else if (typeof parsed === 'string' && parsed) {
                            firstImg = parsed;
                        }
                    } catch (e) {
                        firstImg = typeof task.visual_image === 'string' ? task.visual_image : null;
                    }
                }

                if (firstImg) {
                    return (
                        <div className="relative w-full h-full overflow-hidden bg-white/5">
                            <img 
                                src={`${apiBase}${firstImg}`} 
                                alt="Task Thumbnail" 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform duration-500 ease-out" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                    );
                }

                return (
                    <div className="relative w-full h-full overflow-hidden">
                        <img 
                            src="/no-image-placeholder.jpg" 
                            alt="No Image Available" 
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90" 
                        />
                    </div>
                );
            })()}

            {/* Quick View Tag on Image Hover */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                <FiEye size={10} /> View Details
            </div>
        </div>

        {/* Header Badges & Actions Row */}
        <div className="flex justify-between items-start mb-3 gap-2">
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                {/* Status Badge */}
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                    task.status === 'In Review' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60' :
                    task.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' :
                    task.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' :
                    task.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                    {task.status}
                </span>

                {/* Agentic AI Blueprint Badge with Holographic Gradient */}
                {(task.creation_mode === 'agentic' || Boolean(task.blueprint_data) || (Array.isArray(task.blueprint_variants) && task.blueprint_variants.length > 0)) && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg border flex items-center gap-1 uppercase tracking-wider bg-gradient-to-r from-blue-500/10 via-indigo-500/15 to-purple-500/10 text-blue-600 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
                        <HiSparkles size={11} className="text-amber-400 drop-shadow-xs" /> AI Blueprint
                    </span>
                )}

                {/* Priority Badge */}
                {task.priority && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 uppercase tracking-wider shadow-2xs ${
                        task.priority === 'High' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border-red-200/80 dark:border-red-800/50' :
                        task.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50' :
                        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
                    }`}>
                        <FiFlag size={10} /> {task.priority}
                    </span>
                )}

                {/* Category Badge */}
                {task.category && (
                    <span 
                        title={`Category: ${task.category}`}
                        className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 tracking-tight flex items-center gap-1 max-w-[150px] truncate"
                    >
                        <span className="text-[10px]">🏷️</span>
                        <span className="truncate">{task.category.replace(/ > /g, ' › ')}</span>
                    </span>
                )}

                {/* Reward Credit Badge */}
                {(task.reward_credit !== undefined && task.reward_credit !== null) && (
                    <span 
                        title={task.is_custom_credit ? "Custom Task Credit" : "Category Reward Credit"}
                        className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-400/50 dark:border-amber-600/40 tracking-tight flex items-center gap-1 shadow-2xs"
                    >
                        <span>🪙</span>
                        <span>+{task.reward_credit} {task.is_custom_credit ? '(Custom)' : ''}</span>
                    </span>
                )}
            </div>

            {/* Quick Action Deck (3D Tactile Buttons) */}
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs">
                <button
                    onClick={(e) => { e.stopPropagation(); onViewHistory(task); }}
                    title="Task History Logs"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90"
                >
                    <FiClock size={13} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
                    title="Duplicate Task"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90"
                >
                    <FiCopy size={13} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    title="Edit Task"
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90"
                >
                    <FiEdit2 size={13} />
                </button>
            </div>
        </div>

        {/* Task Title */}
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {task.title}
        </h3>

        {/* Submission Link (if present) */}
        {task.submission_link && (
            <div className="mb-3">
                <a
                    href={task.submission_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs rounded-xl transition-all w-full shadow-2xs"
                >
                    <FiLink size={12} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate flex-1 text-left text-[11px]">View Submitted Work</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500 text-white rounded font-bold uppercase tracking-wide flex-shrink-0">LINK</span>
                </a>
            </div>
        )}

        {/* Description snippet with soft gradient fade */}
        <div
            className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1 overflow-hidden relative flex flex-col gap-1.5"
            style={{ maxHeight: '90px' }}
        >
            {jsonData ? (
                <div className="flex items-center gap-2 p-2 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/60 rounded-xl text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                    <FiCheckCircle size={13} className="text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Structured Blueprint Attached</span>
                </div>
            ) : null}

            {hasRemainingText && remainingHtml ? (
                <div className="relative flex-1 overflow-hidden">
                    <p className="text-xs line-clamp-2 text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                        {remainingHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none" />
                </div>
            ) : !jsonData ? (
                <p className="italic text-slate-400 text-[11px]">No description provided.</p>
            ) : null}
        </div>

        {/* Footer: Assigned Staff & Date Pills */}
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
            {/* Staff Pill */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-white dark:border-slate-600 shadow-2xs">
                    {task.assigned_to_avatar ? (
                        <img src={`${apiBase}${task.assigned_to_avatar}`} alt="Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[9px] uppercase">
                            {task.assigned_to_name ? task.assigned_to_name.charAt(0) : '?'}
                        </div>
                    )}
                </div>
                <div className="overflow-hidden min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Assigned To</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-none">{task.assigned_to_name || 'Unassigned'}</p>
                </div>
            </div>

            {/* Date & Deadline Pills */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 uppercase tracking-wider shadow-2xs">
                    <FiCalendar size={10} className="text-slate-400" />
                    {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
                {task.deadline && (
                    <div className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-2xs 
                        ${isPastDeadline ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse' :
                          isTodayDeadline ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                          'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'}`}>
                        <FiClock size={10} />
                        {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                )}
            </div>
        </div>

        {/* Review Approval Row (if in review mode) */}
        {isReview && (
            <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'Completed'); }}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    <FiCheckCircle size={14} /> Approve
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onReject(task); }}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-all active:scale-95 disabled:opacity-50"
                >
                    <FiXCircle size={14} /> Reject
                </button>
            </div>
        )}
    </div>
    );
});

export default TaskCard;
