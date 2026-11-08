import React from 'react';
import { FiVideo, FiPlus } from 'react-icons/fi';

export default function ContentStudioHeader({
  setShowCreateModal,
  filter,
  setFilter,
  selectedStage,
  setSelectedStage,
  stages = []
}) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl">
              <FiVideo className="text-2xl text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">🎬 Content Studio OS</h1>
              <p className="text-slate-400 text-sm mt-0.5">Assembly Line Video Production & YouTube Publishing Engine</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <FiPlus className="text-lg" /> New Video Project
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          {['all', 'my_turn', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'my_turn' ? '⚡ Action Needed by Me' : f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedStage('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedStage === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Stages
          </button>
          {stages.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedStage(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                selectedStage === s.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

