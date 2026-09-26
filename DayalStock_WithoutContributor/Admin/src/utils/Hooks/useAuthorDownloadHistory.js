import { useQuery } from "@tanstack/react-query";

const fetchAuthorDownloadHistory = async (authorId, mode, year, month) => {
  if (!authorId) return [];
  
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/get_author_download_history.php?author_id=${authorId}&mode=${mode}&year=${year}&month=${month}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch download history");
  }
  
  return data.data || [];
};

const useAuthorDownloadHistory = (authorId, mode = "yearly", year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
  return useQuery({
    queryKey: ["author-download-history", authorId, mode, year, month],
    queryFn: () => fetchAuthorDownloadHistory(authorId, mode, year, month),
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useAuthorDownloadHistory;
