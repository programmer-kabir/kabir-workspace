import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiHardDrive, FiCloud, FiServer, FiCheckCircle, FiAlertCircle,
  FiRefreshCw, FiSave, FiLayers, FiFolder, FiSliders, FiShield,
  FiZap, FiArrowRight, FiExternalLink, FiCpu, FiKey, FiRadio,
  FiUser, FiMessageSquare, FiShare2, FiBookOpen, FiAward, FiFilter,
  FiFileText, FiVideo, FiImage
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

export default function StorageSettings() {
  const getApiBase = () => {
    return import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';
  };

  const API_URL = getApiBase();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingR2, setTestingR2] = useState(false);
  const [testingGDrive, setTestingGDrive] = useState(false);
  const [r2TestResult, setR2TestResult] = useState(null);
  const [gdriveTestResult, setGdriveTestResult] = useState(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');

  // Complete Storage Settings State
  const [settings, setSettings] = useState({
    // Core Tasks & Deliveries
    routing_source_files: 'r2',
    routing_preview_images: 'r2',
    routing_videos: 'r2',
    routing_student_submissions: 'r2',
    routing_review_screenshots: 'r2',

    // Profiles, Chat, Community, Blogs, Brand & Courses
    routing_profile_pictures: 'local',
    routing_chat_files: 'local',
    routing_community_posts: 'local',
    routing_blog_images: 'local',
    routing_brand_assets: 'r2',
    routing_course_materials: 'r2',

    // Folder Paths & Directory Prefixes
    folder_profiles: 'uploads/profiles',
    folder_chat: 'uploads/chat',
    folder_community: 'uploads/community',
    folder_blogs: 'uploads/blogs',
    folder_brand: 'uploads/brand_resources',
    folder_courses: 'uploads/courses',
    folder_reviews: 'task_reviews',

    // Cloud Vault Credentials & IDs
    gdrive_enabled: '0',
    gdrive_root_folder_id: '',
    gdrive_task_folder_name: 'Task_Submissions',
    gdrive_final_folder_name: 'Approved_Final_Deliveries',
    r2_enabled: '1',
    r2_bucket_name: 'cca-task-attachments',
    r2_public_url: 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev',
    r2_prefix_tasks: 'task_submissions',
    emergency_failover: '1'
  });

  const [health, setHealth] = useState({
    r2: { configured: true, bucket: 'cca-task-attachments', status: 'online' },
    gdrive: { configured: false, status: 'awaiting_credentials' },
    local: { free_space_gb: 0, status: 'online' }
  });

  // Fetch Settings on Mount
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}api/admin/storage/get_storage_settings.php`, {
        headers: getAuthHeaders()
      });

      if (res?.data?.status === 'success') {
        setSettings(prev => ({ ...prev, ...(res.data.settings || {}) }));
        if (res.data.health) setHealth(res.data.health);
      }
    } catch (err) {
      console.error('Failed to load storage settings', err);
      toast.error('স্টোরেজ সেটিংস লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.post(`${API_URL}api/admin/storage/save_storage_settings.php`, { settings }, {
        headers: getAuthHeaders()
      });

      if (res?.data?.status === 'success') {
        toast.success('সকল ক্লাউড ও লোকাল স্টোরেজ রাউটিং রুলস সফলভাবে সেভ হয়েছে!');
      } else {
        toast.error(res?.data?.message || 'সেটিংস সংরক্ষণে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Failed to save storage settings', err);
      toast.error('সার্ভারে সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  // Ping Test Handlers
  const handleTestR2 = async () => {
    try {
      setTestingR2(true);
      setR2TestResult(null);
      const res = await axios.get(`${API_URL}api/admin/storage/test_storage_connection.php?provider=r2`, {
        headers: getAuthHeaders()
      });
      setR2TestResult(res?.data);
      if (res?.data?.status === 'success') {
        toast.success(`Cloudflare R2 সংযুক্ত আছে! (${res.data.latency_ms}ms)`);
      } else {
        toast.warning(res?.data?.message || 'R2 রেসপন্স চেক করুন');
      }
    } catch (e) {
      toast.error('R2 টেস্টে ত্রুটি ঘটেছে');
    } finally {
      setTestingR2(false);
    }
  };

  const handleTestGDrive = async () => {
    try {
      setTestingGDrive(true);
      setGdriveTestResult(null);
      const res = await axios.get(`${API_URL}api/admin/storage/test_storage_connection.php?provider=gdrive`, {
        headers: getAuthHeaders()
      });
      setGdriveTestResult(res?.data);
      if (res?.data?.status === 'success') {
        toast.success(`গুগল ড্রাইভ সফলভাবে ভেরিফাইড! (${res.data.latency_ms}ms)`);
      } else if (res?.data?.status === 'pending') {
        toast.info(res.data.message);
      } else {
        toast.warning(res?.data?.message || 'Google Drive কনফিগারেশন চেক করুন');
      }
    } catch (e) {
      toast.error('Google Drive টেস্টে ত্রুটি ঘটেছে');
    } finally {
      setTestingGDrive(false);
    }
  };

  // Helper for rendering active storage badge on router card
  const getProviderInfo = (provider, path = '') => {
    switch (provider) {
      case 'gdrive':
        return {
          label: 'Google Drive 5TB',
          badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          pathText: `gdrive://root/${path || settings.gdrive_task_folder_name}`
        };
      case 'local':
        return {
          label: 'Hostinger Local Server',
          badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          pathText: `hostinger:///server/${path}`
        };
      case 'r2':
      default:
        return {
          label: 'Cloudflare R2 Edge',
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          pathText: `r2://${settings.r2_bucket_name}/${path}`
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={36} />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Cloud Vault Control Center...</p>
        </div>
      </div>
    );
  }

  // All 11 Router Items with comprehensive metadata
  const routingCategories = [
    // 🎨 Group 1: Tasks & Production
    {
      id: 'routing_source_files',
      key: 'routing_source_files',
      group: 'tasks',
      badge: 'Heavy Assets',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      title: 'টাস্কের মূল সোর্স ফাইল (.psd, .ai, .eps, .zip, .rar)',
      desc: 'স্টাফদের তৈরি করা হেভি গ্রাফিক্স ও প্রজেক্ট সোর্স ফাইলগুলো কোন স্টোরেজে আপলোড হবে?',
      types: 'PSD, AI, EPS, ZIP, RAR, 7Z, PDF',
      pathKey: 'gdrive_task_folder_name',
      options: [
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault (প্রস্তাবিত: ফ্রি ৫টিবি স্টোরেজ)' },
        { value: 'r2', label: '☁️ Cloudflare R2 Bucket (cca-task-attachments)' },
        { value: 'local', label: '🖥️ Hostinger Local Server (/uploads/)' }
      ]
    },
    {
      id: 'routing_preview_images',
      key: 'routing_preview_images',
      group: 'tasks',
      badge: 'Fast CDN Preview',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      title: 'টাস্ক প্রিভিউ ও থাম্বনেইল ইমেজ (.jpg, .jpeg, .png, .webp)',
      desc: 'টাস্কের প্রিভিউ ও থাম্বনেইল ছবিগুলো চোখের পলকে লোড হওয়ার জন্য কোথায় রাখা হবে?',
      types: 'JPG, PNG, WEBP, GIF, SVG',
      pathKey: 'r2_prefix_tasks',
      options: [
        { value: 'r2', label: '⚡ Cloudflare R2 CDN (সুপারফাস্ট লোডিং - প্রস্তাবিত)' },
        { value: 'local', label: '🖥️ Hostinger Local Server' },
        { value: 'gdrive', label: '🐢 Google Drive (লোডিং কিছুটা সময় নেবে)' }
      ]
    },
    {
      id: 'routing_videos',
      key: 'routing_videos',
      group: 'tasks',
      badge: 'Video Renders',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      title: 'ভিডিও ডেলিভারি ও রেন্ডার ফাইল (.mp4, .mov, .webm)',
      desc: 'বড় সাইজের ভিডিও অ্যানিমেশন ও মোশন গ্রাফিক্স ফাইনাল ডেলিভারি ফাইল কোথায় জমা হবে?',
      types: 'MP4, MOV, WEBM, MKV',
      pathKey: 'gdrive_task_folder_name',
      options: [
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault (প্রস্তাবিত: বড় ভিডিওর জন্য)' },
        { value: 'r2', label: '☁️ Cloudflare R2 Bucket' },
        { value: 'local', label: '🖥️ Hostinger Local Server' }
      ]
    },
    {
      id: 'routing_review_screenshots',
      key: 'routing_review_screenshots',
      group: 'tasks',
      badge: 'Quality Control',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      title: 'রিভিউয়ার রিজেকশন ও মার্কআপ স্ক্রিনশট',
      desc: 'রিভিউয়ারদের দেওয়া কাজের সংশোধন, মার্কআপ ড্রয়িং এবং রিজেকশন প্রুফ কোথায় সেভ হবে?',
      types: 'PNG, JPG, WEBP',
      pathKey: 'folder_reviews',
      options: [
        { value: 'r2', label: '⚡ Cloudflare R2 Edge CDN (দ্রুত লোড - প্রস্তাবিত)' },
        { value: 'local', label: '🖥️ Hostinger Local Server' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault' }
      ]
    },

    // 👤 Group 2: Profiles & Chat
    {
      id: 'routing_profile_pictures',
      key: 'routing_profile_pictures',
      group: 'users',
      badge: 'Identity Avatars',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      title: 'স্টাফ, স্টুডেন্ট ও অ্যাডমিন প্রোফাইল ছবি (Avatars & Covers)',
      desc: 'সকল ব্যবহারকারীর প্রোফাইল ও কভার ফটো সাইটের স্পিড না কমিয়ে দ্রুত লোড হওয়ার জন্য কোথায় সেভ হবে?',
      types: 'JPG, PNG, WEBP',
      pathKey: 'folder_profiles',
      options: [
        { value: 'local', label: '🖥️ Hostinger Local Server (ডিফল্ট: uploads/profiles/)' },
        { value: 'r2', label: '⚡ Cloudflare R2 Edge CDN (সুপারফাস্ট লোডিং)' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault' }
      ]
    },
    {
      id: 'routing_chat_files',
      key: 'routing_chat_files',
      group: 'users',
      badge: 'Direct Messaging',
      badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      title: 'চ্যাট বক্স মিডিয়া, অডিও ও ভয়েস মেসেজ',
      desc: 'টিম চ্যাট ও ডিরেক্ট মেসেজিংয়ে পাঠানো ভয়েস নোট, ডকুমেন্ট, পিডিএফ ও ছবি কোথায় সংরক্ষিত থাকবে?',
      types: 'MP3, OGG, WAV, PDF, JPG, PNG, DOCX',
      pathKey: 'folder_chat',
      options: [
        { value: 'local', label: '🖥️ Hostinger Local Server (ডিফল্ট: uploads/chat/)' },
        { value: 'r2', label: '☁️ Cloudflare R2 Bucket' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault' }
      ]
    },

    // 📢 Group 3: Community & Blogs
    {
      id: 'routing_community_posts',
      key: 'routing_community_posts',
      group: 'social',
      badge: 'Community Wall',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      title: 'কমিউনিটি ওয়াল ও সোশ্যাল ফিড পোস্ট মিডিয়া',
      desc: 'স্টাফ ও স্টুডেন্টদের সোশ্যাল ওয়ালে শেয়ার করা ডিজাইন শোকেস, অ্যাওয়ার্ড ও ছবি কোথায় সেভ হবে?',
      types: 'JPG, PNG, WEBP, GIF',
      pathKey: 'folder_community',
      options: [
        { value: 'local', label: '🖥️ Hostinger Local Server (ডিফল্ট: uploads/community/)' },
        { value: 'r2', label: '⚡ Cloudflare R2 Edge CDN (উচ্চ গতির সোশ্যাল ব্রাউজিং)' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault' }
      ]
    },
    {
      id: 'routing_blog_images',
      key: 'routing_blog_images',
      group: 'social',
      badge: 'Academy Journal',
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      title: 'একাডেমি ব্লগ ও নিউজ আর্টিকেলের ফিচার ব্যানার',
      desc: 'অফিশিয়াল ব্লগ, টিউটোরিয়াল ও পাবলিশ করা নিউজের কভার ব্যানার ও কনটেন্ট ছবি কোথায় থাকবে?',
      types: 'JPG, PNG, WEBP, SVG',
      pathKey: 'folder_blogs',
      options: [
        { value: 'local', label: '🖥️ Hostinger Local Server (ডিফল্ট: uploads/blogs/)' },
        { value: 'r2', label: '⚡ Cloudflare R2 Edge CDN (এসইও ও দ্রুত পেইজ লোডের জন্য সেরা)' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault' }
      ]
    },

    // 🎓 Group 4: Academics & Brand Kit
    {
      id: 'routing_brand_assets',
      key: 'routing_brand_assets',
      group: 'academy',
      badge: 'Official Brand Kit',
      badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      title: 'ব্র্যান্ড কিট ও অফিশিয়াল এসেটস (Logos, Vectors, Fonts)',
      desc: 'অ্যাকাডেমির অফিশিয়াল লোগো প্যাকেজ, ভেক্টর ব্যাজ, সার্টিফিকেট টেমপ্লেট ও ফন্ট প্যাক কোথায় জমা হবে?',
      types: 'AI, EPS, SVG, PNG, PDF, TTF, OTF',
      pathKey: 'folder_brand',
      options: [
        { value: 'r2', label: '⚡ Cloudflare R2 Edge (অবিরাম ও হাই-স্পিড ডাউনলোড - প্রস্তাবিত)' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault (দীর্ঘমেয়াদী ব্যাকআপ)' },
        { value: 'local', label: '🖥️ Hostinger Local Server' }
      ]
    },
    {
      id: 'routing_course_materials',
      key: 'routing_course_materials',
      group: 'academy',
      badge: 'Curriculum & Lectures',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      title: 'কোর্স লেকচার, সিলেবাস ও স্টাডি মেটেরিয়ালস',
      desc: 'ক্লাসের লেকচার শিট, হ্যান্ডআউটস, প্র্যাকটিস মেটেরিয়াল ও রেকর্ডেড ক্লাস ভিডিও কোথায় জমা থাকবে?',
      types: 'PDF, ZIP, MP4, PPTX, DOCX',
      pathKey: 'folder_courses',
      options: [
        { value: 'r2', label: '☁️ Cloudflare R2 Bucket (দ্রুত স্টুডেন্ট অ্যাক্সেস)' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault (ভারী ভিডিও ও আর্কাইভের জন্য)' },
        { value: 'local', label: '🖥️ Hostinger Local Server' }
      ]
    },
    {
      id: 'routing_student_submissions',
      key: 'routing_student_submissions',
      group: 'academy',
      badge: 'Student Submissions',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      title: 'স্টুডেন্ট কোর্স অ্যাসাইনমেন্ট ও ডেইলি লগ সাবমিশন',
      desc: 'স্টুডেন্টদের ক্লাসের হোমওয়ার্ক, অ্যাসাইনমেন্ট ও ডেইলি প্র্যাকটিস ফাইলগুলো কোথায় সেভ হবে?',
      types: 'ZIP, PSD, AI, JPG, PNG',
      pathKey: 'r2_prefix_tasks',
      options: [
        { value: 'r2', label: '☁️ Cloudflare R2 (cca-task-attachments বাকেট)' },
        { value: 'gdrive', label: '🌟 Google Drive 5TB Vault (আনলিমিটেড স্টুডেন্ট ওয়ার্ক)' },
        { value: 'local', label: '🖥️ Hostinger Local Server' }
      ]
    }
  ];

  // Filter categories by active tab
  const filteredCategories = activeCategoryTab === 'all'
    ? routingCategories
    : routingCategories.filter(c => c.group === activeCategoryTab);

  return (
    <div className="space-y-8 pb-20 mx-auto px-1 sm:px-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <HiSparkles size={11} className="text-amber-300" />
              Full Storage Control Center
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              11 Categories Connected
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <FiHardDrive className="text-blue-400" />
            <span>Cloud Vault & Storage Routing Manager</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium">
            অ্যাডমিন প্যানেল থেকে সরাসরি সম্পূর্ণ সিস্টেমের ক্লাউড ও লোকাল স্টোরেজ নিয়ন্ত্রণ করুন। টাস্ক, প্রোফাইল, চ্যাট, কমিউনিটি ওয়াল, ব্লগ এবং কোর্স মেটেরিয়াল—কোন ফাইলটি কোন প্রোভাইডারে যাবে তা এখান থেকে পরিবর্তন করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={fetchSettings}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10"
            title="Refresh Status"
          >
            <FiRefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <FiRefreshCw className="animate-spin" size={14} />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <FiSave size={15} />
                <span>Save All Storage Rules</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Metric Cards: Live Storage Connectivity ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cloudflare R2 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <FiCloud size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cloudflare R2</h3>
                  <p className="text-[11px] text-slate-400">High-Speed CDN Storage</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <FiCheckCircle size={11} /> Active
              </span>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Main Bucket:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{settings.r2_bucket_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Egress Bandwidth:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Free / Unlimited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Fast Previews, Brand Assets & CDN</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              {r2TestResult ? `${r2TestResult.latency_ms}ms response` : 'Edge CDN Ready'}
            </span>
            <button
              type="button"
              onClick={handleTestR2}
              disabled={testingR2}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FiZap size={12} className={testingR2 ? 'animate-spin' : ''} />
              <span>{testingR2 ? 'Pinging...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Google Drive 5TB */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <FiHardDrive size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Google Drive 5TB</h3>
                  <p className="text-[11px] text-slate-400">Heavy Production Vault</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, gdrive_enabled: prev.gdrive_enabled === '1' ? '0' : '1' }))}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 cursor-pointer transition-all ${settings.gdrive_enabled === '1'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}>
                <span className={`w-2 h-2 rounded-full ${settings.gdrive_enabled === '1' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {settings.gdrive_enabled === '1' ? 'Active / Enabled' : 'Standby (Click to Enable)'}
              </button>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Capacity:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">5,000 GB (5 TB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Task Folder:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{settings.gdrive_task_folder_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Big PSD, AI, Video & ZIP Archives</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              {health.gdrive?.configured ? 'Credentials Ready' : 'Service Account Mode'}
            </span>
            <button
              type="button"
              onClick={handleTestGDrive}
              disabled={testingGDrive}
              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FiZap size={12} className={testingGDrive ? 'animate-spin' : ''} />
              <span>{testingGDrive ? 'Checking...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Hostinger Local Server */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <FiServer size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Hostinger Web Server</h3>
                  <p className="text-[11px] text-slate-400">Local Uploads Directory</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <FiCheckCircle size={11} /> Healthy
              </span>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Disk Free Space:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{health.local?.free_space_gb ? `${health.local.free_space_gb} GB Free` : 'Unlimited Plan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Local Directory:</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">server/uploads/</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Profiles, Chat, Wall & System Files</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Web Directory Writable
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Hostinger
            </span>
          </div>
        </div>
      </div>

      {/* ── Test Result Diagnostics Output ── */}
      {(r2TestResult || gdriveTestResult) && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FiZap size={14} className="text-amber-500" /> Live Diagnostics Output:
          </p>
          {r2TestResult && (
            <div className="text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-amber-500">[Cloudflare R2]</span>
              <span>{r2TestResult.message}</span>
            </div>
          )}
          {gdriveTestResult && (
            <div className="text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-blue-500">[Google Drive]</span>
              <span>{gdriveTestResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Section 1: Dynamic Storage Router (Comprehensive 11 Categories) ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiSliders className="text-blue-500" />
              <span>ফাইল রাউটিং কন্ট্রোল সেন্টার (Dynamic Storage Router Matrix)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              যেকোনো ক্যাটাগরির ফাইলের টার্গেট ক্লাউড বা লোকাল প্রোভাইডার সিলেক্ট করুন। পরিবর্তন সাথে সাথে প্রযোজ্য হবে।
            </p>
          </div>

          {/* Quick Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveCategoryTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${activeCategoryTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              সবগুলো রুলস ({routingCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('tasks')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${activeCategoryTab === 'tasks'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiLayers size={12} /> টাস্ক ও প্রোডাকশন (4)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('users')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${activeCategoryTab === 'users'
                ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiUser size={12} /> প্রোফাইল ও চ্যাট (2)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('social')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${activeCategoryTab === 'social'
                ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiShare2 size={12} /> সোশ্যাল ও ব্লগ (2)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('academy')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${activeCategoryTab === 'academy'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiBookOpen size={12} /> অ্যাকাডেমিক ও ব্র্যান্ড (3)
            </button>
          </div>
        </div>

        {/* 11 Dynamic Router Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCategories.map((cat) => {
            const currentProvider = settings[cat.key] || 'local';
            const pathValue = settings[cat.pathKey] || '';
            const provInfo = getProviderInfo(currentProvider, pathValue);

            return (
              <div
                key={cat.id}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${provInfo.badgeClass}`}>
                      {provInfo.label}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {cat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {cat.desc}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-slate-500">সমর্থিত ফরম্যাট:</span> {cat.types}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    টার্গেট স্টোরেজ প্রোভাইডার সিলেক্ট করুন:
                  </label>
                  <select
                    value={settings[cat.key] || 'local'}
                    onChange={(e) => setSettings(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  >
                    {cat.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Active Path Preview */}
                  <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 font-mono">
                    <span>টার্গেট পাথ:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold truncate max-w-[240px]" title={provInfo.pathText}>
                      {provInfo.pathText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Complete Folder Paths & Directory Prefixes Customizer ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiFolder className="text-amber-500" />
              <span>ক্লাউড ও লোকাল ফোল্ডার পাথ কনফিগারেশন (Directory Prefixes & Folders)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              গুগল ড্রাইভ, ক্লাউডফ্লেয়ার R2 এবং লোকাল হোস্টিং সার্ভারে ফাইলগুলো যে যে ফোল্ডারে জমা হবে তা অ্যাডমিন এখান থেকে নিজের ইচ্ছামতো পরিবর্তন করতে পারবেন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. GDrive Task Submissions Folder */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiHardDrive className="text-blue-500" size={13} />
              <span>GDrive Task Submissions Folder</span>
            </label>
            <input
              type="text"
              value={settings.gdrive_task_folder_name || 'Task_Submissions'}
              onChange={(e) => setSettings(prev => ({ ...prev, gdrive_task_folder_name: e.target.value }))}
              placeholder="Task_Submissions"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">স্টাফদের টাস্ক ফাইল ড্রাইভে এই ফোল্ডারে যাবে।</p>
          </div>

          {/* 2. GDrive Final Deliveries Folder */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500" size={13} />
              <span>GDrive Approved Final Folder</span>
            </label>
            <input
              type="text"
              value={settings.gdrive_final_folder_name || 'Approved_Final_Deliveries'}
              onChange={(e) => setSettings(prev => ({ ...prev, gdrive_final_folder_name: e.target.value }))}
              placeholder="Approved_Final_Deliveries"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">অনুমোদিত ফাইনাল ডেলিভারির জন্য ড্রাইভ ফোল্ডার।</p>
          </div>

          {/* 3. GDrive Root Folder ID */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiKey className="text-purple-500" size={13} />
              <span>Google Drive Root Folder ID</span>
            </label>
            <input
              type="text"
              value={settings.gdrive_root_folder_id || ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                setSettings(prev => ({
                  ...prev,
                  gdrive_root_folder_id: val,
                  gdrive_enabled: val ? '1' : prev.gdrive_enabled
                }));
              }}
              placeholder="1A_bcDeF-gHiJkLmNoPqRsTuVwXyZ"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">৫টিবি ড্রাইভের মূল ফোল্ডারটির আইডি (ঐচ্ছিক)।</p>
          </div>

          {/* 4. R2 Task Prefix */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiCloud className="text-amber-500" size={13} />
              <span>Cloudflare R2 Key Prefix for Tasks</span>
            </label>
            <input
              type="text"
              value={settings.r2_prefix_tasks || 'task_submissions'}
              onChange={(e) => setSettings(prev => ({ ...prev, r2_prefix_tasks: e.target.value }))}
              placeholder="task_submissions"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">R2 বাকেটের ভিতরে টাস্ক প্রিভিউ পাথ কি।</p>
          </div>

          {/* 5. Profile Pictures Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiUser className="text-cyan-500" size={13} />
              <span>Profile Pictures Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_profiles || 'uploads/profiles'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_profiles: e.target.value }))}
              placeholder="uploads/profiles"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">ইউজার প্রোফাইল ও কভার ছবির ডিরেক্টরি পাথ।</p>
          </div>

          {/* 6. Chat Files Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiMessageSquare className="text-violet-500" size={13} />
              <span>Chat & Voice Media Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_chat || 'uploads/chat'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_chat: e.target.value }))}
              placeholder="uploads/chat"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">চ্যাটের ফাইল ও ভয়েস রেকর্ডিং ফোল্ডার পাথ।</p>
          </div>

          {/* 7. Community Wall Media Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiShare2 className="text-pink-500" size={13} />
              <span>Community Wall Posts Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_community || 'uploads/community'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_community: e.target.value }))}
              placeholder="uploads/community"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">কমিউনিটি ওয়াল সোশ্যাল ফিড পোস্ট ফোল্ডার পাথ।</p>
          </div>

          {/* 8. Blog & News Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiFileText className="text-orange-500" size={13} />
              <span>Academy Blog Images Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_blogs || 'uploads/blogs'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_blogs: e.target.value }))}
              placeholder="uploads/blogs"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">একাডেমি ব্লগ ব্যানার ও পোস্টের ছবি পাথ।</p>
          </div>

          {/* 9. Brand Resources Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiAward className="text-yellow-500" size={13} />
              <span>Brand Kit & Assets Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_brand || 'uploads/brand_resources'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_brand: e.target.value }))}
              placeholder="uploads/brand_resources"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">অফিশিয়াল লোগো ও সার্টিফিকেট এসেটস পাথ।</p>
          </div>

          {/* 10. Course Curriculum Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiBookOpen className="text-emerald-500" size={13} />
              <span>Courses & Lectures Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_courses || 'uploads/courses'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_courses: e.target.value }))}
              placeholder="uploads/courses"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">কোর্সের স্টাডি মেটেরিয়াল ও লেকচার ফাইল পাথ।</p>
          </div>

          {/* 11. Reviewer Proofs Path */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiCheckCircle className="text-rose-500" size={13} />
              <span>Reviewer Proofs Folder Path</span>
            </label>
            <input
              type="text"
              value={settings.folder_reviews || 'task_reviews'}
              onChange={(e) => setSettings(prev => ({ ...prev, folder_reviews: e.target.value }))}
              placeholder="task_reviews"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">টাস্ক রিভিউয়ারদের প্রুফ ও কমেন্ট স্ক্রিনশট পাথ।</p>
          </div>
        </div>
      </div>

      {/* ── Section 3: Safety, Security & Failover Switches ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiShield className="text-emerald-500" />
              <span>নিরাপত্তা ও ইমার্জেন্সি ব্যাকআপ সুইচ (Failover & Safety)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              কোনো একটি ক্লাউড সাময়িকভাবে কাজ না করলে যাতে ফাইল আপলোড কোনো অবস্থাতেই না আটকায়।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Failover Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FiZap className="text-amber-500" size={15} />
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Auto Emergency Failover</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                গুগল ড্রাইভে কোনো সাময়িক ত্রুটি হলে স্বয়ংক্রিয়ভাবে ক্লাউডফ্লেয়ার R2 তে ফাইল সেভ হবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({
                ...prev,
                emergency_failover: prev.emergency_failover === '1' ? '0' : '1'
              }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${settings.emergency_failover === '1' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${settings.emergency_failover === '1' ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>

          {/* GDrive Master Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FiHardDrive className="text-blue-500" size={15} />
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Google Drive 5TB Master Switch</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                গুগল ড্রাইভ ইন্টিগ্রেশন চালু বা সাময়িকভাবে বন্ধ করার মূল সুইচ।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({
                ...prev,
                gdrive_enabled: prev.gdrive_enabled === '1' ? '0' : '1'
              }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${settings.gdrive_enabled === '1' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${settings.gdrive_enabled === '1' ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Sticky Bottom Save Bar ── */}
      <div className="sticky bottom-4 z-40 flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <FiCpu size={16} />
          </div>
          <div>
            <p className="text-xs font-bold">Master Storage Matrix Ready</p>
            <p className="text-[10px] text-slate-400">যেকোনো পরিবর্তন ডাটাবেসে সেভ করতে ডানের বাটনে চাপুন</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <FiRefreshCw className="animate-spin" size={13} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave size={14} />
              <span>Save Storage Rules</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
