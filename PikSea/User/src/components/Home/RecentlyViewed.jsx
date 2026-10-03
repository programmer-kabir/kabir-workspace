import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Clock, Trash2, ArrowUpRight } from "lucide-react";
import { getRecentlyViewed } from "../../utlis/recentActivity";
import useCategories from "../../utlis/Hooks/useCategories";
import QuickViewModal from "../Modals/QuickViewModal";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.piksea.com";

const getPreviewImage = (item) => {
  const src =
    item?.preview_1200_url || item?.preview_600_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const RecentlyViewed = () => {
  const [items, setItems] = useState([]);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  const handleClear = () => {
    localStorage.removeItem("piksea_recently_viewed");
    localStorage.removeItem("recently_viewed_contents");
    setItems([]);
  };

  if (items.length === 0) return null;

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL" || c.parent_id === 0 || c.parent_id === "0"
  );

  const getLink = (item) => {
    const cat = mainCategories.find(
      (c) => Number(c.id) === Number(item.main_category_id)
    );
    return cat ? `/${cat.slug}/${item.slug}` : `/photos/${item.slug}`;
  };

  return (
    <section className="w-full bg-gray-50 dark:bg-[#06080F] py-14 border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[#00D4FF]">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Recently Viewed Photos
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pick up right where you left off in your creative workflow
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1">
          {items.map((item) => {
            const imgSrc = getPreviewImage(item);
            const contentLink = getLink(item);

            return (
              <div
                key={item.id}
                className="group relative shrink-0 w-56 sm:w-64 rounded-2xl overflow-hidden bg-white dark:bg-[#0D111C] border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <Link to={contentLink} className="block relative aspect-[4/3] overflow-hidden">
                  <img
                    loading="lazy"
                    src={imgSrc}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {item.is_premium ? (
                      <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                        PRO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs font-bold truncate drop-shadow-sm">
                      {item.title}
                    </p>
                  </div>
                </Link>

                {/* Quick View Button */}
                <button
                  onClick={() => setQuickViewItem(item)}
                  title="Quick Preview"
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-[#00D4FF] hover:text-black transition-all z-20 cursor-pointer"
                >
                  <Eye size={13} />
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* Quick View Modal */}
      {quickViewItem && (
        <QuickViewModal
          item={quickViewItem}
          onClose={() => setQuickViewItem(null)}
        />
      )}
    </section>
  );
};

export default RecentlyViewed;
