import React from 'react';
import {
  FiAlertTriangle,
  FiSend,
  FiSearch,
  FiRefreshCw,
  FiTrendingDown,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiTrendingUp,
  FiTag,
  FiMessageSquare,
  FiClock,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';
import { getTransactionInfo } from './creditUtils';

export default function CreditLedgerTable({
  loading,
  paginated = [],
  filtered = [],
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  setSelectedTx
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Filter Controls Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'All Transactions', icon: null },
            { key: 'rewards', label: 'Task Rewards', icon: <FaCoins size={12} className="text-amber-500" /> },
            { key: 'penalties', label: 'Rejections (-1)', icon: <FiAlertTriangle size={12} className="text-rose-500" /> },
            { key: 'transfers', label: 'P2P Transfers', icon: <FiSend size={12} className="text-blue-500" /> }
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterType(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === f.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task title, ID or reason..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Ledger Rows */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <FiRefreshCw className="animate-spin text-3xl mx-auto mb-3 text-blue-500" />
          <p className="text-sm font-semibold">Loading credit ledger...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <FaCoins size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No transaction records found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No records match your search criteria.' : 'History will automatically appear here when tasks are completed or reviewed.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {paginated.map((tx) => {
            const info = getTransactionInfo(tx);
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Status Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      info.isPenalty
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40'
                        : tx.type === 'transfer_sent'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40'
                        : tx.type === 'transfer_received'
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40'
                    }`}
                  >
                    {info.isPenalty ? (
                      <FiTrendingDown size={20} />
                    ) : tx.type === 'transfer_sent' ? (
                      <FiArrowUpRight size={20} />
                    ) : tx.type === 'transfer_received' ? (
                      <FiArrowDownLeft size={20} />
                    ) : (
                      <FiTrendingUp size={20} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${info.badgeClass}`}>
                        {info.badgeText}
                      </span>

                      {info.categoryName && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                          <FiTag size={10} />
                          {info.categoryName}
                        </span>
                      )}

                      {tx.reference_id && (
                        <span className="font-mono text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-lg">
                          Task #{tx.reference_id}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {info.mainTitle}
                    </h3>

                    {/* Reason / Note snippet */}
                    {info.reasonText && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <FiMessageSquare className="text-slate-400 shrink-0 mt-0.5" size={13} />
                        <span className="break-words line-clamp-2 italic">
                          "{info.reasonText}"
                        </span>
                      </div>
                    )}

                    {/* Date & Sub info */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FiClock size={12} />
                        {new Date(tx.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      </span>
                      {tx.sender_name && tx.type === 'transfer_received' && (
                        <span>From: <strong className="text-slate-700 dark:text-slate-200">{tx.sender_name}</strong></span>
                      )}
                      {tx.receiver_name && tx.type === 'transfer_sent' && (
                        <span>To: <strong className="text-slate-700 dark:text-slate-200">{tx.receiver_name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & View button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <span
                    className={`text-base sm:text-lg font-black px-3 py-1 rounded-2xl border block ${
                      info.isPositive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    {info.isPositive ? `+${tx.amount}` : tx.amount} Credits
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                    View Details <FiExternalLink size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page {currentPage} of {totalPages} ({filtered.length} total records)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <FiChevronLeft size={14} /> Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              Next <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

