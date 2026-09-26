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

export const getContributorApplications = async (status = 'all') => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/get_contributor_applications.php?status=${status}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/update_application_status.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: applicationId, status }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};
