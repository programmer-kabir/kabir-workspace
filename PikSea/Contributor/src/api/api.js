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

export const getHeaders = () => {
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

export const verifyOtpApi = async ({ email, code, type = 'password_reset' }) => {
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

export const resendOtpApi = async ({ email, type = 'password_reset' }) => {
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
    throw new Error(data.message || 'Password reset failed');
  }
  return data;
};

export const getMeApi = async () => {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/internal-auth/me.php`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_APP_SECRET
    }
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return null;
  }
  return data.user;
};

export const getCategories = async (parentId) => {
  const url = parentId
    ? `${import.meta.env.VITE_LOCALHOST_KEY}/categories/get_categories.php?parent_id=${parentId}`
    : `${import.meta.env.VITE_LOCALHOST_KEY}/categories/get_categories.php`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data.data;
};
