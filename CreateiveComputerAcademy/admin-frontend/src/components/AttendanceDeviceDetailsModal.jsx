import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiX, FiSmartphone, FiMonitor, FiMapPin, FiGlobe, FiShield,
  FiAlertTriangle, FiCheckCircle, FiExternalLink, FiLoader, FiCpu
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const AttendanceDeviceDetailsModal = ({ isOpen, onClose, attendanceId, staffName, date }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !attendanceId) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}api/admin/attendance/get_attendance_device_logs.php?attendance_id=${attendanceId}`);
        if (res.data.status === 'success') {
          setLogs(res.data.data || []);
        } else {
          setError(res.data.message || 'No device log found.');
        }
      } catch (err) {
        setError('Failed to load device logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isOpen, attendanceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center text-lg">
              <FiShield />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Device & Location Security Log
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Staff: <span className="text-slate-800 dark:text-slate-200 font-bold">{staffName}</span> • Date: <span className="font-mono">{date}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <FiLoader size={28} className="animate-spin text-primary-500" />
              <p className="text-sm font-semibold">Loading device logs & location data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-sm font-semibold">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              No device logs recorded for this attendance session.
            </div>
          ) : (
            logs.map((log, index) => {
              const isCheckIn = log.punch_type === 'check_in';
              const isWithin = Number(log.is_within_geofence) === 1;
              const trustScore = Number(log.trust_score || 100);

              let trustColor = 'bg-emerald-500 text-white';
              if (trustScore < 50) trustColor = 'bg-rose-500 text-white';
              else if (trustScore < 85) trustColor = 'bg-amber-500 text-white';

              return (
                <div
                  key={log.id || index}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 relative overflow-hidden"
                >
                  {/* Punch Type Header & Trust Score */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        isCheckIn
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                      }`}>
                        {isCheckIn ? 'Check In Punch' : 'Check Out Punch'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {log.timestamp ? log.timestamp.split(' ')[1] : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${trustColor}`}>
                        🛡️ {trustScore}% Trust
                      </span>
                    </div>
                  </div>

                  {/* Grid Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Device Specs Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/70 shadow-sm space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {log.device_type === 'Mobile' ? <FiSmartphone className="text-primary-500" /> : <FiMonitor className="text-primary-500" />}
                        <span>Device Specifications</span>
                      </div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {log.device_model || log.device_brand || 'Standard PC'}
                      </p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p><span className="font-semibold text-slate-600 dark:text-slate-300">OS:</span> {log.os_name || '—'}</p>
                        <p><span className="font-semibold text-slate-600 dark:text-slate-300">Browser:</span> {log.browser_name || '—'}</p>
                        <p><span className="font-semibold text-slate-600 dark:text-slate-300">Screen:</span> {log.screen_res || '—'}</p>
                      </div>
                    </div>

                    {/* Location & Geofencing Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/70 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <FiMapPin className="text-rose-500" />
                          <span>Office Proximity</span>
                        </div>
                        {isWithin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <FiCheckCircle size={12} /> Inside Range
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                            <FiAlertTriangle size={12} /> Out of Range
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {log.distance_meters !== null ? (
                          <>
                            <span className="text-primary-600 dark:text-primary-400 font-mono">{log.distance_meters} meters</span> away
                          </>
                        ) : (
                          'Desktop IP Verified'
                        )}
                      </p>

                      {log.latitude && log.longitude && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                          <p className="font-mono text-[11px] truncate">Coords: {log.latitude}, {log.longitude}</p>
                          {log.google_maps_url && (
                            <a
                              href={log.google_maps_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-bold text-xs mt-1"
                            >
                              <FiExternalLink size={12} /> View on Google Maps
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Network Details */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <FiGlobe className="text-slate-400" />
                      <span>IP: <strong className="font-mono text-slate-700 dark:text-slate-300">{log.ip_address}</strong></span>
                      {log.network_type && (
                        <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {log.network_type}
                        </span>
                      )}
                    </div>

                    {log.fraud_flags && log.fraud_flags.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                        <FiAlertTriangle size={12} />
                        <span>Flags: {log.fraud_flags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-100 text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDeviceDetailsModal;
