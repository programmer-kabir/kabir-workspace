import { authFetch } from "./authFetch";

export const getAuthorContents = async (
  authorId,
  status = "",
  page = 1,
  limit = 50,
) => {
  if (!authorId) {
    throw new Error("Author ID is required");
  }

  let url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/getAuthorContents.php?author_id=${authorId}&page=${page}&limit=${limit}`;

  if (status) {
    url += `&status=${status}`;
  }

  const res = await authFetch(url);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Contents load failed");
  }

  return data;
};