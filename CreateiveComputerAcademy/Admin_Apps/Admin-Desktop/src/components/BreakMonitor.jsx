import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FiCoffee, 
  FiSquare, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiCheck, 
  FiX, 
  FiRepeat, 
  FiArrowRight, 
  FiDollarSign, 
  FiShield
} from 'react-icons/fi';
import { useAuth, getApiBase } from '../context/AuthContext';
import Pusher from 'pusher-js';

const BreakMonitor = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('breaks'); // 'breaks' | 'trades'
  const [breaks, setBreaks] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingTrades, setPendingTrades] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [processingId, setProcessingId] = useState(null);
  const [processingTradeId, setProcessingTradeId] = useState(null);

  const fetchLiveBreaks = async () => {
    try {
      const apiBase = getApiBase();
      const res = await axios.get(`${apiBase}api/breaks/get_live_breaks.php`);
      if (res.data?.status === 'success') {
        const activeList = res.data.data?.active_breaks || (Array.isArray(res.data.data) ? res.data.data : []);
        const pendingList = res.data.data?.pending_requests || [];
        setBreaks(activeList);
        setPendingRequests(pendingList);
        if (res.data.server_time || res.data.data?.server_time) {
          const sTime = new Date(res.data.server_time || res.data.data.server_time).getTime();
          setNow(sTime);
        }
      }
    } catch (err) {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      setTradesLoading(true);
      const apiBase = getApiBase();
      const res = await axios.get(`${apiBase}api/breaks/trades/get_pending_admin_trades.php`);
      if (res.data?.status === 'success') {
        setPendingTrades(res.data.data?.pending_trades || []);
        setRecentTrades(res.data.data?.recent_trades || []);
      }
    } catch (err) {
      // Non-blocking
    } finally {
      setTradesLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBreaks();
    fetchTrades();

    const intervalId = setInterval(() => {
      fetchLiveBreaks();
      fetchTrades();
    }, 25000);

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const channel = pusherInstance.subscribe('staff-breaks');

      channel.bind('break-requested', (data) => {
        const purposeTag = data.purpose ? `[${data.purpose}] ` : '';
        toast.info(`☕ Break Request: ${data.user_name} requested ${data.estimated_minutes}m ${purposeTag}${data.break_type} break!`, {
          duration: 6000
        });
        fetchLiveBreaks();
      });

      channel.bind('break-approved', () => fetchLiveBreaks());
      channel.bind('break-rejected', () => fetchLiveBreaks());
      channel.bind('break-ended', () => fetchLiveBreaks());

      channel.bind('overtime-trade-seller-responded', (data) => {
        if (data.status === 'pending_admin') {
          toast.info(`🛒 Overtime Trade: ${data.buyer_name} wants to buy ${data.hours}h from ${data.seller_name}! Admin approval required.`, {
            duration: 8000
          });
          fetchTrades();
        }
      });

      channel.bind('overtime-trade-requested', () => fetchTrades());
      channel.bind('overtime-trade-approved', () => {
        fetchTrades();
        fetchLiveBreaks();
      });
      channel.bind('overtime-trade-updated', () => fetchTrades());

    } catch (e) {
      // Non-blocking
    }

    return () => {
      clearInterval(intervalId);
      if (pusherInstance) {
        pusherInstance.unsubscribe('staff-breaks');
        pusherInstance.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => {
      setNow((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(tickId);
  }, []);

  const handleAction = async (breakId, action) => {
    setProcessingId(breakId);
    try {
      const apiBase = getApiBase();
      const res = await axios.post(`${apiBase}api/breaks/manage_break_request.php`, {
        break_id: breakId,
        action: action,
        admin_id: currentUser?.id
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message);
        setPendingRequests((prev) => prev.filter((p) => (p.id || p.break_id) !== breakId));
        fetchLiveBreaks();
      } else {
        toast.error(res.data?.message || 'Action failed');
      }
    } catch {
      toast.error('Error processing break request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceEnd = async (breakId) => {
    if (!window.confirm("Are you sure you want to force end this break?")) return;
    try {
      const apiBase = getApiBase();
      const res = await axios.post(`${apiBase}api/breaks/end_break.php`, {
        break_id: breakId
      });
      if (res.data?.status === 'success') {
        toast.success('Break ended.');
        fetchLiveBreaks();
      } else {
        toast.error(res.data?.message);
      }
    } catch {
      toast.error('Error ending break.');
    }
  };

  const handleTradeAction = async (tradeId, action) => {
    let reason = '';
    if (action === 'reject') {
      const inputReason = window.prompt('Please enter a rejection reason (optional):', 'Administrative decision');
      if (inputReason === null) return;
      reason = inputReason;
    }

    setProcessingTradeId(tradeId);
    try {
      const apiBase = getApiBase();
      const res = await axios.post(`${apiBase}api/breaks/trades/admin_manage_trade.php`, {
        trade_id: tradeId,
        action: action,
        admin_id: currentUser?.id,
        reason: reason
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || `Trade ${action}d successfully!`);
        fetchTrades();
        fetchLiveBreaks();
      } else {
        toast.error(res.data?.message || `Failed to ${action} trade`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Error while trying to ${action} trade`);
    } finally {
      setProcessingTradeId(null);
    }
  };

  const getProfileImgUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    const cleanBase = getApiBase().replace(/\/+$/, '');
    return `${cleanBase}/${pic.replace(/^\/+/, '')}`;
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-6 flex flex-col h-full overflow-hidden transition-colors">
      {/* ── Header with Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            {activeTab === 'breaks' ? <FiCoffee size={16} /> : <FiRepeat size={16} />}
          </span>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
              {activeTab === 'breaks' ? 'Live Break Monitor' : 'P2P Overtime Market Trades'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {activeTab === 'breaks' ? 'Real-time breaks & staff requests' : 'Staff overtime transfers & payroll sync'}
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('breaks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'breaks'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FiCoffee size={13} />
            <span>Breaks</span>
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-200">
              {breaks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'trades'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FiRepeat size={13} />
            <span>Overtime Trades</span>
            {pendingTrades.length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {pendingTrades.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[250px] custom-scrollbar">
        {/* ── TAB 1: LIVE BREAKS ── */}
        {activeTab === 'breaks' && (
          <>
            {pendingTrades.length > 0 && (
              <div
                onClick={() => setActiveTab('trades')}
                className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border-2 border-amber-500/60 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-amber-200 truncate">
                      🛒 {pendingTrades.length} Overtime Trade(s) Awaiting Admin Sign-off!
                    </p>
                    <p className="text-[10px] text-amber-300 font-semibold truncate">
                      {pendingTrades[0]?.seller_name} agreed to transfer {pendingTrades[0]?.hours_traded}h to {pendingTrades[0]?.buyer_name} (৳{parseFloat(pendingTrades[0]?.total_price || 0).toFixed(2)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shrink-0 flex items-center gap-1 shadow-xs group-hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Review</span>
                  <FiArrowRight size={12} />
                </button>
              </div>
            )}

            {/* Pending Break Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <p className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Pending Break Requests ({pendingRequests.length})</span>
                </p>
                {pendingRequests.map((req) => {
                  const bId = req.id || req.break_id;
                  const isProcessing = processingId === bId;

                  return (
                    <div
                      key={bId}
                      className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {req.name || req.user_name || `Staff #${req.user_id}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            {req.purpose ? `${req.purpose} • ` : ''}{req.break_type} ({req.estimated_minutes || 30}m)
                          </span>
                        </div>
                        {req.reason && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                            "{req.reason}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAction(bId, 'reject')}
                          className="p-1.5 px-2.5 rounded-xl border border-rose-800 bg-slate-800 hover:bg-rose-950/40 text-rose-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Reject Request"
                        >
                          <FiX size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAction(bId, 'approve')}
                          className="p-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Approve Request"
                        >
                          <FiCheck size={13} />
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Breaks */}
            {breaks.length === 0 && pendingRequests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <FiCheckCircle size={36} className="mb-2 text-slate-700" />
                <p className="font-medium text-xs">No staff currently on break.</p>
              </div>
            ) : (
              breaks.map((b) => {
                const startTime = new Date(b.start_time).getTime();
                const diff = Math.max(0, Math.floor((now - startTime) / 1000));
                const elapsedMinutes = Math.floor(diff / 60);
                const isTiffin = b.break_type === 'Tiffin' || b.purpose === 'Tiffin';
                const limit = isTiffin ? 40 : (parseInt(b.allocated_break_minutes) || 60);
                const isOvertime = elapsedMinutes >= limit;
                const overMins = isOvertime ? elapsedMinutes - limit : 0;
                
                const m = String(elapsedMinutes).padStart(2, '0');
                const s = String(diff % 60).padStart(2, '0');
                const avatar = getProfileImgUrl(b.profile_picture);

                return (
                  <div
                    key={b.break_id || b.id}
                    className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                      isOvertime
                        ? 'bg-rose-950/30 border-rose-800 shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0">
                        {avatar ? (
                          <img src={avatar} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-900/40 text-blue-300 font-bold uppercase text-xs">
                            {b.name?.charAt(0) || 'S'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{b.name}</h4>
                          {isTiffin && isOvertime && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                              Over (+{overMins}m)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                          {b.purpose ? `${b.purpose} • ` : ''}{b.break_type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className={`font-mono text-sm font-black ${isOvertime ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                        {m}:{s}
                        {isOvertime && <FiAlertCircle className="inline ml-1" size={12} />}
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleForceEnd(b.break_id || b.id)}
                        title="Force End Break"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors cursor-pointer"
                      >
                        <FiSquare size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── TAB 2: OVERTIME TRADES ── */}
        {activeTab === 'trades' && (
          <div className="space-y-3">
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <FiShield className="text-amber-400 shrink-0" size={14} />
                <span className="text-amber-200 font-bold text-[11px]">
                  Peer-to-Peer Overtime Market
                </span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                Auto-Balanced
              </span>
            </div>

            {tradesLoading && pendingTrades.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">Loading trades...</div>
            ) : pendingTrades.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <FiRepeat size={28} className="mx-auto mb-2 text-slate-700" />
                <p className="text-xs font-bold text-slate-400">
                  No Pending Overtime Trades
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTrades.map((t) => {
                  const isProcessing = processingTradeId === t.id;
                  const hours = parseFloat(t.hours_traded) || 0;
                  const rate = parseFloat(t.hourly_rate) || 0;
                  const total = parseFloat(t.total_price) || 0;

                  return (
                    <div
                      key={t.id}
                      className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-[10px] pb-1.5 border-b border-slate-800 font-mono text-slate-400">
                        <span>#{t.trade_code || `TRD-${t.id}`}</span>
                        <span className="bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                          Seller Agreed
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[10px] text-blue-400 font-bold uppercase">Buyer: {t.buyer_name}</p>
                          <p className="text-emerald-400 font-bold text-[11px]">+{hours}h Break Credit</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-orange-400 font-bold uppercase">Seller: {t.seller_name}</p>
                          <p className="text-white font-extrabold text-xs">৳{total.toFixed(2)} (৳{rate.toFixed(2)}/h)</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleTradeAction(t.id, 'reject')}
                          className="px-2.5 py-1 rounded-lg border border-rose-800 bg-slate-900 text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                        >
                          <FiX size={12} className="inline mr-1" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleTradeAction(t.id, 'approve')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <FiCheck size={12} className="inline mr-1" /> Approve Trade
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakMonitor;
