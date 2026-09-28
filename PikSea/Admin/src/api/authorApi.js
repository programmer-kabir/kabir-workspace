import { authFetch } from "./authFetch";

export const getAllAuthor = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/get_author.php`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};
