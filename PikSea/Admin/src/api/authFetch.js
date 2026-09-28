/**
 * JWT auth token সহ fetch করার helper (Zero Firebase)
 */

export const getAuthToken = () => {
  return localStorage.getItem("piksea_admin_token") || localStorage.getItem("dayalstock_admin_token") || localStorage.getItem("piksea_token") || localStorage.getItem("dayalstock_token") || "";
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("piksea_admin_token", token);
  } else {
    localStorage.removeItem("piksea_admin_token");
    localStorage.removeItem("dayalstock_admin_token");
  }
};

/**
 * Authorization & API Key header সহ fetch করে।
 *
 * @param {string} url
 * @param {RequestInit} options - fetch options (method, body, headers etc.)
 * @returns {Promise<Response>}
 */
export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
};
