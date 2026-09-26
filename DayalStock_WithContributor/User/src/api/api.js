import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../Firebase/Firebase.config";

const API_URL = import.meta.env.VITE_LOCALHOST_KEY;
const auth = getAuth(app);

// Wait for Firebase auth to be ready, then get the current user
const getCurrentUser = () => {
  return new Promise((resolve) => {
    // If already initialized, return immediately
    if (auth.currentUser !== undefined) {
      resolve(auth.currentUser);
      return;
    }
    // Otherwise wait for onAuthStateChanged to fire once
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

const getHeaders = async () => {
  const headers = { 
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_APP_SECRET
  };
  try {
    const user = await getCurrentUser();
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return headers;
};

export const getCategories = async (parentId) => {
  const url = parentId
    ? `${API_URL}/categories/get_categories.php?parent_id=${parentId}`
    : `${API_URL}/categories/get_categories.php`;
  const res = await fetch(url, { headers: await getHeaders() });
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};

export const getAllContents = async ({
  page = 1,
  limit = 48,
  subcategory_id,
  category_id,
  license_type,
  ai_generated,
  orientation,
  search,
}) => {
  let url = `${API_URL}/contents/getContents.php?page=${page}&limit=${limit}`;
  if (subcategory_id) url += `&subcategory_id=${subcategory_id}`;
  if (category_id) url += `&category_id=${category_id}`;
  if (license_type) url += `&license_type=${license_type}`;
  if (ai_generated) url += `&ai_generated=${ai_generated}`;
  if (orientation) url += `&orientation=${orientation}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const res = await fetch(url, {
    headers: await getHeaders(),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
};

export const getContentBySlug = async (slug) => {
  const url = `${API_URL}/contents/getContentBySlug.php?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, { headers: await getHeaders() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};


export const getAllAuthor = async () => {
  const url = `${API_URL}/author/get_author.php`;

  const res = await fetch(url, { headers: await getHeaders() });
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};

export const getSubscriptions = async () => {
  const url = `${API_URL}/subscriptions/get_subscriptions.php`;

  const res = await fetch(url, { headers: await getHeaders() });
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};


export const getUserSubscription = async (email) => {
  if (!email) return null;
  const url = `${API_URL}/subscriptions/get_user_subscription.php`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ email })
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data.data; // will be null if no subscription found
};


export const createUserSubscription = async (email, planId) => {
  if (!email || !planId) return null;
  const url = `${API_URL}/subscriptions/create_subscription.php`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ email, plan_id: planId })
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

// Notifications API

// User notifications (backend identifies user from JWT)
export const getNotifications = async (targetRole = 'user') => {
  const url = `${API_URL}/notifications/get_notifications.php`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ target_role: targetRole })
    });
    const data = await res.json();
    if (!data.success) return { notifications: [], unread_count: 0 };
    return { notifications: data.notifications ?? [], unread_count: data.unread_count ?? 0 };
  } catch {
    return { notifications: [], unread_count: 0 };
  }
};

// Admin's incoming notifications
export const getAdminNotifications = async ({ unread_only = false, limit = 50, offset = 0 } = {}) => {
  const url = `${API_URL}/notifications/get_admin_notifications.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ unread_only, limit, offset })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return { notifications: data.notifications ?? [], unread_count: data.unread_count ?? 0 };
};

// Notification mark as read (for both user and admin)
// if notificationId = null, all will be marked
export const markNotificationAsRead = async (notificationId = null) => {
  const url = `${API_URL}/notifications/mark_as_read.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ notification_id: notificationId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// Admin → Send User/All notification
export const sendNotification = async ({ user_id = null, target_role = 'user', type = 'general', title, message, icon = null, link = null, priority = 'normal' }) => {
  const url = `${API_URL}/notifications/send_notification.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ user_id, target_role, type, title, message, icon, link, priority })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// Admin → Send User reply
export const replyToNotification = async ({ user_id, title, message, type = 'reply', reference_notification_id = null, link = null, priority = 'normal' }) => {
  const url = `${API_URL}/notifications/reply_notification.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ user_id, title, message, type, reference_notification_id, link, priority })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// Analytics API Helpers
export const logVisit = async (visitData) => {
  const url = `${API_URL}/analytics/log_visit.php?api_key=${import.meta.env.VITE_APP_SECRET}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(visitData)
    });
    return await res.json();
  } catch (err) {
    console.error("logVisit error:", err);
    return null;
  }
};

export const updateVisit = async (updateData) => {
  const url = `${API_URL}/analytics/update_visit.php?api_key=${import.meta.env.VITE_APP_SECRET}`;
  try {
    // keepalive: true for beforeunload/pagehide robustness
    const res = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(updateData),
      keepalive: true
    });
    return await res.json();
  } catch (err) {
    console.error("updateVisit error:", err);
    return null;
  }
};

export const logEvent = async (eventData) => {
  const url = `${API_URL}/analytics/log_event.php?api_key=${import.meta.env.VITE_APP_SECRET}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(eventData)
    });
    return await res.json();
  } catch (err) {
    console.error("logEvent error:", err);
    return null;
  }
};

export const getUserDownloads = async (email) => {
  if (!email) return null;
  const url = `${API_URL}/contents_download/get_user_downloads.php`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ email })
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data.data; // array of downloads
};

export const applyContributor = async (applicationData) => {
  if (!applicationData) return null;
  const url = `${API_URL}/author/apply_contributor.php`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(applicationData)
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

// =======================
// COLLECTIONS API
// =======================

export const getPublicCollections = async (username) => {
  if (!username) return [];
  const url = `${API_URL}/collections/get_public_collections.php?username=${username}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.collections;
};

export const getUserCollections = async (contentId = 0) => {
  const url = `${API_URL}/collections/get_user_collections.php${contentId ? `?content_id=${contentId}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: await getHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.collections;
};

export const getCollectionContents = async (collectionId) => {
  const url = `${API_URL}/collections/get_collection_contents.php?collection_id=${collectionId}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: await getHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data; // returns { collection_name, contents }
};

export const createCollection = async (name, contentId = 0) => {
  const url = `${API_URL}/collections/create_collection.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ name, content_id: contentId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const toggleCollectionItem = async (collectionId, contentId) => {
  const url = `${API_URL}/collections/toggle_item.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ collection_id: collectionId, content_id: contentId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data; // returns { action: 'added' | 'removed' }
};

export const renameCollection = async (collectionId, newName) => {
  const url = `${API_URL}/collections/rename_collection.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ collection_id: collectionId, name: newName })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const deleteCollection = async (collectionId) => {
  const url = `${API_URL}/collections/delete_collection.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ collection_id: collectionId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const toggleCollectionPrivacy = async (collectionId, isPublic) => {
  const url = `${API_URL}/collections/toggle_collection_privacy.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ collection_id: collectionId, is_public: isPublic ? 1 : 0 })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};