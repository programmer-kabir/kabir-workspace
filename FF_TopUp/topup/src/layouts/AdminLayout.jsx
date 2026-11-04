import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  CreditCard, 
  Megaphone, 
  FileText, 
  ArrowLeft, 
  Menu, 
  X, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Wallet, 
  Copy, 
  Printer, 
  MessageCircle, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  Zap, 
  LogOut, 
  KeyRound, 
  TrendingUp, 
  DollarSign, 
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  HelpCircle,
  Save,
  Check,
  Flame,
  Gift,
  ThumbsUp,
  RefreshCw,
  Power,
  Bell,
  CheckCheck,
  Volume2,
  VolumeX
} from 'lucide-react';
import { sounds } from '../services/soundEffects';
import './AdminLayout.css';

export const AdminLayout = () => {
  const {
    navigate,
    activeAdminTab,
    setActiveAdminTab,
    products,
    orders,
    users,
    notice,
    paymentChannels,
    updateOrderStatus,
    refundOrder,
    deleteOrder,
    bulkCompletePendingOrders,
    updateNoticeText,
    updateUserWallet,
    adjustUserWallet,
    toggleUserAdminAccess,
    updateUserStatus,
    addNewUser,
    updateUserProfile,
    deleteUser,
    addProductPackage,
    updateProductPackage,
    deleteProductPackage,
    quickUpdatePackagePrice,
    togglePackageAvailability,
    resetProductsToDefault,
    updatePaymentChannelDetails,
    setActiveReceipt,
    showToast,
    walletRequests = [],
    notifications = [],
    approveWalletRecharge,
    rejectWalletRecharge,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();

  const { currentUser, isAdmin, toggleAdminMode, loginWithEmail, logout, switchToCustomerAccount } = useAuth();

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin Notification Dropdown state
  const [showAdminNotifDropdown, setShowAdminNotifDropdown] = useState(false);

  // ---------------- RECHARGE MANAGEMENT STATES ---------------- //
  const [rechargeFilter, setRechargeFilter] = useState('all'); // all, pending, approved, rejected
  const [rechargeSearch, setRechargeSearch] = useState('');
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('ভুল ট্রানজেকশন আইডি (TrxID) বা টাকা পাওয়া যায়নি');

  // Gatekeeper states (when not admin)
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // ---------------- USER MANAGEMENT STATES ---------------- //
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // all, admin, user
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ displayName: '', email: '', phone: '', role: 'user', initialBalance: 0 });
  
  // Wallet modal for a specific user
  const [walletModalUser, setWalletModalUser] = useState(null);
  const [walletAdjustmentMode, setWalletAdjustmentMode] = useState('add'); // 'add', 'deduct', 'set'
  const [walletAmountInput, setWalletAmountInput] = useState('');
  const [walletNoteInput, setWalletNoteInput] = useState('');

  // Inspect user's orders modal
  const [inspectedUser, setInspectedUser] = useState(null);

  // Edit user profile modal
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({ displayName: '', phone: '', email: '' });

  // ---------------- ORDER MANAGEMENT STATES ---------------- //
  const [orderFilter, setOrderFilter] = useState('all'); // all, pending, processing, completed, cancelled
  const [orderSearch, setOrderSearch] = useState('');

  // Admin Live Alarm & WhatsApp Modal States
  const [adminSoundAlarmEnabled, setAdminSoundAlarmEnabled] = useState(() => {
    try {
      return localStorage.getItem('topup_bd_admin_alarm') !== 'false';
    } catch {
      return true;
    }
  });
  const [activeNewOrderAlert, setActiveNewOrderAlert] = useState(null);
  const knownPendingOrderIdsRef = React.useRef(null);
  const knownPendingRechargeIdsRef = React.useRef(null);

  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState(null);
  const [whatsAppModalTemplate, setWhatsAppModalTemplate] = useState('delivery');
  const [whatsAppModalPhone, setWhatsAppModalPhone] = useState('');
  const [whatsAppModalMessage, setWhatsAppModalMessage] = useState('');

  // ---------------- PRODUCT & PACKAGES STATES ---------------- //
  const [selectedProductCategory, setSelectedProductCategory] = useState(products[0]?.id || 'ff-bd-uid');
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [newPkgData, setNewPkgData] = useState({ name: '', diamonds: '', price: '', tag: '', desc: '', popular: false });
  const [editingPkg, setEditingPkg] = useState(null);
  
  // Direct inline price & cost inputs buffer: { [pkgId]: currentInputValue }
  const [priceInputs, setPriceInputs] = useState({});
  const [costInputs, setCostInputs] = useState({});

  // ---------------- NOTICE & CHANNELS STATES ---------------- //
  const [noticeDraft, setNoticeDraft] = useState(notice);
  const [channelsDraft, setChannelsDraft] = useState(paymentChannels);

  useEffect(() => {
    setChannelsDraft(paymentChannels);
  }, [paymentChannels]);

  useEffect(() => {
    setNoticeDraft(notice);
  }, [notice]);

  // ---------------- REPORTS FILTER ---------------- //
  const [reportDateRange, setReportDateRange] = useState('today'); // today, yesterday, week, all

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

  // Filtered orders for Analytics
  const analyticsOrders = useMemo(() => {
    if (reportDateRange === 'today') return orders.filter(o => isDateToday(o.createdAt));
    if (reportDateRange === 'yesterday') return orders.filter(o => isDateYesterday(o.createdAt));
    if (reportDateRange === 'week') return orders.filter(o => isDateWithinDays(o.createdAt, 7));
    return orders;
  }, [orders, reportDateRange]);

  // Helper order profit calculations
  const getOrderCost = (order) => {
    if (order.costPrice !== undefined && order.costPrice !== null) return Number(order.costPrice);
    return Math.round(Number(order.amount || 0) * 0.9);
  };

  const getOrderProfit = (order) => {
    if (order.profit !== undefined && order.profit !== null) return Number(order.profit);
    return Math.max(0, Number(order.amount || 0) - getOrderCost(order));
  };

  // Key metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const todayOrders = orders.filter(o => isDateToday(o.createdAt));
  const todayRevenue = todayOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
  const totalUserWallets = users.reduce((sum, u) => sum + (u.balance || 0), 0);

  // Profit Metrics
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const totalCompletedRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalCompletedCost = completedOrders.reduce((sum, o) => sum + getOrderCost(o), 0);
  const totalNetProfit = Math.max(0, totalCompletedRevenue - totalCompletedCost);
  const profitMarginPercent = totalCompletedRevenue > 0 
    ? ((totalNetProfit / totalCompletedRevenue) * 100).toFixed(1) 
    : '0.0';

  const todayCompletedOrders = todayOrders.filter(o => o.status === 'Completed');
  const todayCompletedCost = todayCompletedOrders.reduce((sum, o) => sum + getOrderCost(o), 0);
  const todayNetProfit = Math.max(0, todayRevenue - todayCompletedCost);

  // Recharge metrics and notifications
  const pendingRecharges = (walletRequests || []).filter(r => r.status === 'Pending');
  const approvedRecharges = (walletRequests || []).filter(r => r.status === 'Approved');
  const rejectedRecharges = (walletRequests || []).filter(r => r.status === 'Rejected');
  const totalRechargeVolume = approvedRecharges.reduce((sum, r) => sum + (r.amount || 0), 0);

  const adminNotifs = (notifications || []).filter(n => n.targetRole === 'admin' || n.recipient === 'admin');
  const unreadAdminNotifsCount = adminNotifs.filter(n => !n.read).length;

  // Filtered recharges
  const filteredRecharges = (walletRequests || []).filter(r => {
    const q = rechargeSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      r.id?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.customerEmail?.toLowerCase().includes(q) ||
      r.senderNumber?.toLowerCase().includes(q) ||
      r.trxId?.toLowerCase().includes(q);
    const matchesStatus = rechargeFilter === 'all' || r.status.toLowerCase() === rechargeFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Duplicate TrxID Detector across all orders and wallet recharge requests
  const duplicateTrxMap = useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      const trx = (o.trxId || '').trim().toUpperCase();
      if (trx) map[trx] = (map[trx] || 0) + 1;
    });
    (walletRequests || []).forEach(r => {
      const trx = (r.trxId || '').trim().toUpperCase();
      if (trx) map[trx] = (map[trx] || 0) + 1;
    });
    return map;
  }, [orders, walletRequests]);

  // Audio Alarm & Alert Banner on New Pending Order
  useEffect(() => {
    const currentPending = (orders || []).filter(o => o.status === 'Pending');
    const currentIds = new Set(currentPending.map(o => o.id));

    if (knownPendingOrderIdsRef.current === null) {
      knownPendingOrderIdsRef.current = currentIds;
    } else {
      const newOrders = currentPending.filter(o => !knownPendingOrderIdsRef.current.has(o.id));
      if (newOrders.length > 0) {
        if (adminSoundAlarmEnabled) {
          sounds.playNewOrderAlarm();
        }
        setActiveNewOrderAlert({
          type: 'order',
          count: newOrders.length,
          item: newOrders[0],
          timestamp: Date.now()
        });
      }
      knownPendingOrderIdsRef.current = currentIds;
    }
  }, [orders, adminSoundAlarmEnabled]);

  // Audio Alarm on New Wallet Recharge Request
  useEffect(() => {
    const currentPending = (walletRequests || []).filter(r => r.status === 'Pending');
    const currentIds = new Set(currentPending.map(r => r.id));

    if (knownPendingRechargeIdsRef.current === null) {
      knownPendingRechargeIdsRef.current = currentIds;
    } else {
      const newReqs = currentPending.filter(r => !knownPendingRechargeIdsRef.current.has(r.id));
      if (newReqs.length > 0) {
        if (adminSoundAlarmEnabled) {
          sounds.playNewOrderAlarm();
        }
        setActiveNewOrderAlert({
          type: 'recharge',
          count: newReqs.length,
          item: newReqs[0],
          timestamp: Date.now()
        });
      }
      knownPendingRechargeIdsRef.current = currentIds;
    }
  }, [walletRequests, adminSoundAlarmEnabled]);

  const toggleAdminSoundAlarm = () => {
    setAdminSoundAlarmEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('topup_bd_admin_alarm', next ? 'true' : 'false');
      } catch {}
      if (next) sounds.playNewOrderAlarm();
      showToast(next ? '🔊 অর্ডার সাউন্ড অ্যালার্ম চালু করা হয়েছে' : '🔇 অর্ডার সাউন্ড অ্যালার্ম বন্ধ করা হয়েছে', next ? 'success' : 'info');
      return next;
    });
  };

  // Copy helper
  const handleCopy = (text) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    showToast(`কপি করা হয়েছে: ${text}`, 'success');
  };

  // Copy UID & 1-Click Launch Garena TopUp Portal
  const handleCopyUidAndOpenGarena = (uid, e) => {
    e?.stopPropagation?.();
    sounds.playCoin();
    navigator.clipboard.writeText(uid);
    showToast(`UID ${uid} কপি হয়েছে! গ্যারিনা শপ ওপেন হচ্ছে...`, 'success');
    window.open('https://shop2game.com/app', '_blank');
  };

  const handleCopyUidAndOpenUnipin = (uid, e) => {
    e?.stopPropagation?.();
    sounds.playCoin();
    navigator.clipboard.writeText(uid);
    showToast(`UID ${uid} কপি হয়েছে! UniPin ওপেন হচ্ছে...`, 'success');
    window.open('https://www.unipin.com/bd/garena-free-fire', '_blank');
  };

  // Build WhatsApp template messages
  const getWhatsAppTemplateText = (order, templateKey) => {
    if (!order) return '';
    if (templateKey === 'delivery') {
      return `আসসালামু আলাইকুম ${order.customerName || 'ভাই'}! 🎉\nTopUp BD থেকে আপনার ${order.packageName || 'ডায়মন্ড'} সফলভাবে গেম অ্যাকাউন্টে পাঠিয়ে দেওয়া হয়েছে।\n\n📌 অর্ডার আইডি: #${order.id}\n🎮 প্লেয়ার UID: ${order.uid}\n💎 প্যাকেজ: ${order.packageName}\n\nআপনার ফ্রি ফায়ার গেম ওপেন করে ডায়মন্ড চেক করে নিন। আমাদের সাথে থাকার জন্য ধন্যবাদ! ❤️`;
    }
    if (templateKey === 'invalid_uid') {
      return `আসসালামু আলাইকুম ${order.customerName || 'ভাই'}! ⚠️\nTopUp BD-তে দেওয়া আপনার ফ্রি ফায়ার UID (${order.uid}) সঠিক নয় অথবা প্লেয়ার খুঁজে পাওয়া যাচ্ছে না।\nঅনুগ্রহ করে আপনার সঠিক Player UID দিন যাতে আমরা দ্রুত ডায়মন্ড পাঠিয়ে দিতে পারি। ধন্যবাদ!`;
    }
    if (templateKey === 'trx_issue') {
      return `আসসালামু আলাইকুম ${order.customerName || 'ভাই'}! ⚠️\nআপনার অর্ডার #${order.id} এর দেওয়া TrxID (${order.trxId || 'N/A'}) আমাদের ব্যাংকে পাওয়া যায়নি।\nঅনুগ্রহ করে আপনার পেমেন্টের সঠিক TrxID বা বিকাশ/নগদের কনফার্মেশন স্ক্রিনশট পাঠিয়ে সহায়তা করুন। ধন্যবাদ!`;
    }
    return '';
  };

  const handleOpenWhatsAppModal = (order) => {
    sounds.playClick();
    const phone = (order.senderNumber || order.customerPhone || '').replace(/\D/g, '').replace(/^880/, '').replace(/^0/, '');
    setWhatsAppModalOrder(order);
    setWhatsAppModalTemplate('delivery');
    setWhatsAppModalPhone(phone);
    setWhatsAppModalMessage(getWhatsAppTemplateText(order, 'delivery'));
  };

  const handleChangeWhatsAppTemplate = (templateKey) => {
    sounds.playClick();
    setWhatsAppModalTemplate(templateKey);
    setWhatsAppModalMessage(getWhatsAppTemplateText(whatsAppModalOrder, templateKey));
  };

  // Direct Inline Price & Cost Save
  const handleSaveInlinePrice = (productId, pkg) => {
    const inputVal = priceInputs[pkg.id] !== undefined ? priceInputs[pkg.id] : pkg.price;
    const inputCost = costInputs[pkg.id] !== undefined 
      ? costInputs[pkg.id] 
      : (pkg.costPrice !== undefined ? pkg.costPrice : Math.round(pkg.price * 0.9));
    quickUpdatePackagePrice(productId, pkg.id, inputVal, inputCost);
  };

  // ---------------- GATEKEEPER UNLOCK ---------------- //
  if (!isAdmin) {
    const handlePinSubmit = (e) => {
      e.preventDefault();
      if (toggleAdminMode(pinInput)) {
        showToast('অ্যাডমিন ড্যাশবোর্ডে স্বাগতম! 👑', 'success');
      } else {
        setPinError('ভুল পিন দিয়েছেন! সঠিক পিন: 7788');
      }
    };

    const handleOneClickSuperAdmin = () => {
      toggleAdminMode('7788');
      showToast('সুপার অ্যাডমিন মোড সক্রিয় হয়েছে! 👑', 'success');
    };

    return (
      <div className="admin-gatekeeper-wrap">
        <div className="admin-gatekeeper-card">
          <div className="admin-gatekeeper-icon">
            <ShieldCheck size={36} />
          </div>
          <h1 className="admin-gatekeeper-title">অ্যাডমিন কন্ট্রোল সেন্টার</h1>
          <p className="admin-gatekeeper-sub">
            এই পৃষ্ঠা শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত। অনুগ্রহ করে ৪-ডিজিট পিন দিয়ে আনলক করুন।
          </p>

          <form onSubmit={handlePinSubmit} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <input 
                type="password"
                maxLength={6}
                placeholder="অ্যাডমিন PIN দিন (ডিফল্ট: 7788)"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                className="admin-form-input"
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: 800 }}
                autoFocus
              />
              {pinError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{pinError}</div>}
            </div>
            <button 
              type="submit" 
              className="btn-admin-action primary" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px', borderRadius: '10px' }}
            >
              <KeyRound size={16} /> আনলক করুন
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: '#64748b', fontSize: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span>অথবা দ্রুত ১-ক্লিক অ্যাডমিন প্রবেশ</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <button 
            type="button"
            onClick={handleOneClickSuperAdmin}
            className="btn-admin-action"
            style={{ 
              width: '100%', 
              padding: '11px', 
              justifyContent: 'center', 
              background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2), rgba(121, 40, 202, 0.2))',
              border: '1px solid rgba(255, 0, 127, 0.4)',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}
          >
            <Crown size={16} color="#ff007f" /> ১-ক্লিক সুপার অ্যাডমিন ড্যাশবোর্ড প্রবেশ
          </button>

          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="btn-admin-action"
            style={{ width: '100%', justifyContent: 'center', background: 'transparent', color: '#94a3b8' }}
          >
            <ArrowLeft size={14} /> সাধারণ গ্রাহক ওয়েবসাইটে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  // ---------------- FILTERED USERS ---------------- //
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.uid?.toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || 
      (userRoleFilter === 'admin' ? u.role === 'admin' : u.role !== 'admin');
    return matchesSearch && matchesRole;
  });

  // ---------------- FILTERED ORDERS ---------------- //
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      o.id?.toLowerCase().includes(q) ||
      o.uid?.toLowerCase().includes(q) ||
      o.playerNickname?.toLowerCase().includes(q) ||
      o.trxId?.toLowerCase().includes(q) ||
      o.senderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q);
    const matchesStatus = orderFilter === 'all' || o.status.toLowerCase() === orderFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // ---------------- WALLET MODAL HANDLER ---------------- //
  const handleApplyWalletChange = (e) => {
    e.preventDefault();
    if (!walletModalUser) return;
    const amount = parseFloat(walletAmountInput);
    if (isNaN(amount) || amount <= 0) {
      showToast('সঠিক টাকার পরিমাণ দিন', 'error');
      return;
    }

    if (walletAdjustmentMode === 'set') {
      updateUserWallet(walletModalUser.uid, amount, walletNoteInput);
    } else if (walletAdjustmentMode === 'add') {
      adjustUserWallet(walletModalUser.uid, amount, walletNoteInput);
    } else if (walletAdjustmentMode === 'deduct') {
      adjustUserWallet(walletModalUser.uid, -amount, walletNoteInput);
    }

    setWalletModalUser(null);
    setWalletAmountInput('');
    setWalletNoteInput('');
  };

  // ---------------- ADD USER HANDLER ---------------- //
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserData.displayName && !newUserData.phone) {
      showToast('ইউজারের নাম অথবা ফোন নম্বর দিন', 'error');
      return;
    }
    addNewUser(newUserData);
    setIsAddUserModalOpen(false);
    setNewUserData({ displayName: '', email: '', phone: '', role: 'user', initialBalance: 0 });
  };

  // ---------------- EDIT USER PROFILE HANDLER ---------------- //
  const handleSaveUserProfile = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserProfile(editingUser.uid, editUserData);
    setEditingUser(null);
  };

  // ---------------- PACKAGE HANDLERS ---------------- //
  const handleCreatePackage = (e) => {
    e.preventDefault();
    if (!newPkgData.name || !newPkgData.price) {
      showToast('প্যাকেজের নাম ও মূল্য আবশ্যক', 'error');
      return;
    }
    const sellPrice = parseFloat(newPkgData.price) || 0;
    const cost = newPkgData.costPrice !== undefined && newPkgData.costPrice !== '' && !isNaN(parseFloat(newPkgData.costPrice))
      ? parseFloat(newPkgData.costPrice)
      : Math.round(sellPrice * 0.9);

    addProductPackage(selectedProductCategory, {
      ...newPkgData,
      price: sellPrice,
      costPrice: cost
    });
    setIsAddPackageModalOpen(false);
    setNewPkgData({ name: '', diamonds: '', price: '', costPrice: '', tag: '', desc: '', popular: false });
  };

  const handleUpdatePackageSubmit = (e) => {
    e.preventDefault();
    if (!editingPkg) return;
    const sellPrice = parseFloat(editingPkg.price) || 0;
    const cost = editingPkg.costPrice !== undefined && editingPkg.costPrice !== '' && !isNaN(parseFloat(editingPkg.costPrice))
      ? parseFloat(editingPkg.costPrice)
      : Math.round(sellPrice * 0.9);

    updateProductPackage(selectedProductCategory, editingPkg.id, {
      name: editingPkg.name,
      diamonds: parseInt(editingPkg.diamonds) || 0,
      price: sellPrice,
      costPrice: cost,
      tag: editingPkg.tag,
      popular: editingPkg.popular
    });
    setEditingPkg(null);
  };

  // Active product details
  const currentProduct = products.find(p => p.id === selectedProductCategory) || products[0];

  return (
    <div className="admin-layout-root">
      
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <div className="admin-brand" onClick={() => navigate('/')}>
            <div className="admin-brand-icon">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <div className="admin-brand-title">
                TOPUP BD <span className="admin-brand-badge">ADMIN</span>
              </div>
              <div className="admin-brand-sub">সহজ অ্যাডমিন কন্ট্রোল</div>
            </div>
          </div>
          {mobileMenuOpen && (
            <button 
              className="btn-admin-action" 
              style={{ padding: '6px' }} 
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="admin-sidebar-nav">
          <div className="admin-nav-category">মূল কন্ট্রোল সেকশন</div>
          
          {/* DIAMONDS & PACKAGES - Top Priority as requested! */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'products' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('products');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <Package size={18} color={activeAdminTab === 'products' ? '#00f0ff' : '#cbd5e1'} />
              <span>💎 ডায়মন্ডের দাম ও প্যাকেজ</span>
            </div>
            <span className="admin-nav-badge count">{currentProduct?.packages?.length || 0}</span>
          </button>

          {/* USERS MANAGEMENT */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('users');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <Users size={18} color={activeAdminTab === 'users' ? '#00f0ff' : '#cbd5e1'} />
              <span>👥 গ্রাহক ও ব্যালেন্স রিচার্জ</span>
            </div>
            <span className="admin-nav-badge count">{users.length}</span>
          </button>

          {/* ORDERS MANAGEMENT */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('orders');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <ShoppingBag size={18} color={activeAdminTab === 'orders' ? '#00f0ff' : '#cbd5e1'} />
              <span>📦 টপ-আপ অর্ডারসমূহ</span>
            </div>
            {pendingOrders.length > 0 && (
              <span className="admin-nav-badge pending">{pendingOrders.length}</span>
            )}
          </button>

          {/* WALLET RECHARGE REQUESTS */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'recharges' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('recharges');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <Wallet size={18} color={activeAdminTab === 'recharges' ? '#00f0ff' : '#cbd5e1'} />
              <span>💰 রিচার্জ রিকোয়েস্ট</span>
            </div>
            {pendingRecharges.length > 0 ? (
              <span className="admin-nav-badge pending" style={{ background: '#f59e0b', color: '#000', fontWeight: 900 }}>
                {pendingRecharges.length}টি পেন্ডিং
              </span>
            ) : (
              <span className="admin-nav-badge count">{walletRequests.length}</span>
            )}
          </button>

          <div className="admin-nav-category">পেমেন্ট ও বার্তা সেটিংস</div>

          {/* PAYMENT CHANNELS */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'payments' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('payments');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <CreditCard size={18} />
              <span>💳 বিকাশ/নগদ নাম্বার পরিবর্তন</span>
            </div>
          </button>

          {/* NOTICE & MARQUEE */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'notice' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('notice');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <Megaphone size={18} />
              <span>📢 ওয়েবসাইটের নোটিশ পরিবর্তন</span>
            </div>
          </button>

          <div className="admin-nav-category">রিপোর্ট ও ওভারভিউ</div>

          {/* OVERVIEW */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('overview');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <LayoutDashboard size={18} />
              <span>📊 ড্যাশবোর্ড ওভারভিউ</span>
            </div>
          </button>

          {/* REPORTS */}
          <button 
            className={`admin-nav-btn ${activeAdminTab === 'reports' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              setActiveAdminTab('reports');
              setMobileMenuOpen(false);
            }}
          >
            <div className="admin-nav-btn-content">
              <FileText size={18} />
              <span>📄 বিক্রয় হিসাব ও প্রিন্ট</span>
            </div>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <button 
            className="btn-admin-action"
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '10px', 
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00f0ff',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '10px'
            }}
            onClick={() => {
              switchToCustomerAccount();
              navigate('/');
              showToast('গ্রাহক একাউন্টে স্যুইচ হয়েছে! এখন কেনাকাটা করতে পারবেন।', 'success');
            }}
            title="গ্রাহক মোডে স্যুইচ করে কেনাকাটা করুন"
          >
            <Users size={14} />
            <span>🎮 গ্রাহক একাউন্টে যান (পারচেজ করতে)</span>
          </button>

          <button 
            className="admin-view-store-btn"
            onClick={() => navigate('/')}
            title="গ্রাহক ওয়েবসাইট ভিউ করুন"
          >
            <ExternalLink size={15} />
            <span>গ্রাহক ওয়েবসাইটে ফিরে যান</span>
          </button>

          <div className="admin-user-pill">
            <div className="admin-user-info">
              <img 
                src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} 
                alt="Admin" 
                className="admin-user-avatar" 
              />
              <div>
                <div className="admin-user-name">{currentUser?.displayName || 'Super Admin'}</div>
                <div className="admin-user-role">👑 সুপার অ্যাডমিন</div>
              </div>
            </div>
            <button 
              className="btn-admin-action danger" 
              style={{ padding: '6px', borderRadius: '6px' }}
              onClick={logout}
              title="লগআউট"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
      <div className="admin-main-wrap">
        
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button 
              className="admin-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="মেনু খুলুন"
            >
              <Menu size={20} />
            </button>

            <h1 className="admin-page-title">
              {activeAdminTab === 'products' && '💎 ডায়মন্ডের দাম ও প্যাকেজ কন্ট্রোল'}
              {activeAdminTab === 'users' && '👥 গ্রাহক তালিকা ও ব্যালেন্স রিচার্জ'}
              {activeAdminTab === 'orders' && '📦 অর্ডার ও ডেলিভারি সেন্টার'}
              {activeAdminTab === 'recharges' && '💰 ওয়ালেট রিচার্জ রিকোয়েস্ট যাচাই ও অনুমোদন'}
              {activeAdminTab === 'payments' && '💳 বিকাশ/নগদ নাম্বার ও সেটিংস'}
              {activeAdminTab === 'notice' && '📢 লাইভ নোটিশ ও এনাউন্সমেন্ট'}
              {activeAdminTab === 'overview' && '📊 ড্যাশবোর্ড ওভারভিউ ও হিসাব'}
              {activeAdminTab === 'reports' && '📄 বিক্রয় হিসাব ও রিপোর্ট প্রিন্ট'}
            </h1>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-live-badge">
              <div className="admin-live-dot" />
              <span>লাইভ সিস্টেম সক্রিয়</span>
            </div>

            {/* Admin Notification Bell with Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className="btn-admin-action"
                onClick={() => {
                  sounds.playClick();
                  setShowAdminNotifDropdown(prev => !prev);
                }}
                style={{ 
                  position: 'relative', 
                  padding: '7px 12px', 
                  background: showAdminNotifDropdown ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: unreadAdminNotifsCount > 0 ? '1px solid rgba(255, 0, 127, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
                title="অ্যাডমিন নোটিফিকেশন"
              >
                <Bell size={16} color={unreadAdminNotifsCount > 0 ? '#ff007f' : '#00f0ff'} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>নোটিফিকেশন</span>
                {unreadAdminNotifsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ff007f',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 900,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 10px rgba(255, 0, 127, 0.9)'
                  }}>
                    {unreadAdminNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showAdminNotifDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '360px',
                  maxWidth: '92vw',
                  background: '#0d1322',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '14px',
                  boxShadow: '0 20px 45px rgba(0,0,0,0.85), 0 0 25px rgba(0, 240, 255, 0.15)',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  {/* Dropdown Header */}
                  <div style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid rgba(255,255,255,0.08)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'rgba(0, 240, 255, 0.05)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Bell size={15} color="#00f0ff" />
                      <span>অ্যাডমিন নোটিফিকেশন</span>
                      <span style={{ 
                        background: 'rgba(0, 240, 255, 0.2)', 
                        color: '#00f0ff', 
                        fontSize: '11px', 
                        padding: '1px 7px', 
                        borderRadius: '999px', 
                        fontWeight: 800 
                      }}>
                        {adminNotifs.length}
                      </span>
                    </div>

                    {unreadAdminNotifsCount > 0 && (
                      <button 
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          markAllNotificationsAsRead('admin');
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#00f0ff', 
                          fontSize: '11px', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontWeight: 700 
                        }}
                      >
                        <CheckCheck size={13} /> সব পঠিত
                      </button>
                    )}
                  </div>

                  {/* Dropdown list */}
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {adminNotifs.length === 0 ? (
                      <div style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                        কোনো নতুন অ্যাডমিন নোটিফিকেশন নেই
                      </div>
                    ) : (
                      adminNotifs.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => {
                            sounds.playClick();
                            markNotificationAsRead(n.id);
                            if (n.type === 'recharge_pending' || n.type === 'wallet_request') {
                              setActiveAdminTab('recharges');
                              setShowAdminNotifDropdown(false);
                            } else if (n.type === 'order' || n.type === 'order_pending') {
                              setActiveAdminTab('orders');
                              setShowAdminNotifDropdown(false);
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: n.read ? 'transparent' : 'rgba(0, 240, 255, 0.05)',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ fontWeight: n.read ? 600 : 800, fontSize: '13px', color: n.read ? '#cbd5e1' : '#fff' }}>
                              {n.title}
                            </div>
                            {!n.read && (
                              <div style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: '#ff007f', 
                                marginTop: '4px', 
                                flexShrink: 0,
                                boxShadow: '0 0 6px #ff007f'
                              }} />
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                            {new Date(n.time || n.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sound Alarm Toggle Button */}
            <button 
              type="button"
              className="btn-admin-action"
              onClick={toggleAdminSoundAlarm}
              style={{ 
                padding: '7px 12px', 
                background: adminSoundAlarmEnabled ? 'rgba(0, 240, 255, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: adminSoundAlarmEnabled ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                color: adminSoundAlarmEnabled ? '#00f0ff' : '#f87171'
              }}
              title={adminSoundAlarmEnabled ? 'নতুন অর্ডারে অডিও অ্যালার্ম চালু আছে (ক্লিক করে বন্ধ করুন)' : 'অডিও অ্যালার্ম বন্ধ আছে (ক্লিক করে চালু করুন)'}
            >
              {adminSoundAlarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                {adminSoundAlarmEnabled ? 'অ্যালার্ম অন' : 'অ্যালার্ম অফ'}
              </span>
            </button>

            <button 
              className="btn-admin-action primary"
              onClick={() => navigate('/')}
              style={{ fontSize: '12px' }}
            >
              <ArrowLeft size={14} /> লাইভ স্টোর
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="admin-page-content">

          {/* Active New Order / Recharge High-Visibility Notification Banner */}
          {activeNewOrderAlert && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(255, 0, 119, 0.25) 0%, rgba(255, 110, 0, 0.25) 100%)',
              border: '1px solid #ff0077',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 0 25px rgba(255, 0, 119, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🚨</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '14.5px' }}>
                    {activeNewOrderAlert.type === 'order' 
                      ? `নতুন ${activeNewOrderAlert.count}টি ডায়মন্ড টপ-আপ অর্ডার এসেছে!` 
                      : `নতুন ${activeNewOrderAlert.count}টি ওয়ালেট রিচার্জ রিকোয়েস্ট এসেছে!`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    {activeNewOrderAlert.type === 'order'
                      ? `অর্ডার #${activeNewOrderAlert.item?.id} • প্যাকেজ: ${activeNewOrderAlert.item?.packageName} • UID: ${activeNewOrderAlert.item?.uid}`
                      : `TrxID: ${activeNewOrderAlert.item?.trxId} • পরিমাণ: ৳${activeNewOrderAlert.item?.amount}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveAdminTab(activeNewOrderAlert.type === 'order' ? 'orders' : 'recharges');
                    setActiveNewOrderAlert(null);
                  }}
                  className="btn-admin-action primary"
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 800 }}
                >
                  <Zap size={14} /> এখনই প্রসেস করুন
                </button>
                <button
                  onClick={() => setActiveNewOrderAlert(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                  title="বন্ধ করুন"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- TOP QUICK JUMP BAR ---------------- */}
          {/* This allows anyone to jump directly to any tab easily without getting confused */}
          <div className="admin-quick-tabs-container">
            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'products' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('products'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff' }}>
                💎
              </div>
              <div>
                <div className="admin-quick-tab-title">ডায়মন্ডের দাম</div>
                <div className="admin-quick-tab-sub">কোন ডায়মন্ড কত টাকা</div>
              </div>
            </button>

            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'users' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('users'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(255, 0, 119, 0.15)', color: '#ff0077' }}>
                <Users size={18} />
              </div>
              <div>
                <div className="admin-quick-tab-title">ইউজার ও ওয়ালেট</div>
                <div className="admin-quick-tab-sub">টাকা রিচার্জ ও নিয়ন্ত্রণ</div>
              </div>
            </button>

            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'orders' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('orders'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="admin-quick-tab-title">অর্ডারসমূহ ({orders.length})</div>
                <div className="admin-quick-tab-sub">{pendingOrders.length} পেন্ডিং</div>
              </div>
            </button>

            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'recharges' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('recharges'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Wallet size={18} />
              </div>
              <div>
                <div className="admin-quick-tab-title">রিচার্জ রিকোয়েস্ট ({walletRequests.length})</div>
                <div className="admin-quick-tab-sub" style={{ color: pendingRecharges.length > 0 ? '#f59e0b' : '#94a3b8', fontWeight: pendingRecharges.length > 0 ? 800 : 400 }}>
                  {pendingRecharges.length > 0 ? `⚠️ ${pendingRecharges.length}টি পেন্ডিং যাচাই` : 'সব ক্লিয়ার'}
                </div>
              </div>
            </button>

            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'payments' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('payments'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(6, 214, 160, 0.15)', color: '#06d6a0' }}>
                <CreditCard size={18} />
              </div>
              <div>
                <div className="admin-quick-tab-title">পেমেন্ট নাম্বার</div>
                <div className="admin-quick-tab-sub">বিকাশ/নগদ নাম্বার</div>
              </div>
            </button>

            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'notice' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('notice'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Megaphone size={18} />
              </div>
              <div>
                <div className="admin-quick-tab-title">লাইভ নোটিশ</div>
                <div className="admin-quick-tab-sub">মারকুই বার্তা</div>
              </div>
            </button>

            <button 
              className={`admin-quick-tab-card ${activeAdminTab === 'overview' ? 'active' : ''}`}
              onClick={() => { sounds.playClick(); setActiveAdminTab('overview'); }}
            >
              <div className="admin-quick-tab-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <LayoutDashboard size={18} />
              </div>
              <div>
                <div className="admin-quick-tab-title">হিসাব ওভারভিউ</div>
                <div className="admin-quick-tab-sub">আজকের মোট বিক্রয়</div>
              </div>
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB: PRODUCTS & DIAMOND PACKAGES (FULL CONTROL OF PRICES)      */}
          {/* ============================================================== */}
          {activeAdminTab === 'products' && (
            <div>
              {/* Helpful Guide Card */}
              <div className="admin-guide-card">
                <div className="admin-guide-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div className="admin-guide-title">💡 ডায়মন্ডের দাম কিভাবে পরিবর্তন করবেন?</div>
                  <div className="admin-guide-text">
                    নিচের তালিকায় যেকোনো ডায়মন্ডের দামের বক্সে <b>সরাসরি নতুন সংখ্যা লিখে পাশের 'সেভ' বাটনে চাপুন</b>। পুরো ওয়েবসাইটে সাথে সাথে নতুন দাম চালু হয়ে যাবে। এছাড়া নতুন অফার যোগ করতে চাইলে উপরে <b>'+ নতুন প্যাকেজ যোগ করুন'</b> বাটনে চাপুন।
                  </div>
                </div>
              </div>

              {/* Product Category Selector & Actions */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={20} color="#00f0ff" />
                      <span>গেম সার্ভিস বেছে নিন:</span>
                    </h2>
                  </div>

                  <div className="admin-card-actions">
                    <button 
                      className="btn-admin-action primary"
                      style={{ padding: '9px 16px', fontSize: '13px' }}
                      onClick={() => setIsAddPackageModalOpen(true)}
                    >
                      <Plus size={16} /> + নতুন ডায়মন্ড প্যাকেজ যোগ করুন
                    </button>

                    <button 
                      className="btn-admin-action"
                      style={{ padding: '9px 14px', fontSize: '12px' }}
                      onClick={() => {
                        if (confirm('আপনি কি সকল ডায়মন্ড প্যাকেজ এবং মূল্য ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
                          resetProductsToDefault();
                        }
                      }}
                      title="ডিফল্ট মূল্যে রিসেট করুন"
                    >
                      <RefreshCw size={14} /> ডিফল্ট দাম রিসেট
                    </button>
                  </div>
                </div>

                {/* Categories Tabs */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {products.map(p => {
                    const isSelected = selectedProductCategory === p.id;
                    return (
                      <button 
                        key={p.id}
                        className={`admin-filter-pill ${isSelected ? 'active' : ''}`}
                        style={{ padding: '9px 18px', fontSize: '13.5px', fontWeight: 700 }}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedProductCategory(p.id);
                        }}
                      >
                        {p.title} ({p.packages?.length || 0})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diamond Packages Table with Instant Inline Price Changing */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <span>{currentProduct?.title} - মূল্য নিয়ন্ত্রণ টেবিল ({currentProduct?.packages?.length} টি প্যাকেজ)</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#06d6a0' }}>
                    ● দাম লিখে 'সেভ' চাপলে লাইভ ওয়েবসাইটে তাৎক্ষণিক আপডেট হবে
                  </span>
                </div>

                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ডায়মন্ড / নাম</th>
                        <th>পরিমাণ</th>
                        <th>বিক্রয় মূল্য (৳)</th>
                        <th>কেনা/পাইকারি খরচ (৳)</th>
                        <th>প্রতি অর্ডারে নিট লাভ</th>
                        <th>অফার ট্যাগ</th>
                        <th>স্টক স্ট্যাটাস</th>
                        <th>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProduct?.packages?.map(pkg => {
                        const currentInputPrice = priceInputs[pkg.id] !== undefined ? priceInputs[pkg.id] : pkg.price;
                        const currentInputCost = costInputs[pkg.id] !== undefined 
                          ? costInputs[pkg.id] 
                          : (pkg.costPrice !== undefined ? pkg.costPrice : Math.round(pkg.price * 0.9));
                        const isPriceChanged = (priceInputs[pkg.id] !== undefined && parseFloat(priceInputs[pkg.id]) !== pkg.price) ||
                                              (costInputs[pkg.id] !== undefined && parseFloat(costInputs[pkg.id]) !== (pkg.costPrice || 0));
                        const isOutOfStock = !!pkg.isOutOfStock;
                        const calculatedProfit = Math.round((parseFloat(currentInputPrice || 0) - parseFloat(currentInputCost || 0)) * 10) / 10;
                        const marginPercent = parseFloat(currentInputPrice || 0) > 0 
                          ? ((calculatedProfit / parseFloat(currentInputPrice || 0)) * 100).toFixed(0) 
                          : 0;

                        return (
                          <tr key={pkg.id} style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                            {/* Name */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '8px',
                                  background: 'rgba(0, 240, 255, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px'
                                }}>
                                  💎
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>
                                    {pkg.name}
                                  </div>
                                  {pkg.desc && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{pkg.desc}</div>}
                                </div>
                              </div>
                            </td>

                            {/* Diamond Amount */}
                            <td>
                              <span style={{ fontWeight: 800, color: '#00f0ff', fontSize: '14px' }}>
                                {pkg.diamonds > 0 ? `${pkg.diamonds} ডায়মন্ড` : 'স্পেশাল প্যাকেজ'}
                              </span>
                            </td>

                            {/* Inline Direct Selling Price Editor */}
                            <td>
                              <div className="admin-inline-price-wrap">
                                <span style={{ color: '#06d6a0', fontSize: '13px', fontWeight: 800 }}>৳</span>
                                <input 
                                  type="number"
                                  className="admin-inline-price-input"
                                  style={{ width: '70px', fontWeight: 800, color: '#06d6a0' }}
                                  value={currentInputPrice}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPriceInputs(prev => ({ ...prev, [pkg.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInlinePrice(selectedProductCategory, pkg);
                                    }
                                  }}
                                  title="বিক্রয় মূল্য লিখুন"
                                />
                              </div>
                            </td>

                            {/* Inline Direct Cost Price Editor */}
                            <td>
                              <div className="admin-inline-price-wrap">
                                <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 800 }}>৳</span>
                                <input 
                                  type="number"
                                  className="admin-inline-price-input"
                                  style={{ width: '70px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                                  value={currentInputCost}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCostInputs(prev => ({ ...prev, [pkg.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInlinePrice(selectedProductCategory, pkg);
                                    }
                                  }}
                                  title="আপনার পাইকারি কেনা খরচ লিখুন"
                                />
                                <button 
                                  className={`btn-admin-action ${isPriceChanged ? 'success' : 'primary'}`}
                                  style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800 }}
                                  onClick={() => handleSaveInlinePrice(selectedProductCategory, pkg)}
                                  title="মূল্য ও কেনা খরচ সেভ করুন"
                                >
                                  <Save size={12} /> {isPriceChanged ? 'সেভ' : 'সেভ'}
                                </button>
                              </div>
                            </td>

                            {/* Net Profit per order */}
                            <td>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 9px',
                                borderRadius: '12px',
                                fontSize: '12.5px',
                                fontWeight: 800,
                                background: calculatedProfit >= 0 ? 'rgba(6, 214, 160, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                                color: calculatedProfit >= 0 ? '#06d6a0' : '#ef4444',
                                border: `1px solid ${calculatedProfit >= 0 ? 'rgba(6, 214, 160, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`
                              }}>
                                <span>{calculatedProfit >= 0 ? `+৳${calculatedProfit}` : `-৳${Math.abs(calculatedProfit)}`}</span>
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>({marginPercent}%)</span>
                              </div>
                            </td>

                            {/* Tag / Badge */}
                            <td>
                              {pkg.tag ? (
                                <span style={{
                                  background: 'linear-gradient(135deg, #ff007f, #e2136e)',
                                  color: '#fff',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '12px'
                                }}>
                                  {pkg.tag}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '12px' }}>ট্যাগ নেই</span>
                              )}
                            </td>

                            {/* Stock Status */}
                            <td>
                              <button 
                                className={`btn-admin-action ${isOutOfStock ? 'danger' : 'success'}`}
                                style={{ padding: '4px 9px', fontSize: '11px' }}
                                onClick={() => togglePackageAvailability(selectedProductCategory, pkg.id)}
                                title="ক্লিক করে স্টক অন/অফ করুন"
                              >
                                <Power size={11} /> {isOutOfStock ? 'স্টক শেষ (অফ)' : 'চালু (সক্রিয়)'}
                              </button>
                            </td>

                            {/* Actions */}
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  className="btn-admin-action"
                                  onClick={() => {
                                    sounds.playClick();
                                    setEditingPkg({ ...pkg });
                                  }}
                                  title="সম্পূর্ণ তথ্য এডিট করুন"
                                >
                                  <Edit3 size={13} /> এডিট
                                </button>

                                <button 
                                  className="btn-admin-action danger"
                                  onClick={() => {
                                    if (confirm(`আপনি কি "${pkg.name}" প্যাকেজটি মুছে ফেলতে চান?`)) {
                                      deleteProductPackage(selectedProductCategory, pkg.id);
                                    }
                                  }}
                                  title="প্যাকেজ ডিলিট"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: USERS MANAGEMENT (গ্রাহক ও ব্যালেন্স রিচার্জ)              */}
          {/* ============================================================== */}
          {activeAdminTab === 'users' && (
            <div>
              {/* Guide Card */}
              <div className="admin-guide-card">
                <div className="admin-guide-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div className="admin-guide-title">💡 গ্রাহকের ওয়ালেটে টাকা কিভাবে রিচার্জ করবেন?</div>
                  <div className="admin-guide-text">
                    নিচের তালিকায় যে গ্রাহককে ব্যালেন্স দিতে চান, তার নামের পাশের <b>সবুজ 'রিচার্জ' বাটনে চাপুন</b>। এরপর কত টাকা যোগ করতে চান তা লিখে সেভ করলেই গ্রাহকের ব্যালেন্স তাৎক্ষণিকভাবে বেড়ে যাবে।
                  </div>
                </div>
              </div>

              {/* Users Header Toolbar */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={20} color="#00f0ff" />
                      <span>সকল গ্রাহক ও ইউজার তালিকা ({filteredUsers.length})</span>
                    </h2>
                  </div>

                  <div className="admin-card-actions">
                    <button 
                      className="btn-admin-action primary"
                      style={{ padding: '9px 16px', fontSize: '13px' }}
                      onClick={() => setIsAddUserModalOpen(true)}
                    >
                      <Plus size={16} /> নতুন ইউজার যোগ করুন
                    </button>
                  </div>
                </div>

                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="admin-search-input-wrap">
                    <Search size={16} className="admin-search-icon" />
                    <input 
                      type="text"
                      className="admin-search-input"
                      placeholder="নাম, ফোন, ইমেইল বা UID দিয়ে খুঁজুন..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>

                  <div className="admin-filter-pill-group">
                    <button 
                      className={`admin-filter-pill ${userRoleFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('all')}
                    >
                      সকল ({users.length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${userRoleFilter === 'user' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('user')}
                    >
                      🎮 সাধারণ গ্রাহক ({users.filter(u => u.role !== 'admin').length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${userRoleFilter === 'admin' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('admin')}
                    >
                      👑 অ্যাডমিন ({users.filter(u => u.role === 'admin').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="admin-card">
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ইউজার তথ্য</th>
                        <th>যোগাযোগ</th>
                        <th>রোল (পদবী)</th>
                        <th>ওয়ালেট ব্যালেন্স</th>
                        <th>অ্যাকাউন্ট স্ট্যাটাস</th>
                        <th>অ্যাকশন ও নিয়ন্ত্রণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            কোনো ইউজার খুঁজে পাওয়া যায়নি!
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => {
                          const userOrdersCount = orders.filter(o => o.userId === user.uid || o.senderNumber === user.phone).length;
                          return (
                            <tr key={user.uid}>
                              {/* Avatar & Display Name */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img 
                                    src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} 
                                    alt={user.displayName}
                                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(0, 240, 255, 0.4)' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>{user.displayName}</span>
                                      {user.role === 'admin' && <span style={{ fontSize: '11px' }}>👑</span>}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                      UID: <span style={{ fontFamily: 'monospace' }}>{user.uid}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Contact */}
                              <td>
                                <div style={{ fontSize: '13px', color: '#f1f5f9' }}>{user.phone || 'ফোন নেই'}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email || 'ইমেইল নেই'}</div>
                              </td>

                              {/* Role */}
                              <td>
                                <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                                  {user.role === 'admin' ? '👑 অ্যাডমিন' : '🎮 গ্রাহক'}
                                </span>
                              </td>

                              {/* Wallet Balance */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#06d6a0' }}>
                                    ৳{user.balance || 0}
                                  </span>
                                  <button 
                                    className="btn-admin-action primary"
                                    style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: 800 }}
                                    onClick={() => {
                                      sounds.playClick();
                                      setWalletModalUser(user);
                                      setWalletAdjustmentMode('add');
                                    }}
                                    title="ব্যালেন্স এডিট / যোগ করুন"
                                  >
                                    <Wallet size={12} /> রিচার্জ
                                  </button>
                                </div>
                              </td>

                              {/* Status */}
                              <td>
                                <span className={`status-badge ${user.status === 'blocked' ? 'cancelled' : 'completed'}`}>
                                  {user.status === 'blocked' ? '🚫 বন্ধ' : '✅ সক্রিয়'}
                                </span>
                              </td>

                              {/* Action Buttons */}
                              <td>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {/* View User Orders */}
                                  <button 
                                    className="btn-admin-action"
                                    onClick={() => {
                                      sounds.playClick();
                                      setInspectedUser(user);
                                    }}
                                    title="ইউজারের অর্ডার তালিকা দেখুন"
                                  >
                                    <ShoppingBag size={13} />
                                    <span>অর্ডার ({userOrdersCount})</span>
                                  </button>

                                  {/* Toggle Admin Role */}
                                  <button 
                                    className="btn-admin-action"
                                    onClick={() => toggleUserAdminAccess(user.uid)}
                                    title={user.role === 'admin' ? 'গ্রাহক করুন' : 'অ্যাডমিন বানান'}
                                    style={{ color: user.role === 'admin' ? '#ff007f' : '#f59e0b' }}
                                  >
                                    <Crown size={13} />
                                    <span>{user.role === 'admin' ? 'ডিমোট' : 'অ্যাডমিন'}</span>
                                  </button>

                                  {/* Edit Profile */}
                                  <button 
                                    className="btn-admin-action"
                                    onClick={() => {
                                      sounds.playClick();
                                      setEditingUser(user);
                                      setEditUserData({
                                        displayName: user.displayName || '',
                                        phone: user.phone || '',
                                        email: user.email || ''
                                      });
                                    }}
                                    title="ইউজার তথ্য এডিট"
                                  >
                                    <Edit3 size={13} />
                                  </button>

                                  {/* Toggle Ban */}
                                  <button 
                                    className={`btn-admin-action ${user.status === 'blocked' ? 'success' : 'danger'}`}
                                    onClick={() => updateUserStatus(user.uid, user.status === 'blocked' ? 'active' : 'blocked')}
                                    title={user.status === 'blocked' ? 'অ্যাকাউন্ট আনব্লক করুন' : 'অ্যাকাউন্ট ব্লক করুন'}
                                  >
                                    {user.status === 'blocked' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                  </button>

                                  {/* Delete user */}
                                  <button 
                                    className="btn-admin-action danger"
                                    onClick={() => {
                                      if (confirm(`আপনি কি নিশ্চিত "${user.displayName}" এর অ্যাকাউন্ট মুছে ফেলবেন?`)) {
                                        deleteUser(user.uid);
                                      }
                                    }}
                                    title="ইউজার মুছে ফেলুন"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: ORDERS MANAGEMENT                                         */}
          {/* ============================================================== */}
          {activeAdminTab === 'orders' && (
            <div>
              {/* Guide Card */}
              <div className="admin-guide-card">
                <div className="admin-guide-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div className="admin-guide-title">💡 অর্ডার কিভাবে ডেলিভারি করবেন?</div>
                  <div className="admin-guide-text">
                    গ্রাহকের দেওয়া <b>Player UID কপি</b> করে গেমে ডায়মন্ড পাঠিয়ে দিন। এরপর অর্ডারের পাশের সবুজ <b>'কমপ্লিট'</b> বাটনে চাপুন। চাইলে 'WhatsApp' বাটনে চাপ দিয়ে সরাসরি গ্রাহককে জানিয়ে দিতে পারেন।
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShoppingBag size={20} color="#00f0ff" />
                      <span>সকল টপ-আপ অর্ডার ({filteredOrders.length})</span>
                    </h2>
                  </div>

                  <div className="admin-card-actions">
                    <button 
                      className="btn-admin-action success"
                      style={{ padding: '8px 14px' }}
                      onClick={bulkCompletePendingOrders}
                    >
                      <CheckCircle2 size={15} /> সব পেন্ডিং অর্ডার একসাথে কমপ্লিট করুন
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="admin-search-input-wrap">
                    <Search size={16} className="admin-search-icon" />
                    <input 
                      type="text"
                      className="admin-search-input"
                      placeholder="অর্ডার আইডি, UID, ফোন, TrxID দিয়ে খুঁজুন..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <div className="admin-filter-pill-group">
                    <button 
                      className={`admin-filter-pill ${orderFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setOrderFilter('all')}
                    >
                      সকল ({orders.length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${orderFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setOrderFilter('pending')}
                    >
                      ⏳ পেন্ডিং ({orders.filter(o => o.status === 'Pending').length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${orderFilter === 'processing' ? 'active' : ''}`}
                      onClick={() => setOrderFilter('processing')}
                    >
                      ⚡ প্রসেসিং ({orders.filter(o => o.status === 'Processing').length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${orderFilter === 'completed' ? 'active' : ''}`}
                      onClick={() => setOrderFilter('completed')}
                    >
                      ✅ কমপ্লিট ({orders.filter(o => o.status === 'Completed').length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${orderFilter === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setOrderFilter('cancelled')}
                    >
                      ❌ বাতিল/রিফান্ড ({orders.filter(o => o.status === 'Cancelled').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="admin-card">
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>অর্ডার আইডি ও সময়</th>
                        <th>গ্রাহক ও প্লেয়ার তথ্য</th>
                        <th>প্যাকেজ ও ডায়মন্ড</th>
                        <th>পেমেন্ট ও TrxID</th>
                        <th>স্ট্যাটাস</th>
                        <th>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            কোনো অর্ডার পাওয়া যায়নি!
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id}>
                            {/* Order ID & Date */}
                            <td>
                              <div style={{ fontWeight: 800, color: '#00f0ff' }}>{order.id}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {new Date(order.createdAt).toLocaleDateString('bn-BD')} {new Date(order.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>

                            {/* Customer & Player UID */}
                            <td>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{order.customerName}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', margin: '4px 0' }}>
                                <span>UID: <b style={{ color: '#00f0ff', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{order.uid}</b></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', margin: '4px 0' }}>
                                <button 
                                  onClick={() => handleCopy(order.uid)}
                                  className="btn-admin-action primary"
                                  style={{ padding: '2px 7px', fontSize: '10.5px' }}
                                  title="শুধুমাত্র UID কপি করুন"
                                >
                                  <Copy size={11} /> কপি
                                </button>
                                <button 
                                  onClick={(e) => handleCopyUidAndOpenGarena(order.uid, e)}
                                  className="btn-admin-action"
                                  style={{ 
                                    padding: '2px 7px', 
                                    fontSize: '10.5px', 
                                    background: 'rgba(255, 0, 119, 0.15)', 
                                    border: '1px solid rgba(255, 0, 119, 0.45)', 
                                    color: '#ff2e93',
                                    fontWeight: 700
                                  }}
                                  title="UID কপি করে Shop2game (Garena TopUp) ওপেন করুন"
                                >
                                  <ExternalLink size={11} /> গ্যারিনা শপ
                                </button>
                                <button 
                                  onClick={(e) => handleCopyUidAndOpenUnipin(order.uid, e)}
                                  className="btn-admin-action"
                                  style={{ 
                                    padding: '2px 7px', 
                                    fontSize: '10.5px', 
                                    background: 'rgba(255, 174, 0, 0.15)', 
                                    border: '1px solid rgba(255, 174, 0, 0.45)', 
                                    color: '#ffae00',
                                    fontWeight: 700
                                  }}
                                  title="UID কপি করে UniPin BD ওপেন করুন"
                                >
                                  <ExternalLink size={11} /> UniPin
                                </button>
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {order.playerNickname || 'প্লেয়ার'} • {order.server || 'BD Server'}
                              </div>
                            </td>

                            {/* Package */}
                            <td>
                              <div style={{ fontWeight: 800, color: '#fff' }}>{order.packageName}</div>
                              <div style={{ fontSize: '11.5px', color: '#ff0077', fontWeight: 700 }}>
                                {order.diamonds ? `💎 ${order.diamonds} ডায়মন্ড` : order.productName}
                              </div>
                            </td>

                            {/* Payment */}
                            <td>
                              <div style={{ fontWeight: 900, fontSize: '15px', color: '#06d6a0' }}>৳{order.amount}</div>
                              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{order.method}</div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700 }}>
                                  লাভ: +৳{getOrderProfit(order)}
                                </span>
                              </div>
                              {order.trxId && (
                                <div style={{ marginTop: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#e2e8f0' }}>Trx: {order.trxId}</span>
                                    <button onClick={() => handleCopy(order.trxId)} style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer', padding: '1px' }} title="কপি করুন"><Copy size={11} /></button>
                                    <button onClick={() => setOrderSearch(order.trxId)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '1px', fontSize: '10px' }} title="এই TrxID দিয়ে সব অর্ডার সার্চ করুন">🔍</button>
                                  </div>
                                  {duplicateTrxMap[(order.trxId || '').trim().toUpperCase()] > 1 && (
                                    <div style={{
                                      marginTop: '3px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(239, 68, 68, 0.2)',
                                      border: '1px solid rgba(239, 68, 68, 0.5)',
                                      color: '#f87171',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <AlertCircle size={11} /> 🚨 ডুপ্লিকেট TrxID ({duplicateTrxMap[(order.trxId || '').trim().toUpperCase()]}টি অর্ডারে আছে)
                                    </div>
                                  )}
                                </div>
                              )}
                              {order.senderNumber && (
                                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>নম্বর: {order.senderNumber}</div>
                              )}
                            </td>

                            {/* Status */}
                            <td>
                              <span className={`status-badge ${order.status.toLowerCase()}`}>
                                {order.status === 'Completed' ? '✅ কমপ্লিট' :
                                 order.status === 'Processing' ? '⚡ প্রসেসিং' :
                                 order.status === 'Cancelled' ? '❌ বাতিল/রিফান্ড' : '⏳ পেন্ডিং'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {/* Complete */}
                                {order.status !== 'Completed' && (
                                  <button 
                                    className="btn-admin-action success"
                                    onClick={() => {
                                      sounds.playSuccess();
                                      updateOrderStatus(order.id, 'Completed');
                                    }}
                                    title="অর্ডার সম্পন্ন করুন"
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>কমপ্লিট</span>
                                  </button>
                                )}

                                {/* Processing */}
                                {order.status === 'Pending' && (
                                  <button 
                                    className="btn-admin-action primary"
                                    onClick={() => {
                                      sounds.playClick();
                                      updateOrderStatus(order.id, 'Processing');
                                    }}
                                    title="প্রসেসিং করুন"
                                  >
                                    <Clock size={13} />
                                    <span>প্রসেসিং</span>
                                  </button>
                                )}

                                {/* WhatsApp direct / customized template */}
                                <button 
                                  className="btn-admin-action whatsapp"
                                  onClick={() => handleOpenWhatsAppModal(order)}
                                  title="খেলোয়াড়কে WhatsApp এ জানান বা স্লিপ পাঠান"
                                >
                                  <MessageCircle size={13} />
                                  <span>WhatsApp</span>
                                </button>

                                {/* Refund / Cancel */}
                                {order.status !== 'Cancelled' && (
                                  <button 
                                    className="btn-admin-action danger"
                                    onClick={() => {
                                      if (confirm(`অর্ডার #${order.id} বাতিল করে গ্রাহকের ওয়ালেটে ৳${order.amount} টাকা ফেরত পাঠাতে চান?`)) {
                                        refundOrder(order.id);
                                      }
                                    }}
                                    title="বাতিল ও ওয়ালেটে রিফান্ড"
                                  >
                                    <RotateCcw size={13} />
                                    <span>রিফান্ড</span>
                                  </button>
                                )}

                                {/* Delete order */}
                                <button 
                                  className="btn-admin-action"
                                  onClick={() => {
                                    if (confirm(`অর্ডার #${order.id} মুছে ফেলতে চান?`)) {
                                      deleteOrder(order.id);
                                    }
                                  }}
                                  title="অর্ডার ডিলিট"
                                >
                                  <Trash2 size={13} />
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
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: WALLET RECHARGE REQUESTS (MANUAL VERIFY & APPROVE)        */}
          {/* ============================================================== */}
          {activeAdminTab === 'recharges' && (
            <div>
              {/* Guide Card */}
              <div className="admin-guide-card">
                <div className="admin-guide-icon">
                  <ShieldCheck size={20} color="#00f0ff" />
                </div>
                <div>
                  <div className="admin-guide-title">🛡️ ওয়ালেট রিচার্জ রিকোয়েস্ট যাচাই ও অনুমোদনের নিয়ম:</div>
                  <div className="admin-guide-text">
                    গ্রাহকরা ওয়ালেটে টাকা অ্যাড করার জন্য যে <b>TrxID ও প্রেরক মোবাইল নাম্বার</b> জমা দিয়েছেন তা নিচে তালিকাভুক্ত রয়েছে। 
                    আপনার বিকাশ/নগদ স্টেটমেন্টে টাকা জমা হয়েছে কিনা নিশ্চিত হয়ে <b>'অনুমোদন করুন'</b> বাটনে চাপুন। অনুমোদন করার সাথে সাথে ইউজারের একাউন্টে ব্যালেন্স যুক্ত হবে এবং তিনি নোটিফিকেশন পাবেন। ভুল বা ফেক তথ্য হলে <b>'বাতিল করুন'</b>।
                  </div>
                </div>
              </div>

              {/* Status Header Cards */}
              <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
                <div className="admin-stat-card" style={{ borderColor: pendingRecharges.length > 0 ? 'rgba(245, 158, 11, 0.4)' : '' }}>
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">পেন্ডিং যাচাই</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: pendingRecharges.length > 0 ? '#f59e0b' : '#fff' }}>
                    {pendingRecharges.length}টি
                  </div>
                  <div className="admin-stat-sub">
                    {pendingRecharges.length > 0 ? 'দ্রুত যাচাই করে অনুমোদন দিন' : 'সবগুলো যাচাই সম্পন্ন'}
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">অনুমোদিত রিচার্জ</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: '#10b981' }}>
                    {approvedRecharges.length}টি
                  </div>
                  <div className="admin-stat-sub">মোট যোগ হয়েছে ৳{totalRechargeVolume}</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">বাতিলকৃত রিকোয়েস্ট</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <XCircle size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: '#ef4444' }}>
                    {rejectedRecharges.length}টি
                  </div>
                  <div className="admin-stat-sub">অকার্যকর বা ফেক TrxID</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">মোট রিকোয়েস্ট সংখ্যা</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff' }}>
                      <Wallet size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value">{walletRequests.length}টি</div>
                  <div className="admin-stat-sub">সর্বমোট জমা হওয়া আবেদন</div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet size={20} color="#00f0ff" />
                      <span>গ্রাহকদের ওয়ালেট রিচার্জ আবেদনসমূহ ({filteredRecharges.length})</span>
                    </h2>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="admin-search-input-wrap">
                    <Search size={16} className="admin-search-icon" />
                    <input 
                      type="text"
                      className="admin-search-input"
                      placeholder="TrxID, ফোন নম্বর, ইউজারের নাম বা আইডি দিয়ে খুঁজুন..."
                      value={rechargeSearch}
                      onChange={(e) => setRechargeSearch(e.target.value)}
                    />
                  </div>

                  <div className="admin-filter-pill-group">
                    <button 
                      className={`admin-filter-pill ${rechargeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setRechargeFilter('all')}
                    >
                      সকল ({walletRequests.length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${rechargeFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setRechargeFilter('pending')}
                    >
                      ⏳ পেন্ডিং যাচাই ({pendingRecharges.length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${rechargeFilter === 'approved' ? 'active' : ''}`}
                      onClick={() => setRechargeFilter('approved')}
                    >
                      ✅ অনুমোদিত ({approvedRecharges.length})
                    </button>
                    <button 
                      className={`admin-filter-pill ${rechargeFilter === 'rejected' ? 'active' : ''}`}
                      onClick={() => setRechargeFilter('rejected')}
                    >
                      ❌ বাতিলকৃত ({rejectedRecharges.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Recharges Table */}
              <div className="admin-card">
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>রিকোয়েস্ট আইডি ও সময়</th>
                        <th>গ্রাহকের তথ্য</th>
                        <th>মাধ্যম ও প্রেরক নাম্বার</th>
                        <th>ট্রানজেকশন আইডি (TrxID)</th>
                        <th>পরিমাণ (টাকা)</th>
                        <th>বর্তমান অবস্থা</th>
                        <th style={{ textAlign: 'center' }}>অ্যাডমিন যাচাই অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecharges.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#cbd5e1' }}>কোনো রিচার্জ রিকোয়েস্ট পাওয়া যায়নি</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              গ্রাহক ওয়ালেটে টাকা রিচার্জের আবেদন পাঠালে এখানে সরাসরি প্রদর্শিত হবে
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRecharges.map(req => {
                          const isPending = req.status === 'Pending';
                          const isApproved = req.status === 'Approved';
                          const isRejected = req.status === 'Rejected';

                          return (
                            <tr key={req.id}>
                              {/* Request ID & Time */}
                              <td>
                                <div style={{ fontWeight: 800, color: '#00f0ff', fontFamily: 'monospace', fontSize: '13px' }}>
                                  #{req.id}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                                  {new Date(req.createdAt).toLocaleString('bn-BD', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              </td>

                              {/* Customer info */}
                              <td>
                                <div style={{ fontWeight: 800, color: '#fff', fontSize: '13.5px' }}>
                                  {req.customerName || 'গ্রাহক'}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                  {req.customerEmail || req.userId || 'N/A'}
                                </div>
                              </td>

                              {/* Method & Sender Number */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: req.method?.toLowerCase().includes('bkash') ? 'rgba(226, 19, 110, 0.2)' : 'rgba(247, 147, 30, 0.2)',
                                    color: req.method?.toLowerCase().includes('bkash') ? '#e2136e' : '#f7931e',
                                    border: `1px solid ${req.method?.toLowerCase().includes('bkash') ? 'rgba(226, 19, 110, 0.4)' : 'rgba(247, 147, 30, 0.4)'}`
                                  }}>
                                    {req.method || 'bKash'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                  <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontWeight: 600 }}>
                                    {req.senderNumber}
                                  </span>
                                  {req.senderNumber && (
                                    <button 
                                      className="btn-admin-action"
                                      style={{ padding: '2px 6px', fontSize: '10px' }}
                                      onClick={() => handleCopy(req.senderNumber)}
                                      title="প্রেরক নাম্বার কপি করুন"
                                    >
                                      <Copy size={11} />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* TrxID */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <code style={{
                                    background: 'rgba(0, 240, 255, 0.08)',
                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                    color: '#00f0ff',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px'
                                  }}>
                                    {req.trxId}
                                  </code>
                                  <button 
                                    className="btn-admin-action"
                                    style={{ padding: '3px 6px', fontSize: '11px' }}
                                    onClick={() => handleCopy(req.trxId)}
                                    title="TrxID কপি করুন"
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                              </td>

                              {/* Amount */}
                              <td>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>
                                  ৳{req.amount}
                                </div>
                              </td>

                              {/* Status badge */}
                              <td>
                                {isPending && (
                                  <span className="status-badge pending" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    ⏳ যাচাই বাকি (পেন্ডিং)
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="status-badge completed" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    ✅ অনুমোদিত
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="status-badge cancelled" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                    ❌ বাতিলকৃত
                                  </span>
                                )}
                                {req.rejectionReason && (
                                  <div style={{ fontSize: '10.5px', color: '#ef4444', marginTop: '3px', maxWidth: '140px' }}>
                                    {req.rejectionReason}
                                  </div>
                                )}
                              </td>

                              {/* Action buttons */}
                              <td>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  {isPending ? (
                                    <>
                                      <button 
                                        className="btn-admin-action success"
                                        style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 800 }}
                                        onClick={() => {
                                          if (confirm(`গ্রাহক ${req.customerName} এর ৳${req.amount} রিচার্জ রিকোয়েস্ট অনুমোদন করতে চান?\n\nইউজারের অ্যাকাউন্টে ৳${req.amount} যুক্ত হবে এবং তার কাছে নোটিফিকেশন যাবে।`)) {
                                            approveWalletRecharge(req.id);
                                          }
                                        }}
                                        title="টাকা পাওয়া গেছে - অনুমোদন করুন এবং ব্যালেন্স যোগ করুন"
                                      >
                                        <CheckCircle2 size={14} /> অনুমোদন (Approve)
                                      </button>

                                      <button 
                                        className="btn-admin-action danger"
                                        style={{ padding: '7px 12px', fontSize: '12px' }}
                                        onClick={() => {
                                          setRejectModalReq(req);
                                          setRejectionReason('ভুল ট্রানজেকশন আইডি (TrxID) বা টাকা পাওয়া যায়নি');
                                        }}
                                        title="টাকা পাওয়া যায়নি - বাতিল করুন"
                                      >
                                        <XCircle size={14} /> বাতিল (Reject)
                                      </button>
                                    </>
                                  ) : isApproved ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
                                      <CheckCircle2 size={15} /> ব্যালেন্স যোগ হয়েছে
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                                      <XCircle size={15} /> বাতিল হয়েছে
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: PAYMENT GATEWAYS (বিকাশ/নগদ নাম্বার পরিবর্তন)             */}
          {/* ============================================================== */}
          {activeAdminTab === 'payments' && (
            <div>
              {/* Guide Card */}
              <div className="admin-guide-card">
                <div className="admin-guide-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div className="admin-guide-title">💡 টাকা নেওয়ার বিকাশ ও নগদ নম্বর পরিবর্তন:</div>
                  <div className="admin-guide-text">
                    গ্রাহকরা যে নাম্বারে টাকা পাঠাবে তা নিচে সরাসরি পরিবর্তন করতে পারবেন। আপনার নম্বর লিখে <b>'আপডেট করুন'</b> বাটনে চাপুন।
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={20} color="#00f0ff" />
                      <span>পেমেন্ট গেটওয়ে ও মোবাইল ব্যাংকিং নম্বর</span>
                    </h2>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {Object.entries(channelsDraft).map(([key, channel]) => (
                    <div 
                      key={key}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: channel.color || '#e2136e',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '12px'
                          }}>
                            {channel.logo}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#fff' }}>{channel.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{channel.type}</div>
                          </div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">প্রাপক নাম্বার (যেটিতে টাকা আসবে):</label>
                        <input 
                          type="text" 
                          className="admin-form-input"
                          value={channel.number}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChannelsDraft(prev => ({
                              ...prev,
                              [key]: { ...prev[key], number: val }
                            }));
                          }}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">অ্যাকাউন্টের ধরন:</label>
                        <select 
                          className="admin-form-select"
                          value={channel.type}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChannelsDraft(prev => ({
                              ...prev,
                              [key]: { ...prev[key], type: val }
                            }));
                          }}
                        >
                          <option value="Send Money (Personal)">Send Money (Personal)</option>
                          <option value="Payment (Merchant)">Payment (Merchant)</option>
                          <option value="Cash In (Agent)">Cash In (Agent)</option>
                        </select>
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">পেমেন্ট নির্দেশনা টেক্সট:</label>
                        <textarea 
                          rows={2}
                          className="admin-form-input"
                          value={channel.instructions}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChannelsDraft(prev => ({
                              ...prev,
                              [key]: { ...prev[key], instructions: val }
                            }));
                          }}
                        />
                      </div>

                      <button 
                        className="btn-admin-action primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                        onClick={() => {
                          updatePaymentChannelDetails(key, channelsDraft[key]);
                        }}
                      >
                        <CheckCircle2 size={14} /> {channel.name} এর তথ্য সেভ করুন
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: NOTICE & ANNOUNCEMENT                                     */}
          {/* ============================================================== */}
          {activeAdminTab === 'notice' && (
            <div>
              <div className="admin-guide-card">
                <div className="admin-guide-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div className="admin-guide-title">💡 ওয়েবসাইটের ঘোষণা ও নোটিশ পরিবর্তন:</div>
                  <div className="admin-guide-text">
                    এই লেখাটি ওয়েবসাইটের একদম উপরে লাল-নীল ব্যানারে অনবরত স্ক্রোল হতে থাকবে। নতুন কোনো অফার বা নোটিশ থাকলে এখানে লিখে <b>'নোটিশ সেভ করুন'</b> চাপুন।
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Megaphone size={20} color="#00f0ff" />
                      <span>লাইভ নোটিশ ও এনাউন্সমেন্ট টেক্সট</span>
                    </h2>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">স্ক্রোলিং নোটিশ টেক্সট লিখুন:</label>
                  <textarea 
                    rows={4}
                    className="admin-form-input"
                    value={noticeDraft}
                    onChange={(e) => setNoticeDraft(e.target.value)}
                    placeholder="নোটিশ লিখুন..."
                  />
                </div>

                {/* Live Preview Box */}
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 800, marginBottom: '6px' }}>লাইভ প্রিভিউ (ওয়েবসাইটে যেমন দেখাবে):</div>
                  <div style={{ fontSize: '13px', color: '#fff' }}>{noticeDraft}</div>
                </div>

                <button 
                  className="btn-admin-action primary"
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                  onClick={() => updateNoticeText(noticeDraft)}
                >
                  <CheckCircle2 size={16} /> নোটিশ সেভ করুন
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: OVERVIEW & ANALYTICS                                      */}
          {/* ============================================================== */}
          {activeAdminTab === 'overview' && (
            <div>
              {/* Stat Cards */}
              <div className="admin-stats-grid">
                
                {/* Today's Sales */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">আজকের মোট বিক্রয়</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff' }}>
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value">৳{todayRevenue}</div>
                  <div className="admin-stat-sub">
                    <Clock size={12} /> আজ মোট {todayOrders.length} টি অর্ডার
                  </div>
                </div>

                {/* Today's Net Profit */}
                <div className="admin-stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(10, 14, 26, 0.9))' }}>
                  <div className="admin-stat-header">
                    <span className="admin-stat-title" style={{ color: '#10b981', fontWeight: 700 }}>আজকের নিট লাভ</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: '#10b981' }}>+৳{todayNetProfit}</div>
                  <div className="admin-stat-sub">
                    বিক্রয় ৳{todayRevenue} • পাইকারি খরচ ৳{Math.max(0, todayRevenue - todayNetProfit)}
                  </div>
                </div>

                {/* Total Net Profit */}
                <div className="admin-stat-card" style={{ borderColor: 'rgba(0, 240, 255, 0.3)', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.06), rgba(10, 14, 26, 0.9))' }}>
                  <div className="admin-stat-header">
                    <span className="admin-stat-title" style={{ color: '#00f0ff', fontWeight: 700 }}>সর্বমোট নিট লাভ</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff' }}>
                      <Crown size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: '#00f0ff' }}>+৳{totalNetProfit}</div>
                  <div className="admin-stat-sub" style={{ color: '#06d6a0', fontWeight: 700 }}>
                    মার্জিন: {profitMarginPercent}% (মোট বিক্রয় ৳{totalRevenue})
                  </div>
                </div>

                {/* Pending Orders */}
                <div className="admin-stat-card" style={{ borderColor: pendingOrders.length > 0 ? 'rgba(245, 158, 11, 0.4)' : '' }}>
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">অপেক্ষমাণ (পেন্ডিং) অর্ডার</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: pendingOrders.length > 0 ? '#f59e0b' : '#fff' }}>
                    {pendingOrders.length}
                  </div>
                  <div className="admin-stat-sub">
                    {pendingOrders.length > 0 ? 'দ্রুত ডেলিভারি প্রদান করুন' : 'সব অর্ডার ডেলিভার্ড'}
                  </div>
                </div>

                {/* Total Users */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">মোট গ্রাহক / ইউজার</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(255, 0, 119, 0.1)', color: '#ff0077' }}>
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value">{users.length}</div>
                  <div className="admin-stat-sub">
                    <Crown size={12} /> {users.filter(u => u.role === 'admin').length} জন অ্যাডমিন
                  </div>
                </div>

                {/* Total User Wallet Holding */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">ইউজার ওয়ালেট রিজার্ভ</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(6, 214, 160, 0.1)', color: '#06d6a0' }}>
                      <Wallet size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: '#06d6a0' }}>৳{totalUserWallets}</div>
                  <div className="admin-stat-sub">গ্রাহকদের মোট জমার পরিমাণ</div>
                </div>

                {/* Pending Recharges Card */}
                <div 
                  className="admin-stat-card" 
                  style={{ 
                    borderColor: pendingRecharges.length > 0 ? 'rgba(245, 158, 11, 0.5)' : '',
                    cursor: 'pointer' 
                  }}
                  onClick={() => { sounds.playClick(); setActiveAdminTab('recharges'); }}
                  title="রিচার্জ রিকোয়েস্ট যাচাই করতে ক্লিক করুন"
                >
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">পেন্ডিং রিচার্জ রিকোয়েস্ট</span>
                    <div className="admin-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <Wallet size={20} />
                    </div>
                  </div>
                  <div className="admin-stat-value" style={{ color: pendingRecharges.length > 0 ? '#f59e0b' : '#06d6a0' }}>
                    {pendingRecharges.length}টি
                  </div>
                  <div className="admin-stat-sub">
                    {pendingRecharges.length > 0 ? '⚠️ যাচাই ও অনুমোদন বাকি' : 'সব আবেদন অনুমোদিত'}
                  </div>
                </div>

              </div>

              {/* Quick Actions Bar */}
              <div className="admin-card" style={{ background: 'linear-gradient(135deg, rgba(16, 22, 38, 0.9), rgba(10, 14, 26, 0.9))' }}>
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <Sparkles size={18} color="#00f0ff" />
                    <span>কুইক শর্টকাট হাব</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-admin-action primary"
                    style={{ padding: '10px 16px', fontSize: '13px' }}
                    onClick={() => setActiveAdminTab('products')}
                  >
                    💎 ডায়মন্ডের দাম পরিবর্তন
                  </button>

                  <button 
                    className="btn-admin-action"
                    style={{ padding: '10px 16px', fontSize: '13px' }}
                    onClick={() => setActiveAdminTab('users')}
                  >
                    <Users size={16} /> গ্রাহকদের ব্যালেন্স দিন
                  </button>

                  <button 
                    className="btn-admin-action success"
                    style={{ padding: '10px 16px', fontSize: '13px' }}
                    onClick={() => {
                      if (pendingOrders.length === 0) {
                        showToast('কোনো পেন্ডিং অর্ডার নেই!', 'info');
                      } else {
                        bulkCompletePendingOrders();
                      }
                    }}
                  >
                    <CheckCircle2 size={16} /> সব পেন্ডিং অর্ডার কমপ্লিট করুন
                  </button>

                  <button 
                    className="btn-admin-action"
                    style={{ padding: '10px 16px', fontSize: '13px' }}
                    onClick={() => setActiveAdminTab('payments')}
                  >
                    <CreditCard size={16} /> বিকাশ/নগদ নাম্বার পরিবর্তন
                  </button>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <ShoppingBag size={18} color="#00f0ff" />
                    <span>সর্বশেষ অর্ডারসমূহ</span>
                  </div>
                  <button 
                    className="btn-admin-action" 
                    onClick={() => setActiveAdminTab('orders')}
                    style={{ fontSize: '12px' }}
                  >
                    সকল অর্ডার দেখুন ({orders.length}) <ChevronRight size={14} />
                  </button>
                </div>

                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>অর্ডার আইডি</th>
                        <th>গ্রাহক ও প্লেয়ার UID</th>
                        <th>প্যাকেজ</th>
                        <th>মূল্য ও মেথড</th>
                        <th>স্ট্যাটাস</th>
                        <th>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id}>
                          <td>
                            <b style={{ color: '#00f0ff' }}>{order.id}</b>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {new Date(order.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{order.customerName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                              <span>UID: <b>{order.uid}</b></span>
                              <button 
                                onClick={() => handleCopy(order.uid)}
                                style={{ color: '#00f0ff', padding: '1px' }}
                                title="কপি করুন"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.packageName}</div>
                            <div style={{ fontSize: '11px', color: '#00f0ff' }}>{order.productName}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#06d6a0' }}>৳{order.amount}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.method}</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                                লাভ: +৳{getOrderProfit(order)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                              {order.status === 'Completed' ? '✅ কমপ্লিট' :
                               order.status === 'Processing' ? '⚡ প্রসেসিং' :
                               order.status === 'Cancelled' ? '❌ বাতিল' : '⏳ পেন্ডিং'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {order.status !== 'Completed' && (
                                <button 
                                  className="btn-admin-action success" 
                                  onClick={() => updateOrderStatus(order.id, 'Completed')}
                                  title="অর্ডার সম্পন্ন করুন"
                                >
                                  <CheckCircle2 size={13} />
                                </button>
                              )}
                              <button 
                                className="btn-admin-action whatsapp" 
                                onClick={() => handleOpenWhatsAppGamer(order)}
                                title="WhatsApp এ মেসেজ পাঠান"
                              >
                                <MessageCircle size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: REPORTS & DATA                                            */}
          {/* ============================================================== */}
          {activeAdminTab === 'reports' && (
            <div>
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={20} color="#00f0ff" />
                      <span>সেলস ও একাউন্টিং রিপোর্ট</span>
                    </h2>
                  </div>

                  <div className="admin-card-actions">
                    <button 
                      className="btn-admin-action primary"
                      onClick={() => window.print()}
                    >
                      <Printer size={15} /> রিপোর্ট প্রিন্ট করুন
                    </button>

                    <button 
                      className="btn-admin-action"
                      onClick={() => {
                        sounds.playClick();
                        const blob = new Blob([JSON.stringify({ orders, users, date: new Date().toISOString() }, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `topup_bd_backup_${Date.now()}.json`;
                        a.click();
                        showToast('ডাটা ব্যাকআপ ডাউনলোড সম্পন্ন!', 'success');
                      }}
                    >
                      <Download size={15} /> ডাটা ব্যাকআপ এক্সপোর্ট
                    </button>
                  </div>
                </div>

                {/* Date range filter */}
                <div className="admin-filter-pill-group" style={{ marginBottom: '20px' }}>
                  <button 
                    className={`admin-filter-pill ${reportDateRange === 'today' ? 'active' : ''}`}
                    onClick={() => setReportDateRange('today')}
                  >
                    আজকের সেলস
                  </button>
                  <button 
                    className={`admin-filter-pill ${reportDateRange === 'yesterday' ? 'active' : ''}`}
                    onClick={() => setReportDateRange('yesterday')}
                  >
                    গতকালের সেলস
                  </button>
                  <button 
                    className={`admin-filter-pill ${reportDateRange === 'week' ? 'active' : ''}`}
                    onClick={() => setReportDateRange('week')}
                  >
                    গত ৭ দিন
                  </button>
                  <button 
                    className={`admin-filter-pill ${reportDateRange === 'all' ? 'active' : ''}`}
                    onClick={() => setReportDateRange('all')}
                  >
                    সর্বমোট
                  </button>
                </div>

                {/* Report Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>নির্বাচিত সময়ে মোট বিক্রয়</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#00f0ff', marginTop: '6px' }}>
                      ৳{analyticsOrders.reduce((s, o) => s + (o.amount || 0), 0)}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>নির্বাচিত সময়ে নিট লাভ</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>
                      +৳{analyticsOrders.reduce((s, o) => s + getOrderProfit(o), 0)}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>পাইকারি কেনা খরচ</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#cbd5e1', marginTop: '6px' }}>
                      ৳{analyticsOrders.reduce((s, o) => s + getOrderCost(o), 0)}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>মোট সম্পন্ন অর্ডার</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#06d6a0', marginTop: '6px' }}>
                      {analyticsOrders.filter(o => o.status === 'Completed').length}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>বিকাশ বিক্রয়</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#e2136e', marginTop: '6px' }}>
                      ৳{analyticsOrders.filter(o => o.method?.toLowerCase().includes('bkash')).reduce((s, o) => s + o.amount, 0)}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>নগদ বিক্রয়</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#f7931e', marginTop: '6px' }}>
                      ৳{analyticsOrders.filter(o => o.method?.toLowerCase().includes('nagad')).reduce((s, o) => s + o.amount, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: WALLET MANAGER FOR USER                               */}
      {/* ============================================================== */}
      {walletModalUser && (
        <div className="admin-modal-overlay" onClick={() => setWalletModalUser(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#00f0ff" />
                <span>ওয়ালেট ব্যালেন্স নিয়ন্ত্রণ</span>
              </h3>
              <button className="btn-admin-action" onClick={() => setWalletModalUser(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: '#fff' }}>{walletModalUser.displayName}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>UID: {walletModalUser.uid} • ফোন: {walletModalUser.phone || 'N/A'}</div>
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                বর্তমান ব্যালেন্স: <b style={{ color: '#06d6a0', fontSize: '18px' }}>৳{walletModalUser.balance || 0}</b>
              </div>
            </div>

            <form onSubmit={handleApplyWalletChange}>
              {/* Action type */}
              <div className="admin-form-group">
                <label className="admin-form-label">অ্যাকশন নির্বাচন করুন:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button 
                    type="button" 
                    className={`btn-admin-action ${walletAdjustmentMode === 'add' ? 'success' : ''}`}
                    style={{ justifyContent: 'center', padding: '10px' }}
                    onClick={() => setWalletAdjustmentMode('add')}
                  >
                    + টাকা যোগ করুন
                  </button>
                  <button 
                    type="button" 
                    className={`btn-admin-action ${walletAdjustmentMode === 'deduct' ? 'danger' : ''}`}
                    style={{ justifyContent: 'center', padding: '10px' }}
                    onClick={() => setWalletAdjustmentMode('deduct')}
                  >
                    - টাকা কর্তন করুন
                  </button>
                  <button 
                    type="button" 
                    className={`btn-admin-action ${walletAdjustmentMode === 'set' ? 'primary' : ''}`}
                    style={{ justifyContent: 'center', padding: '10px' }}
                    onClick={() => setWalletAdjustmentMode('set')}
                  >
                    নির্দিষ্ট ব্যালেন্স সেট
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="admin-form-group">
                <label className="admin-form-label">টাকার পরিমাণ (BDT):</label>
                <input 
                  type="number"
                  className="admin-form-input"
                  placeholder="যেমন: ৫০০"
                  value={walletAmountInput}
                  onChange={(e) => setWalletAmountInput(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[50, 100, 200, 500, 1000].map(amt => (
                  <button 
                    key={amt} 
                    type="button"
                    className="btn-admin-action"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => setWalletAmountInput(amt.toString())}
                  >
                    +৳{amt}
                  </button>
                ))}
              </div>

              {/* Note */}
              <div className="admin-form-group">
                <label className="admin-form-label">নোট বা কারণ (ঐচ্ছিক):</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  placeholder="যেমন: বিকাশ সেন্ড মানি রিচার্জ"
                  value={walletNoteInput}
                  onChange={(e) => setWalletNoteInput(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn-admin-action primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '10px' }}
              >
                <CheckCircle2 size={16} /> ওয়ালেটে কার্যকর করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: INSPECT USER'S ORDER HISTORY                          */}
      {/* ============================================================== */}
      {inspectedUser && (
        <div className="admin-modal-overlay" onClick={() => setInspectedUser(null)}>
          <div className="admin-modal-dialog" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {inspectedUser.displayName} এর সকল অর্ডার
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  ইমেইল: {inspectedUser.email || 'N/A'} • ফোন: {inspectedUser.phone || 'N/A'}
                </div>
              </div>
              <button className="btn-admin-action" onClick={() => setInspectedUser(null)}>
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                const userOrders = orders.filter(o => o.userId === inspectedUser.uid || o.senderNumber === inspectedUser.phone);
                if (userOrders.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      এই ইউজারের এখনো কোনো অর্ডার নেই।
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {userOrders.map(o => (
                      <div 
                        key={o.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#00f0ff' }}>{o.id} • {o.packageName}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            UID: <b>{o.uid}</b> ({o.playerNickname})
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(o.createdAt).toLocaleString('bn-BD')}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: '#06d6a0', fontSize: '16px' }}>৳{o.amount}</div>
                          <span className={`status-badge ${o.status.toLowerCase()}`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADD NEW USER                                          */}
      {/* ============================================================== */}
      {isAddUserModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#00f0ff" />
                <span>নতুন ইউজার অ্যাকাউন্ট তৈরি করুন</span>
              </h3>
              <button className="btn-admin-action" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="admin-form-group">
                <label className="admin-form-label">গ্রাহকের নাম (Full Name):</label>
                <input 
                  type="text"
                  required
                  className="admin-form-input"
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={newUserData.displayName}
                  onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">মোবাইল নম্বর (Phone):</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  placeholder="যেমন: 01712345678"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">ইমেইল (ঐচ্ছিক):</label>
                <input 
                  type="email"
                  className="admin-form-input"
                  placeholder="user@gmail.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">রোল (Role):</label>
                <select 
                  className="admin-form-select"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="user">🎮 সাধারণ গ্রাহক (Regular User)</option>
                  <option value="admin">👑 অ্যাডমিন (Administrator)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">প্রারম্ভিক ওয়ালেট ব্যালেন্স (৳):</label>
                <input 
                  type="number"
                  className="admin-form-input"
                  placeholder="0"
                  value={newUserData.initialBalance}
                  onChange={(e) => setNewUserData({ ...newUserData, initialBalance: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn-admin-action primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '10px' }}
              >
                <Plus size={16} /> অ্যাকাউন্ট তৈরি সম্পন্ন করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDIT USER PROFILE                                     */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#00f0ff" />
                <span>ইউজার তথ্য এডিট করুন</span>
              </h3>
              <button className="btn-admin-action" onClick={() => setEditingUser(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUserProfile}>
              <div className="admin-form-group">
                <label className="admin-form-label">নাম:</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editUserData.displayName}
                  onChange={(e) => setEditUserData({ ...editUserData, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">ফোন:</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">ইমেইল:</label>
                <input 
                  type="email"
                  className="admin-form-input"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn-admin-action primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13.5px', borderRadius: '10px' }}
              >
                <CheckCircle2 size={16} /> সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: ADD PACKAGE                                           */}
      {/* ============================================================== */}
      {isAddPackageModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsAddPackageModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#00f0ff" />
                <span>নতুন প্যাকেজ যোগ করুন ({currentProduct?.title})</span>
              </h3>
              <button className="btn-admin-action" onClick={() => setIsAddPackageModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePackage}>
              <div className="admin-form-group">
                <label className="admin-form-label">প্যাকেজের নাম (Package Name):</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  placeholder="যেমন: 500 Diamond"
                  value={newPkgData.name}
                  onChange={(e) => setNewPkgData({ ...newPkgData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">ডায়মন্ডের সংখ্যা:</label>
                  <input 
                    type="number"
                    className="admin-form-input"
                    placeholder="500"
                    value={newPkgData.diamonds}
                    onChange={(e) => setNewPkgData({ ...newPkgData, diamonds: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">বিক্রয় মূল্য (টাকা):</label>
                  <input 
                    type="number"
                    className="admin-form-input"
                    placeholder="350"
                    value={newPkgData.price}
                    onChange={(e) => setNewPkgData({ ...newPkgData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>পাইকারি / কেনা খরচ (টাকা):</label>
                  {newPkgData.price && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                      লাভ: +৳{(parseFloat(newPkgData.price) || 0) - (parseFloat(newPkgData.costPrice) || Math.round((parseFloat(newPkgData.price) || 0) * 0.9))}
                    </span>
                  )}
                </div>
                <input 
                  type="number"
                  className="admin-form-input"
                  placeholder={newPkgData.price ? `যেমন: ${Math.round(parseFloat(newPkgData.price) * 0.9)} (ফাঁকা রাখলে ৯০%)` : 'পাইকারি কেনা খরচ'}
                  value={newPkgData.costPrice || ''}
                  onChange={(e) => setNewPkgData({ ...newPkgData, costPrice: e.target.value })}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  * ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে বিক্রয় মূল্যের ৯০% খরচ হিসেবে ধরা হবে।
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">হাইলাইট ট্যাগ (ঐচ্ছিক, যেমন: Most Popular, হট অফার):</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  placeholder="যেমন: Most Popular, সেরা অফার"
                  value={newPkgData.tag}
                  onChange={(e) => setNewPkgData({ ...newPkgData, tag: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn-admin-action primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '10px' }}
              >
                <Plus size={16} /> প্যাকেজ সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: EDIT PACKAGE (FULL EDIT)                              */}
      {/* ============================================================== */}
      {editingPkg && (
        <div className="admin-modal-overlay" onClick={() => setEditingPkg(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                প্যাকেজ এডিট: {editingPkg.name}
              </h3>
              <button className="btn-admin-action" onClick={() => setEditingPkg(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdatePackageSubmit}>
              <div className="admin-form-group">
                <label className="admin-form-label">প্যাকেজের নাম:</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editingPkg.name}
                  onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">ডায়মন্ডের সংখ্যা:</label>
                  <input 
                    type="number"
                    className="admin-form-input"
                    value={editingPkg.diamonds}
                    onChange={(e) => setEditingPkg({ ...editingPkg, diamonds: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">মূল্য (টাকা):</label>
                  <input 
                    type="number"
                    className="admin-form-input"
                    value={editingPkg.price}
                    onChange={(e) => setEditingPkg({ ...editingPkg, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>পাইকারি / কেনা খরচ (টাকা):</label>
                  {editingPkg.price && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                      লাভ: +৳{(parseFloat(editingPkg.price) || 0) - (parseFloat(editingPkg.costPrice) || Math.round((parseFloat(editingPkg.price) || 0) * 0.9))}
                    </span>
                  )}
                </div>
                <input 
                  type="number"
                  className="admin-form-input"
                  placeholder={`যেমন: ${Math.round((parseFloat(editingPkg.price) || 0) * 0.9)}`}
                  value={editingPkg.costPrice !== undefined ? editingPkg.costPrice : ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, costPrice: e.target.value })}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  * এটি আপনার পাইকারি কেনা খরচ। বিক্রয় মূল্য থেকে বাদ দিয়ে নিট লাভ হিসাব করা হবে।
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">ট্যাগ (যেমন: Most Popular, বেস্ট ডিল):</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editingPkg.tag || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, tag: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn-admin-action primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', borderRadius: '10px' }}
              >
                <CheckCircle2 size={16} /> পরিবর্তন সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: REJECT WALLET RECHARGE REASON                        */}
      {/* ============================================================== */}
      {rejectModalReq && (
        <div className="admin-modal-overlay" onClick={() => setRejectModalReq(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} />
                <span>রিচার্জ রিকোয়েস্ট বাতিল করুন</span>
              </h3>
              <button className="btn-admin-action" onClick={() => setRejectModalReq(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 800 }}>
                #{rejectModalReq.id} • {rejectModalReq.customerName}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                পরিমাণ: <b style={{ color: '#00f0ff' }}>৳{rejectModalReq.amount}</b> ({rejectModalReq.method}) • TrxID: <code style={{ color: '#00f0ff' }}>{rejectModalReq.trxId}</code>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              rejectWalletRecharge(rejectModalReq.id, rejectionReason);
              setRejectModalReq(null);
            }}>
              <div className="admin-form-group">
                <label className="admin-form-label">বাতিল করার দ্রুত কারণ বেছে নিন:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {[
                    'ভুল ট্রানজেকশন আইডি (TrxID) বা টাকা পাওয়া যায়নি',
                    'আমাদের অ্যাকাউন্টে কোনো টাকা জমা হয়নি',
                    'প্রদত্ত পরিমাণের চেয়ে কম টাকা পাঠানো হয়েছে',
                    'ফেক বা ভুয়া রিচার্জ রিকোয়েস্ট'
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      className="btn-admin-action"
                      style={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: '12px',
                        background: rejectionReason === reason ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: rejectionReason === reason ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: rejectionReason === reason ? '#fff' : '#cbd5e1'
                      }}
                      onClick={() => setRejectionReason(reason)}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">কাস্টম কারণ বা নোট (গ্রাহক দেখতে পাবেন):</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="কারণ লিখুন..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button"
                  className="btn-admin-action"
                  style={{ flex: 1, justifyContent: 'center', padding: '11px' }}
                  onClick={() => setRejectModalReq(null)}
                >
                  ফিরে যান
                </button>
                <button 
                  type="submit" 
                  className="btn-admin-action danger"
                  style={{ flex: 2, justifyContent: 'center', padding: '11px', fontWeight: 800 }}
                >
                  <XCircle size={16} /> নিশ্চিত বাতিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 8: WHATSAPP GAMER DELIVERY & NOTICE TEMPLATES           */}
      {/* ============================================================== */}
      {whatsAppModalOrder && (
        <div className="admin-modal-overlay" onClick={() => setWhatsAppModalOrder(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#25d366', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={22} />
                <span>WhatsApp মেসেজ ও ডেলিভারি স্লিপ</span>
              </h3>
              <button className="btn-admin-action" onClick={() => setWhatsAppModalOrder(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Order Quick Summary Card */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(37, 211, 102, 0.08)',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>
                  অর্ডার #{whatsAppModalOrder.id}
                </span>
                <span style={{ color: '#00f0ff', fontWeight: 800 }}>
                  ৳{whatsAppModalOrder.amount} ({whatsAppModalOrder.packageName})
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                গ্রাহক: <b>{whatsAppModalOrder.customerName}</b> • UID: <code style={{ color: '#00f0ff' }}>{whatsAppModalOrder.uid}</code>
                {whatsAppModalOrder.trxId && <> • Trx: <code style={{ color: '#06d6a0' }}>{whatsAppModalOrder.trxId}</code></>}
              </div>
            </div>

            {/* 3 Quick Template Selector Buttons */}
            <div style={{ marginBottom: '16px' }}>
              <label className="admin-form-label" style={{ marginBottom: '8px' }}>মেসেজ টেমপ্লেট নির্বাচন করুন:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-admin-action"
                  onClick={() => handleChangeWhatsAppTemplate('delivery')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    background: whatsAppModalTemplate === 'delivery' ? 'rgba(37, 211, 102, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: whatsAppModalTemplate === 'delivery' ? '1px solid #25d366' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: whatsAppModalTemplate === 'delivery' ? '#25d366' : '#cbd5e1'
                  }}
                >
                  🎉 ডেলিভারি সম্পন্ন
                </button>
                <button
                  type="button"
                  className="btn-admin-action"
                  onClick={() => handleChangeWhatsAppTemplate('invalid_uid')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    background: whatsAppModalTemplate === 'invalid_uid' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: whatsAppModalTemplate === 'invalid_uid' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: whatsAppModalTemplate === 'invalid_uid' ? '#f59e0b' : '#cbd5e1'
                  }}
                >
                  ⚠️ ভুল UID নোটিশ
                </button>
                <button
                  type="button"
                  className="btn-admin-action"
                  onClick={() => handleChangeWhatsAppTemplate('trx_issue')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    background: whatsAppModalTemplate === 'trx_issue' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: whatsAppModalTemplate === 'trx_issue' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: whatsAppModalTemplate === 'trx_issue' ? '#ef4444' : '#cbd5e1'
                  }}
                >
                  ⏳ TrxID সমস্যা
                </button>
              </div>
            </div>

            {/* Target Phone Field */}
            <div className="admin-form-group">
              <label className="admin-form-label">গ্রাহকের WhatsApp নম্বর (ঐচ্ছিক বা এডিটেবল):</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="01XXXXXXXXX"
                value={whatsAppModalPhone}
                onChange={(e) => setWhatsAppModalPhone(e.target.value)}
              />
            </div>

            {/* Editable Message Box */}
            <div className="admin-form-group">
              <label className="admin-form-label">পাঠানোর মেসেজ টেক্সট (প্রয়োজনে এডিট করুন):</label>
              <textarea
                className="admin-form-input"
                rows={5}
                value={whatsAppModalMessage}
                onChange={(e) => setWhatsAppModalMessage(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-admin-action"
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  sounds.playClick();
                  navigator.clipboard.writeText(whatsAppModalMessage);
                  showToast('মেসেজ কপি করা হয়েছে!', 'success');
                }}
              >
                <Copy size={14} /> টেক্সট কপি
              </button>

              <button
                type="button"
                className="btn-admin-action"
                style={{
                  flex: 1.5,
                  justifyContent: 'center',
                  padding: '10px',
                  background: '#25d366',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800
                }}
                onClick={() => {
                  sounds.playClick();
                  const cleanPhone = whatsAppModalPhone.replace(/\D/g, '').replace(/^880/, '').replace(/^0/, '');
                  const encoded = encodeURIComponent(whatsAppModalMessage);
                  if (cleanPhone) {
                    window.open(`https://wa.me/880${cleanPhone}?text=${encoded}`, '_blank');
                  } else {
                    window.open(`https://wa.me/?text=${encoded}`, '_blank');
                  }
                }}
              >
                <MessageCircle size={15} /> WhatsApp ওপেন
              </button>

              {whatsAppModalOrder.status !== 'Completed' && (
                <button
                  type="button"
                  className="btn-admin-action success"
                  style={{ flex: 2, justifyContent: 'center', padding: '10px', fontWeight: 800 }}
                  onClick={() => {
                    sounds.playSuccess();
                    updateOrderStatus(whatsAppModalOrder.id, 'Completed');
                    showToast(`অর্ডার #${whatsAppModalOrder.id} সম্পন্ন হয়েছে!`, 'success');
                    setWhatsAppModalOrder(null);
                  }}
                >
                  <CheckCircle2 size={15} /> অর্ডার কমপ্লিট মার্ক করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
