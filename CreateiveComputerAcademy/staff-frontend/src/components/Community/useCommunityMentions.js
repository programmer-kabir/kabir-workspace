import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { DEFAULT_MENTION_USERS, KNOWN_USERNAMES } from './communityUtils.jsx';

export default function useCommunityMentions({
  content,
  setContent,
  commentInputs,
  setCommentInputs,
  apiBase = ''
}) {
  const [mentionUsers, setMentionUsers] = useState(DEFAULT_MENTION_USERS);
  const [mentionState, setMentionState] = useState({ active: false, query: '', target: null, startIndex: 0 });
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  // Fetch Mentionable Users (staff, reviewers, admin; excludes students)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let fetchedList = [];

        // 1. Try get_chat_users.php (live active endpoint with colleagues)
        try {
          const chatRes = await axios.post(`${apiBase}api/chat/get_chat_users.php`, { user_id: 0 });
          if (chatRes.data?.status === 'success' && Array.isArray(chatRes.data.users) && chatRes.data.users.length > 0) {
            fetchedList = chatRes.data.users;
          }
        } catch {
          // ignore and fallback
        }

        // 2. Try get_mention_users.php
        if (fetchedList.length === 0) {
          try {
            const mentionRes = await axios.get(`${apiBase}api/community/get_mention_users.php`);
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
        console.error('Error fetching mentionable users:', e);
      }
    };
    fetchUsers();
  }, [apiBase]);

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

  return {
    mentionState,
    filteredMentionUsers,
    selectedMentionIdx,
    handleContentChange,
    handleCommentInputChange,
    handleSelectMention,
    handleMentionKeyDown
  };
}

