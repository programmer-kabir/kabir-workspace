import React from 'react';
import { useReviewerReport } from '../hooks/useReviewerReport';
import { FiActivity, FiShoppingCart } from 'react-icons/fi';
import { ReviewerHeaderCard } from '../components/ReviewerReport/ReviewerHeaderCard';
import { ReviewAnalyticsTab } from '../components/ReviewerReport/ReviewAnalyticsTab';
import { MarketplaceUploadsTab } from '../components/ReviewerReport/MarketplaceUploadsTab';
import { MarketplaceDetailModal } from '../components/ReviewerReport/modals/MarketplaceDetailModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

const ReviewerReport = () => {
  const {
    MONTH_NAMES,
    YEARS,
    selectedStaffId,
    setSelectedStaffId,
    startDate,
    endDate,
    loading,
    reviewerReport,
    error,
    activeMainTab,
    setActiveMainTab,
    filterType,
    setFilterType,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    marketSearchQuery,
    setMarketSearchQuery,
    marketStatusFilter,
    setMarketStatusFilter,
    marketPlatformFilter,
    setMarketPlatformFilter,
    marketViewMode,
    setMarketViewMode,
    selectedMarketModal,
    setSelectedMarketModal,
    reviewerOptions,
    activeDateRange,
    fetchReport,
    filteredMarketplaces,
    handleExport,
    selectedStaffInfo,
    approvedRate,
    rejectedRate,
    slaRate,
    mSummary
  } = useReviewerReport();

  return (
    <div className="pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Reviewer Header & Filter Card */}
      <ReviewerHeaderCard
        filterType={filterType}
        setFilterType={setFilterType}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        selectedStaffId={selectedStaffId}
        setSelectedStaffId={setSelectedStaffId}
        reviewerOptions={reviewerOptions}
        API_BASE={API_BASE}
        startDate={startDate}
        endDate={endDate}
        fetchReport={fetchReport}
        loading={loading}
        handleExport={handleExport}
        reviewerReport={reviewerReport}
        MONTH_NAMES={MONTH_NAMES}
        YEARS={YEARS}
        selectedStaffInfo={selectedStaffInfo}
        mSummary={mSummary}
        slaRate={slaRate}
        activeDateRange={activeDateRange}
        error={error}
      />

      {/* ── Main Navigation Tabs: SLA Analytics vs Marketplace Uploads ── */}
      <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit border border-slate-200 dark:border-slate-800/30">
        <button
          type="button"
          onClick={() => setActiveMainTab('analytics')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${
            activeMainTab === 'analytics'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md shadow-slate-900/5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          <FiActivity size={16} />
          <span>QA & Review SLA Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('marketplaces')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${
            activeMainTab === 'marketplaces'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md shadow-slate-900/5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          <FiShoppingCart size={16} />
          <span>Marketplace Uploads & Distributions</span>
          {mSummary?.total_uploads > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black border border-indigo-200 dark:border-indigo-800">
              {mSummary.total_uploads}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">
            Aggregating Reviewer Analytics & Marketplace Submissions...
          </p>
        </div>
      ) : selectedStaffInfo && reviewerReport ? (
        <>
          {/* TAB 1: QA & SLA ANALYTICS */}
          {activeMainTab === 'analytics' && (
            <ReviewAnalyticsTab
              reviewerReport={reviewerReport}
              approvedRate={approvedRate}
              rejectedRate={rejectedRate}
              slaRate={slaRate}
            />
          )}

          {/* TAB 2: MARKETPLACE UPLOADS & TRACKING */}
          {activeMainTab === 'marketplaces' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <MarketplaceUploadsTab
                mSummary={mSummary}
                marketPlatformFilter={marketPlatformFilter}
                setMarketPlatformFilter={setMarketPlatformFilter}
                filteredMarketplaces={filteredMarketplaces}
                marketStatusFilter={marketStatusFilter}
                setMarketStatusFilter={setMarketStatusFilter}
                marketSearchQuery={marketSearchQuery}
                setMarketSearchQuery={setMarketSearchQuery}
                marketViewMode={marketViewMode}
                setMarketViewMode={setMarketViewMode}
                setSelectedMarketModal={setSelectedMarketModal}
              />

              {/* MARKETPLACE DETAILS MODAL */}
              <MarketplaceDetailModal
                selectedMarketModal={selectedMarketModal}
                setSelectedMarketModal={setSelectedMarketModal}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ReviewerReport;
