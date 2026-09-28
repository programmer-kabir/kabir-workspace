import React from "react";
import { Flame, Zap, Sparkles, TrendingUp } from "lucide-react";
import useAuthorLevelRules from "../../utlis/Hooks/useAuthorLevelRules";

export const getAssetBadge = (file, isTopEarner = false, rules = {}) => {
  if (!file) return null;

  const downloads = Number(file.downloads || file.total_downloads || file.downloads_count || 0);
  const views = Number(file.views || file.total_views || file.views_count || 0);

  const topEarnerMinDownloads = rules.top_earner_min_downloads ?? 20;
  const trendingMinDownloads = rules.trending_min_downloads ?? 5;
  const trendingMinViews = rules.trending_min_views ?? 50;
  const highViewsMinViews = rules.high_views_min_views ?? 20;
  const freshReleaseMaxDays = rules.fresh_release_max_days ?? 14;

  if (isTopEarner || downloads >= topEarnerMinDownloads) {
    return {
      label: "Top Earner",
      icon: Zap,
      color: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-amber-500/30",
    };
  }

  if (downloads >= trendingMinDownloads || views >= trendingMinViews) {
    return {
      label: "Trending",
      icon: Flame,
      color: "bg-gradient-to-r from-[#FF6B6B] to-rose-500 text-white shadow-rose-500/30",
    };
  }

  if (views >= highViewsMinViews) {
    return {
      label: "High Views",
      icon: TrendingUp,
      color: "bg-gradient-to-r from-[#6C4FE0] to-indigo-500 text-white shadow-indigo-500/30",
    };
  }

  // If newly uploaded within freshReleaseMaxDays
  if (file.created_at) {
    const createdDate = new Date(file.created_at);
    const diffDays = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= freshReleaseMaxDays) {
      return {
        label: "Fresh Release",
        icon: Sparkles,
        color: "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-emerald-500/30",
      };
    }
  }

  return null;
};

const AssetPerformanceBadge = ({ file, isTopEarner = false, className = "", customRules }) => {
  const { data: rulesData } = useAuthorLevelRules();
  const rules = customRules || rulesData?.badgeRules || {};

  const badge = getAssetBadge(file, isTopEarner, rules);
  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md ${badge.color} ${className}`}>
      <Icon size={11} className="shrink-0" />
      <span>{badge.label}</span>
    </span>
  );
};

export default AssetPerformanceBadge;
