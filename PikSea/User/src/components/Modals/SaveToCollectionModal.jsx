import React, { useState } from "react";
import { X, FolderPlus, Plus, Bookmark, Trash2 } from "lucide-react";
import { useUserCollections, useCreateCollection, useToggleCollectionItem } from "../../utlis/Hooks/useCollections";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

export default function SaveToCollectionModal({ isOpen, onClose, contentId }) {
  const { data: collections = [], isLoading } = useUserCollections(contentId);
  const createMutation = useCreateCollection();
  const toggleMutation = useToggleCollectionItem();
  
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    try {
      await createMutation.mutateAsync({ name: newCollectionName.trim(), contentId });
      toast.success("Collection created and saved!");
      setNewCollectionName("");
      setIsCreating(false);
    } catch (err) {
      toast.error(err.message || "Failed to create collection");
    }
  };

  const handleToggle = async (collectionId, isSaved) => {
    try {
      const res = await toggleMutation.mutateAsync({ collectionId, contentId });
      if (res.action === 'added') {
        toast.success("Saved to collection");
      } else {
        toast.info("Removed from collection");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save item");
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 font-inter animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Save to Collection</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body / List */}
        <div className="p-2 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <span className="w-8 h-8 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin"></span>
            </div>
          ) : collections.length === 0 && !isCreating ? (
            <div className="text-center p-8">
              <FolderPlus size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">You don&apos;t have any collections yet.</p>
            </div>
          ) : (
            <ul className="space-y-2 p-2">
              {collections.map(col => (
                <li key={col.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#1a1a1a] shadow-xs hover:border-gray-300 dark:hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200/70 dark:bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/5">
                      <FolderPlus className="text-gray-500 dark:text-gray-400" size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate font-outfit">{col.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{col.item_count} items</p>
                    </div>
                  </div>
                  
                  <div>
                    {col.is_saved ? (
                      <button
                        onClick={() => handleToggle(col.id, col.is_saved)}
                        disabled={toggleMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggle(col.id, col.is_saved)}
                        disabled={toggleMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4FF] text-[#050505] hover:bg-[#33DEFF] text-xs font-bold transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] cursor-pointer"
                      >
                        <Bookmark size={14} /> Save
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Create New */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#050505]">
          {isCreating ? (
            <form onSubmit={handleCreate} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Collection name"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] transition-colors"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                disabled={createMutation.isPending}
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim() || createMutation.isPending}
                className="px-4 py-2 bg-[#00D4FF] text-[#050505] rounded-lg text-sm font-bold hover:bg-[#33DEFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {createMutation.isPending ? "..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setNewCollectionName(""); }}
                className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold transition-all text-gray-800 dark:text-white cursor-pointer"
            >
              <Plus size={18} />
              Create New Collection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
