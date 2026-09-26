import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiBookOpen, FiDownloadCloud, FiExternalLink, FiFileText,
  FiLayers, FiCheckCircle, FiCode, FiImage, FiTrendingUp, FiFolder,
  FiRefreshCw
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Resources = () => {
  const { currentUser } = useAuth();
  const { activeCourse, courses, selectCourse } = useCourse();
  const [resourcesData, setResourcesData] = useState({ materials: [], tools: [] });
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const userParam = currentUser?.id ? `user_id=${currentUser.id}` : '';
      const courseParam = activeCourse?.course_id ? `&course_id=${activeCourse.course_id}` : '';
      const res = await axios.get(`${API_BASE}api/student/get_resources.php?${userParam}${courseParam}`);
      if (res.data.status === 'success') {
        setResourcesData(res.data.data || { materials: [], tools: [] });
      }
    } catch (err) {
      console.error('Failed to load course resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [currentUser?.id, activeCourse?.course_id]);

  const handleDownload = (item) => {
    if (item.download_url && item.download_url.startsWith('http')) {
      window.open(item.download_url, '_blank', 'noopener,noreferrer');
      toast.success(`Opening resource: ${item.title}`);
    } else {
      toast.info(`Preparing download: ${item.title}`);
    }
  };

  const materials = resourcesData.materials || [];
  const tools = resourcesData.tools || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6  mx-auto">
      {/* Header with Active Course Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl">
            <FiBookOpen size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Course Resources & Materials
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeCourse?.category || 'Self-Paced'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Active Course: <span className="font-bold text-slate-700 dark:text-slate-200">{activeCourse?.course_title || 'Enrolled Course'}</span> (Dynamic Handouts & Software)
            </p>
          </div>
        </div>

        {/* Multi-Course Switcher if enrolled in > 1 courses */}
        {courses && courses.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {courses.map((c) => (
              <button
                key={c.enrollment_id}
                onClick={() => {
                  selectCourse(c);
                  toast.success(`Switched resources to ${c.course_title}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCourse?.enrollment_id === c.enrollment_id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {c.course_title}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading course resources from database...</p>
        </div>
      ) : materials.length === 0 && tools.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center">
          <FiFolder size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Resources Uploaded Yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Your instructor will upload study guides, templates, and software resources for this batch soon.
          </p>
        </div>
      ) : (
        /* Materials List & Tools Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Handouts & Toolkits */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <FiLayers size={18} className="text-indigo-600" />
                <span>Class Handouts & Asset Packs ({materials.length})</span>
              </h3>
            </div>

            {materials.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                No handouts available for this course yet.
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                        <FiFileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {item.title}
                          </h4>
                          <span className="hidden sm:inline-block px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description || `${item.type} • ${item.size}`}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(item)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      title="Download or View"
                    >
                      <FiDownloadCloud size={16} />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Software & Tools */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <HiSparkles size={18} className="text-amber-400" />
              <span>Recommended Software ({tools.length})</span>
            </h3>

            {tools.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                No software tools listed for this course yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {tool.name}
                      </h4>
                      <FiExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.desc}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
