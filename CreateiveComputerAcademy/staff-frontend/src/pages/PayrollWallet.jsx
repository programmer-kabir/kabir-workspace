import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import usePayrollData from '../components/Payroll/usePayrollData';
import PayrollHeaderBanner from '../components/Payroll/PayrollHeaderBanner.jsx';
import PayrollMetricsGrid from '../components/Payroll/PayrollMetricsGrid.jsx';
import PayrollContractRoadmap from '../components/Payroll/PayrollContractRoadmap.jsx';
import PayrollMonthlyLedger from '../components/Payroll/PayrollMonthlyLedger.jsx';
import PayrollTables from '../components/Payroll/PayrollTables.jsx';
import PayrollWithdrawModal from '../components/Payroll/PayrollWithdrawModal.jsx';
import PayrollInvoiceModal from '../components/Payroll/PayrollInvoiceModal.jsx';

export { getProfileImgUrl, StaffAvatar } from '../components/Payroll/payrollUtils.jsx';

export default function PayrollWallet() {
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
      />

      {hasScheme && (
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
