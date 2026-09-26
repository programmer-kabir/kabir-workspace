import React from 'react';
import { useBrandResources } from '../hooks/useBrandResources';
import BrandHeader from '../components/BrandResources/BrandHeader';
import BrandFilterBar from '../components/BrandResources/BrandFilterBar';
import BrandResourceTable from '../components/BrandResources/BrandResourceTable';
import ResourceFormModal from '../components/BrandResources/modals/ResourceFormModal';
import BulkPaletteModal from '../components/BrandResources/modals/BulkPaletteModal';

/**
 * BrandResources Coordinator Page
 * Manages academy brand assets, color palettes, fonts, logos and master guidelines.
 */
export default function BrandResources() {
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
