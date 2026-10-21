import React from 'react';
import DbHeader from './DatabaseManager/DbHeader';
import SystemOverviewTab from './DatabaseManager/SystemOverviewTab';
import TableExplorerTab from './DatabaseManager/TableExplorerTab';
import SqlRunnerTab from './DatabaseManager/SqlRunnerTab';
import JsonCellModal from './DatabaseManager/modals/JsonCellModal';
import InsertRowModal from './DatabaseManager/modals/InsertRowModal';
import EditRowModal from './DatabaseManager/modals/EditRowModal';
import DeleteConfirmModal from './DatabaseManager/modals/DeleteConfirmModal';
import { useDatabaseManager } from '../hooks/useDatabaseManager';

/**
 * DatabaseManagerView Component
 * Coordinator page integrating Cloud Storage & DB Health Overview, Table Explorer, and SQL Console.
 */
export default function DatabaseManagerView({ setActiveTab }) {
  const dbManager = useDatabaseManager();
  const { activeTab, jsonViewModal, insertModal, editModal, deleteModal } = dbManager;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Banner, Tab Switcher & Metric Cards */}
      <DbHeader {...dbManager} setNavTab={setActiveTab} />

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
