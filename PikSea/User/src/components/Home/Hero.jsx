import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Sparkles, Camera, ArrowRight, Compass, Flame, 
  Layers, SlidersHorizontal, Image as ImageIcon 
} from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";
import useCategories from "../../utlis/Hooks/useCategories";
import useSiteSettings from "../../utlis/Hooks/useSiteSettings";
import { saveToRecentSearches } from "../../utlis/recentActivity";

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: categories = [] } = useCategories();
  const { data: settings = {} } = useSiteSettings();

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL" || c.parent_id === 0 || c.parent_id === "0"
  );

  const selectedMainCatId =
    selectedCategory === "all"
      ? null
      : mainCategories.find((c) => c.slug === selectedCategory)?.id;

  const suggestions = searchQuery.trim()
    ? categories
        .filter((c) => c.parent_id !== null && c.parent_id !== "NULL" && c.parent_id !== 0 && c.parent_id !== "0")
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

  const popularTags = settings?.popular_tags || [
    "Portraits",
    "Cinematic",
    "Mountains",
    "Tokyo Street",
    "Minimalist",
    "Dark & Moody",
    "Cyberpunk",
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

  const handleSuggestionClick = (sub) => {
    const parent = categories.find((c) => Number(c.id) === Number(sub.parent_id));
    if (parent) {
      navigate(`/${parent.slug}/${sub.slug}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(sub.name)}`);
    }
  };

  return (
    <ScrollReveal className="relative z-30">
      <section className="relative min-h-[640px] lg:min-h-[720px] w-full flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#05070D] text-gray-900 dark:text-white pt-24 pb-16 transition-colors duration-300">
        
        {/* Background Visual Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Ambient Background Wallpaper */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000 ease-out opacity-10 dark:opacity-25 filter saturate-[1.2] blur-[1px]"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85')` 
            }}
          />

          {/* Gradients for Light and Dark Modes */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-gray-50/80 to-gray-50 dark:from-[#05070D]/90 dark:via-[#05070D]/75 dark:to-[#05070D]" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-transparent to-gray-50 dark:from-[#05070D] dark:via-transparent dark:to-[#05070D]" />

          {/* Ambient Glow Orbs */}
          <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] rounded-full bg-[#00D4FF]/10 dark:bg-[#00D4FF]/10 blur-[140px]" />
          <div className="absolute -bottom-32 right-1/4 w-[500px] h-[450px] rounded-full bg-[#0284C7]/10 dark:bg-[#0284C7]/15 blur-[150px]" />
          
          {/* Geometric Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_60%,transparent_100%)] opacity-60" />
        </div>

        {/* Hero Main Content */}
        <div className="relative mx-auto flex w-full max-w-[1300px] flex-col items-center px-4 sm:px-6 lg:px-8 text-center z-10">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 backdrop-blur-xl shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-[#00D4FF] animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-cyan-600 dark:text-[#00D4FF] uppercase">
              The Pure Stock Photography Collective
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Over 2.4M+ High-Res Photos</span>
          </div>

          {/* Hero Headline */}
          <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-gray-900 dark:text-white">
            Uncompromising <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-cyan-600 to-blue-600 dark:from-white dark:via-[#00D4FF] dark:to-[#38BDF8]">
              Visual Excellence.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
            Download royalty-free, ultra-high-resolution stock photography captured by world-class visual artists. Zero clutter. Pure inspiration.
          </p>

          {/* ─── Floating Search Console (Light & Dark Compatible) ─── */}
          <form
            onSubmit={handleSearch}
            className="mt-10 w-full max-w-3xl relative z-40"
          >
            <div className="relative flex items-center h-16 sm:h-[72px] w-full rounded-2xl bg-white/90 dark:bg-white/[0.07] hover:bg-white dark:hover:bg-white/[0.09] backdrop-blur-2xl border border-gray-200 dark:border-white/15 focus-within:border-[#00D4FF] focus-within:ring-2 focus-within:ring-[#00D4FF]/20 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 p-2">
              
              {/* Category Quick Filter */}
              <div className="hidden sm:flex items-center pl-3 pr-2 border-r border-gray-200 dark:border-white/10">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer pr-2 hover:text-black dark:hover:text-white transition-colors"
                >
                  <option value="all" className="bg-white text-gray-900 dark:bg-[#0A0E17] dark:text-white">All Categories</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.slug} className="bg-white text-gray-900 dark:bg-[#0A0E17] dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Main Search Input */}
              <div className="flex flex-1 items-center px-3 sm:px-4 min-w-0">
                <Search size={20} className="text-gray-400 shrink-0 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 4K/8K landscape, portraits, street, minimalist..."
                  className="w-full bg-transparent text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 font-medium outline-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-black font-black text-sm hover:brightness-110 hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span>Search</span>
                <ArrowRight size={16} className="hidden sm:inline" />
              </button>
            </div>

            {/* Live Autocomplete Dropdown */}
            {searchQuery.trim() && suggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/15 bg-white/98 dark:bg-[#090D17]/98 backdrop-blur-2xl shadow-2xl z-50 text-left animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10">
                  Matching Subcategories & Topics
                </div>
                {suggestions.map((sub) => {
                  const parent = categories.find((c) => Number(c.id) === Number(sub.parent_id));
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSuggestionClick(sub)}
                      className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/10 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <ImageIcon size={16} className="text-[#00D4FF] shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#00D4FF] transition-colors">
                            {sub.name}
                          </p>
                          {parent && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              in {parent.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            )}
          </form>

          {/* ─── Trending Visual Tags Strip ─── */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mr-2">
              <Flame size={14} className="text-orange-500" />
              <span>Trending:</span>
            </div>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/15 hover:border-[#00D4FF]/40 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-xs"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* ─── Hero Bottom Photographic Metadata Badge ─── */}
          <div className="mt-12 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl backdrop-blur-md shadow-xs">
            <div className="flex items-center gap-1.5">
              <Camera size={13} className="text-[#00D4FF]" />
              <span className="text-gray-800 dark:text-gray-300 font-medium">Curated Shot of the Day</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="hidden sm:inline">Sony A7R V • 24-70mm f/2.8 GM • ISO 100</span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-500 dark:text-gray-400">Canadian Rockies, Alberta</span>
          </div>

        </div>
      </section>
    </ScrollReveal>
  );
};

export default Hero;
