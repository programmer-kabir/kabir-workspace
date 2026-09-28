import { authFetch } from "./authFetch";

const API_URL = `${import.meta.env.VITE_LOCALHOST_KEY}/verification`;

export const getVerifications = async (status = 'all') => {
  const url = `${API_URL}/admin_get_nids.php?status=${status}`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateVerificationStatus = async (id, status, rejection_reason = null) => {
  const url = `${API_URL}/admin_update_nid.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, rejection_reason }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};



