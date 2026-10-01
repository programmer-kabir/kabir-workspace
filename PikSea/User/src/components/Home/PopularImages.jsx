import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Eye, Download, Heart, ArrowUpRight, Flame } from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";
import useContents from "../../utlis/Hooks/useContents";
import useCategories from "../../utlis/Hooks/useCategories";
import Skeleton from "react-loading-skeleton";
import QuickViewModal from "../Modals/QuickViewModal";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "http://localhost/PikSea_Server";

const getPreviewImage = (item) => {
  const src =
    item?.preview_600_url || item?.preview_1200_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const PopularImages = () => {
  const [quickViewItem, setQuickViewItem] = useState(null);
  const { data: infiniteData, isLoading } = useContents({ limit: 15, sort: "popular" });
  const contents = infiniteData?.pages?.flatMap((page) => page.data) ?? [];
  const { data: categories = [] } = useCategories();

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL" || c.parent_id === 0 || c.parent_id === "0"
  );

  const getLink = (item) => {
    const cat = mainCategories.find(
      (c) => Number(c.id) === Number(item.main_category_id)
    );
    return cat ? `/${cat.slug}/${item.slug}` : `/photos/${item.slug}`;
  };

  if (!isLoading && contents.length === 0) return null;

  return (
    <ScrollReveal>
      <section className="w-full bg-white dark:bg-[#05070D] py-24 relative overflow-hidden transition-colors duration-300">
        
        {/* Subtle Ambient Backing */}
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#00D4FF]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-3">
                <Flame size={14} className="text-[#00D4FF]" />
                <span>Featured Photographers</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Most Downloaded Imagery
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
                The most celebrated stock photographs downloaded by leading art directors, designers, and media publishers.
              </p>
            </div>

            <Link
              to="/search?sort=popular"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:border-[#00D4FF] hover:text-[#00D4FF] transition-all group shrink-0"
            >
              <span>View All Popular</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Dynamic Masonry Gallery: Perfectly handles Landscape, Portrait, and Square */}
          {isLoading ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5"
                  style={{ height: `${Math.floor(Math.random() * 160) + 240}px` }}
                >
                  <Skeleton height="100%" />
                </div>
              ))}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {contents.slice(0, 15).map((item) => {
                const imgSrc = getPreviewImage(item);
                const contentLink = getLink(item);

                return (
                  <div
                    key={item.id}
                    className="group relative mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0D111C] border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/50 hover:shadow-2xl hover:shadow-cyan-950/30 transition-all duration-300"
                  >
                    <Link to={contentLink} className="block relative overflow-hidden">
                      <img
                        loading="lazy"
                        src={imgSrc}
                        alt={item.title}
                        className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                        {item.is_premium ? (
                          <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                            PRO ⚡
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider">
                            FREE
                          </span>
                        )}

                        {item.orientation && (
                          <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-md text-gray-300 text-[9px] font-bold capitalize">
                            {item.orientation}
                          </span>
                        )}
                      </div>

                      {/* Bottom Gradient Overlay on Hover */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex flex-col justify-end">
                        <p className="text-white text-xs sm:text-sm font-bold line-clamp-2 drop-shadow-md">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-xs text-gray-300">
                          <span className="text-[10px] text-gray-400">PikSea Verified</span>
                          <span className="text-[10px] font-bold text-[#00D4FF] flex items-center gap-1">
                            <Download size={11} /> {item.downloads_count || 0}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Quick View Button */}
                    <button
                      onClick={() => setQuickViewItem(item)}
                      title="Quick Preview"
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-[#00D4FF] hover:text-black hover:border-transparent transition-all shadow-lg z-20 cursor-pointer"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Quick View Modal */}
        {quickViewItem && (
          <QuickViewModal
            item={quickViewItem}
            onClose={() => setQuickViewItem(null)}
          />
        )}

      </section>
    </ScrollReveal>
  );
};

export default PopularImages;