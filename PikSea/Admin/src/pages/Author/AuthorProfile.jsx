import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthors from '../../utils/Hooks/useAuthors';
import useAuthorContents from '../../utils/Hooks/useAuthorContents';
import useAuthorDownloadHistory from '../../utils/Hooks/useAuthorDownloadHistory';
import ContentPageLayout from '../../components/ContentPageLayout';
import { User, Activity, FileImage, Layers, Download, AlertCircle, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DayalLoader from '../../components/Common/DayalLoader';

const AuthorProfile = () => {
  const { id } = useParams();
  const { data: authors, isLoading: authorsLoading } = useAuthors();
  
  const author = authors?.find(
    (a) =>
      (a.username && String(a.username).toLowerCase() === String(id).toLowerCase()) ||
      (a.author_username && String(a.author_username).toLowerCase() === String(id).toLowerCase()) ||
      String(a._id) === String(id) ||
      String(a.id) === String(id) ||
      String(a.user_id) === String(id)
  );

  const targetAuthorId = author?.id || author?._id || (isNaN(Number(id)) ? 0 : Number(id));

  const { data: authorContentsData, isLoading: contentsLoading } = useAuthorContents(targetAuthorId, "", 1, 100);
  
  const [filterMode, setFilterMode] = useState("yearly");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Real download history data
  const { data: historyData, isLoading: historyLoading, isError: historyError } = useAuthorDownloadHistory(targetAuthorId, filterMode, selectedYear, selectedMonth);

  // Format data to ensure all days/months are present
  const chartData = useMemo(() => {
    if (!historyData) return [];
    
    if (filterMode === "yearly") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map(month => {
        const found = historyData.find(d => d.label === month);
        return { label: month, downloads: found ? found.downloads : 0 };
      });
    } else {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
      return days.map(day => {
        const label = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${day}`;
        const found = historyData.find(d => d.label === label);
        return { label: day, fullDate: label, downloads: found ? found.downloads : 0 };
      });
    }
  }, [historyData, filterMode, selectedYear, selectedMonth]);

  // Generate years from 2026 to current year
  const years = Array.from({ length: Math.max(1, currentYear - 2026 + 1) }, (_, i) => 2026 + i);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const contents = authorContentsData?.data || [];

  if (authorsLoading) {
    return <DayalLoader text="Loading author profile..." />;
  }

  if (!author) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-400">
        <User size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold text-white">Author not found</h2>
        <p className="mt-2">The author you are looking for does not exist.</p>
        <Link to="/dashboard/allusers" className="mt-4 text-blue-400 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  const authorAvatar = author.avatar || author.photo || author.avater;
  const authorImgUrl = authorAvatar ? (authorAvatar.startsWith('http') ? authorAvatar : `${import.meta.env.VITE_IMG_KEY}${authorAvatar.startsWith('/') ? '' : '/'}${authorAvatar}`) : null;

  // Calculate stats
  const totalUploads = contents.length;
  const publishedCount = contents.filter(c => c.status === 'published').length;
  const pendingCount = contents.filter(c => c.status === 'pending').length;
  const rejectedCount = contents.filter(c => c.status === 'rejected').length;

  return (
    <div className="p-6">
      {/* Author Header */}
      <div className="mb-8 rounded-2xl bg-[#12121E] border border-white/5 p-6 shadow-xl relative overflow-hidden">
        {/* Background gradient hint */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#6C4FE0]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#FF6B6B]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-24 h-24 rounded-full border-2 border-[#6C4FE0]/30 overflow-hidden bg-black/50 flex-shrink-0">
            {authorImgUrl ? (
              <img src={authorImgUrl} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-[#6C4FE0] to-[#FF6B6B]">
                {author.name?.[0]?.toUpperCase() || "A"}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{author.name || author.full_name || author.username}</h1>
            <p className="text-gray-400 mb-4">{author.email}</p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <FileImage size={18} className="text-[#6C4FE0]" />
                <div>
                  <div className="text-xs text-gray-500">Total Uploads</div>
                  <div className="text-sm font-bold text-white">{totalUploads}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Activity size={18} className="text-emerald-500" />
                <div>
                  <div className="text-xs text-gray-500">Published</div>
                  <div className="text-sm font-bold text-white">{publishedCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Layers size={18} className="text-amber-500" />
                <div>
                  <div className="text-xs text-gray-500">Pending</div>
                  <div className="text-sm font-bold text-white">{pendingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Performance Chart */}
      <div className="mb-8 rounded-2xl bg-[#12121E] border border-white/5 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#6C4FE0]/20 text-[#6C4FE0]">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Download Performance</h2>
              <p className="text-sm text-gray-400">Total downloads over time</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
            <Filter size={16} className="text-gray-400 ml-2" />
            <select
              className="bg-[#12121E] text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#6C4FE0]"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="yearly">Yearly View</option>
              <option value="monthly">Monthly View</option>
            </select>

            <select
              className="bg-[#12121E] text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#6C4FE0]"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {filterMode === "monthly" && (
              <select
                className="bg-[#12121E] text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#6C4FE0]"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((monthName, i) => (
                  <option key={i} value={i + 1}>{monthName}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="h-72 w-full mt-4 flex items-center justify-center">
          {historyLoading ? (
            <DayalLoader size="sm" text="Loading download statistics..." />
          ) : historyError || !historyData || historyData.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-gray-400 border border-white/5 rounded-xl bg-white/5 p-8 h-full w-full">
                <AlertCircle size={32} className="mb-3 text-gray-500" />
                <p>No download history available yet.</p>
                <p className="text-xs mt-1 opacity-60">(Waiting for real backend API data)</p>
             </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#12121E', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  labelFormatter={(label, payload) => {
                    if (filterMode === "monthly" && payload && payload.length > 0) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Bar 
                  dataKey="downloads" 
                  fill="#6C4FE0" 
                  radius={[4, 4, 0, 0]} 
                  barSize={filterMode === "monthly" ? 12 : 32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Author's Contents */}
      <div className="rounded-2xl border border-white/5 shadow-xl overflow-hidden" style={{ minHeight: '500px' }}>
        <ContentPageLayout
          title={`${author.name || author.username || "Author"}'s Contents`}
          subtitle={`Managing contents uploaded by this author`}
          icon={<User size={22} />}
          accentColor="#6C4FE0"
          contents={contents}
          isLoading={contentsLoading}
          showActions={true}
        />
      </div>
    </div>
  );
};

export default AuthorProfile;
