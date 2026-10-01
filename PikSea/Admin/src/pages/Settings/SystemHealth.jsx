import React, { useState, useEffect } from 'react';
import DayalLoader from '../../components/Common/DayalLoader';
import { 
  Database,
  Cloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { authFetch } from '../../api/authFetch';

const SystemHealth = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${import.meta.env.VITE_LOCALHOST_KEY}/dashboard/get_system_health.php`);
      const data = await res.json();
      if (data.success) {
        setHealthData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch system health data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleDownloadBackup = () => {
    // Navigate to the PHP endpoint that forces a file download
    window.location.href = `${import.meta.env.VITE_LOCALHOST_KEY}/dashboard/download_backup.php?api_key=${import.meta.env.VITE_APP_SECRET}`;
  };

  const StatCard = ({ title, value, total, icon: Icon, color, percent }) => (
    <div className="bg-[#151521] border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-${color}-500/10 blur-2xl group-hover:bg-${color}-500/20 transition-all duration-300`}></div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">{value}</h3>
            {total && <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">/ {total}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
          <Icon size={22} />
        </div>
      </div>
      
      {percent !== undefined && (
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Usage</span>
            <span className={`text-${color}-400 font-medium`}>{percent}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-${color}-500 rounded-full`} 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health & Logs</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor server resources, storage, and application errors.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            All Systems Operational
          </div>
          <button onClick={fetchHealthData} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
            Refresh Data
          </button>
          <button onClick={handleDownloadBackup} className="flex items-center gap-2 px-4 py-2 bg-[#6C4FE0] hover:bg-[#5b40c6] text-white text-sm font-medium rounded-lg transition-colors">
            <Download size={16} />
            Download Backup
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex py-20 items-center justify-center">
          <DayalLoader text="Monitoring system data & health..." />
        </div>
      ) : (
      <>
        {/* Tabs */}
      <div className="flex space-x-1 border-b border-white/10">
        {['overview', 'logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab 
                ? 'text-[#6C4FE0]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6C4FE0] rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              title="Asset Storage" 
              value={`${healthData?.storage_stats?.size_gb ?? healthData?.r2?.size_gb ?? 0} GB`} 
              total="Hostinger Storage" 
              icon={Cloud} 
              color="cyan" 
            />
            <StatCard 
              title="Database Size" 
              value={`${healthData?.database?.size_mb || 0} MB`} 
              total="Unlimited" 
              icon={Database} 
              color="emerald" 
            />
          </div>

          {/* Detailed Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#151521] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                   <Database size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-white">Database Status</h3>
                   <p className="text-sm text-gray-400">MySQL Primary Cluster</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-3 border-b border-white/5">
                   <span className="text-gray-400 text-sm">Status</span>
                   <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><CheckCircle2 size={14}/> {healthData?.database?.status || 'Unknown'}</span>
                 </div>
                 <div className="flex justify-between items-center py-3 border-b border-white/5">
                   <span className="text-gray-400 text-sm">Version</span>
                   <span className="text-white text-sm font-medium">{healthData?.database?.version || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between items-center py-3 border-b border-white/5">
                   <span className="text-gray-400 text-sm">Size</span>
                   <span className="text-white text-sm font-medium">{healthData?.database?.size_mb || 0} MB</span>
                 </div>
              </div>
            </div>
            
            <div className="bg-[#151521] border border-white/5 rounded-2xl p-6">
               <h4 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                 <Cloud className="text-cyan-400" size={20} />
                 Asset Storage Details
               </h4>
               
               <div className="space-y-6">
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-400">Total Uploads Size</span>
                     <span className="text-white font-medium">{healthData?.storage_stats?.size_gb ?? healthData?.r2?.size_gb ?? 0} GB</span>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-400">Total Objects (Files)</span>
                     <span className="text-white font-medium">{healthData?.storage_stats?.objects ?? healthData?.r2?.objects ?? 0} files</span>
                   </div>
                 </div>
                 <div className="pt-4 border-t border-white/5">
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-400">Storage Location</span>
                     <span className="text-white font-medium">Local Server Storage</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-[#151521] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-white">System & Error Logs</h3>
            
            <div className="flex gap-2">
              <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#6C4FE0]">
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors border border-white/10">
                Clear Logs
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-gray-400 text-sm">
                  <th className="py-4 px-6 font-medium">Level</th>
                  <th className="py-4 px-6 font-medium">Message</th>
                  <th className="py-4 px-6 font-medium">Source</th>
                  <th className="py-4 px-6 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {healthData?.logs?.length > 0 ? (
                  healthData.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        {log.type === 'error' || log.type === 'fatal' ? (
                          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md w-fit text-xs font-medium border border-red-400/20">
                            <XCircle size={14} /> Error
                          </div>
                        ) : log.type === 'warning' ? (
                          <div className="flex items-center gap-2 text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-md w-fit text-xs font-medium border border-orange-400/20">
                            <AlertTriangle size={14} /> Warning
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-md w-fit text-xs font-medium border border-blue-400/20">
                            <CheckCircle2 size={14} /> Info
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300 font-medium">
                        {log.message}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400">
                        {log.source}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 text-right">
                        {log.time}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      </>
      )}
    </div>
  );
};

export default SystemHealth;
