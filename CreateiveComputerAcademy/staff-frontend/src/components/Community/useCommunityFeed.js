import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

export default function useCommunityFeed({ currentUser, apiBase = '' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingComment, setSubmittingComment] = useState({});

  const fileInputRef = useRef(null);

  // Fetch Feed
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    if (!currentUser?.id) return;
    try {
      if (!append) setLoading(true);
      const res = await axios.get(`${apiBase}api/community/get_feed.php`, {
        params: {
          user_id: currentUser.id,
          category: selectedCategory,
          filter: activeFilter,
          page: pageNum,
          limit: 15
        }
      });

      if (res.data?.status === 'success') {
        const fetchedPosts = res.data.data || [];
        setPosts(prev => (append ? [...prev, ...fetchedPosts] : fetchedPosts));
        setHasMore(Boolean(res.data.has_more));
        setPage(pageNum);
      } else {
        toast.error(res.data?.message || 'Failed to load community feed');
      }
    } catch (err) {
      console.error('Error fetching feed from server:', err);
      toast.error('Network error loading community feed');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, selectedCategory, activeFilter, apiBase]);

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
        setPosts(prev => prev.some(p => p.id === newPost.id) ? prev : [newPost, ...prev]);
      });

      channel.bind('post-liked', ({ post_id, likes_count, user_id, liked }) => {
        setPosts(prev => prev.map(p => p.id === post_id ? {
          ...p,
          likes_count,
          my_reaction: user_id === currentUser?.id ? (liked ? 'like' : null) : p.my_reaction
        } : p));
      });

      channel.bind('new-comment', ({ post_id, comment, comments_count }) => {
        setPosts(prev => prev.map(p => {
          if (p.id === post_id) {
            const list = p.comments || [];
            return {
              ...p,
              comments_count,
              comments: list.some(c => c.id === comment.id) ? list : [...list, comment]
            };
          }
          return p;
        }));
      });

      channel.bind('post-pinned', ({ post_id, is_pinned }) => {
        setPosts(prev => prev.map(p => p.id === post_id ? { ...p, is_pinned } : p));
      });

      channel.bind('post-deleted', ({ post_id }) => {
        setPosts(prev => prev.filter(p => p.id !== post_id));
      });
    } catch (err) {
      console.error('Pusher setup error in CommunityFeed:', err);
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
  const handleCreatePost = async (e, content, postCategory, onClear) => {
    if (e) e.preventDefault();
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
        const uploadRes = await axios.post(`${apiBase}api/community/upload_post_image.php`, formData, {
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

      const postRes = await axios.post(`${apiBase}api/community/create_post.php`, {
        user_id: currentUser.id,
        content: content.trim(),
        category: postCategory,
        image_url: uploadedImageUrl
      });

      if (postRes.data.status === 'success') {
        toast.success('🎉 Post published to Community Wall!');
        if (onClear) onClear();
        removeImage();
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

      const res = await axios.post(`${apiBase}api/community/toggle_like.php`, {
        post_id: postId,
        user_id: currentUser.id,
        reaction_type: 'like'
      });

      if (res.data?.status !== 'success') {
        fetchFeed(page, false);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      fetchFeed(page, false);
    }
  };

  // Add Comment
  const handleAddComment = async (postId, text, onClear) => {
    if (!text?.trim()) return;

    try {
      setSubmittingComment(prev => ({ ...prev, [postId]: true }));
      const res = await axios.post(`${apiBase}api/community/add_comment.php`, {
        post_id: postId,
        user_id: currentUser.id,
        comment: text.trim()
      });

      if (res.data?.status === 'success') {
        if (onClear) onClear();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const list = p.comments || [];
            return {
              ...p,
              comments_count: res.data.comments_count,
              comments: list.some(c => c.id === res.data.data.id) ? list : [...list, res.data.data]
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

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await axios.post(`${apiBase}api/community/delete_post.php`, {
        post_id: postId,
        user_id: currentUser.id
      });
      if (res.data?.status === 'success') {
        toast.success('Post deleted successfully');
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        toast.error(res.data.message || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Network error deleting post');
    }
  };

  return {
    posts,
    loading,
    hasMore,
    page,
    selectedCategory,
    setSelectedCategory,
    activeFilter,
    setActiveFilter,
    imageFile,
    imagePreview,
    isSubmitting,
    submittingComment,
    fileInputRef,
    fetchFeed,
    handleImageSelect,
    removeImage,
    handleCreatePost,
    handleToggleLike,
    handleAddComment,
    handleDeletePost
  };
}
