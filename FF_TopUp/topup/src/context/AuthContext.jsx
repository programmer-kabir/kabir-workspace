import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getStoredWallet, 
  saveStoredWallet, 
  syncUserProfile, 
  getStoredUsers,
  loginUserOnServer,
  registerUserOnServer,
  syncUserToServer
} from '../services/dataService';
import { sounds } from '../services/soundEffects';

const AuthContext = createContext();

export const isUserAdmin = (email, role) => {
  if (!email && !role) return false;
  const cleanEmail = email?.trim().toLowerCase();
  if (cleanEmail === 'jahidulr24@gmail.com' || cleanEmail === 'admin@topupbd.com') return true;
  if (role === 'admin') return true;
  try {
    const storedUsers = getStoredUsers();
    const found = storedUsers.find(u => u.email?.toLowerCase() === cleanEmail);
    return found?.role === 'admin';
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  // Read saved profile if available, otherwise null (clean guest state)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('topup_bd_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (isUserAdmin(parsed.email, parsed.role)) {
          parsed.role = 'admin';
        }
        return parsed; 
      } catch { 
        return null; 
      }
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [walletBalance, setWalletBalance] = useState(() => {
    return getStoredWallet(currentUser ? currentUser.uid : 'guest');
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    if (currentUser && isUserAdmin(currentUser.email, currentUser.role)) return true;
    return localStorage.getItem('topup_bd_is_admin') === 'true';
  });

  // Load active session from local storage on startup
  useEffect(() => {
    const saved = localStorage.getItem('topup_bd_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (isUserAdmin(parsed.email, parsed.role)) {
            parsed.role = 'admin';
            setIsAdmin(true);
            localStorage.setItem('topup_bd_is_admin', 'true');
          }
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.warn('Session parse error:', e);
      }
    }
    setAuthLoading(false);
  }, []);

  // Update wallet whenever active user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin' || isAdmin) {
        setWalletBalance(0);
        return;
      }
      const bal = getStoredWallet(currentUser.uid);
      setWalletBalance(bal);
    } else {
      const bal = getStoredWallet('guest');
      setWalletBalance(bal);
    }
  }, [currentUser, isAdmin]);

  // Update wallet helper
  const updateBalance = (delta) => {
    if (isAdmin || currentUser?.role === 'admin') {
      return 0; // Admin holds no personal wallet balance
    }
    const newBal = Math.max(0, walletBalance + delta);
    setWalletBalance(newBal);
    saveStoredWallet(newBal, currentUser ? currentUser.uid : 'guest');
    sounds.playCoin();
    return newBal;
  };

  // Google login disabled (Pure MySQL Auth)
  const loginWithGoogle = async () => {
    sounds.playClick();
    return { 
      success: false, 
      message: 'গুগল লগইন বর্তমানে বন্ধ রয়েছে। প্লেয়ার UID অথবা ইমেইল দিয়ে লগইন করুন।' 
    };
  };

  // Pure MySQL Auth (Email / Player UID + Password)
  const loginWithEmail = async (identifier, password) => {
    sounds.playClick();
    if (!identifier || !password) {
      return { success: false, message: 'ইউজারনেম/UID/ইমেইল এবং পাসওয়ার্ড দুটিই পূরণ করুন।' };
    }
    const cleanIdentifier = identifier.trim();

    // 1. Primary Authentication with PHP + MySQL Server
    const serverRes = await loginUserOnServer(cleanIdentifier, password);
    if (serverRes.success && serverRes.user) {
      const u = serverRes.user;
      const isSuper = isUserAdmin(u.email, u.role);
      const userProfile = {
        uid: u.uid,
        displayName: u.displayName || cleanIdentifier.split('@')[0],
        email: u.email || '',
        phone: u.phone || '',
        playerUid: u.playerUid || '',
        photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
        role: isSuper ? 'admin' : (u.role || 'user'),
        walletBalance: Number(u.walletBalance || 0),
        provider: 'mysql'
      };

      const synced = syncUserProfile(userProfile);
      setCurrentUser(synced);
      localStorage.setItem('topup_bd_user', JSON.stringify(synced));
      if (synced.role === 'admin') {
        setIsAdmin(true);
        localStorage.setItem('topup_bd_is_admin', 'true');
      } else {
        setIsAdmin(false);
        localStorage.removeItem('topup_bd_is_admin');
      }
      sounds.playSuccess();
      return { success: true, user: synced };
    } else if (!serverRes.fallback) {
      sounds.playError();
      return { success: false, message: serverRes.message || 'ভুল ইউজারনেম/UID অথবা পাসওয়ার্ড!' };
    }

    // 2. Offline Fallback for Master Admin
    if ((cleanIdentifier.toLowerCase() === 'jahidulr24@gmail.com' || cleanIdentifier === 'admin') && (password === '123456' || password === 'admin123')) {
      const adminProfile = {
        uid: 'admin_jahidul_01',
        displayName: 'Jahidul Islam (Super Admin)',
        email: 'jahidulr24@gmail.com',
        role: 'admin',
        phone: '01738679399',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        provider: 'mysql'
      };

      const synced = syncUserProfile(adminProfile);
      setCurrentUser(synced);
      setIsAdmin(true);
      localStorage.setItem('topup_bd_user', JSON.stringify(synced));
      localStorage.setItem('topup_bd_is_admin', 'true');
      sounds.playSuccess();
      return { success: true, user: synced };
    }

    sounds.playError();
    return { success: false, message: serverRes.message || 'লগইন ব্যর্থ হয়েছে।' };
  };

  // Register New Account with Email & Password & Player UID (Pure MySQL)
  const registerWithEmail = async (email, password, displayName, phone = '', playerUid = '') => {
    sounds.playClick();
    if (!email || !password) {
      return { success: false, message: 'ইমেইল এবং পাসওয়ার্ড আবশ্যক।' };
    }
    if (password.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }

    // Primary Registration on PHP + MySQL Server
    const serverRes = await registerUserOnServer({
      name: displayName || email.split('@')[0],
      email: email.trim().toLowerCase(),
      phone: phone || '',
      playerUid: playerUid || '',
      password
    });

    if (serverRes.success && serverRes.user) {
      const u = serverRes.user;
      const isSuper = isUserAdmin(u.email, u.role);
      const userProfile = {
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        phone: u.phone,
        playerUid: u.playerUid || playerUid,
        photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
        role: isSuper ? 'admin' : (u.role || 'user'),
        walletBalance: Number(u.walletBalance || 0),
        provider: 'mysql'
      };
      const synced = syncUserProfile(userProfile);
      setCurrentUser(synced);
      localStorage.setItem('topup_bd_user', JSON.stringify(synced));
      if (synced.role === 'admin') {
        setIsAdmin(true);
        localStorage.setItem('topup_bd_is_admin', 'true');
      }
      sounds.playSuccess();
      return { success: true, user: synced };
    }

    sounds.playError();
    return { success: false, message: serverRes.message || 'অ্যাকাউন্ট তৈরি করা যায়নি।' };
  };

  // Instant Quick / Phone / Gamer Profile Login
  const loginWithQuickProfile = ({ name, phone, gamerUid }) => {
    sounds.playClick();
    const cleanName = (name && name.trim()) || 'BD Pro Gamer';
    const cleanPhone = (phone && phone.trim()) || '017' + Math.floor(10000000 + Math.random() * 90000000);
    const cleanUid = 'gamer_' + (gamerUid?.trim() || Date.now().toString(36));
    const rawProfile = {
      uid: cleanUid,
      displayName: cleanName,
      phone: cleanPhone,
      email: `${cleanPhone}@topupbd.com`,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUid}`,
      role: 'user',
      provider: 'quick'
    };
    const profile = syncUserProfile(rawProfile);
    setCurrentUser(profile);
    localStorage.setItem('topup_bd_user', JSON.stringify(profile));
    if (profile.role === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('topup_bd_is_admin', 'true');
    }
    sounds.playSuccess();
    return { success: true, user: profile };
  };

  // Password Reset
  const resetPassword = async (email) => {
    sounds.playClick();
    if (!email) {
      return { success: false, message: 'আপনার ইমেইল অ্যাড্রেস দিন।' };
    }
    return { 
      success: true, 
      message: 'পাসওয়ার্ড রিসেটের জন্য অ্যাডমিন সাপোর্টের সাথে যোগাযোগ করুন।' 
    };
  };

  // Logout (Pure MySQL / Local Session)
  const logout = () => {
    sounds.playClick();
    setCurrentUser(null);
    localStorage.removeItem('topup_bd_user');
    setIsAdmin(false);
    localStorage.removeItem('topup_bd_is_admin');
    sounds.playSuccess();
  };

  // Toggle Admin Panel Mode
  const toggleAdminMode = (pin) => {
    if (pin === '7788' || pin === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('topup_bd_is_admin', 'true');
      sounds.playSuccess();
      return true;
    }
    sounds.playError();
    return false;
  };

  const exitAdminMode = () => {
    setIsAdmin(false);
    localStorage.removeItem('topup_bd_is_admin');
    sounds.playClick();
  };

  // Switch between Admin Mode and Customer/Gamer Account
  const switchToCustomerAccount = (targetUser = null) => {
    sounds.playClick();
    setIsAdmin(false);
    localStorage.removeItem('topup_bd_is_admin');

    const customerUser = targetUser || {
      uid: 'customer_' + Math.floor(1000 + Math.random() * 9000),
      displayName: 'Customer (গ্রাহক একাউন্ট)',
      email: 'customer@topupbd.com',
      role: 'user',
      phone: '01700000000',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=customer_bd',
      provider: 'quick'
    };

    setCurrentUser(customerUser);
    localStorage.setItem('topup_bd_user', JSON.stringify(customerUser));
    const bal = getStoredWallet(customerUser.uid) || 0;
    setWalletBalance(bal);
    sounds.playSuccess();
    return customerUser;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      authLoading,
      walletBalance,
      updateBalance,
      isLoginModalOpen,
      setIsLoginModalOpen,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      loginWithQuickProfile,
      resetPassword,
      logout,
      isAdmin,
      toggleAdminMode,
      exitAdminMode,
      switchToCustomerAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
