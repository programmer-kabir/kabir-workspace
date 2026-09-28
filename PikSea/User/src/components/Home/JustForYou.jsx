import ScrollReveal from "../FramerMotion/ScrollReveal";
import { Link } from "react-router-dom";
import useContents from "../../utlis/Hooks/useContents";
import useCategories from "../../utlis/Hooks/useCategories";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev";

const getPreviewImage = (item) => {
  const src =
    item?.preview_600_url || item?.preview_1200_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const JustForYou = () => {
  // Fetching a mix of content. Assuming 'limit: 12' will give enough items for a nice grid
  const { data: infiniteData, isLoading } = useContents({ limit: 12 });
  const contents = infiniteData?.pages?.flatMap((page) => page.data) ?? [];
  const { data: categories = [] } = useCategories();

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL"
  );

  // We'll just take the first 12 items (or reverse them to make it look different from Popular sections)
  const displayItems = [...contents].reverse().slice(0, 12);

  const getLink = (item) => {
    const cat = mainCategories.find(
      (c) => Number(c.id) === Number(item.main_category_id)
    );
    return cat ? `/${cat.slug}/${item.slug}` : `/${item.content_type || 'images'}/${item.slug}`;
  };

  return (
    <ScrollReveal>
      <section className="bg-gray-50 dark:bg-[#0A0A0A] py-24 relative overflow-hidden transition-colors duration-300">
        {/* Decorative Glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto px-4 lg:px-8 relative z-10">
          <div className="mb-16 text-center">
            <span className="inline-block rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 text-xs font-outfit font-bold text-[#8B5CF6] mb-6 uppercase tracking-widest">
              Curated Picks
            </span>
            <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl tracking-tight">
              Handpicked Just For You
            </h2>
            <p className="mt-6 text-lg font-inter text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover a unique collection of our best premium assets, tailored specifically for your next big project.
            </p>
          </div>

          {isLoading ? (
            <div className="columns-1 sm:columns-2 gap-6 md:columns-3 lg:columns-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-6 break-inside-avoid rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5"
                  style={{ height: `${Math.floor(Math.random() * 150) + 200}px` }}
                >
                  <Skeleton height="100%" />
                </div>
              ))}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 gap-6 md:columns-3 lg:columns-4">
              {displayItems.map((item) => (
                <Link
                  key={item.id}
                  to={getLink(item)}
                  className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#00D4FF]/30 magnetic-hover"
                >
                  {/* Overlay gradient always slightly visible at bottom */}
                  <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-white dark:from-[#050505] via-white/80 dark:via-[#050505]/80 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />

                  {/* Badges */}
                  <div className="absolute left-4 top-4 z-20 flex gap-2">
                    {item.is_premium && (
                      <span className="flex items-center gap-1 rounded-md bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] px-2.5 py-1 text-[11px] font-outfit font-semibold text-[#050505] shadow-[0_0_10px_rgba(0,212,255,0.3)] uppercase tracking-wider">
                        Pro
                      </span>
                    )}
                    <span className="rounded-md border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-outfit font-semibold text-gray-700 dark:text-gray-300 shadow-sm uppercase tracking-wider">
                      {item.content_type || 'Image'}
                    </span>
                  </div>

                  <img
                    loading="lazy"
                    decoding="async"
                    src={getPreviewImage(item)}
                    alt={item.title}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />

                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                    <p className="text-gray-900 dark:text-white text-lg font-outfit font-semibold leading-tight drop-shadow-sm dark:drop-shadow-md">
                      {item.title}
                    </p>
                    <div className="mt-4 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="text-sm font-inter text-[#0088b3] dark:text-[#00D4FF] font-medium hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                        Download Now <span className="text-lg">→</span>
                      </span>
                      <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/10 text-gray-700 dark:text-white backdrop-blur-md transition-all hover:bg-[#00D4FF] hover:border-[#00D4FF] hover:text-[#050505]">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D4FF] px-10 py-4 text-base font-outfit font-semibold text-[#050505] transition-all hover:bg-[#33DEFF] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:-translate-y-1"
            >
              Explore More Assets
            </Link>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default JustForYou;
