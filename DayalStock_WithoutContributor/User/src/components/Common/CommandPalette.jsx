import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  FolderHeart, 
  Tag, 
  Layers, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  Clock, 
  X,
  Compass,
  FileImage,
  Crown
} from "lucide-react";
import useCategories from "../../utlis/Hooks/useCategories";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY;

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dayalstock_recent_searches") || "[]");
    } catch {
      return [];
    }
  });
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { data: categories = [] } = useCategories();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim()) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${BASE_URL}/contents/getContents.php?search=${encodeURIComponent(query.trim())}&limit=5`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLiveResults(json.data);
        } else {
          setLiveResults([]);
        }
      } catch (e) {
        setLiveResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Quick navigation items
  const quickNav = [
    { label: "Explore Pro Subscription", path: "/join-pro", icon: Crown, color: "text-amber-500 dark:text-amber-400 bg-amber-500/10" },
    { label: "My Collections", path: "/account/collections", icon: FolderHeart, color: "text-rose-500 dark:text-rose-400 bg-rose-500/10" },
    { label: "Support & Help Desk", path: "/faqs", icon: HelpCircle, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10" },
    { label: "Licensing Agreement", path: "/licensing", icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  ];

  // Filtered categories
  const filteredCategories = categories
    .filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4);

  // Combine items for keyboard navigation
  const allActionItems = [
    ...(query.trim() ? [{ type: "search", label: `Search for "${query.trim()}"`, query: query.trim() }] : []),
    ...liveResults.map(item => ({ type: "asset", ...item })),
    ...filteredCategories.map(cat => ({ type: "category", ...cat })),
    ...quickNav.map(nav => ({ type: "nav", ...nav }))
  ];

  const handleSelect = (item) => {
    if (!item) return;

    if (item.type === "search") {
      saveRecent(item.query);
      navigate(`/search?q=${encodeURIComponent(item.query)}`);
    } else if (item.type === "asset") {
      saveRecent(item.title);
      navigate(`/${item.category_slug || 'vector'}/${item.slug}`);
    } else if (item.type === "category") {
      navigate(`/${item.slug}`);
    } else if (item.type === "nav") {
      navigate(item.path);
    }
    onClose();
  };

  const saveRecent = (searchTerm) => {
    if (!searchTerm) return;
    const updated = [searchTerm, ...recentSearches.filter(s => s.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("dayalstock_recent_searches", JSON.stringify(updated));
    } catch (e) {}
  };

  const clearRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("dayalstock_recent_searches");
  };

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allActionItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allActionItems.length) % Math.max(1, allActionItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allActionItems[selectedIndex]) {
        handleSelect(allActionItems[selectedIndex]);
      } else if (query.trim()) {
        handleSelect({ type: "search", query: query.trim() });
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0D0E15] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-gray-400/20 dark:shadow-cyan-500/10 overflow-hidden flex flex-col backdrop-blur-xl animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]">
          <Search size={20} className="text-[#0088b3] dark:text-[#00D4FF] mr-3 flex-shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search stock vectors, photos, categories, or tools..."
            className="w-full bg-transparent text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors mr-2 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-200/80 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-md">
            ESC
          </span>
        </div>

        {/* Search Results / Suggestions List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10">
          
          {/* Query Live Assets Results */}
          {liveResults.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                <FileImage size={13} className="text-[#0088b3] dark:text-[#00D4FF]" />
                Top Matching Assets
              </div>
              <div className="mt-1 space-y-1">
                {liveResults.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect({ type: "asset", ...item })}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      selectedIndex === (query.trim() ? 1 + idx : idx)
                        ? "bg-[#00D4FF]/10 dark:bg-gradient-to-r dark:from-[#00D4FF]/20 dark:to-[#6C4FE0]/20 border border-[#00D4FF]/40 text-gray-900 dark:text-white" 
                        : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0 border border-gray-200 dark:border-white/10">
                        <img 
                          src={item.thumbnail_url || item.preview_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.content_type || 'Vector'} • {item.is_premium ? '⭐ Premium' : 'Free'}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 opacity-60 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-purple-500 dark:text-purple-400" />
                  Recent Searches
                </span>
                <button onClick={clearRecent} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                  Clear
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 px-2">
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(s);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Search size={12} className="text-gray-400" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {filteredCategories.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                <Layers size={13} className="text-amber-500 dark:text-amber-400" />
                Categories
              </div>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect({ type: "category", ...cat })}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Compass size={16} className="text-[#0088b3] dark:text-[#00D4FF]" />
                    <span className="truncate font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation / Tools */}
          {!query && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                <Zap size={13} className="text-emerald-500 dark:text-emerald-400" />
                Quick Actions
              </div>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {quickNav.map((nav, idx) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect({ type: "nav", ...nav })}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-lg ${nav.color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-medium truncate">{nav.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search trigger prompt when query exists */}
          {query.trim() && (
            <button
              onClick={() => handleSelect({ type: "search", query: query.trim() })}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/15 via-blue-500/10 to-purple-600/15 border border-[#00D4FF]/40 text-gray-900 dark:text-white font-medium shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-[#0088b3] dark:text-[#00D4FF] animate-spin" style={{ animationDuration: '6s' }} />
                <span>Search for &quot;<strong className="text-[#0088b3] dark:text-[#00D4FF]">{query.trim()}</strong>&quot; across all assets</span>
              </div>
              <ArrowRight size={18} className="text-[#0088b3] dark:text-[#00D4FF]" />
            </button>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded border border-gray-300 dark:border-white/10">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded border border-gray-300 dark:border-white/10">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded border border-gray-300 dark:border-white/10">↵</kbd>
              to select
            </span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">DayalStock Instant Spotlight</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
