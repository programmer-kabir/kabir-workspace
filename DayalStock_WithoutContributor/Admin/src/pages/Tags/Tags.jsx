import { useState } from "react";
import useTags from "../../utils/Hooks/useTags";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTag, updateTag, deleteTag } from "../../api/tagApi";
import DayalLoader from "../../components/Common/DayalLoader";
import { toast } from "react-toastify";
import {
  Tag as TagIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Hash,
  Flame,
  TrendingUp
} from "lucide-react";

const Tags = () => {
  const queryClient = useQueryClient();
  const { data: tags, isLoading, isError } = useTags();
  const [searchTerm, setSearchTerm] = useState("");

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [formData, setFormData] = useState({ name: "", slug: "" });

  const addMutation = useMutation({
    mutationFn: addTag,
    onSuccess: () => {
      queryClient.invalidateQueries(["tags"]);
      toast.success("Tag added successfully! 🎉");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Failed to add tag.")
  });

  const updateMutation = useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries(["tags"]);
      toast.success("Tag updated successfully! ✨");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Failed to update tag.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries(["tags"]);
      toast.success("Tag deleted successfully! 🗑️");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Failed to delete tag.")
  });

  const openAddModal = () => {
    setFormData({ name: "", slug: "" });
    setModalState({ type: "ADD", data: null });
  };

  const openEditModal = (tag) => {
    setFormData({ name: tag.name, slug: tag.slug });
    setModalState({ type: "EDIT", data: tag });
  };

  const openDeleteModal = (tag) => {
    setModalState({ type: "DELETE", data: tag });
  };

  const closeModal = () => setModalState({ type: null, data: null });

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    addMutation.mutate({ name: formData.name, slug: formData.slug });
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: modalState.data.id, name: formData.name, slug: formData.slug });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(modalState.data.id);
  };

  const filteredTags = (tags || []).filter(t => 
    (t.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (t.slug?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Dynamically find the Top 6 most used tags (must have at least 1 use)
  const topTagIds = new Set(
    (tags || [])
      .filter(t => parseInt(t.usage_count || 0) > 0)
      .slice(0, 6)
      .map(t => t.id)
  );

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[#12121E] border border-white/5 shadow-2xl">
        <div className="absolute top-[-20%] left-[-10%] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[100px] pointer-events-none" />
        
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <TagIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-200 tracking-wide">
                Tags Management
              </h1>
              <p className="mt-2 text-base text-gray-400 max-w-lg">
                Manage metadata tags to categorize and filter your contents efficiently.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-sm font-bold text-indigo-400 transition-all hover:bg-indigo-500 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            >
              <Plus size={18} strokeWidth={3} />
              Add Tag
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-xl">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search tags by name or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      {/* STATES */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <DayalLoader text="Loading tags..." />
        </div>
      )}
      
      {isError && (
        <div className="text-center py-20 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          Failed to load tags. Please check your connection or backend API.
        </div>
      )}

      {/* TAGS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {!isLoading && !isError && filteredTags.map((tag) => {
          const isHot = topTagIds.has(tag.id);
          
          return (
          <div 
            key={tag.id}
            className={`group relative flex flex-col justify-center items-center rounded-2xl border bg-[#12121E] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              isHot 
                ? "border-amber-500/20 hover:border-amber-500/50 hover:bg-[#1a1510] hover:shadow-amber-500/10"
                : "border-white/5 hover:border-indigo-500/30 hover:bg-[#1a1a2e] hover:shadow-indigo-500/10"
            }`}
          >
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isHot 
                ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                : "bg-white/5 text-gray-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400"
            }`}>
              {isHot ? <Flame size={24} /> : <Hash size={24} />}
            </div>
            <h3 className="text-base font-bold text-gray-200 group-hover:text-white truncate w-full">{tag.name}</h3>
            <p className="mt-1 text-xs text-gray-500 truncate w-full">{tag.slug}</p>
            
            <div className={`mt-3 flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
              isHot
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            }`}>
              {isHot && <TrendingUp size={12} />}
              <span>{tag.usage_count || 0}</span>
              <span className="opacity-70 font-normal">uses</span>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/80 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              <button 
                onClick={() => openEditModal(tag)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-indigo-500"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => openDeleteModal(tag)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )})}

        {!isLoading && !isError && filteredTags.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            <Hash size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No tags found.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modalState.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12121E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* DELETE MODAL */}
            {modalState.type === "DELETE" && (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Tag?</h3>
                <p className="text-gray-400 text-sm mb-8">
                  Are you sure you want to delete <span className="text-white font-bold">"{modalState.data?.name}"</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}

            {/* ADD / EDIT MODAL */}
            {(modalState.type === "ADD" || modalState.type === "EDIT") && (
              <form onSubmit={modalState.type === "ADD" ? handleSubmitAdd : handleSubmitEdit}>
                <div className="flex items-center justify-between border-b border-white/5 p-6 bg-white/[0.02]">
                  <h3 className="text-xl font-bold text-white">
                    {modalState.type === "ADD" ? "Add New Tag" : "Edit Tag"}
                  </h3>
                  <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Tag Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="e.g., Abstract"
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Slug (URL friendly)</label>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      required
                      placeholder="e.g., abstract"
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 p-6 flex justify-end gap-3 bg-white/[0.02]">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={addMutation.isPending || updateMutation.isPending}
                    className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {modalState.type === "ADD" ? (addMutation.isPending ? "Saving..." : "Save Tag") : (updateMutation.isPending ? "Updating..." : "Update Tag")}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;
