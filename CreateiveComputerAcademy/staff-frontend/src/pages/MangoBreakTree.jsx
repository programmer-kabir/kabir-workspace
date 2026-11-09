import React from 'react';
// Component imports
import useMangoTreeData from '../components/MangoBreakTree/useMangoTreeData';
import MangoTreeStatsBanner from '../components/MangoBreakTree/MangoTreeStatsBanner';
import MangoCalculationRibbon from '../components/MangoBreakTree/MangoCalculationRibbon';
import MangoTreeVisualizer from '../components/MangoBreakTree/MangoTreeVisualizer';
import MangoLedgerTabs from '../components/MangoBreakTree/MangoLedgerTabs';
import MangoClaimModal from '../components/MangoBreakTree/MangoClaimModal';
import P2POvertimeMarket from '../components/P2POvertimeMarket';


export default function MangoBreakTree() {
  const {
    loading,
    data,
    summary,
    ripeCount,
    allRipeMangoes,
    treeMangoes,
    extraBasketMangoesCount,
    growingMango,
    shiftHours,
    totalOvertime,
    availableBreakHours,
    availableBreakDays,
    safeTreePositions,
    selectedMango,
    setSelectedMango,
    isClaimModalOpen,
    setIsClaimModalOpen,
    claimDate,
    setClaimDate,
    claimReason,
    setClaimReason,
    claiming,
    handleMangoClick,
    handleClaimSubmit,
    activeLedgerTab,
    setActiveLedgerTab,
    isMarketOpen,
    setIsMarketOpen,
    selectedMonth,
    availableMonths,
    handleMonthChange,
    boyBouncing,
    handleBoyClick,
    fetchTreeData,
  } = useMangoTreeData();

  return (
    <div className="mx-auto space-y-8 animate-fadeIn pb-12">
      {/* 1. Header Banner & Metric Overview Cards */}
      <MangoTreeStatsBanner
        summary={summary}
        shiftHours={shiftHours}
        totalOvertime={totalOvertime}
        availableBreakHours={availableBreakHours}
        availableBreakDays={availableBreakDays}
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        handleMonthChange={handleMonthChange}
        loading={loading}
        fetchTreeData={fetchTreeData}
        setIsMarketOpen={setIsMarketOpen}
        setActiveLedgerTab={setActiveLedgerTab}
        setSelectedMango={setSelectedMango}
        setIsClaimModalOpen={setIsClaimModalOpen}
        allRipeMangoes={allRipeMangoes}
      />

      {/* 2. Interactive Calculation Ribbon & Debt Alert */}
      <MangoCalculationRibbon
        summary={summary}
        shiftHours={shiftHours}
        setActiveLedgerTab={setActiveLedgerTab}
        availableBreakHours={availableBreakHours}
        ripeCount={ripeCount}
      />

      {/* 3. Interactive Sculpted SVG Mango Orchard Tree */}
      <MangoTreeVisualizer
        summary={summary}
        ripeCount={ripeCount}
        extraBasketMangoesCount={extraBasketMangoesCount}
        allRipeMangoes={allRipeMangoes}
        treeMangoes={treeMangoes}
        growingMango={growingMango}
        safeTreePositions={safeTreePositions}
        shiftHours={shiftHours}
        boyBouncing={boyBouncing}
        handleBoyClick={handleBoyClick}
        handleMangoClick={handleMangoClick}
        setSelectedMango={setSelectedMango}
        setIsClaimModalOpen={setIsClaimModalOpen}
        setSelectedMonth={handleMonthChange}
        fetchTreeData={fetchTreeData}
      />

      {/* 4. Break Bank Verified Ledger & History Tabs */}
      <MangoLedgerTabs
        data={data}
        summary={summary}
        shiftHours={shiftHours}
        activeLedgerTab={activeLedgerTab}
        setActiveLedgerTab={setActiveLedgerTab}
      />

      {/* 5. Mango Break Redemption Modal */}
      <MangoClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        selectedMango={selectedMango}
        claimDate={claimDate}
        setClaimDate={setClaimDate}
        claimReason={claimReason}
        setClaimReason={setClaimReason}
        claiming={claiming}
        onSubmit={handleClaimSubmit}
      />

      {/* 6. P2P Overtime Market Modal */}
      <P2POvertimeMarket
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        onTradeUpdated={fetchTreeData}
      />
    </div>
  );
}
