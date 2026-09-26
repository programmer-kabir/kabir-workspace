import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import JoditEditor from 'jodit-react';
import {
  FiBookOpen, FiPlus, FiSearch, FiEdit3, FiTrash2, FiEye,
  FiMessageSquare, FiHeart, FiUsers, FiClock, FiCheck,
  FiX, FiImage, FiUploadCloud, FiTag, FiFileText, FiStar,
  FiTrendingUp, FiCheckCircle, FiAlertCircle, FiCode,
  FiList, FiMaximize2, FiMinimize2, FiLayers, FiHelpCircle
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
  },
  {
    name: '💻 Code / Config Box',
    icon: '💻',
    html: `
<pre style="background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 14px; overflow-x: auto; font-family: monospace; font-size: 13px; margin: 16px 0; border: 1px solid #1e293b;"><code>// Standard Template Config
const BRAND_KIT = {
  primaryColor: '#4f46e5',
  secondaryColor: '#06b6d4',
  basePadding: '24px'
};</code></pre>
<p></p>`
  }
];

const AcademyBlog = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create / Edit Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Guidelines',
    summary: '',
    content: '',
    cover_image: '',
    status: 'published',
    is_pinned: false
  });

  // Readers Breakdown Modal State
  const [readersModalBlogId, setReadersModalBlogId] = useState(null);
  const [readersData, setReadersData] = useState(null);
  const [readersLoading, setReadersLoading] = useState(false);

  // Full Article View Modal
  const [viewingBlog, setViewingBlog] = useState(null);

  // Jodit Editor Configuration
  const joditConfig = useMemo(() => ({
    readonly: false,
    height: 480,
    minHeight: 380,
    placeholder: 'Write your comprehensive guideline, tutorial, or official announcement in detail with rich typography, images, and tables...',
    toolbarSticky: false,
    toolbarAdaptive: false,
    theme: 'default',
    style: {
      fontFamily: 'inherit',
      fontSize: '14.5px',
      lineHeight: '1.7',
      color: 'inherit',
      background: 'transparent'
    },
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
          'Courier New, Courier, monospace': 'Courier New (Code)',
          'Trebuchet MS, sans-serif': 'Trebuchet MS',
          'Verdana, Geneva, sans-serif': 'Verdana',
        }
      },
      fontsize: {
        list: [
          '11', '12', '13', '14', '15', '16', '18', '20', '22', '24', '28', '32', '36', '42', '48', '64'
        ]
      }
    },
    removeButtons: ['about', 'print'],
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
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
        const isOk = !!(resp && (resp.success || resp.status === 'success' || list.length > 0));
        return {
          files: list,
          baseurl: '',
          error: (resp && (resp.status === 'error' || resp.error)) ? (resp.message || resp.error) : '',
          msg: (resp && resp.message) ? resp.message : '',
          messages: (resp && resp.message) ? [resp.message] : (resp && resp.error ? [resp.error] : []),
          isSuccess: isOk
        };
      },
      defaultHandlerSuccess(data) {
        const editor = this.j || this.jodit;
        if (!editor) return;

        const files = data.files || [];
        if (!files.length && data.url) files.push(data.url);
        if (!files.length) return;

        const imgs = files
          .map(f => {
            const src = f.startsWith('http') ? f : `${API_BASE}${f}`;
            return `<p><img src="${src}" alt="blog-illustration" style="max-width:100%;height:auto;border-radius:14px;margin:12px 0;display:block;box-shadow:0 8px 20px -4px rgba(0,0,0,0.12);" /></p><p></p>`;
          })
          .join('');

        if (editor.selection && typeof editor.selection.insertHTML === 'function') {
          editor.selection.insertHTML(imgs);
        } else {
          editor.value = (editor.value || '') + imgs;
        }

        setFormData(prev => ({ ...prev, content: editor.value }));

        try { editor.e.fire('closeAll'); } catch (_) { }
        toast.success('Image inserted into article!');
      },
    },
  }), [API_BASE]);

  // Helper: Word count & read time
  const readingStats = useMemo(() => {
    const rawText = (formData.content || '').replace(/<[^>]*>?/gm, ' ').trim();
    const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 180));
    return { wordCount, readTime, charCount: rawText.length };
  }, [formData.content]);

  const inlineImageInputRef = useRef(null);

  // Quick 1-click inline image uploader for the editor
  const handleInlineImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('image', file);
    const loadingToast = toast.loading('Uploading and inserting image...');

    try {
      const res = await axios.post(`${API_BASE}api/blogs/upload_blog_image.php`, body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success' && res.data.url) {
        const src = res.data.url.startsWith('http') ? res.data.url : `${API_BASE}${res.data.url}`;
        const imgHtml = `<p><img src="${src}" alt="blog-image" style="max-width:100%;height:auto;border-radius:14px;margin:14px 0;display:block;box-shadow:0 8px 20px -4px rgba(0,0,0,0.12);" /></p><p></p>`;

        handleInsertSnippet(imgHtml);
        toast.dismiss(loadingToast);
        toast.success('Image inserted into article!');
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.data.message || 'Image upload failed');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Error uploading image');
    } finally {
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = '';
    }
  };

  // Insert Template Snippet into Jodit
  const handleInsertSnippet = (snippetHtml) => {
    if (editorRef.current) {
      const editor = editorRef.current.editor || editorRef.current;
      if (editor && editor.selection) {
        editor.selection.insertHTML(snippetHtml);
        setFormData(prev => ({ ...prev, content: editor.value }));
        toast.success('Template block inserted!');
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      content: (prev.content || '') + snippetHtml
    }));
    toast.success('Template block inserted!');
  };

  // 1. Fetch Blogs
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/blogs/get_blogs.php`, {
        params: {
          role: 'admin',
          category: selectedCategory === 'All' ? 'all' : selectedCategory,
          status: selectedStatus,
          search: searchTerm,
          user_id: currentUser?.id
        }
      });
      if (res.data.status === 'success') {
        setBlogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch blogs', err);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Open Editor (New / Edit)
  const handleOpenEditor = (blog = null) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title || '',
        category: blog.category || 'Guidelines',
        summary: blog.summary || '',
        content: blog.content || '',
        cover_image: blog.cover_image || '',
        status: blog.status || 'published',
        is_pinned: Boolean(blog.is_pinned)
      });
    } else {
      setEditingBlog(null);
      setFormData({
        title: '',
        category: 'Guidelines',
        summary: '',
        content: '',
        cover_image: '',
        status: 'published',
        is_pinned: false
      });
    }
    setEditorMode('write');
    setIsEditorOpen(true);
  };

  // 3. Cover Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('image', file);
    setUploadingImage(true);

    try {
      const res = await axios.post(`${API_BASE}api/blogs/upload_blog_image.php`, body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setFormData(prev => ({ ...prev, cover_image: res.data.url }));
        toast.success('Cover image attached!');
      } else {
        toast.error(res.data.message || 'Image upload failed');
      }
    } catch (err) {
      toast.error('Error uploading cover image');
    } finally {
      setUploadingImage(false);
    }
  };

  // 4. Save Blog
  const handleSaveBlog = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and full content are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingBlog) {
        // Update
        const res = await axios.post(`${API_BASE}api/blogs/update_blog.php`, {
          id: editingBlog.id,
          ...formData
        });
        if (res.data.status === 'success') {
          toast.success('Blog updated successfully!');
          setIsEditorOpen(false);
          fetchBlogs();
        } else {
          toast.error(res.data.message || 'Failed to update blog');
        }
      } else {
        // Create
        const res = await axios.post(`${API_BASE}api/blogs/create_blog.php`, {
          author_id: currentUser?.id || 1,
          ...formData
        });
        if (res.data.status === 'success') {
          toast.success('🎉 Academy post published successfully!');
          setIsEditorOpen(false);
          fetchBlogs();
        } else {
          toast.error(res.data.message || 'Failed to create blog');
        }
      }
    } catch (err) {
      console.error('Blog save error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error saving blog post';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // 5. Delete Blog
  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog post and its discussions?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/blogs/delete_blog.php`, { id: blogId });
      if (res.data.status === 'success') {
        toast.success('Blog deleted.');
        setBlogs(prev => prev.filter(b => b.id !== blogId));
        if (viewingBlog?.id === blogId) setViewingBlog(null);
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting blog');
    }
  };

  // 6. View Readership
  const handleOpenReaders = async (blogId) => {
    setReadersModalBlogId(blogId);
    setReadersLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/blogs/get_blog_readers.php?blog_id=${blogId}`);
      if (res.data.status === 'success') {
        setReadersData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load readership details');
    } finally {
      setReadersLoading(false);
    }
  };

  // Metrics
  const totalPublished = blogs.filter(b => b.status === 'published').length;
  const totalReads = blogs.reduce((acc, b) => acc + (b.readers_count || 0), 0);
  const totalComments = blogs.reduce((acc, b) => acc + (b.comments_count || 0), 0);

  return (
    <div className="p-4 mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300 ">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20">
              <FiBookOpen size={24} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Academy Feed & Knowledge Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Author and publish official guidelines, design tips, and notices with rich formatting & fast staff takeaways.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenEditor(null)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <FiPlus size={18} />
          <span>Create New Post</span>
        </button>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FiFileText size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Published Posts</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalPublished}</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FiUsers size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Staff Reads</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalReads}</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FiMessageSquare size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discussion Comments</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalComments}</p>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guidelines, topics, keywords..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── BLOGS GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
          <FiBookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No blog posts found</h3>
          <p className="text-xs text-slate-400 mt-1">Create your first comprehensive guideline or announcement above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => {
            const catColor = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS['General'];
            const coverUrl = blog.cover_image ? (blog.cover_image.startsWith('http') ? blog.cover_image : `${API_BASE}${blog.cover_image}`) : null;

            return (
              <div
                key={blog.id}
                onClick={() => navigate(`/blogs/${blog.id}`)}
                className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-2xl hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
              >
                {/* Cover Image */}
                {coverUrl ? (
                  <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={coverUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {blog.is_pinned && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                        <FiStar size={12} className="fill-white" /> Pinned
                      </span>
                    )}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${blog.status === 'published' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-800/90 text-slate-300 border-slate-700'
                      }`}>
                      {blog.status}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 pb-0 flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${catColor}`}>
                      {blog.category}
                    </span>
                    {blog.is_pinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                        <FiStar size={11} className="fill-amber-500" /> Pinned
                      </span>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {coverUrl && (
                      <span className={`inline-block mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${catColor}`}>
                        {blog.category}
                      </span>
                    )}
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {blog.title}
                    </h3>

                    {/* Quick 1-Min Summary Snippet */}
                    {blog.summary && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-300/90 line-clamp-2">
                        <span className="font-bold text-[10px] uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                          <HiSparkles size={12} /> 1-Min Takeaway:
                        </span>
                        {blog.summary}
                      </div>
                    )}
                  </div>

                  {/* Readership Pill & Stats */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">

                    {/* Readership button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReaders(blog.id);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                      title="View Staff Readership Details"
                    >
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <FiUsers size={13} className="text-indigo-500" />
                        <span>Staff Readers</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
                        {blog.readers_count} Readers
                      </span>
                    </button>

                    {/* Meta & Actions */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px]" title="Views">
                          <FiEye size={12} /> {blog.views_count}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" title="Comments">
                          <FiMessageSquare size={12} /> {blog.comments_count}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" title="Reactions">
                          <FiHeart size={12} /> {blog.reactions_count}
                        </span>
                      </div>

                      {/* View / Edit / Delete Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/blogs/${blog.id}`);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="Open Full Post Page"
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditor(blog);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Edit Post"
                        >
                          <FiEdit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlog(blog.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete Post"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── HIGH-LEVEL RICH CREATE / EDIT MODAL ── */}
      {isEditorOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditorOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-5 sm:p-7 max-w-5xl w-full max-h-[94vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-5 relative flex flex-col">

            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20">
                  <FiEdit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {editingBlog ? 'Edit Academy Post' : 'Create New Academy Post'}
                  </h3>
                  <p className="text-xs text-slate-400">High-level rich editor for official guidelines, design tips, and notices</p>
                </div>
              </div>

              {/* Top Action Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEditorMode('write')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${editorMode === 'write'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    <FiEdit3 size={13} />
                    <span>Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${editorMode === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    <FiEye size={13} />
                    <span>Live Preview</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {editorMode === 'write' ? (
              <form onSubmit={handleSaveBlog} className="space-y-4">

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Official Design Quality Standards for 2026"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm sm:text-base font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>

                {/* Category, Status, Pinned & Cover Photo */}
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
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
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
                      <option value="published">Published (Visible to all staff)</option>
                      <option value="draft">Draft (Saved only)</option>
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
                      <span>📌 Pin to Top Announcement</span>
                    </label>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Hero Cover Image (Optional)
                      </label>
                      <p className="text-[11px] text-slate-400">Recommended size: 1200x630 (PNG, WEBP, JPG)</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                        <FiUploadCloud size={16} />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Cover Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>

                      {formData.cover_image && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          <FiCheck size={14} /> Attached
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, cover_image: '' })}
                            className="text-rose-500 hover:underline text-[11px]"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.cover_image && (
                    <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 w-full max-w-sm">
                      <img
                        src={formData.cover_image.startsWith('http') ? formData.cover_image : `${API_BASE}${formData.cover_image}`}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* ⚡ Quick 1-Minute Summary (Time Saver) */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <HiSparkles size={15} className="text-amber-500" />
                      <span>⚡ Quick 1-Minute Takeaway (Staff Summary)</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-200/50 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-md">
                      Time Saver for Staff
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="• 3-4 bullet points highlighting the core rules/takeaways..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Rich WYSIWYG Editor Section */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Full Article Content & Instructions *
                      </label>
                      <p className="text-[11px] text-slate-400">Format headings, drop images, insert checklists, tables, and callouts below</p>
                    </div>

                    {/* Word count & read time indicator */}
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <FiClock size={12} className="text-indigo-500" /> {readingStats.readTime} min read
                      </span>
                      <span>•</span>
                      <span>{readingStats.wordCount} words</span>
                    </div>
                  </div>

                  {/* ⚡ Quick Format Templates / Blocks Insert Toolbar */}
                  <div className="p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">
                      Insert Blocks:
                    </span>
                    {TEMPLATE_SNIPPETS.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleInsertSnippet(tmpl.html)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold transition-all shadow-2xs hover:border-indigo-400 flex items-center gap-1 cursor-pointer"
                        title={`Insert ${tmpl.name}`}
                      >
                        <span>{tmpl.icon}</span>
                        <span>{tmpl.name}</span>
                      </button>
                    ))}

                    {/* Quick 1-Click Upload & Insert Image */}
                    <label className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
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

                  {/* Jodit WYSIWYG Container */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all bg-white dark:bg-slate-900">
                    <JoditEditor
                      ref={editorRef}
                      value={formData.content}
                      config={joditConfig}
                      onBlur={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
                      onChange={(newContent) => { }}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiEye size={14} />
                    <span>Preview Result</span>
                  </button>

                  <div className="flex items-center gap-3">
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
                      {saving ? 'Saving...' : editingBlog ? 'Update Post' : 'Publish to Feed'}
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              /* ── LIVE PREVIEW MODE ── */
              <div className="space-y-6 py-2">
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 text-xs font-bold">
                    <FiEye size={16} />
                    <span>Live Staff Preview — This is exactly how staff members will see the article.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorMode('write')}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                  >
                    Back to Editor
                  </button>
                </div>

                {/* Rendered Preview Card */}
                <div className="p-6 sm:p-8 rounded-[2rem] bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-6">

                  {/* Badges */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${CATEGORY_COLORS[formData.category] || CATEGORY_COLORS['General']}`}>
                      {formData.category}
                    </span>
                    {formData.is_pinned && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <FiStar size={12} className="fill-slate-950" /> Pinned Announcement
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <FiClock size={13} className="text-indigo-500" /> {readingStats.readTime} min read
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                    {formData.title || 'Untitled Blog Post'}
                  </h1>

                  {/* ⚡ Summary */}
                  {formData.summary && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border-2 border-amber-400/40 dark:border-amber-500/30 p-5 sm:p-6 shadow-md">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                          <HiSparkles size={20} />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                            ⚡ Quick 1-Minute Takeaway
                          </h3>
                          <div className="text-xs sm:text-sm leading-relaxed text-amber-950 dark:text-amber-100 font-medium whitespace-pre-line">
                            {formData.summary}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cover Photo */}
                  {formData.cover_image && (
                    <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg max-h-[420px] bg-slate-900 flex items-center justify-center">
                      <img
                        src={formData.cover_image.startsWith('http') ? formData.cover_image : `${API_BASE}${formData.cover_image}`}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Full Article Content */}
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-sans space-y-4 selection:bg-indigo-500/30 [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:p-2.5 [&_table_td]:border [&_table_td]:p-2.5 [&_img]:rounded-2xl [&_pre]:rounded-2xl"
                    dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-slate-400 italic">No content written yet...</p>' }}
                  />
                </div>

                {/* Bottom Save bar */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditorMode('write')}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Edit Content
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBlog}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingBlog ? 'Update Post' : 'Publish to Feed'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* ── ADMIN FULL ARTICLE READING MODAL ── */}
      {viewingBlog && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingBlog(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-6 relative">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${CATEGORY_COLORS[viewingBlog.category] || CATEGORY_COLORS['General']}`}>
                  {viewingBlog.category}
                </span>
                {viewingBlog.is_pinned && (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <FiStar size={12} className="fill-slate-950" /> Pinned
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <FiClock size={13} className="text-indigo-500" /> {viewingBlog.read_time_mins || 2} min read
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = viewingBlog;
                    setViewingBlog(null);
                    handleOpenEditor(b);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiEdit3 size={14} />
                  <span>Edit Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBlog(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {viewingBlog.title}
            </h1>

            {/* Quick 1-Min Takeaway Box */}
            {viewingBlog.summary && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border-2 border-amber-400/40 dark:border-amber-500/30 p-6 shadow-md">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <HiSparkles size={22} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                      ⚡ Quick 1-Minute Takeaway (Core Summary)
                    </h3>
                    <div className="text-xs sm:text-sm leading-relaxed text-amber-950 dark:text-amber-100 font-medium whitespace-pre-line">
                      {viewingBlog.summary}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cover Image */}
            {viewingBlog.cover_image && (
              <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-h-[420px] bg-slate-900 flex items-center justify-center">
                <img
                  src={viewingBlog.cover_image.startsWith('http') ? viewingBlog.cover_image : `${API_BASE}${viewingBlog.cover_image}`}
                  alt={viewingBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Full Formatted Content */}
            <div
              className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-sans space-y-4 selection:bg-indigo-500/30 [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:p-2.5 [&_table_td]:border [&_table_td]:p-2.5 [&_img]:rounded-2xl [&_pre]:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: viewingBlog.content }}
            />

            {/* Footer Stats & Readership Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5"><FiEye size={14} /> {viewingBlog.views_count} Total Views</span>
                <span className="flex items-center gap-1.5"><FiHeart size={14} /> {viewingBlog.reactions_count} Reactions</span>
                <span className="flex items-center gap-1.5"><FiMessageSquare size={14} /> {viewingBlog.comments_count} Comments</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const id = viewingBlog.id;
                  setViewingBlog(null);
                  handleOpenReaders(id);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-500/25 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FiUsers size={14} />
                <span>View {viewingBlog.readers_count} Staff Readers</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── READERSHIP BREAKDOWN MODAL ── */}
      {readersModalBlogId && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReadersModalBlogId(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Header */}
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
                    {readersData?.blog?.title || 'Guideline Breakdown'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReadersModalBlogId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Read Stats Summary Bar */}
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

            {/* Staff List */}
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

export default AcademyBlog;
