import React from 'react';
import {
  FiAlertCircle,
  FiPlus,
  FiUser,
  FiExternalLink,
  FiCheck,
  FiClock,
  FiXCircle,
  FiToggleLeft,
  FiToggleRight,
  FiEdit2,
  FiTrash2
} from 'react-icons/fi';

/**
 * BrandResourceTable Component
 * Data table displaying brand resources (swatches, multi-color palettes, font previews,
 * logo thumbnails, approval triggers, status toggles, and edit/delete actions).
 */
const BrandResourceTable = ({
  loading = false,
  filteredList = [],
  activeTab = 'all',
  handleOpenCreate,
  API_BASE = '',
  getFontFamily,
  formatBDDateTime,
  handleUpdateApproval,
  handleToggleStatus,
  handleOpenEdit,
  handleDelete
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading resources...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <FiAlertCircle className="mx-auto text-slate-400" size={36} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No resources found</p>
          <button
            type="button"
            onClick={() => handleOpenCreate && handleOpenCreate(activeTab)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FiPlus size={14} /> Add New Resource
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/90 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Title, Author & Preview</th>
                <th className="py-3.5 px-5">Value / Link</th>
                <th className="py-3.5 px-5">Tag & Description</th>
                <th className="py-3.5 px-5 text-center">Approval</th>
                <th className="py-3.5 px-5 text-center">Active</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredList.map((item) => {
                const isColor = item.category === 'color';
                const isPalette = item.category === 'palette';
                const isLogo = item.category === 'logo';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    {/* Category */}
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        item.category === 'color' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' :
                        item.category === 'palette' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' :
                        item.category === 'logo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' :
                        item.category === 'font' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                        item.category === 'template' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30' :
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                      }`}>
                        {item.category === 'palette' ? 'Palette' : item.category}
                      </span>
                    </td>

                    {/* Title, Author & Visual Preview */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {isColor && (
                          <div
                            className="w-8 h-8 rounded-lg shadow-inner border border-slate-300 dark:border-slate-600 shrink-0"
                            style={{ backgroundColor: item.value }}
                          />
                        )}
                        {isPalette && (
                          <div className="w-12 h-8 rounded-lg overflow-hidden flex flex-col shadow-inner border border-slate-300 dark:border-slate-600 shrink-0">
                            {item.value?.split(',').map((c, i) => (
                              <div key={i} className="w-full flex-1" style={{ backgroundColor: c.trim() }} title={c.trim()} />
                            ))}
                          </div>
                        )}
                        {isLogo && (
                          <div className="w-10 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                            <img
                              src={item.value?.startsWith('http') || item.value?.startsWith('/') ? item.value : `${API_BASE}${item.value}`}
                              alt="logo"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => { e.target.src = '/logo.png'; }}
                            />
                          </div>
                        )}
                        {item.category === 'font' && (
                          <div
                            className="w-10 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-xs text-amber-700 dark:text-amber-400 shrink-0 shadow-2xs"
                            style={{ fontFamily: getFontFamily ? getFontFamily(item.title) : 'inherit' }}
                          >
                            Aa
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="font-black text-slate-800 dark:text-slate-100 truncate"
                            style={item.category === 'font' && getFontFamily ? { fontFamily: getFontFamily(item.title) } : {}}
                          >
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                              <FiUser size={10} />
                              {item.created_by || 'Admin'}
                              {item.created_by_role === 'reviewer' && (
                                <span className="text-[9px] px-1 py-0.2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800 font-bold">
                                  Reviewer
                                </span>
                              )}
                            </span>
                            <span>•</span>
                            <span>Order: #{item.sort_order}</span>
                            {item.updated_at && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400 dark:text-slate-500 font-mono" title={`Created: ${formatBDDateTime ? (formatBDDateTime(item.created_at) || '-') : ''}`}>
                                  {formatBDDateTime ? formatBDDateTime(item.updated_at) : item.updated_at}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Value / Link */}
                    <td className="py-3.5 px-5 max-w-xs">
                      {isPalette ? (
                        <div className="flex items-center gap-1 flex-wrap max-w-[240px]">
                          {item.value?.split(',').map((c, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs border border-slate-200 dark:border-slate-700"
                              style={{ backgroundColor: `${c.trim()}22`, color: c.trim() }}
                            >
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      ) : isColor ? (
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                          {item.value}
                        </span>
                      ) : item.value?.startsWith('http') ? (
                        <a
                          href={item.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-mono truncate max-w-[200px]"
                        >
                          <span>{item.value}</span>
                          <FiExternalLink size={11} className="shrink-0" />
                        </a>
                      ) : (
                        <span className="font-mono text-slate-600 dark:text-slate-300 truncate block max-w-[220px]">
                          {item.value}
                        </span>
                      )}
                    </td>

                    {/* Subtitle & Format Tag */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        {item.format_tag && (
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/60">
                            {item.format_tag}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {item.subtitle || '—'}
                        </p>
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-5 text-center">
                      {(item.approval_status === 'approved' || !item.approval_status) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <FiCheck size={11} /> Approved
                        </span>
                      ) : item.approval_status === 'pending' ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                            <FiClock size={11} /> Pending Review
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateApproval && handleUpdateApproval(item, 'approved')}
                              className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                              title="Approve resource"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateApproval && handleUpdateApproval(item, 'rejected')}
                              className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                              title="Reject resource"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <FiXCircle size={11} /> Rejected
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateApproval && handleUpdateApproval(item, 'approved')}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            title="Re-approve"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Active Status Switch */}
                    <td className="py-3.5 px-5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus && handleToggleStatus(item)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          Number(item.is_active)
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={Number(item.is_active) ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                      >
                        {Number(item.is_active) ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit && handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-700/80 dark:hover:bg-blue-600 dark:hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/60 transition-all cursor-pointer shadow-2xs"
                          title="Edit"
                        >
                          <FiEdit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete && handleDelete(item.id, item.title)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-700/80 dark:hover:bg-rose-600 dark:hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/60 transition-all cursor-pointer shadow-2xs"
                          title="Delete"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BrandResourceTable;
