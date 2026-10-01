import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, X, Tag, RotateCcw, Sparkles, Filter, 
  ChevronDown, Check, Eye, Download, Heart, ArrowLeft, Layers
} from "lucide-react";
import useContents from "../../utlis/Hooks/useContents";
import useCategories from "../../utlis/Hooks/useCategories";
import DynamicSEO from "../../components/CMS/DynamicSEO";
import Masonry from "react-masonry-css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import QuickViewModal from "../../components/Modals/QuickViewModal";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getPreviewImage = (item) => {
  const src =
    item?.preview_600_url || item?.preview_1200_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const breakpointColumnsObj = {
  default: 5,
  1600: 5,
  1280: 4,
  1024: 3,
  768: 2,
  640: 1
};

export default function ContentPage({ categorySlug, subcategorySlug }) {
  const params = useParams();
  const navigate = useNavigate();
  const category = categorySlug || params.category;
  const subcategory = subcategorySlug || params.subcategory;

  // Filter States
  const [licenseType, setLicenseType] = useState("all");
  const [aiGenerated, setAiGenerated] = useState("all");
  const [orientation, setOrientation] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [quickViewItem, setQuickViewItem] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categories = [], isLoading: isCategoryLoading, isError: isCategoryError } = useCategories();

  // Find current subcategory and parent category
  const currentSubCategory = categories?.find(
    (cat) => cat.slug === subcategory && cat.parent_id !== null && cat.parent_id !== 0 && cat.parent_id !== "0"
  );
  
  const currentCategory = categories?.find(
    (cat) => Number(cat.id) === Number(currentSubCategory?.parent_id)
  ) || categories?.find(
    (cat) => cat.slug === category && (cat.parent_id === null || cat.parent_id === 0 || cat.parent_id === "0")
  );

  // Sibling subcategories for top horizontal pills
  const siblingSubcategories = useMemo(() => {
    if (!currentCategory?.id) return [];
    return categories.filter((c) => String(c.parent_id) === String(currentCategory.id));
  }, [categories, currentCategory?.id]);

  const filters = useMemo(() => {
    const f = { limit: 48 };
    if (currentSubCategory?.id) f.subcategory_id = currentSubCategory.id;
    else if (currentCategory?.id) f.category_id = currentCategory.id;
    
    if (licenseType !== "all") f.license_type = licenseType;
    if (aiGenerated !== "all") f.ai_generated = aiGenerated;
    if (orientation !== "all") f.orientation = orientation;
    if (sortBy) f.sort = sortBy;
    if (debouncedSearchQuery.trim()) f.search = debouncedSearchQuery.trim();
    return f;
  }, [currentSubCategory?.id, currentCategory?.id, licenseType, aiGenerated, orientation, sortBy, debouncedSearchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isContentLoading,
  } = useContents(filters);

  // Validate category and subcategory (only if categories were successfully loaded)
  if (!isCategoryError && categories.length > 0) {
    if (!currentSubCategory || currentCategory?.slug !== category) {
      return <Navigate to="/404" replace />;
    }
  }

  const contents = data?.pages?.flatMap(page => page.data) || [];
  const totalCount = data?.pages?.[0]?.total || 0;
  const isLoading = isContentLoading || isCategoryLoading;

  const hasActiveFilters = licenseType !== "all" || aiGenerated !== "all" || orientation !== "all" || sortBy !== "popular" || searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setLicenseType("all");
    setAiGenerated("all");
    setOrientation("all");
    setSortBy("popular");
    setSearchQuery("");
  };

  const subcategoryDisplayName = currentSubCategory?.name || subcategory?.replace(/-/g, " ") || "Collection";
  const categoryDisplayName = currentCategory?.name || category?.replace(/-/g, " ") || "Photography";

  const seoData = {
    title: `${subcategoryDisplayName} Photos | Free & Pro High-Res Stock Photography | PikSea`,
    meta_description: `Download premium and free ${subcategoryDisplayName} stock photos from PikSea. High quality royalty-free photography in ${categoryDisplayName}.`,
    canonical_url: `https://piksea.com/${category}/${subcategory}`,
    is_indexable: true
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <DynamicSEO pageData={seoData} />

      {/* ─── Top Sticky Modern Filter Header ─── */}
      <div className="sticky top-20 z-40 bg-white/95 dark:bg-[#0A0A12]/95 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 shadow-sm transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3.5 space-y-3">
          
          {/* Breadcrumb & Sibling Subcategories Navigation Strip */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none pb-1">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">
              <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link to={`/${currentCategory?.slug || category}`} className="hover:text-black dark:hover:text-white transition-colors">
                {categoryDisplayName}
              </Link>
              <span>/</span>
              <span className="text-[#00D4FF] font-bold">{subcategoryDisplayName}</span>
            </div>

            {/* Sibling Subcategory Quick Tabs */}
            {siblingSubcategories.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0 pl-4 border-l border-gray-200 dark:border-white/10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pr-1">Topics:</span>
                {siblingSubcategories.map((sub) => {
                  const isCurrent = sub.slug === subcategory;
                  return (
                    <Link
                      key={sub.id}
                      to={`/${currentCategory?.slug || category}/${sub.slug}`}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        isCurrent
                          ? "bg-[#00D4FF] text-black border-[#00D4FF] shadow-xs shadow-cyan-500/20"
                          : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-[#00D4FF]/40"
                      }`}
                    >
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            )}

          </div>

          {/* ─── Top Filter Controls Toolbar (Horizontal Full Width) ─── */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-gray-100 dark:border-white/5 text-xs">
            
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* In-Category Search */}
              <div className="flex items-center h-9 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 focus-within:border-[#00D4FF] focus-within:bg-white dark:focus-within:bg-[#12121E] transition-all min-w-[200px] max-w-[280px]">
                <Search size={14} className="text-gray-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${subcategoryDisplayName}...`}
                  className="w-full bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Orientation Filter */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold px-1.5 uppercase tracking-wider text-[10px]">Orientation:</span>
                {[
                  { id: "all", label: "Any" },
                  { id: "horizontal", label: "Landscape ▭" },
                  { id: "vertical", label: "Portrait ▯" },
                  { id: "square", label: "Square ◻" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOrientation(opt.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      orientation === opt.id
                        ? "bg-white dark:bg-[#1E1E2F] text-[#00D4FF] shadow-xs border border-gray-200 dark:border-white/10"
                        : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* License Filter */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold px-1.5 uppercase tracking-wider text-[10px]">License:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "free", label: "Free" },
                  { id: "premium", label: "Pro ⚡" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setLicenseType(opt.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      licenseType === opt.id
                        ? "bg-white dark:bg-[#1E1E2F] text-[#00D4FF] shadow-xs border border-gray-200 dark:border-white/10"
                        : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* AI Filter */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold px-1.5 uppercase tracking-wider text-[10px]">Type:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "false", label: "Camera 📷" },
                  { id: "true", label: "AI 🤖" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAiGenerated(opt.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      aiGenerated === opt.id
                        ? "bg-white dark:bg-[#1E1E2F] text-[#00D4FF] shadow-xs border border-gray-200 dark:border-white/10"
                        : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Right: Sort Dropdown & Reset */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="popular" className="dark:bg-[#151522]">Most Popular</option>
                  <option value="trending" className="dark:bg-[#151522]">Trending Now</option>
                  <option value="newest" className="dark:bg-[#151522]">Newest First</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  title="Reset all filters"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-all cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* ─── Main Gallery Content Area (Edge-to-Edge Full Width) ─── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        
        {/* Subcategory Header Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-bold mb-2 border border-[#00D4FF]/20">
              <Sparkles size={13} />
              <span>Curated Collection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              {subcategoryDisplayName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {isLoading ? "Searching high-resolution photography..." : `${totalCount.toLocaleString()} royalty-free, high-resolution stock photos available for instant download.`}
            </p>
          </div>
        </div>

        {/* Photo Grid / Masonry */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 break-inside-avoid rounded-2xl bg-gray-200 dark:bg-white/5 overflow-hidden"
                style={{ height: `${Math.floor(Math.random() * 160) + 240}px` }}
              >
                <Skeleton height="100%" />
              </div>
            ))}
          </div>
        ) : contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200 dark:border-white/5 shadow-xs">
            <div className="h-16 w-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold mb-1">No photos found in {subcategoryDisplayName}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
              Try adjusting your active orientation filters, search keyword, or explore another subcategory.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-[#00D4FF] text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all cursor-pointer"
              >
                Reset All Filters
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
              {contents.map((item) => {
                const imgSrc = getPreviewImage(item);
                const contentLink = `/${currentCategory?.slug || category}/${item.slug}`;

                return (
                  <div
                    key={item.id}
                    className="group relative mb-4 rounded-2xl overflow-hidden bg-white dark:bg-[#12121E] border border-gray-200 dark:border-white/5 hover:border-[#00D4FF]/40 hover:shadow-xl transition-all duration-300"
                  >
                    <Link to={contentLink}>
                      <div className="relative bg-gray-100 dark:bg-[#0a0a10] overflow-hidden w-full">
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

                        {/* Orientation Tag */}
                        {item.orientation && (
                          <span className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-md text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded capitalize opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.orientation}
                          </span>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
                          <p className="text-white text-xs font-bold line-clamp-2 drop-shadow-md">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Quick View Button */}
                    <button
                      onClick={() => setQuickViewItem(item)}
                      title="Quick Preview"
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-[#00D4FF] hover:text-black hover:border-transparent transition-all shadow-md z-20 cursor-pointer"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                );
              })}
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

            {/* Infinite Scroll Trigger / Load More */}
            {hasNextPage && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3.5 rounded-2xl bg-white dark:bg-[#12121E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-extrabold text-sm hover:border-[#00D4FF]/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading more photos..." : "Load More Photos ↓"}
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* Quick View Modal */}
      {quickViewItem && (
        <QuickViewModal
          item={quickViewItem}
          onClose={() => setQuickViewItem(null)}
        />
      )}

    </div>
  );
}
