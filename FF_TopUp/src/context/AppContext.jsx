import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  INITIAL_PRODUCTS,
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders, 
  saveStoredOrders, 
  getStoredNotice, 
  saveStoredNotice,
  getStoredUsers,
  saveStoredUsers,
  getStoredWallet,
  saveStoredWallet,
  getStoredPaymentChannels,
  saveStoredPaymentChannels,
  getStoredWalletRequests,
  saveStoredWalletRequests,
  getStoredNotifications,
  saveStoredNotifications,
  subscribeToFirestoreProducts,
  syncProductToFirestore,
  syncAllProductsToFirestore,
  subscribeToFirestoreNotice,
  syncNoticeToFirestore,
  subscribeToFirestorePaymentChannels,
  syncPaymentChannelsToFirestore,
  subscribeToFirestoreOrders,
  syncOrderToFirestore,
  subscribeToFirestoreWalletRequests,
  syncWalletRequestToFirestore,
  subscribeToFirestoreUsers,
  syncUserToFirestore,
  deleteUserFromFirestore
} from '../services/dataService';
import { sounds } from '../services/soundEffects';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { currentUser, walletBalance, updateBalance, isAdmin } = useAuth();
  
  // SPA Routing
  const [currentRoute, setCurrentRoute] = useState(() => window.location.pathname || '/');
  const [activeAdminTab, setActiveAdminTab] = useState('overview'); // overview, users, orders, products, payments, notice, reports, settings
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    sounds.playClick();
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const [products, setProducts] = useState(getStoredProducts);
  const [orders, setOrders] = useState(getStoredOrders);
  const [users, setUsers] = useState(getStoredUsers);
  const [notice, setNotice] = useState(getStoredNotice);
  const [paymentChannels, setPaymentChannels] = useState(getStoredPaymentChannels);
  const [walletRequests, setWalletRequests] = useState(getStoredWalletRequests);
  const [notifications, setNotifications] = useState(getStoredNotifications);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Modals
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isOrdersHistoryOpen, setIsOrdersHistoryOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [orderTrackerQuery, setOrderTrackerQuery] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const openOrderTracker = (query = '') => {
    sounds.playClick();
    setOrderTrackerQuery(query);
    setIsOrderTrackerOpen(true);
  };
  
  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sync data to storage
  useEffect(() => {
    saveStoredOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredWalletRequests(walletRequests);
  }, [walletRequests]);

  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  // Real-time Firestore Cloud Subscriptions
  useEffect(() => {
    const unsubProducts = subscribeToFirestoreProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
      }
    });

    const unsubNotice = subscribeToFirestoreNotice((cloudNotice) => {
      if (cloudNotice) {
        setNotice(cloudNotice);
      }
    });

    const unsubPayments = subscribeToFirestorePaymentChannels((cloudChannels) => {
      if (cloudChannels) {
        setPaymentChannels(cloudChannels);
      }
    });

    const unsubOrders = subscribeToFirestoreOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
      }
    });

    const unsubWalletRequests = subscribeToFirestoreWalletRequests((cloudRequests) => {
      if (cloudRequests) {
        setWalletRequests(cloudRequests);
      }
    });

    const unsubUsers = subscribeToFirestoreUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
      }
    });

    return () => {
      unsubProducts();
      unsubNotice();
      unsubPayments();
      unsubOrders();
      unsubWalletRequests();
      unsubUsers();
    };
  }, []);

  // Open Topup Modal for a specific product
  const startTopup = (product, pkg = null) => {
    sounds.playClick();
    if (isAdmin) {
      sounds.playError();
      showToast('⚠️ অ্যাডমিন একাউন্ট দিয়ে পারচেজ বা টপ-আপ করা নিষেধ। অ্যাডমিন শুধুমাত্র ওয়েবসাইট ম্যানেজ করবেন। কেনাকাটা করতে গ্রাহক একাউন্ট ব্যবহার করুন।', 'error');
      return;
    }
    setSelectedProduct(product);
    setSelectedPackage(pkg || product.packages[0]);
    setIsTopupOpen(true);
  };

  // Place order
  const placeOrder = async ({ uid, playerNickname, server, product, pkg, method, senderNumber, trxId }) => {
    sounds.playClick();
    
    // Admin cannot purchase
    if (isAdmin) {
      sounds.playError();
      showToast('⚠️ অ্যাডমিন একাউন্ট দিয়ে টপ-আপ করা যাবে না। অ্যাডমিন শুধু ম্যানেজ করবেন।', 'error');
      return { success: false, reason: 'admin_purchase_blocked' };
    }
    
    // If paying with Wallet
    if (method === 'Wallet Balance') {
      if (walletBalance < pkg.price) {
        sounds.playError();
        showToast('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে ওয়ালেট রিচার্জ করুন।', 'error');
        return { success: false, reason: 'insufficient_funds' };
      }
      // Deduct balance
      updateBalance(-pkg.price);
    } else if (trxId) {
      const cleanTrx = trxId.trim().toUpperCase();
      const duplicateOrder = orders.some(o => o.trxId && o.trxId.trim().toUpperCase() === cleanTrx);
      if (duplicateOrder) {
        sounds.playError();
        showToast('⚠️ এই TrxID দিয়ে ইতিমধ্যে একটি অর্ডার রয়েছে! একই TrxID বারবার দেওয়া যাবে না।', 'error');
        return { success: false, reason: 'duplicate_trx' };
      }
    }

    const newOrderId = 'TOP-' + Math.floor(10000 + Math.random() * 90000);
    const orderCost = pkg.costPrice !== undefined ? Number(pkg.costPrice) : Math.round(Number(pkg.price) * 0.9);
    const orderProfit = Math.max(0, Number(pkg.price) - orderCost);

    const newOrder = {
      id: newOrderId,
      customerName: currentUser ? currentUser.displayName : 'Guest Gamer',
      userId: currentUser ? currentUser.uid : 'guest',
      uid: uid,
      playerNickname: playerNickname || 'BD_WARRIOR',
      server: server || 'BD Server',
      productName: product.title,
      packageName: pkg.name,
      diamonds: pkg.diamonds || 0,
      amount: pkg.price,
      costPrice: orderCost,
      profit: orderProfit,
      method: method,
      senderNumber: senderNumber || '',
      trxId: trxId || 'WLT-' + Math.floor(100000 + Math.random() * 900000),
      status: method === 'Wallet Balance' ? 'Processing' : 'Pending',
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    syncOrderToFirestore(newOrder);

    // Realtime notification for Admin
    addNotification({
      targetRole: 'admin',
      title: '📦 নতুন অর্ডার!',
      message: `${newOrder.customerName} (${newOrder.productName} - ${newOrder.packageName}) এর একটি নতুন অর্ডার দিয়েছেন (৳${newOrder.amount})`,
      type: 'order_new',
      orderId: newOrderId
    });

    // Play celebration audio and confetti
    sounds.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    showToast(`অর্ডার সফলভাবে গ্রহন করা হয়েছে! অর্ডার আইডি: ${newOrderId}`, 'success');
    try {
      localStorage.setItem('topup_bd_last_order_id', newOrderId);
    } catch {}
    setIsTopupOpen(false);
    setActiveReceipt(newOrder);

    // If wallet balance, simulate instant auto-delivery in 10 seconds!
    if (method === 'Wallet Balance') {
      setTimeout(() => {
        setOrders(curr => curr.map(o => o.id === newOrderId ? { ...o, status: 'Completed' } : o));
        syncOrderToFirestore({ ...newOrder, status: 'Completed' });
        showToast(`🎉 অভিনন্দন! অর্ডার ${newOrderId} সম্পন্ন হয়েছে এবং ডায়মন্ড অ্যাকাউন্টে পাঠানো হয়েছে!`, 'success');
        sounds.playCoin();
      }, 10000);
    }

    return { success: true, order: newOrder };
  };

  // ---------------- NOTIFICATION HELPERS ---------------- //
  const addNotification = (notifData) => {
    const newNotif = {
      id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      time: new Date().toISOString(),
      read: false,
      ...notifData
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = (userIdOrRole) => {
    setNotifications(prev => prev.map(n => {
      if (userIdOrRole === 'admin' && n.targetRole === 'admin') {
        return { ...n, read: true };
      }
      if (userIdOrRole && n.userId === userIdOrRole) {
        return { ...n, read: true };
      }
      return n;
    }));
  };

  // Submit Wallet Recharge Request (Must be verified and approved by Admin)
  const submitWalletRechargeRequest = ({ amount, method, senderNumber, trxId }) => {
    sounds.playClick();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      showToast('সর্বনিম্ন ১০ টাকা রিচার্জ করতে হবে', 'error');
      sounds.playError();
      return { success: false, message: 'invalid_amount' };
    }
    if (!trxId || trxId.trim().length < 6) {
      showToast('সঠিক ট্রানজেকশন আইডি (TrxID) দিন', 'error');
      sounds.playError();
      return { success: false, message: 'invalid_trx' };
    }

    const cleanTrx = trxId.trim().toUpperCase();
    const duplicateReq = walletRequests.some(w => w.trxId && w.trxId.trim().toUpperCase() === cleanTrx);
    if (duplicateReq) {
      showToast('⚠️ এই TrxID দিয়ে ইতিমধ্যে ওয়ালেট রিকোয়েস্ট রয়েছে!', 'error');
      sounds.playError();
      return { success: false, message: 'duplicate_trx' };
    }

    const reqId = 'WLT-' + Math.floor(10000 + Math.random() * 90000);
    const newReq = {
      id: reqId,
      userId: currentUser ? currentUser.uid : 'guest',
      customerName: currentUser ? currentUser.displayName : 'Guest Gamer',
      customerEmail: currentUser?.email || '',
      customerPhone: senderNumber || '',
      amount: numAmount,
      method: method || 'bKash',
      senderNumber: (senderNumber || '').trim(),
      trxId: trxId.trim().toUpperCase(),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    setWalletRequests(prev => [newReq, ...prev]);
    syncWalletRequestToFirestore(newReq);

    // Send Realtime Notification to Admin
    addNotification({
      targetRole: 'admin',
      title: '🔔 নতুন ওয়ালেট রিচার্জ রিকোয়েস্ট!',
      message: `${newReq.customerName} ৳${newReq.amount} রিচার্জের রিকোয়েস্ট পাঠিয়েছেন (${newReq.method}, TrxID: ${newReq.trxId})`,
      type: 'recharge_pending',
      requestId: reqId
    });

    // Send Notification to User
    if (currentUser) {
      addNotification({
        userId: currentUser.uid,
        title: 'রিচার্জ রিকোয়েস্ট জমা হয়েছে ⏳',
        message: `আপনার ৳${newReq.amount} রিচার্জ রিকোয়েস্ট (${newReq.method}) গ্রহণ করা হয়েছে। এডমিন TrxID যাচাই করে অনুমোদন দিলে ব্যালেন্স ওয়ালেটে যোগ হবে।`,
        type: 'recharge_submitted',
        requestId: reqId
      });
    }

    sounds.playSuccess();
    showToast(`৳${newReq.amount} রিচার্জ রিকোয়েস্ট জমা হয়েছে! এডমিন TrxID যাচাই করে দ্রুত অনুমোদন দেবেন।`, 'success');
    setIsWalletOpen(false);
    return { success: true, request: newReq };
  };

  const addFundsToWallet = submitWalletRechargeRequest;

  // ---------------- ADMIN ACTIONS ---------------- //

  // 1. Order Management
  const updateOrderStatus = (orderId, newStatus) => {
    sounds.playClick();
    const targetOrder = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));

    if (targetOrder) {
      syncOrderToFirestore({ ...targetOrder, status: newStatus });
    }

    if (targetOrder?.userId && targetOrder.userId !== 'guest') {
      if (newStatus === 'Completed') {
        addNotification({
          userId: targetOrder.userId,
          title: '✅ অর্ডার সম্পন্ন হয়েছে!',
          message: `আপনার অর্ডার #${orderId} (${targetOrder.packageName}) সম্পন্ন হয়েছে এবং ডায়মন্ড পাঠানো হয়েছে!`,
          type: 'order_completed',
          orderId
        });
      } else if (newStatus === 'Cancelled') {
        addNotification({
          userId: targetOrder.userId,
          title: '❌ অর্ডার বাতিল হয়েছে',
          message: `আপনার অর্ডার #${orderId} বাতিল করা হয়েছে।`,
          type: 'order_cancelled',
          orderId
        });
      }
    }

    showToast(`অর্ডার ${orderId} স্ট্যাটাস পরিবর্তন হয়েছে: ${newStatus}`, 'info');
  };

  // 1.1 Approve Wallet Recharge Request
  const approveWalletRecharge = (requestId) => {
    sounds.playCoin();
    const req = walletRequests.find(r => r.id === requestId);
    if (!req) return;
    if (req.status === 'Approved') {
      showToast('এই রিকোয়েস্টটি ইতিমধ্যে অনুমোদিত হয়েছে', 'warning');
      return;
    }

    const updatedReq = { ...req, status: 'Approved', approvedAt: new Date().toISOString() };
    setWalletRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    syncWalletRequestToFirestore(updatedReq);

    if (req.userId && req.userId !== 'guest') {
      adjustUserWallet(req.userId, req.amount, `রিচার্জ রিকোয়েস্ট #${req.id} অনুমোদন`);
      
      addNotification({
        userId: req.userId,
        title: '🎉 ওয়ালেট রিচার্জ অনুমোদিত!',
        message: `অভিনন্দন! আপনার ৳${req.amount} রিচার্জ রিকোয়েস্ট এডমিন অনুমোদন করেছেন। ব্যালেন্স আপনার ওয়ালেটে যুক্ত হয়েছে!`,
        type: 'recharge_approved',
        requestId: req.id
      });
    }

    showToast(`রিকোয়েস্ট #${req.id} অনুমোদিত! ৳${req.amount} ইউজারের ওয়ালেটে যোগ করা হয়েছে।`, 'success');
  };

  // 1.2 Reject Wallet Recharge Request
  const rejectWalletRecharge = (requestId, reason = 'ভুল ট্রানজেকশন আইডি (TrxID) বা টাকা পাওয়া যায়নি') => {
    sounds.playError();
    const req = walletRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReq = { ...req, status: 'Rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() };
    setWalletRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    syncWalletRequestToFirestore(updatedReq);

    if (req.userId && req.userId !== 'guest') {
      addNotification({
        userId: req.userId,
        title: '❌ রিচার্জ রিকোয়েস্ট বাতিল',
        message: `আপনার ৳${req.amount} ওয়ালেট রিচার্জ রিকোয়েস্টটি বাতিল করা হয়েছে। কারণ: ${reason}`,
        type: 'recharge_rejected',
        requestId: req.id
      });
    }

    showToast(`রিকোয়েস্ট #${req.id} বাতিল করা হয়েছে।`, 'warning');
  };


  const refundOrder = (orderId, reason = 'অ্যাডমিন কর্তৃক বাতিল ও রিফান্ড') => {
    sounds.playCoin();
    const orderToRefund = orders.find(o => o.id === orderId);
    if (!orderToRefund) return;

    if (orderToRefund.status === 'Cancelled') {
      showToast('এই অর্ডারটি ইতিমধ্যে বাতিল ও রিফান্ড করা হয়েছে', 'warning');
      return;
    }

    const refundAmount = orderToRefund.amount || 0;
    const targetUserId = orderToRefund.userId;

    // Credit back if valid user
    if (targetUserId && targetUserId !== 'guest') {
      const currentBal = getStoredWallet(targetUserId);
      const newBal = currentBal + refundAmount;
      saveStoredWallet(newBal, targetUserId);

      // update users state
      setUsers(prev => prev.map(u => u.uid === targetUserId ? { ...u, balance: newBal } : u));

      // if currently logged in user
      if (currentUser && currentUser.uid === targetUserId) {
        updateBalance(refundAmount);
      }
    }

    // Update order status
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled', refundNote: reason } : o));
    showToast(`অর্ডার ${orderId} বাতিল করা হয়েছে এবং ৳${refundAmount} রিফান্ড দেওয়া হয়েছে`, 'success');
  };

  const deleteOrder = (orderId) => {
    sounds.playClick();
    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast(`অর্ডার ${orderId} মুছে ফেলা হয়েছে`, 'info');
  };

  const bulkCompletePendingOrders = () => {
    sounds.playSuccess();
    let count = 0;
    setOrders(prev => prev.map(o => {
      if (o.status === 'Pending' || o.status === 'Processing') {
        count++;
        return { ...o, status: 'Completed' };
      }
      return o;
    }));
    showToast(`${count} টি পেন্ডিং অর্ডার এক ক্লিকে সফল করা হয়েছে!`, 'success');
  };

  // 2. User Management
  const updateUserWallet = (userId, newAmount, note = '') => {
    sounds.playCoin();
    const cleanAmount = Math.max(0, parseFloat(newAmount) || 0);
    saveStoredWallet(cleanAmount, userId);
    let targetUser = null;
    setUsers(prev => prev.map(u => {
      if (u.uid === userId) {
        targetUser = { ...u, balance: cleanAmount };
        return targetUser;
      }
      return u;
    }));
    if (targetUser) {
      syncUserToFirestore(targetUser);
    }
    if (currentUser && currentUser.uid === userId) {
      updateBalance(cleanAmount - walletBalance);
    }
    showToast(`ইউজারের ওয়ালেট ব্যালেন্স ৳${cleanAmount} টাকা সেট করা হয়েছে ${note ? `(${note})` : ''}`, 'success');
  };

  const adjustUserWallet = (userId, delta, note = '') => {
    sounds.playCoin();
    const target = users.find(u => u.uid === userId);
    const oldBal = target?.balance || getStoredWallet(userId) || 0;
    const newBal = Math.max(0, oldBal + delta);
    saveStoredWallet(newBal, userId);
    let targetUser = null;
    setUsers(prev => prev.map(u => {
      if (u.uid === userId) {
        targetUser = { ...u, balance: newBal };
        return targetUser;
      }
      return u;
    }));
    if (targetUser) {
      syncUserToFirestore(targetUser);
    }
    if (currentUser && currentUser.uid === userId) {
      updateBalance(delta);
    }
    showToast(`ওয়ালেটে ${delta >= 0 ? '+' : ''}৳${delta} সমন্বয় করা হয়েছে। নতুন ব্যালেন্স: ৳${newBal}`, 'success');
  };

  const toggleUserAdminAccess = (userId) => {
    sounds.playClick();
    let updatedUser = null;
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.uid === userId) {
          const nextRole = u.role === 'admin' ? 'user' : 'admin';
          showToast(`${u.displayName} এর রোল পরিবর্তন করা হয়েছে: ${nextRole === 'admin' ? 'অ্যাডমিন 👑' : 'সাধারণ গ্রাহক'}`, 'info');
          updatedUser = { ...u, role: nextRole };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      return updated;
    });
    if (updatedUser) {
      syncUserToFirestore(updatedUser);
    }
  };

  const updateUserStatus = (userId, newStatus) => {
    sounds.playClick();
    let updatedUser = null;
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.uid === userId) {
          updatedUser = { ...u, status: newStatus };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      return updated;
    });
    if (updatedUser) {
      syncUserToFirestore(updatedUser);
    }
    showToast(`ইউজার অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন: ${newStatus === 'blocked' ? '🚫 সাময়িক বন্ধ' : '✅ সক্রিয়'}`, 'info');
  };

  const addNewUser = ({ displayName, email, phone, role = 'user', initialBalance = 0 }) => {
    sounds.playSuccess();
    const uid = 'usr_' + Date.now().toString(36);
    const newUser = {
      uid,
      displayName: displayName || 'New Gamer',
      email: email || `${phone || uid}@topupbd.com`,
      phone: phone || '',
      role: role || 'user',
      balance: parseFloat(initialBalance) || 0,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    saveStoredWallet(newUser.balance, uid);
    setUsers(prev => {
      const updated = [newUser, ...prev];
      saveStoredUsers(updated);
      return updated;
    });
    syncUserToFirestore(newUser);
    showToast(`নতুন ইউজার "${newUser.displayName}" সফলভাবে যুক্ত হয়েছে!`, 'success');
    return newUser;
  };

  const updateUserProfile = (userId, updatedData) => {
    sounds.playClick();
    let updatedUser = null;
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.uid === userId) {
          updatedUser = { ...u, ...updatedData };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      return updated;
    });
    if (updatedUser) {
      syncUserToFirestore(updatedUser);
    }
    showToast('ইউজার প্রোফাইল তথ্য আপডেট সম্পন্ন হয়েছে!', 'success');
  };

  const deleteUser = (userId) => {
    sounds.playClick();
    setUsers(prev => {
      const updated = prev.filter(u => u.uid !== userId);
      saveStoredUsers(updated);
      return updated;
    });
    deleteUserFromFirestore(userId);
    showToast('ইউজার অ্যাকাউন্ট ডিলিট করা হয়েছে', 'info');
  };

  // 3. Product & Package Management
  const addProductPackage = (productId, newPkg) => {
    sounds.playSuccess();
    const pkgId = 'pkg_' + Date.now().toString(36);
    const completePkg = {
      id: pkgId,
      name: newPkg.name,
      diamonds: parseInt(newPkg.diamonds) || 0,
      price: parseFloat(newPkg.price) || 0,
      costPrice: newPkg.costPrice !== undefined ? (parseFloat(newPkg.costPrice) || 0) : Math.round((parseFloat(newPkg.price) || 0) * 0.9),
      tag: newPkg.tag || '',
      popular: !!newPkg.popular,
      desc: newPkg.desc || ''
    };

    let updatedProduct = null;
    setProducts(prev => {
      const next = prev.map(prod => {
        if (prod.id === productId) {
          const updated = {
            ...prod,
            packages: [...prod.packages, completePkg]
          };
          updatedProduct = updated;
          return updated;
        }
        return prod;
      });
      return next;
    });
    if (updatedProduct) {
      syncProductToFirestore(updatedProduct);
    }
    showToast(`নতুন প্যাকেজ "${completePkg.name}" যুক্ত হয়েছে!`, 'success');
  };

  const updateProductPackage = (productId, pkgId, updatedFields) => {
    sounds.playClick();
    let updatedProduct = null;
    setProducts(prev => {
      const next = prev.map(prod => {
        if (prod.id === productId) {
          const updated = {
            ...prod,
            packages: prod.packages.map(p => {
              if (p.id === pkgId) {
                const updatedPkg = { ...p, ...updatedFields };
                if (updatedFields.price !== undefined) updatedPkg.price = parseFloat(updatedFields.price) || 0;
                if (updatedFields.costPrice !== undefined) updatedPkg.costPrice = parseFloat(updatedFields.costPrice) || 0;
                return updatedPkg;
              }
              return p;
            })
          };
          updatedProduct = updated;
          return updated;
        }
        return prod;
      });
      return next;
    });
    if (updatedProduct) {
      syncProductToFirestore(updatedProduct);
    }
    showToast('প্যাকেজ আপডেট সম্পন্ন হয়েছে', 'success');
  };

  const deleteProductPackage = (productId, pkgId) => {
    sounds.playClick();
    let updatedProduct = null;
    setProducts(prev => {
      const next = prev.map(prod => {
        if (prod.id === productId) {
          const updated = {
            ...prod,
            packages: prod.packages.filter(p => p.id !== pkgId)
          };
          updatedProduct = updated;
          return updated;
        }
        return prod;
      });
      return next;
    });
    if (updatedProduct) {
      syncProductToFirestore(updatedProduct);
    }
    showToast('প্যাকেজ মুছে ফেলা হয়েছে', 'info');
  };

  const quickUpdatePackagePrice = (productId, pkgId, newPrice, newCostPrice = null) => {
    sounds.playCoin();
    const cleanPrice = Math.max(1, parseFloat(newPrice) || 0);
    let updatedProduct = null;
    setProducts(prev => {
      const next = prev.map(prod => {
        if (prod.id === productId) {
          const updated = {
            ...prod,
            packages: prod.packages.map(p => {
              if (p.id === pkgId) {
                const updatedPkg = { ...p, price: cleanPrice };
                if (newCostPrice !== null && newCostPrice !== undefined && !isNaN(parseFloat(newCostPrice))) {
                  updatedPkg.costPrice = Math.max(0, parseFloat(newCostPrice));
                }
                return updatedPkg;
              }
              return p;
            })
          };
          updatedProduct = updated;
          return updated;
        }
        return prod;
      });
      return next;
    });
    if (updatedProduct) {
      syncProductToFirestore(updatedProduct);
    }
    showToast(`মূল্য ও খরচ সফলভাবে আপডেট করা হয়েছে!`, 'success');
  };

  const togglePackageAvailability = (productId, pkgId) => {
    sounds.playClick();
    let updatedProduct = null;
    setProducts(prev => {
      const next = prev.map(prod => {
        if (prod.id === productId) {
          const updated = {
            ...prod,
            packages: prod.packages.map(p => {
              if (p.id === pkgId) {
                const nextStatus = !p.isOutOfStock;
                showToast(`${p.name} এখন ${nextStatus ? 'স্টক শেষ (বন্ধ)' : 'চালু (সক্রিয়)'}`, 'info');
                return { ...p, isOutOfStock: nextStatus };
              }
              return p;
            })
          };
          updatedProduct = updated;
          return updated;
        }
        return prod;
      });
      return next;
    });
    if (updatedProduct) {
      syncProductToFirestore(updatedProduct);
    }
  };

  const resetProductsToDefault = () => {
    sounds.playClick();
    setProducts(INITIAL_PRODUCTS);
    saveStoredProducts(INITIAL_PRODUCTS);
    syncAllProductsToFirestore(INITIAL_PRODUCTS);
    showToast('সকল ডায়মন্ড প্যাকেজ ডিফল্ট মূল্যে ফিরিয়ে আনা হয়েছে!', 'info');
  };

  // 4. Payment & Notice Settings
  const updateNoticeText = (newText) => {
    setNotice(newText);
    saveStoredNotice(newText);
    syncNoticeToFirestore(newText);
    showToast('নোটিশ আপডেট সম্পন্ন হয়েছে!', 'success');
  };

  const updatePaymentChannelDetails = (channelKey, updatedData) => {
    sounds.playClick();
    setPaymentChannels(prev => {
      const updated = {
        ...prev,
        [channelKey]: {
          ...prev[channelKey],
          ...updatedData
        }
      };
      saveStoredPaymentChannels(updated);
      syncPaymentChannelsToFirestore(updated);
      showToast(`${channelKey.toUpperCase()} সেটিংস আপডেট হয়েছে`, 'success');
      return updated;
    });
  };

  const updatePaymentChannelNumber = (channelKey, newNumber) => {
    updatePaymentChannelDetails(channelKey, { number: newNumber });
  };

  return (
    <AppContext.Provider value={{
      // Router
      currentRoute,
      navigate,
      activeAdminTab,
      setActiveAdminTab,

      // App Data
      products,
      orders,
      users,
      notice,
      paymentChannels,
      toasts,
      showToast,
      selectedProduct,
      selectedPackage,
      setSelectedPackage,
      isTopupOpen,
      setIsTopupOpen,
      isWalletOpen,
      setIsWalletOpen,
      isOrdersHistoryOpen,
      setIsOrdersHistoryOpen,
      isOrderTrackerOpen,
      setIsOrderTrackerOpen,
      orderTrackerQuery,
      setOrderTrackerQuery,
      openOrderTracker,
      isAdminOpen,
      setIsAdminOpen,
      isNotifOpen,
      setIsNotifOpen,
      activeReceipt,
      setActiveReceipt,
      startTopup,
      placeOrder,
      addFundsToWallet,
      submitWalletRechargeRequest,
      walletRequests,
      notifications,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      
      // Admin Operations
      approveWalletRecharge,
      rejectWalletRecharge,
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
      updatePaymentChannelNumber
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
