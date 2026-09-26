import React from 'react';
import { FiDroplet, FiX, FiCheck } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

/**
 * BulkPaletteModal Component
 * Modal for importing multiple HEX colors and paletted themes at once with live swatch grid.
 */
const BulkPaletteModal = ({
  bulkModalOpen = false,
  setBulkModalOpen,
  bulkGroupName = 'Primary Brand',
  setBulkGroupName,
  colorPresets = [],
  bulkColorText = '',
  setBulkColorText,
  parsedBulkList = [],
  handleSaveBulk,
  bulkSaving = false
}) => {
  if (!bulkModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FiDroplet size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Bulk Color Palette Import
              </h3>
              <p className="text-[11px] text-slate-400">
                Enter or paste multiple HEX color codes at once
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBulkModalOpen && setBulkModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Group / Tag Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Palette Group / Tag Name *
            </label>
            <input
              type="text"
              value={bulkGroupName}
              onChange={(e) => setBulkGroupName && setBulkGroupName(e.target.value)}
              placeholder="e.g. Primary Brand, Social Media Theme, Certificate Palette"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Fast Presets */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Select Quick Preset Palettes:
            </span>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (setBulkGroupName) setBulkGroupName(preset.tag);
                    if (setBulkColorText) setBulkColorText(preset.text);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                HEX Color Codes (comma or new-line separated) *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                e.g. #1E40AF - Navy Blue
              </span>
            </div>
            <textarea
              rows={6}
              value={bulkColorText}
              onChange={(e) => setBulkColorText && setBulkColorText(e.target.value)}
              placeholder={`#0F172A - Deep Slate Navy\n#1E3A8A - Royal Navy\n#2563EB - Primary Blue\n#60A5FA - Sky Blue Accent\n#F8FAFC - Snow White`}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
            />
          </div>

          {/* Live Preview Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <HiSparkles className="text-amber-500" />
                <span>Live Preview ({parsedBulkList.length} Colors Detected)</span>
              </span>
              {parsedBulkList.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Ready to Import
                </span>
              )}
            </div>

            {parsedBulkList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Type or paste HEX color codes above to see live swatches.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {parsedBulkList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <div
                      className="w-7 h-7 rounded-lg shadow-inner border border-slate-300 dark:border-slate-700 shrink-0"
                      style={{ backgroundColor: item.value }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                      <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Total {parsedBulkList.length} items will be created
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBulkModalOpen && setBulkModalOpen(false)}
              className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBulk}
              disabled={bulkSaving || parsedBulkList.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-900/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FiCheck size={14} />
              <span>{bulkSaving ? 'Importing...' : `Import All ${parsedBulkList.length} Colors`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPaletteModal;
