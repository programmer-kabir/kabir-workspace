import React from 'react';
import { FiDroplet, FiCheck, FiCopy } from 'react-icons/fi';

const BrandColorsSection = ({
  visibleColors,
  colorGroups,
  selectedColorGroup,
  setSelectedColorGroup,
  copiedCode,
  handleCopyHex,
}) => {
  if (!visibleColors || visibleColors.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FiDroplet size={15} />
          </span>
          <span>Brand Colors & Swatches</span>
        </h3>

        {/* Sub-palette Filter Pills */}
        {colorGroups && colorGroups.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {colorGroups.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedColorGroup(grp)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedColorGroup === grp
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {grp === 'all' ? 'All Groups' : grp}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleColors.map((color) => {
          const isCopied = copiedCode === color.value;
          const isGradient = color.value?.toLowerCase().includes('gradient');
          const isLight =
            !isGradient &&
            (color.value.toLowerCase() === '#ffffff' || color.value.toLowerCase() === '#fff');
          const bgStyle = isGradient ? { background: color.value } : { backgroundColor: color.value };

          return (
            <div
              key={color.id}
              onClick={() => handleCopyHex(color.value, color.title)}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden"
            >
              {/* Top Swatch */}
              <div
                className={`w-full h-24 rounded-xl shadow-inner transition-transform group-hover:scale-[1.02] ${
                  isLight ? 'border border-slate-300 dark:border-slate-600' : ''
                }`}
                style={bgStyle}
              />

              {/* Details */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                    {color.title}
                  </h4>
                  {color.format_tag && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {color.format_tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 truncate">
                  {color.subtitle || 'CCA Official Palette'}
                </p>
              </div>

              {/* Bottom Button Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 truncate max-w-[150px]">
                  {color.value}
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                    isCopied ? 'text-emerald-500' : 'text-slate-400 group-hover:text-blue-600'
                  }`}
                >
                  {isCopied ? <FiCheck size={14} /> : <FiCopy size={13} />}
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandColorsSection;

