/**
 * Firebase auth token সহ fetch করার helper।
 * সব authenticated API call এই function দিয়ে করো।
 */
import { getAuth } from "firebase/auth";

/**
 * Firebase current user-এর ID token return করে।
 * Login না থাকলে null return করে।
 */
export const getAuthToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
};

/**
 * Authorization header সহ fetch করে।
 * token না থাকলে header ছাড়াই request পাঠায়।
 *
 * @param {string} url
 * @param {RequestInit} options - fetch options (method, body, headers etc.)
 * @returns {Promise<Response>}
 */
export const authFetch = async (url, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
};
