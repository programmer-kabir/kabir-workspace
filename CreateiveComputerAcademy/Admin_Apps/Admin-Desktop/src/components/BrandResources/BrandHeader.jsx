import React from 'react';
import { HiSparkles } from 'react-icons/hi';
import { FiRefreshCw, FiDroplet, FiPlus } from 'react-icons/fi';

/**
 * BrandHeader Component
 * Top banner with Academy Asset Architecture title and quick action buttons.
 */
const BrandHeader = ({
  fetchResources,
  loading = false,
  setBulkModalOpen,
  handleOpenCreate,
  activeTab = 'all'
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20">
            <HiSparkles size={18} className="animate-pulse" />
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-blue-200">
            Academy Asset Architecture
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          CCA Brand Kit & Resources Manager
        </h1>
        <p className="text-sm text-blue-100/80 font-medium max-w-xl leading-relaxed">
          Manage official brand colors, color palettes, vector logos, font downloads, drive templates, and design rules for creative staff and designers.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={fetchResources}
          disabled={loading}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Refresh data"
        >
          <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          onClick={() => setBulkModalOpen && setBulkModalOpen(true)}
          className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-extrabold text-sm rounded-2xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
          title="Import multiple color codes at once"
        >
          <FiDroplet size={16} />
          <span>Bulk Palettes</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpenCreate && handleOpenCreate(activeTab)}
          className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-950/30 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <FiPlus size={18} />
          <span>Add New Resource</span>
        </button>
      </div>
    </div>
  );
};

export default BrandHeader;
