import { authFetch } from "./authFetch";

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

export const addCategory = async (formData) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/categories/add_category.php`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateCategory = async (formData) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/categories/update_category.php`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const deleteCategory = async (id) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/categories/delete_category.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};
