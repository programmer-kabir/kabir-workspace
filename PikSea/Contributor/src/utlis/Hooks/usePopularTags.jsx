import { useQuery } from "@tanstack/react-query";

const getPopularTags = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/tags/get_tags.php`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load popular tags");
  }

  // Filter to active tags, sort by usage_count (already sorted by backend but just in case), and take top 8
  const activeTags = data.data.filter(tag => tag.status === 'active');
  return activeTags.slice(0, 12);
};

const usePopularTags = () => {
  return useQuery({
    queryKey: ["popularTags"],
    queryFn: getPopularTags,
    staleTime: 1000 * 60 * 15, // 15 mins
  });
};

export default usePopularTags;
