import React, { useState } from "react";
import { Award, Crown, Trophy, Sparkles, Target, Star, CheckCircle2, History, X, ArrowRight, Clock } from "lucide-react";
import useAuthorLevelRules from "../../utlis/Hooks/useAuthorLevelRules";

// Icon mapping per level index
const LEVEL_ICONS = [Sparkles, Award, Trophy, Crown, Star];

export const getDynamicAuthorLevelDetails = (totalDownloads = 0, publishedFiles = 0, levelRules = []) => {
  const dl = Number(totalDownloads) || 0;
  const files = Number(publishedFiles) || 0;

  const activeRules = (levelRules && levelRules.length > 0)
    ? [...levelRules].sort((a, b) => a.level_number - b.level_number)
    : [
        { level_number: 0, level_name: "New Contributor", min_published_files: 0, min_total_downloads: 0, badge_color: "#6B7280", benefits: "Start uploading content, Community analytics" },
        { level_number: 1, level_name: "Level 1 Contributor", min_published_files: 4, min_total_downloads: 0, badge_color: "#22C55E", benefits: "Basic contributor badge, Faster file review" },
        { level_number: 2, level_name: "Level 2 Contributor", min_published_files: 10, min_total_downloads: 0, badge_color: "#3B82F6", benefits: "Priority review eligibility, Extended upload limits" },
        { level_number: 3, level_name: "Level 3 Contributor", min_published_files: 1500, min_total_downloads: 300, badge_color: "#8B5CF6", benefits: "Featured contributor eligibility, Higher revenue share" },
        { level_number: 4, level_name: "Elite Contributor", min_published_files: 5000, min_total_downloads: 1000, badge_color: "#F59E0B", benefits: "Elite badge and premium benefits, Instant VIP approval" },
      ];

  // Find current eligible level (highest matching)
  let currentRuleIndex = 0;
  for (let i = 0; i < activeRules.length; i++) {
    const r = activeRules[i];
    if (files >= (r.min_published_files || 0) && dl >= (r.min_total_downloads || 0)) {
      currentRuleIndex = i;
    }
  }

  const currentRule = activeRules[currentRuleIndex];
  const nextRule = activeRules[currentRuleIndex + 1] || null;

  // Split benefits string into perks array
  const perks = currentRule.benefits
    ? currentRule.benefits.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : ["Standard Contributor Perks"];

  // Progress calculation to next rule
  let progress = 100;
  let remainingText = "Max Rank Achieved! 🎉";
  let targetDesc = "";

  if (nextRule) {
    const reqFiles = nextRule.min_published_files || 0;
    const reqDl = nextRule.min_total_downloads || 0;

    const currReqFiles = currentRule.min_published_files || 0;
    const currReqDl = currentRule.min_total_downloads || 0;

    let fileProgress = 100;
    let dlProgress = 100;

    if (reqFiles > currReqFiles) {
      fileProgress = Math.min(100, Math.max(0, ((files - currReqFiles) / (reqFiles - currReqFiles)) * 100));
    }
    if (reqDl > currReqDl) {
      dlProgress = Math.min(100, Math.max(0, ((dl - currReqDl) / (reqDl - currReqDl)) * 100));
    }

    // Overall progress is average of requirements
    progress = reqDl > 0 && reqFiles > 0
      ? Math.round((fileProgress + dlProgress) / 2)
      : Math.round(reqDl > 0 ? dlProgress : fileProgress);

    const remainingFiles = Math.max(0, reqFiles - files);
    const remainingDl = Math.max(0, reqDl - dl);

    const remainingParts = [];
    if (remainingFiles > 0) remainingParts.push(`${remainingFiles} files`);
    if (remainingDl > 0) remainingParts.push(`${remainingDl} downloads`);
    remainingText = remainingParts.length > 0 ? `${remainingParts.join(" & ")} left` : "Ready for upgrade!";

    targetDesc = reqDl > 0 && reqFiles > 0
      ? `${reqFiles} files / ${reqDl} dl`
      : (reqFiles > 0 ? `${reqFiles} files` : `${reqDl} dl`);
  }

  const IconComponent = LEVEL_ICONS[currentRule.level_number % LEVEL_ICONS.length] || Sparkles;

  return {
    level: currentRule.level_number,
    name: currentRule.level_name,
    badge: `Level ${currentRule.level_number} • ${currentRule.level_name}`,
    badgeColor: currentRule.badge_color || "#3B82F6",
    icon: IconComponent,
    currentThreshold: currentRule.min_published_files > 0 ? `${currentRule.min_published_files} files` : `${currentRule.min_total_downloads} dl`,
    nextThreshold: targetDesc || "Max Rank",
    nextLevelName: nextRule ? nextRule.level_name : null,
    perks,
    progress: Math.min(100, Math.max(0, progress)),
    remainingText,
    isMaxLevel: !nextRule,
  };
};

