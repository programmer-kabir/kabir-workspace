import { authFetch } from "./authFetch";

export const getTags = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/tags/get_tags.php`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const addTag = async (tagData) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/tags/add_tag.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateTag = async (tagData) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/tags/update_tag.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const deleteTag = async (id) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/tags/delete_tag.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};
