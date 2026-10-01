import { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, Menu, X, Search, UserCircle, 
  Sun, Moon, Sparkles, Compass, ArrowRight, Layers, MoreHorizontal
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../utlis/Hooks/useAuth";
import useCategories from "../utlis/Hooks/useCategories";
import useSiteSettings from "../utlis/Hooks/useSiteSettings";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";
import PikSeaLogo from "./Common/PikSeaLogo";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const Navbar = ({ onOpenCommandPalette }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navRef = useRef(null);

  const { data: categories = [] } = useCategories();
  const { data: settings = {} } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveMenu(null);
    setIsMoreOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Parent categories only (Pure Stock Photography)
  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === 0 || c.parent_id === "0" || c.parent_id === "NULL"
  );

  // Subcategories by parent id
  const getSubCategories = (parentId) =>
    categories.filter((c) => Number(c.parent_id) === Number(parentId));

  // Responsive Category Slicing
  // 0-3: always visible on lg+
  // 4-5: visible on xl+
  // 6+: visible on 2xl+
  const primaryCategories = mainCategories.slice(0, 3);
  const secondaryCategories = mainCategories.slice(3, 5);
  const tertiaryCategories = mainCategories.slice(5);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 w-full z-[60] transition-all duration-300 bg-white/95 dark:bg-[#07070C]/95 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 ${
        scrolled ? "shadow-lg shadow-black/5 dark:shadow-black/40" : ""
      }`}
      onMouseLeave={() => {
        setActiveMenu(null);
        setIsMoreOpen(false);
      }}
    >
      {/* ─── Edge-to-Edge Full Width Single Layer Navbar ─── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo (Guaranteed space, never overlapping) */}
        <div className="flex items-center gap-3 shrink-0 z-10">
          <PikSeaLogo size="md" />
        </div>

        {/* Center: Clean Proportional Category Showcase */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 justify-center flex-1 min-w-0 px-2">
          
          {/* Explore All */}
          <Link
            to="/search"
            className={`text-xs xl:text-sm font-semibold tracking-wide whitespace-nowrap transition-colors flex items-center gap-1.5 py-2 shrink-0 ${
              location.pathname === "/search" && !location.search.includes("category=")
                ? "text-[#00D4FF] font-bold"
                : "text-gray-700 dark:text-gray-300 hover:text-[#00D4FF] dark:hover:text-[#00D4FF]"
            }`}
          >
            <Compass size={15} className="text-gray-400" />
            <span>Explore</span>
          </Link>

          {/* 1. Primary Categories (Visible on lg+) - max 2 */}
          {mainCategories.slice(0, 2).map((cat) => (
            <div key={cat.id} className="shrink-0">
              {renderCategoryItem(cat)}
            </div>
          ))}

          {/* 2. Secondary Category (Visible on xl+) - 1 more */}
          {mainCategories.slice(2, 3).map((cat) => (
            <div key={cat.id} className="hidden xl:block shrink-0">
              {renderCategoryItem(cat)}
            </div>
          ))}

          {/* 3. Tertiary Category (Visible on 2xl+) - 1 more */}
          {mainCategories.slice(3, 4).map((cat) => (
            <div key={cat.id} className="hidden 2xl:block shrink-0">
              {renderCategoryItem(cat)}
            </div>
          ))}

          {/* 4. More Categories Dropdown (Contains all remaining categories) */}
          {mainCategories.length > 2 && (
            <div
              className="relative py-2 shrink-0"
              onMouseEnter={() => {
                setIsMoreOpen(true);
                setActiveMenu(null);
              }}
            >
              <button
                type="button"
                className={`flex items-center gap-1 text-xs xl:text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isMoreOpen ? "text-[#00D4FF]" : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>More</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    isMoreOpen ? "rotate-180 text-[#00D4FF]" : "text-gray-400"
                  }`}
                />
              </button>

              {/* More Dropdown Menu */}
              {isMoreOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-64 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0E0E18]/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  onMouseEnter={() => setIsMoreOpen(true)}
                  onMouseLeave={() => setIsMoreOpen(false)}
                >
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5 border-b border-gray-100 dark:border-white/5 mb-1">
                    More Categories
                  </div>

                  {/* Categories list in More (Starts from index 2 on lg, 3 on xl, 4 on 2xl) */}
                  <div className="space-y-0.5 max-h-80 overflow-y-auto">
                    {mainCategories.slice(2).map((cat) => {
                      const subs = getSubCategories(cat.id);
                      return (
                        <Link
                          key={cat.id}
                          to={`/${cat.slug}`}
                          onClick={() => setIsMoreOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-[#00D4FF]/10 hover:text-[#00D4FF] transition-all"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {subs.length > 0 ? `${subs.length} topics` : "Explore"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right: Search, Theme, Join Pro & Always-Visible Sign In */}
        <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 shrink-0">
          
          {/* Spotlight Search Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Search photos (⌘K)"
            className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-[#00D4FF]/40 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Search size={15} className="text-[#00D4FF]" />
            <span className="hidden md:inline text-xs font-medium pr-1">Search</span>
            <span className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-white/10 rounded border border-gray-300/40 dark:border-white/10">
              ⌘K
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell (Desktop & Tablet) */}
          <div className="hidden sm:block shrink-0">
            <NotificationBell />
          </div>

          {/* Join Pro (Desktop & Laptop) */}
          <Link
            to="/join-pro"
            className="hidden lg:flex items-center gap-1.5 text-xs font-extrabold text-[#8B5CF6] hover:text-[#A78BFA] px-3.5 py-2 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.25)] shrink-0"
          >
            <Sparkles size={13} />
            <span>Join Pro</span>
          </Link>

          {/* User Account / Sign In (ALWAYS VISIBLE on all devices) */}
          {user ? (
            <Link
              to="/accounts"
              className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10 hover:border-[#00D4FF]/40 shadow-sm shrink-0"
            >
              <UserCircle size={17} className="text-[#00D4FF]" />
              <span className="hidden sm:inline truncate max-w-[90px] xl:max-w-[120px]">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-gradient-to-r from-[#00D4FF] to-cyan-500 px-3.5 sm:px-5 py-1.5 sm:py-2.5 text-xs font-extrabold text-black hover:opacity-95 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white p-1 cursor-pointer shrink-0 ml-1"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* ─── Mega Menu Dropdown for Subcategories ─── */}
      {activeMenu && (
        <div
          className="absolute left-0 top-full z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0B14]/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-1 fade-in duration-200"
          onMouseEnter={() => {}}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
            {mainCategories
              .filter((cat) => cat.slug === activeMenu)
              .map((cat) => {
                const subs = getSubCategories(cat.id);
                return (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                          {cat.name} Collections
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Discover curated stock photography under {cat.name}
                        </p>
                      </div>
                      <Link
                        to={`/${cat.slug}`}
                        onClick={() => setActiveMenu(null)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#00D4FF] hover:underline"
                      >
                        <span>View all {cat.name} photos</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>

                    {subs.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {subs.map((item) => (
                          <Link
                            key={item.id}
                            to={`/${cat.slug}/${item.slug}`}
                            onClick={() => setActiveMenu(null)}
                            className="group p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-[#00D4FF]/5 hover:border-[#00D4FF]/30 transition-all flex flex-col justify-between h-20"
                          >
                            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#00D4FF] transition-colors line-clamp-1">
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 group-hover:text-gray-500 font-medium">
                              Explore collection →
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-gray-500">
                        No subcategories available.
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── Mobile Menu Drawer ─── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-20 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-full left-0 w-full border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D0D15] shadow-2xl z-50 lg:hidden max-h-[80vh] overflow-y-auto">
            
            {/* Mobile Search button */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCommandPalette();
                }}
                className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-[#00D4FF]" />
                  <span>Search photos...</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold">⌘K</span>
              </button>
            </div>

            {/* Mobile Categories List */}
            <div className="p-4 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Photography Genres</div>
              {mainCategories.map((cat) => {
                const subs = getSubCategories(cat.id);
                return (
                  <div key={cat.id} className="border-b border-gray-100 dark:border-white/5 py-2.5">
                    <Link
                      to={`/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-[#00D4FF] flex items-center justify-between"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{subs.length} topics</span>
                    </Link>
                    {subs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                        {subs.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/${cat.slug}/${sub.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-[#00D4FF]"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Bottom Links */}
            <div className="p-4 bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5 flex flex-col gap-3">
              <Link
                to="/join-pro"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
              >
                Join Pro ✨
              </Link>
              {user ? (
                <Link
                  to="/accounts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold"
                >
                  My Account
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-[#00D4FF] text-black text-xs font-bold"
                >
                  Sign In / Register
                </Link>
              )}
            </div>

          </div>
        </>
      )}
    </nav>
  );

  // Helper render for individual category item
  function renderCategoryItem(cat) {
    const isActive = location.pathname === `/${cat.slug}` || location.pathname.startsWith(`/${cat.slug}/`);
    const subs = getSubCategories(cat.id);

    return (
      <div
        key={cat.id}
        className="relative group py-2"
        onMouseEnter={() => {
          setActiveMenu(cat.slug);
          setIsMoreOpen(false);
        }}
      >
        <Link
          to={`/${cat.slug}`}
          className={`flex items-center gap-1 text-xs xl:text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
            isActive
              ? "text-[#00D4FF] font-extrabold"
              : activeMenu === cat.slug
              ? "text-[#00D4FF]"
              : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>{cat.name}</span>
          {subs.length > 0 && (
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 opacity-60 group-hover:opacity-100 ${
                activeMenu === cat.slug ? "rotate-180 text-[#00D4FF]" : "text-gray-400"
              }`}
            />
          )}
        </Link>

        {/* Active Indicator Underline */}
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
        )}
      </div>
    );
  }
};

export default Navbar;
