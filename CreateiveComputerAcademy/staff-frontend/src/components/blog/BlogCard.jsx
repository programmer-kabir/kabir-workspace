import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock, FiHeart, FiEye, FiMessageSquare, FiCheckCircle
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_COLORS = {
  'Guidelines': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Design Tips': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Notices': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'Tutorials': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Company News': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'General': 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
};

const BlogCard = ({ blog }) => {
  const navigate = useNavigate();

  if (!blog) return null;

  const catColor = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS['General'];
  const coverUrl = blog.cover_image
    ? (blog.cover_image.startsWith('http') ? blog.cover_image : `${API_BASE}${blog.cover_image}`)
    : null;

  return (
    <div
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
};

export default BlogCard;

