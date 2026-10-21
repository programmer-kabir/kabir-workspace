import React from 'react';
import {
  FiPlus,
  FiColumns,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiKey,
  FiArrowUp,
  FiArrowDown,
  FiDatabase,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiCopy
} from 'react-icons/fi';
import DbSidebar from './DbSidebar';
import { renderDbCellContent } from './CellRenderer';

/**
 * TableExplorerTab Component
 * Main studio view with Table sidebar, toolbar filters, pagination,
 * and live interactive data grid.
 */
const TableExplorerTab = (props) => {
  const {
    API_BASE = '',
    selectedTable = '',
    selectedTableInfo = null,
    tableData = { columns: [], primary_keys: [], rows: [], pagination: {} },
    loadingData = false,
    openInsertModal,
    showColDropdown = false,
    setShowColDropdown,
    visibleColumns = [],
    toggleColumn,
    exportData,
    fetchTableData,
    handleRowSearch,
    rowSearchInput = '',
    setRowSearchInput,
    handleLimitChange,
    handlePageChange,
    handleSort,
    openEditModal,
    openDeleteModal,
    handleCopyCell,
    copiedKey = null,
    setJsonViewModal
  } = props;

  const pagination = tableData.pagination || {
    page: 1,
    limit: 25,
    total_records: 0,
    total_pages: 0,
    sort_col: '',
    sort_dir: 'DESC',
    search: ''
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar: Tables List */}
      <DbSidebar {...props} />

      {/* Right Panel: Data Grid & Actions */}
      <div className="lg:col-span-9 space-y-4">
        {/* Table Detail Bar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">{selectedTable}</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                {(pagination.total_records || 0).toLocaleString()} rows
              </span>
              {selectedTableInfo?.engine && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono">
                  {selectedTableInfo.engine}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Primary Key:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {tableData.primary_keys && tableData.primary_keys.length > 0 ? tableData.primary_keys.join(', ') : 'None'}
              </span>
              <span>•</span>
              <span>{tableData.columns?.length || 0} columns detected</span>
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Insert Row */}
            <button
              type="button"
              onClick={() => openInsertModal && openInsertModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-102"
            >
              <FiPlus size={15} />
              <span>Insert Row</span>
            </button>

            {/* Column Toggle Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColDropdown && setShowColDropdown(!showColDropdown)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                <FiColumns size={14} />
                <span>Columns ({visibleColumns.length})</span>
              </button>

              {showColDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 z-30 space-y-2 max-h-72 overflow-y-auto">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Toggle Column Visibility
                  </div>
                  <div className="space-y-1">
                    {tableData.columns?.map((col) => (
                      <label
                        key={col.name}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs font-mono text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.name)}
                          onChange={() => toggleColumn && toggleColumn(col.name)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{col.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => exportData && exportData('csv')}
                title="Export CSV"
                className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 shadow-xs"
              >
                <FiDownload size={13} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportData && exportData('json')}
                title="Export JSON"
                className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 shadow-xs"
              >
                <FiDownload size={13} />
                <span>JSON</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() =>
                fetchTableData &&
                fetchTableData(
                  selectedTable,
                  pagination.page,
                  pagination.limit,
                  pagination.search,
                  pagination.sort_col,
                  pagination.sort_dir
                )
              }
              title="Refresh Table Data"
              className="p-2.5 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
            >
              <FiRefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Search & Pagination Controls */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search input */}
          <form onSubmit={handleRowSearch} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={`Filter records in ${selectedTable}...`}
                value={rowSearchInput}
                onChange={(e) => setRowSearchInput && setRowSearchInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              {rowSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    if (setRowSearchInput) setRowSearchInput('');
                    if (fetchTableData) fetchTableData(selectedTable, 1, pagination.limit, '');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all"
            >
              Search
            </button>
          </form>

          {/* Rows Per Page & Page Selector */}
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Rows:</span>
            <select
              value={pagination.limit || 25}
              onChange={(e) => handleLimitChange && handleLimitChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => handlePageChange && handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <FiChevronLeft size={14} />
              </button>
              <span className="font-bold text-slate-900 dark:text-white px-2">
                Page {pagination.page} of {pagination.total_pages || 1}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange && handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Data Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-24">
                    Action
                  </th>
                  <th className="p-3.5 font-extrabold text-slate-400 uppercase tracking-wider text-center w-12">
                    #
                  </th>
                  {tableData.columns
                    ?.filter(col => visibleColumns.includes(col.name))
                    .map((col) => {
                      const isSorted = pagination.sort_col === col.name;
                      const isPK = col.column_key === 'PRI';
                      return (
                        <th
                          key={col.name}
                          onClick={() => handleSort && handleSort(col.name)}
                          className="p-3.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors whitespace-nowrap group select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            {isPK && (
                              <span className="p-1 bg-amber-500/10 text-amber-500 rounded-md">
                                <FiKey size={11} title="Primary Key" />
                              </span>
                            )}
                            <span className="font-mono text-slate-900 dark:text-white font-bold">{col.name}</span>
                            <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {col.data_type}
                            </span>
                            {isSorted && (
                              <span className="text-blue-600 dark:text-blue-400 ml-1">
                                {pagination.sort_dir === 'ASC' ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loadingData ? (
                  <tr>
                    <td colSpan={(visibleColumns.length || 0) + 2} className="p-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FiRefreshCw className="animate-spin text-blue-500" size={28} />
                        <span className="text-sm font-semibold">Streaming records from {selectedTable}...</span>
                      </div>
                    </td>
                  </tr>
                ) : !tableData.rows || tableData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={(visibleColumns.length || 0) + 2} className="p-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FiDatabase className="text-slate-300 dark:text-slate-600" size={32} />
                        <p className="text-sm font-semibold">No records found matching criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tableData.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group"
                    >
                      {/* Row Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditModal && openEditModal(row, selectedTable)}
                            title="Edit Row"
                            className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal && openDeleteModal(row, selectedTable, false)}
                            title="Delete Row"
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-900/30 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Row Index */}
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {(pagination.page - 1) * pagination.limit + rIdx + 1}
                      </td>

                      {/* Columns Values */}
                      {tableData.columns
                        ?.filter(col => visibleColumns.includes(col.name))
                        .map((col) => {
                          const val = row[col.name];
                          const cellKey = `${rIdx}-${col.name}`;
                          return (
                            <td
                              key={col.name}
                              onClick={() => handleCopyCell && handleCopyCell(val, cellKey)}
                              className="p-3 cursor-pointer relative group/cell hover:bg-blue-100/50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                {renderDbCellContent(val, col.name, rIdx, setJsonViewModal, API_BASE)}
                                <span className="opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity">
                                  {copiedKey === cellKey ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={11} />}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableExplorerTab;
