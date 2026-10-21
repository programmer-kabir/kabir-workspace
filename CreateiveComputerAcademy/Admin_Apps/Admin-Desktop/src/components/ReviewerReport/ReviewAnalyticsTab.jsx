import React from 'react';
import {
  FiAlertCircle,
  FiActivity,
  FiLayers,
  FiCrosshair,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const ReviewAnalyticsTab = ({
  reviewerReport,
  approvedRate,
  rejectedRate,
  slaRate
}) => {
  if (!reviewerReport) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* SLA Alert & Friction Insight */}
      {(reviewerReport.summary?.sla_breached > 0 || Object.keys(reviewerReport.insights?.top_friction || {}).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviewerReport.summary?.sla_breached > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-rose-500">
                <FiAlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-black text-rose-800 dark:text-rose-400 uppercase tracking-wider text-xs">SLA Breach Alert</h4>
                <p className="text-sm text-rose-700 dark:text-rose-300 mt-1 font-medium">
                  This reviewer has <b>{reviewerReport.summary.sla_breached} tasks</b> that took longer than 24 hours to review.
                </p>
              </div>
            </div>
          )}
          {Object.keys(reviewerReport.insights?.top_friction || {}).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-amber-500">
                <FiActivity size={20} />
              </div>
              <div>
                <h4 className="font-black text-amber-800 dark:text-amber-500 uppercase tracking-wider text-xs">Friction Insight</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
                  Highest rejection rate observed with <b>{Object.keys(reviewerReport.insights.top_friction)[0]}</b> ({Object.values(reviewerReport.insights.top_friction)[0]} rejections).
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiLayers /> Total Received
          </p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.summary?.total_received || 0}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiCrosshair /> Total Reviewed
          </p>
          <h3 className="text-3xl font-black text-blue-700 dark:text-blue-400">{reviewerReport.summary?.total_reviewed || 0}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiClock /> In Review
          </p>
          <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400">{reviewerReport.summary?.currently_pending || 0}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiCheckCircle /> Approved
          </p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{reviewerReport.summary?.total_approved || 0}</h3>
            <span className="text-sm font-bold text-emerald-500 mb-1">({approvedRate}%)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiXCircle /> Rejected
          </p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{reviewerReport.summary?.total_rejected || 0}</h3>
            <span className="text-sm font-bold text-rose-500 mb-1">({rejectedRate}%)</span>
          </div>
        </div>
      </div>

      {/* Speed & SLA Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Avg. Review Speed</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.summary?.avg_review_hours || 'N/A'}</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center">
            <FiClock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Avg. Iteration Loops</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.insights?.avg_iterations || 0}x</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center">
            <FiRefreshCw size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiActivity /> SLA Met
            </p>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{slaRate}%</h3>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2 mb-2 overflow-hidden flex">
            <div
              className={`h-2 transition-all duration-1000 ${slaRate >= 90 ? 'bg-emerald-500' : slaRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${slaRate}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
            {reviewerReport.summary?.sla_met || 0} Met &bull; {reviewerReport.summary?.sla_breached || 0} Breached
          </p>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviewerReport.insights?.speed_trend && reviewerReport.insights.speed_trend.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <FiActivity className="text-blue-500" /> Review Speed Trend
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily average turnaround time (in hours).</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reviewerReport.insights.speed_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1e293b' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 900 }}
                    formatter={(value) => [`${value} hours`, 'Avg Speed']}
                  />
                  <Line type="monotone" dataKey="avg_hours" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reviewerReport.insights?.workload_trend && reviewerReport.insights.workload_trend.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <FiLayers className="text-emerald-500" /> Daily Workload (Received vs Reviewed)
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tasks pushed to review vs tasks completed/rejected.</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewerReport.insights.workload_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1e293b' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 15 }} />
                  <Bar dataKey="received" name="Tasks Received" fill="#cbd5e1" radius={[4, 4, 4, 4]} barSize={16} />
                  <Bar dataKey="reviewed" name="Tasks Reviewed" fill="#10b981" radius={[4, 4, 4, 4]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Microscope Detailed Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 dark:text-slate-100">Detailed Review Log (Microscope)</h3>
          <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold">
            {reviewerReport.history?.length || 0} reviews
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Task Title</th>
                <th className="py-4 px-6">Staff Member</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Submitted At</th>
                <th className="py-4 px-6">Reviewed At</th>
                <th className="py-4 px-6">Turnaround Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {reviewerReport.history && reviewerReport.history.length > 0 ? (
                reviewerReport.history.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 w-1/3">
                      {row.title}
                      {row.priority && (
                        <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                          {row.priority}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">{row.staff_name}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          row.status === 'Completed'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {row.status === 'Completed' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      {row.submitted_at
                        ? new Date(row.submitted_at.replace(' ', 'T') + 'Z').toLocaleString('en-US', {
                            timeZone: 'Asia/Dhaka',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })
                        : '-'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                      {row.reviewed_at
                        ? new Date(row.reviewed_at.replace(' ', 'T') + 'Z').toLocaleString('en-US', {
                            timeZone: 'Asia/Dhaka',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })
                        : '-'}
                    </td>
                    <td className="py-4 px-6 font-black text-slate-800 dark:text-slate-100">{row.review_time || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold italic">
                    No review history found.
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

export default ReviewAnalyticsTab;
