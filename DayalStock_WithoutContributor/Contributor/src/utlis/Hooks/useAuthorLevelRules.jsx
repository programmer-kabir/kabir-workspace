import { useQuery } from "@tanstack/react-query";

const getAuthorLevelRules = async () => {
  const apiKey = import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026";
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/get_level_rules.php?api_key=${encodeURIComponent(apiKey)}`;
  
  const res = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load author rules");
  }

  // Handle both array format or object with { level_rules, badge_rules }
  const payload = data.data || {};
  const levelRules = Array.isArray(payload) ? payload : (payload.level_rules || []);
  const badgeRules = payload.badge_rules || {
    top_earner_min_downloads: 20,
    trending_min_downloads: 5,
    trending_min_views: 50,
    high_views_min_views: 20,
    fresh_release_max_days: 14,
  };

  return { levelRules, badgeRules };
};

const useAuthorLevelRules = () => {
  return useQuery({
    queryKey: ["authorLevelRules"],
    queryFn: getAuthorLevelRules,
    staleTime: 1000 * 60 * 15, // 15 minutes cache
  });
};

export default useAuthorLevelRules;
