import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';

/**
 * Custom Hook for Task Comments & Real-time Pusher WebSockets.
 * Handles fetching, adding, editing, deleting comments and live WebSocket synchronization.
 */
export default function useTaskComments(selectedTask, currentUser, API_BASE) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);

  const fetchComments = async (taskId) => {
    setCommentsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, {
        action: 'get',
        task_id: taskId
      });
      if (res.data.status === 'success') {
        setComments(res.data.comments || []);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Load comments and subscribe to live Pusher channel when selectedTask changes
  useEffect(() => {
    if (selectedTask?.id) {
      fetchComments(selectedTask.id);

      const pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2'
      });
      const channel = pusher.subscribe(`task-comments-${selectedTask.id}`);

      channel.bind('new-comment', function (incomingComment) {
        setComments(prev => {
          if (prev.find(c => String(c.id) === String(incomingComment.id))) {
            return prev;
          }
          return [...prev, incomingComment];
        });
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        pusher.disconnect();
      };
    } else {
      setComments([]);
    }
  }, [selectedTask?.id]);

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if ((!newComment.trim() && !commentImage) || !selectedTask) return;
    setAddingComment(true);

    const formData = new FormData();
    formData.append('action', 'add');
    formData.append('task_id', selectedTask.id);
    formData.append('user_id', currentUser?.id);
    formData.append('comment', newComment.trim());
    if (commentImage) {
      formData.append('image', commentImage);
    }

    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setComments(prev => {
          if (prev.find(c => String(c.id) === String(res.data.comment.id))) {
            return prev;
          }
          return [...prev, res.data.comment];
        });
        setNewComment('');
        setCommentImage(null);
        setCommentImagePreview(null);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, {
        action: 'delete',
        comment_id: commentId,
        user_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}api/tasks/task_comments.php`, {
        action: 'update',
        comment_id: commentId,
        user_id: currentUser?.id,
        comment: editCommentText.trim()
      });
      if (res.data.status === 'success') {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment: editCommentText.trim() } : c));
        setEditingCommentId(null);
        setEditCommentText('');
      }
    } catch (err) {
      console.error('Failed to update comment', err);
    }
  };

  return {
    comments,
    setComments,
    newComment,
    setNewComment,
    commentsLoading,
    addingComment,
    commentsEndRef,
    editingCommentId,
    setEditingCommentId,
    editCommentText,
    setEditCommentText,
    commentImage,
    setCommentImage,
    commentImagePreview,
    setCommentImagePreview,
    fetchComments,
    handleAddComment,
    handleDeleteComment,
    handleSaveEdit
  };
}

