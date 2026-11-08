import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { getTransactionInfo } from '../components/Credits/creditUtils';
import CreditSummaryHero from '../components/Credits/CreditSummaryHero';
import CreditLedgerTable from '../components/Credits/CreditLedgerTable';
import TransactionDetailModal from '../components/Credits/TransactionDetailModal';
import CreditTransferModal from '../components/Credits/CreditTransferModal';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

const Credits = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || currentUser?.user_id;

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'rewards' | 'penalties' | 'transfers'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Send Transfer State
  const [isSendOpen, setIsSendOpen] = useState(false);

  // Fetch Wallet Data
  const fetchWallet = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}&portal=staff`);
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      toast.error('Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchWallet();
    }
    const handleCreditUpdated = () => {
      if (userId) fetchWallet();
    };
    window.addEventListener('credit-updated', handleCreditUpdated);
    return () => window.removeEventListener('credit-updated', handleCreditUpdated);
  }, [userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  // Filter transactions
  const transactions = wallet?.transactions || [];
  const filtered = transactions.filter((tx) => {
    const info = getTransactionInfo(tx);
    const matchesSearch = 
      (info.mainTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (info.reasonText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (info.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (String(tx.reference_id || '')).includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'rewards') return tx.type === 'task_reward' || tx.type === 'bonus' || Number(tx.amount) > 0;
    if (filterType === 'penalties') return info.isPenalty;
    if (filterType === 'transfers') return tx.type === 'transfer_sent' || tx.type === 'transfer_received';
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const balance = wallet ? wallet.balance : 0;
  const isNegative = balance < 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <CreditSummaryHero
        wallet={wallet}
        loading={loading}
        balance={balance}
        isNegative={isNegative}
        fetchWallet={fetchWallet}
        setIsSendOpen={setIsSendOpen}
      />

      <CreditLedgerTable
        loading={loading}
        paginated={paginated}
        filtered={filtered}
        filterType={filterType}
        setFilterType={setFilterType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        setSelectedTx={setSelectedTx}
      />

      <TransactionDetailModal
        selectedTx={selectedTx}
        setSelectedTx={setSelectedTx}
      />

      <CreditTransferModal
        isSendOpen={isSendOpen}
        setIsSendOpen={setIsSendOpen}
        balance={balance}
      />
    </div>
  );
};

export default Credits;
