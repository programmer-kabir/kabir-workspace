import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Settings, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  PlusCircle,
  Megaphone,
  Save,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  History,
  Phone,
  Printer,
  Copy,
  Wallet,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const AdminDashboard = () => {
  const { 
    isAdminOpen, 
    setIsAdminOpen, 
    orders, 
    updateOrderStatus, 
    users,
    updateUserWallet,
    toggleUserAdminAccess,
    notice, 
    updateNoticeText,
    paymentChannels,
    updatePaymentChannelNumber,
    setActiveReceipt,
    showToast 
  } = useApp();

  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'orders' | 'users' | 'settings'
  
  // Date filter for Reports
  const [reportDateRange, setReportDateRange] = useState('all'); // 'today' | 'yesterday' | 'week' | 'all'
  
  // Orders filtering & search
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Users search & selected user history
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);
  
  // Wallet edit state
  const [editingUserWallet, setEditingUserWallet] = useState(null);
  const [walletInputAmount, setWalletInputAmount] = useState('');

  // Settings states
  const [newNotice, setNewNotice] = useState(notice);
  const [bkashNum, setBkashNum] = useState(paymentChannels?.bkash?.number || '01738679399');
  const [nagadNum, setNagadNum] = useState(paymentChannels?.nagad?.number || '01738679399');
  const [rocketNum, setRocketNum] = useState(paymentChannels?.rocket?.number || '017386793998');

  // Helper date checking
  const isDateToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const isDateYesterday = (dateStr) => {
    const d = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() && 
           d.getMonth() === yesterday.getMonth() && 
           d.getFullYear() === yesterday.getFullYear();
  };

  const isDateWithinDays = (dateStr, days) => {
    const d = new Date(dateStr);
    const past = new Date();
    past.setDate(past.getDate() - days);
    return d >= past;
  };

  // Filter orders by date range for analytics
  const analyticsOrders = useMemo(() => {
    if (reportDateRange === 'today') {
      return orders.filter(o => isDateToday(o.createdAt));
    }
    if (reportDateRange === 'yesterday') {
      return orders.filter(o => isDateYesterday(o.createdAt));
    }
    if (reportDateRange === 'week') {
      return orders.filter(o => isDateWithinDays(o.createdAt, 7));
    }
    return orders;
  }, [orders, reportDateRange]);

  // Analytics Metrics
  const totalRevenue = analyticsOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalOrdersCount = analyticsOrders.length;
  const completedOrders = analyticsOrders.filter(o => o.status === 'Completed');
  const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pendingOrders = analyticsOrders.filter(o => o.status === 'Pending' || o.status === 'Processing');
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  // Today specific metrics for quick glance
  const todayOrders = orders.filter(o => isDateToday(o.createdAt));
  const todayCompleted = todayOrders.filter(o => o.status === 'Completed');
  const todayRevenue = todayCompleted.reduce((sum, o) => sum + (o.amount || 0), 0);
  const todayPending = todayOrders.filter(o => o.status === 'Pending' || o.status === 'Processing');

  // Payment Breakdown
  const bkashTotal = analyticsOrders.filter(o => o.method?.toLowerCase().includes('bkash')).reduce((s, o) => s + o.amount, 0);
  const nagadTotal = analyticsOrders.filter(o => o.method?.toLowerCase().includes('nagad')).reduce((s, o) => s + o.amount, 0);
  const rocketTotal = analyticsOrders.filter(o => o.method?.toLowerCase().includes('rocket')).reduce((s, o) => s + o.amount, 0);
  const walletTotal = analyticsOrders.filter(o => o.method?.toLowerCase().includes('wallet')).reduce((s, o) => s + o.amount, 0);

  // Orders Table Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = orderFilter === 'all' || order.status.toLowerCase() === orderFilter.toLowerCase();
      const q = orderSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        order.id?.toLowerCase().includes(q) ||
        order.uid?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.playerNickname?.toLowerCase().includes(q) ||
        order.trxId?.toLowerCase().includes(q) ||
        order.senderNumber?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  // Users Table Filtering
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter(u => {
      return !q || 
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q);
    });
  }, [users, userSearch]);

  const handleCopy = (text) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    showToast(`কপি করা হয়েছে: ${text}`, 'success');
  };

  const handleSaveWalletModal = (e) => {
    e.preventDefault();
    if (!editingUserWallet) return;
    updateUserWallet(editingUserWallet.uid, walletInputAmount);
    setEditingUserWallet(null);
    setWalletInputAmount('');
  };

  const handlePrintReport = () => {
    sounds.playClick();
    window.print();
  };

  if (!isAdminOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setIsAdminOpen(false)}>
      <div 
        className="modal-dialog admin-dashboard-dialog" 
        style={{ maxWidth: '980px', width: '96%', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="modal-close-btn" 
          onClick={() => {
            sounds.playClick();
            setIsAdminOpen(false);
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(0, 240, 255, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              border: '1px solid rgba(255, 0, 128, 0.3)'
            }}>
              <Settings size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>অ্যাডমিন কন্ট্রোল সেন্টার</span>
                <span style={{ fontSize: '11px', background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                  PRO
                </span>
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                লগইন অ্যাডমিন: <b style={{ color: 'var(--primary)' }}>{currentUser?.displayName || 'Jahidul Islam'}</b> ({currentUser?.email || 'jahidulr24@gmail.com'})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="topup-card-btn"
              style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}
              onClick={handlePrintReport}
              title="ফুল রিপোর্ট প্রিন্ট করুন"
            >
              <Printer size={14} /> রিপোর্ট প্রিন্ট
            </button>
            <span className="admin-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Crown size={12} color="#f59e0b" /> SUPER ADMIN ACTIVE
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { sounds.playClick(); setActiveTab('reports'); }}
          >
            <TrendingUp size={15} />
            <span>দৈনিক ও সার্বিক রিপোর্ট</span>
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { sounds.playClick(); setActiveTab('orders'); }}
          >
            <ShoppingBag size={15} />
            <span>অর্ডার তালিকা ({orders.length})</span>
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { sounds.playClick(); setActiveTab('users'); }}
          >
            <Users size={15} />
            <span>ইউজার ও ওয়ালেট ({users.length})</span>
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { sounds.playClick(); setActiveTab('settings'); }}
          >
            <Settings size={15} />
            <span>সেটিংস ও নোটিশ</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: DAILY & FULL ANALYTICS REPORT
            ======================================================== */}
        {activeTab === 'reports' && (
          <div>
            {/* Top Quick Status Highlights */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(255, 0, 128, 0.08))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '14px 18px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ আজকের লাইভ পরিসংখ্যান ({new Date().toLocaleDateString('bn-BD')})
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>আজকের টপ-আপ: </span>
                    <b style={{ color: '#fff', fontSize: '16px' }}>{todayOrders.length} টি</b>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>আজকের আয়: </span>
                    <b style={{ color: 'var(--emerald)', fontSize: '16px' }}>৳{todayRevenue}</b>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>পেন্ডিং অর্ডার: </span>
                    <b style={{ color: '#f59e0b', fontSize: '16px' }}>{todayPending.length} টি</b>
                  </div>
                </div>
              </div>

              {/* Date Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '10px' }}>
                {[
                  { id: 'today', label: 'আজ' },
                  { id: 'yesterday', label: 'গতকাল' },
                  { id: 'week', label: 'বিগত ৭ দিন' },
                  { id: 'all', label: 'সার্বিক (সব)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`cat-tab ${reportDateRange === tab.id ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => { sounds.playClick(); setReportDateRange(tab.id); }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* METRICS STATS CARDS */}
            <div className="admin-stats-grid" style={{ marginBottom: '18px' }}>
              <div className="admin-stat-card">
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={14} color="var(--gold)" /> মোট সেলস রেভিনিউ
                </div>
                <div className="admin-stat-val" style={{ color: 'var(--gold)' }}>৳{totalRevenue}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  সফল ডেলিভারি থেকে: ৳{completedRevenue}
                </div>
              </div>

              <div className="admin-stat-card">
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShoppingBag size={14} color="var(--primary)" /> মোট অর্ডার সংখ্যা
                </div>
                <div className="admin-stat-val" style={{ color: 'var(--primary)' }}>{totalOrdersCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  সম্পন্ন: {completedOrders.length} টি ({totalOrdersCount > 0 ? Math.round((completedOrders.length / totalOrdersCount) * 100) : 0}%)
                </div>
              </div>

              <div className="admin-stat-card">
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} color="#f59e0b" /> অপেক্ষমাণ (Pending)
                </div>
                <div className="admin-stat-val" style={{ color: '#f59e0b' }}>{pendingOrders.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  মোট পেন্ডিং মূল্য: ৳{pendingAmount}
                </div>
              </div>

              <div className="admin-stat-card">
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} color="var(--emerald)" /> নিবন্ধিত মোট গেমার
                </div>
                <div className="admin-stat-val" style={{ color: 'var(--emerald)' }}>{users.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  সক্রিয় গ্রাহক প্রোফাইল
                </div>
              </div>
            </div>

            {/* PAYMENT CHANNELS BREAKDOWN */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={16} color="var(--primary)" />
                <span>পেমেন্ট মেথড অনুযায়ী আয়ের হিসাব ({reportDateRange === 'today' ? 'আজকের' : reportDateRange === 'yesterday' ? 'গতকালের' : reportDateRange === 'week' ? '৭ দিনের' : 'সার্বিক'})</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(226, 19, 110, 0.08)', border: '1px solid rgba(226, 19, 110, 0.3)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#e2136e', fontWeight: 700 }}>বিকাশ (bKash)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>৳{bkashTotal}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    অর্ডার: {analyticsOrders.filter(o => o.method?.toLowerCase().includes('bkash')).length} টি
                  </div>
                </div>

                <div style={{ background: 'rgba(247, 147, 30, 0.08)', border: '1px solid rgba(247, 147, 30, 0.3)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#f7931e', fontWeight: 700 }}>নগদ (Nagad)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>৳{nagadTotal}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    অর্ডার: {analyticsOrders.filter(o => o.method?.toLowerCase().includes('nagad')).length} টি
                  </div>
                </div>

                <div style={{ background: 'rgba(140, 51, 146, 0.08)', border: '1px solid rgba(140, 51, 146, 0.3)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 700 }}>রকেট (Rocket)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>৳{rocketTotal}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    অর্ডার: {analyticsOrders.filter(o => o.method?.toLowerCase().includes('rocket')).length} টি
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>ওয়ালেট ব্যালেন্স (Wallet)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>৳{walletTotal}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    অর্ডার: {analyticsOrders.filter(o => o.method?.toLowerCase().includes('wallet')).length} টি
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ORDER MANAGEMENT TABLE
            ======================================================== */}
        {activeTab === 'orders' && (
          <div>
            {/* Search and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="অর্ডার আইডি, UID, গ্রাহকের নাম বা TrxID..."
                  className="uid-input-field"
                  style={{ width: '100%', paddingLeft: '36px', fontSize: '12px' }}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'Pending', 'Processing', 'Completed'].map(st => (
                  <button
                    key={st}
                    className={`cat-tab ${orderFilter === st ? 'active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    onClick={() => { sounds.playClick(); setOrderFilter(st); }}
                  >
                    {st === 'all' ? 'সব অর্ডার' : st === 'Pending' ? 'পেন্ডিং' : st === 'Processing' ? 'প্রসেসিং' : 'সম্পন্ন'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="admin-orders-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>অর্ডার আইডি ও সময়</th>
                    <th>গ্রাহক ও প্লেয়ার UID</th>
                    <th>প্যাকেজ</th>
                    <th>মূল্য</th>
                    <th>পেমেন্ট মাধ্যম</th>
                    <th>স্ট্যাটাস</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                        কোনো অর্ডার পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                            {order.id}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{order.customerName}</div>
                          <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                            <span>UID: <b>{order.uid}</b></span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                              onClick={() => handleCopy(order.uid)}
                              title="UID কপি করুন"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                          {order.playerNickname && (
                            <div style={{ fontSize: '10px', color: 'var(--emerald)' }}>
                              亗 {order.playerNickname}
                            </div>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>{order.packageName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{order.productName}</div>
                        </td>

                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold)' }}>
                            ৳{order.amount}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '11px', fontWeight: 600 }}>{order.method}</div>
                          {order.trxId && (
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span>Trx: {order.trxId}</span>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '1px' }}
                                onClick={() => handleCopy(order.trxId)}
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          )}
                          {order.senderNumber && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>প্রেরক: {order.senderNumber}</div>
                          )}
                        </td>

                        <td>
                          <span className={`order-status-badge ${order.status.toLowerCase()}`}>
                            {order.status === 'Completed' ? 'সম্পন্ন ✓' : order.status === 'Processing' ? 'চলমান ⏳' : 'পেন্ডিং ⌛'}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {order.status !== 'Completed' && (
                              <button 
                                className="topup-card-btn" 
                                style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--emerald)', color: '#06080e', fontWeight: 700 }}
                                title="ডেলিভারি সম্পন্ন করুন"
                                onClick={() => updateOrderStatus(order.id, 'Completed')}
                              >
                                সম্পন্ন ✓
                              </button>
                            )}

                            {order.status === 'Pending' && (
                              <button 
                                className="topup-card-btn" 
                                style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}
                                onClick={() => updateOrderStatus(order.id, 'Processing')}
                              >
                                প্রসেসিং
                              </button>
                            )}

                            <button 
                              style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => setActiveReceipt(order)}
                            >
                              মেমো
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: USERS & WALLET CONTROL
            ======================================================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="ইউজার নাম, ইমেইল, মোবাইল বা UID দিয়ে সার্চ..."
                  className="uid-input-field"
                  style={{ width: '100%', paddingLeft: '36px', fontSize: '12px' }}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                মোট গ্রাহক: <b>{filteredUsers.length}</b> জন
              </div>
            </div>

            {/* Users Table */}
            <div className="admin-orders-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>ইউজার প্রোফাইল</th>
                    <th>রোল (অ্যাক্সেস)</th>
                    <th>ওয়ালেট ব্যালেন্স</th>
                    <th>মোট অর্ডার</th>
                    <th>অ্যাডমিন অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const userOrdersCount = orders.filter(o => o.userId === user.uid || o.customerName === user.displayName).length;
                    const isSuper = user.email?.toLowerCase() === 'jahidulr24@gmail.com';

                    return (
                      <tr key={user.uid}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} 
                              alt={user.displayName}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                                {user.displayName} {isSuper && <Crown size={12} color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle' }} />}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                {user.email || user.phone || 'Gamer Account'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: user.role === 'admin' ? 'rgba(255, 0, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: user.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                            border: user.role === 'admin' ? '1px solid rgba(255, 0, 128, 0.4)' : '1px solid var(--border-subtle)'
                          }}>
                            {user.role === 'admin' ? 'অ্যাডমিন 👑' : 'গ্রাহক 🎮'}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color: 'var(--emerald)' }}>
                            ৳{user.balance || 0}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedUserForHistory(user)}
                            title="এই ইউজারের অর্ডার হিস্ট্রি দেখুন"
                          >
                            <History size={13} /> {userOrdersCount} টি অর্ডার
                          </button>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Edit Balance */}
                            <button
                              type="button"
                              className="topup-card-btn"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => {
                                setEditingUserWallet(user);
                                setWalletInputAmount((user.balance || 0).toString());
                              }}
                            >
                              <Edit3 size={12} /> ব্যালেন্স এডিট
                            </button>

                            {/* Toggle Admin Role - only if not master super admin */}
                            {!isSuper ? (
                              <button
                                type="button"
                                className="topup-card-btn"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: user.role === 'admin' ? '#ef4444' : '#10b981',
                                  borderColor: user.role === 'admin' ? '#ef4444' : '#10b981'
                                }}
                                onClick={() => toggleUserAdminAccess(user.uid)}
                              >
                                {user.role === 'admin' ? 'অ্যাডমিন সরান' : 'অ্যাডমিন বানান 👑'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#f59e0b', fontStyle: 'italic' }}>মাস্টার অ্যাডমিন</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal for editing a user's wallet */}
            {editingUserWallet && (
              <div className="modal-backdrop" onClick={() => setEditingUserWallet(null)} style={{ zIndex: 120 }}>
                <div className="modal-dialog" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>
                    ওয়ালেট ব্যালেন্স পরিবর্তন
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    ব্যবহারকারী: <b>{editingUserWallet.displayName}</b> ({editingUserWallet.email || editingUserWallet.phone})
                  </p>

                  <form onSubmit={handleSaveWalletModal}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      নতুন ব্যালেন্স (টাকায়):
                    </label>
                    <input
                      type="number"
                      className="uid-input-field"
                      style={{ width: '100%', marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}
                      value={walletInputAmount}
                      onChange={(e) => setWalletInputAmount(e.target.value)}
                      required
                    />

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="topup-card-btn"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setEditingUserWallet(null)}
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="place-order-submit-btn"
                        style={{ flex: 1, padding: '8px', fontSize: '13px' }}
                      >
                        সেভ করুন
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal showing single user's orders history */}
            {selectedUserForHistory && (
              <div className="modal-backdrop" onClick={() => setSelectedUserForHistory(null)} style={{ zIndex: 120 }}>
                <div className="modal-dialog" style={{ maxWidth: '650px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={() => setSelectedUserForHistory(null)}>
                    <X size={16} />
                  </button>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>
                    {selectedUserForHistory.displayName} এর সকল অর্ডার
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    UID: {selectedUserForHistory.uid} | ইমেইল: {selectedUserForHistory.email || 'N/A'}
                  </div>

                  {orders.filter(o => o.userId === selectedUserForHistory.uid || o.customerName === selectedUserForHistory.displayName).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                      এই ব্যবহারকারী এখনও কোনো অর্ডার করেননি।
                    </div>
                  ) : (
                    <div className="admin-orders-table-wrap">
                      <table className="admin-orders-table">
                        <thead>
                          <tr>
                            <th>অর্ডার আইডি</th>
                            <th>প্যাকেজ</th>
                            <th>মূল্য</th>
                            <th>পেমেন্ট</th>
                            <th>স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.filter(o => o.userId === selectedUserForHistory.uid || o.customerName === selectedUserForHistory.displayName).map(ord => (
                            <tr key={ord.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{ord.id}</td>
                              <td>{ord.packageName}</td>
                              <td style={{ color: 'var(--gold)', fontWeight: 700 }}>৳{ord.amount}</td>
                              <td>{ord.method}</td>
                              <td>
                                <span className={`order-status-badge ${ord.status.toLowerCase()}`}>
                                  {ord.status}
                                </span>
                              </td>
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
        )}

        {/* ========================================================
            TAB 4: SETTINGS & TICKER NOTICE
            ======================================================== */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              
              {/* Notice Ticker Editor */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Megaphone size={16} color="var(--accent)" />
                  <span>লাইভ ওয়েবসাইট স্ক্রোলিং নোটিশ</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                  এই নোটিশটি ওয়েবসাইটের একদম উপরে লাইভ স্ক্রোল করতে থাকবে।
                </p>

                <textarea
                  className="uid-input-field"
                  rows="3"
                  style={{ width: '100%', resize: 'none', marginBottom: '10px', fontSize: '12px' }}
                  value={newNotice}
                  onChange={(e) => setNewNotice(e.target.value)}
                />

                <button
                  type="button"
                  className="place-order-submit-btn"
                  style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                  onClick={() => updateNoticeText(newNotice)}
                >
                  <Save size={14} /> নোটিশ সংরক্ষণ করুন
                </button>
              </div>

              {/* Payment Numbers Editor */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={16} color="var(--primary)" />
                  <span>পেমেন্ট সেন্ড মানি নাম্বারসমূহ</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                  গ্রাহকরা অর্ডার বা ওয়ালেট রিচার্জের সময় এই নাম্বারে টাকা পাঠাবে।
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#e2136e', fontWeight: 700 }}>বিকাশ নাম্বার (Personal):</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                      <input
                        type="text"
                        className="uid-input-field"
                        style={{ flex: 1, fontSize: '12px' }}
                        value={bkashNum}
                        onChange={(e) => setBkashNum(e.target.value)}
                      />
                      <button
                        type="button"
                        className="topup-card-btn"
                        onClick={() => updatePaymentChannelNumber('bkash', bkashNum)}
                      >
                        সেভ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#f7931e', fontWeight: 700 }}>নগদ নাম্বার (Personal):</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                      <input
                        type="text"
                        className="uid-input-field"
                        style={{ flex: 1, fontSize: '12px' }}
                        value={nagadNum}
                        onChange={(e) => setNagadNum(e.target.value)}
                      />
                      <button
                        type="button"
                        className="topup-card-btn"
                        onClick={() => updatePaymentChannelNumber('nagad', nagadNum)}
                      >
                        সেভ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#a855f7', fontWeight: 700 }}>রকেট নাম্বার (Personal):</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                      <input
                        type="text"
                        className="uid-input-field"
                        style={{ flex: 1, fontSize: '12px' }}
                        value={rocketNum}
                        onChange={(e) => setRocketNum(e.target.value)}
                      />
                      <button
                        type="button"
                        className="topup-card-btn"
                        onClick={() => updatePaymentChannelNumber('rocket', rocketNum)}
                      >
                        সেভ
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
