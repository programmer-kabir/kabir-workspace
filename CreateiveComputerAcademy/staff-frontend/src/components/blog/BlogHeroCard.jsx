import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiClock, FiHeart, FiMessageSquare, FiArrowRight } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BlogHeroCard = ({ blog }) => {
  const navigate = useNavigate();

  if (!blog) return null;

  const coverUrl = blog.cover_image
    ? (blog.cover_image.startsWith('http') ? blog.cover_image : `${API_BASE}${blog.cover_image}`)
    : null;

  return (
    <div
      onClick={() => navigate(`/feed/${blog.id}`)}
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
              {blog.category}
            </span>
            {!blog.is_read && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                New (Unread)
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors">
            {blog.title}
          </h2>

          {/* ⚡ Quick 1-Min Summary Box */}
          {blog.summary && (
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white/90 space-y-1">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <HiSparkles size={14} className="text-amber-400" /> 1-Minute Core Summary:
              </span>
              <p className="leading-relaxed font-medium line-clamp-3 text-slate-200">
                {blog.summary}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-white/70 pt-2">
            <span>By <strong>{blog.author_name || 'Admin'}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1"><FiClock size={13} /> {blog.read_time_mins} min read</span>
            <span>•</span>
            <span className="flex items-center gap-1"><FiHeart size={13} /> {blog.reactions_count}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><FiMessageSquare size={13} /> {blog.comments_count} discussions</span>
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
        {coverUrl && (
          <div className="lg:col-span-4 h-56 sm:h-64 rounded-3xl overflow-hidden border border-white/20 shadow-xl">
            <img
              src={coverUrl}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogHeroCard;

