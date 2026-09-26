import {
  Download,
  FolderOpen,
  DollarSign,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import useAuth from "../../../utlis/Hooks/useAuth";
import useAuthorByEmail from "../../../utlis/Hooks/useAuthorByEmail";
import useAuthorContents from "../../../utlis/Hooks/useAuthorContents";
import useDownloadHistory from "../../../utlis/Hooks/useDownloadHistory";
import useUploadLimit from "../../../utlis/Hooks/useUploadLimit";
import useAuthorEarnings from "../../../utlis/Hooks/useAuthorEarnings";
import usePopularTags from "../../../utlis/Hooks/usePopularTags";
import { useMemo, useState } from "react";

const IMAGE_BASE_URL = import.meta.env.VITE_IMG_KEY || "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/";

const AuthorDashboard = () => {
  const { user } = useAuth();
  const { data: author } = useAuthorByEmail(user?.email);
  const { data: uploadLimit } = useUploadLimit(user?.email);
  const { data: earningsData } = useAuthorEarnings();
  const { data: popularTags } = usePopularTags();
  const { data: recentContentsData } = useAuthorContents(author?.id, "", 1, 5);
  const recentUploads = recentContentsData?.data || [];


  // ── Real download chart data ──────────────────────────────────
  const [chartMode, setChartMode] = useState("monthly");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data: rawChartData, isLoading: isChartLoading } = useDownloadHistory(
    author?.id,
    chartMode,
    currentYear,
    currentMonth
  );

  const MONTH_SHORTS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const chartBars = useMemo(() => {
    const fetched = rawChartData || [];
    if (chartMode === "monthly") {
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const label = String(day).padStart(2, "0");
        const fullDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${label}`;
        const found = fetched.find((d) => d.label === fullDate);
        return { label: day % 5 === 0 || day === 1 ? label : "", displayLabel: label, val: found ? found.downloads : 0 };
      });
    } else {
      return MONTH_SHORTS.map((short) => {
        const found = fetched.find((d) => d.label === short);
        return { label: short, displayLabel: short, val: found ? found.downloads : 0 };
      });
    }
  }, [rawChartData, chartMode, currentYear, currentMonth]);

  const maxVal = chartBars.length > 0 ? Math.max(...chartBars.map((b) => b.val), 1) : 1;

  const stats = [
    {
      name: "Total Assets",
      value: author?.published_files || 0,
      change: "Lifetime published",
      icon: <FolderOpen className="text-[#6C4FE0]" size={20} />,
      bg: "bg-[#6C4FE0]/10",
      border: "border-[#6C4FE0]/20",
    },
    {
      name: "Total Downloads",
      value: author?.total_downloads || 0,
      change: "Lifetime downloads",
      icon: <Download className="text-[#FF6B6B]" size={20} />,
      bg: "bg-[#FF6B6B]/10",
      border: "border-[#FF6B6B]/20",
    },
    {
      name: "Estimated Balance",
      value: earningsData?.wallet?.balance !== undefined ? `$${Number(earningsData.wallet.balance).toFixed(2)}` : "$0.00",
      change: "Min payout $10",
      icon: <DollarSign className="text-emerald-400" size={20} />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      name: "Pending Review",
      value: author?.pending_files || 0,
      change: "Awaiting approval",
      icon: <Clock className="text-amber-400" size={20} />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      name: "Upload Limit",
      value: uploadLimit?.permission_type === 'unlimited' ? 'Unlimited' : `${uploadLimit?.weekly_upload_limit ? (uploadLimit.weekly_upload_limit - uploadLimit.uploads_this_week) : 0} Left`,
      change: uploadLimit?.permission_type === 'unlimited' ? 'No restrictions' : `${uploadLimit?.uploads_this_week || 0} / ${uploadLimit?.weekly_upload_limit || 0} used`,
      icon: <CheckCircle className="text-blue-400" size={20} />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  ];


  return (
    <div className="space-y-8">

      {/* GREETING SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Welcome back, {user?.displayName || "Creator"}!
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Here's a breakdown of your stock assets and earnings performance.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-gray-300">
          <Sparkles size={16} className="text-[#FF6B6B]" />
          <span>Upload trending vectors for **Summer Season** for 2x reach!</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`rounded-2xl border bg-white/5 p-6 space-y-4 hover:border-white/20 transition-colors ${stat.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {stat.name}
              </span>
              <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              <p className="mt-1 text-xs text-gray-400">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS / ANALYTICS SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* CHART MOCK */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Download Statistics</h3>
              <p className="text-xs text-gray-500">
                {chartMode === "monthly"
                  ? `Daily downloads — ${new Date(currentYear, currentMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" })}`
                  : `Monthly downloads — ${currentYear}`}
              </p>
            </div>
            <select
              value={chartMode}
              onChange={(e) => setChartMode(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-400 outline-none cursor-pointer"
            >
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>

          {/* CHART AREA — real backend data */}
          <div className="flex-1 flex items-end justify-between gap-1 pt-6 h-48 w-full border-b border-white/10 pb-2 relative">
            {isChartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#6C4FE0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              chartBars.map((bar, i) => {
                const heightPercent = maxVal > 0 ? (bar.val / maxVal) * 100 : 0;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group cursor-pointer h-full justify-end">
                    {/* Tooltip */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-gray-900 font-bold text-[10px] px-1.5 py-0.5 rounded shadow mb-1.5 whitespace-nowrap pointer-events-none">
                      {bar.val} dl
                    </span>
                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(heightPercent, bar.val > 0 ? 4 : 0)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${bar.val > 0
                          ? "bg-gradient-to-t from-[#6C4FE0] to-[#FF6B6B] opacity-75 group-hover:opacity-100 shadow-[0_0_15px_rgba(108,79,224,0.15)] group-hover:shadow-[0_0_20px_rgba(108,79,224,0.4)]"
                          : "bg-white/5"
                        }`}
                    />
                    <span className="text-[10px] text-gray-500 mt-2 font-medium">{bar.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECENT INSIGHTS CARD */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Popular Keywords</h3>
            <p className="text-xs text-gray-500">Most searched terms on Dayal Stock this week</p>

            <div className="flex flex-wrap gap-2 pt-2">
              {popularTags && popularTags.length > 0 ? (
                popularTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-white/15 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    #{tag.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">Loading popular keywords...</span>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tips for Creators</h4>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Files uploaded with clean labels, description, and at least 15 relevant tags get 3x higher search prominence. Keep creating!
            </p>
          </div>
        </div>

      </div>

      {/* RECENT UPLOADS TABLE */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Uploads</h3>
            <p className="text-xs text-gray-500 font-medium">Your latest design submissions</p>
          </div>
          <button className="text-xs font-semibold text-[#FF6B6B] hover:text-[#ff7900] transition-colors flex items-center gap-1">
            <span>View All Assets</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Thumbnail & Title</th>
                <th className="pb-3">Upload Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Downloads</th>
                <th className="pb-3 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {recentUploads.length > 0 ? (
                recentUploads.map((upload) => {
                  const imagePath = upload.author_preview_url || upload.preview_image || upload.image_url || upload.image || upload.file_url;
                  const thumbnailSrc = imagePath
                    ? (imagePath.startsWith("http") ? imagePath : `${IMAGE_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`)
                    : null;

                  return (
                    <tr key={upload.id} className="text-gray-300">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 overflow-hidden rounded-lg bg-[#1A1A2E]/50 border border-white/5">
                            {thumbnailSrc ? (
                              <img
                                src={thumbnailSrc}
                                alt={upload.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white/5">
                                <FolderOpen size={16} className="text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col max-w-xs">
                            <span className="font-semibold text-white truncate">{upload.title}</span>
                            <span className="text-[9px] text-gray-500 break-all">{thumbnailSrc}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {new Date(upload.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${upload.status === "published" ? "bg-green-500/10 text-green-400" :
                            upload.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                              upload.status === "rejected" ? "bg-red-500/10 text-red-400" :
                                "bg-gray-500/10 text-gray-400"
                          }`}>
                          {upload.status === "published" ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span className="capitalize">{upload.status}</span>
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-white">{upload.downloads_count || 0}</td>
                      <td className="py-4 text-right">{upload.views_count || 0}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-sm text-gray-500">
                    No recent uploads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AuthorDashboard;
