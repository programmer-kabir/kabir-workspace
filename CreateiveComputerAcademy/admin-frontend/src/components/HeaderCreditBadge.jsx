import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreditWalletModal from './CreditWalletModal';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

const HeaderCreditBadge = () => {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userId = currentUser?.id || currentUser?.user_id;

  const fetchBalance = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}`);
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setBalance(data.wallet.balance);
      }
    } catch (err) {
      console.error('Failed to fetch admin credit balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchBalance();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchBalance();
    };

    window.addEventListener('new-notification-received', handleUpdate);
    window.addEventListener('credit-balance-updated', handleUpdate);

    return () => {
      window.removeEventListener('new-notification-received', handleUpdate);
      window.removeEventListener('credit-balance-updated', handleUpdate);
    };
  }, [currentUser?.id]);

  if (!currentUser?.id) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
        title="Admin Credit Console (Click to Open)"
      >
        <span className="text-sm select-none">🪙</span>
        <span className="tabular-nums font-extrabold">
          {loading ? '...' : (balance !== null ? balance : 0)}
        </span>
        <span className="hidden sm:inline text-[11px] font-semibold opacity-85">
          Credits
        </span>
      </button>

      <CreditWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={currentUser}
        onBalanceChange={(newBal) => setBalance(newBal)}
      />
    </>
  );
};

export default HeaderCreditBadge;
