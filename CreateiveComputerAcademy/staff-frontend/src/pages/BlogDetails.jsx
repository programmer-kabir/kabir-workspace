import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import {
  FiArrowLeft, FiClock, FiEye, FiShare2, FiStar, FiUser, FiCheckCircle, FiCheck
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import BlogCommentsSection from '../components/blog/BlogCommentsSection';
import BlogReactionsBar from '../components/blog/BlogReactionsBar';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_COLORS = {
  'Guidelines': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Design Tips': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Notices': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'Tutorials': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Company News': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'General': 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
};

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsSummary, setReactionsSummary] = useState({});
  const [comments, setComments] = useState([]);
  const [copied, setCopied] = useState(false);

  // 1. Fetch Blog Details
  const fetchBlogDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/blogs/get_blog_details.php`, {
        params: { id, user_id: currentUser?.id }
      });
      if (res.data.status === 'success') {
        const data = res.data.data;
        setBlog(data);
        setUserReaction(data.user_reaction);
        setReactionsSummary(data.reactions_summary || {});
        setComments(data.comments || []);
      } else {
        toast.error('Blog post not found');
        navigate('/feed');
      }
    } catch (err) {
      console.error('Error fetching blog details', err);
      toast.error('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBlogDetails();
  }, [id, currentUser]);

  // 2. Pusher Real-time Synchronization
  useEffect(() => {
    if (!id) return;

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const channel = pusherInstance.subscribe(`blog-${id}`);

      channel.bind('new-comment', (commentData) => {
        setComments(prev => {
          if (prev.some(c => c.id === commentData.id)) return prev;
          return [...prev, commentData];
        });
      });

      channel.bind('reaction-updated', (data) => {
        if (data.summary) {
          setReactionsSummary(data.summary);
        }
      });

    } catch (err) {
      console.error('Pusher error', err);
    }

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe(`blog-${id}`);
        pusherInstance.disconnect();
      }
    };
  }, [id]);

  // 3. Share Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!blog) return null;

  const catColor = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS['General'];
  const coverUrl = blog.cover_image ? (blog.cover_image.startsWith('http') ? blog.cover_image : `${API_BASE}${blog.cover_image}`) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* ── TOP NAV BAR ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/feed')}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
          title="Share Article Link"
        >
          {copied ? <FiCheck size={16} className="text-emerald-500" /> : <FiShare2 size={16} />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* ── ARTICLE HEADER ── */}
      <div className="space-y-4">
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${catColor}`}>
            {blog.category}
          </span>
          {blog.is_pinned && (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
              <FiStar size={12} className="fill-slate-950" /> Pinned Announcement
            </span>
          )}
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <FiClock size={13} className="text-blue-500" /> {blog.read_time_mins} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {blog.title}
        </h1>

        {/* Author info & Read Confirmation */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 overflow-hidden shadow-inner">
              {blog.author_avatar ? (
                <img src={blog.author_avatar.startsWith('http') ? blog.author_avatar : `${API_BASE}${blog.author_avatar}`} alt={blog.author_name} className="w-full h-full object-cover" />
              ) : (
                <FiUser size={20} />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {blog.author_name || 'Academy Administration'}
              </p>
              <p className="text-xs text-slate-400">
                Published on {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1"><FiEye size={14} /> {blog.views_count} Views</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <FiCheckCircle size={13} /> Recorded as Read
            </span>
          </div>
        </div>

      </div>

      {/* ── ⚡ QUICK 1-MINUTE TAKEAWAY / SUMMARY BOX (TIME SAVER) ── */}
      {blog.summary && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border-2 border-amber-400/40 dark:border-amber-500/30 p-6 sm:p-7 shadow-xl shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 animate-pulse">
              <HiSparkles size={24} />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                  ⚡ Quick 1-Minute Takeaway (Core Summary)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  Time Saver
                </span>
              </div>
              <div className="text-xs sm:text-sm leading-relaxed text-amber-950 dark:text-amber-100 font-medium whitespace-pre-line">
                {blog.summary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COVER PHOTO ── */}
      {coverUrl && (
        <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-h-[480px] bg-slate-900 flex items-center justify-center">
          <img
            src={coverUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── FULL ARTICLE CONTENT ── */}
      <div 
        className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-sans space-y-4 selection:bg-blue-500/30 [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:p-2.5 [&_table_td]:border [&_table_td]:p-2.5 [&_img]:rounded-2xl [&_pre]:rounded-2xl"
        dangerouslySetInnerHTML={{ __html: blog.content || '' }}
      />

      {/* ── INTERACTIVE REACTIONS BAR ── */}
      <BlogReactionsBar
        blogId={id}
        userReaction={userReaction}
        setUserReaction={setUserReaction}
        reactionsSummary={reactionsSummary}
        setReactionsSummary={setReactionsSummary}
        currentUser={currentUser}
      />

      {/* ── COMMENTS & DISCUSSION SECTION ── */}
      <BlogCommentsSection
        blogId={id}
        comments={comments}
        setComments={setComments}
        currentUser={currentUser}
      />

    </div>
  );
};

export default BlogDetails;
