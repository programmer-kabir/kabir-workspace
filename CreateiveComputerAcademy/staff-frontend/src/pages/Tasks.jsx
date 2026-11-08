import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';

import TaskCard from './Tasks/TaskCard';
import TaskTabs from './Tasks/TaskTabs';
import TaskDetailsModal from './Tasks/TaskDetailsModal';
import ClaimTaskModal from './Tasks/ClaimTaskModal';
import CreateSelfTaskModal from './Tasks/CreateSelfTaskModal';
import StaffTaskSkeletonGrid from '../components/TaskSkeletonGrid';
import DailyProgressBar from '../components/DailyProgressBar';
import EmptyState from '../components/EmptyState';

import { formatTimeSpent, filterTasks, groupTasksByStatus } from './Tasks/taskUtils';
import DescriptionRenderer, { DynamicJsonViewer, stripHtml } from './Tasks/TaskDescriptionRenderer';
import TaskToastBanners from './Tasks/TaskToastBanners';
import TaskFilterHeader from './Tasks/TaskFilterHeader';
import useTaskComments from './Tasks/useTaskComments';
import useTaskActions from './Tasks/useTaskActions';

const Tasks = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const deptName = currentUser?.department_name ? currentUser.department_name.toLowerCase() : '';
  const isContentTeam = deptName.includes('content') || deptName.includes('video');

  useEffect(() => {
    if (isContentTeam) navigate('/content-studio', { replace: true });
  }, [isContentTeam, navigate]);

  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'To-Do');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsTab, setDetailsTab] = useState('comments');
  const [submissionLink, setSubmissionLink] = useState('');

  // Lightbox and Zoom state
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxScale, setLightboxScale] = useState(2);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxScale(2);
    setIsHovered(false);
    setZoomPos({ x: 50, y: 50 });
  };

  // Search & Filters
  const { searchTerm, setSearchTerm } = useSearch();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('all');
  const [selectedChildCategoryFilter, setSelectedChildCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const handleCategoryFilterChange = (cat) => {
    setSelectedCategoryFilter(cat);
    setSelectedSubcategoryFilter('all');
    setSelectedChildCategoryFilter('all');
  };
  const handleSubcategoryFilterChange = (sub) => {
    setSelectedSubcategoryFilter(sub);
    setSelectedChildCategoryFilter('all');
  };
  const handleChildCategoryFilterChange = (child) => setSelectedChildCategoryFilter(child);

  // Live Timer Tick
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selectedTask when tasks update
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated && (updated.total_time_spent !== selectedTask.total_time_spent || updated.timer_status !== selectedTask.timer_status || updated.status !== selectedTask.status)) {
        setSelectedTask(prev => ({ ...prev, ...updated }));
      }
    }
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const response = await axios.post(`${API_BASE}api/tasks/get_my_tasks.php`, { user_id: currentUser.id });
      if (response.data.status === 'success') {
        const fetchedTasks = response.data.tasks;
        setTasks(fetchedTasks);
        const urlTaskId = new URLSearchParams(location.search).get('taskId');
        if (urlTaskId) {
          const taskToOpen = fetchedTasks.find(t => t.id == urlTaskId);
          if (taskToOpen) {
            setSelectedTask(taskToOpen);
            if (taskToOpen.status) setActiveTab(taskToOpen.status);
          }
        }
      } else {
        setError(response.data.message);
      }
    } catch {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) fetchTasks();
  }, [currentUser]);

  // Deep link handler
  useEffect(() => {
    const urlTaskId = new URLSearchParams(location.search).get('taskId') || location.state?.taskId;
    const targetTab = location.state?.activeTab;

    if (urlTaskId && tasks.length > 0) {
      const taskToOpen = tasks.find(t => String(t.id) === String(urlTaskId));
      if (taskToOpen) {
        setSelectedTask(taskToOpen);
        const tabNames = ['Unassigned', 'To-Do', 'In Progress', 'In Review', 'Rejected', 'Completed'];
        const matchingTab = tabNames.find(tab => tab.toLowerCase() === taskToOpen.status?.toLowerCase());
        if (matchingTab) setActiveTab(matchingTab);
      } else if (targetTab) {
        setActiveTab(targetTab);
      }
    }
  }, [location.search, location.state, tasks]);

  // Custom Hooks for Comments & Actions
  const commentsHook = useTaskComments(selectedTask, currentUser, API_BASE);
  const actionsHook = useTaskActions({
    tasks, setTasks, selectedTask, setSelectedTask, currentUser, API_BASE, setActiveTab, submissionLink, setSubmissionLink, fetchTasks
  });

  const filteredTasks = filterTasks(tasks, {
    searchTerm, selectedCategoryFilter, selectedSubcategoryFilter, selectedChildCategoryFilter, dateFilter
  });
  const columns = groupTasksByStatus(filteredTasks);

  if (loading) {
    return (
      <div className="p-2 md:p-6 min-h-[60vh]">
        <StaffTaskSkeletonGrid count={8} />
      </div>
    );
  }

  return (
    <div className="pb-10 relative">
      <TaskToastBanners
        claimSuccessToast={actionsHook.claimSuccessToast}
        setClaimSuccessToast={actionsHook.setClaimSuccessToast}
        selfCreateToast={actionsHook.selfCreateToast}
        setSelfCreateToast={actionsHook.setSelfCreateToast}
        submitSuccessToast={actionsHook.submitSuccessToast}
        setSubmitSuccessToast={actionsHook.setSubmitSuccessToast}
        actionToast={actionsHook.actionToast}
        setActionToast={actionsHook.setActionToast}
      />

      <TaskFilterHeader
        error={error}
        setIsCreateSelfModalOpen={actionsHook.setIsCreateSelfModalOpen}
        selectedCategoryFilter={selectedCategoryFilter}
        selectedSubcategoryFilter={selectedSubcategoryFilter}
        selectedChildCategoryFilter={selectedChildCategoryFilter}
        handleCategoryFilterChange={handleCategoryFilterChange}
        handleSubcategoryFilterChange={handleSubcategoryFilterChange}
        handleChildCategoryFilterChange={handleChildCategoryFilterChange}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        setSelectedSubcategoryFilter={setSelectedSubcategoryFilter}
        setSelectedChildCategoryFilter={setSelectedChildCategoryFilter}
        apiBase={API_BASE}
      />

      <DailyProgressBar tasks={filteredTasks} />

      <TaskTabs columns={columns} activeTab={activeTab} onTabChange={setActiveTab} />

      {columns[activeTab].length === 0 ? (
        <EmptyState
          activeTab={activeTab}
          hasFilter={Boolean((searchTerm && searchTerm.trim()) || selectedCategoryFilter !== 'all' || selectedSubcategoryFilter !== 'all' || selectedChildCategoryFilter !== 'all' || dateFilter)}
          onClearFilter={() => {
            setSearchTerm('');
            setSelectedCategoryFilter('all');
            setSelectedSubcategoryFilter('all');
            setSelectedChildCategoryFilter('all');
            setDateFilter('');
          }}
          onSwitchTab={setActiveTab}
          onCreateTask={() => actionsHook.setIsCreateSelfModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {columns[activeTab].map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={setSelectedTask}
              onStart={actionsHook.handleStartTask}
              onClaim={actionsHook.handleOpenClaimModal}
              onToggleTimer={actionsHook.handleToggleTimer}
              formatTimeSpent={formatTimeSpent}
            />
          ))}
        </div>
      )}

      <TaskDetailsModal
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        API_BASE={API_BASE}
        currentUser={currentUser}
        handleStartTask={actionsHook.handleStartTask}
        handleClaimTask={actionsHook.handleOpenClaimModal}
        handleToggleTimer={actionsHook.handleToggleTimer}
        formatTimeSpent={formatTimeSpent}
        stripHtml={stripHtml}
        DynamicJsonViewer={DynamicJsonViewer}
        DescriptionRenderer={DescriptionRenderer}
        comments={commentsHook.comments}
        newComment={commentsHook.newComment}
        setNewComment={commentsHook.setNewComment}
        commentsLoading={commentsHook.commentsLoading}
        addingComment={commentsHook.addingComment}
        handleCommentSubmit={commentsHook.handleAddComment}
        handleLoadComments={commentsHook.fetchComments}
        handleDeleteComment={commentsHook.handleDeleteComment}
        handleSaveEdit={commentsHook.handleSaveEdit}
        editingCommentId={commentsHook.editingCommentId}
        setEditingCommentId={commentsHook.setEditingCommentId}
        editCommentText={commentsHook.editCommentText}
        setEditCommentText={commentsHook.setEditCommentText}
        commentImagePreview={commentsHook.commentImagePreview}
        setCommentImagePreview={commentsHook.setCommentImagePreview}
        setCommentImage={commentsHook.setCommentImage}
        commentImage={commentsHook.commentImage}
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
        lightboxScale={lightboxScale}
        setLightboxScale={setLightboxScale}
        zoomPos={zoomPos}
        setZoomPos={setZoomPos}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        closeLightbox={closeLightbox}
        detailsTab={detailsTab}
        setDetailsTab={setDetailsTab}
        submissionLink={submissionLink}
        setSubmissionLink={setSubmissionLink}
        handleSubmitWork={actionsHook.handleSubmitWork}
        isSubmittingWork={actionsHook.isSubmittingWork}
        commentsEndRef={commentsHook.commentsEndRef}
      />

      <ClaimTaskModal
        task={actionsHook.claimModalTask}
        isOpen={!!actionsHook.claimModalTask}
        onClose={() => { if (!actionsHook.claimLoading) actionsHook.setClaimModalTask(null); }}
        onConfirm={actionsHook.handleConfirmClaim}
        loading={actionsHook.claimLoading}
        error={actionsHook.claimError}
      />

      <CreateSelfTaskModal
        isOpen={actionsHook.isCreateSelfModalOpen}
        onClose={() => actionsHook.setIsCreateSelfModalOpen(false)}
        onSuccess={actionsHook.handleSelfTaskCreated}
        currentUser={currentUser}
        API_BASE={API_BASE}
      />
    </div>
  );
};

export default Tasks;
