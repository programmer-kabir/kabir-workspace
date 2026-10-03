import { useSearchParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { 
  Search, X, Tag, SlidersHorizontal, Sparkles, 
  RotateCcw, Image as ImageIcon, ChevronDown, Check
} from "lucide-react";
import useContents from "../utlis/Hooks/useContents";
import useCategories from "../utlis/Hooks/useCategories";
import Masonry from "react-masonry-css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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
  1536: 5,
  1280: 4,
  1024: 3,
  768: 2,
  640: 1
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "all";
  const subcategorySlug = searchParams.get("sub") || "all";
  const orientation = searchParams.get("orientation") || "all";
  const licenseType = searchParams.get("license") || "all";
  const sortBy = searchParams.get("sort") || "popular";

  const [inputValue, setInputValue] = useState(query);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const { data: categories = [] } = useCategories();

  // Separate Parent & Subcategories
  const mainCategories = useMemo(() => {
    return categories.filter((c) => c.parent_id === null || c.parent_id === 0 || c.parent_id === "0" || c.parent_id === "NULL");
  }, [categories]);

  const currentCategory = useMemo(() => {
    return categorySlug !== "all" ? mainCategories.find((c) => c.slug === categorySlug) : null;
  }, [mainCategories, categorySlug]);

  // Subcategories for selected main category
  const availableSubcategories = useMemo(() => {
    if (!currentCategory) return [];
    return categories.filter((c) => String(c.parent_id) === String(currentCategory.id));
  }, [categories, currentCategory]);

  const currentSubcategory = useMemo(() => {
    return subcategorySlug !== "all" ? availableSubcategories.find((c) => c.slug === subcategorySlug) : null;
  }, [availableSubcategories, subcategorySlug]);

  // Query Filters for TanStack Query
  const queryFilters = useMemo(() => {
    const filters = { limit: 48 };
    if (query.trim()) filters.search = query.trim();
    if (currentCategory?.id) filters.category_id = currentCategory.id;
    if (currentSubcategory?.id) filters.subcategory_id = currentSubcategory.id;
    if (orientation !== "all") filters.orientation = orientation;
    if (licenseType !== "all") filters.license_type = licenseType;
    if (sortBy) filters.sort = sortBy;
    return filters;
  }, [query, currentCategory?.id, currentSubcategory?.id, orientation, licenseType, sortBy]);

  const { data: infiniteData, isLoading } = useContents(queryFilters);
  const filtered = infiniteData?.pages?.flatMap((page) => page.data) ?? [];
  const totalCount = infiniteData?.pages?.[0]?.total || 0;

  // Helper to update specific param while keeping others
  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // If category changed, reset subcategory
    if (key === "category") {
      params.delete("sub");
    }
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (inputValue.trim()) {
      params.set("q", inputValue.trim());
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  const handleClearAllFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    setSearchParams(params);
    setInputValue(query);
  };

  const hasActiveFilters = categorySlug !== "all" || subcategorySlug !== "all" || orientation !== "all" || licenseType !== "all" || sortBy !== "popular";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* ─── Search & Category Header ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0D0D15] border-b border-gray-200 dark:border-white/10 sticky top-0 z-30 shadow-sm pt-20 transition-colors">
        <div className="mx-auto px-4 lg:px-8 py-4 space-y-3">
          
          {/* Main Search Input & Category Dropdown */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 items-center">
            
            {/* Category Select */}
            <select
              value={categorySlug}
              onChange={(e) => updateParam("category", e.target.value)}
              className="w-full sm:w-auto h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151522] px-3.5 text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-200 outline-none focus:border-[#00D4FF] shrink-0 transition-colors cursor-pointer"
            >
              <option value="all">All Photography Genres</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Keyword Input */}
            <div className="flex flex-1 w-full items-center h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151522] overflow-hidden focus-within:border-[#00D4FF] focus-within:ring-2 focus-within:ring-[#00D4FF]/10 transition-all">
              <Search size={18} className="ml-4 text-gray-400 shrink-0" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search high-res stock photos, wallpapers, nature, portraits..."
                className="flex-1 h-full bg-transparent px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none font-medium"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    updateParam("q", "");
                  }}
                  className="px-3 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-[#00D4FF] to-cyan-500 hover:opacity-95 text-black text-sm font-extrabold transition-all rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* ─── Unsplash-style Horizontal Subcategory Pills (If Category Selected) ─── */}
          {availableSubcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none pt-1">
              <button
                onClick={() => updateParam("sub", "all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                  subcategorySlug === "all"
                    ? "bg-[#00D4FF] text-black border-[#00D4FF] shadow-sm shadow-[#00D4FF]/30"
                    : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF]/50"
                }`}
              >
                All {currentCategory.name}
              </button>
              {availableSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => updateParam("sub", sub.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                    subcategorySlug === sub.slug
                      ? "bg-[#00D4FF] text-black border-[#00D4FF] shadow-sm shadow-[#00D4FF]/30"
                      : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF]/50 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* ─── Unsplash Multi-Facet Filter Bar (Orientation, License, Sort) ─── */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/5 overflow-x-auto pb-1 text-xs">
            
            <div className="flex items-center gap-4 flex-wrap">
              
              {/* Orientation Filter */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold px-2 uppercase tracking-wider text-[10px]">Orientation:</span>
                {[
                  { id: "all", label: "Any" },
                  { id: "landscape", label: "Landscape ▭" },
                  { id: "portrait", label: "Portrait ▯" },
                  { id: "square", label: "Square ◻" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateParam("orientation", opt.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      orientation === opt.id
                        ? "bg-white dark:bg-[#1E1E2F] text-[#00D4FF] shadow-sm border border-gray-200 dark:border-white/10"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* License / Pricing Filter */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold px-2 uppercase tracking-wider text-[10px]">License:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "free", label: "Free" },
                  { id: "premium", label: "Pro ⚡" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateParam("license", opt.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      licenseType === opt.id
                        ? "bg-white dark:bg-[#1E1E2F] text-[#00D4FF] shadow-sm border border-gray-200 dark:border-white/10"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Right: Sort By & Reset */}
            <div className="flex items-center gap-2 shrink-0">
              
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => updateParam("sort", e.target.value)}
                  className="bg-transparent text-gray-900 dark:text-white font-bold outline-none cursor-pointer"
                >
                  <option value="popular" className="dark:bg-[#151522]">Most Popular</option>
                  <option value="trending" className="dark:bg-[#151522]">Trending Now</option>
                  <option value="newest" className="dark:bg-[#151522]">Newest First</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  title="Reset all filters"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-all cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* ─── Gallery Content Section ────────────────────────────────────────── */}
      <div className="mx-auto px-4 lg:px-8 py-8">
        
        {/* Title & Count Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-200 dark:border-white/5 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {query
                ? `Results for "${query}"`
                : currentSubcategory
                ? `${currentSubcategory.name} Photos`
                : currentCategory
                ? `${currentCategory.name} Photography`
                : "Explore High-Res Stock Photos"}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? "Searching photo library..." : `${totalCount.toLocaleString()} high-resolution photos available`}
            </p>
          </div>
        </div>

        {/* ─── Photo Grid / Masonry ────────────────────────────────────────── */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 break-inside-avoid rounded-2xl bg-gray-200 dark:bg-white/5 overflow-hidden"
                style={{ height: `${Math.floor(Math.random() * 160) + 220}px` }}
              >
                <Skeleton height="100%" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold mb-1">
              No matching photos found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
              Try adjusting your search keywords, clearing orientation filters, or exploring another category.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="px-5 py-2.5 rounded-xl bg-[#00D4FF] text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {filtered.map((item) => (
                <PhotoCard
                  key={item.id}
                  item={item}
                  query={query}
                  onTagClick={(tag) => {
                    updateParam("q", tag);
                    setInputValue(tag);
                  }}
                  mainCategories={mainCategories}
                />
              ))}
            </Masonry>
            <style>{`
              .my-masonry-grid {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                margin-left: -16px;
                width: auto;
              }
              .my-masonry-grid_column {
                padding-left: 16px;
                background-clip: padding-box;
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}

function PhotoCard({ item, query, onTagClick, mainCategories }) {
  const [hovered, setHovered] = useState(false);
  const imgSrc = getPreviewImage(item);

  const cat = mainCategories.find(
    (c) => Number(c.id) === Number(item.main_category_id)
  );
  const contentLink = cat
    ? `/${cat.slug}/${item.slug}`
    : `/${item.content_type || 'photos'}/${item.slug}`;

  const matchedTags = query
    ? item.tags?.filter((t) =>
        t.name?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div
      className="group relative mb-4 rounded-2xl overflow-hidden bg-white dark:bg-[#12121E] border border-gray-200 dark:border-white/5 hover:border-[#00D4FF]/40 hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={contentLink}>
        <div className="relative bg-gray-100 dark:bg-[#0a0a10] overflow-hidden w-full transition-colors">
          <img
            loading="lazy"
            decoding="async"
            src={imgSrc}
            alt={item.title}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder.jpg";
            }}
          />

          {/* Badge: PRO or FREE */}
          {item.is_premium ? (
            <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-black text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-md z-10 uppercase tracking-wider">
              PRO
            </span>
          ) : (
            <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md z-10 uppercase tracking-wider">
              FREE
            </span>
          )}

          {/* Orientation Label Pill (Subtle on hover) */}
          {item.orientation && (
            <span className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-md text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded capitalize opacity-0 group-hover:opacity-100 transition-opacity">
              {item.orientation}
            </span>
          )}

          {/* Dark gradient bottom overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
            <p className="text-white text-xs font-bold line-clamp-2 drop-shadow-md">
              {item.title}
            </p>
          </div>
        </div>
      </Link>

      {/* Hover Tag Bar */}
      {hovered && matchedTags.length > 0 && (
        <div className="px-3 py-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-[#151522] border-t border-gray-200 dark:border-white/10 transition-colors">
          {matchedTags.slice(0, 3).map((tag) => (
            <button
              key={tag.id}
              onClick={(e) => {
                e.preventDefault();
                onTagClick(tag.name);
              }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#00D4FF]/10 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-colors cursor-pointer"
            >
              <Tag size={9} />
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
