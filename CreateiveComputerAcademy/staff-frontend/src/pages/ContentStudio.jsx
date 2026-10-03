import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  FiVideo, FiPlus, FiEdit3, FiMic, FiFolder, FiScissors, 
  FiCheckCircle, FiYoutube, FiClock, FiUser, FiExternalLink, 
  FiAlertCircle, FiSend, FiPlay, FiRefreshCw, FiLayers
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CreativeComputerAcademy/server/';

const STAGES = [
  { key: 'scripting', label: '1. Scripting', icon: <FiEdit3 />, color: 'from-blue-500 to-indigo-600', credit: 10 },
  { key: 'voiceover', label: '2. Voiceover', icon: <FiMic />, color: 'from-purple-500 to-pink-600', credit: 10 },
  { key: 'footage', label: '3. Footage/Assets', icon: <FiFolder />, color: 'from-amber-500 to-orange-600', credit: 5 },
  { key: 'editing', label: '4. Video Editing', icon: <FiScissors />, color: 'from-emerald-500 to-teal-600', credit: 25 },
  { key: 'review', label: '5. QA Review', icon: <FiCheckCircle />, color: 'from-rose-500 to-red-600', credit: 0 },
  { key: 'published', label: '6. Published', icon: <FiYoutube />, color: 'from-red-600 to-red-700', credit: 10 }
];

