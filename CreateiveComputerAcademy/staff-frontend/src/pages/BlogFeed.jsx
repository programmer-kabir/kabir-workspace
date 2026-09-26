import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiBookOpen, FiSearch, FiStar, FiClock, FiMessageSquare,
  FiHeart, FiEye, FiArrowRight, FiCheckCircle, FiCompass
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORIES = ['All', 'Guidelines', 'Design Tips', 'Notices', 'Tutorials', 'Company News'];

const CATEGORY_COLORS = {
  'Guidelines': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Design Tips': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Notices': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'Tutorials': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Company News': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'General': 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
};

const BlogFeed = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
        <div
          onClick={() => navigate(`/feed/${pinnedBlog.id}`)}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-indigo-500/30 cursor-pointer group hover:border-indigo-400 transition-all duration-300"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

            <div className="lg:col-span-8 space-y-4">

              {/* Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                  <FiStar size={12} className="fill-slate-950" /> Featured Announcement
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                  {pinnedBlog.category}
                </span>
                {!pinnedBlog.is_read && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    New (Unread)
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors">
                {pinnedBlog.title}
              </h2>

              {/* ⚡ Quick 1-Min Summary Box */}
              {pinnedBlog.summary && (
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white/90 space-y-1">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <HiSparkles size={14} className="text-amber-400" /> 1-Minute Core Summary:
                  </span>
                  <p className="leading-relaxed font-medium line-clamp-3 text-slate-200">
                    {pinnedBlog.summary}
                  </p>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-white/70 pt-2">
                <span>By <strong>{pinnedBlog.author_name || 'Admin'}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1"><FiClock size={13} /> {pinnedBlog.read_time_mins} min read</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FiHeart size={13} /> {pinnedBlog.reactions_count}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FiMessageSquare size={13} /> {pinnedBlog.comments_count} discussions</span>
              </div>

              {/* Read Button */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-lg group-hover:translate-x-1 transition-all">
                  <span>Read Full Guideline</span>
                  <FiArrowRight size={14} />
                </span>
              </div>

            </div>

            {/* Cover photo preview */}
            {pinnedBlog.cover_image && (
              <div className="lg:col-span-4 h-56 sm:h-64 rounded-3xl overflow-hidden border border-white/20 shadow-xl">
                <img
                  src={pinnedBlog.cover_image.startsWith('http') ? pinnedBlog.cover_image : `${API_BASE}${pinnedBlog.cover_image}`}
                  alt={pinnedBlog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}

          </div>
        </div>
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
          {(selectedCategory === 'All' && !searchTerm && pinnedBlog ? otherBlogs : blogs).map(blog => {
            const catColor = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS['General'];
            const coverUrl = blog.cover_image ? (blog.cover_image.startsWith('http') ? blog.cover_image : `${API_BASE}${blog.cover_image}`) : null;

            return (
              <div
                key={blog.id}
                onClick={() => navigate(`/feed/${blog.id}`)}
                className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all flex flex-col overflow-hidden group cursor-pointer"
              >
                {/* Cover Image */}
                {coverUrl ? (
                  <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={coverUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${catColor} bg-white/90 dark:bg-slate-900/90`}>
                      {blog.category}
                    </span>
                    {!blog.is_read && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                        Unread
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-5 pb-0 flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${catColor}`}>
                      {blog.category}
                    </span>
                    {!blog.is_read ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                        Unread
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-xs flex items-center gap-1 font-bold">
                        <FiCheckCircle size={13} /> Read
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {blog.title}
                    </h3>

                    {/* ⚡ 1-Minute Takeaway Highlight Box */}
                    {blog.summary && (
                      <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
                        <span className="font-black text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                          <HiSparkles size={13} /> 1-Min Takeaway:
                        </span>
                        <p className="line-clamp-2 font-medium leading-relaxed">
                          {blog.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meta Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                      <FiClock size={12} className="text-blue-500" />
                      <span>{blog.read_time_mins} min read</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px]" title="Views">
                        <FiEye size={12} /> {blog.views_count}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" title="Reactions">
                        <FiHeart size={12} /> {blog.reactions_count}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" title="Comments">
                        <FiMessageSquare size={12} /> {blog.comments_count}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default BlogFeed;
