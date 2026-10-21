import React from 'react';
import { useBrandResources } from '../hooks/useBrandResources';
import BrandHeader from './BrandResources/BrandHeader';
import BrandFilterBar from './BrandResources/BrandFilterBar';
import BrandResourceTable from './BrandResources/BrandResourceTable';
import ResourceFormModal from './BrandResources/modals/ResourceFormModal';
import BulkPaletteModal from './BrandResources/modals/BulkPaletteModal';

/**
 * BrandResourcesView Coordinator Page
 * Manages academy brand assets, color palettes, fonts, logos and master guidelines.
 */
export default function BrandResourcesView({ setActiveTab }) {
  const brand = useBrandResources();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner & Quick Action Buttons */}
      <BrandHeader {...brand} />

      {/* Tabs, Search Filter & Approval Status Filter Pills */}
      <BrandFilterBar {...brand} />

      {/* Resource Table / Grid Cards */}
      <BrandResourceTable {...brand} />

      {/* Add / Edit Resource Modal */}
      {brand.modalOpen && <ResourceFormModal {...brand} />}

      {/* Bulk Color Palette Import Modal */}
      {brand.bulkModalOpen && <BulkPaletteModal {...brand} />}
    </div>
  );
}
