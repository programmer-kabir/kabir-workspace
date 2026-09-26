import React from "react";
import { Link } from "react-router-dom";
import { Folder } from "lucide-react";
import { usePublicCollections } from "../../utlis/Hooks/useCollections";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getCoverImage = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE_URL}/${url}`;
};

const CollectionThumbnail = ({ images = [] }) => {
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/5 group-hover:bg-gray-100 dark:group-hover:bg-white/10 transition-colors duration-300">
        <Folder size={64} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" strokeWidth={1.5} />
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
      <div className="w-full h-full flex gap-1 bg-white dark:bg-[#111]">
        <div className="flex-1 overflow-hidden">
           <img src={getCoverImage(images[0])} alt="Cover 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-1 overflow-hidden">
           <img src={getCoverImage(images[1])} alt="Cover 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full grid grid-cols-[2fr_1fr] gap-1 bg-white dark:bg-[#111]">
      <div className="w-full h-full overflow-hidden">
        <img src={getCoverImage(images[0])} alt="Cover 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="w-full h-full grid grid-rows-2 gap-1">
        <div className="w-full h-full overflow-hidden">
           <img src={getCoverImage(images[1])} alt="Cover 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="w-full h-full overflow-hidden">
           <img src={getCoverImage(images[2])} alt="Cover 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      </div>
    </div>
  );
};

export default function PublicCollectionsDashboard({ username }) {
  const { data: collections = [], isLoading } = usePublicCollections(username);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-10 h-10 border-4 border-gray-200 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#050505] py-2 px-4 relative min-h-[500px] transition-colors">
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 transition-colors">
            <Folder size={40} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No public collections</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            This user hasn't created any public collections yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-8">
          {collections.map(col => (
            <div key={col.id} className="group relative flex flex-col">
              <Link to={`/collection/${col.id}`} className="block">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.02)] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#111] mb-3 transition-colors">
                  <CollectionThumbnail images={col.cover_images} />
                </div>
                <div className="px-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-6 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                    {col.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs font-medium">
                      {col.item_count} items
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
