import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, LayoutGrid, Globe, Lock, AlertCircle } from "lucide-react";
import { useCollectionContents, useToggleCollectionItem } from "../../utlis/Hooks/useCollections";
import ContentCard from "../../components/Cards/ContentCard";
import { toast } from "react-toastify";

export default function SingleCollectionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useCollectionContents(id);
  const toggleMutation = useToggleCollectionItem();

  const handleRemoveItem = async (contentId) => {
    try {
      await toggleMutation.mutateAsync({ collectionId: id, contentId });
      toast.info("Removed from collection");
    } catch (err) {
      toast.error(err.message || "Failed to remove item");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-10 h-10 border-4 border-gray-200 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-8 min-h-[400px] flex flex-col items-center justify-center text-center transition-colors">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">{error.message || "You don't have permission to view this collection."}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-[#050505] font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const collectionName = data?.collection_name || "Collection";
  const contents = data?.contents || [];
  const isPublic = data?.is_public || false;
  const isOwner = data?.is_owner || false;

  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-100 dark:border-white/5 p-6 md:p-8 min-h-[500px] transition-colors">
      
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{collectionName}</h2>
            {isPublic ? (
              <span className="flex items-center gap-1 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                <Globe size={12} /> Public
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                <Lock size={12} /> Private
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{contents.length} items</p>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 transition-colors">
            <LayoutGrid size={40} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">This collection is empty</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Start saving content to this collection to easily find them later.
          </p>
          <Link to="/" className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-[#050505] font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
            Browse Content
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {contents.map((item) => (
            <div key={item.id} className="relative group">
              <ContentCard data={item} />
              
              {/* Overlay Remove Button */}
              {isOwner && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={toggleMutation.isPending}
                  className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-600 shadow-sm border border-transparent dark:border-red-500/30"
                  title="Remove from collection"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
