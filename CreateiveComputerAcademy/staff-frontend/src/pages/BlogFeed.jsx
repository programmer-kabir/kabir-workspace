import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBookOpen, FiSearch, FiCompass } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import BlogHeroCard from '../components/blog/BlogHeroCard';
import BlogCard from '../components/blog/BlogCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORIES = ['All', 'Guidelines', 'Design Tips', 'Notices', 'Tutorials', 'Company News'];

const BlogFeed = () => {
  const { currentUser } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/blogs/get_blogs.php`, {
        params: {
          role: 'staff',
          category: selectedCategory === 'All' ? 'all' : selectedCategory,
          status: 'published',
          search: searchTerm,
          user_id: currentUser?.id
        }
      });
      if (res.data.status === 'success') {
        setBlogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory]);

  useEffect(() => {
    const t = setTimeout(() => fetchBlogs(), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const pinnedBlog = blogs.find(b => b.is_pinned);
  const otherBlogs = blogs.filter(b => b !== pinnedBlog);

  return (
    <div className="p-4   mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <FiBookOpen size={22} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Academy Feed & Knowledge Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official academy guidelines, design quality standards, and quick takeaways for team members.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guidelines, topics..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
          />
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-102'
              : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── PINNED HERO ANNOUNCEMENT (IF PRESENT) ── */}
      {pinnedBlog && selectedCategory === 'All' && !searchTerm && (
        <BlogHeroCard blog={pinnedBlog} />
      )}

      {/* ── BLOG FEED GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
          <FiCompass size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No articles in this category</h3>
          <p className="text-xs text-slate-400 mt-1">Select another category or search a different term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(selectedCategory === 'All' && !searchTerm && pinnedBlog ? otherBlogs : blogs).map(blog => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}

    </div>
  );
};

export default BlogFeed;
