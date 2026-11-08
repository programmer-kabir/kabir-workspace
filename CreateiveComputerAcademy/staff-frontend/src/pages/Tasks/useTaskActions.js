import { useState } from 'react';
import axios from 'axios';

/**
 * Custom Hook for Task Actions & Modal Operations.
 * Handles timer toggle, checklist toggle, task starting, task claiming, and work submission.
 */
export default function useTaskActions({
  tasks,
  setTasks,
  selectedTask,
  setSelectedTask,
  currentUser,
  API_BASE,
  setActiveTab,
  submissionLink,
  setSubmissionLink,
  fetchTasks
}) {
  // Claim & Creative Modal States
  const [claimModalTask, setClaimModalTask] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccessToast, setClaimSuccessToast] = useState(null);
  const [isCreateSelfModalOpen, setIsCreateSelfModalOpen] = useState(false);
  const [selfCreateToast, setSelfCreateToast] = useState(null);
  const [actionToast, setActionToast] = useState({ show: false, title: '', message: '', type: 'error' });

  // Submission State
  const [submitSuccessToast, setSubmitSuccessToast] = useState(false);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  const handleToggleTimer = async (e, task) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    try {
      const endpoint = task.timer_status === 'Running' ? 'pause_timer.php' : 'start_timer.php';
      const response = await axios.post(`${API_BASE}api/tasks/${endpoint}`, {
        user_id: currentUser.id,
        task_id: task.id
      });
      if (response.data.status === 'success') {
        if (fetchTasks) fetchTasks();
      } else {
        alert(response.data.message);
      }
    } catch {
      alert('Failed to toggle timer.');
    }
  };

  const handleToggleChecklist = async (index) => {
    if (!selectedTask) return;
    const updatedChecklists = [...selectedTask.checklists];
    updatedChecklists[index].is_completed = !updatedChecklists[index].is_completed;
    setSelectedTask({ ...selectedTask, checklists: updatedChecklists });
    if (setTasks) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, checklists: updatedChecklists } : t));
    }

    try {
      await axios.post(`${API_BASE}api/tasks/update_checklist.php`, {
        task_id: selectedTask.id,
        checklists: updatedChecklists
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    } catch {
      alert('Failed to update checklist on server.');
    }
  };

  const handleOpenClaimModal = (e, task) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setClaimError('');
    setClaimModalTask(task);
  };

  const handleConfirmClaim = async (taskId) => {
    setClaimLoading(true);
    setClaimError('');
    try {
      const res = await axios.post(`${API_BASE}api/tasks/claim_task.php`, {
        task_id: taskId,
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        const claimedTitle = claimModalTask?.title || 'Task';
        setClaimModalTask(null);
        setSelectedTask(null);
        setClaimSuccessToast({
          title: claimedTitle,
          message: 'Task claimed successfully! It has been moved to your To-Do board.'
        });
        setTimeout(() => setClaimSuccessToast(null), 5000);
        if (fetchTasks) await fetchTasks();
        if (setActiveTab) setActiveTab('To-Do');
      } else {
        setClaimError(res.data.message || 'Failed to claim task.');
      }
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Server error claiming task.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleStartTask = async (e, taskId) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    try {
      const res = await axios.post(`${API_BASE}api/tasks/update_task_status.php`, {
        user_id: currentUser.id,
        task_id: taskId,
        status: 'In Progress'
      });
      if (res.data.status === 'success') {
        if (fetchTasks) fetchTasks();
        setActionToast({
          show: true,
          title: 'Task Started',
          message: 'Task is now in progress and timer is active.',
          type: 'success'
        });
        setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 4000);
      } else {
        setActionToast({
          show: true,
          title: 'Action Restricted',
          message: res.data.message || 'Cannot start this task while another task is in progress.',
          type: 'error'
        });
        setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 6000);
      }
    } catch (err) {
      setActionToast({
        show: true,
        title: 'Error',
        message: err.response?.data?.message || 'Failed to update task status.',
        type: 'error'
      });
      setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 5000);
    }
  };

  const handleSubmitWork = async (predefinedLink = null, submissionFiles = []) => {
    const finalLink = (typeof predefinedLink === 'string' ? predefinedLink : submissionLink) || '';
    if (!finalLink.trim() && (!submissionFiles || submissionFiles.length === 0)) {
      alert('Please upload your completed file(s) or provide a submission link.');
      return;
    }
    setIsSubmittingWork(true);
    try {
      const res = await axios.post(`${API_BASE}api/tasks/update_task_status.php`, {
        user_id: currentUser.id,
        task_id: selectedTask.id,
        status: 'In Review',
        submission_link: finalLink,
        submission_files: submissionFiles
      });
      if (res.data.status === 'success') {
        if (fetchTasks) fetchTasks();
        setSelectedTask(null);
        if (setSubmissionLink) setSubmissionLink('');
        setSubmitSuccessToast(true);
        setTimeout(() => setSubmitSuccessToast(false), 5000);
      } else {
        alert(res.data.message || 'Failed to submit work.');
      }
    } catch {
      alert('Failed to submit work.');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleSelfTaskCreated = (newTask) => {
    if (fetchTasks) fetchTasks();
    if (setActiveTab) setActiveTab('To-Do');
    setSelfCreateToast(newTask || { title: 'Creative Task Added' });
    setTimeout(() => setSelfCreateToast(null), 6000);
  };

  return {
    claimModalTask,
    setClaimModalTask,
    claimLoading,
    claimError,
    claimSuccessToast,
    setClaimSuccessToast,
    isCreateSelfModalOpen,
    setIsCreateSelfModalOpen,
    selfCreateToast,
    setSelfCreateToast,
    actionToast,
    setActionToast,
    submitSuccessToast,
    setSubmitSuccessToast,
    isSubmittingWork,
    handleToggleTimer,
    handleToggleChecklist,
    handleOpenClaimModal,
    handleConfirmClaim,
    handleStartTask,
    handleSubmitWork,
    handleSelfTaskCreated
  };
}

