import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  FiEdit3, FiMic, FiFolder, FiScissors,
  FiCheckCircle, FiYoutube
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ProjectWorkspaceModal from '../components/ContentStudio/ProjectWorkspaceModal';
import CreateProjectModal from '../components/ContentStudio/CreateProjectModal';
import ProjectPipelineGrid from '../components/ContentStudio/ProjectPipelineGrid';
import ContentStudioHeader from '../components/ContentStudio/ContentStudioHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
        setCreatorsList(creators);
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

  return (
    <div className="p-4  space-y-6">
      {/* Header & Filter Controls */}
      <ContentStudioHeader
        setShowCreateModal={setShowCreateModal}
        filter={filter}
        setFilter={setFilter}
        selectedStage={selectedStage}
        setSelectedStage={setSelectedStage}
        stages={STAGES}
      />

      {/* Projects Grid / Pipeline */}
      <ProjectPipelineGrid
        loading={loading}
        projects={projects}
        stages={STAGES}
        openProjectModal={openProjectModal}
        setShowCreateModal={setShowCreateModal}
      />

      {/* CREATE PROJECT MODAL */}
      <CreateProjectModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        handleCreateProject={handleCreateProject}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newType={newType}
        setNewType={setNewType}
        newScriptwriter={newScriptwriter}
        setNewScriptwriter={setNewScriptwriter}
        newVoice={newVoice}
        setNewVoice={setNewVoice}
        newFootage={newFootage}
        setNewFootage={setNewFootage}
        newEditor={newEditor}
        setNewEditor={setNewEditor}
        creatorsList={creatorsList}
      />

      {/* PROJECT WORKSPACE MODAL */}
      <ProjectWorkspaceModal
        projectDetails={projectDetails}
        setProjectDetails={setProjectDetails}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stages={STAGES}
        editScript={editScript}
        setEditScript={setEditScript}
        editVoiceUrl={editVoiceUrl}
        setEditVoiceUrl={setEditVoiceUrl}
        editAssetsUrl={editAssetsUrl}
        setEditAssetsUrl={setEditAssetsUrl}
        editDraftUrl={editDraftUrl}
        setEditDraftUrl={setEditDraftUrl}
        editThumbUrl={editThumbUrl}
        setEditThumbUrl={setEditThumbUrl}
        editSourceUrl={editSourceUrl}
        setEditSourceUrl={setEditSourceUrl}
        editYtUrl={editYtUrl}
        setEditYtUrl={setEditYtUrl}
        editYtTitle={editYtTitle}
        setEditYtTitle={setEditYtTitle}
        editYtDesc={editYtDesc}
        setEditYtDesc={setEditYtDesc}
        handleSaveAndAdvance={handleSaveAndAdvance}
        handlePublishYouTube={handlePublishYouTube}
      />
    </div>
  );
}
