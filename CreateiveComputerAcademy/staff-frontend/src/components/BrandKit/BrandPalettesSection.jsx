import React from 'react';
import { FiGrid, FiCheck, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';

const BrandPalettesSection = ({
  filteredPalettes,
  copiedCode,
  handleCopyHex,
}) => {
  if (!filteredPalettes || filteredPalettes.length === 0) return null;

  const heights = ['h-20', 'h-14', 'h-11', 'h-10', 'h-9'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FiGrid size={16} />
            </span>
            <span>Color Palettes & Harmonies (Color Hunt Style)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Harmonious color combinations for banners, posters, and digital design. Click any color strip to copy HEX code.
          </p>
        </div>
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-xl border border-purple-200 dark:border-purple-800 self-start sm:self-auto">
          {filteredPalettes.length} Palettes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredPalettes.map((palette) => {
          const colors = palette.value?.split(',').map((s) => s.trim()).filter(Boolean) || [];

          return (
            <div
              key={palette.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Stacked Horizontal Stripes (Color Hunt Style) */}
              <div className="w-full flex flex-col cursor-pointer overflow-hidden rounded-t-3xl border-b border-slate-100 dark:border-slate-700/60">
                {colors.map((hex, i) => {
                  const isCopied = copiedCode === hex;
                  const isLight = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';
                  const hClass = heights[i] || 'h-11';

                  return (
                    <div
                      key={i}
                      onClick={() => handleCopyHex(hex, `${palette.title} (Shade ${i + 1})`)}
                      className={`w-full ${hClass} transition-all relative flex items-center justify-between px-3 group/band hover:brightness-105 active:scale-[0.99]`}
                      style={{ backgroundColor: hex }}
                      title={`Click to copy: ${hex}`}
                    >
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-md opacity-0 group-hover/band:opacity-100 transition-opacity shadow-xs ${
                          isLight ? 'bg-black/25 text-slate-900' : 'bg-white/30 text-white'
                        }`}
                      >
                        {isCopied ? 'Copied!' : hex}
                      </span>
                      <span
                        className={`text-[10px] font-bold opacity-0 group-hover/band:opacity-100 transition-opacity ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {isCopied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Card Details & Actions */}
              <div className="p-4 flex flex-col justify-between gap-3 flex-1 bg-white dark:bg-slate-800">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                      {palette.title}
                    </h4>
                    {palette.format_tag && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        {palette.format_tag}
                      </span>
                    )}
                  </div>
                  {palette.subtitle && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{palette.subtitle}</p>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {colors.length} Color Shades
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(colors.join(', '));
                      toast.success(`Palette copied: ${colors.join(', ')}`);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copy all color codes together"
                  >
                    <FiCopy size={12} />
                    <span>Copy All</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandPalettesSection;

