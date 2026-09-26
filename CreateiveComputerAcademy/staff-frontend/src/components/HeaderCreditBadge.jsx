import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreditWalletModal from './CreditWalletModal';
import { motion } from 'framer-motion';
import { FaCoins } from 'react-icons/fa6';
import { FiAlertCircle } from 'react-icons/fi';

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
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}&portal=staff`);
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setBalance(data.wallet.balance);
      }
    } catch (err) {
      console.error('Failed to fetch credit balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchBalance();
    }
  }, [currentUser?.id]);

  // Listen to global notifications & balance refresh events
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
        className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${isNegative
            ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
            : 'bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 hover:border-amber-300'
          }`}
        title="View Credit Wallet & Ledger (Click to Open)"
      >
        <span className="flex items-center justify-center shrink-0">
          {isNegative ? (
            <FiAlertCircle className="text-rose-500" size={14} />
          ) : (
            <FaCoins className="text-amber-500 dark:text-amber-400" size={13} />
          )}
        </span>

        <span className="tabular-nums">
          {loading ? '...' : (balance !== null ? balance : 0)}
        </span>

        <span className="hidden sm:inline text-[11px] font-semibold opacity-85">
          Credits
        </span>

        {/* Subtle hover pulse */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNegative ? 'bg-rose-400' : 'bg-amber-400'
              }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${isNegative ? 'bg-rose-500' : 'bg-amber-500'
              }`}
          />
        </span>
      </button>

      {/* Credit Wallet Modal */}
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
