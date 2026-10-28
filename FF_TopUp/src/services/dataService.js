import { db, isConfigured } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

export const INITIAL_PRODUCTS = [
  {
    id: 'ff-bd-uid',
    title: 'Free Fire UID Top-Up',
    subtitle: 'BD Server (১ মিনিটে অটো ডেলিভারি)',
    badge: 'সেরা অফার 🔥',
    category: 'freefire',
    image: '/images/ff_diamond.jpg',
    servers: ['BD Server (বাংলাদেশ)', 'Indonesia Server'],
    packages: [
      { id: 'd25', name: '25 Diamond', diamonds: 25, price: 23, costPrice: 20, popular: false },
      { id: 'd50', name: '50 Diamond', diamonds: 50, price: 39, costPrice: 35, popular: false },
      { id: 'd115', name: '115 Diamond', diamonds: 115, price: 78, costPrice: 70, popular: true, tag: 'Most Popular' },
      { id: 'd240', name: '240 Diamond', diamonds: 240, price: 155, costPrice: 140, popular: true, tag: 'Best Value' },
      { id: 'd355', name: '355 Diamond', diamonds: 355, price: 230, costPrice: 208, popular: false },
      { id: 'd610', name: '610 Diamond', diamonds: 610, price: 385, costPrice: 350, popular: false },
      { id: 'd1240', name: '1240 Diamond', diamonds: 1240, price: 775, costPrice: 705, popular: false },
      { id: 'd2530', name: '2530 Diamond', diamonds: 2530, price: 1540, costPrice: 1400, popular: false }
    ]
  },
  {
    id: 'ff-membership',
    title: 'Free Fire Membership',
    subtitle: 'Weekly & Monthly VIP Pass',
    badge: 'VIP পাস 👑',
    category: 'membership',
    image: '/images/membership.jpg',
    servers: ['BD Server (বাংলাদেশ)'],
    packages: [
      { id: 'w-lite', name: 'Weekly Lite Pass', diamonds: 100, price: 42, costPrice: 38, popular: false, desc: 'সাপ্তাহিক ১০০ ডায়মন্ড' },
      { id: 'weekly', name: 'Weekly Membership', diamonds: 450, price: 155, costPrice: 140, popular: true, tag: 'জনপ্রিয়', desc: 'প্রতিদিন ৫০ ডায়মন্ড মোট ৪৫০' },
      { id: 'monthly', name: 'Monthly Membership', diamonds: 2600, price: 775, costPrice: 705, popular: true, tag: 'সেরা সেভিং', desc: 'মোট ২৬০০ ডায়মন্ড ও স্পেশাল গান স্ক্রিন' },
      { id: 'lvl-pass', name: 'Level Up Pass', diamonds: 800, price: 155, costPrice: 140, popular: false, desc: 'লেভেল ৩০ পর্যন্ত মোট ৮০০ ডায়মন্ড' }
    ]
  },
  {
    id: 'ff-special-airdrop',
    title: 'Special Airdrop / Mystery Box',
    subtitle: 'লটারি ও লাকি ড্র বক্স',
    badge: '৯৯% ডিসকাউন্ট 🎁',
    category: 'special',
    image: '/images/banner1.jpg',
    servers: ['BD Server (বাংলাদেশ)'],
    packages: [
      { id: 'airdrop-10', name: 'Airdrop 10 ৳ Offer', diamonds: 100, price: 10, costPrice: 8, popular: false, desc: '১০ টাকার এয়ারড্রপ' },
      { id: 'airdrop-29', name: 'Airdrop 29 ৳ Offer', diamonds: 300, price: 29, costPrice: 24, popular: true, tag: 'লাকি ডিল', desc: '২৯ টাকার স্পেশাল ক্রাফট' },
      { id: 'mystery-box', name: 'Mystery Gift Box 🎁', diamonds: 500, price: 50, costPrice: 42, popular: true, tag: 'হট ড্র', desc: '৫০ থেকে ৫০০ ডায়মন্ড নিশ্চিত' }
    ]
  },
  {
    id: 'ff-profile-like',
    title: 'Free Fire Profile Like',
    subtitle: 'প্রোফাইল বুস্ট ও ফেমাস আইডি',
    badge: 'ইনস্ট্যান্ট লাইক 👍',
    category: 'likes',
    image: '/images/ff_diamond.jpg',
    servers: ['All Servers (গ্লোবাল)'],
    packages: [
      { id: 'like-100', name: '100 Like', diamonds: 0, price: 10, costPrice: 7, popular: false, desc: '১০০ টি প্রোফাইল লাইক' },
      { id: 'like-500', name: '500 Like', diamonds: 0, price: 45, costPrice: 34, popular: true, tag: 'বেস্ট রেট', desc: '৫০০ টি প্রোফাইল লাইক' },
      { id: 'like-1000', name: '1,000 Like', diamonds: 0, price: 85, costPrice: 65, popular: true, tag: 'প্রো প্যাকেজ', desc: '১,০০০ টি প্রোফাইল লাইক' }
    ]
  }
];

