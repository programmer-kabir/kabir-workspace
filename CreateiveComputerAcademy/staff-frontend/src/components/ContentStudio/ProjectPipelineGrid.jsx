import React from 'react';
import { 
  FiRefreshCw, FiVideo, FiPlus, FiAlertCircle, 
  FiUser, FiScissors, FiYoutube, FiExternalLink, FiClock 
} from 'react-icons/fi';

export default function ProjectPipelineGrid({
  loading,
  projects = [],
  stages = [],
  openProjectModal,
  setShowCreateModal
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 font-bold">
        <FiRefreshCw className="animate-spin text-2xl mr-2" /> Loading Content Projects...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
        <FiVideo className="text-5xl text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Video Projects Found</h3>
        <p className="text-sm text-slate-400 mt-1">Start by creating your first content pipeline project!</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2"
        >
          <FiPlus /> Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((p) => {
        const currentStageObj = stages.find((s) => s.key === p.current_stage) || stages[0] || {};

        return (
          <div
            key={p.id}
            onClick={() => openProjectModal(p)}
            className={`group relative bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all duration-200 hover:shadow-xl cursor-pointer ${
              p.is_my_turn
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {/* My Turn Ribbon */}
            {p.is_my_turn && (
              <span className="absolute -top-3 right-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                ⚡ Action Needed
              </span>
            )}

            {/* Stage Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${currentStageObj.color || 'from-indigo-500 to-indigo-600'} shadow-sm`}>
                {currentStageObj.icon} {currentStageObj.label}
              </span>

              {p.open_revisions_count > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg">
                  <FiAlertCircle /> {p.open_revisions_count} Revisions
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2">
              {p.title}
            </h3>

            {/* Micro Meta */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 truncate">
                <FiUser className="text-slate-400" />
                <span>Script: <strong>{p.scriptwriter_name || 'Team'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <FiScissors className="text-slate-400" />
                <span>Editor: <strong>{p.video_editor_name || 'Team'}</strong></span>
              </div>
            </div>

            {/* Footer URL / Status */}
            {p.yt_live_url ? (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded-xl">
                <span className="flex items-center gap-1"><FiYoutube /> Live on YouTube</span>
                <FiExternalLink />
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1"><FiClock /> Updated recently</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Open Studio →</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

