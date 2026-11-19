import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiRefreshCw, FiDollarSign, FiSliders } from 'react-icons/fi';
import usePayrollData from '../components/Payroll/usePayrollData';
import PayrollHeaderBanner from '../components/Payroll/PayrollHeaderBanner.jsx';
import PayrollMetricsGrid from '../components/Payroll/PayrollMetricsGrid.jsx';
import PayrollContractRoadmap from '../components/Payroll/PayrollContractRoadmap.jsx';
import PayrollMonthlyLedger from '../components/Payroll/PayrollMonthlyLedger.jsx';
import PayrollTables from '../components/Payroll/PayrollTables.jsx';
import PayrollWithdrawModal from '../components/Payroll/PayrollWithdrawModal.jsx';
import PayrollInvoiceModal from '../components/Payroll/PayrollInvoiceModal.jsx';
import EarningsSimulator from '../components/Payroll/EarningsSimulator.jsx';

export { getProfileImgUrl, StaffAvatar } from '../components/Payroll/payrollUtils.jsx';

export default function PayrollWallet({ initialTab = 'overview' }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabFromQuery = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (tabFromQuery === 'simulator' || initialTab === 'simulator') return 'simulator';
    return 'overview';
  });

  useEffect(() => {
    if (tabFromQuery === 'simulator' || initialTab === 'simulator') {
      setActiveTab('simulator');
    }
  }, [tabFromQuery, initialTab]);

  const {
    currentUser,
    loading,
    syncing,
    data,
    summary,
    hasScheme,
    scheme,
    isYearlyContract,
    isStaggeredContract,
    contractRoadmap,
    activeTier,
    progressPercent,
    targetCompleted,
    activeHourlyRate,
    liveEarned,
    liveTotalMinutes,
    liveClockHours,
    liveClockMinutes,
    liveSecsRemainder,
    liveHumanTime,
    hasActiveShift,
    isOnBreak,
    activeBreakType,
    timeFilter,
    setTimeFilter,
    currentPeriodEarned,
    currentPeriodMinutes,
    currentPeriodHours,
    currentPeriodSessions,
    filteredEarnings,
    filterSubtitles,
    todayStr,
    isModalOpen,
    setIsModalOpen,
    openWithdrawModal,
    selectedInvoice,
    setSelectedInvoice,
    withdrawAmount,
    setWithdrawAmount,
    paymentMethod,
    setPaymentMethod,
    savedPayoutSettings,
    includeOvertimeCashout,
    setIncludeOvertimeCashout,
    submitting,
    handleWithdrawSubmit,
    fetchPayroll,
  } = usePayrollData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading your payroll and wallet summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner & Live Shift Status */}
      <PayrollHeaderBanner
        currentUser={currentUser}
        summary={summary}
        isStaggeredContract={isStaggeredContract}
        isYearlyContract={isYearlyContract}
        syncing={syncing}
        hasScheme={hasScheme}
        fetchPayroll={fetchPayroll}
        openWithdrawModal={openWithdrawModal}
        liveHumanTime={liveHumanTime}
        liveTotalMinutes={liveTotalMinutes}
        liveSecsRemainder={liveSecsRemainder}
        liveEarned={liveEarned}
        activeHourlyRate={activeHourlyRate}
        isOnBreak={isOnBreak}
        activeBreakType={activeBreakType}
      />

      {hasScheme && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiDollarSign size={16} />
            <span>Wallet Overview & Ledgers</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiSliders size={16} />
            <span>Smart Earnings & Mango Simulator 🔮🥭</span>
          </button>
        </div>
      )}

      {hasScheme && activeTab === 'simulator' && (
        <EarningsSimulator summary={summary} currentUser={currentUser} />
      )}

      {hasScheme && activeTab === 'overview' && (
        <>
          {/* Timeframe Filter Bar & 4 Status KPI Cards */}
          <PayrollMetricsGrid
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            hasActiveShift={hasActiveShift}
            filterSubtitles={filterSubtitles}
            currentPeriodEarned={currentPeriodEarned}
            currentPeriodHours={currentPeriodHours}
            currentPeriodMinutes={currentPeriodMinutes}
            currentPeriodSessions={currentPeriodSessions}
            liveEarned={liveEarned}
            activeHourlyRate={activeHourlyRate}
            summary={summary}
          />

          {/* Yearly / Staggered Contract Roadmap */}
          <PayrollContractRoadmap
            isYearlyContract={isYearlyContract}
            isStaggeredContract={isStaggeredContract}
            summary={summary}
            scheme={scheme}
            targetCompleted={targetCompleted}
            progressPercent={progressPercent}
            contractRoadmap={contractRoadmap}
            activeTier={activeTier}
          />

          {/* Monthly Cycle & Rollover Ledger */}
          <PayrollMonthlyLedger
            summary={summary}
            setSelectedInvoice={setSelectedInvoice}
          />

          {/* Work Sessions & Withdrawal History Tables */}
          <PayrollTables
            timeFilter={timeFilter}
            filteredEarnings={filteredEarnings}
            hasActiveShift={hasActiveShift}
            todayStr={todayStr}
            liveClockHours={liveClockHours}
            liveClockMinutes={liveClockMinutes}
            liveSecsRemainder={liveSecsRemainder}
            activeHourlyRate={activeHourlyRate}
            liveEarned={liveEarned}
            withdrawals={data?.recent_withdrawals || []}
          />
        </>
      )}

      {/* Payout Request Modal */}
      <PayrollWithdrawModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summary={summary}
        includeOvertimeCashout={includeOvertimeCashout}
        setIncludeOvertimeCashout={setIncludeOvertimeCashout}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        savedPayoutSettings={savedPayoutSettings}
        handleWithdrawSubmit={handleWithdrawSubmit}
        submitting={submitting}
      />

      {/* Official Payslip / Invoice Modal */}
      <PayrollInvoiceModal
        selectedInvoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        currentUser={currentUser}
        scheme={scheme}
      />
    </div>
  );
}
