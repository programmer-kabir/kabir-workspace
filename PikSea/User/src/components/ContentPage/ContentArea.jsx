import { useRef, useState, useEffect } from "react";
import {
  FiSearch,
  FiImage,
  FiGrid,
  FiList,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { X, Eye, Heart, Download } from "lucide-react";
import { FaCrown } from "react-icons/fa";
import Masonry from "react-masonry-css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import QuickViewModal from "../Modals/QuickViewModal";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.piksea.com";

const getPreviewImage = (item) => {
  const src =
    item?.preview_600_url || item?.preview_1200_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const breakpointColumnsObj = {
  default: 5,
  1536: 4,
  1280: 3,
  640: 1
};

export default function ContentArea({
  category,
  subcategory,
  contents,
  totalCount,
  currentSubCategory,
  currentCategory,
  isLoading,
  searchQuery,
  setSearchQuery,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("Most Relevant");
  const [quickViewItem, setQuickViewItem] = useState(null);
  const scrollRef = useRef(null);

  const subcategoryName =
    currentSubCategory?.name ||
    subcategory?.replace(/-/g, " ") ||
    category?.replace(/-/g, " ") ||
    "Content";

  const categoryName =
    currentCategory?.name ||
    category?.charAt(0).toUpperCase() + category?.slice(1) ||
    "Category";

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Build tag chips sorted by frequency from currently rendered contents
  const tagCounts = {};
  const tagMap = {};

  contents.forEach((c) => {
    (c.tags || []).forEach((t) => {
      tagCounts[t.id] = (tagCounts[t.id] || 0) + 1;
      if (!tagMap[t.id]) {
        tagMap[t.id] = t;
      }
    });
  });

  const allTags = Object.values(tagMap)
    .sort((a, b) => {
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        if (a.name.toLowerCase() === sq) return -1;
        if (b.name.toLowerCase() === sq) return 1;
      }
      return tagCounts[b.id] - tagCounts[a.id];
    })
    .slice(0, 20);

  const checkTagScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const canScroll = el.scrollWidth > el.clientWidth + 5;
    setShowLeftArrow(canScroll && el.scrollLeft > 5);
    setShowRightArrow(
      canScroll && el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkTagScroll();
    el.addEventListener("scroll", checkTagScroll);
    window.addEventListener("resize", checkTagScroll);
    return () => {
      el.removeEventListener("scroll", checkTagScroll);
      window.removeEventListener("resize", checkTagScroll);
    };
  }, [allTags.length]);

  const scrollTags = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const handleTagClick = (tagName) => {
    setSearchQuery(tagName);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };



  return (
    <main className="min-w-0 flex-1 bg-gray-50 dark:bg-[#050505] px-4 py-4 md:px-6 border-l border-gray-200 dark:border-white/5 transition-colors">
      {/* Search Area */}
      <div className="flex gap-2">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 shadow-sm"
          >
            <FiSliders className="text-lg" />
          </button>
        )}
        <div className="flex h-[48px] flex-1 overflow-hidden rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shadow-sm focus-within:border-[#00D4FF]/50 transition-colors">
          <button className="hidden w-[160px] shrink-0 items-center justify-between border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] px-4 text-sm font-semibold capitalize text-gray-700 dark:text-gray-300 sm:flex">
            <span className="truncate">{categoryName}</span>
            <FiChevronDown className="shrink-0 text-lg" />
          </button>

          <div className="flex flex-1 items-center gap-1 px-2 sm:gap-2 sm:px-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search in ${subcategoryName}...`}
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
            }}
            className="flex w-12 items-center justify-center bg-[#00D4FF] text-[#050505] hover:bg-[#33DEFF] sm:w-14"
          >
            <FiSearch className="text-[20px] sm:text-[25px]" />
          </button>

          <button className="mr-2 hidden w-12 items-center justify-center border-l border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 sm:flex bg-white dark:bg-[#111]">
            <FiImage className="text-[24px]" />
          </button>
        </div>
      </div>

      {/* Heading + view options */}
      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[21px] font-bold text-gray-900 dark:text-white capitalize font-outfit">
            {subcategoryName}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery ? (
              <>
                Showing{" "}
                <span className="font-semibold text-[#00D4FF]">
                  {contents.length}
                </span>{" "}
                results for "{searchQuery}" out of {totalCount} total
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-900 dark:text-gray-200">
                  {totalCount}
                </span>{" "}
                royalty free {subcategoryName.toLowerCase()} resources
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-sm">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`flex h-11 w-11 items-center justify-center transition-colors ${view === "grid"
                ? "bg-[#00D4FF]/10 text-[#0088b3] dark:text-[#00D4FF]"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              <FiGrid className="text-xl" />
            </button>

            <button
              onClick={() => setView("list")}
              title="List view"
              className={`flex h-11 w-11 items-center justify-center transition-colors border-l border-gray-200 dark:border-white/10 ${view === "list"
                ? "bg-[#00D4FF]/10 text-[#0088b3] dark:text-[#00D4FF]"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              <FiList className="text-xl" />
            </button>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-11 min-w-[160px] appearance-none rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] px-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-[#00D4FF]/50 transition-colors shadow-sm"
            >
              <option>Most Relevant</option>
              <option>Most Popular</option>
              <option>Newest</option>
              <option>Best Selling</option>
            </select>
            <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500" />
          </div>
        </div>
      </div>

      {/* Dynamic Tag chips from content tags */}
      {allTags.length > 0 && (
        <div className="relative mt-6 border-y border-gray-200 dark:border-white/5 py-4">
          {showLeftArrow && (
            <>
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-gray-50 dark:from-[#050505] via-gray-50/90 dark:via-[#050505]/90 to-transparent" />
              <button
                onClick={() => scrollTags("left")}
                className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 shadow-md transition hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
              >
                <FiChevronLeft className="text-[18px]" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className={`no-scrollbar flex gap-2 overflow-x-auto scroll-smooth ${showLeftArrow ? "pl-12" : "pl-0"
              } ${showRightArrow ? "pr-12" : "pr-0"}`}
          >
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.name)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 ${searchQuery === tag.name
                  ? "border-[#00D4FF]/50 bg-[#00D4FF]/10 text-[#0088b3] dark:text-[#00D4FF]"
                  : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF]/30 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white shadow-sm"
                  }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {showRightArrow && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-gray-50 dark:from-[#050505] via-gray-50/90 dark:via-[#050505]/90 to-transparent" />
              <button
                onClick={() => scrollTags("right")}
                className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 shadow-md transition hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
              >
                <FiChevronRight className="text-[18px]" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Content Grid / List */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[1.25/1] rounded-lg overflow-hidden">
              <Skeleton height="100%" />
            </div>
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FiSearch className="text-5xl text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "No content found"}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-500 max-w-xs">
            {searchQuery
              ? "Try a different keyword or clear the filter"
              : "This subcategory has no published content yet"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-5 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white text-sm font-semibold hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid mt-6"
          columnClassName="my-masonry-grid_column"
        >
          {contents.map((item, index) => (
            <div
              key={item.id || index}
              className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-[#111] border border-gray-200 dark:border-white/5 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <Link to={`/${category}/${item.slug}`} className="block relative">
                <img
                  loading="lazy"
                  decoding="async"
                  src={getPreviewImage(item)}
                  alt={item?.title || "Stock image"}
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />

                {/* Badge */}
                {item?.is_premium ? (
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg z-10">
                    <FaCrown className="text-[9px]" /> PRO
                  </span>
                ) : (
                  <span className="absolute top-2.5 left-2.5 bg-[#050505]/80 backdrop-blur-md border border-white/10 text-gray-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg z-10">
                    FREE
                  </span>
                )}

                {/* Top-Right Quick Action Hover Buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-4px] group-hover:translate-y-0 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuickViewItem(item);
                    }}
                    className="p-2 rounded-full bg-black/70 hover:bg-[#00D4FF] hover:text-black border border-white/20 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 cursor-pointer"
                    title="Quick Preview"
                  >
                    <Eye size={13} />
                  </button>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3.5 pt-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                  <p className="text-xs font-semibold text-white line-clamp-1 drop-shadow-md">
                    {item?.title}
                  </p>
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10 text-[11px] text-gray-300">
                    <span className="capitalize text-gray-300">{item?.content_type || 'Photo'}</span>
                    <span className="text-[#00D4FF] font-semibold flex items-center gap-1">
                      <Download size={11} /> Download
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </Masonry>
      ) : (
        <div className="mt-6 space-y-3">
          {contents.map((item, index) => (
            <Link
              to={`/${category}/${item.slug}`}
              key={item.id || index}
              className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111] p-3 hover:border-[#00D4FF]/30 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all shadow-sm"
            >
              <img
                loading="lazy"
                decoding="async"
                src={getPreviewImage(item)}
                alt={item?.title || "Stock image"}
                className="h-20 w-32 rounded-lg object-cover bg-gray-100 dark:bg-[#050505] shrink-0"
              />

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-200 line-clamp-2">
                  {item?.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {item?.content_type?.toUpperCase()} •{" "}
                  {item?.is_premium ? (
                    <span className="text-[#8B5CF6] font-semibold">Pro</span>
                  ) : (
                    <span className="text-[#00D4FF] font-semibold">Free</span>
                  )}{" "}
                  • {item?.license_type} license
                </p>
                {item?.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.slice(0, 5).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setSearchQuery(tag.name);
                        }}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-[#00D4FF]/10 hover:text-[#0088b3] dark:hover:text-[#00D4FF] transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side info */}
              <div className="shrink-0 text-right">
                {item?.width && item?.height && (
                  <p className="text-xs text-gray-500">
                    {item.width} × {item.height}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {item?.file_type?.toUpperCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="mt-12 flex justify-center pb-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-xl bg-[#00D4FF] hover:bg-[#33DEFF] text-[#050505] px-8 py-3 text-sm font-semibold transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] disabled:opacity-50 cursor-pointer"
          >
            {isFetchingNextPage ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#050505] inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading more...
              </>
            ) : (
              "Load More Content"
            )}
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        item={quickViewItem}
        isOpen={!!quickViewItem}
        onClose={() => setQuickViewItem(null)}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .my-masonry-grid {
          display: -webkit-box; /* Not needed if autoprefixing */
          display: -ms-flexbox; /* Not needed if autoprefixing */
          display: flex;
          margin-left: -16px; /* gutter size offset */
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 16px; /* gutter size */
          background-clip: padding-box;
        }
      `}</style>
    </main>
  );
}
