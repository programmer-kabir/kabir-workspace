import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiShoppingBag, FiUsers, FiClock, FiArrowRight, FiCheckCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Pusher from 'pusher-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const P2POvertimeMarket = ({ isOpen, onClose, onTradeUpdated }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'incoming' | 'history'
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState([]);
  const [buyerInfo, setBuyerInfo] = useState(null);

  // Trades data
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [tradeSummary, setTradeSummary] = useState(null);

  // Buy modal state
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedHours, setSelectedHours] = useState(2);
  const [buyerNote, setBuyerNote] = useState('');
  const [submittingTrade, setSubmittingTrade] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [peersRes, tradesRes] = await Promise.all([
        axios.get(`${API_BASE}api/breaks/trades/get_market_peers.php?user_id=${currentUser.id}`),
        axios.get(`${API_BASE}api/breaks/trades/get_my_trades.php?user_id=${currentUser.id}`)
      ]);

      if (peersRes.data?.status === 'success') {
        setPeers(peersRes.data.data.peers || []);
        setBuyerInfo(peersRes.data.data.buyer_info || null);
      }
      if (tradesRes.data?.status === 'success') {
        setIncomingRequests(tradesRes.data.data.incoming_requests || []);
        setPurchases(tradesRes.data.data.purchases || []);
        setSales(tradesRes.data.data.sales || []);
        setTradeSummary(tradesRes.data.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load P2P market data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      fetchData();

      let pusherInstance = null;
      try {
        pusherInstance = new Pusher('82a63711fed4b73bd74d', { cluster: 'ap2', forceTLS: true });
        const userChannel = pusherInstance.subscribe(`user-channel-${currentUser?.id}`);
        const globalChannel = pusherInstance.subscribe('staff-breaks');

        const handleReload = () => fetchData();
        userChannel.bind('overtime-trade-requested', () => {
          toast.info('🥭 You have a new overtime purchase request from a colleague!');
          fetchData();
        });
        userChannel.bind('overtime-trade-approved', (d) => {
          toast.success(`✅ Overtime trade ${d.trade_code} approved by Admin!`);
          fetchData();
          if (onTradeUpdated) onTradeUpdated();
        });
        userChannel.bind('overtime-trade-updated', handleReload);
        globalChannel.bind('overtime-trade-approved', handleReload);
      } catch (e) { }

      return () => {
        if (pusherInstance) pusherInstance.disconnect();
      };
    }
  }, [isOpen, fetchData, currentUser, onTradeUpdated]);

  if (!isOpen) return null;

  const handleSendBuyRequest = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return;

    setSubmittingTrade(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/trades/create_trade_request.php`, {
        buyer_id: currentUser.id,
        seller_id: selectedSeller.id,
        hours: selectedHours,
        buyer_note: buyerNote
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Request sent to seller!');
        setSelectedSeller(null);
        setBuyerNote('');
        setActiveTab('history');
        fetchData();
        if (onTradeUpdated) onTradeUpdated();
      } else {
        toast.error(res.data?.message || 'Failed to submit trade request');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting trade request');
    } finally {
      setSubmittingTrade(false);
    }
  };

  const handleSellerRespond = async (tradeId, action) => {
    setRespondingId(tradeId);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/trades/seller_respond_trade.php`, {
        trade_id: tradeId,
        seller_id: currentUser.id,
        action: action
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message);
        fetchData();
        if (onTradeUpdated) onTradeUpdated();
      } else {
        toast.error(res.data?.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Network error updating trade request');
    } finally {
      setRespondingId(null);
    }
  };

  const calculateCost = (hours, rate) => Math.round(Number(hours) * Number(rate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shadow-xs">
              🛒
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Mango P2P Overtime Market</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  Payroll Protected
                </span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Purchase break hours from colleagues with excess overtime via automated salary adjustment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'buy'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiShoppingBag size={14} />
              <span>Buy Overtime ({peers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 relative ${activeTab === 'incoming'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiUsers size={14} />
              <span>Incoming Requests</span>
              {incomingRequests.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'history'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <FiClock size={14} />
              <span>My Trade Ledger</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 text-slate-400 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

          {/* TAB 1: BUY OVERTIME */}
          {activeTab === 'buy' && (
            <div className="space-y-5">
              {/* Logged-in User's Seller Status Banner */}
              {buyerInfo && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/40 shrink-0">
                      🥭
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>Logged in as: {currentUser?.name}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
                          Seller Ready
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Your Tradeable Overtime: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{(buyerInfo.available_mango_minutes / 60).toFixed(2)} hrs ({buyerInfo.available_mango_minutes}m)</strong> • Your Rate: <strong className="text-slate-700 dark:text-slate-200 font-bold">৳{buyerInfo.hourly_rate}/hr</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-right bg-white/70 dark:bg-slate-800/80 p-2 px-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Colleagues buy from your pool</p>
                    <p className="text-[10px]">Offers arrive in <button type="button" onClick={() => setActiveTab('incoming')} className="text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer">Incoming Requests</button></p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-bold gap-2">
                  <FiRefreshCw className="animate-spin w-4 h-4" />
                  <span>Loading colleague balances...</span>
                </div>
              ) : peers.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <span className="text-4xl block mb-2">🌴</span>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Excess Overtime Available in Market</h4>
                  <p className="text-xs text-slate-400 mt-1">None of your active colleagues currently have 1+ hours of excess overtime to trade.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={peer.profile_picture ? `${API_BASE}${peer.profile_picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name)}&background=random`}
                            alt={peer.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                          />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{peer.name}</h4>
                            <p className="text-[11px] font-semibold text-slate-400">{peer.designation}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                                🥭 {peer.available_hours} hrs overtime
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Rate</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white">৳{peer.hourly_rate}</span>
                          <span className="text-[10px] text-slate-400">/hr</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">Max Trade: {peer.max_tradeable_hours} hrs</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeller(peer);
                            setSelectedHours(Math.min(2, peer.max_tradeable_hours));
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Buy Hours</span>
                          <FiArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INCOMING REQUESTS (WHERE I AM SELLER) */}
          {activeTab === 'incoming' && (
            <div className="space-y-4">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <span className="text-3xl block mb-2">📬</span>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Pending Requests</h4>
                  <p className="text-xs text-slate-400 mt-1">You do not have any pending overtime purchase requests from colleagues right now.</p>
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.buyer_picture ? `${API_BASE}${req.buyer_picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(req.buyer_name)}&background=random`}
                        alt={req.buyer_name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">{req.buyer_name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            Wants to buy {req.hours_traded} hrs
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          You will earn: <strong className="text-emerald-600 font-black">৳{req.total_price}</strong> (+credited to your salary wallet)
                        </p>
                        {req.buyer_note && (
                          <p className="text-[11px] text-slate-500 italic mt-1">"{req.buyer_note}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        disabled={respondingId === req.id}
                        onClick={() => handleSellerRespond(req.id, 'reject')}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === req.id}
                        onClick={() => handleSellerRespond(req.id, 'accept')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {respondingId === req.id ? (
                          <FiRefreshCw className="animate-spin w-3 h-3" />
                        ) : (
                          <FiCheckCircle size={14} />
                        )}
                        <span>Accept & Send to Admin</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TRADE HISTORY LEDGER */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              {tradeSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hours Sold</span>
                    <h4 className="text-base font-black text-emerald-600 mt-0.5">{tradeSummary.sold_hours}h</h4>
                    <span className="text-[10px] font-bold text-slate-500">+৳{tradeSummary.sold_earnings} earned</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hours Purchased</span>
                    <h4 className="text-base font-black text-amber-600 mt-0.5">{tradeSummary.bought_hours}h</h4>
                    <span className="text-[10px] font-bold text-slate-500">-৳{tradeSummary.bought_spent} paid</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Active Net Break Overtime</span>
                    <h4 className="text-base font-black text-slate-800 dark:text-white mt-0.5">
                      {Math.floor(tradeSummary.bought_minutes / 60)}h {tradeSummary.bought_minutes % 60}m bought total
                    </h4>
                    <span className="text-[10px] text-slate-400">Available to use in your Custom Break modal</span>
                  </div>
                </div>
              )}

              {/* Purchases Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">My Purchases (Bought Break Hours)</h4>
                {purchases.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">No overtime purchase records yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Trade Code</th>
                          <th className="p-2.5">Seller</th>
                          <th className="p-2.5">Hours</th>
                          <th className="p-2.5">Cost</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {purchases.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{p.trade_code}</td>
                            <td className="p-2.5">{p.seller_name}</td>
                            <td className="p-2.5 font-bold text-amber-600">+{p.hours_traded}h</td>
                            <td className="p-2.5 text-rose-500 font-bold">-৳{p.total_price}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : p.status === 'pending_admin'
                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                    : p.status === 'pending_seller'
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                }`}>
                                {p.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400">{p.created_at ? p.created_at.split(' ')[0] : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sales Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">My Sales (Sold Overtime Hours)</h4>
                {sales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">No overtime sale records yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Trade Code</th>
                          <th className="p-2.5">Buyer</th>
                          <th className="p-2.5">Hours Sold</th>
                          <th className="p-2.5">Earnings</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {sales.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{s.trade_code}</td>
                            <td className="p-2.5">{s.buyer_name}</td>
                            <td className="p-2.5 font-bold text-slate-500">-{s.hours_traded}h</td>
                            <td className="p-2.5 text-emerald-600 font-bold">+৳{s.total_price}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : s.status === 'pending_admin'
                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                    : s.status === 'pending_seller'
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                }`}>
                                {s.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400">{s.created_at ? s.created_at.split(' ')[0] : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Buy Modal Sub-Dialog */}
      {selectedSeller && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in zoom-in-95 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Purchase Overtime from {selectedSeller.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Hourly Salary Rate</span>
                <span className="font-black text-slate-800 dark:text-white">৳{selectedSeller.hourly_rate} / hour</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Available Pool</span>
                <span className="font-black text-emerald-600">{selectedSeller.available_hours} hrs</span>
              </div>
            </div>

            <form onSubmit={handleSendBuyRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Hours to Buy
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 8].map((h) => {
                    const disabled = h > selectedSeller.available_hours;
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedHours(h)}
                        className={`py-2 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${disabled
                            ? 'opacity-30 bg-slate-100 cursor-not-allowed'
                            : selectedHours === h
                              ? 'bg-amber-500 text-white border-amber-500 font-black shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                          }`}
                      >
                        {h} {h === 1 ? 'Hour' : 'Hours'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Payroll Cost</span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-200">
                    ৳{calculateCost(selectedHours, selectedSeller.hourly_rate)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span className="block font-bold">Deducted from your salary</span>
                  <span className="text-[10px] text-amber-600 font-semibold">+Credited to {selectedSeller.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reason / Note for Colleague
                </label>
                <input
                  type="text"
                  required
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="e.g. Urgent family matter tomorrow, need 2 hrs leave"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrade}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingTrade ? (
                    <>
                      <FiRefreshCw className="animate-spin w-3 h-3" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Confirm Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default P2POvertimeMarket;
