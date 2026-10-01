import React from "react";
import useAuth from "../../utils/Hooks/useAuth";
import useUsers from "../../utils/Hooks/useUsers";
import useAllContents from "../../utils/Hooks/useAllContents";
import useDashboardAnalytics from "../../utils/Hooks/useDashboardAnalytics";
import { Link } from "react-router-dom";
import DayalLoader from "../../components/Common/DayalLoader";
import PlatformPulseWidget from "../../components/Dashboard/PlatformPulseWidget";
import {
  Users,
  Image as ImageIcon,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  ShieldCheck,
  Star,
  UploadCloud,
  Layers,
  Download,
  DollarSign,
  UserPlus,
  FileX2,
  Sparkles,
  CreditCard
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const { data: usersData } = useUsers();
  const { data: contentData, isLoading: isContentLoading } = useAllContents({ status: "all", limit: 5 });
  const { data: publishedData } = useAllContents({ status: "published", limit: 1 });
  const { data: rejectedData } = useAllContents({ status: "rejected", limit: 1 });
  
  const { analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();

  const totalUsers = usersData ? usersData.length : 0;
  const totalContents = contentData ? contentData.total : 0;
  const publishedContents = publishedData ? publishedData.total : 0;
  const rejectedContents = rejectedData ? rejectedData.total : 0;
  const activeSubscribers = Math.floor(totalUsers * 0.35) || 0;

  // Render Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12121E] border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-xs mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? `$${parseFloat(entry.value).toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[#12121E] border border-white/5 shadow-2xl">
        <div className="absolute top-[-50%] right-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-outfit">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-cyan-400">{user?.name || "Admin"}</span> 👋
            </h1>
            <p className="mt-3 text-base text-gray-400 max-w-xl leading-relaxed">
              Here is your real-time analytics. Monitor downloads, manage marketplace assets, and track platform revenue.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/allcontent" className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-sm font-bold text-white transition-all backdrop-blur-md">
              <Layers size={18} />
              All Content
            </Link>
            <Link to="/dashboard/content/upload" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-500 hover:opacity-90 px-5 py-3 text-sm font-bold text-black transition-all shadow-lg shadow-cyan-500/20">
              <UploadCloud size={18} />
              Upload Assets
            </Link>
          </div>
        </div>
      </div>

      {/* PLATFORM PULSE LIVE WIDGET */}
      <PlatformPulseWidget />

      {/* TODAY'S PERFORMANCE HIGHLIGHTS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-outfit">
          <Activity className="text-[#00D4FF]" size={20} />
          Today's Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={48} className="text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-3xl font-black text-white mt-2">
              ${parseFloat(analytics.today?.revenue || 0).toFixed(2)}
            </h3>
            <p className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> {analytics.today?.subscriptions || 0} active subscriptions
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Download size={48} className="text-[#00D4FF]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Downloads</p>
            <h3 className="text-3xl font-black text-white mt-2">
              {analytics.today?.downloads || 0}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-2">
              Live customer downloads
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserPlus size={48} className="text-purple-400" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Registrations</p>
            <h3 className="text-3xl font-black text-white mt-2">
              {analytics.today?.new_users || 0}
            </h3>
            <p className="text-xs text-purple-400 font-medium mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> Registered today
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle size={48} className="text-amber-400" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Pro Members</p>
            <h3 className="text-3xl font-black text-white mt-2">
              {activeSubscribers}
            </h3>
            <p className="text-xs text-amber-400 font-medium mt-2">
              Estimated active accounts
            </p>
          </div>

        </div>
      </div>

      {/* OVERALL SYSTEM STATS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 mt-8 font-outfit">Overall System Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
            <Users className="text-blue-400 mb-2" size={26} />
            <h3 className="text-2xl font-black text-white">{totalUsers}</h3>
            <p className="text-xs font-medium text-gray-400">Total Users</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
            <ImageIcon className="text-emerald-400 mb-2" size={26} />
            <h3 className="text-2xl font-black text-white">{publishedContents}</h3>
            <p className="text-xs font-medium text-gray-400">Published Assets</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
            <Layers className="text-purple-400 mb-2" size={26} />
            <h3 className="text-2xl font-black text-white">{totalContents}</h3>
            <p className="text-xs font-medium text-gray-400">Total Asset Library</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
            <CreditCard className="text-[#00D4FF] mb-2" size={26} />
            <h3 className="text-2xl font-black text-white">{activeSubscribers}</h3>
            <p className="text-xs font-medium text-gray-400">Subscribers</p>
          </div>

        </div>
      </div>

      {/* ANALYTICS CHARTS (30 DAYS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* REVENUE & DOWNLOAD TRENDS */}
        <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-outfit">
                <TrendingUp className="text-emerald-400" size={20} />
                Revenue & Sales (30 Days)
              </h2>
              <p className="text-xs text-gray-400 mt-1">Platform gross revenue volume</p>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            {isAnalyticsLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <DayalLoader size="sm" text="Loading analytics..." />
              </div>
            ) : analytics.chart_data && analytics.chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* DOWNLOADS VELOCITY */}
        <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-outfit">
                <Download className="text-[#00D4FF]" size={20} />
                Download Velocity (30 Days)
              </h2>
              <p className="text-xs text-gray-400 mt-1">Asset download activity across marketplace</p>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            {isAnalyticsLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <DayalLoader size="sm" text="Loading analytics..." />
              </div>
            ) : analytics.chart_data && analytics.chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="downloads" name="Downloads" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No download data available
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MOST DOWNLOADED CONTENT TABLE */}
      <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-outfit">
            <Download className="text-emerald-400" size={20} />
            Most Downloaded Assets
          </h2>
          <Link to="/dashboard/allcontent" className="text-xs text-[#00D4FF] hover:underline font-bold">
            View All Assets →
          </Link>
        </div>
        
        <div className="space-y-3">
          {isAnalyticsLoading ? (
            <div className="animate-pulse space-y-4">
               {[1,2,3,4,5].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-2xl"></div>)}
            </div>
          ) : analytics.top_contents && analytics.top_contents.length > 0 ? (
            analytics.top_contents.map((item, idx) => {
              const imgPath = item.preview_image;
              const imgSrc = imgPath ? (imgPath.startsWith('http') ? imgPath : `${import.meta.env.VITE_IMG_KEY}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`) : '/placeholder.jpg';

              return (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:bg-white/[0.04]">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#1a1a2e] flex-shrink-0 border border-white/10">
                      <img 
                        src={imgSrc} 
                        alt={item.title}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-200 truncate max-w-md">{item.title}</h4>
                      <p className="text-xs text-gray-500">Asset ID: #{item.id}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400">
                      <Download size={14} />
                      {item.downloads_count} downloads
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-gray-500">
              <p>No downloads recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;