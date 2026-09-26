import { useQuery } from "@tanstack/react-query";

const getAuthorDownloadHistory = async (authorId, mode, year, month) => {
  if (!authorId) return null;

  let url = `${import.meta.env.VITE_LOCALHOST_KEY || "https://api.dayalstock.com/api_v1"}/author/get_author_download_history.php?author_id=${authorId}&mode=${mode}&year=${year}`;
  
  if (mode === "monthly") {
    url += `&month=${month}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch download history");
  }

  return data.data || [];
};

const useDownloadHistory = (authorId, mode = "monthly", year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
  return useQuery({
    queryKey: ["downloadHistory", authorId, mode, year, month],
    queryFn: () => getAuthorDownloadHistory(authorId, mode, year, month),
    enabled: Boolean(authorId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export default useDownloadHistory;