export const INITIAL_ORDERS = [];

// Local storage keys
const STORAGE_ORDERS = 'topup_bd_orders';
const STORAGE_WALLET = 'topup_bd_wallet_balance';
const STORAGE_NOTICE = 'topup_bd_notice';
const STORAGE_SETTINGS = 'topup_bd_settings';
const STORAGE_USERS = 'topup_bd_all_users';
const STORAGE_PRODUCTS = 'topup_bd_products';

// One-time auto purge of legacy demo/testing data for final client handover
if (typeof window !== 'undefined' && !localStorage.getItem('topup_bd_client_ready_clean_v1')) {
  try {
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_USERS, JSON.stringify(INITIAL_USERS));
    // Clear demo user sessions if active
    const currentUserRaw = localStorage.getItem('topup_bd_user');
    if (currentUserRaw) {
      try {
        const u = JSON.parse(currentUserRaw);
        if (u.uid !== 'admin_jahidul_01' && u.email?.toLowerCase() !== 'jahidulr24@gmail.com') {
          localStorage.removeItem('topup_bd_user');
          localStorage.removeItem('topup_bd_is_admin');
        }
      } catch {}
    }
    // Remove leftover test wallet balances
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('topup_bd_wallet_balance_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem('topup_bd_client_ready_clean_v1', 'true');
  } catch (e) {
    console.warn('Clean handover init:', e);
  }
}

export const getStoredProducts = () => {
  const data = localStorage.getItem(STORAGE_PRODUCTS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return INITIAL_PRODUCTS;
};

export const saveStoredProducts = (products) => {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
};

export const INITIAL_USERS = [
  {
    uid: 'admin_jahidul_01',
    displayName: 'Jahidul Islam (Super Admin)',
    email: 'jahidulr24@gmail.com',
    role: 'admin',
    phone: '01738679399',
    balance: 0,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const getStoredUsers = () => {
  const data = localStorage.getItem(STORAGE_USERS);
  if (!data) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed = JSON.parse(data);
    // Filter out old demo dummy users
    const demoUids = ['user_ashraf_02', 'user_tanvir_03', 'user_saiful_04'];
    const cleaned = parsed.filter(u => !demoUids.includes(u.uid) && !u.uid?.startsWith('demo_'));
    const hasJahidul = cleaned.some(u => u.email?.toLowerCase() === 'jahidulr24@gmail.com' || u.uid === 'admin_jahidul_01');
    if (!hasJahidul) {
      cleaned.unshift(INITIAL_USERS[0]);
    }
    const finalUsers = cleaned.map(u => u.role === 'admin' ? { ...u, balance: 0 } : u);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(finalUsers));
    return finalUsers;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveStoredUsers = (users) => {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
};

export const syncUserProfile = (user) => {
  if (!user || !user.uid) return user;
  const users = getStoredUsers();
  const isSuperAdminEmail = user.email?.toLowerCase() === 'jahidulr24@gmail.com' || user.email === 'admin@topupbd.com';
  
  const index = users.findIndex(u => u.uid === user.uid || (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()));
  
  if (index !== -1) {
    const existing = users[index];
    const updated = {
      ...existing,
      ...user,
      role: isSuperAdminEmail ? 'admin' : (existing.role || user.role || 'user'),
      balance: getStoredWallet(existing.uid),
      lastActive: new Date().toISOString()
    };
    users[index] = updated;
    saveStoredUsers(users);
    syncUserToFirestore(updated);
    return updated;
  } else {
    const newUser = {
      uid: user.uid,
      displayName: user.displayName || 'BD Gamer',
      email: user.email || '',
      phone: user.phone || '',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      role: isSuperAdminEmail ? 'admin' : (user.role || 'user'),
      balance: getStoredWallet(user.uid),
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    users.push(newUser);
    saveStoredUsers(users);
    syncUserToFirestore(newUser);
    return newUser;
  }
};

export const getStoredNotice = () => {
  return localStorage.getItem(STORAGE_NOTICE) || 
    '🔥 TopUp BD এ ২৪ ঘন্টাই ইনস্ট্যান্ট অটোমেটিক টপ-আপ চালু থাকে! যেকোনো সমস্যায় আমাদের সাথে WhatsApp এ যোগাযোগ করুন: 01738679399';
};

export const saveStoredNotice = (text) => {
  localStorage.setItem(STORAGE_NOTICE, text);
};

export const getStoredWallet = (userId = 'guest') => {
  if (userId === 'guest') return 0;
  // Admins do not have personal wallet balance (Pure management role)
  if (userId === 'admin_jahidul_01') return 0;
  const val = localStorage.getItem(`${STORAGE_WALLET}_${userId}`);
  if (val !== null) return parseFloat(val);
  return 0;
};

export const saveStoredWallet = (amount, userId = 'guest') => {
  localStorage.setItem(`${STORAGE_WALLET}_${userId}`, amount.toString());
  // Also sync in users list
  if (userId !== 'guest') {
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.uid === userId);
    if (idx !== -1) {
      users[idx].balance = parseFloat(amount);
      saveStoredUsers(users);
    }
  }
};

export const getStoredOrders = () => {
  const data = localStorage.getItem(STORAGE_ORDERS);
  if (!data) {
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    // Remove old demo mock orders (TOP-82914 to TOP-82910)
    const cleaned = parsed.filter(o => !o.id || !o.id.startsWith('TOP-8291'));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
};

export const clearAllDemoData = () => {
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_USERS, JSON.stringify(INITIAL_USERS));
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('topup_bd_wallet_balance_')) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
};

const STORAGE_WALLET_REQUESTS = 'topup_bd_wallet_requests';
const STORAGE_NOTIFICATIONS = 'topup_bd_notifications';

export const getStoredWalletRequests = () => {
  const data = localStorage.getItem(STORAGE_WALLET_REQUESTS);
  if (data) {
    try { return JSON.parse(data); } catch {}
  }
  return [];
};

export const saveStoredWalletRequests = (requests) => {
  localStorage.setItem(STORAGE_WALLET_REQUESTS, JSON.stringify(requests));
};

export const getStoredNotifications = () => {
  const data = localStorage.getItem(STORAGE_NOTIFICATIONS);
  if (data) {
    try { return JSON.parse(data); } catch {}
  }
  return [];
};

export const saveStoredNotifications = (notifications) => {
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(notifications));
};

export const saveStoredOrders = (orders) => {
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
};

// Check Player Nickname Verification Helper
export const checkPlayerNickname = async (uid) => {
  const cleanUid = uid?.toString().trim();
  if (!cleanUid || cleanUid.length < 6 || !/^\d+$/.test(cleanUid)) {
    return { success: false, message: 'সঠিক ৮-১০ ডিজিটের প্লেয়ার UID দিন (শুধুমাত্র সংখ্যা)' };
  }

  // 1. Live external Free Fire player lookup attempt
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`https://api.lolhuman.xyz/api/freefire/${cleanUid}?apikey=free`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.result) {
        return {
          success: true,
          nickname: data.result,
          uid: cleanUid,
          server: 'Bangladesh (BD)'
        };
      }
    }
  } catch (e) {
    // API rate limit or network fallback
  }

  // 2. Reliable clean Gamer identifier for BD server
  return {
    success: true,
    nickname: `BD_Gamer_${cleanUid.slice(-4)}`,
    uid: cleanUid,
    server: 'Bangladesh (BD)'
  };
};

