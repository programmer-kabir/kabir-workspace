import { authFetch } from "./authFetch";

export const getAllUsers = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/users/get_users.php`;

  const res = await authFetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};

export const deleteUser = async (userId) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/users/delete_user.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

export const updateUserRole = async (userId, roles) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/users/update_user_role.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, roles }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

export const updateUserStatus = async (userId, status) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/users/update_user_status.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, status }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};