export default function ContentStudio() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'my_turn', 'active', 'completed'
  const [selectedStage, setSelectedStage] = useState('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('youtube_long');
  const [newScriptwriter, setNewScriptwriter] = useState('');
  const [newVoice, setNewVoice] = useState('');
  const [newFootage, setNewFootage] = useState('');
  const [newEditor, setNewEditor] = useState('');
  const [newThumb, setNewThumb] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newReviewer, setNewReviewer] = useState('');

  // Project Edit State
  const [editScript, setEditScript] = useState('');
  const [editVoiceUrl, setEditVoiceUrl] = useState('');
  const [editAssetsUrl, setEditAssetsUrl] = useState('');
  const [editDraftUrl, setEditDraftUrl] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editThumbUrl, setEditThumbUrl] = useState('');
  const [editYtUrl, setEditYtUrl] = useState('');
  const [editYtTitle, setEditYtTitle] = useState('');
  const [editYtDesc, setEditYtDesc] = useState('');

  const [creatorsList, setCreatorsList] = useState([]);
  const [reviewersList, setReviewersList] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
  }, [filter, selectedStage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}api/content_studio/get_projects.php?user_id=${currentUser?.id}&filter=${filter}`;
      if (selectedStage !== 'all') {
        url += `&stage=${selectedStage}`;
      }
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching content studio projects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/content_studio/get_team_members.php`);
      if (res.data.status === 'success') {
        const creators = res.data.creators || res.data.data || [];
        const revs = res.data.reviewers || res.data.data || [];
        setCreatorsList(creators);
        setReviewersList(revs);
        setTeamMembers(creators);
        if (currentUser?.id) {
          setNewScriptwriter(currentUser.id);
          setNewPublisher(currentUser.id);
        }
      }
    } catch (err) {
      console.error('Error fetching team members', err);
    }
  };

  const openProjectModal = async (project) => {
    setActiveProject(project);
    try {
      const res = await axios.get(`${API_BASE}api/content_studio/get_project_details.php?project_id=${project.id}`);
      if (res.data.status === 'success') {
        const d = res.data.data;
        setProjectDetails(d);
        setEditScript(d.project.script_text || '');
        setEditVoiceUrl(d.project.voiceover_audio_url || '');
        setEditAssetsUrl(d.project.assets_drive_url || '');
        setEditDraftUrl(d.project.draft_video_url || '');
        setEditSourceUrl(d.project.project_source_url || '');
        setEditThumbUrl(d.project.thumbnail_url || '');
        setEditYtUrl(d.project.yt_live_url || '');
        setEditYtTitle(d.project.yt_title || d.project.title || '');
        setEditYtDesc(d.project.yt_description || '');
        setActiveTab(d.project.current_stage);
      }
    } catch (err) {
      toast.error('Failed to load project details');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Project title is required');
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        content_type: newType,
        created_by: currentUser.id,
        scriptwriter_id: newScriptwriter || currentUser.id,
        voice_artist_id: newVoice || null,
        footage_collector_id: newFootage || null,
        video_editor_id: newEditor || null,
        thumbnail_designer_id: newThumb || null,
        publisher_id: newPublisher || currentUser.id,
        reviewer_id: newReviewer || null
      };

      const res = await axios.post(`${API_BASE}api/content_studio/create_project.php`, payload);
      if (res.data.status === 'success') {
        toast.success('🎬 Content Project Created Successfully!');
        setShowCreateModal(false);
        setNewTitle('');
        fetchProjects();
      } else {
        toast.error(res.data.message || 'Creation failed');
      }
    } catch (err) {
      toast.error('Server error creating project');
    }
  };

  const handleSaveAndAdvance = async (nextStage = null) => {
    if (!activeProject) return;

    try {
      const payload = {
        project_id: activeProject.id,
        user_id: currentUser.id,
        script_text: editScript,
        voiceover_audio_url: editVoiceUrl,
        assets_drive_url: editAssetsUrl,
        draft_video_url: editDraftUrl,
        project_source_url: editSourceUrl,
        thumbnail_url: editThumbUrl,
        next_stage: nextStage
      };

      const res = await axios.post(`${API_BASE}api/content_studio/update_stage_deliverable.php`, payload);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Saved successfully!');
        if (res.data.credit_awarded > 0) {
          toast.success(`🪙 +${res.data.credit_awarded} Credits Earned!`);
        }
        openProjectModal(activeProject);
        fetchProjects();
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Error updating stage');
    }
  };

  const handlePublishYouTube = async () => {
    if (!editYtUrl.trim()) {
      toast.error('Please provide YouTube Live URL');
      return;
    }

    try {
      const payload = {
        project_id: activeProject.id,
        user_id: currentUser.id,
        yt_live_url: editYtUrl.trim(),
        yt_title: editYtTitle,
        yt_description: editYtDesc
      };

      const res = await axios.post(`${API_BASE}api/content_studio/publish_youtube.php`, payload);
      if (res.data.status === 'success') {
        toast.success('🚀 Video is Published! +10 Credits Earned.');
        openProjectModal(activeProject);
        fetchProjects();
      } else {
        toast.error(res.data.message || 'Publishing failed');
      }
    } catch (err) {
      toast.error('Error publishing video');
    }
  };

  // Word count & duration estimate
  const wordCount = editScript ? editScript.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedMins = (wordCount / 140).toFixed(1);

  return (
    <div className="p-4  space-y-6">
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
          {STAGES.map((s) => (
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

      {/* Projects Grid / Pipeline */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-bold">
          <FiRefreshCw className="animate-spin text-2xl mr-2" /> Loading Content Projects...
        </div>
      ) : projects.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const currentStageObj = STAGES.find((s) => s.key === p.current_stage) || STAGES[0];
            const isFinished = p.status === 'completed' || p.current_stage === 'published';

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
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${currentStageObj.color} shadow-sm`}>
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
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
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
      )}

      {/* PROJECT WORKSPACE MODAL */}
      {projectDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col">
            
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                  {projectDetails.project.content_type.replace('_', ' ')} • Project #{projectDetails.project.id}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {projectDetails.project.title}
                </h2>
              </div>
              <button
                onClick={() => setProjectDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-2"
              >
                ✕
              </button>
            </div>

            {/* Stage Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              {STAGES.map((s) => (
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

                  {editVoiceUrl && (
                    <audio controls src={editVoiceUrl} className="w-full mt-2" />
                  )}

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
      )}
    </div>
  );
}
