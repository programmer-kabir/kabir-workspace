import React from 'react';
import { FiCpu } from 'react-icons/fi';
import { AgenticTaskModal } from './AgenticTaskModal';
import { ModalShell } from './ModalShell';
import { TaskFormFields } from './TaskFormFields';

export const TaskCreateEditModal = ({
  // Create Modal Props
  isCreateOpen,
  setIsCreateOpen,
  taskCreationMode,
  setTaskCreationMode,
  newTask,
  setNewTask,
  createEditorRef,
  handleCreateTask,
  EMPTY_TASK_FORM,

  // Edit Modal Props
  isEditOpen,
  setIsEditOpen,
  editTask,
  setEditTask,
  editUiMode,
  setEditUiMode,
  editEditorRef,
  handleEditTask,
  setTaskToDelete,

  // Shared Data & State Props
  staff,
  workloads,
  departments,
  joditConfig,
  apiBase = import.meta.env.VITE_API_BASE_URL || '/',
  actionLoading
}) => {
  return (
    <>
      {/* ── Create Task Modal (Conditional: Agentic vs Manual) ── */}
      {isCreateOpen && taskCreationMode === 'agentic' ? (
        <AgenticTaskModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            if (EMPTY_TASK_FORM) setNewTask(EMPTY_TASK_FORM);
          }}
          formData={newTask}
          setFormData={setNewTask}
          staff={staff}
          workloads={workloads}
          departments={departments}
          apiBase={apiBase}
          onSubmit={handleCreateTask}
          actionLoading={actionLoading}
          onSwitchToManual={() => setTaskCreationMode('manual')}
        />
      ) : (
        isCreateOpen && (
          <ModalShell
            title="Assign New Task"
            onClose={() => {
              setIsCreateOpen(false);
              if (EMPTY_TASK_FORM) setNewTask(EMPTY_TASK_FORM);
            }}
            onSubmit={handleCreateTask}
            submitLabel="Assign Task"
            actionLoading={actionLoading}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setTaskCreationMode('agentic')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
              >
                <FiCpu size={13} /> Switch to Agentic Mode
              </button>
            </div>
            <TaskFormFields
              formData={newTask}
              setFormData={setNewTask}
              editorRef={createEditorRef}
              staff={staff}
              workloads={workloads}
              joditConfig={joditConfig}
              apiBase={apiBase}
              departments={departments}
            />
          </ModalShell>
        )
      )}

      {/* ── Edit Task Modal (Conditional: Agentic Studio vs Manual Form) ── */}
      {isEditOpen && editTask && editUiMode === 'agentic' ? (
        <AgenticTaskModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditTask(null);
          }}
          formData={editTask}
          setFormData={setEditTask}
          staff={staff}
          workloads={workloads}
          departments={departments}
          apiBase={apiBase}
          onSubmit={handleEditTask}
          actionLoading={actionLoading}
          onSwitchToManual={() => setEditUiMode('manual')}
          isEdit={true}
          onDelete={() => setTaskToDelete(editTask)}
        />
      ) : (
        isEditOpen &&
        editTask && (
          <ModalShell
            title="Edit Task"
            onClose={() => {
              setIsEditOpen(false);
              setEditTask(null);
            }}
            onSubmit={handleEditTask}
            submitLabel="Save Changes"
            actionLoading={actionLoading}
            onDelete={() => setTaskToDelete(editTask)}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setEditUiMode('agentic')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-sm"
              >
                <FiCpu size={13} /> Switch to AI Blueprint Studio
              </button>
            </div>
            <TaskFormFields
              formData={editTask}
              setFormData={setEditTask}
              editorRef={editEditorRef}
              staff={staff}
              workloads={workloads}
              joditConfig={joditConfig}
              apiBase={apiBase}
              departments={departments}
              isEdit
            />
          </ModalShell>
        )
      )}
    </>
  );
};

export default TaskCreateEditModal;
