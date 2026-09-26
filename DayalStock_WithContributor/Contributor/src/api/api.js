

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

export const getAllContents = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/contents/getContributorContents.php`;

  // Assume authFetch is not defined here, but if we need token we should use it.
  // Wait, getAllContents in Contributor api.js is not used anyway, we saw only UploadContext.jsx uses it.
  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};


export const getAllUsers = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/users/get_users.php`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};

export const getAllAuthor = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/get_author.php`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};
