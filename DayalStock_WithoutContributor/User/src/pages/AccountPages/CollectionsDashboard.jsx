import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Folder, MoreVertical, Edit2, Trash2, Globe, Lock } from "lucide-react";
import { useUserCollections, useRenameCollection, useDeleteCollection, useToggleCollectionPrivacy } from "../../utlis/Hooks/useCollections";
import ConfirmationModal from "../../components/Modals/ConfirmationModal";
import { toast } from "react-toastify";
import DayalLoader from "../../components/Common/DayalLoader";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getCoverImage = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE_URL}/${url}`;
};

const CollectionThumbnail = ({ images = [] }) => {
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#111] group-hover:bg-gray-200 dark:group-hover:bg-white/5 transition-colors duration-300">
        <Folder size={64} className="text-gray-400 dark:text-gray-600 group-hover:text-gray-500 transition-colors" strokeWidth={1.5} />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img 
        src={getCoverImage(images[0])} 
        alt="Cover" 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
    );
  }

  if (images.length === 2) {
    return (
      <div className="w-full h-full flex gap-1 bg-gray-100 dark:bg-[#111]">
        <div className="flex-1 overflow-hidden">
           <img src={getCoverImage(images[0])} alt="Cover 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
        </div>
        <div className="flex-1 overflow-hidden">
           <img src={getCoverImage(images[1])} alt="Cover 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
        </div>
      </div>
    );
  }

  // 3 or more images: 1 large left, 2 smaller right stacked
  return (
    <div className="w-full h-full grid grid-cols-[2fr_1fr] gap-1 bg-gray-100 dark:bg-[#111]">
      <div className="w-full h-full overflow-hidden">
        <img src={getCoverImage(images[0])} alt="Cover 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
      </div>
      <div className="w-full h-full grid grid-rows-2 gap-1">
        <div className="w-full h-full overflow-hidden">
           <img src={getCoverImage(images[1])} alt="Cover 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
        </div>
        <div className="w-full h-full overflow-hidden">
           <img src={getCoverImage(images[2])} alt="Cover 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};

export default function CollectionsDashboard() {
  const { data: collections = [], isLoading } = useUserCollections();
  const renameMutation = useRenameCollection();
  const deleteMutation = useDeleteCollection();
  const privacyMutation = useToggleCollectionPrivacy();

  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);

  const handleRenameSubmit = async (e, id) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await renameMutation.mutateAsync({ collectionId: id, newName: editName.trim() });
      toast.success("Collection renamed");
      setEditingId(null);
      setActiveMenu(null);
    } catch (err) {
      toast.error(err.message || "Failed to rename collection");
    }
  };

  const openDeleteModal = (col) => {
    setCollectionToDelete(col);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;
    try {
      await deleteMutation.mutateAsync(collectionToDelete.id);
      toast.success("Collection deleted");
      setIsDeleteModalOpen(false);
      setCollectionToDelete(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete collection");
    }
  };

  const handleTogglePrivacy = async (col) => {
    try {
      await privacyMutation.mutateAsync({ collectionId: col.id, isPublic: !col.is_public });
      toast.success(col.is_public ? "Collection is now Private" : "Collection is now Public");
      setActiveMenu(null);
    } catch (err) {
      toast.error(err.message || "Failed to update privacy");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <DayalLoader text="Loading your collections..." />
      </div>
    );
  }

  return (
    <div className="bg-transparent py-2 px-4 relative min-h-[500px]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">My Collections</h2>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-white dark:bg-[#111] rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/5">
            <Folder size={40} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">No collections yet</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            Save your favorite resources in collections to keep them organized and easily accessible.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-8">
          {collections.map(col => (
            <div key={col.id} className="group relative flex flex-col">
              
              {/* Privacy Badge */}
              <div className="absolute top-2 left-2 z-20">
                {col.is_public ? (
                  <div className="flex items-center gap-1 bg-white/90 dark:bg-[#111]/90 backdrop-blur-md border border-[#0088b3]/30 dark:border-[#00D4FF]/30 px-2 py-1 rounded-full text-xs font-semibold text-[#0088b3] dark:text-[#00D4FF] shadow-sm" title="Public Collection">
                    <Globe size={12} /> Public
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-white/90 dark:bg-[#111]/90 backdrop-blur-md border border-gray-200 dark:border-white/10 px-2 py-1 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm" title="Private Collection">
                    <Lock size={12} /> Private
                  </div>
                )}
              </div>

              {/* Dropdown Menu */}
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.preventDefault(); setActiveMenu(activeMenu === col.id ? null : col.id); }}
                  className="w-8 h-8 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-[#111]/90 hover:bg-gray-100 dark:hover:bg-[#222] rounded-full transition-all shadow-sm backdrop-blur-sm border border-gray-200 dark:border-white/10"
                >
                  <MoreVertical size={16} />
                </button>

                {activeMenu === col.id && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] z-30 py-1.5 overflow-hidden">
                    <button 
                      onClick={() => handleTogglePrivacy(col)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
                      disabled={privacyMutation.isPending}
                    >
                      {col.is_public ? (
                         <><Lock size={14} className="text-gray-400" /> Make Private</>
                      ) : (
                         <><Globe size={14} className="text-[#0088b3] dark:text-[#00D4FF]" /> Make Public</>
                      )}
                    </button>
                    <button 
                      onClick={() => { setEditingId(col.id); setEditName(col.name); setActiveMenu(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <Edit2 size={14} className="text-gray-400" /> Rename
                    </button>
                    <button 
                      onClick={() => openDeleteModal(col)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Main Visual Area */}
              <Link to={`/account/collections/${col.id}`} className="block relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/5 shadow-sm group-hover:shadow-[0_0_15px_rgba(0,136,179,0.1)] dark:group-hover:shadow-[0_0_15px_rgba(0,212,255,0.1)] group-hover:border-[#0088b3]/20 dark:group-hover:border-[#00D4FF]/20 transition-all">
                <CollectionThumbnail images={col.cover_images} />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </Link>

              {/* Footer text */}
              <div className="mt-3 relative z-10 px-1">
                {editingId === col.id ? (
                  <form onSubmit={(e) => handleRenameSubmit(e, col.id)} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full border-b border-[#00D4FF] px-1 py-1 text-[15px] font-bold text-gray-900 dark:text-white focus:outline-none transition-all bg-transparent"
                      onBlur={() => setEditingId(null)}
                    />
                  </form>
                ) : (
                  <>
                    <Link to={`/account/collections/${col.id}`} className="block truncate font-bold text-gray-800 dark:text-gray-200 text-[15px] hover:text-[#0088b3] dark:hover:text-[#00D4FF] transition-colors font-outfit">
                      {col.name}
                    </Link>
                    <p className="text-[13px] font-medium text-gray-500 mt-0.5">
                       {col.item_count} {col.item_count === 1 ? 'Image' : 'Images'}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete "${collectionToDelete?.name}"? The saved items will be removed from this collection, but the original content will not be deleted.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
