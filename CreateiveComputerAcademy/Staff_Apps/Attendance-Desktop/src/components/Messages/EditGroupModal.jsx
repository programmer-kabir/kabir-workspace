import React from 'react';
import { FiX, FiImage } from 'react-icons/fi';

const EditGroupModal = ({
  isEditGroupModalOpen,
  setIsEditGroupModalOpen,
  handleEditGroup,
  editGroupFile,
  setEditGroupFile,
  activeChat,
  API_URL,
  editGroupName,
  setEditGroupName,
}) => {
  if (!isEditGroupModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsEditGroupModalOpen(false)} />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Group Info</h3>
          <button
            onClick={() => setIsEditGroupModalOpen(false)}
            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleEditGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Group Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {editGroupFile ? (
                  <img src={URL.createObjectURL(editGroupFile)} className="w-full h-full object-cover" alt="Preview" />
                ) : activeChat?.group_picture ? (
                  <img src={`${API_URL}${activeChat.group_picture}`} className="w-full h-full object-cover" alt="Group" />
                ) : (
                  <FiImage className="text-slate-400 text-xl" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="edit-group-file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setEditGroupFile(e.target.files[0])}
                />
                <label
                  htmlFor="edit-group-file"
                  className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-slate-600"
                >
                  Choose New Picture
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Group Name</label>
            <input
              type="text"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              placeholder="Enter group name..."
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
            <button
              type="submit"
              disabled={(!editGroupName.trim() || editGroupName === activeChat?.name) && !editGroupFile}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;
