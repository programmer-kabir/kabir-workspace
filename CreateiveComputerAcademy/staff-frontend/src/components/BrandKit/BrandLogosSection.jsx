import React from 'react';
import { FiLayers, FiDownload, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';

const BrandLogosSection = ({
  filteredLogos,
  handleDownload,
  API_BASE,
}) => {
  if (!filteredLogos || filteredLogos.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <span className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <FiLayers size={15} />
        </span>
        <span>Official Logos & Stamps</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLogos.map((logo) => {
          const logoUrl =
            logo.value?.startsWith('http') || logo.value?.startsWith('/')
              ? logo.value
              : `${API_BASE}${logo.value}`;

          return (
            <div
              key={logo.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              {/* Logo Preview Frame */}
              <div className="w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-6 relative overflow-hidden group">
                <img
                  src={logoUrl}
                  alt={logo.title}
                  className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.src = '/logo.png';
                  }}
                />
              </div>

              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {logo.title}
                  </h4>
                  {logo.format_tag && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {logo.format_tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {logo.subtitle || 'High-resolution official asset'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(logoUrl, `${logo.title.replace(/\s+/g, '_')}.png`)
                  }
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <FiDownload size={14} />
                  <span>Download Asset</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(logoUrl);
                    toast.success('Asset URL Copied!');
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Copy Link"
                >
                  <FiCopy size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandLogosSection;

