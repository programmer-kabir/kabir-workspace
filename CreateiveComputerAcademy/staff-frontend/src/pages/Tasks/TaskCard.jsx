import React from 'react';
import { FiCode, FiFlag, FiPlayCircle, FiCheckSquare, FiPauseCircle, FiImage, FiStar, FiCalendar, FiClock } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaCoins } from 'react-icons/fa6';

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  text = text.replace(/&nbsp;/g, ' ');
  return text;
};

const TaskCard = ({ task, onSelect, onStart, onClaim, onToggleTimer, formatTimeSpent }) => {
  const isDelayed = task.is_delayed;
  
  // Dynamic styling based on status
  let borderClass = 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
  let gradientClass = 'from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-700';
  let glowColor = 'hover:shadow-slate-500/10';
  
  if (isDelayed && task.status === 'To-Do') {
    borderClass = 'border-red-200/80 hover:border-red-400 dark:border-red-900/60';
    gradientClass = 'from-red-400 to-red-600';
    glowColor = 'hover:shadow-red-500/15';
  } else if (task.status === 'In Progress') {
    borderClass = 'border-blue-200/80 hover:border-blue-400 dark:border-blue-800/60';
    gradientClass = 'from-blue-400 to-indigo-600';
    glowColor = 'hover:shadow-blue-500/20';
  } else if (task.status === 'In Review') {
    borderClass = 'border-amber-200/80 hover:border-amber-400 dark:border-amber-800/60';
    gradientClass = 'from-amber-400 to-orange-500';
    glowColor = 'hover:shadow-amber-500/20';
  } else if (task.status === 'Rejected') {
    borderClass = 'border-rose-200/80 hover:border-rose-400 dark:border-rose-800/60';
    gradientClass = 'from-rose-400 to-red-600';
    glowColor = 'hover:shadow-rose-500/20';
  } else if (task.status === 'Completed') {
    borderClass = 'border-emerald-200/80 hover:border-emerald-400 dark:border-emerald-800/60';
    gradientClass = 'from-emerald-400 to-teal-500';
    glowColor = 'hover:shadow-emerald-500/20';
  } else if (task.status === 'Unassigned') {
    borderClass = 'border-indigo-200/80 border-dashed hover:border-indigo-400 dark:border-indigo-800/60';
    gradientClass = 'from-indigo-400 to-purple-600';
    glowColor = 'hover:shadow-indigo-500/20';
  }

  const getCoverImage = () => {
    if (!task.visual_image) return '/no-image-placeholder.jpg';
    
    let images = [];
    try {
      if (task.visual_image.trim().startsWith('[')) {
        images = JSON.parse(task.visual_image);
      } else if (task.visual_image.includes(',')) {
        images = task.visual_image.split(',').map(i => i.trim());
      } else {
        images = [task.visual_image.trim()];
      }
    } catch (e) {
      images = [task.visual_image.trim()];
    }
    
    if (images.length > 0 && images[0]) {
      return `${import.meta.env.VITE_API_BASE_URL}${images[0]}`;
    }
    
    return '/no-image-placeholder.jpg';
  };

  const coverImageUrl = getCoverImage();

  return (
    <div 
      onClick={() => onSelect(task)} 
      className={`cursor-pointer group bg-white dark:bg-slate-850 rounded-2xl border ${borderClass} hover:-translate-y-1.5 shadow-xs hover:shadow-2xl ${glowColor} transition-all duration-300 relative overflow-hidden flex flex-col min-h-[340px]`}
      style={{
        boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 12px 24px -6px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* 3D Vertical Accent Bar */}
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${gradientClass} z-10`} />
      
      {/* Top Subtle Light Reflection on Hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-blue-500" />

      {/* Cover Image Area with 3D Depth */}
      <div className="w-full h-44 bg-slate-100 dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 relative overflow-hidden flex items-center justify-center shrink-0">
        <img 
          src={coverImageUrl} 
          alt={task.title} 
          className={`w-full h-full ${coverImageUrl === '/no-image-placeholder.jpg' ? 'object-cover opacity-80' : 'object-contain'} group-hover:scale-[1.04] transition-transform duration-500 ease-out`}
          onError={(e) => { 
            e.target.src = '/no-image-placeholder.jpg'; 
            e.target.className = 'w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out opacity-80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
      
      {/* Badges Row */}
      <div className="flex justify-between items-start mb-2.5 gap-1.5">
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {task.category && (
            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shadow-2xs ${
              task.status === 'In Progress' ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/60' :
              task.status === 'In Review' ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60' :
              task.status === 'Rejected' ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-800/60' :
              task.status === 'Completed' ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/60' :
              'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              {task.category.replace(/ > /g, ' › ')}
            </span>
          )}

          {(Number(task.is_self_created) === 1 || task.is_self_created === true) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 shadow-2xs">
              <HiSparkles size={11} className="text-amber-500" /> Self Task
            </span>
          )}

          {(task.creation_mode === 'agentic' || Boolean(task.blueprint_data) || (Array.isArray(task.blueprint_variants) && task.blueprint_variants.length > 0)) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg text-blue-600 dark:text-blue-300 bg-gradient-to-r from-blue-500/10 to-indigo-500/15 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
              <HiSparkles size={11} className="text-amber-400" /> AI Blueprint
            </span>
          )}

          {task.priority && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border shadow-2xs ${
              task.priority === 'High' ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200/70 dark:border-red-800/60' : 
              task.priority === 'Medium' ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60' : 
              'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/60'
            }`}>
              <FiFlag size={10} /> {task.priority}
            </span>
          )}

          {(task.reward_credit !== undefined && task.reward_credit !== null) && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-lg text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-400/50 dark:border-amber-600/40 shadow-2xs" title={task.is_custom_credit ? "Custom Task Credit" : "Category Reward Credit"}>
              <FaCoins size={11} className="text-amber-500" /> +{task.reward_credit} Credits
            </span>
          )}
        </div>

        {isDelayed && task.status === 'To-Do' && (
          <span className="inline-block text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-800 animate-pulse flex-shrink-0">
            Delayed
          </span>
        )}
      </div>
      
      {/* Title */}
      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
        {task.title}
      </h4>
      
      {/* Contextual Feedback / Description */}
      {task.status === 'Rejected' ? (
        <div className="mt-2.5 p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-xl mb-auto">
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-0.5">Rejection Feedback</p>
          <p className="text-xs text-rose-700 dark:text-rose-300 line-clamp-2 leading-relaxed font-medium">{task.admin_note || task.rejection_reason || 'Needs revision based on review feedback.'}</p>
        </div>
      ) : task.status === 'Completed' && (task.review || task.rating || task.feedback_notes) ? (
        (() => {
          const rev = task.review || { rating: task.rating, feedback_notes: task.feedback_notes, tags: task.tags || [] };
          return (
            <div className="mt-2.5 p-2.5 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/50 rounded-xl mb-auto space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-800/80 dark:text-amber-400/80 flex items-center gap-1">
                  <HiSparkles size={11} className="text-amber-500" /> Reviewer Rating
                </span>
                {rev.rating && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg border border-amber-300/40">
                    <FiStar className="fill-amber-500 text-amber-500" size={10} /> {rev.rating}/5
                  </span>
                )}
              </div>
              {rev.feedback_notes && (
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed italic font-medium">
                  "{rev.feedback_notes}"
                </p>
              )}
            </div>
          );
        })()
      ) : stripHtml(task.description).trim().startsWith('{') || stripHtml(task.description).trim().startsWith('[') ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50/70 dark:bg-indigo-950/30 px-2.5 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 w-fit mb-auto">
          <FiCode size={12} className="text-indigo-500" /> Structured Blueprint
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium mb-auto">
          {stripHtml(task.description) || 'No description provided.'}
        </p>
      )}
      
      {/* Date & Deadline Row */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 justify-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned Date</p>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <FiCalendar size={11} className="text-slate-400" />
            <span>{new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})}</span>
          </div>
        </div>
        {task.deadline && (
          <div className="flex flex-col gap-0.5 justify-center items-end text-right">
            <p className={`text-[9px] font-bold uppercase tracking-widest ${
                task.deadline_status === 'overdue' ? 'text-red-500' :
                task.deadline_status === 'due_today' ? 'text-orange-500' :
                'text-amber-500'
              }`}>Due Deadline</p>
            <div className={`flex items-center gap-1 text-xs font-bold ${
                task.deadline_status === 'overdue' ? 'text-red-600 dark:text-red-400' :
                task.deadline_status === 'due_today' ? 'text-orange-600 dark:text-orange-400' :
                'text-amber-600 dark:text-amber-400'
              }`}>
              <FiClock size={11} />
              <span>{new Date(task.deadline).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Trigger Buttons (3D Tactile Styling) */}
      {(task.status === 'To-Do' || task.status === 'Rejected') && onStart && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onStart(e, task.id); }}
            className={`w-full flex justify-center items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all active:scale-95 ${
              task.status === 'Rejected' 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25' 
                : 'bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 text-white shadow-slate-900/20'
            }`}
          >
            <FiPlayCircle size={14} /> {task.status === 'Rejected' ? 'Restart & Fix Task' : 'Start Task Now'}
          </button>
        </div>
      )}

      {task.status === 'Unassigned' && onClaim && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onClaim(e, task); }}
            className="w-full flex justify-center items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25"
          >
            <FiCheckSquare size={14} /> Claim Task
          </button>
        </div>
      )}
      
      {task.status === 'In Progress' && onToggleTimer && formatTimeSpent && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTimer(e, task); }}
            className={`w-full flex justify-center items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 ${
              task.timer_status === 'Running' 
              ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-600 hover:to-indigo-700 ring-2 ring-blue-400/20' 
              : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {task.timer_status === 'Running' ? (
              <><FiPauseCircle size={14} className="animate-pulse text-amber-300" /> {formatTimeSpent(task)} (Running)</>
            ) : (
              <><FiPlayCircle size={14} className="text-blue-500" /> Resume Timer</>
            )}
          </button>
        </div>
      )}

      {task.status === 'In Review' && (
        <div className="mt-3">
          <div className="w-full flex justify-center items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold px-3 py-2 rounded-xl">
            <FiCheckSquare size={14} /> Submitted & In Review
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TaskCard;
