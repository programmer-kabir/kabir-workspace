import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiVideo, FiPlus, FiCheckCircle, FiYoutube, FiExternalLink,
  FiRefreshCw, FiUser, FiClock, FiLayers, FiScissors, FiEdit3, FiMic, FiFolder
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CreativeComputerAcademy/server/';

const STAGES = [
  { key: 'scripting', label: '1. Scripting', icon: <FiEdit3 />, color: 'bg-blue-500' },
  { key: 'voiceover', label: '2. Voiceover', icon: <FiMic />, color: 'bg-purple-500' },
  { key: 'footage', label: '3. Footage', icon: <FiFolder />, color: 'bg-amber-500' },
  { key: 'editing', label: '4. Editing', icon: <FiScissors />, color: 'bg-emerald-500' },
  { key: 'review', label: '5. QA Review', icon: <FiCheckCircle />, color: 'bg-rose-500' },
  { key: 'published', label: '6. Live on YT', icon: <FiYoutube />, color: 'bg-red-600' }
];

export default function ContentStudioAdmin() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('youtube_long');
  const [scriptwriterId, setScriptwriterId] = useState('');
  const [voiceArtistId, setVoiceArtistId] = useState('');
  const [footageCollectorId, setFootageCollectorId] = useState('');
  const [videoEditorId, setVideoEditorId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [publisherId, setPublisherId] = useState('');

  const [creatorsList, setCreatorsList] = useState([]);
  const [reviewersList, setReviewersList] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchTeam();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/content_studio/get_projects.php`);
      if (res.data.status === 'success') {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin projects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/content_studio/get_team_members.php`);
      if (res.data.status === 'success') {
        const creators = res.data.creators || res.data.data || [];
        const revs = res.data.reviewers || res.data.data || [];
        setCreatorsList(creators);
        setReviewersList(revs);
        setTeamMembers(creators);
        if (currentUser?.id) {
          setPublisherId(currentUser.id);
        }
      }
    } catch (err) {
      console.error('Error fetching team', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Project title is required');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        content_type: contentType,
        created_by: currentUser?.id || 1,
        scriptwriter_id: scriptwriterId || currentUser?.id,
        voice_artist_id: voiceArtistId || null,
        footage_collector_id: footageCollectorId || null,
        video_editor_id: videoEditorId || null,
        reviewer_id: reviewerId || null,
        publisher_id: publisherId || currentUser?.id
      };

      const res = await axios.post(`${API_BASE}api/content_studio/create_project.php`, payload);
      if (res.data.status === 'success') {
        toast.success('🎬 Content Project Created Successfully!');
        setShowCreateModal(false);
        setTitle('');
        fetchProjects();
      } else {
        toast.error(res.data.message || 'Creation failed');
      }
    } catch (err) {
      toast.error('Server error creating project');
    }
  };

  // Stats
  const totalCount = projects.length;
  const inScripting = projects.filter(p => p.current_stage === 'scripting').length;
  const inEditing = projects.filter(p => p.current_stage === 'editing').length;
  const inReview = projects.filter(p => p.current_stage === 'review').length;
  const published = projects.filter(p => p.current_stage === 'published' || p.status === 'completed').length;

  return (
    <div className="p-4 mx-auto space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl">
            <FiVideo className="text-2xl text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">🎬 Content Studio Management</h1>
            <p className="text-slate-400 text-sm mt-0.5">Admin Pipeline Oversight & Video Production Distribution</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition active:scale-95 text-sm"
          >
            <FiPlus className="text-lg" /> New Video Project
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">Total Projects</span>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <span className="text-xs font-bold text-blue-500">In Scripting</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{inScripting}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <span className="text-xs font-bold text-emerald-500">In Video Editing</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{inEditing}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm">
          <span className="text-xs font-bold text-rose-500">In QA Review</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{inReview}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm">
          <span className="text-xs font-bold text-red-500">Live on YouTube</span>
          <div className="text-2xl font-black text-red-600 mt-1">{published}</div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Active Video Pipelines</h3>
          <button onClick={fetchProjects} className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Loading pipelines...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No video pipelines created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="p-3.5">ID & Title</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5">Scriptwriter</th>
                  <th className="p-3.5">Video Editor</th>
                  <th className="p-3.5">Reviewer</th>
                  <th className="p-3.5">Live Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {projects.map((p) => {
                  const stageObj = STAGES.find(s => s.key === p.current_stage) || STAGES[0];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-400 text-[10px]">#{p.id}</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{p.title}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg ${stageObj.color}`}>
                          {stageObj.icon} {stageObj.label}
                        </span>
                      </td>
                      <td className="p-3.5">{p.scriptwriter_name || <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="p-3.5">{p.video_editor_name || <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="p-3.5">{p.reviewer_name || <span className="text-slate-400">QA Pool</span>}</td>
                      <td className="p-3.5">
                        {p.yt_live_url ? (
                          <a href={p.yt_live_url} target="_blank" rel="noreferrer" className="text-red-600 font-bold flex items-center gap-1 hover:underline">
                            <FiYoutube /> Watch Live
                          </a>
                        ) : (
                          <span className="text-slate-400">In Pipeline</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiVideo className="text-indigo-600" /> Create Content Studio Pipeline
            </h2>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topic / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Photoshop Complete Masterclass 2026"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="youtube_long">YouTube Long Form</option>
                    <option value="shorts_reel">Shorts / Reel</option>
                    <option value="tutorial">Software Tutorial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">1. Scriptwriter (Content Team)</label>
                  <select
                    value={scriptwriterId}
                    onChange={(e) => setScriptwriterId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">Select Scriptwriter</option>
                    {creatorsList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">2. Voice Artist</label>
                  <select
                    value={voiceArtistId}
                    onChange={(e) => setVoiceArtistId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {creatorsList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">3. Video Editor</label>
                  <select
                    value={videoEditorId}
                    onChange={(e) => setVideoEditorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {creatorsList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.department_name ? `(${m.department_name})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  Create Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
