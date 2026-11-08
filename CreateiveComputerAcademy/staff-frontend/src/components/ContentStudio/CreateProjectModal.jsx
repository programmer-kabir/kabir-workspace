import React from 'react';
import { FiVideo } from 'react-icons/fi';

export default function CreateProjectModal({
  showCreateModal,
  setShowCreateModal,
  handleCreateProject,
  newTitle,
  setNewTitle,
  newType,
  setNewType,
  newScriptwriter,
  setNewScriptwriter,
  newVoice,
  setNewVoice,
  newFootage,
  setNewFootage,
  newEditor,
  setNewEditor,
  creatorsList = []
}) {
  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FiVideo className="text-indigo-600" /> Create Content Studio Project
        </h2>
        <p className="text-xs text-slate-400 mt-1">Set up your video title and assign stage roles dynamically.</p>

        <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Video Topic / Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Top 10 Graphic Design Rules Every Beginner Must Know"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Content Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="youtube_long">YouTube Long Form</option>
                <option value="shorts_reel">Shorts / Reel / TikTok</option>
                <option value="tutorial">Software Tutorial</option>
                <option value="course_promo">Course Promo Video</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">1. Scriptwriter (Content Team)</label>
              <select
                value={newScriptwriter}
                onChange={(e) => setNewScriptwriter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
              >
                {creatorsList.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">2. Voice Artist</label>
              <select
                value={newVoice}
                onChange={(e) => setNewVoice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="">Unassigned / Select Later</option>
                {creatorsList.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">3. Footage Collector</label>
              <select
                value={newFootage}
                onChange={(e) => setNewFootage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="">Unassigned / Select Later</option>
                {creatorsList.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">4. Video Editor</label>
            <select
              value={newEditor}
              onChange={(e) => setNewEditor(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="">Unassigned / Select Later</option>
              {creatorsList.map((m) => (
                <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20"
            >
              Launch Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