const AuthorLevelCard = ({ totalDownloads = 0, publishedFiles = 0, authorId, customRules }) => {
  const { data: rulesData } = useAuthorLevelRules();
  const levelRules = customRules || rulesData?.levelRules || [];

  const levelInfo = getDynamicAuthorLevelDetails(totalDownloads, publishedFiles, levelRules);
  const Icon = levelInfo.icon;

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const apiKey = import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026";
      let url = `${import.meta.env.VITE_LOCALHOST_KEY}/author/get_level_history.php?api_key=${encodeURIComponent(apiKey)}`;
      if (authorId) {
        url += `&author_id=${encodeURIComponent(authorId)}`;
      }
      const res = await fetch(url, { headers: { "x-api-key": apiKey } });
      const data = await res.json();
      if (data.success) {
        setHistoryLogs(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
    fetchHistory();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#12121E] via-[#161626] to-[#12121E] p-6 shadow-2xl backdrop-blur-xl">
      {/* Ambient background glow */}
      <div 
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none transition-all duration-700" 
        style={{ backgroundColor: levelInfo.badgeColor }}
      />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#6C4FE0]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Level Info & Dynamic Color Badge */}
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl p-0.5 shadow-lg flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${levelInfo.badgeColor}, #0E0F1A)`,
              boxShadow: `0 0 25px ${levelInfo.badgeColor}33`
            }}
          >
            <div className="w-full h-full rounded-[14px] bg-[#0E0F1A] flex items-center justify-center text-white">
              <Icon size={28} style={{ color: levelInfo.badgeColor }} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span 
                className="px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors"
                style={{ 
                  backgroundColor: `${levelInfo.badgeColor}15`,
                  borderColor: `${levelInfo.badgeColor}40`,
                  color: levelInfo.badgeColor
                }}
              >
                {levelInfo.badge}
              </span>
              <button
                type="button"
                onClick={handleOpenHistory}
                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10 transition cursor-pointer"
                title="View rank upgrade history"
              >
                <History size={12} />
                <span>History</span>
              </button>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              {levelInfo.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {publishedFiles} published assets • {totalDownloads} total downloads
            </p>
          </div>
        </div>

        {/* Center: Milestone Progress Bar */}
        <div className="w-full lg:max-w-md flex-1">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Target size={14} style={{ color: levelInfo.badgeColor }} />
              {levelInfo.nextLevelName ? `Next: ${levelInfo.nextLevelName}` : "Top Tier Status"}
            </span>
            <span style={{ color: levelInfo.badgeColor }}>
              {levelInfo.remainingText}
            </span>
          </div>

          {/* Progress Track */}
          <div className="h-3.5 w-full rounded-full bg-white/5 border border-white/10 p-0.5 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-1000 shadow-md"
              style={{ 
                width: `${Math.max(5, levelInfo.progress)}%`,
                background: `linear-gradient(90deg, #6C4FE0, ${levelInfo.badgeColor})`,
                boxShadow: `0 0 12px ${levelInfo.badgeColor}55`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5 font-medium">
            <span>{levelInfo.currentThreshold}</span>
            <span className="font-bold text-gray-300">{levelInfo.progress}% Completed</span>
            <span>{levelInfo.nextThreshold}</span>
          </div>
        </div>

        {/* Right: Unlocked Perks List */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Unlocked Level Perks:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
            {levelInfo.perks.slice(0, 3).map((perk, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
                <CheckCircle2 size={13} style={{ color: levelInfo.badgeColor }} className="shrink-0" />
                <span className="truncate max-w-[200px]">{perk}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* LEVEL UPGRADE HISTORY MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121E] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <History className="text-amber-400" size={20} />
              <h3 className="text-lg font-black text-white">Level Milestone History</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Historical record of your contributor level promotions and milestones.
            </p>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading history logs...</div>
            ) : historyLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                No level promotion records found yet. Upload more assets to unlock higher tiers!
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {historyLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: log.old_badge_color || '#6B7280' }}
                        >
                          {log.old_level_name}
                        </span>
                        <ArrowRight size={12} className="text-gray-500" />
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: log.new_badge_color || '#22C55E' }}
                        >
                          {log.new_level_name}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock size={11} />
                        {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                      <span>Files: <strong className="text-gray-200">{log.published_files_at_change}</strong></span>
                      <span>Downloads: <strong className="text-gray-200">{log.downloads_at_change}</strong></span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{log.changed_reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-white/5 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthorLevelCard;
