import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiUsers, FiList } from 'react-icons/fi';
import { toast } from 'sonner';

import MangoVaultHeader from '../components/MangoVault/MangoVaultHeader';
import MangoStaffTable, { MangoFilterToolbar } from '../components/MangoVault/MangoStaffTable';
import MangoVaultAuditLogs from '../components/MangoVault/MangoVaultAuditLogs';
import MangoVaultModals from '../components/MangoVault/MangoVaultModals';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const getAuthToken = () => {
  return localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || localStorage.getItem('token') || '';
};

export default function MangoVaultManager() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_academy_mangoes: 0,
    total_vault_held_mangoes: 0,
    total_visible_mangoes: 0,
    total_staff_count: 0,
    staff_with_vault_holds_count: 0,
    staff_in_debt_count: 0,
    total_debt_hours: 0
  });
  const [staffList, setStaffList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('staff');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'hold' | 'release' | 'transfer'
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Fetch Vault Overview
  const fetchVaultOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=get_overview&token=${encodeURIComponent(token)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.status === 'success') {
        setStats(res.data.data.stats || {});
        setStaffList(res.data.data.staff || []);
        setAuditLogs(res.data.data.logs || []);
      } else {
        toast.error(res.data.message || 'Failed to fetch Mango Vault data.');
      }
    } catch (err) {
      console.error('Vault overview error:', err);
      toast.error('Server error connecting to Mango Vault API.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultOverview();
  }, [fetchVaultOverview]);

  // Open Modals Helper
  const openHoldModal = (staff) => {
    setSelectedStaff(staff);
    setActiveModal('hold');
  };

  const openReleaseModal = (staff) => {
    setSelectedStaff(staff);
    setActiveModal('release');
  };

  const openTransferModal = (staff) => {
    setSelectedStaff(staff);
    setActiveModal('transfer');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStaff(null);
  };

  // Filter staff
  const filteredStaff = staffList.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.employee_code?.toLowerCase().includes(query) ||
      s.designation?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (shiftFilter === 'debt') return s.has_debt;
    if (shiftFilter === '6h') return s.shift_hours === 6;
    if (shiftFilter === '8h') return s.shift_hours === 8;
    if (shiftFilter === 'held') return s.vault_held_mangoes > 0;
    return true;
  });

  return (
    <div className="space-y-6 mx-auto pb-12">
      <MangoVaultHeader
        loading={loading}
        stats={stats}
        staffList={staffList}
        fetchVaultOverview={fetchVaultOverview}
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiUsers size={14} />
              <span>Staff Mango Balances ({staffList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiList size={14} />
              <span>Audit Transaction Logs ({auditLogs.length})</span>
            </button>
          </div>

          {activeTab === 'staff' && (
            <MangoFilterToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              shiftFilter={shiftFilter}
              setShiftFilter={setShiftFilter}
              staffList={staffList}
              stats={stats}
            />
          )}
        </div>

        {activeTab === 'staff' && (
          <MangoStaffTable
            loading={loading}
            filteredStaff={filteredStaff}
            openHoldModal={openHoldModal}
            openReleaseModal={openReleaseModal}
            openTransferModal={openTransferModal}
            apiBase={API_BASE}
          />
        )}

        {activeTab === 'logs' && (
          <MangoVaultAuditLogs auditLogs={auditLogs} />
        )}
      </div>

      <MangoVaultModals
        activeModal={activeModal}
        selectedStaff={selectedStaff}
        staffList={staffList}
        closeModal={closeModal}
        onSuccess={() => fetchVaultOverview(true)}
      />
    </div>
  );
}
