import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiDownloadCloud, FiUploadCloud, FiCheckCircle, FiAlertTriangle,
  FiRefreshCw, FiShield, FiLock, FiUnlock, FiMonitor, FiUsers,
  FiHardDrive, FiExternalLink, FiCopy, FiCheck, FiFilter, FiSearch,
  FiCalendar, FiClock, FiLayers, FiFileText, FiTag, FiCpu
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function AppReleases() {
  const { currentUser } = useAuth();
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [releases, setReleases] = useState([]);
  const [latestRelease, setLatestRelease] = useState(null);
  const [fleet, setFleet] = useState({
    total_workstations: 0,
    on_latest_count: 0,
    outdated_count: 0,
    adoption_percent: 100,
    staff_list: []
  });

  const [activeTab, setActiveTab] = useState('releases'); // 'releases' | 'fleet'
  const [searchQuery, setSearchQuery] = useState('');
  const [fleetFilter, setFleetFilter] = useState('all'); // 'all' | 'latest' | 'outdated'
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    version: '',
    release_title: '',
    release_notes: '',
    category: 'feature',
    is_mandatory: false,
    min_supported_version: '',
    binary_source: 'file', // 'file' | 'url'
    download_url: '',
    release_file: null
  });

  // Fetch Releases & Fleet Data
  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await axios.get(`${API_URL}api/admin/app_version/get_releases.php`, {
        headers: getAuthHeaders()
      });

      if (res.data?.status === 'success') {
        setReleases(res.data.releases || []);
        setLatestRelease(res.data.latest || null);
        setFleet(res.data.fleet || {
          total_workstations: 0,
          on_latest_count: 0,
          outdated_count: 0,
          adoption_percent: 100,
          staff_list: []
        });

        // Set default next version for modal
        if (res.data.latest?.version) {
          const parts = res.data.latest.version.split('.').map(Number);
          if (parts.length === 3) {
            const nextVer = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
            setFormData(prev => ({
              ...prev,
              version: prev.version || nextVer,
              min_supported_version: prev.min_supported_version || res.data.latest.version
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching release data:', err);
      toast.error('Failed to load version control data', {
        description: err.response?.data?.message || err.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle Force / Mandatory Update
  const handleToggleForce = async (release) => {
    const newStatus = release.is_mandatory == 1 ? 0 : 1;
    const actionText = newStatus === 1 ? 'Enforcing Mandatory Lockout' : 'Setting to Optional Update';

    try {
      toast.loading(actionText + '...', { id: 'toggle-force' });
      const res = await axios.post(`${API_URL}api/admin/app_version/toggle_force_update.php`, {
        id: release.id
      }, {
        headers: getAuthHeaders()
      });

      if (res.data?.status === 'success') {
        toast.success(`Release v${release.version} is now ${newStatus === 1 ? 'MANDATORY (Lockout Enforced)' : 'OPTIONAL (Silent Update)'}`, {
          id: 'toggle-force'
        });
        // Update local state directly for instant snappy feel
        setReleases(prev => prev.map(r => r.id === release.id ? { ...r, is_mandatory: newStatus } : r));
        if (latestRelease && latestRelease.id === release.id) {
          setLatestRelease(prev => ({ ...prev, is_mandatory: newStatus }));
        }
      } else {
        toast.error(res.data?.message || 'Failed to toggle status', { id: 'toggle-force' });
      }
    } catch (err) {
      toast.error('Failed to toggle force update', {
        id: 'toggle-force',
        description: err.response?.data?.message || err.message
      });
    }
  };

  // Copy Download URL
  const handleCopyUrl = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('R2 Installer Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Form Change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle File Input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.exe')) {
        toast.error('Only Windows .exe installer files are supported');
        return;
      }
      setFormData(prev => ({
        ...prev,
        release_file: file
      }));
    }
  };

  // Publish Release Handler
  const handlePublishSubmit = async (e) => {
    e.preventDefault();

    if (!formData.version) {
      toast.error('Version tag is required (e.g. 1.0.1)');
      return;
    }

    if (formData.binary_source === 'file' && !formData.release_file) {
      toast.error('Please select an .exe installer file to upload');
      return;
    }

    if (formData.binary_source === 'url' && !formData.download_url) {
      toast.error('Please provide a direct installer download URL');
      return;
    }

    try {
      setPublishing(true);
      setUploadProgress(0);

      const formPayload = new FormData();
      formPayload.append('version', formData.version.trim());
      formPayload.append('release_title', formData.release_title.trim());
      formPayload.append('release_notes', formData.release_notes.trim());
      formPayload.append('category', formData.category);
      formPayload.append('is_mandatory', formData.is_mandatory ? '1' : '0');
      formPayload.append('min_supported_version', formData.min_supported_version.trim() || formData.version.trim());
      formPayload.append('admin_id', currentUser?.id || '');

      if (formData.binary_source === 'file' && formData.release_file) {
        formPayload.append('release_file', formData.release_file);
      } else {
        formPayload.append('download_url', formData.download_url.trim());
      }

      const res = await axios.post(`${API_URL}api/admin/app_version/publish_release.php`, formPayload, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        }
      });

      if (res.data?.status === 'success') {
        toast.success(`Release v${formData.version} published successfully!`, {
          description: 'Desktop apps will automatically detect this release on next check.'
        });
        setShowPublishModal(false);
        setFormData({
          version: '',
          release_title: '',
          release_notes: '',
          category: 'feature',
          is_mandatory: false,
          min_supported_version: '',
          binary_source: 'file',
          download_url: '',
          release_file: null
        });
        fetchData();
      } else {
        toast.error(res.data?.message || 'Failed to publish release');
      }
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish release', {
        description: err.response?.data?.message || err.message
      });
    } finally {
      setPublishing(false);
      setUploadProgress(0);
    }
  };

  // Format Helper
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'security':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Critical Security</span>;
      case 'major':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Major Overhaul</span>;
      case 'bugfix':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Bug Fix</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Feature Release</span>;
    }
  };

  // Filtered staff list
  const filteredStaff = fleet.staff_list.filter(s => {
    const matchesSearch = (s.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.workstation_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.current_version || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (fleetFilter === 'latest') return s.is_latest;
    if (fleetFilter === 'outdated') return !s.is_latest;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-lg shadow-indigo-500/25">
              <FiDownloadCloud size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Desktop App Version Control
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  R2 Cloud Fleet
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ডেস্কটপ এটেন্ডেন্স অ্যাপ রিলিজ ম্যানেজমেন্ট, ক্লাউডফ্লেয়ার R2 ডিস্ট্রিবিউশন ও লাইভ ফ্লিট কন্ট্রোল
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-600 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={15} />
            Refresh
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <FiUploadCloud size={17} />
            Publish New Release
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Release */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Production</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FiTag size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              v{latestRelease?.version || '1.0.0'}
            </div>
            {latestRelease && getCategoryBadge(latestRelease.category)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
            {latestRelease?.release_title || 'Initial Stable Release'}
          </p>
        </div>

        {/* Card 2: Fleet Adoption */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fleet Adoption</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FiCpu size={16} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {fleet.adoption_percent}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${fleet.adoption_percent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {fleet.on_latest_count} on latest • {fleet.outdated_count} outdated
          </p>
        </div>

        {/* Card 3: Monitored Workstations */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Connected PCs</span>
            <span className="p-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-lg">
              <FiMonitor size={16} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {fleet.total_workstations}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Total active staff workstations logged
          </p>
        </div>

        {/* Card 4: Global Enforcement Mode */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lockout Policy</span>
            <span className={`p-2 rounded-lg ${latestRelease?.is_mandatory == 1 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
              {latestRelease?.is_mandatory == 1 ? <FiLock size={16} /> : <FiUnlock size={16} />}
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight flex items-center gap-2">
            {latestRelease?.is_mandatory == 1 ? (
              <span className="text-rose-600 dark:text-rose-400">Force Lockout</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">Optional Sync</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Min allowed: <span className="font-semibold text-slate-700 dark:text-slate-300">v{latestRelease?.min_supported_version || '1.0.0'}</span>
          </p>
        </div>
      </div>

      {/* ── Tabs Navigation ─────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('releases')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition -mb-px ${
            activeTab === 'releases'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FiLayers size={17} />
          Release Versions & Binary Vault ({releases.length})
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition -mb-px ${
            activeTab === 'fleet'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FiMonitor size={17} />
          Workstations & Staff Fleet ({fleet.total_workstations})
          {fleet.outdated_count > 0 && (
            <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              {fleet.outdated_count} Outdated
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: RELEASES LIST ─────────────────────────────────── */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FiRefreshCw className="animate-spin text-indigo-600 mb-3" size={32} />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading release history...</p>
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FiUploadCloud className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Releases Published Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Publish your first desktop build to enable seamless Cloudflare R2 binary distribution and auto-updates.
              </p>
              <button
                onClick={() => setShowPublishModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Publish v1.0.0 Release
              </button>
            </div>
          ) : (
            releases.map((release) => {
              const isMandatory = release.is_mandatory == 1;
              const isLatest = latestRelease?.id === release.id;

              return (
                <div
                  key={release.id}
                  className={`bg-white dark:bg-slate-800/90 rounded-2xl border transition-all duration-200 p-6 shadow-sm ${
                    isLatest
                      ? 'border-indigo-400/80 dark:border-indigo-500/50 ring-1 ring-indigo-400/20'
                      : 'border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          v{release.version}
                        </span>

                        {isLatest && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 flex items-center gap-1">
                            <HiSparkles size={13} className="text-indigo-500" />
                            Latest Production
                          </span>
                        )}

                        {getCategoryBadge(release.category)}

                        {isMandatory ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                            <FiLock size={12} />
                            Mandatory (Lockout)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <FiUnlock size={12} />
                            Optional
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {release.release_title || `CCA Desktop Attendance v${release.version}`}
                      </h3>

                      {/* Release Notes */}
                      {release.release_notes && (
                        <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line leading-relaxed font-normal">
                          {release.release_notes}
                        </div>
                      )}

                      {/* Meta Information Bar */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <FiHardDrive size={14} className="text-slate-400" />
                          Installer Size: <strong className="text-slate-700 dark:text-slate-300">{formatFileSize(release.file_size)}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiCalendar size={14} className="text-slate-400" />
                          Published: <strong className="text-slate-700 dark:text-slate-300">{formatDate(release.published_at || release.created_at)}</strong>
                        </span>
                        {release.publisher_name && (
                          <span className="flex items-center gap-1.5">
                            <FiUsers size={14} className="text-slate-400" />
                            Publisher: <strong className="text-slate-700 dark:text-slate-300">{release.publisher_name}</strong>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <FiShield size={14} className="text-slate-400" />
                          Min Supported Version: <strong className="text-slate-700 dark:text-slate-300">v{release.min_supported_version || '1.0.0'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Action Bar */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700/50">
                      {/* Force Update Toggle Switch */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isMandatory ? 'Mandatory Lockout' : 'Optional Update'}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isMandatory ? 'Staff must update to check in' : 'Silent in-app prompt'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleForce(release)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isMandatory ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isMandatory ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Download & Copy Buttons */}
                      <div className="flex items-center gap-2">
                        {release.download_url && (
                          <>
                            <button
                              onClick={() => handleCopyUrl(release.download_url, release.id)}
                              title="Copy Direct R2 Download URL"
                              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition border border-slate-200 dark:border-slate-600"
                            >
                              {copiedId === release.id ? <FiCheck className="text-emerald-500" size={16} /> : <FiCopy size={16} />}
                            </button>

                            <a
                              href={release.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition"
                            >
                              <FiDownloadCloud size={15} />
                              Download .exe
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 2: WORKSTATIONS & LIVE FLEET ────────────────────────── */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search staff, PC name, or version..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFleetFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  fleetFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                All ({fleet.total_workstations})
              </button>
              <button
                onClick={() => setFleetFilter('latest')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  fleetFilter === 'latest'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Up to Date ({fleet.on_latest_count})
              </button>
              <button
                onClick={() => setFleetFilter('outdated')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  fleetFilter === 'outdated'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Outdated ({fleet.outdated_count})
              </button>
            </div>
          </div>

          {/* Fleet Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Workstation / Device</th>
                    <th className="py-3.5 px-4">Current Version</th>
                    <th className="py-3.5 px-4">Fleet Status</th>
                    <th className="py-3.5 px-4">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400">
                        No workstation records match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr key={staff.id || staff.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        {/* Staff */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 border border-indigo-200 dark:border-indigo-800">
                              {staff.staff_avatar ? (
                                <img src={staff.staff_avatar} alt={staff.staff_name} className="w-full h-full object-cover" />
                              ) : (
                                (staff.staff_name || 'U').charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                {staff.staff_name || 'Staff User'}
                              </div>
                              <div className="text-xs text-slate-400">{staff.staff_email || 'staff@cca.com'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Workstation */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FiMonitor className="text-slate-400" size={16} />
                            <div>
                              <div className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                                {staff.workstation_name || 'Lab PC Workstation'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {staff.os_platform || 'Windows 10/11'} • {staff.ip_address || 'LAN'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Current Version */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            v{staff.current_version || '1.0.0'}
                          </span>
                        </td>

                        {/* Fleet Status */}
                        <td className="py-3 px-4">
                          {staff.is_latest ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <FiCheckCircle size={13} />
                              Up to Date
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <FiAlertTriangle size={13} />
                              Outdated (Needs v{latestRelease?.version})
                            </span>
                          )}
                        </td>

                        {/* Last Seen */}
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(staff.last_seen_at || staff.updated_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PUBLISH NEW RELEASE ─────────────────────────────── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                  <FiUploadCloud size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">Publish New Desktop Release</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Upload `.exe` binary to Cloudflare R2 bucket & notify fleet</p>
                </div>
              </div>
              <button
                onClick={() => !publishing && setShowPublishModal(false)}
                disabled={publishing}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePublishSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Version Tag */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Release Version *
                  </label>
                  <input
                    type="text"
                    name="version"
                    required
                    placeholder="e.g. 1.0.1"
                    value={formData.version}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Release Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="feature">Feature Release (New Functionality)</option>
                    <option value="bugfix">Bug Fix & Performance Patch</option>
                    <option value="security">Critical Security Fix</option>
                    <option value="major">Major Architecture Overhaul</option>
                  </select>
                </div>
              </div>

              {/* Release Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Release Headline / Title
                </label>
                <input
                  type="text"
                  name="release_title"
                  placeholder="e.g. Real-time Google Drive Sync & Performance Patch"
                  value={formData.release_title}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Binary Distribution Source */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Installer Binary Source
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="binary_source"
                      value="file"
                      checked={formData.binary_source === 'file'}
                      onChange={() => setFormData(p => ({ ...p, binary_source: 'file' }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Direct .exe Upload (to Cloudflare R2)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="binary_source"
                      value="url"
                      checked={formData.binary_source === 'url'}
                      onChange={() => setFormData(p => ({ ...p, binary_source: 'url' }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Direct Download URL</span>
                  </label>
                </div>

                {formData.binary_source === 'file' ? (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/30 transition">
                    <FiDownloadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                    <label className="cursor-pointer">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Choose Desktop Setup .exe
                      </span>
                      <input
                        type="file"
                        accept=".exe"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      {formData.release_file ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Selected: {formData.release_file.name} ({formatFileSize(formData.release_file.size)})
                        </span>
                      ) : (
                        'Supports Windows installer (.exe) files up to 250MB'
                      )}
                    </p>
                  </div>
                ) : (
                  <input
                    type="url"
                    name="download_url"
                    placeholder="https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/releases/v1.0.1/CCA-Attendance-Setup.exe"
                    value={formData.download_url}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                  />
                )}
              </div>

              {/* Policy Options (Mandatory & Min Supported) */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Force Mandatory Lockout
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      If enabled, staff will be locked out from clocking in until they upgrade.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="is_mandatory"
                    checked={formData.is_mandatory}
                    onChange={handleFormChange}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Minimum Allowed Version
                  </label>
                  <input
                    type="text"
                    name="min_supported_version"
                    placeholder="e.g. 1.0.0"
                    value={formData.min_supported_version}
                    onChange={handleFormChange}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Workstations running a version lower than this will automatically be locked out.
                  </p>
                </div>
              </div>

              {/* Release Notes / Changelog */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Changelog / Release Notes
                </label>
                <textarea
                  name="release_notes"
                  rows={4}
                  placeholder={`- Added 5TB Google Drive task storage\n- Fixed auto-updater silent background sync\n- Performance improvements and instant attendance clock-in`}
                  value={formData.release_notes}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-sans"
                />
              </div>

              {/* Upload Progress Bar */}
              {publishing && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    <span>Uploading installer to Cloudflare R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  disabled={publishing}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Publishing to Fleet...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud size={17} />
                      Publish Release
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
