import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Zap,
  Wallet,
  Plus,
  History,
  User,
  LogOut,
  Settings,
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
    switchToCustomerAccount
  } = useAuth();

  const { 
    setIsWalletOpen, 
    setIsOrdersHistoryOpen, 
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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-slate-200/90 shadow-xs transition-colors">
      <div className="app-container">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-4">

          {/* Brand Logo */}
          <a 
            href="/" 
            className="flex items-center gap-2.5 sm:gap-3 group select-none" 
            onClick={(e) => { 
              e.preventDefault(); 
              sounds.playClick(); 
              navigate('/'); 
            }}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
              <Zap size={22} className="fill-current text-white" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                TOPUP BD
              </div>
              <div className="text-[10px] text-sky-600 font-bold uppercase tracking-widest mt-0.5">
                Bangladesh #1 Store
              </div>
            </div>
          </a>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Wallet Balance Pill (Logged in customers) */}
            {currentUser && !isAdmin && (
              <div
                id="navbar-wallet-btn"
                title="ওয়ালেট ব্যালেন্স (ক্লিক করে টাকা রিচার্জ করুন)"
                onClick={() => {
                  sounds.playClick();
                  setIsWalletOpen(true);
                }}
                className="flex items-center gap-2 bg-sky-50 border border-sky-200 hover:border-sky-300 rounded-full px-3.5 py-1.5 cursor-pointer shadow-xs transition-all duration-200 group"
              >
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Wallet size={13} />
                </div>
                <div className="text-xs font-black text-sky-800 font-mono">
                  ৳{walletBalance}
                </div>
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center group-hover:bg-sky-700 transition-colors">
                  <Plus size={12} />
                </div>
              </div>
            )}

            {/* Admin Badge Pill */}
            {isAdmin && (
              <div 
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
                onClick={() => navigate('/admin')}
                title="অ্যাডমিন কন্ট্রোল সেন্টারে যান"
              >
                <Crown size={13} className="text-amber-500" />
                <span>ম্যানেজমেন্ট</span>
              </div>
            )}

            {/* Live Order Tracker Button */}
            <button
              id="navbar-track-order-btn"
              onClick={() => openOrderTracker()}
              title="অর্ডার ট্র্যাক করুন (অর্ডার আইডি বা প্লেয়ার UID দিয়ে ডেলিভারি দেখুন)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Search size={13} />
              <span>ট্র্যাক অর্ডার</span>
            </button>

            {/* Order History Button */}
            <button
              id="navbar-history-btn"
              title="আমার অর্ডার হিস্ট্রি"
              onClick={() => {
                sounds.playClick();
                setIsOrdersHistoryOpen(true);
              }}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <History size={16} />
            </button>

            {/* Sound Mute/Unmute Toggle */}
            <button
              id="navbar-sound-btn"
              title={isMuted ? "সাউন্ড চালু করুন" : "সাউন্ড মিউট করুন"}
              onClick={() => {
                const nowMuted = sounds.toggleMute();
                setIsMuted(nowMuted);
                if (!nowMuted) {
                  sounds.playClick();
                }
              }}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isMuted 
                  ? 'border-rose-200 bg-rose-50 text-rose-600' 
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="navbar-notif-btn"
                title="নোটিফিকেশন"
                onClick={() => {
                  sounds.playClick();
                  setShowNotifDropdown(!showNotifDropdown);
                }}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer relative"
              >
                <Bell size={16} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotifDropdown && (
                <div
                  id="navbar-notif-dropdown-menu"
                  className="absolute top-12 right-0 w-80 max-h-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell size={14} className="text-sky-600" />
                      <span>নোটিফিকেশনসমূহ</span>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        className="text-[11px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer"
                        onClick={() => {
                          sounds.playClick();
                          markAllNotificationsAsRead(currentUser?.uid);
                        }}
                      >
                        <CheckCheck size={13} /> সব পড়া হয়েছে
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex flex-col gap-2 max-h-72 [scrollbar-width:thin]">
                    {userNotifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs font-medium">
                        কোনো নতুন নোটিফিকেশন নেই
                      </div>
                    ) : (
                      userNotifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            n.read 
                              ? 'bg-slate-50 border-slate-200 text-slate-500' 
                              : 'bg-sky-50 border-sky-200 text-slate-900 font-semibold'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{n.title}</span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                            {n.message}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Shortcut Button */}
            {isAdmin && (
              <button
                id="navbar-admin-dashboard-btn"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
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
              <div className="relative">
                <button
                  id="navbar-user-avatar-btn"
                  onClick={() => {
                    sounds.playClick();
                    setShowUserDropdown(!showUserDropdown);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  {!avatarError && currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Gamer'}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={() => setAvatarError(true)}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {(currentUser.displayName || currentUser.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 pr-2">
                    {currentUser.displayName?.split(' ')[0] || 'Gamer'}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div
                    id="navbar-user-dropdown-menu"
                    className="absolute top-12 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50"
                  >
                    <div className="p-2.5 border-b border-slate-100 mb-1">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{currentUser.displayName}</span>
                        {isAdmin && (
                          <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded-md font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {currentUser.email || currentUser.phone || 'Gamer Account'}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                        onClick={() => {
                          sounds.playClick();
                          setShowUserDropdown(false);
                          navigate('/admin');
                        }}
                      >
                        <Settings size={14} /> 
                        <span>অ্যাডমিন প্যানেল (/admin)</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-xl transition-colors text-left cursor-pointer"
                        onClick={() => {
                          sounds.playClick();
                          setShowUserDropdown(false);
                          switchToCustomerAccount();
                        }}
                      >
                        <User size={14} /> 
                        <span>গ্রাহক মোডে যান</span>
                      </button>
                    )}

                    <button
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                      onClick={() => {
                        sounds.playClick();
                        setShowUserDropdown(false);
                        setIsOrdersHistoryOpen(true);
                      }}
                    >
                      <History size={14} className="text-sky-600" /> 
                      <span>আমার অর্ডারসমূহ</span>
                    </button>

                    <button
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                      onClick={() => {
                        sounds.playClick();
                        setShowUserDropdown(false);
                        setIsWalletOpen(true);
                      }}
                    >
                      <Wallet size={14} className="text-emerald-600" /> 
                      <span>রিচার্জ ওয়ালেট</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      id="navbar-logout-btn"
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                    >
                      <LogOut size={14} /> 
                      <span>লগআউট করুন</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={() => {
                  sounds.playClick();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <User size={14} />
                <span>লগইন</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
