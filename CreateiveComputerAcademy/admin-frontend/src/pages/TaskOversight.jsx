import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { ImageLightbox } from '../components/TaskOversight/ImageLightbox';
import { TaskOversightFilterBar } from '../components/TaskOversight/TaskOversightFilterBar';
import { StatsGrid } from '../components/TaskOversight/StatsGrid';
import { TaskCreateEditModal } from '../components/TaskOversight/TaskCreateEditModal';
import { TaskDetailsModal } from '../components/TaskOversight/TaskDetailsModal';
import { TaskHistoryDrawer } from '../components/TaskOversight/TaskHistoryDrawer';
import { TaskRejectModal } from '../components/TaskOversight/TaskRejectModal';
import { TaskColumnGrid } from '../components/TaskOversight/TaskColumnGrid';
import { TaskDeleteConfirmModal } from '../components/TaskOversight/TaskDeleteConfirmModal';
import { useTaskOversight } from '../hooks/useTaskOversight';

const TaskOversight = () => {
  const {
    // Auth & Env
    currentUser,
    API_BASE,

    // Core Data & Loading
    staff,
    workloads,
    departments,
    loading,
    actionLoading,

    // Filters
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    activeTab,
    setActiveTab,
    groupBy,
    setGroupBy,
    searchTerm,
    setSearchTerm,
    selectedStaffFilter,
    setSelectedStaffFilter,
    selectedCategoryFilter,
    selectedSubcategoryFilter,
    selectedChildCategoryFilter,
    handleCategoryFilterChange,
    handleSubcategoryFilterChange,
    handleChildCategoryFilterChange,

    // Stats & Columns
    stats,
    renderColumns,
    getColStyle,

    // History Modal
    isHistoryOpen,
    setIsHistoryOpen,
    historyTask,
    setHistoryTask,
    activeHistoryLogs,
    setActiveHistoryLogs,
    loadingHistory,
    fetchTaskHistory,

    // Details Modal & Comments
    isDetailsOpen,
    setIsDetailsOpen,
    detailsTask,
    setDetailsTask,
    detailsTab,
    setDetailsTab,
    taskToDelete,
    setTaskToDelete,
    comments,
    newComment,
    setNewComment,
    commentsLoading,
    addingComment,
    commentsEndRef,
    editingCommentId,
    setEditingCommentId,
    editCommentText,
    setEditCommentText,
    commentImage,
    setCommentImage,
    commentImagePreview,
    setCommentImagePreview,
    handleAddComment,
    handleSaveEdit,
    handleDeleteComment,

    // Reject Modal
    rejectTask,
    setRejectTask,
    rejectReason,
    setRejectReason,
    handleRejectClick,
    submitReject,

    // Lightbox
    lightboxImage,
    setLightboxImage,
    closeLightbox,

    // Create Modal
    isCreateOpen,
    setIsCreateOpen,
    newTask,
    setNewTask,
    taskCreationMode,
    setTaskCreationMode,
    createEditorRef,
    handleCreateTask,
    EMPTY_TASK_FORM,

    // Edit Modal
    isEditOpen,
    setIsEditOpen,
    editTask,
    setEditTask,
    editUiMode,
    setEditUiMode,
    editEditorRef,
    openEditModal,
    handleEditTask,
    handleDeleteTask,
    handleDuplicateTask,
    handleStatusChange,
    joditConfig
  } = useTaskOversight();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Task Oversight</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Review pending submissions and monitor organizational task progress.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors"
        >
          <FiPlus size={20} />
          <span>Assign Task</span>
        </button>
      </div>

      {/* Dashboard Stats & Filters Bar */}
      <TaskOversightFilterBar
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        selectedCategoryFilter={selectedCategoryFilter}
        selectedSubcategoryFilter={selectedSubcategoryFilter}
        selectedChildCategoryFilter={selectedChildCategoryFilter}
        handleCategoryFilterChange={handleCategoryFilterChange}
        handleSubcategoryFilterChange={handleSubcategoryFilterChange}
        handleChildCategoryFilterChange={handleChildCategoryFilterChange}
        selectedStaffFilter={selectedStaffFilter}
        setSelectedStaffFilter={setSelectedStaffFilter}
        staff={staff}
        apiBase={API_BASE}
      />

      <StatsGrid stats={stats} />

      {/* ── Task Column Grid & Tabs ── */}
      <TaskColumnGrid
        loading={loading}
        renderColumns={renderColumns}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        getColStyle={getColStyle}
        apiBase={API_BASE}
        openEditModal={openEditModal}
        handleDuplicateTask={handleDuplicateTask}
        fetchTaskHistory={fetchTaskHistory}
        onOpenDetails={(task) => {
          setDetailsTask(task);
          setIsDetailsOpen(true);
        }}
        handleStatusChange={handleStatusChange}
        handleRejectClick={handleRejectClick}
        actionLoading={actionLoading}
      />

      {/* ── Reject Modal ── */}
      <TaskRejectModal
        rejectTask={rejectTask}
        onClose={() => setRejectTask(null)}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        submitReject={submitReject}
        actionLoading={actionLoading}
      />

      {/* ── Create & Edit Task Modals ── */}
      <TaskCreateEditModal
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        taskCreationMode={taskCreationMode}
        setTaskCreationMode={setTaskCreationMode}
        newTask={newTask}
        setNewTask={setNewTask}
        createEditorRef={createEditorRef}
        handleCreateTask={handleCreateTask}
        EMPTY_TASK_FORM={EMPTY_TASK_FORM}
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        editTask={editTask}
        setEditTask={setEditTask}
        editUiMode={editUiMode}
        setEditUiMode={setEditUiMode}
        editEditorRef={editEditorRef}
        handleEditTask={handleEditTask}
        setTaskToDelete={setTaskToDelete}
        staff={staff}
        workloads={workloads}
        departments={departments}
        joditConfig={joditConfig}
        apiBase={API_BASE}
        actionLoading={actionLoading}
      />

      {/* ── Task History Drawer (Slide-over Right Panel) ── */}
      <TaskHistoryDrawer
        isOpen={isHistoryOpen}
        historyTask={historyTask}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryTask(null);
          setActiveHistoryLogs([]);
        }}
        loadingHistory={loadingHistory}
        activeHistoryLogs={activeHistoryLogs}
        apiBase={API_BASE}
      />

      {/* ── Task Details Modal ── */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        detailsTask={detailsTask}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsTask(null);
        }}
        openEditModal={openEditModal}
        setTaskToDelete={setTaskToDelete}
        setLightboxImage={setLightboxImage}
        currentUser={currentUser}
        apiBase={API_BASE}
        comments={comments}
        newComment={newComment}
        setNewComment={setNewComment}
        commentImage={commentImage}
        setCommentImage={setCommentImage}
        commentImagePreview={commentImagePreview}
        setCommentImagePreview={setCommentImagePreview}
        commentsLoading={commentsLoading}
        addingComment={addingComment}
        commentsEndRef={commentsEndRef}
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editCommentText={editCommentText}
        setEditCommentText={setEditCommentText}
        handleAddComment={handleAddComment}
        handleSaveEdit={handleSaveEdit}
        handleDeleteComment={handleDeleteComment}
        detailsTab={detailsTab}
        setDetailsTab={setDetailsTab}
      />

      {/* ── Delete Confirmation Modal ── */}
      <TaskDeleteConfirmModal
        taskToDelete={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        actionLoading={actionLoading}
      />

      {/* ── Image Lightbox Modal with Zoom ── */}
      <ImageLightbox image={lightboxImage} onClose={closeLightbox} apiBase={API_BASE} />
    </div>
  );
};

export default TaskOversight;