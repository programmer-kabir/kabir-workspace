import { authFetch } from "./authFetch";

export const getAllContents = async ({ status = "all", page = 1, limit = 50 } = {}) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/contents/getAdminContents.php?status=${status}&page=${page}&limit=${limit}`;

  const res = await authFetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  let filteredData = data.data || [];
  if (status === "all") {
    filteredData = filteredData.filter(item => item.status !== "draft");
  }

  return {
    data: filteredData,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.total_pages,
    statusCounts: data.status_counts ?? {},
  };
};

export const updateContentStatus = async (contentId, status, reason = "", reviewerNote = "") => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/contents/updateStatus.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: contentId, status, reason, reviewer_note: reviewerNote }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Status update failed");
  }
  return data;
};
