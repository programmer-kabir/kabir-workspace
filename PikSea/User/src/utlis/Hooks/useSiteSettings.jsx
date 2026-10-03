import { useQuery } from "@tanstack/react-query";

const fetchSettings = async () => {
  const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/cms/settings/getSettings.php`, {
    headers: {
      'x-api-key': import.meta.env.VITE_APP_SECRET
    }
  });
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
