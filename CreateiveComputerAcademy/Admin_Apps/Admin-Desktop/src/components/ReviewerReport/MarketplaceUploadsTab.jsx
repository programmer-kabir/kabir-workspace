import React from 'react';
import { MarketplaceStatsBar } from './marketplace/MarketplaceStatsBar';
import { MarketplaceFilterControls } from './marketplace/MarketplaceFilterControls';
import { MarketplaceCardsView } from './marketplace/MarketplaceCardsView';
import { MarketplaceTableView } from './marketplace/MarketplaceTableView';

export const MarketplaceUploadsTab = ({
  mSummary = { total_uploads: 0, live: 0, under_review: 0, rejected: 0, platforms: {} },
  marketPlatformFilter,
  setMarketPlatformFilter,
  filteredMarketplaces = [],
  marketStatusFilter,
  setMarketStatusFilter,
  marketSearchQuery,
  setMarketSearchQuery,
  marketViewMode,
  setMarketViewMode,
  setSelectedMarketModal
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 1. Stats and Platform Split Chips */}
      <MarketplaceStatsBar
        mSummary={mSummary}
        marketPlatformFilter={marketPlatformFilter}
        setMarketPlatformFilter={setMarketPlatformFilter}
      />

      {/* 2. Search, Status Filter & Mode Switcher */}
      <MarketplaceFilterControls
        filteredMarketplaces={filteredMarketplaces}
        marketStatusFilter={marketStatusFilter}
        setMarketStatusFilter={setMarketStatusFilter}
        marketSearchQuery={marketSearchQuery}
        setMarketSearchQuery={setMarketSearchQuery}
        marketViewMode={marketViewMode}
        setMarketViewMode={setMarketViewMode}
      />

      {/* 3. Cards View or Table View */}
      {marketViewMode === 'cards' ? (
        <MarketplaceCardsView
          filteredMarketplaces={filteredMarketplaces}
          setSelectedMarketModal={setSelectedMarketModal}
        />
      ) : (
        <MarketplaceTableView
          filteredMarketplaces={filteredMarketplaces}
          setSelectedMarketModal={setSelectedMarketModal}
        />
      )}
    </div>
  );
};

export default MarketplaceUploadsTab;
