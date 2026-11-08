import React from 'react';
import { FiFolder, FiShield, FiExternalLink } from 'react-icons/fi';

const BrandTemplatesGuidelines = ({
  activeTab,
  filteredTemplates,
  filteredGuidelines,
}) => {
  const showTemplates =
    (activeTab === 'all' || activeTab === 'templates') &&
    filteredTemplates &&
    filteredTemplates.length > 0;

  const showGuidelines =
    (activeTab === 'all' || activeTab === 'guidelines') &&
    filteredGuidelines &&
    filteredGuidelines.length > 0;

  return (
    <>
      {/* 4. Templates Section */}
      {showTemplates && (
        <div className="space-y-3.5">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FiFolder size={15} />
            </span>
            <span>Master Templates & Drive Kits</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <FiFolder size={20} />
                    </span>
                    {template.format_tag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {template.format_tag}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 pt-1">
                    {template.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {template.subtitle}
                  </p>
                </div>

                <a
                  href={template.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Open Template Link</span>
                  <FiExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Guidelines Section */}
      {showGuidelines && (
        <div className="space-y-3.5">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <FiShield size={15} />
            </span>
            <span>Design Guidelines & Standards</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuidelines.map((rule, idx) => (
              <div
                key={rule.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {rule.title}
                  </h4>
                  {rule.format_tag && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                      {rule.format_tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                  {rule.value}
                </p>
                {rule.subtitle && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-8 pt-1">
                    Category: {rule.subtitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BrandTemplatesGuidelines;

