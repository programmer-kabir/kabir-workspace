const API_URL = import.meta.env.VITE_LOCALHOST_KEY;

export const getAuthToken = () => {
  return localStorage.getItem('piksea_token') || localStorage.getItem('dayalstock_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('piksea_token', token);
  } else {
    localStorage.removeItem('piksea_token');
    localStorage.removeItem('dayalstock_token');
  }
};

const getHeaders = async () => {
  const headers = { 
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_APP_SECRET
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// =======================
// AUTHENTICATION APIs
// =======================

const authHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_APP_SECRET
};

export const registerUserApi = async ({ name, email, password }) => {
  const res = await fetch(`${API_URL}/internal-auth/register.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

export const verifyOtpApi = async ({ email, code, type = 'registration' }) => {
  const res = await fetch(`${API_URL}/internal-auth/verify_otp.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, code, type })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Verification failed');
  }
  return data;
};

export const resendOtpApi = async ({ email, type = 'registration' }) => {
  const res = await fetch(`${API_URL}/internal-auth/resend_otp.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, type })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to resend code');
  }
  return data;
};

export const loginUserApi = async ({ email, password }) => {
  const res = await fetch(`${API_URL}/internal-auth/login.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const error = new Error(data.message || 'Login failed');
    error.needs_verification = data.needs_verification;
    error.email = data.email;
    throw error;
  }
  return data;
};

export const googleLoginApi = async ({ credential, email, name, photo }) => {
  const res = await fetch(`${API_URL}/internal-auth/google_login.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ credential, email, name, photo })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Google Login failed');
  }
  return data;
};

export const forgotPasswordApi = async ({ email }) => {
  const res = await fetch(`${API_URL}/internal-auth/forgot_password.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Password reset request failed');
  }
  return data;
};

export const resetPasswordApi = async ({ email, code, new_password }) => {
  const res = await fetch(`${API_URL}/internal-auth/reset_password.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, code, new_password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Reset password failed');
  }
  return data;
};

export const getMeApi = async () => {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/internal-auth/get_user_by_email.php`, {
    method: 'GET',
    headers: await getHeaders()
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Session expired');
  }
  return data.user;
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