import { useState, useEffect } from "react";
import { ChevronDown, Menu, X, Search, UserCircle, FolderHeart, Sun, Moon } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../utlis/Hooks/useAuth";
import useCategories from "../utlis/Hooks/useCategories";
import useSiteSettings from "../utlis/Hooks/useSiteSettings";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";
import PikSeaLogo from "./Common/PikSeaLogo";

const BASE_URL = "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev";

const Navbar = ({ onOpenCommandPalette }) => {
  const [open, setOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { user, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isInnerPage = location.pathname !== '/';
  const isCompact = scrolled || isInnerPage;

  const { data: categories = [] } = useCategories();
  const { data: settings = {} } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parent categories only
  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === "NULL"
  );

  // Sub categories by parent id
  const getSubCategories = (parentId) =>
    categories.filter((c) => Number(c.parent_id) === Number(parentId));

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav
      className={`fixed top-0 w-full z-[60] transition-all duration-300 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 ${isCompact ? 'py-1' : ''}`}
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className={`flex items-center justify-between px-4 lg:px-8 w-full mx-auto transition-all duration-300 ${isCompact ? 'h-16' : 'h-20'}`}>
        {/* Left */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <PikSeaLogo size="md" />

          {/* Desktop Category Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {mainCategories.map((menu) => (
              <div
                key={menu.id}
                onMouseEnter={() => setActiveMenu(menu.slug)}
              >
                <Link
                  to={`/${menu.slug}`}
                  className={`flex items-center gap-1.5 font-outfit text-[15px] font-medium tracking-wide transition-all duration-300 ${activeMenu === menu.slug
                    ? "text-[#00D4FF]"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  {menu.name}
                  {getSubCategories(menu.id).length > 0 && (
                    <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === menu.slug ? 'rotate-180 text-[#00D4FF]' : 'text-gray-500'}`} />
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Inline Search / Spotlight Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex h-10 items-center justify-between gap-3 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 hover:bg-white dark:hover:bg-white/10 hover:border-[#00D4FF]/50 transition-all shadow-sm group text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#00D4FF] transition-colors">
              <Search size={15} />
              <span className="text-xs text-gray-400 dark:text-gray-400 font-inter font-normal pr-4">
                Search assets...
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-400 bg-gray-200/60 dark:bg-white/10 rounded-md border border-gray-300/40 dark:border-white/10">
              <span className="text-[11px]">⌘</span>K
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] transition-colors p-1"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <NotificationBell />

          <Link to="/join-pro" className="font-outfit text-sm font-semibold tracking-wide text-[#8B5CF6] hover:text-[#A78BFA] transition-colors drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">
            Join Pro
          </Link>

          {user ? (
            <Link
              to="/accounts"
              className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-5 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20"
            >
              <UserCircle size={18} className="text-gray-500 dark:text-gray-400" />
              Account
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-[#00D4FF] px-6 py-2 font-outfit text-sm font-semibold text-[#050505] hover:bg-[#33DEFF] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Button */}
        <button onClick={() => setOpen(!open)} className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mega Menu — dynamic sub categories */}
      {activeMenu && (
        <div className="absolute left-0 top-full z-50 w-full border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl shadow-2xl origin-top animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-12">
            {mainCategories
              .filter((menu) => menu.slug === activeMenu)
              .map((menu) => {
                const subs = getSubCategories(menu.id);
                return (
                  <div key={menu.id}>
                    {subs.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {subs.slice(0, 12).map((item) => (
                          <Link
                            key={item.id}
                            to={`/${menu.slug}/${item.slug}`}
                            onClick={() => setActiveMenu(null)}
                            className="group flex flex-col magnetic-hover"
                          >
                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-[#111] relative transition-all duration-300 group-hover:border-[#00D4FF]/30 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                              <img
                                src={`${BASE_URL}/${item.image}`}
                                alt={item.name}
                                className="h-32 w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                            </div>

                            <h3 className="mt-3 font-outfit font-semibold text-gray-900 dark:text-gray-200 group-hover:text-[#00D4FF] transition-colors text-[15px]">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-[13px] text-gray-500 font-inter">
                              Explore resources
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <FolderHeart className="w-12 h-12 mb-3 text-gray-700" />
                        <p className="text-sm font-inter">No subcategories found</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-20 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 w-full border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] shadow-2xl z-50 lg:hidden">
            <div className="px-4 pt-6 pb-2">
              <form onSubmit={handleSearch} className="flex h-12 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 overflow-hidden focus-within:border-[#00D4FF]/50 transition-all">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="flex-1 bg-transparent px-4 text-sm text-gray-900 dark:text-white outline-none"
                />
                <button type="submit" className="px-4 text-gray-400 hover:text-[#00D4FF]">
                  <Search size={18} />
                </button>
              </form>
            </div>

            <div className="flex flex-col px-4 py-4 max-h-[calc(100vh-140px)] overflow-y-auto">
              {mainCategories.map((menu) => (
                <Link
                  key={menu.id}
                  to={`/${menu.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 font-outfit text-lg font-medium border-b border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:text-[#00D4FF] transition-colors"
                >
                  {menu.name}
                  <ChevronDown size={18} className="text-gray-400 dark:text-gray-600" />
                </Link>
              ))}

              <div className="mt-6 flex flex-col gap-4">
                <Link to="/join-pro" onClick={() => setOpen(false)} className="text-left py-2 font-outfit text-[#8B5CF6] font-semibold">Join Pro</Link>

                {user ? (
                  <>
                    <Link
                      to="/account/collections"
                      onClick={() => setOpen(false)}
                      className="text-left py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Collections
                    </Link>
                    <Link
                      to="/accounts"
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20  font-outfit font-semibold text-gray-900 dark:text-white text-center hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                    >
                      My Account
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-[#00D4FF]  font-outfit font-semibold text-[#050505] text-center hover:bg-[#33DEFF] transition-all"
                  >
                    Sign In / Join
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
