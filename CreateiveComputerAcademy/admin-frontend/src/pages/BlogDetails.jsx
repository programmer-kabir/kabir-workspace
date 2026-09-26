import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import JoditEditor from 'jodit-react';
import {
  FiArrowLeft, FiClock, FiEye, FiHeart, FiMessageSquare,
  FiShare2, FiStar, FiUser, FiCheckCircle, FiSend, FiTrash2,
  FiEdit3, FiUsers, FiCheck, FiX, FiUploadCloud, FiImage
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const REACTION_OPTIONS = [
  { type: 'like', icon: '👍', label: 'Like' },
  { type: 'love', icon: '❤️', label: 'Love' },
  { type: 'insight', icon: '💡', label: 'Insightful' },
  { type: 'fire', icon: '🔥', label: 'Fire' },
  { type: 'clap', icon: '👏', label: 'Clap' },
];

const CATEGORIES = ['Guidelines', 'Design Tips', 'Notices', 'Tutorials', 'Company News'];

const CATEGORY_COLORS = {
  'Guidelines': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Design Tips': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Notices': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'Tutorials': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Company News': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'General': 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
};

const TEMPLATE_SNIPPETS = [
  {
    name: '💡 Pro Tip Callout',
    icon: '💡',
    html: `
<div style="background: rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6; border-radius: 12px; padding: 16px; margin: 16px 0;">
  <strong style="color: #2563eb; display: block; font-size: 14px; margin-bottom: 6px;">💡 PRO TIP / BEST PRACTICE</strong>
  <p style="margin: 0; color: inherit; font-size: 13.5px; line-height: 1.6;">Clearly explain the pro-tip, standard shortcut, or quality rule here for maximum staff productivity.</p>
</div>
<p></p>`
  },
  {
    name: '⚠️ Warning Alert',
    icon: '⚠️',
    html: `
<div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; padding: 16px; margin: 16px 0;">
  <strong style="color: #dc2626; display: block; font-size: 14px; margin-bottom: 6px;">⚠️ IMPORTANT WARNING / PITFALL</strong>
  <p style="margin: 0; color: inherit; font-size: 13.5px; line-height: 1.6;">Avoid doing this! Mention common errors or rejectable offenses that staff must steer clear of.</p>
</div>
<p></p>`
  },
  {
    name: '✅ Checklist Rules',
    icon: '✅',
    html: `
<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 16px; padding: 18px; margin: 16px 0;">
  <strong style="color: #059669; font-size: 15px; display: block; margin-bottom: 10px;">✅ Mandatory Quality Checklist</strong>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 13.5px;">
    <li>Check layer names and organization.</li>
    <li>Ensure all assets are aligned to the 8px grid system.</li>
    <li>Double check client brand guidelines and color codes.</li>
    <li>Export files in required formats (PNG, SVG, PDF).</li>
  </ul>
</div>
<p></p>`
  },
  {
    name: '📊 DOs vs DONTs Table',
    icon: '📊',
    html: `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border-radius: 12px; overflow: hidden; font-size: 13px;">
  <thead>
    <tr style="background: #e2e8f0; color: #0f172a;">
      <th style="padding: 12px 14px; text-align: left; border: 1px solid #cbd5e1; width: 50%;">✅ DO (Best Practice)</th>
      <th style="padding: 12px 14px; text-align: left; border: 1px solid #cbd5e1; width: 50%;">❌ DON'T (Avoid)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">Use official typography scale (Inter/Outfit).</td>
      <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">Use arbitrary font sizes and weights.</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">Test contrast ratio before submission.</td>
      <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">Submit unreadable light text on pale backgrounds.</td>
    </tr>
  </tbody>
</table>
<p></p>`
  }
];

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsSummary, setReactionsSummary] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('write');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Guidelines',
    summary: '',
    content: '',
    cover_image: '',
    status: 'published',
    is_pinned: false
  });

  // Readership Modal State
  const [isReadersOpen, setIsReadersOpen] = useState(false);
  const [readersData, setReadersData] = useState(null);
  const [readersLoading, setReadersLoading] = useState(false);

  const editorRef = React.useRef(null);
  const inlineImageInputRef = React.useRef(null);

  // Jodit Configuration
  const joditConfig = React.useMemo(() => ({
    readonly: false,
    height: 480,
    minHeight: 380,
    placeholder: 'Write your comprehensive guideline...',
    toolbarSticky: false,
    toolbarAdaptive: false,
    theme: 'default',
    buttons: [
      'font', 'fontsize', 'paragraph', 'brush', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'align', 'outdent', 'indent', 'lineHeight', '|',
      'image', 'table', 'link', 'video', '|',
      'quote', 'hr', 'eraser', 'copyformat', '|',
      'undo', 'redo', '|',
      'fullsize', 'source'
    ],
    controls: {
      font: {
        list: {
          '': 'Default Font',
          'Inter, sans-serif': 'Inter',
          'Outfit, sans-serif': 'Outfit',
          'Poppins, sans-serif': 'Poppins',
          'Roboto, sans-serif': 'Roboto',
          'Montserrat, sans-serif': 'Montserrat',
          'Plus Jakarta Sans, sans-serif': 'Plus Jakarta Sans',
          'Arial, Helvetica, sans-serif': 'Arial',
          'Georgia, serif': 'Georgia',
          'Times New Roman, Times, serif': 'Times New Roman',
          'Courier New, Courier, monospace': 'Courier New (Code)'
        }
      },
      fontsize: {
        list: ['11', '12', '13', '14', '15', '16', '18', '20', '22', '24', '28', '32', '36', '42', '48', '64']
      }
    },
    removeButtons: ['about', 'print'],
    uploader: {
      url: `${API_BASE}api/blogs/upload_blog_image.php`,
      format: 'json',
      method: 'POST',
      filesVariableName: () => 'files',
      isSuccess: (resp) => !!(resp && (resp.success || resp.status === 'success' || (resp.files && resp.files.length) || resp.url)),
      getMsg: (resp) => (resp && (resp.error || resp.message)) ? (resp.error || resp.message) : 'Image upload failed.',
      process: (resp) => {
        let list = [];
        if (resp && resp.files && Array.isArray(resp.files)) list = resp.files;
        else if (resp && resp.data && resp.data.files) list = resp.data.files;
        else if (resp && resp.url) list = [resp.url];
        return {
          files: list,
          baseurl: '',
          error: (resp && (resp.status === 'error' || resp.error)) ? (resp.message || resp.error) : '',
          msg: (resp && resp.message) ? resp.message : '',
          messages: (resp && resp.message) ? [resp.message] : [],
          isSuccess: !!(resp && (resp.success || resp.status === 'success' || list.length > 0))
        };
      },
      defaultHandlerSuccess(data) {
        const editor = this.j || this.jodit;
        if (!editor) return;
        const files = data.files || [];
        if (!files.length && data.url) files.push(data.url);
        if (!files.length) return;

        const imgs = files.map(f => {
          const src = f.startsWith('http') ? f : `${API_BASE}${f}`;
          return `<p><img src="${src}" alt="illustration" style="max-width:100%;height:auto;border-radius:14px;margin:12px 0;display:block;" /></p><p></p>`;
        }).join('');

        if (editor.selection && typeof editor.selection.insertHTML === 'function') {
          editor.selection.insertHTML(imgs);
        } else {
          editor.value = (editor.value || '') + imgs;
        }
        setFormData(prev => ({ ...prev, content: editor.value }));
        try { editor.e.fire('closeAll'); } catch (_) {}
        toast.success('Image inserted into article!');
      }
    }
  }), [API_BASE]);

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
        navigate('/blogs');
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

  // 2. Real-time Pusher
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
        if (data.summary) setReactionsSummary(data.summary);
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

  // 3. Reactions
  const handleToggleReaction = async (reactionType) => {
    if (!currentUser?.id) return;
    const previousReaction = userReaction;
    const isRemoving = (previousReaction === reactionType);
    setUserReaction(isRemoving ? null : reactionType);

    setReactionsSummary(prev => {
      const updated = { ...prev };
      if (previousReaction) {
        updated[previousReaction] = Math.max(0, (updated[previousReaction] || 1) - 1);
      }
      if (!isRemoving) {
        updated[reactionType] = (updated[reactionType] || 0) + 1;
      }
      return updated;
    });

    try {
      const res = await axios.post(`${API_BASE}api/blogs/react_blog.php`, {
        blog_id: id,
        user_id: currentUser.id,
        reaction_type: reactionType
      });
      if (res.data.status === 'success') {
        setUserReaction(res.data.user_reaction);
        setReactionsSummary(res.data.reactions_summary);
      }
    } catch (err) {
      console.error('Reaction error', err);
    }
  };

  // 4. Comment Submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await axios.post(`${API_BASE}api/blogs/add_comment.php`, {
        blog_id: id,
        user_id: currentUser.id,
        comment: newComment.trim()
      });

      if (res.data.status === 'success') {
        setComments(prev => {
          if (prev.some(c => c.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
        setNewComment('');
        toast.success('Comment posted!');
      } else {
        toast.error(res.data.message || 'Failed to post comment');
      }
    } catch (err) {
      toast.error('Error posting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 5. Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/blogs/delete_comment.php`, {
        comment_id: commentId,
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Comment deleted.');
      }
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  // 6. Delete Blog Post
  const handleDeleteBlog = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${blog.title}"?`)) return;
    try {
      const res = await axios.post(`${API_BASE}api/blogs/delete_blog.php`, { id: blog.id });
      if (res.data.status === 'success') {
        toast.success('Post deleted successfully');
        navigate('/blogs');
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting post');
    }
  };

  // 7. Open Edit Modal
  const handleOpenEditModal = () => {
    setFormData({
      title: blog.title || '',
      category: blog.category || 'Guidelines',
      summary: blog.summary || '',
      content: blog.content || '',
      cover_image: blog.cover_image || '',
      status: blog.status || 'published',
      is_pinned: Boolean(Number(blog.is_pinned))
    });
    setEditorMode('write');
    setIsEditorOpen(true);
  };

  // 8. Save Blog Edits
  const handleSaveBlog = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.title.trim()) return toast.error('Please provide a post title');
    if (!formData.content.trim()) return toast.error('Please write some content');

    setSaving(true);
    try {
      const payload = {
        id: blog.id,
        ...formData,
        author_id: currentUser?.id
      };
      const res = await axios.post(`${API_BASE}api/blogs/update_blog.php`, payload);
      if (res.data.status === 'success') {
        toast.success('Post updated successfully!');
        setIsEditorOpen(false);
        fetchBlogDetails();
      } else {
        toast.error(res.data.message || 'Failed to update post');
      }
    } catch (err) {
      toast.error('Error updating post');
    } finally {
      setSaving(false);
    }
  };

  // 9. Cover Image Upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('image', file);
    setUploadingImage(true);
    try {
      const res = await axios.post(`${API_BASE}api/blogs/upload_blog_image.php`, body);
      if (res.data.status === 'success') {
        setFormData(prev => ({ ...prev, cover_image: res.data.url }));
        toast.success('Cover image uploaded!');
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload error');
    } finally {
      setUploadingImage(false);
    }
  };

  // 10. Inline Image Insert
  const handleInlineImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('files', file);
    try {
      const res = await axios.post(`${API_BASE}api/blogs/upload_blog_image.php`, body);
      const url = res.data.url || (res.data.files && res.data.files[0]);
      if (url) {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const imgHtml = `<p><img src="${fullUrl}" alt="article-image" style="max-width:100%;height:auto;border-radius:14px;margin:12px 0;" /></p><p></p>`;
        setFormData(prev => ({ ...prev, content: prev.content + imgHtml }));
        toast.success('Image inserted!');
      }
    } catch (err) {
      toast.error('Failed to insert image');
    }
  };

  // 11. View Readers Modal
  const handleOpenReaders = async () => {
    setIsReadersOpen(true);
    setReadersLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/blogs/get_blog_readers.php?blog_id=${id}`);
      if (res.data.status === 'success') {
        setReadersData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load readership');
    } finally {
      setReadersLoading(false);
    }
  };

  // 12. Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!blog) return null;

  const catColor = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS['General'];
  const coverUrl = blog.cover_image ? (blog.cover_image.startsWith('http') ? blog.cover_image : `${API_BASE}${blog.cover_image}`) : null;
  const totalReactions = Object.values(reactionsSummary).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── TOP ACTION & NAVIGATION BAR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/blogs')}
          className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Back to Academy Feed</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Readers Button */}
          <button
            type="button"
            onClick={handleOpenReaders}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FiUsers size={15} />
            <span>Staff Readership ({blog.readers_count || 0})</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FiEdit3 size={15} />
            <span>Edit Post</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            title="Share Link"
          >
            {copied ? <FiCheck size={16} className="text-emerald-500" /> : <FiShare2 size={16} />}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteBlog}
            className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shadow-xs"
            title="Delete Post"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
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
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${blog.status === 'published' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-slate-500/15 text-slate-600 border-slate-500/30'}`}>
            {blog.status}
          </span>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <FiClock size={13} className="text-indigo-500" /> {blog.read_time_mins || 2} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {blog.title}
        </h1>

        {/* Author & Stats Bar */}
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

          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1"><FiEye size={14} /> {blog.views_count} Total Views</span>
            <span className="flex items-center gap-1"><FiUsers size={14} className="text-indigo-500" /> {blog.readers_count} Staff Readers</span>
          </div>
        </div>
      </div>

      {/* ── ⚡ QUICK 1-MINUTE TAKEAWAY / SUMMARY CARD ── */}
      {blog.summary && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border-2 border-amber-400/40 dark:border-amber-500/30 p-6 sm:p-7 shadow-xl shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
              <HiSparkles size={24} />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                  ⚡ Quick 1-Minute Takeaway (Staff Summary)
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
        className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-sans space-y-4 selection:bg-indigo-500/30 [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:p-2.5 [&_table_td]:border [&_table_td]:p-2.5 [&_img]:rounded-2xl [&_pre]:rounded-2xl"
        dangerouslySetInnerHTML={{ __html: blog.content || '' }}
      />

      {/* ── INTERACTIVE REACTIONS BAR ── */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Reactions Overview
          </h4>
          <p className="text-[11px] text-slate-400">
            {totalReactions > 0 ? `${totalReactions} total staff reaction(s)` : 'No reactions yet'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {REACTION_OPTIONS.map((r) => {
            const count = Number(reactionsSummary[r.type] || 0);
            const isSelected = userReaction === r.type;

            return (
              <button
                key={r.type}
                type="button"
                onClick={() => handleToggleReaction(r.type)}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-90 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30 scale-105'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-sm">{r.icon}</span>
                <span>{count > 0 ? count : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COMMENTS & DISCUSSION SECTION ── */}
      <div className="space-y-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiMessageSquare size={20} className="text-indigo-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Team Discussions & Questions ({comments.length})
            </h3>
          </div>
        </div>

        {/* Comment Input Box */}
        <form onSubmit={handleCommentSubmit} className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Post an administrative announcement or reply to this thread..."
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Posting as <strong>{currentUser?.name || 'Administrator'}</strong>
            </span>
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FiSend size={13} />
              <span>{submittingComment ? 'Posting...' : 'Post Reply'}</span>
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              No comments or discussion yet.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 overflow-hidden">
                      {c.user_avatar ? (
                        <img src={c.user_avatar.startsWith('http') ? c.user_avatar : `${API_BASE}${c.user_avatar}`} alt={c.user_name} className="w-full h-full object-cover" />
                      ) : (
                        c.user_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {c.user_name}
                        </p>
                        {c.user_role === 'admin' && (
                          <span className="px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                    title="Delete Comment (Admin Authority)"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 pl-10 leading-relaxed whitespace-pre-wrap">
                  {c.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── EDIT POST MODAL (PORTAL) ── */}
      {isEditorOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditorOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-5 sm:p-7 max-w-5xl w-full max-h-[94vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-5 relative flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20">
                  <FiEdit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Edit Academy Post
                  </h3>
                  <p className="text-xs text-slate-400">Update guideline title, rich text, images, or pinned status</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm sm:text-base font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>📌 Pinned Announcement</span>
                  </label>
                </div>
              </div>

              {/* Cover Image */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <FiUploadCloud size={16} />
                    <span>{uploadingImage ? 'Uploading...' : 'Change Cover Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  {formData.cover_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image: '' })}
                      className="text-rose-500 hover:underline text-xs font-bold"
                    >
                      Remove Cover
                    </button>
                  )}
                </div>
              </div>

              {/* 1-Minute Takeaway */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <HiSparkles size={15} className="text-amber-500" />
                  <span>⚡ Quick 1-Minute Takeaway (Staff Summary)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              {/* Rich Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Content *
                  </label>
                  <label className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                    <FiImage size={13} />
                    <span>+ Insert Image</span>
                    <input
                      ref={inlineImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleInlineImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                  <JoditEditor
                    ref={editorRef}
                    value={formData.content}
                    config={joditConfig}
                    onBlur={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
                    onChange={() => {}}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Update Article'}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ── READERSHIP BREAKDOWN MODAL (PORTAL) ── */}
      {isReadersOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReadersOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <FiUsers size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Staff Readership Status
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-xs">
                    {blog.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReadersOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {readersData && (
              <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">
                    Read by {readersData.read_count} of {readersData.total_staff} Staff ({readersData.read_percentage}%)
                  </span>
                  <span className={readersData.unread_count === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {readersData.unread_count === 0 ? '100% Completed 🎉' : `${readersData.unread_count} Pending`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${readersData.read_percentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {readersLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading readers...</div>
              ) : readersData?.readers?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No staff records found.</div>
              ) : (
                readersData?.readers?.map(staff => (
                  <div
                    key={staff.user_id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${staff.has_read
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-900/30'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 overflow-hidden">
                        {staff.avatar ? (
                          <img src={staff.avatar.startsWith('http') ? staff.avatar : `${API_BASE}${staff.avatar}`} alt={staff.staff_name} className="w-full h-full object-cover" />
                        ) : (
                          staff.staff_name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {staff.staff_name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {staff.designation || 'Staff Designer'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {staff.has_read ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <FiCheckCircle size={12} /> Read
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                          Unread
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default BlogDetails;
