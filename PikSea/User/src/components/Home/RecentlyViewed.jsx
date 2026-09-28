import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentlyViewed } from "../../utlis/recentActivity";
import useCategories from "../../utlis/Hooks/useCategories";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev";

const getPreviewImage = (item) => {
  const src =
    item?.preview_1200_url || item?.preview_600_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const RecentlyViewed = () => {
  const [items, setItems] = useState([]);
  const { data: categories = [] } = useCategories();
  
  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL"
  );

  const getLink = (item) => {
    const cat = mainCategories.find(
      (c) => Number(c.id) === Number(item.main_category_id)
    );
    return cat ? `/${cat.slug}/${item.slug}` : `/${item.content_type || 'images'}/${item.slug}`;
  };

  return (
    <section className="bg-gray-50 dark:bg-[#050505] py-12 relative overflow-hidden border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
      <div className="mx-auto px-4 lg:px-8 relative z-10">
        <div className="mb-12 text-center relative">
          <span className="inline-block rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs font-outfit font-bold text-pink-400 mb-4 uppercase tracking-widest">
            Jump Back In
          </span>
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
            Recently Viewed
          </h2>
          <p className="mt-4 text-sm md:text-base font-inter text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Pick up right where you left off. Here are the latest premium assets you've checked out.
          </p>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto snap-x pb-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={getLink(item)}
              className="group relative shrink-0 w-64 snap-start overflow-hidden rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#00D4FF]/30"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  loading="lazy"
                  src={getPreviewImage(item)}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 bg-gradient-to-t from-black/80 dark:from-[#050505] to-transparent">
                <p className="text-white text-sm font-outfit font-semibold truncate drop-shadow-md">
                  {item.title}
                </p>
                {item.is_premium && (
                   <span className="inline-block mt-1 rounded-sm bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] px-1.5 py-0.5 text-[9px] font-bold text-[#050505] uppercase tracking-wider">
                     Pro
                   </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
