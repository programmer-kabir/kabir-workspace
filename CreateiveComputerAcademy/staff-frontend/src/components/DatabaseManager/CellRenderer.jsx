import React from 'react';
import { FiCode } from 'react-icons/fi';

/**
 * renderDbCellContent
 * Formats table cell content based on value types: booleans, status badges,
 * JSON objects with view modal triggers, thumbnails for image paths, and standard text.
 */
export const renderDbCellContent = (val, colName, rowIdx, setJsonViewModal, API_BASE = '') => {
  if (val === null || val === undefined) {
    return <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono select-none">&lt;null&gt;</span>;
  }

  const strVal = String(val);

  // Boolean or 0/1 status
  if (strVal === '1' && (colName.includes('is_') || colName.includes('has_') || colName.includes('status'))) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        TRUE
      </span>
    );
  }
  if (strVal === '0' && (colName.includes('is_') || colName.includes('has_') || colName.includes('status'))) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        FALSE
      </span>
    );
  }

  // Status strings
  const lower = strVal.toLowerCase();
  if (['active', 'completed', 'approved', 'success', 'present'].includes(lower)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        {strVal}
      </span>
    );
  }
  if (['pending', 'in_progress', 'reviewing'].includes(lower)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        {strVal}
      </span>
    );
  }
  if (['rejected', 'inactive', 'failed', 'absent', 'late'].includes(lower)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        {strVal}
      </span>
    );
  }

  // JSON detection
  if ((strVal.startsWith('{') && strVal.endsWith('}')) || (strVal.startsWith('[') && strVal.endsWith(']'))) {
    return (
      <button
        type="button"
        onClick={() => setJsonViewModal && setJsonViewModal({ isOpen: true, title: `${colName} (Row #${rowIdx + 1})`, content: strVal })}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
      >
        <FiCode size={11} />
        <span>View JSON</span>
      </button>
    );
  }

  // Image/Upload Path
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(strVal) || strVal.startsWith('uploads/')) {
    const imgUrl = strVal.startsWith('http') ? strVal : `${API_BASE}${strVal}`;
    return (
      <div className="flex items-center gap-2">
        <img
          src={imgUrl}
          alt="thumbnail"
          className="w-6 h-6 rounded-md object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="font-mono text-[11px] truncate max-w-[120px]" title={strVal}>{strVal}</span>
      </div>
    );
  }

  // Regular String / Number
  return (
    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs block" title={strVal}>
      {strVal}
    </span>
  );
};
