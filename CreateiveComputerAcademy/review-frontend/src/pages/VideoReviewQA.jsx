import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { 
  FiVideo, FiPlay, FiPause, FiCheckCircle, FiAlertCircle, 
  FiClock, FiSend, FiUser, FiExternalLink, FiScissors, FiRefreshCw 
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CreativeComputerAcademy/server/';

export default function VideoReviewQA() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);

  // Video Player & Timestamp states
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [newFeedback, setNewFeedback] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReviewProjects();
  }, []);

  const fetchReviewProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/content_studio/get_projects.php?stage=review`);
      if (res.data.status === 'success') {
        const list = res.data.data || [];
        setProjects(list);
        if (list.length > 0 && !selectedProject) {
          loadProjectDetails(list[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching review videos', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (project) => {
    setSelectedProject(project);
    try {
      const res = await axios.get(`${API_BASE}api/content_studio/get_project_details.php?project_id=${project.id}`);
      if (res.data.status === 'success') {
        setProjectDetails(res.data.data);
      }
    } catch (err) {
      console.error('Error loading project details', err);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const jumpToTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddTimestampFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim() || !selectedProject) return;

    setSubmittingComment(true);
    try {
      const payload = {
        project_id: selectedProject.id,
        reviewer_id: currentUser?.id || 1,
        timestamp_seconds: Math.floor(currentTime),
        feedback_text: newFeedback.trim()
      };

      const res = await axios.post(`${API_BASE}api/content_studio/add_review_timestamp.php`, payload);
      if (res.data.status === 'success') {
        setNewFeedback('');
        loadProjectDetails(selectedProject);
      }
    } catch (err) {
      alert('Error adding review comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedProject) return;
    const confirmMsg = decision === 'approve' 
      ? 'Approve this video and reward +25 credits to editor?' 
      : 'Request revision from editor with the timestamped feedback?';
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const payload = {
        project_id: selectedProject.id,
        reviewer_id: currentUser?.id || 1,
        decision: decision
      };

      const res = await axios.post(`${API_BASE}api/content_studio/approve_or_revise.php`, payload);
      if (res.data.status === 'success') {
        if (decision === 'approve') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        alert(res.data.message);
        fetchReviewProjects();
        setSelectedProject(null);
        setProjectDetails(null);
      }
    } catch (err) {
      alert('Error recording decision');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-6 rounded-3xl text-white shadow-xl border border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600/30 border border-rose-400/30 rounded-2xl">
            <FiVideo className="text-2xl text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">🎬 Video QA & Review Studio</h1>
            <p className="text-slate-400 text-sm mt-0.5">Frame-Accurate Video Inspection & Timestamp Feedback</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReviewProjects}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <FiRefreshCw /> Refresh Queue ({projects.length})
          </button>
        </div>
      </div>

      {/* Main Layout: Left Queue / Right Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Pending Review List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            Pending Videos ({projects.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold">Loading queue...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              🎉 No videos waiting for QA review right now!
            </div>
          ) : (
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => loadProjectDetails(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedProject?.id === p.id
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-rose-500">
                    Project #{p.id} • {p.content_type}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
                    {p.title}
                  </h4>
                  <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                    <span>Editor: <strong>{p.video_editor_name || 'Staff'}</strong></span>
                    <span className="text-rose-600 font-bold">Inspect Video →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Interactive Video Player & Timestamp Feedback */}
        <div className="lg:col-span-8">
          {projectDetails ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Title & Metadata */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-rose-500">
                    QA Review Workspace • Project #{projectDetails.project.id}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {projectDetails.project.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Editor: <strong>{projectDetails.project.video_editor_name || 'Staff'}</strong> • 
                    Script: <strong>{projectDetails.project.scriptwriter_name || 'Staff'}</strong>
                  </p>
                </div>
              </div>

              {/* Video Player */}
              <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center relative shadow-inner">
                {projectDetails.project.draft_video_url ? (
                  <video
                    ref={videoRef}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    src={projectDetails.project.draft_video_url}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <FiVideo className="text-4xl mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No direct .mp4 draft uploaded. Check external links below.</p>
                  </div>
                )}
              </div>

              {/* Timestamp Feedback Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <form onSubmit={handleAddTimestampFeedback} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold shrink-0">
                    <FiClock className="text-rose-500" />
                    <span>Current: <strong>{formatSeconds(currentTime)}</strong></span>
                  </div>

                  <input
                    type="text"
                    required
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="Type feedback for this timestamp (e.g. Change B-roll cut here)..."
                    className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                  />

                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-md shadow-rose-500/20"
                  >
                    <FiSend /> Add Marker
                  </button>
                </form>
              </div>

              {/* Timestamp Comments List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ⏱️ Frame-Accurate Feedback Markers ({projectDetails.reviews?.length || 0})
                </h4>

                {projectDetails.reviews?.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                    No timestamp markers yet. Pause the video and add feedback at exact seconds.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projectDetails.reviews.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => jumpToTime(r.timestamp_seconds)}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs hover:border-rose-400 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-md">
                            ▶ {r.timestamp_formatted}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">{r.feedback_text}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Click to jump</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Decision Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => handleDecision('revise')}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <FiAlertCircle /> Request Revision from Editor
                </button>

                <button
                  onClick={() => handleDecision('approve')}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25"
                >
                  <FiCheckCircle /> Approve Video (+25 Credits to Editor)
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
              Select a video from the left queue to start frame-by-frame QA inspection.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
