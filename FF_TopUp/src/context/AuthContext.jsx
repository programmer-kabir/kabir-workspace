import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  isConfigured, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from '../services/firebase';
import { 
  getStoredWallet, 
  saveStoredWallet, 
  syncUserProfile, 
  getStoredUsers 
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

  // Listen to real-time Firebase Auth state changes
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const isSuper = isUserAdmin(firebaseUser.email);
          const rawProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'BD Gamer',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
            role: isSuper ? 'admin' : 'user',
            provider: firebaseUser.providerData?.[0]?.providerId || 'firebase'
          };
          const profile = syncUserProfile(rawProfile);
          setCurrentUser(profile);
          localStorage.setItem('topup_bd_user', JSON.stringify(profile));
          if (profile.role === 'admin') {
            setIsAdmin(true);
            localStorage.setItem('topup_bd_is_admin', 'true');
          } else {
            setIsAdmin(false);
            localStorage.removeItem('topup_bd_is_admin');
          }
        } else {
          // If logged out from Firebase, check if current stored session is a local 'quick' guest profile or admin
          const saved = localStorage.getItem('topup_bd_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && (parsed.provider === 'quick' || parsed.role === 'admin')) {
                setCurrentUser(parsed);
                if (parsed.role === 'admin') setIsAdmin(true);
                setAuthLoading(false);
                return;
              }
            } catch {
              // ignore
            }
          }
          setCurrentUser(null);
          localStorage.removeItem('topup_bd_user');
          setIsAdmin(false);
          localStorage.removeItem('topup_bd_is_admin');
        }
        setAuthLoading(false);
      });
    } catch (e) {
      console.warn('Auth state listener init error:', e);
      setAuthLoading(false);
    }

    return () => unsubscribe();
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

  // Google 1-Click Login
  const loginWithGoogle = async () => {
    sounds.playClick();
    if (!isConfigured) {
      return { 
        success: false, 
        code: 'not-configured', 
        message: 'Firebase কনফিগারেশন সক্রিয় নেই।' 
      };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isSuper = isUserAdmin(user.email);
      const rawProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Gamer BD',
        email: user.email || '',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: isSuper ? 'admin' : 'user',
        provider: 'google.com'
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
    } catch (err) {
      console.warn('Google sign-in error:', err);
      let message = 'গুগল লগইন করতে সমস্যা হয়েছে।';
      if (err.code === 'auth/configuration-not-found') {
        message = 'Firebase Console-এ Authentication চালু করা প্রয়োজন (Console > Build > Authentication > "Get started" এবং Google এনেবল করুন)। আপনি নিচে "দ্রুত গেমিং লগইন" ব্যবহার করতে পারেন।';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'লগইন উইন্ডো বন্ধ করা হয়েছে।';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজারের পপআপ পারমিশন দিন।';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'এই ডোমেইনটি Firebase Console এর Authorized Domains তালিকায় যুক্ত করতে হবে।';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, code: err.code, message };
    }
  };

  // Email & Password Sign In
  const loginWithEmail = async (email, password) => {
    sounds.playClick();
    if (!email || !password) {
      return { success: false, message: 'ইমেইল এবং পাসওয়ার্ড দুটিই পূরণ করুন।' };
    }
    const cleanEmail = email.trim().toLowerCase();

    // Check if this is the Master Admin account specified by the user
    if (cleanEmail === 'jahidulr24@gmail.com' && password === '123456') {
      const adminProfile = {
        uid: 'admin_jahidul_01',
        displayName: 'Jahidul Islam (Super Admin)',
        email: 'jahidulr24@gmail.com',
        role: 'admin',
        phone: '01738679399',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        provider: 'password'
      };

      // Try background sync with Firebase if active
      if (isConfigured) {
        signInWithEmailAndPassword(auth, cleanEmail, password).catch(() => {
          createUserWithEmailAndPassword(auth, cleanEmail, password).catch(() => {});
        });
      }

      const synced = syncUserProfile(adminProfile);
      setCurrentUser(synced);
      setIsAdmin(true);
      localStorage.setItem('topup_bd_user', JSON.stringify(synced));
      localStorage.setItem('topup_bd_is_admin', 'true');
      sounds.playSuccess();
      return { success: true, user: synced };
    }

    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = res.user;
      const isSuper = isUserAdmin(user.email);
      const rawProfile = {
        uid: user.uid,
        displayName: user.displayName || email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: isSuper ? 'admin' : 'user',
        provider: 'password'
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
    } catch (err) {
      console.warn('Email login error:', err);
      let message = 'লগইন ব্যর্থ হয়েছে।';
      if (err.code === 'auth/configuration-not-found') {
        message = 'Firebase Console-এ Authentication চালু করা নেই। Console থেকে Email/Password এনেবল করুন অথবা "দ্রুত গেমিং লগইন" ব্যবহার করুন।';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'ভুল ইমেইল অথবা পাসওয়ার্ড প্রদান করেছেন।';
      } else if (err.code === 'auth/invalid-email') {
        message = 'সঠিক ইমেইল অ্যাড্রেস লিখুন।';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, code: err.code, message };
    }
  };

  // Register New Account with Email & Password
  const registerWithEmail = async (email, password, displayName) => {
    sounds.playClick();
    if (!email || !password) {
      return { success: false, message: 'ইমেইল এবং পাসওয়ার্ড আবশ্যক।' };
    }
    if (password.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = res.user;
      if (displayName) {
        try {
          await updateProfile(user, { displayName: displayName.trim() });
        } catch {
          // ignore
        }
      }
      const isSuper = isUserAdmin(user.email);
      const rawProfile = {
        uid: user.uid,
        displayName: displayName?.trim() || email.split('@')[0],
        email: user.email,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: isSuper ? 'admin' : 'user',
        provider: 'password'
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
    } catch (err) {
      console.warn('Register error:', err);
      let message = 'অ্যাকাউন্ট তৈরি করা যায়নি।';
      if (err.code === 'auth/configuration-not-found') {
        message = 'Firebase Console-এ Authentication সক্রিয় করা হয়নি। অথবা নিচের "দ্রুত গেমিং লগইন" বেছে নিন।';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট রয়েছে। লগইন ট্যাব থেকে প্রবেশ করুন।';
      } else if (err.code === 'auth/weak-password') {
        message = 'পাসওয়ার্ড অত্যন্ত দুর্বল, কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড দিন।';
      } else if (err.code === 'auth/invalid-email') {
        message = 'সঠিক ইমেইল অ্যাড্রেস লিখুন।';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, code: err.code, message };
    }
  };

  // Instant Quick / Phone / Gamer Profile Login (Works without Firebase Console setup)
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
    try {
      await sendPasswordResetEmail(auth, email.trim());
      sounds.playSuccess();
      return { success: true, message: 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।' };
    } catch (err) {
      let message = 'পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো সম্ভব হয়নি।';
      if (err.code === 'auth/user-not-found') {
        message = 'এই ইমেইলের কোনো অ্যাকাউন্ট পাওয়া যায়নি।';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, message };
    }
  };

  // Logout
  const logout = async () => {
    sounds.playClick();
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('SignOut error:', e);
    }
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