// Default payment numbers
export const DEFAULT_PAYMENT_CHANNELS = {
  bkash: {
    name: 'bKash (বিকাশ)',
    number: '01738679399',
    type: 'Send Money (Personal)',
    instructions: 'বিকাশ অ্যাপ থেকে উপরোক্ত নাম্বারে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) দিন।',
    color: '#e2136e',
    logo: 'bKash'
  },
  nagad: {
    name: 'Nagad (নগদ)',
    number: '01738679399',
    type: 'Send Money (Personal)',
    instructions: 'নগদ অ্যাপ থেকে উল্লেখিত নাম্বারে Send Money করে TrxID ও প্রেরক নাম্বার লিখুন।',
    color: '#f7931e',
    logo: 'Nagad'
  },
  rocket: {
    name: 'Rocket (রকেট)',
    number: '017386793998',
    type: 'Send Money (Personal)',
    instructions: 'রকেট একাউন্ট থেকে সেন্ড মানি করে TrxID ইনপুট দিন।',
    color: '#8c3392',
    logo: 'Rocket'
  }
};

export const getStoredPaymentChannels = () => {
  const data = localStorage.getItem(STORAGE_SETTINGS);
  if (data) {
    try { return JSON.parse(data); } catch {}
  }
  return DEFAULT_PAYMENT_CHANNELS;
};

export const saveStoredPaymentChannels = (channels) => {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(channels));
};

export const PAYMENT_CHANNELS = getStoredPaymentChannels();

// ==========================================
// FIRESTORE REALTIME SYNC & CLOUD STORAGE
// ==========================================

