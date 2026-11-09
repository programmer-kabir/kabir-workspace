import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/soundFx';
import { API_BASE, getBoyQuotes, SAFE_TREE_POSITIONS } from './treeUtils';

/**
 * useMangoTreeData
 * Custom hook managing state, tree balance fetching, month filtering,
 * interactive boy dialogue, and break claim logic.
 */
export default function useMangoTreeData() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMango, setSelectedMango] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimDate, setClaimDate] = useState('');
  const [claimReason, setClaimReason] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [activeLedgerTab, setActiveLedgerTab] = useState('overtime');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [boyBouncing, setBoyBouncing] = useState(false);
  const [boyQuoteIndex, setBoyQuoteIndex] = useState(0);

  // Computed summary metrics
  const summary = data?.summary || {};
  const ripeCount = summary?.ripe_mangoes_count || 0;
  const allRipeMangoes = (data?.mangoes || []).slice(0, ripeCount);
  const maxTreeRipeMangoes = 4;
  const treeMangoes = allRipeMangoes.slice(0, maxTreeRipeMangoes);
  const extraBasketMangoesCount = Math.max(0, ripeCount - maxTreeRipeMangoes);
  const growingMango = data?.growing_mango || null;
  const shiftHours = summary?.shift_hours || 8;
  const totalOvertime = summary?.total_overtime_hours || 0;
  const availableBreakHours = summary?.available_break_hours || 0;
  const availableBreakDays = summary?.available_break_days || 0;

  // Boy dialogue interaction
  const handleBoyClick = (e) => {
    e?.stopPropagation?.();
    try {
      soundFx?.playPop?.();
    } catch {}
    setBoyBouncing(true);
    const boyQuotes = getBoyQuotes(extraBasketMangoesCount);
    const currentQuote = boyQuotes[boyQuoteIndex % boyQuotes.length];
    setBoyQuoteIndex((prev) => (prev + 1) % boyQuotes.length);
    toast(currentQuote, {
      icon: '🥭',
      duration: 3500,
      description: 'খোকা অধীর আগ্রহে গাছের পাকা আমের দিকে চেয়ে আছে!',
    });
    setTimeout(() => setBoyBouncing(false), 700);
  };

  // Fetch Tree balance and ledger details
  const fetchTreeData = useCallback(
    async (targetMonth = selectedMonth) => {
      if (!currentUser?.id) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}api/breaks/get_mango_break_bank.php?user_id=${currentUser.id}&month=${targetMonth}&t=${Date.now()}`
        );
        if (res.data.status === 'success') {
          setData(res.data.data);
          if (res.data.data?.summary?.available_months) {
            setAvailableMonths(res.data.data.summary.available_months);
          }
          if (targetMonth === 'current' && res.data.data?.summary?.selected_month) {
            setSelectedMonth(res.data.data.summary.selected_month);
          }
        } else {
          toast.error(res.data.message || 'Failed to load Mango Tree data');
        }
      } catch (err) {
        console.error('Failed to load mango break bank:', err);
        toast.error('Network error loading Mango Break Bank');
      } finally {
        setLoading(false);
      }
    },
    [currentUser, selectedMonth]
  );

  useEffect(() => {
    fetchTreeData('current');
  }, [currentUser]);

  // Click on a ripe mango to initiate break claim
  const handleMangoClick = (mango) => {
    try {
      soundFx?.play('click');
    } catch {}
    setSelectedMango(mango);
    setIsClaimModalOpen(true);
  };

  // Submit break claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimDate) {
      toast.error('Please pick a date for your earned break day.');
      return;
    }
    setClaiming(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/claim_mango_break.php`, {
        user_id: currentUser.id,
        mango_index: selectedMango?.id || 1,
        hours: selectedMango?.hours || 8,
        leave_date: claimDate,
        reason: claimReason || 'Redeemed from Mango Tree Overtime Bank',
      });

      if (res.data.status === 'success') {
        try {
          soundFx?.play('success');
        } catch {}
        toast.success(res.data.message || '🥭 Mango Break Redeemed Successfully!');
        setIsClaimModalOpen(false);
        setClaimDate('');
        setClaimReason('');
        await fetchTreeData();
      } else {
        toast.error(res.data.message || 'Failed to claim break');
      }
    } catch (err) {
      toast.error('Error claiming break day');
    } finally {
      setClaiming(false);
    }
  };

  const handleMonthChange = (monthKey) => {
    setSelectedMonth(monthKey);
    fetchTreeData(monthKey);
  };

  return {
    currentUser,
    loading,
    data,
    summary,
    ripeCount,
    allRipeMangoes,
    treeMangoes,
    extraBasketMangoesCount,
    growingMango,
    shiftHours,
    totalOvertime,
    availableBreakHours,
    availableBreakDays,
    safeTreePositions: SAFE_TREE_POSITIONS,
    // Claim modal state
    selectedMango,
    setSelectedMango,
    isClaimModalOpen,
    setIsClaimModalOpen,
    claimDate,
    setClaimDate,
    claimReason,
    setClaimReason,
    claiming,
    handleMangoClick,
    handleClaimSubmit,
    // Ledger tabs & market
    activeLedgerTab,
    setActiveLedgerTab,
    isMarketOpen,
    setIsMarketOpen,
    selectedMonth,
    availableMonths,
    handleMonthChange,
    // Boy character
    boyBouncing,
    handleBoyClick,
    fetchTreeData,
  };
}

