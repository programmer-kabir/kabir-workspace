import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Home, Zap, Wallet, History, User } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const BottomMobileNav = () => {
  const { 
    setIsTopupOpen, 
    products, 
    setSelectedProduct, 
    setSelectedPackage, 
    setIsWalletOpen, 
    setIsOrdersHistoryOpen,
    showToast,
    navigate
  } = useApp();
  
  const { currentUser } = useAuth();

  const handleTopupClick = () => {
    sounds.playClick();
    if (products.length > 0) {
      setSelectedProduct(products[0]);
      setSelectedPackage(products[0].packages[0]);
      setIsTopupOpen(true);
    }
  };

  const handleAccountClick = () => {
    sounds.playClick();
    if (currentUser) {
      setIsOrdersHistoryOpen(true);
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-15 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-40 flex justify-around items-center shadow-lg px-1">
      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-sky-500 font-bold text-[11px] cursor-pointer" 
        onClick={() => {
          sounds.playClick();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Home size={19} />
        <span className="mt-0.5">হোম</span>
      </button>

      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-sky-500 font-semibold text-[11px] cursor-pointer"
        onClick={handleTopupClick}
      >
        <Zap size={19} className="text-sky-500" />
        <span className="mt-0.5 text-sky-500">টপ-আপ</span>
      </button>

      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-sky-500 text-[11px] font-medium cursor-pointer"
        onClick={() => {
          sounds.playClick();
          if (currentUser) {
            setIsWalletOpen(true);
          } else {
            showToast('ওয়ালেট রিচার্জ করতে অনুগ্রহ করে লগইন করুন', 'info');
            navigate('/login');
          }
        }}
      >
        <Wallet size={19} />
        <span className="mt-0.5">ওয়ালেট</span>
      </button>

      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-sky-500 text-[11px] font-medium cursor-pointer"
        onClick={() => {
          sounds.playClick();
          setIsOrdersHistoryOpen(true);
        }}
      >
        <History size={19} />
        <span className="mt-0.5">অর্ডার</span>
      </button>

      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-sky-500 text-[11px] font-medium cursor-pointer"
        id="mobile-nav-account-btn"
        onClick={handleAccountClick}
      >
        <User size={19} className={currentUser ? 'text-sky-500' : ''} />
        <span className="mt-0.5">{currentUser ? currentUser.displayName.split(' ')[0] : 'লগইন'}</span>
      </button>
    </nav>
  );
};
