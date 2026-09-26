import ScrollReveal from "../FramerMotion/ScrollReveal";
import { Search, ChevronDown, ImagePlus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCategories from "../../utlis/Hooks/useCategories";
import useSiteSettings from "../../utlis/Hooks/useSiteSettings";
import { saveToRecentSearches } from "../../utlis/recentActivity";

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: settings = {} } = useSiteSettings();

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL"
  );

  const selectedMainCatId =
    selectedCategory === "all"
      ? null
      : mainCategories.find((c) => c.slug === selectedCategory)?.id;

  const suggestions = searchQuery.trim()
    ? categories
        .filter((c) => c.parent_id !== null && c.parent_id !== "NULL")
        .filter((c) =>
          selectedMainCatId
            ? Number(c.parent_id) === Number(selectedMainCatId)
            : true
        )
        .filter((c) =>
          c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
        .slice(0, 6)
    : [];

  const selectedCatLabel =
    mainCategories.find((c) => c.slug === selectedCategory)?.name || "All Resources";

  const popularTags = settings?.popular_tags || [
    "Abstract",
    "Technology",
    "Neon",
    "Futuristic",
    "Backgrounds",
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    saveToRecentSearches(searchQuery.trim());
    const params = new URLSearchParams();
    params.set("q", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  const handleTagClick = (tag) => {
    saveToRecentSearches(tag);
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setIsCategoryOpen(false);
  };

  const handleSuggestionClick = (sub) => {
    const parent = categories.find((c) => Number(c.id) === Number(sub.parent_id));
    if (parent) {
      navigate(`/${parent.slug}/${sub.slug}`);
    }
  };

  return (
    <ScrollReveal className="relative z-50">
      <section className="relative flex min-h-[600px] xl:min-h-[700px] w-full items-center justify-center bg-gray-50 dark:bg-[#050505] pt-20 transition-colors duration-300">
        
        {/* Background Wrapper (overflow-hidden to contain blur without clipping dropdowns) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid Background Pattern (Premium feel for light mode) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:opacity-10" />

          {/* Dynamic Background Gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[#00D4FF]/20 dark:bg-[#00D4FF]/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-[#8B5CF6]/20 dark:bg-[#8B5CF6]/10 blur-[120px]" />
          
          {/* Optional: Darkened Background Image */}
          {settings?.hero_bg_image && (
            <div 
              className="absolute inset-0 opacity-15 dark:opacity-10 mix-blend-overlay dark:mix-blend-luminosity bg-cover bg-center"
              style={{ backgroundImage: `url(https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/${settings.hero_bg_image})` }}
            />
          )}
          
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
        </div>
      
        <div className="relative mx-auto flex w-full max-w-[1400px] flex-col px-4 py-20 text-center items-center z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* Highlight Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-sm font-inter text-gray-700 dark:text-gray-300">Discover premium design assets</span>
          </div>

          {/* Title */}
          <h1 className="max-w-4xl text-5xl font-outfit font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-7xl leading-tight">
            {settings?.hero_title || "Design Without Limits."} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6]">
              {settings?.hero_highlight_text || "World-class"}
            </span> {settings?.hero_subtitle || "stock media."}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-lg font-inter text-gray-600 dark:text-gray-400 md:text-xl">
            {settings?.hero_description || "Download millions of premium vectors, photos, and UI assets to build your next big idea faster."}
          </p>

          {/* Search Area */}
          <form
            onSubmit={handleSearch}
            className="mt-12 flex w-full max-w-4xl flex-col gap-4 md:flex-row items-center justify-center relative z-50"
          >
            {/* Search Box Wrapper */}
            <div className="relative flex flex-1 flex-col w-full max-w-3xl">
              <div className="flex h-[72px] w-full rounded-2xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] focus-within:ring-1 focus-within:ring-[#00D4FF]/50 focus-within:border-[#00D4FF]/50 dark:focus-within:bg-white/5 transition-all duration-300">
                
                {/* Category Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="flex h-full w-[110px] md:w-[160px] items-center justify-between border-r border-gray-200 dark:border-white/10 px-3 md:px-6 font-outfit font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-l-2xl"
                  >
                    <span className="truncate text-sm">{selectedCatLabel}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-500 transition-transform duration-300 ${isCategoryOpen ? "rotate-180 text-[#00D4FF]" : ""}`}
                    />
                  </button>

                  {isCategoryOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button
                        type="button"
                        onClick={() => handleCategorySelect("all")}
                        className={`w-full px-5 py-3 text-left text-sm font-outfit font-medium transition-colors ${
                          selectedCategory === "all"
                            ? "text-[#00D4FF] bg-gray-50 dark:bg-white/5"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        All Resources
                      </button>
                      {mainCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.slug)}
                          className={`w-full px-5 py-3 text-left text-sm font-outfit font-medium transition-colors ${
                            selectedCategory === cat.slug
                              ? "text-[#00D4FF] bg-gray-50 dark:bg-white/5"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex flex-1 items-center px-3 md:px-6 min-w-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search premium assets..."
                    className="w-full bg-transparent outline-none text-sm md:text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 font-inter truncate"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center px-4 md:px-8 my-2 mr-2 text-[#050505] font-semibold bg-[#00D4FF] hover:bg-[#33DEFF] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 rounded-xl"
                >
                  <Search size={20} className="md:mr-2" />
                  <span className="font-outfit text-base hidden md:block">Search</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {searchQuery.trim() && suggestions.length > 0 && (
                <div className="absolute left-0 top-[80px] z-50 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl animate-in fade-in">
                  {suggestions.map((sub) => {
                    const parent = categories.find(
                      (c) => Number(c.id) === Number(sub.parent_id)
                    );
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSuggestionClick(sub)}
                        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0"
                      >
                        <Search size={16} className="text-[#00D4FF]" />
                        <div>
                          <span className="font-outfit font-medium text-gray-900 dark:text-gray-200">
                            {sub.name}
                          </span>
                          {parent && (
                            <span className="ml-2 text-xs font-inter text-gray-500">
                              in {parent.name}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 max-w-3xl">
            <span className="text-sm font-inter text-gray-600 dark:text-gray-500">Trending searches:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-inter text-gray-700 dark:text-gray-300 backdrop-blur-md transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:border-[#00D4FF]/40 dark:hover:border-[#00D4FF]/40 hover:text-gray-900 dark:hover:text-white"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default Hero;
