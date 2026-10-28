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
    showToast 
  } = useApp();
  
  const { currentUser, setIsLoginModalOpen } = useAuth();

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
      setIsLoginModalOpen(true);
    }
  };

  return (
    <nav className="bottom-mobile-nav">
      <button 
        className="mobile-nav-item active" 
        onClick={() => {
          sounds.playClick();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Home size={20} />
        <span>হোম</span>
      </button>

      <button 
        className="mobile-nav-item"
        onClick={handleTopupClick}
      >
        <Zap size={20} color="var(--primary)" />
        <span style={{ color: 'var(--primary)' }}>টপ-আপ</span>
      </button>

      <button 
        className="mobile-nav-item"
        onClick={() => {
          sounds.playClick();
          if (currentUser) {
            setIsWalletOpen(true);
          } else {
            showToast('ওয়ালেট রিচার্জ করতে অনুগ্রহ করে লগইন করুন', 'info');
            setIsLoginModalOpen(true);
          }
        }}
      >
        <Wallet size={20} />
        <span>ওয়ালেট</span>
      </button>

      <button 
        className="mobile-nav-item"
        onClick={() => {
          sounds.playClick();
          setIsOrdersHistoryOpen(true);
        }}
      >
        <History size={20} />
        <span>অর্ডার</span>
      </button>

      <button 
        className="mobile-nav-item"
        id="mobile-nav-account-btn"
        onClick={handleAccountClick}
      >
        <User size={20} color={currentUser ? 'var(--primary)' : 'inherit'} />
        <span>{currentUser ? currentUser.displayName.split(' ')[0] : 'লগইন'}</span>
      </button>
    </nav>
  );
};
