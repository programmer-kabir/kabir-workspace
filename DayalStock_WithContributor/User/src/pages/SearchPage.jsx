import { useSearchParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Search, X, Tag } from "lucide-react";
import useContents from "../utlis/Hooks/useContents";
import useCategories from "../utlis/Hooks/useCategories";
import Masonry from "react-masonry-css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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

  const [inputValue, setInputValue] = useState(query);

  const { data: categories = [] } = useCategories();

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL"
  );

  const categoryId = categorySlug !== "all"
    ? mainCategories.find((c) => c.slug === categorySlug)?.id
    : null;

  const queryFilters = { limit: 48 };
  if (query.trim()) queryFilters.search = query.trim();
  if (categoryId) queryFilters.category_id = categoryId;

  const { data: infiniteData, isLoading } = useContents(queryFilters);
  const filtered = infiniteData?.pages?.flatMap((page) => page.data) ?? [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const params = new URLSearchParams();
    params.set("q", inputValue.trim());
    if (categorySlug !== "all") params.set("category", categorySlug);
    setSearchParams(params);
  };

  const handleCategoryChange = (slug) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (slug !== "all") params.set("category", slug);
    setSearchParams(params);
  };

  const handleTagClick = (tagName) => {
    const params = new URLSearchParams();
    params.set("q", tagName);
    if (categorySlug !== "all") params.set("category", categorySlug);
    setSearchParams(params);
    setInputValue(tagName);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] transition-colors duration-300">
      {/* Search Header Bar */}
      <div className="bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-white/10 sticky top-0 z-30 shadow-sm pt-20 transition-colors duration-300">
        <div className="
         mx-auto px-4 py-4 lg:px-8">
          <form onSubmit={handleSearch} className="flex gap-3 items-center">
            <select
              value={categorySlug}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-12 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 text-sm font-medium text-gray-900 dark:text-gray-300 outline-none focus:border-[#00D4FF]/50 shrink-0 transition-colors"
            >
              <option value="all">All Categories</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="flex flex-1 items-center h-12 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] overflow-hidden focus-within:border-[#00D4FF]/50 transition-colors">
              <Search size={18} className="ml-4 text-gray-400 shrink-0" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search for vectors, photos, graphics..."
                className="flex-1 h-full bg-transparent px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    const params = new URLSearchParams();
                    if (categorySlug !== "all")
                      params.set("category", categorySlug);
                    setSearchParams(params);
                  }}
                  className="px-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="h-12 px-6 bg-[#00D4FF] hover:bg-[#33DEFF] text-[#050505] text-sm font-bold transition-colors rounded-lg"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto px-4 py-8 lg:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
              {query ? `Results for "${query}"` : "Explore All Contents"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
              {isLoading ? "Searching..." : `${filtered.length} results found`}
            </p>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${categorySlug === "all"
              ? "bg-[#00D4FF]/10 border-[#00D4FF]/50 text-[#00D4FF]"
              : "bg-white dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF]/50 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
              }`}
          >
            All
          </button>
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${categorySlug === cat.slug
                ? "bg-[#00D4FF]/10 border-[#00D4FF]/50 text-[#00D4FF]"
                : "bg-white dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF]/50 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 break-inside-avoid rounded-xl bg-gray-100 dark:bg-[#111] overflow-hidden"
                style={{ height: `${Math.floor(Math.random() * 150) + 200}px` }}
              >
                <Skeleton height="100%" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search size={48} className="text-gray-300 dark:text-gray-700 mb-4 transition-colors" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-300 mb-2 transition-colors">
              No results found
            </h3>
            <p className="text-gray-500 text-sm max-w-xs transition-colors">
              Try different keywords or remove the category filter
            </p>
          </div>
        ) : (
          <>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {filtered.map((item) => (
                <SearchCard
                  key={item.id}
                  item={item}
                  query={query}
                  onTagClick={handleTagClick}
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

function SearchCard({ item, query, onTagClick, mainCategories }) {
  const [hovered, setHovered] = useState(false);
  const imgSrc = getPreviewImage(item);

  const cat = mainCategories.find(
    (c) => Number(c.id) === Number(item.main_category_id)
  );
  const contentLink = cat
    ? `/${cat.slug}/${item.slug}`
    : `/${item.content_type || 'images'}/${item.slug}`;

  const matchedTags = query
    ? item.tags?.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase())
    )
    : [];

  return (
    <div
      className="group relative mb-4 rounded-xl overflow-hidden bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 hover:border-[#00D4FF]/30 hover:shadow-md transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={contentLink}>
        <div className="relative bg-gray-100 dark:bg-[#050505] overflow-hidden w-full transition-colors">
          <img
            loading="lazy"
            decoding="async"
            src={imgSrc}
            alt={item.title}
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />

          {item.is_premium ? (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
              PRO
            </span>
          ) : (
            <span className="absolute top-2 left-2 bg-[#050505]/80 backdrop-blur-md border border-white/10 text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
              FREE
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0">
            <p className="text-white text-xs font-semibold line-clamp-2">
              {item.title}
            </p>
          </div>
        </div>
      </Link>

      {hovered && matchedTags.length > 0 && (
        <div className="px-3 py-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-[#111] border-t border-gray-200 dark:border-white/10 transition-colors">
          {matchedTags.slice(0, 3).map((tag) => (
            <button
              key={tag.id}
              onClick={(e) => {
                e.preventDefault();
                onTagClick(tag.name);
              }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-400 hover:bg-[#00D4FF]/10 hover:text-[#0088b3] dark:hover:text-[#00D4FF] transition-colors"
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
