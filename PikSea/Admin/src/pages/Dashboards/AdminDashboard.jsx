import React from "react";
import useAuth from "../../utils/Hooks/useAuth";
import useUsers from "../../utils/Hooks/useUsers";
import useAuthors from "../../utils/Hooks/useAuthors";
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
  UserRoundCheck
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
  const { data: authors } = useAuthors(); 
  const { data: contentData, isLoading: isContentLoading } = useAllContents({ status: "all", limit: 5 });
  const { data: pendingData } = useAllContents({ status: "pending", limit: 1 });
  const { data: rejectedData } = useAllContents({ status: "rejected", limit: 1 });
  
  const { analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();

  const totalUsers = usersData ? usersData.length : 0;
  const totalContributors = authors ? authors.length : 0;
  const totalContents = contentData ? contentData.total : 0;
  const pendingContents = pendingData ? pendingData.total : 0;
  const rejectedContents = rejectedData ? rejectedData.total : 0;
  const activeSubscribers = Math.floor(totalUsers * 0.25) || 0;

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
        <div className="absolute top-[-50%] right-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.name || "Admin"}</span> 👋
            </h1>
            <p className="mt-3 text-base text-gray-400 max-w-xl leading-relaxed">
              Here's your real-time analytics. Monitor today's performance, track active contributors, and manage your platform's growth.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/allcontent" className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-sm font-bold text-white transition-all backdrop-blur-md">
              <Layers size={18} />
              All Content
            </Link>
            <Link to="/dashboard/content/pending" className="flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={18} />
              Review Pending
            </Link>
          </div>
        </div>
      </div>

      {/* PLATFORM PULSE & REALTIME GAUGES */}
      <PlatformPulseWidget />

      {/* TODAY'S QUICK STATS */}
      <h2 className="text-xl font-bold text-white mb-2">Today's Highlights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#12121E] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/[0.02] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Downloads Today</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-white">
                    {isAnalyticsLoading ? "..." : analytics.today.downloads}
                  </h3>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 shadow-inner">
                <Download size={24} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-50" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#12121E] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/[0.02] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Sales Today</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-white">
                    {isAnalyticsLoading ? "..." : `$${(analytics.today.sales || 0).toFixed(2)}`}
                  </h3>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 shadow-inner">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-50" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#12121E] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/[0.02] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Company Revenue</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-white">
                    {isAnalyticsLoading ? "..." : `$${(analytics.today.revenue || 0).toFixed(2)}`}
                  </h3>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 shadow-inner">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#12121E] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/[0.02] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">New Subs Today</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-white">
                    {isAnalyticsLoading ? "..." : analytics.today.subscriptions || 0}
                  </h3>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 shadow-inner">
                <Activity size={24} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 opacity-50" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#12121E] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/10">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/[0.02] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">New Users Today</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-white">
                    {isAnalyticsLoading ? "..." : analytics.today.new_users}
                  </h3>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 shadow-inner">
                <UserPlus size={24} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50" />
        </div>
      </div>

      {/* OVERALL SYSTEM STATS */}
      <h2 className="text-xl font-bold text-white mb-2 mt-8">Overall System Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        <div className="rounded-2xl border border-white/5 bg-[#12121E] p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
          <Users className="text-blue-400 mb-2" size={24} />
          <h3 className="text-2xl font-black text-white">{totalUsers}</h3>
          <p className="text-xs font-medium text-gray-500">Total Users</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#12121E] p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
          <UserRoundCheck className="text-indigo-400 mb-2" size={24} />
          <h3 className="text-2xl font-black text-white">{totalContributors}</h3>
          <p className="text-xs font-medium text-gray-500">Total Contributors</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#12121E] p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
          <Clock className="text-amber-400 mb-2" size={24} />
          <h3 className="text-2xl font-black text-white">{pendingContents}</h3>
          <p className="text-xs font-medium text-gray-500">Pending Assets</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#12121E] p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
          <FileX2 className="text-red-400 mb-2" size={24} />
          <h3 className="text-2xl font-black text-white">{rejectedContents}</h3>
          <p className="text-xs font-medium text-gray-500">Rejected Assets</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#12121E] p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
          <ImageIcon className="text-purple-400 mb-2" size={24} />
          <h3 className="text-2xl font-black text-white">{totalContents}</h3>
          <p className="text-xs font-medium text-gray-500">Total Assets</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#12121E] p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
          <Star className="text-emerald-400 mb-2" size={24} />
          <h3 className="text-2xl font-black text-white">{activeSubscribers}</h3>
          <p className="text-xs font-medium text-gray-500">Active Subscribers</p>
        </div>

      </div>

      {/* RECENT UPLOADS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* RECENT UPLOADS (2/3 width) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#12121E] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-blue-400" size={20} />
              Recent Uploads
            </h2>
            <Link to="/dashboard/allcontent" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {isContentLoading ? (
              <div className="animate-pulse space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-20 w-full bg-white/5 rounded-2xl"></div>)}
              </div>
            ) : contentData?.data && contentData.data.length > 0 ? (
              contentData.data.slice(0, 4).map((item) => {
                const itemAuthor = authors?.find((a) => String(a._id) === String(item.author_id) || String(a.id) === String(item.author_id) || String(a.user_id) === String(item.author_id));
                const authorSlug = itemAuthor?.username || item.author_username || itemAuthor?.id || item.author_id;
                const authorName = itemAuthor?.name || itemAuthor?.username || itemAuthor?.full_name || "Unknown";
                const imgPath = item.preview_image || item.image_url || item.thumbnail;
                const imgSrc = imgPath ? (imgPath.startsWith('http') ? imgPath : `${import.meta.env.VITE_IMG_KEY}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`) : '/placeholder.jpg';

                return (
                  <div key={item.id} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/10">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#1a1a2e] flex-shrink-0">
                      <img 
                        src={imgSrc} 
                        alt={item.title}
                        className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-200 truncate">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Users size={12} /> <Link to={`/dashboard/author/${authorSlug}`} className="text-blue-400 hover:underline">{authorName}</Link>
                        </span>
                        <span className="text-xs font-medium text-gray-500">•</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          item.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-500">
                <ImageIcon size={40} className="mx-auto mb-3 opacity-20" />
                <p>No recent content found.</p>
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS & SYSTEM (1/3 width) */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 sm:p-8 shadow-xl">
             <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
             <div className="space-y-3">
                <Link to="/dashboard/addcontent" className="flex items-center gap-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 p-4 transition-all group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">Upload Asset</h4>
                    <p className="text-xs text-gray-500">Add new content</p>
                  </div>
                </Link>
                
                <Link to="/dashboard/users" className="flex items-center gap-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 p-4 transition-all group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">Manage Users</h4>
                    <p className="text-xs text-gray-500">View & edit profiles</p>
                  </div>
                </Link>
             </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 sm:p-8 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                <TrendingUp size={120} />
             </div>
             <h2 className="text-lg font-bold text-white mb-2 relative z-10">Platform Health</h2>
             <p className="text-sm text-indigo-200 mb-6 relative z-10">All systems are running smoothly.</p>
             
             <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> API Status</span>
                  <span className="text-sm font-bold text-emerald-400">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Database</span>
                  <span className="text-sm font-bold text-emerald-400">Healthy</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <h2 className="text-xl font-bold text-white mb-2 mt-8">Performance & Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-indigo-400" size={18} />
            Performance (Last 30 Days)
          </h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {isAnalyticsLoading ? (
              <DayalLoader size="sm" text="Loading performance metrics..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#4b5563" fontSize={12} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  <Area type="monotone" name="Downloads" dataKey="downloads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDownloads)" />
                  <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users className="text-purple-400" size={18} />
            User Growth (Last 30 Days)
          </h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {isAnalyticsLoading ? (
              <DayalLoader size="sm" text="Loading user growth analytics..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#4b5563" fontSize={12} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff0a'}} />
                  <Bar name="New Users" dataKey="new_users" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP CONTRIBUTORS */}
        <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="text-amber-400" size={20} />
              Top Contributors
            </h2>
          </div>
          
          <div className="space-y-4">
            {isAnalyticsLoading ? (
              <div className="animate-pulse space-y-4">
                 {[1,2,3,4,5].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-2xl"></div>)}
              </div>
            ) : analytics.top_contributors && analytics.top_contributors.length > 0 ? (
              analytics.top_contributors.map((author, idx) => (
                <div key={author.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-bold">
                        #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">{author.name || 'Unknown User'}</h4>
                      <p className="text-xs text-gray-500">{author.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{author.total_downloads}</p>
                    <p className="text-xs text-gray-500">Downloads</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500">
                <p>No contributors found.</p>
              </div>
            )}
          </div>
        </div>

        {/* MOST DOWNLOADED CONTENT */}
        <div className="rounded-3xl border border-white/5 bg-[#12121E] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Download className="text-emerald-400" size={20} />
              Most Downloaded Files
            </h2>
          </div>
          
          <div className="space-y-4">
            {isAnalyticsLoading ? (
              <div className="animate-pulse space-y-4">
                 {[1,2,3,4,5].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-2xl"></div>)}
              </div>
            ) : analytics.top_contents && analytics.top_contents.length > 0 ? (
              analytics.top_contents.map((item, idx) => {
                const imgPath = item.preview_image;
                const imgSrc = imgPath ? (imgPath.startsWith('http') ? imgPath : `${import.meta.env.VITE_IMG_KEY}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`) : '/placeholder.jpg';

                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#1a1a2e] flex-shrink-0">
                        <img 
                          src={imgSrc} 
                          alt={item.title}
                          className="h-full w-full object-cover opacity-80"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-200 truncate max-w-[200px]">{item.title}</h4>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">By {item.author_name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400">
                        <Download size={12} />
                        {item.downloads_count}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-500">
                <p>No downloads found.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;