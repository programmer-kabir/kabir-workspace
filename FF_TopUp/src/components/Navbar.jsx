import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Zap,
  Wallet,
  Plus,
  ShieldCheck,
  History,
  User,
  LogOut,
  Settings,
  Sparkles,
  Crown,
  Bell,
  CheckCheck,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const Navbar = () => {
  const [isMuted, setIsMuted] = useState(() => sounds.isMuted());
  const {
    currentUser,
    walletBalance,
    logout,
    isAdmin,
    toggleAdminMode,
    exitAdminMode,
    switchToCustomerAccount,
    setIsLoginModalOpen
  } = useAuth();

  const { 
    setIsWalletOpen, 
    setIsOrdersHistoryOpen, 
    setIsAdminOpen, 
    openOrderTracker,
    navigate,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // User notifications
  const userNotifications = currentUser 
    ? (notifications || []).filter(n => n.userId === currentUser.uid || (!n.userId && !n.targetRole)) 
    : [];
  const unreadNotifCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.photoURL, currentUser?.uid]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showUserDropdown && !showNotifDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#navbar-user-avatar-btn') && !e.target.closest('#navbar-user-dropdown-menu')) {
        setShowUserDropdown(false);
      }
      if (!e.target.closest('#navbar-notif-btn') && !e.target.closest('#navbar-notif-dropdown-menu')) {
        setShowNotifDropdown(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showUserDropdown, showNotifDropdown]);

  const handleAdminTogglePrompt = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/admin');
    }
  };

  return (
    <header className="site-navbar">
      <div className="app-container">
        <div className="navbar-inner">

          {/* Brand Logo */}
          <a href="/" className="brand-logo-wrap" onClick={(e) => { e.preventDefault(); sounds.playClick(); navigate('/'); }}>
            <div className="brand-logo-icon">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <div className="brand-title">TOPUP BD</div>
              <div className="brand-subtitle">Bangladesh #1 Store</div>
            </div>
          </a>

          {/* Action Tools */}
          <div className="nav-actions">

            {/* Wallet Balance Pill - Only visible for non-admin logged-in users */}
            {currentUser && !isAdmin && (
              <div
                className="wallet-pill"
                id="navbar-wallet-btn"
                title="ওয়ালেট ব্যালেন্স (ক্লিক করে টাকা রিচার্জ করুন)"
                onClick={() => {
                  sounds.playClick();
                  setIsWalletOpen(true);
                }}
              >
                <Wallet size={16} color="var(--primary)" />
                <span className="wallet-label">ব্যালেন্স:</span>
                <span className="wallet-amount">৳{walletBalance}</span>
                <div className="wallet-plus-btn">
                  <Plus size={14} />
                </div>
              </div>
            )}

            {/* Admin Management Indicator Pill */}
            {isAdmin && (
              <div 
                className="admin-badge-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255, 0, 128, 0.12)',
                  border: '1px solid rgba(255, 0, 128, 0.3)',
                  color: '#ff007f',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/admin')}
                title="অ্যাডমিন কোনো ক্রেতা নন, শুধুমাত্র ওয়েবসাইট পরিচালনা করবেন"
              >
                <Crown size={13} color="#f59e0b" />
                <span>ম্যানেজমেন্ট মোড</span>
              </div>
            )}

            {/* Live Order Tracker Button */}
            <button
              className="btn btn-outline"
              id="navbar-track-order-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#00f0ff',
                borderColor: 'rgba(0, 240, 255, 0.4)',
                background: 'rgba(0, 240, 255, 0.08)'
              }}
              onClick={() => openOrderTracker()}
              title="অর্ডার ট্র্যাক করুন (অর্ডার আইডি বা প্লেয়ার UID দিয়ে ডেলিভারি দেখুন)"
            >
              <Search size={14} />
              <span>ট্র্যাক অর্ডার</span>
            </button>

            {/* Order History Button */}
            <button
              className="nav-icon-btn"
              id="navbar-history-btn"
              title="আমার অর্ডার হিস্ট্রি"
              onClick={() => {
                sounds.playClick();
                setIsOrdersHistoryOpen(true);
              }}
            >
              <History size={18} />
            </button>

            {/* Sound Mute/Unmute Toggle Button */}
            <button
              className="nav-icon-btn"
              id="navbar-sound-btn"
              title={isMuted ? "সাউন্ড আনমিউট করুন (Sound is Muted)" : "সাউন্ড মিউট করুন (Sound is Active)"}
              onClick={() => {
                const nowMuted = sounds.toggleMute();
                setIsMuted(nowMuted);
                if (!nowMuted) {
                  sounds.playClick();
                }
              }}
              style={{
                color: isMuted ? '#ef4444' : 'var(--primary)',
                background: isMuted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 240, 255, 0.08)',
                border: isMuted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(0, 240, 255, 0.25)'
              }}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {/* Notification Bell with Badge */}
            <div style={{ position: 'relative' }}>
              <button
                className="nav-icon-btn"
                id="navbar-notif-btn"
                title="নোটিফিকেশন"
                style={{ position: 'relative' }}
                onClick={() => {
                  sounds.playClick();
                  setShowNotifDropdown(!showNotifDropdown);
                }}
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#ff007f',
                    color: '#fff',
                    fontSize: '9.5px',
                    fontWeight: 900,
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(255, 0, 127, 0.9)'
                  }}>
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotifDropdown && (
                <div
                  id="navbar-notif-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    background: '#090d16',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '12px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.85)',
                    zIndex: 100,
                    width: '310px',
                    maxHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '8px',
                    marginBottom: '8px',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={15} color="var(--primary)" />
                      <span>নোটিফিকেশনসমূহ</span>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          sounds.playClick();
                          markAllNotificationsAsRead(currentUser?.uid);
                        }}
                      >
                        <CheckCheck size={13} /> সব পড়া হয়েছে
                      </button>
                    )}
                  </div>

                  <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: '12px' }}>
                        কোনো নতুন নোটিফিকেশন নেই
                      </div>
                    ) : (
                      userNotifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(0, 240, 255, 0.08)',
                            border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : 'rgba(0, 240, 255, 0.25)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: n.read ? '#cbd5e1' : '#fff' }}>
                              {n.title}
                            </div>
                            {!n.read && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                className="topup-card-btn"
                id="navbar-admin-dashboard-btn"
                style={{ 
                  background: 'linear-gradient(135deg, #ff007f, #7928ca)', 
                  color: '#fff', 
                  padding: '7px 14px',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(255, 0, 127, 0.4)'
                }}
                onClick={() => {
                  sounds.playClick();
                  navigate('/admin');
                }}
              >
                <Settings size={14} />
                <span>ড্যাশবোর্ড</span>
              </button>
            )}

            {/* User Auth Info */}
            {currentUser ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="user-avatar-btn"
                  id="navbar-user-avatar-btn"
                  onClick={() => {
                    sounds.playClick();
                    setShowUserDropdown(!showUserDropdown);
                  }}
                >
                  {!avatarError && currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Gamer'}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div 
                      className="user-avatar-initial"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00f0ff, #7928ca)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                        boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
                        border: '1.5px solid var(--primary)',
                        flexShrink: 0
                      }}
                    >
                      {(currentUser.displayName || currentUser.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="user-avatar-name">{currentUser.displayName?.split(' ')[0] || 'Gamer'}</span>
                  {isAdmin && <span style={{ fontSize: '10px' }}>👑</span>}
                </button>

                {showUserDropdown && (
                  <div
                    id="navbar-user-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      background: '#090d16',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '8px',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.85)',
                      zIndex: 100,
                      minWidth: '210px',
                      backdropFilter: 'blur(16px)'
                    }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{currentUser.displayName}</span>
                        {isAdmin && <span style={{ fontSize: '10px', background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: '8px' }}>ADMIN</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser.email || currentUser.phone || 'Gamer Account'}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: 'var(--accent)',
                          fontWeight: 700,
                          background: 'rgba(255, 0, 128, 0.08)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '4px'
                        }}
                        onClick={() => {
                          sounds.playClick();
                          setShowUserDropdown(false);
                          navigate('/admin');
                        }}
                      >
                        <Settings size={14} color="var(--accent)" /> অ্যাডমিন কন্ট্রোল সেন্টার (/admin)
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: '#00f0ff',
                          fontWeight: 700,
                          background: 'rgba(0, 240, 255, 0.08)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '4px'
                        }}
                        onClick={() => {
                          sounds.playClick();
                          setShowUserDropdown(false);
                          switchToCustomerAccount();
                        }}
                      >
                        <User size={14} color="#00f0ff" /> 🎮 গ্রাহক একাউন্টে যান (কেনাকাটার জন্য)
                      </button>
                    )}

                    <button
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => {
                        sounds.playClick();
                        setShowUserDropdown(false);
                        setIsOrdersHistoryOpen(true);
                      }}
                    >
                      <History size={14} color="var(--primary)" /> আমার অর্ডারসমূহ
                    </button>

                    <button
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => {
                        sounds.playClick();
                        setShowUserDropdown(false);
                        setIsWalletOpen(true);
                      }}
                    >
                      <Wallet size={14} color="var(--emerald)" /> রিচার্জ ওয়ালেট
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

                    <button
                      id="navbar-logout-btn"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#ff4d6d',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                    >
                      <LogOut size={14} /> লগআউট করুন
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="nav-login-btn"
                id="navbar-login-btn"
                onClick={() => {
                  sounds.playClick();
                  setIsLoginModalOpen(true);
                }}
              >
                <User size={15} />
                <span>লগইন</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
