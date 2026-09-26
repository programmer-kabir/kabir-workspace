import { useQuery } from "@tanstack/react-query";

const fetchSettings = async () => {
  const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/cms/settings/getSettings.php`);
  if (!res.ok) {
    throw new Error("Failed to fetch site settings");
  }
  const data = await res.json();
  return data.data || {};
};

const useSiteSettings = () => {
  return useQuery({
    queryKey: ["siteSettings"],
    queryFn: fetchSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useSiteSettings;
