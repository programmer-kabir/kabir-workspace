import React from 'react';
import {
  FiCode,
  FiCornerDownRight,
  FiPlay,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiCopy
} from 'react-icons/fi';
import { renderDbCellContent } from './CellRenderer';

/**
 * SqlRunnerTab Component
 * Interactive SQL Console with query templates, execution status, history chips,
 * and live results data grid. Fully responsive in Light Mode & Dark Mode.
 */
const SqlRunnerTab = ({
  API_BASE = '',
  sqlQuery = '',
  setSqlQuery,
  handleKeyDownSql,
  handleExecuteSql,
  executingSql = false,
  queryHistory = [],
  selectedTable = '',
  handleConvertToDelete,
  sqlResult = null,
  sqlDetectedTable = '',
  exportData,
  openEditModal,
  openDeleteModal,
  handleCopyCell,
  copiedKey = null,
  setJsonViewModal
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Query Terminal Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-2xl p-6 space-y-4 text-slate-800 dark:text-white transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shadow-xs">
              <FiCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Interactive SQL Console</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-mono border border-slate-200 dark:border-slate-700">
                  Ctrl + Enter to Execute
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Run custom queries against the live database engine</p>
            </div>
          </div>

          {/* Template Shortcut Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSqlQuery && setSqlQuery('SHOW TABLES;')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              SHOW TABLES;
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery && setSqlQuery(`SELECT * FROM ${selectedTable || 'users'} LIMIT 25;`)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              SELECT * FROM {selectedTable || 'users'}
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery && setSqlQuery(`SELECT * FROM tasks WHERE assigned_to = 1;`)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              tasks (assigned=1)
            </button>
          </div>
        </div>

        {/* SQL Textarea Editor */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs dark:shadow-inner transition-colors">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>SQL Editor (MySQL / MariaDB)</span>
            </span>
            <span className="font-semibold">UTF-8</span>
          </div>
          <textarea
            rows={6}
            value={sqlQuery}
            onChange={(e) => setSqlQuery && setSqlQuery(e.target.value)}
            onKeyDown={handleKeyDownSql}
            placeholder="Write your custom SQL query here (e.g. SELECT * FROM tasks WHERE status = 'pending';)..."
            className="w-full p-4 font-mono text-sm text-slate-900 dark:text-emerald-400 bg-white dark:bg-transparent focus:outline-none resize-y selection:bg-blue-600 selection:text-white"
          />
        </div>

        {/* Footer Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
              <FiAlertTriangle size={14} className="shrink-0" />
              <span>`UPDATE`, `DELETE`, `DROP` statements apply directly to live database.</span>
            </span>
            {sqlQuery.trim().toLowerCase().startsWith('select') && (
              <button
                type="button"
                onClick={handleConvertToDelete}
                className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                title="Change SELECT to DELETE"
              >
                <FiCornerDownRight size={12} />
                <span>Convert to DELETE query</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSqlQuery && setSqlQuery('')}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleExecuteSql && handleExecuteSql()}
              disabled={executingSql}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <FiPlay size={14} className={executingSql ? 'animate-spin' : ''} />
              <span>{executingSql ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        {/* Query History Chips */}
        {queryHistory.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Recent Query History:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {queryHistory.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (setSqlQuery) setSqlQuery(q);
                    if (handleExecuteSql) handleExecuteSql(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-600/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 text-[11px] font-mono font-medium transition-colors truncate max-w-xs cursor-pointer border border-slate-200/60 dark:border-transparent"
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SQL Execution Result Card */}
      {sqlResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden animate-in fade-in duration-200 text-slate-800 dark:text-white transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-950/60">
            <div className="flex items-center gap-3">
              {sqlResult.status === 'success' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  <FiCheckCircle size={14} />
                  <span>Query Succeeded</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">
                  <FiAlertTriangle size={14} />
                  <span>Execution Error</span>
                </span>
              )}

              {sqlResult.execution_time_ms && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono font-semibold">
                  <FiClock size={13} className="text-blue-500" />
                  <span>{sqlResult.execution_time_ms} ms</span>
                </span>
              )}

              {sqlDetectedTable && (
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800/70 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  Table: <span className="text-blue-600 dark:text-blue-400 font-bold">{sqlDetectedTable}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {sqlResult.type === 'select' && (
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {sqlResult.row_count} rows returned
                </span>
              )}

              {sqlResult.rows && sqlResult.rows.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => exportData && exportData('csv', sqlResult.rows, sqlResult.columns, sqlDetectedTable || 'query_result')}
                    title="Export CSV"
                    className="px-2.5 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <FiDownload size={12} />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportData && exportData('json', sqlResult.rows, sqlResult.columns, sqlDetectedTable || 'query_result')}
                    title="Export JSON"
                    className="px-2.5 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <FiDownload size={12} />
                    <span>JSON</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {sqlResult.status === 'error' ? (
            <div className="p-6 text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border-t border-rose-200 dark:border-rose-900/30">
              {sqlResult.message}
            </div>
          ) : sqlResult.type === 'mutation' ? (
            <div className="p-8 text-center space-y-2">
              <FiCheckCircle className="text-emerald-500 mx-auto" size={36} />
              <p className="text-base font-bold text-slate-900 dark:text-white">{sqlResult.message}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Affected records count: {sqlResult.affected_rows}</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[550px] scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-20">
                      Action
                    </th>
                    <th className="p-3.5 font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center w-10">
                      #
                    </th>
                    {sqlResult.columns?.map((col) => (
                      <th key={col} className="p-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono">
                        <span>{col}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
                  {sqlResult.rows?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal && openEditModal(row, sqlDetectedTable)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Edit row"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal && openDeleteModal(row, sqlDetectedTable, true)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete row"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-400 select-none">
                        {idx + 1}
                      </td>
                      {sqlResult.columns?.map((col) => {
                        const cellKey = `sql-${idx}-${col}`;
                        const isCopied = copiedKey === cellKey;
                        return (
                          <td
                            key={col}
                            className="p-2.5 font-mono max-w-xs truncate text-slate-800 dark:text-slate-200"
                          >
                            <div className="flex items-center justify-between gap-1 group/cell">
                              <span className="truncate">
                                {renderDbCellContent(row[col], col, setJsonViewModal)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCell && handleCopyCell(row[col], cellKey)}
                                className="opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity shrink-0 cursor-pointer"
                                title="Copy Value"
                              >
                                {isCopied ? (
                                  <FiCheck size={11} className="text-emerald-500" />
                                ) : (
                                  <FiCopy size={11} />
                                )}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SqlRunnerTab;
