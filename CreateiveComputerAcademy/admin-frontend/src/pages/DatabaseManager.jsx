import React from 'react';
import DbHeader from '../components/DatabaseManager/DbHeader';
import SystemOverviewTab from '../components/DatabaseManager/SystemOverviewTab';
import TableExplorerTab from '../components/DatabaseManager/TableExplorerTab';
import SqlRunnerTab from '../components/DatabaseManager/SqlRunnerTab';
import JsonCellModal from '../components/DatabaseManager/modals/JsonCellModal';
import InsertRowModal from '../components/DatabaseManager/modals/InsertRowModal';
import EditRowModal from '../components/DatabaseManager/modals/EditRowModal';
import DeleteConfirmModal from '../components/DatabaseManager/modals/DeleteConfirmModal';
import { useDatabaseManager } from '../hooks/useDatabaseManager';

/**
 * DatabaseManager Component
 * Coordinator page integrating Cloud Storage & DB Health Overview, Table Explorer, and SQL Console.
 */
export default function DatabaseManager() {
  const dbManager = useDatabaseManager();
  const { activeTab, jsonViewModal, insertModal, editModal, deleteModal } = dbManager;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner, Tab Switcher & Metric Cards */}
      <DbHeader {...dbManager} />

      {/* Main Content: Overview, Table Explorer, or SQL Console */}
      {activeTab === 'overview' && (
        <SystemOverviewTab {...dbManager} />
      )}
      {activeTab === 'explorer' && (
        <TableExplorerTab {...dbManager} />
      )}
      {activeTab === 'sql' && (
        <SqlRunnerTab {...dbManager} />
      )}

      {/* Action Modals */}
      {jsonViewModal?.isOpen && <JsonCellModal {...dbManager} />}
      {insertModal?.isOpen && <InsertRowModal {...dbManager} />}
      {editModal?.isOpen && <EditRowModal {...dbManager} />}
      {deleteModal?.isOpen && <DeleteConfirmModal {...dbManager} />}
    </div>
  );
}
