import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useAuth } from '../context/AuthContext';
import {
  FiSend,
  FiImage,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMoreVertical,
  FiTrash2,
  FiBookmark,
  FiX,
  FiRefreshCw,
  FiShield,
  FiCheckCircle
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';


const CATEGORIES = [
  { id: 'General', label: 'General', icon: '💬', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  { id: 'Announcement', label: 'Announcement', icon: '📢', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { id: 'Discussion', label: 'Discussion', icon: '💡', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { id: 'Achievement', label: 'Achievement', icon: '🎉', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { id: 'Question', label: 'Question / Help', icon: '❓', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
];

const EMOJIS = ['📢', '🎉', '👏', '🔥', '❤️', '🥭', '💯', '🚀'];

/**
 * Formats timestamps in Bangladesh Local Time (Asia/Dhaka, UTC+6)
 * Returns friendly formats like: "এখনই (Just now)", "৫ মিনিট আগে", "আজ • 10:30 AM", "গতকাল • 04:15 PM", "12 Oct, 2026 • 10:30 AM"
 */
export const formatBdDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split(/[- :]/);
    if (parts.length >= 6) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      const minute = parseInt(parts[4], 10);
      const second = parseInt(parts[5], 10);

      // UTC time corresponding to Bangladesh (+6)
      const d = new Date(Date.UTC(year, month, day, hour - 6, minute, second));
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);

      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      const mStr = minute < 10 ? '0' + minute : minute;
      const timeStr = `${h12}:${mStr} ${ampm}`;

      if (diffSec < 60 && diffSec >= 0) return 'এখনই (Just now)';
      if (diffMin < 60 && diffMin > 0) return `${diffMin} মিনিট আগে`;

      // Bangladesh Date calculation for Today / Yesterday
      const nowBd = new Date(now.getTime() + 6 * 3600 * 1000);
      const nowDay = nowBd.getUTCDate();
      const nowMonth = nowBd.getUTCMonth();
      const nowYear = nowBd.getUTCFullYear();

      if (year === nowYear && month === nowMonth && day === nowDay) {
        return `আজ • ${timeStr}`;
      }

      const yestBd = new Date(now.getTime() + 6 * 3600 * 1000 - 86400 * 1000);
      if (year === yestBd.getUTCFullYear() && month === yestBd.getUTCMonth() && day === yestBd.getUTCDate()) {
        return `গতকাল • ${timeStr}`;
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[month]}, ${year} • ${timeStr}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const DEFAULT_MENTION_USERS = [
  { id: 1, name: 'Creative Computer Academy', username: 'admin', avatar: 'uploads/profiles/cca_academy.webp', role: 'Admin' },
  { id: 2, name: 'KABIR HOSSEN', username: 'kabir', avatar: 'uploads/profiles/profile_2_1787112027.jpg', role: 'Staff' },
  { id: 3, name: 'Ashraful Islam Siam', username: 'siam', avatar: 'uploads/profiles/profile_3_1788405288.jpg', role: 'Staff' },
  { id: 4, name: 'Jahidul PSD', username: 'jahidul', avatar: 'uploads/profiles/profile_4_1786956529.jpeg', role: 'Staff' },
  { id: 5, name: 'KalamCreativeStudio', username: 'kalam', avatar: 'uploads/profiles/profile_5_1791353072.jpeg', role: 'Staff' },
  { id: 6, name: 'Rahima Akter', username: 'rahima', avatar: 'uploads/profiles/profile_6_1789038881.jpg', role: 'Staff' },
  { id: 7, name: 'Happy Akter', username: 'happy', avatar: 'uploads/profiles/profile_7_1790734417.jpg', role: 'Staff' },
  { id: 8, name: 'Akhi Akter', username: 'akhi', avatar: 'uploads/profiles/profile_8_1786937895.png', role: 'Staff' },
  { id: 10, name: 'Shahin Alam', username: 'shahin', avatar: null, role: 'Staff' },
  { id: 14, name: 'Sonia Akter', username: 'sonia', avatar: 'uploads/profiles/profile_14_1790947166.webp', role: 'Staff' },
  { id: 15, name: 'MAHFUJA AKTER', username: 'mahfuja', avatar: null, role: 'Staff' },
  { id: 16, name: 'Fahad Sikdar', username: 'fahad', avatar: null, role: 'Staff' },
  { id: 17, name: 'Maruf Mia', username: 'maruf', avatar: null, role: 'Staff' }
];

const KNOWN_USERNAMES = {
  1: 'admin',
  2: 'kabir',
  3: 'siam',
  4: 'jahidul',
  5: 'kalam',
  6: 'rahima',
  7: 'happy',
  8: 'akhi',
  10: 'shahin',
  14: 'sonia',
  15: 'mahfuja',
  16: 'fahad',
  17: 'maruf'
};

export default function CommunityWallView({ setActiveTab }) {
  const { currentUser, getApiBase } = useAuth();
  const API_BASE = getApiBase ? getApiBase() : (import.meta.env.VITE_API_BASE_URL || '');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pinned' | 'my_posts'

  // Mention State
  const [mentionUsers, setMentionUsers] = useState(DEFAULT_MENTION_USERS);
  const [mentionState, setMentionState] = useState({ active: false, query: '', target: null, startIndex: 0 });
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  // Composer State
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('Announcement');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch active users for @mention autocomplete (includes all staff, reviewers, and admin; excludes students)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let fetchedList = [];

        // 1. Try get_chat_users.php (live active endpoint with all real colleagues)
        try {
          const chatRes = await axios.post(`${API_BASE}api/chat/get_chat_users.php`, { user_id: 0 });
          if (chatRes.data?.status === 'success' && Array.isArray(chatRes.data.users) && chatRes.data.users.length > 0) {
            fetchedList = chatRes.data.users;
          }
        } catch {
          // ignore
        }

        // 2. Try get_mention_users.php
        if (fetchedList.length === 0) {
          try {
            const mentionRes = await axios.get(`${API_BASE}api/community/get_mention_users.php`);
            if (mentionRes.data?.status === 'success' && Array.isArray(mentionRes.data.users) && mentionRes.data.users.length > 0) {
              fetchedList = mentionRes.data.users;
            }
          } catch {
            // ignore
          }
        }

        if (fetchedList.length > 0) {
          const formatted = fetchedList
            .filter(u => {
              const r = (u.role_name || u.role || '').toLowerCase();
              return r !== 'student';
            })
            .map(u => {
              const rawRole = (u.role_name || u.role || 'staff').toLowerCase();
              const displayRole = rawRole === 'admin' ? 'Admin' : 'Staff';
              const username = u.username || KNOWN_USERNAMES[u.id] || (u.email ? u.email.split('@')[0] : u.name?.toLowerCase().replace(/\s+/g, '_'));
              return {
                id: u.id,
                name: u.name,
                username: username,
                avatar: u.profile_picture || u.avatar || null,
                role: displayRole,
                email: u.email || ''
              };
            });

          if (formatted.length > 0) {
            setMentionUsers(formatted);
          }
        }
      } catch (e) {
        console.error('Error fetching mentionable users in Admin:', e);
      }
    };
    fetchUsers();
  }, []);

  const filteredMentionUsers = useMemo(() => {
    if (!mentionState.active) return [];
    const q = (mentionState.query || '').toLowerCase().trim();
    return mentionUsers.filter(u => {
      if (!q) return true;
      const uname = (u.username || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return uname.includes(q) || name.includes(q) || email.includes(q);
    }).slice(0, 10);
  }, [mentionUsers, mentionState.active, mentionState.query]);

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_.]*)$/);
    if (match) {
      const q = match[1];
      setMentionState({
        active: true,
        query: q,
        target: 'composer',
        startIndex: cursor - q.length - 1
      });
      setSelectedMentionIdx(0);
    } else {
      setMentionState(prev => (prev.active && prev.target === 'composer' ? { ...prev, active: false } : prev));
    }
  };

  const handleCommentInputChange = (postId, e) => {
    const val = e.target.value;
    setCommentInputs(prev => ({ ...prev, [postId]: val }));
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_.]*)$/);
    if (match) {
      const q = match[1];
      setMentionState({
        active: true,
        query: q,
        target: `comment_${postId}`,
        startIndex: cursor - q.length - 1
      });
      setSelectedMentionIdx(0);
    } else {
      setMentionState(prev => (prev.active && prev.target === `comment_${postId}` ? { ...prev, active: false } : prev));
    }
  };

  const handleSelectMention = (user) => {
    if (mentionState.target === 'composer') {
      const before = content.slice(0, mentionState.startIndex);
      const after = content.slice(mentionState.startIndex + mentionState.query.length + 1);
      setContent(`${before}@${user.username} ${after}`);
      setMentionState({ active: false, query: '', target: null, startIndex: 0 });
    } else if (mentionState.target?.startsWith('comment_')) {
      const pId = mentionState.target.replace('comment_', '');
      const cur = commentInputs[pId] || '';
      const before = cur.slice(0, mentionState.startIndex);
      const after = cur.slice(mentionState.startIndex + mentionState.query.length + 1);
      setCommentInputs(prev => ({ ...prev, [pId]: `${before}@${user.username} ${after}` }));
      setMentionState({ active: false, query: '', target: null, startIndex: 0 });
    }
  };

  const handleMentionKeyDown = (e) => {
    if (!mentionState.active || filteredMentionUsers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIdx(prev => (prev + 1) % filteredMentionUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIdx(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredMentionUsers[selectedMentionIdx]) {
        e.preventDefault();
        handleSelectMention(filteredMentionUsers[selectedMentionIdx]);
      }
    } else if (e.key === 'Escape') {
      setMentionState({ active: false, query: '', target: null, startIndex: 0 });
    }
  };

  // Fetch Feed from Server
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    if (!currentUser?.id) return;
    try {
      if (!append) setLoading(true);
      const res = await axios.get(`${API_BASE}api/community/get_feed.php`, {
        params: {
          user_id: currentUser.id,
          category: selectedCategory,
          filter: activeFilter,
          page: pageNum,
          limit: 15
        }
      });

      if (res.data.status === 'success') {
        const fetchedPosts = res.data.data || [];
        setPosts(prev => append ? [...prev, ...fetchedPosts] : fetchedPosts);
        setHasMore(Boolean(res.data.has_more));
        setPage(pageNum);
      } else {
        toast.error(res.data.message || 'Failed to load community feed');
      }
    } catch (err) {
      console.error('Error fetching feed from server:', err);
      toast.error('Network error loading community feed');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, selectedCategory, activeFilter]);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Realtime Pusher Subscriptions
  useEffect(() => {
    let pusher = null;
    try {
      pusher = new Pusher('82a63711fed4b73bd74d', { cluster: 'ap2', forceTLS: true });
      const channel = pusher.subscribe('community-channel');

      channel.bind('new-post', (newPost) => {
        setPosts(prev => {
          if (prev.some(p => p.id === newPost.id)) return prev;
          return [newPost, ...prev];
        });
      });

      channel.bind('post-liked', ({ post_id, likes_count, user_id, liked }) => {
        setPosts(prev => prev.map(p => {
          if (p.id === post_id) {
            const isMe = user_id === currentUser?.id;
            return {
              ...p,
              likes_count,
              my_reaction: isMe ? (liked ? 'like' : null) : p.my_reaction
            };
          }
          return p;
        }));
      });

      channel.bind('new-comment', ({ post_id, comment, comments_count }) => {
        setPosts(prev => prev.map(p => {
          if (p.id === post_id) {
            const currentComments = p.comments || [];
            const alreadyExists = currentComments.some(c => c.id === comment.id);
            return {
              ...p,
              comments_count,
              comments: alreadyExists ? currentComments : [...currentComments, comment]
            };
          }
          return p;
        }));
      });

      channel.bind('post-pinned', ({ post_id, is_pinned }) => {
        setPosts(prev => prev.map(p => (p.id === post_id ? { ...p, is_pinned } : p)));
      });

      channel.bind('post-deleted', ({ post_id }) => {
        setPosts(prev => prev.filter(p => p.id !== post_id));
      });

    } catch (err) {
      console.error('Pusher setup error in Admin CommunityWall:', err);
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe('community-channel');
        pusher.disconnect();
      }
    };
  }, [currentUser?.id]);

  // Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
      toast.error('Write some text or attach an image.');
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedImageUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await axios.post(`${API_BASE}api/community/upload_post_image.php`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.status === 'success') {
          uploadedImageUrl = uploadRes.data.image_url;
        } else {
          toast.error(uploadRes.data.message || 'Image upload failed');
          setIsSubmitting(false);
          return;
        }
      }

      const postRes = await axios.post(`${API_BASE}api/community/create_post.php`, {
        user_id: currentUser.id,
        content: content.trim(),
        category: postCategory,
        image_url: uploadedImageUrl
      });

      if (postRes.data.status === 'success') {
        toast.success('📢 Announcement posted to Community Wall!');
        setContent('');
        removeImage();
        setPostCategory('Announcement');
      } else {
        toast.error(postRes.data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Network error creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Pin / Unpin Post
  const handleTogglePin = async (postId, currentPinStatus) => {
    try {
      const newPin = currentPinStatus ? 0 : 1;
      const res = await axios.post(`${API_BASE}api/community/pin_post.php`, {
        post_id: postId,
        admin_id: currentUser.id,
        is_pinned: newPin
      });
      if (res.data.status === 'success') {
        toast.success(newPin ? '📌 Post pinned to top of wall' : 'Post unpinned');
        setPosts(prev => prev.map(p => (p.id === postId ? { ...p, is_pinned: newPin } : p)));
      } else {
        toast.error(res.data.message || 'Failed to update pin');
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
      toast.error('Failed to pin/unpin post');
    }
  };

  // Admin Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Admin Moderation: Are you sure you want to delete this post?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/community/delete_post.php`, {
        post_id: postId,
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        toast.success('Post removed by administrator');
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        toast.error(res.data.message || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };

  // Toggle Like
  const handleToggleLike = async (postId) => {
    try {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.my_reaction === 'like';
          return {
            ...p,
            my_reaction: isLiked ? null : 'like',
            likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1
          };
        }
        return p;
      }));

      await axios.post(`${API_BASE}api/community/toggle_like.php`, {
        post_id: postId,
        user_id: currentUser.id,
        reaction_type: 'like'
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      fetchFeed(page, false);
    }
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      setSubmittingComment(prev => ({ ...prev, [postId]: true }));
      const res = await axios.post(`${API_BASE}api/community/add_comment.php`, {
        post_id: postId,
        user_id: currentUser.id,
        comment: text
      });

      if (res.data.status === 'success') {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const currentComments = p.comments || [];
            const alreadyHas = currentComments.some(c => c.id === res.data.data.id);
            return {
              ...p,
              comments_count: res.data.comments_count,
              comments: alreadyHas ? currentComments : [...currentComments, res.data.data]
            };
          }
          return p;
        }));
      } else {
        toast.error(res.data.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Network error adding comment');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_.]{3,40})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.5 rounded-md hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const currentAvatar = currentUser?.profile_picture
    ? `${API_BASE}${currentUser.profile_picture}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Admin')}&background=4F46E5&color=fff`;

  return (
    <div className="mx-auto space-y-6 animate-fadeIn pb-16 select-text">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-blue-600/10 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 p-6 md:p-8 rounded-3xl border border-indigo-500/20 dark:border-indigo-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700/60 text-indigo-800 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-2">
            <FiShield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Admin Moderation & Social Wall</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Community Wall</span>
            <span className="text-2xl">🏛️</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Post official academy announcements, recognize staff milestones, moderate community discussions, and pin urgent notices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchFeed(1, false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Wall</span>
        </button>
      </div>

      {/* 2. Admin Broadcast Composer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3.5">
          <img
            src={currentAvatar}
            alt="Admin Avatar"
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-xs shrink-0"
          />
          <div className="flex-1 space-y-3 relative">
            <textarea
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleMentionKeyDown}
              placeholder="Post an official notice, congratulations, or announcement to all staff members... (Type @ to mention colleagues)"
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 resize-none transition"
            />

            {/* Mention Suggestions Popup (Composer) */}
            {mentionState.active && mentionState.target === 'composer' && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <div className="px-3 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/70 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  <span>Tag Colleague (@{mentionState.query})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Esc to close &bull; Enter to select</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMentionUsers.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No colleagues matching @{mentionState.query}</div>
                  ) : (
                    filteredMentionUsers.map((u, i) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectMention(u)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition cursor-pointer ${
                          i === selectedMentionIdx
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <img
                          src={u.avatar ? `${API_BASE}${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D8ABC&color=fff`}
                          alt={u.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate text-[12px]">{u.name}</div>
                          <div className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold">@{u.username}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                          {u.role || 'Staff'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-64 shadow-md group">
                <img src={imagePreview} alt="Attached Preview" className="max-h-64 object-contain rounded-2xl" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition cursor-pointer shadow-md"
                  title="Remove image"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Emojis */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm select-none">
              <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Quick Symbols:</span>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setContent(prev => prev + ' ' + emoji)}
                  className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition text-sm cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <FiImage className="w-4 h-4 text-emerald-500" />
                  <span>Attach Image</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    <span>Broadcast Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Chips & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer whitespace-nowrap border ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            🌐 All Topics
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id.toLowerCase())}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === cat.id.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Stream
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pinned')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'pinned'
                ? 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📌</span>
            <span>Pinned</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('my_posts')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeFilter === 'my_posts'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Notices
          </button>
        </div>
      </div>

      {/* 4. Stream Feed Cards */}
      {loading && posts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <FiRefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading Community Wall...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 p-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🏛️
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">No Posts on Wall</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Broadcast an academy notice or milestone announcement above to get the wall started.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const author = post.author || {};
            const categoryMeta = CATEGORIES.find(c => c.id.toLowerCase() === (post.category || '').toLowerCase()) || CATEGORIES[0];
            const isLiked = post.my_reaction === 'like';
            const showComments = Boolean(openComments[post.id]);
            const postComments = post.comments || [];

            const authorAvatar = author.avatar
              ? `${API_BASE}${author.avatar}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || 'User')}&background=4F46E5&color=fff`;

            return (
              <div
                key={post.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border ${
                  post.is_pinned
                    ? 'border-amber-400/80 dark:border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                } p-5 md:p-6 transition hover:border-indigo-400/50 space-y-4 relative`}
              >
                {/* Pinned Announcement Bar */}
                {post.is_pinned === 1 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700/60 mb-1">
                    <span>📌</span>
                    <span>Pinned Announcement</span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={authorAvatar}
                      alt={author.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {author.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          @{author.username}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                          {author.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span>{author.designation || 'Staff'}</span>
                        <span>&bull;</span>
                        <span>{author.department || 'Academy'}</span>
                        <span>&bull;</span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{formatBdDateTime(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header Badges & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${categoryMeta.color}`}>
                      <span>{categoryMeta.icon}</span>
                      <span>{categoryMeta.label}</span>
                    </span>

                    {/* Admin Pin Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(post.id, post.is_pinned)}
                      className={`p-2 rounded-xl transition cursor-pointer border ${
                        post.is_pinned
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700'
                      }`}
                      title={post.is_pinned ? 'Unpin post' : 'Pin to top of wall'}
                    >
                      <FiBookmark className={`w-3.5 h-3.5 ${post.is_pinned ? 'fill-amber-500' : ''}`} />
                    </button>

                    {/* Admin Delete Action */}
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      title="Admin Moderation: Delete post"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Post Body */}
                {post.content && (
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                    {renderFormattedContent(post.content)}
                  </p>
                )}

                {/* Post Image */}
                {post.image_url && (
                  <div
                    onClick={() => setLightboxImage(`${API_BASE}${post.image_url}`)}
                    className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 max-h-[460px] cursor-pointer group relative bg-slate-950/5 flex items-center justify-center"
                  >
                    <img
                      src={`${API_BASE}${post.image_url}`}
                      alt="Post Attachment"
                      className="w-full h-auto max-h-[460px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      <span>Click to view full image</span>
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                        isLiked
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <FiHeart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span>{post.likes_count || 0}</span>
                      <span className="hidden sm:inline">{post.likes_count === 1 ? 'Like' : 'Likes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer font-bold"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0}</span>
                      <span className="hidden sm:inline">{post.comments_count === 1 ? 'Comment' : 'Comments'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                    title="Copy wall link"
                  >
                    <FiShare2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fadeIn">
                    {postComments.length > 0 && (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {postComments.map((c) => {
                          const cAuthor = c.author || {};
                          const cAvatar = cAuthor.avatar
                            ? `${API_BASE}${cAuthor.avatar}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor.name || 'User')}&background=4F46E5&color=fff`;

                          return (
                            <div key={c.id} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                              <img src={cAvatar} alt={cAuthor.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                      {cAuthor.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      @{cAuthor.username}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {formatBdDateTime(c.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                                  {renderFormattedContent(c.comment)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2.5 pt-1 relative">
                      <img src={currentAvatar} alt="My Avatar" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => handleCommentInputChange(post.id, e)}
                          onKeyDown={(e) => {
                            if (mentionState.active && mentionState.target === `comment_${post.id}`) {
                              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
                                handleMentionKeyDown(e);
                                return;
                              }
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                if (filteredMentionUsers[selectedMentionIdx]) {
                                  e.preventDefault();
                                  handleSelectMention(filteredMentionUsers[selectedMentionIdx]);
                                  return;
                                }
                              }
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Write an administrative comment or response... (Type @ to tag)"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                        />

                        {/* Comment Mention Autocomplete Dropdown */}
                        {mentionState.active && mentionState.target === `comment_${post.id}` && (
                          <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                            <div className="px-3 py-1 bg-indigo-50/70 dark:bg-indigo-950/70 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                              <span>Tag Colleague (@{mentionState.query})</span>
                              <span className="text-[9px] text-slate-400">Esc to close &bull; Enter to select</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                              {filteredMentionUsers.length === 0 ? (
                                <div className="p-2 text-xs text-slate-400 text-center">No colleagues matching @{mentionState.query}</div>
                              ) : (
                                filteredMentionUsers.map((u, i) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleSelectMention(u)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                                      i === selectedMentionIdx
                                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <img
                                      src={u.avatar ? `${API_BASE}${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D8ABC&color=fff`}
                                      alt={u.name}
                                      className="w-6 h-6 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold truncate text-[11px]">{u.name}</div>
                                      <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">@{u.username}</div>
                                    </div>
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                                      {u.role || 'Staff'}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {submittingComment[post.id] ? '...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => fetchFeed(page + 1, true)}
                className="px-6 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer"
              >
                Load Older Posts ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
            <img src={lightboxImage} alt="Expanded Attachment" className="max-w-full max-h-[88vh] object-contain" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
