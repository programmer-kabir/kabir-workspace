import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCrown } from "react-icons/fa";
import { Eye, Heart, Download, Sparkles } from "lucide-react";
import QuickViewModal from "../Modals/QuickViewModal";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getPreviewImage = (item) => {
  const src =
    item?.preview_1200_url || item?.preview_600_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

export default function ContentCard({ data, onSaveCollection }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const navigate = useNavigate();

  if (!data) return null;
  const category = data.category_slug || "explore"; 

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSaveCollection) {
      onSaveCollection(data);
    } else {
      navigate(`/${category}/${data.slug}`);
    }
  };

  return (
    <>
      <div className="group relative block w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-[#121218] border border-gray-200 dark:border-white/5 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
        <Link to={`/${category}/${data.slug}`} className="block relative">
          <img
            src={getPreviewImage(data)}
            alt={data?.title || "Stock image"}
            className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Badge */}
          {data?.is_premium ? (
            <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg z-10">
              <FaCrown className="text-[9px]" /> PRO
            </span>
          ) : (
            <span className="absolute top-2.5 left-2.5 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg z-10">
              FREE
            </span>
          )}

          {/* Top-Right Quick Action Hover Buttons */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-4px] group-hover:translate-y-0 z-20">
            <button
              onClick={handleQuickView}
              className="p-2 rounded-full bg-black/70 hover:bg-[#00D4FF] hover:text-black border border-white/20 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110"
              title="Quick Preview"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 rounded-full bg-black/70 hover:bg-rose-500 border border-white/20 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110"
              title="Save to Collection"
            >
              <Heart size={14} />
            </button>
          </div>

          {/* Bottom Sleek Hover Dock */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3.5 pt-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10 flex flex-col justify-end">
            <p className="text-xs font-semibold text-white line-clamp-1 drop-shadow-md">
              {data?.title}
            </p>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10 text-[11px] text-gray-300">
              <span className="capitalize text-gray-300">{data?.content_type || 'Vector'}</span>
              <span className="text-[#00D4FF] font-semibold flex items-center gap-1">
                <Download size={11} /> Download
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        item={data}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onSaveCollection={onSaveCollection}
      />
    </>
  );
}