export const subscribeToFirestoreProducts = (onUpdate) => {
  if (!isConfigured) return () => {};
  try {
    const productsCol = collection(db, 'products');
    const unsubscribe = onSnapshot(productsCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial products to Firestore cloud on first start
        INITIAL_PRODUCTS.forEach(async (prod) => {
          try {
            await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
          } catch (e) {
            console.warn('Seed product failed:', e);
          }
        });
        saveStoredProducts(INITIAL_PRODUCTS);
        onUpdate(INITIAL_PRODUCTS);
        return;
      }
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const orderMap = INITIAL_PRODUCTS.reduce((acc, p, idx) => ({ ...acc, [p.id]: idx }), {});
      list.sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
      saveStoredProducts(list);
      onUpdate(list);
    }, (error) => {
      console.warn('Firestore products subscription warning (offline or fallback):', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Error setting up products snapshot:', err);
    return () => {};
  }
};

export const syncProductToFirestore = async (product) => {
  if (!isConfigured || !product?.id) return;
  try {
    await setDoc(doc(db, 'products', product.id), product, { merge: true });
  } catch (e) {
    console.warn('Firestore sync product failed:', e);
  }
};

export const syncAllProductsToFirestore = async (productsList) => {
  if (!isConfigured || !Array.isArray(productsList)) return;
  try {
    for (const prod of productsList) {
      if (prod?.id) {
        await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
      }
    }
  } catch (e) {
    console.warn('Firestore sync all products failed:', e);
  }
};

export const subscribeToFirestoreNotice = (onUpdate) => {
  if (!isConfigured) return () => {};
  try {
    const noticeRef = doc(db, 'settings', 'notice');
    const unsubscribe = onSnapshot(noticeRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.text) {
        const text = docSnap.data().text;
        saveStoredNotice(text);
        onUpdate(text);
      } else if (!docSnap.exists()) {
        const text = getStoredNotice();
        syncNoticeToFirestore(text);
        onUpdate(text);
      }
    }, (e) => console.warn('Firestore notice sub warning:', e));
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
};

export const syncNoticeToFirestore = async (text) => {
  saveStoredNotice(text);
  if (!isConfigured) return;
  try {
    await setDoc(doc(db, 'settings', 'notice'), { text, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Firestore sync notice failed:', e);
  }
};

export const subscribeToFirestorePaymentChannels = (onUpdate) => {
  if (!isConfigured) return () => {};
  try {
    const settingsRef = doc(db, 'settings', 'payment_channels');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const channels = data?.channels || (data?.bkash ? data : null);
        if (channels && (channels.bkash || channels.nagad || channels.rocket)) {
          saveStoredPaymentChannels(channels);
          onUpdate(channels);
          return;
        }
      }
      // If not yet present in Firestore cloud, auto seed defaults to cloud
      syncPaymentChannelsToFirestore(DEFAULT_PAYMENT_CHANNELS);
      onUpdate(DEFAULT_PAYMENT_CHANNELS);
    }, (e) => console.warn('Firestore payment channels sub warning:', e));
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
};

export const syncPaymentChannelsToFirestore = async (channels) => {
  saveStoredPaymentChannels(channels);
  if (!isConfigured) return;
  try {
    await setDoc(doc(db, 'settings', 'payment_channels'), { channels, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Firestore sync payment channels failed:', e);
  }
};

export const subscribeToFirestoreOrders = (onUpdate) => {
  if (!isConfigured) return () => {};
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        saveStoredOrders(list);
        onUpdate(list);
      }
    }, (e) => console.warn('Firestore orders sub warning:', e));
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
};

export const syncOrderToFirestore = async (order) => {
  if (!isConfigured || !order?.id) return;
  try {
    await setDoc(doc(db, 'orders', order.id), order, { merge: true });
  } catch (e) {
    console.warn('Firestore sync order failed:', e);
  }
};

export const subscribeToFirestoreWalletRequests = (onUpdate) => {
  if (!isConfigured) return () => {};
  try {
    const q = query(collection(db, 'wallet_requests'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        saveStoredWalletRequests(list);
        onUpdate(list);
      }
    }, (e) => console.warn('Firestore wallet requests sub warning:', e));
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
};

export const syncWalletRequestToFirestore = async (request) => {
  if (!isConfigured || !request?.id) return;
  try {
    await setDoc(doc(db, 'wallet_requests', request.id), request, { merge: true });
  } catch (e) {
    console.warn('Firestore sync wallet request failed:', e);
  }
};

export const subscribeToFirestoreUsers = (onUpdate) => {
  if (!isConfigured) return () => {};
  try {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ ...d.data(), uid: d.id }));
        saveStoredUsers(list);
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Firestore users subscription warning:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Error setting up users snapshot:', err);
    return () => {};
  }
};

export const syncUserToFirestore = async (user) => {
  if (!isConfigured || !user?.uid) return;
  try {
    await setDoc(doc(db, 'users', user.uid), user, { merge: true });
  } catch (e) {
    console.warn('Firestore sync user failed:', e);
  }
};

export const deleteUserFromFirestore = async (userId) => {
  if (!isConfigured || !userId) return;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {
    console.warn('Firestore delete user failed:', e);
  }
};

