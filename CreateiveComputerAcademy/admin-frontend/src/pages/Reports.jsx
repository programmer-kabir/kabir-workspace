import React from 'react';
import {
  FiClock,
  FiFileText,
  FiAlertCircle
} from 'react-icons/fi';
import { ImageLightbox } from '../components/TaskOversight/ImageLightbox';
import { useReportsData } from '../hooks/useReportsData';
import ReportHeader from '../components/Reports/ReportHeader';
import AttendanceReportTab from '../components/Reports/AttendanceReportTab';
import TaskDeliverablesTab from '../components/Reports/TaskDeliverablesTab';
import TaskDetailModal from '../components/Reports/TaskDetailModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

const Reports = () => {
  const reportsData = useReportsData();
  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    selectedTaskModal,
    lightboxImage,
    setLightboxImage,
    selectedStaffInfo
  } = reportsData;

  return (
    <div className="pb-10 animate-in fade-in zoom-in-95 duration-300">
      {/* ──────── Header & Control Filter Panel ──────── */}
      <ReportHeader {...reportsData} />

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm font-semibold flex items-center gap-2 mb-8">
          <FiAlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Employee Badge */}
      {selectedStaffInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden flex-shrink-0">
              {selectedStaffInfo.profile_picture ? (
                <img
                  src={`${API_BASE}${selectedStaffInfo.profile_picture}`}
                  alt={selectedStaffInfo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{selectedStaffInfo.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-none">{selectedStaffInfo.name}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">
                {selectedStaffInfo.designation || 'Employee'} • <span className="text-blue-600 dark:text-blue-400">{selectedStaffInfo.department_name || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <span className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500">
              ID: #{selectedStaffInfo.id}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-8 border border-slate-200 dark:border-slate-800/30">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${activeTab === 'attendance'
            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md shadow-slate-900/5'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
        >
          <FiClock size={16} />
          <span>Attendance Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${activeTab === 'tasks'
            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md shadow-slate-900/5'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
        >
          <FiFileText size={16} />
          <span>Task Deliverables</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Aggregating Report Analytics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <AttendanceReportTab {...reportsData} />
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            <TaskDeliverablesTab {...reportsData} />
          )}

          {/* ──────── Task Details Modal Popup ──────── */}
          {selectedTaskModal && (
            <TaskDetailModal {...reportsData} API_BASE={API_BASE} />
          )}
        </>
      )}

      {/* Lightbox for Target Visual and Reference Images */}
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default Reports;
