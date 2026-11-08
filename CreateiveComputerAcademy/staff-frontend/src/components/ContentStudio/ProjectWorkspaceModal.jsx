import React from 'react';
import { FiSend, FiScissors, FiCheckCircle, FiYoutube } from 'react-icons/fi';

export default function ProjectWorkspaceModal({
  projectDetails, setProjectDetails, activeTab, setActiveTab, stages = [],
  editScript, setEditScript, editVoiceUrl, setEditVoiceUrl, editAssetsUrl, setEditAssetsUrl,
  editDraftUrl, setEditDraftUrl, editThumbUrl, setEditThumbUrl, editSourceUrl, setEditSourceUrl,
  editYtUrl, setEditYtUrl, editYtTitle, setEditYtTitle, editYtDesc, setEditYtDesc,
  handleSaveAndAdvance, handlePublishYouTube
}) {
  if (!projectDetails) return null;

  const wordCount = editScript ? editScript.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedMins = (wordCount / 140).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
              {projectDetails.project.content_type?.replace('_', ' ')} • Project #{projectDetails.project.id}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {projectDetails.project.title}
            </h2>
          </div>
          <button onClick={() => setProjectDetails(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-2">✕</button>
        </div>

        {/* Stage Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {stages.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === s.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : projectDetails.project.current_stage === s.key
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {s.icon} {s.label}
              {s.credit > 0 && <span className="text-[10px] opacity-80">(+{s.credit}c)</span>}
            </button>
          ))}
        </div>

        {/* Stage Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* SCRIPTING TAB */}
          {activeTab === 'scripting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>✍️ Assigned Scriptwriter: <strong>{projectDetails.project.scriptwriter_name || 'You'}</strong></span>
                <span className="font-semibold text-indigo-600">
                  📊 Word Count: <strong>{wordCount} words</strong> (~{estimatedMins} mins video)
                </span>
              </div>
              <textarea
                rows={12}
                value={editScript}
                onChange={(e) => setEditScript(e.target.value)}
                placeholder="Write your video hook, main content, steps, and call to action here..."
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-mono leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleSaveAndAdvance(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  💾 Save Script Draft
                </button>
                <button
                  onClick={() => handleSaveAndAdvance('voiceover')}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:brightness-110 flex items-center gap-2"
                >
                  <FiSend /> Complete Script & Send to Voiceover (+10 Credits)
                </button>
              </div>
            </div>
          )}

          {/* VOICEOVER TAB */}
          {activeTab === 'voiceover' && (
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800">
                <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">📜 Locked Script Reference:</h4>
                <div className="text-xs text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                  {projectDetails.project.script_text || 'No script drafted yet.'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎙️ Voiceover Audio URL (Cloudflare R2 / Drive / Dropbox)
                </label>
                <input
                  type="url"
                  value={editVoiceUrl}
                  onChange={(e) => setEditVoiceUrl(e.target.value)}
                  placeholder="https://.../voiceover.mp3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {editVoiceUrl && <audio controls src={editVoiceUrl} className="w-full mt-2" />}
              <div className="flex justify-between items-center pt-3">
                <button
                  onClick={() => handleSaveAndAdvance(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  💾 Save Audio Link
                </button>
                <button
                  onClick={() => handleSaveAndAdvance('editing')}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black shadow-lg hover:brightness-110 flex items-center gap-2"
                >
                  <FiScissors /> Send Audio to Video Editor (+10 Credits)
                </button>
              </div>
            </div>
          )}

          {/* FOOTAGE & ASSETS TAB */}
          {activeTab === 'footage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎞️ B-Roll & Footage Asset Drive/Folder URL
                </label>
                <input
                  type="url"
                  value={editAssetsUrl}
                  onChange={(e) => setEditAssetsUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={() => handleSaveAndAdvance(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                💾 Save Asset Links
              </button>
            </div>
          )}

          {/* VIDEO EDITING TAB */}
          {activeTab === 'editing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    🎬 Draft Video Preview URL (.mp4 / Drive preview)
                  </label>
                  <input
                    type="url"
                    value={editDraftUrl}
                    onChange={(e) => setEditDraftUrl(e.target.value)}
                    placeholder="https://.../video_draft_v1.mp4"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    🖼️ Thumbnail Image URL (.png / .jpg)
                  </label>
                  <input
                    type="url"
                    value={editThumbUrl}
                    onChange={(e) => setEditThumbUrl(e.target.value)}
                    placeholder="https://.../thumbnail.png"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📦 Project Source File Link (.prproj / DaVinci Archive)
                </label>
                <input
                  type="url"
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  placeholder="https://drive.google.com/.../project.prproj"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                />
              </div>
              {editDraftUrl && (
                <div className="rounded-2xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center">
                  <video controls src={editDraftUrl} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex justify-between items-center pt-3">
                <button
                  onClick={() => handleSaveAndAdvance(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  💾 Save Draft Progress
                </button>
                <button
                  onClick={() => handleSaveAndAdvance('review')}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-xs font-black shadow-lg hover:brightness-110 flex items-center gap-2"
                >
                  <FiCheckCircle /> Submit Draft Video to QA Review
                </button>
              </div>
            </div>
          )}

          {/* REVIEW / TIMESTAMP REVISIONS TAB */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  🔍 Reviewer Timestamp Feedback ({projectDetails.reviews?.length || 0} Comments)
                </h4>
              </div>
              {projectDetails.reviews?.length === 0 ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center text-xs text-slate-400">
                  No timestamp feedback comments yet. The reviewer will inspect the video frame-by-frame.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectDetails.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-xs">
                      <span className="font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md shrink-0">
                        ⏱️ {rev.timestamp_formatted}
                      </span>
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{rev.reviewer_name}: </span>
                        <span className="text-slate-600 dark:text-slate-400">{rev.feedback_text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PUBLISHED TAB */}
          {activeTab === 'published' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🚀 Final YouTube Live URL *
                </label>
                <input
                  type="url"
                  value={editYtUrl}
                  onChange={(e) => setEditYtUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={editYtTitle}
                    onChange={(e) => setEditYtTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SEO Description</label>
                  <textarea
                    rows={3}
                    value={editYtDesc}
                    onChange={(e) => setEditYtDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handlePublishYouTube}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-500/20 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <FiYoutube className="text-xl" /> Complete & Mark Live on YouTube (+10 Credits)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
