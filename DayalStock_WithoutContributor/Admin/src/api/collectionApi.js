import { authFetch } from "./authFetch";

export const getPublicCollections = async (page = 1, limit = 20) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/collections/get_public_collections.php?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const deleteCollection = async (collectionId) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/collections/delete_collection.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection_id: collectionId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};
