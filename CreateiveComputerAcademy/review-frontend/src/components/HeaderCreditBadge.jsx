import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiSparkles } from 'react-icons/hi';
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
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}&portal=reviewer`);
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setBalance(data.wallet.balance);
      }
    } catch (err) {
      console.error('Failed to fetch reviewer credit balance:', err);
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

  const isNegative = balance !== null && balance < 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
          isNegative
            ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
            : 'bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:border-indigo-300'
        }`}
        title="View Reviewer Credit Wallet (Click to Open)"
      >
        <HiSparkles size={14} className={isNegative ? 'text-rose-500 shrink-0' : 'text-amber-500 shrink-0'} />

        <span className="tabular-nums">
          {loading ? '...' : (balance !== null ? balance : 0)}
        </span>

        <span className="hidden sm:inline text-[11px] font-semibold opacity-85">
          Credits
        </span>

        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isNegative ? 'bg-rose-400' : 'bg-indigo-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isNegative ? 'bg-rose-500' : 'bg-indigo-500'
            }`}
          />
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
