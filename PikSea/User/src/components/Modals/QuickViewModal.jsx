import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ExternalLink, Download, Heart, Layers, Sparkles, User, Tag, Eye } from "lucide-react";
import { FaCrown } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getFullImage = (item) => {
  const src =
    item?.preview_1200_url || item?.preview_600_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const QuickViewModal = ({ item, isOpen, onClose, onSaveCollection }) => {
  const navigate = useNavigate();
  if (!isOpen || !item) return null;

  const category = item.category_slug || "vector";

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0E0F17] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row backdrop-blur-2xl animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-black/60 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white transition-all shadow-lg cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Left: Big Preview with ambient glow */}
        <div className="md:w-3/5 bg-gray-50 dark:bg-black/40 flex items-center justify-center p-6 relative overflow-hidden border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10">
          <div className="relative max-h-[60vh] flex items-center justify-center group">
            <img
              src={getFullImage(item)}
              alt={item.title}
              className="max-h-[55vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-gray-200 dark:border-white/5"
            />
          </div>

          {/* Badge */}
          <div className="absolute top-4 left-4">
            {item.is_premium ? (
              <span className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                <FaCrown className="text-[10px]" /> PRO ASSET
              </span>
            ) : (
              <span className="bg-emerald-500/95 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                FREE ASSET
              </span>
            )}
          </div>
        </div>

        {/* Right: Asset Details, Tags, CTA */}
        <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0088b3] dark:text-[#00D4FF] block">
                {item.content_type?.toUpperCase() || "STOCK TEMPLATE"}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1 leading-snug">
                {item.title}
              </h2>
            </div>

            {/* Publisher details */}
            <div className="flex items-center gap-3 py-2 border-y border-gray-200 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#6C4FE0] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  PikSea Studio
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Verified Original Asset</p>
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase">Format</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.file_type?.toUpperCase() || 'ZIP / Vector'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase">License</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Commercial Standard</span>
              </div>
            </div>

            {/* Tags preview */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                  <Tag size={12} /> Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 6).map((t, idx) => (
                    <span key={idx} className="text-[11px] px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                      #{typeof t === 'string' ? t : t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Link
              to={`/${category}/${item.slug}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#6C4FE0] hover:from-[#33DEFF] hover:to-[#7E64E8] text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
              onClick={onClose}
            >
              <Download size={16} />
              View Full Details & Download
            </Link>

            <div className="flex gap-2">
              {onSaveCollection && (
                <button
                  onClick={() => {
                    onSaveCollection(item);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Heart size={14} className="text-rose-500" />
                  Save to Collection
                </button>
              )}
              
              <Link
                to={`/${category}/${item.slug}`}
                onClick={onClose}
                className="flex items-center justify-center p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Open asset page"
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
