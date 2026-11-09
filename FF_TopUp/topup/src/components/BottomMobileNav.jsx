import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Home, Zap, Wallet, History, User } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const BottomMobileNav = () => {
  const { 
    startTopup, 
    products, 
    setIsWalletOpen, 
    setIsOrdersHistoryOpen,
    navigate
  } = useApp();
  
  const { currentUser } = useAuth();

  const handleTopupClick = () => {
    sounds.playClick();
    if (products && products.length > 0) {
      startTopup(products[0]);
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 border-t border-slate-200 backdrop-blur-xl z-40 flex justify-around items-center px-1 shadow-lg">
      
      {/* Home */}
      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-sky-600 font-bold text-[10px] cursor-pointer transition-colors" 
        onClick={() => {
          sounds.playClick();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Home size={19} />
        <span className="mt-1">হোম</span>
      </button>

      {/* Orders */}
      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-sky-600 font-semibold text-[10px] cursor-pointer transition-colors"
        onClick={() => {
          sounds.playClick();
          setIsOrdersHistoryOpen(true);
        }}
      >
        <History size={19} />
        <span className="mt-1">অর্ডার</span>
      </button>

      {/* Center Floating Top-Up Button */}
      <div className="flex flex-col items-center justify-center flex-1 -mt-5">
        <button 
          onClick={handleTopupClick}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-3 border-white"
          title="এখনই টপ-আপ করুন"
        >
          <Zap size={22} className="fill-current text-white" />
        </button>
        <span className="text-[10px] font-black text-sky-600 mt-1">টপ-আপ</span>
      </div>

      {/* Wallet */}
      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-sky-600 font-semibold text-[10px] cursor-pointer transition-colors"
        onClick={() => {
          sounds.playClick();
          setIsWalletOpen(true);
        }}
      >
        <Wallet size={19} />
        <span className="mt-1">ওয়ালেট</span>
      </button>

      {/* Account / Login */}
      <button 
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-sky-600 font-semibold text-[10px] cursor-pointer transition-colors"
        onClick={handleAccountClick}
      >
        <User size={19} />
        <span className="mt-1">{currentUser ? 'প্রোফাইল' : 'লগইন'}</span>
      </button>

    </nav>
  );
};
