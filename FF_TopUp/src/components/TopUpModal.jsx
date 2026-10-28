import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  Smartphone, 
  Wallet, 
  AlertCircle, 
  Search,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { checkPlayerNickname, PAYMENT_CHANNELS } from '../services/dataService';
import { sounds } from '../services/soundEffects';

export const TopUpModal = () => {
  const { 
    isTopupOpen, 
    setIsTopupOpen, 
    selectedProduct, 
    selectedPackage, 
    setSelectedPackage, 
    placeOrder, 
    setIsWalletOpen,
    paymentChannels,
    orders,
    walletRequests,
    showToast 
  } = useApp();
  const { walletBalance, isAdmin, switchToCustomerAccount } = useAuth();

  const [uid, setUid] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Wallet Balance');
  const [trxId, setTrxId] = useState('');
  
  // Nickname checking state
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [verifiedPlayer, setVerifiedPlayer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save UID feature state
  const [saveUidEnabled, setSaveUidEnabled] = useState(true);
  const [savedUids, setSavedUids] = useState(() => {
    try {
      const data = localStorage.getItem('topup_bd_saved_uids');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Auto-load latest saved UID on modal open if input is currently empty
  useEffect(() => {
    if (isTopupOpen) {
      try {
        const data = localStorage.getItem('topup_bd_saved_uids');
        const list = data ? JSON.parse(data) : [];
        setSavedUids(list);
        if (list.length > 0 && !uid) {
          const first = list[0];
          setUid(first.uid);
          if (first.nickname) {
            setVerifiedPlayer({
              nickname: first.nickname,
              uid: first.uid,
              server: first.server || 'Bangladesh (BD)'
            });
          }
        }
      } catch {}
    }
  }, [isTopupOpen]);

  const handleSelectSavedUid = (item) => {
    sounds.playClick();
    setUid(item.uid);
    if (item.nickname) {
      setVerifiedPlayer({
        nickname: item.nickname,
        uid: item.uid,
        server: item.server || 'Bangladesh (BD)'
      });
    } else {
      setVerifiedPlayer(null);
    }
    showToast(`সেভ করা UID সিলেক্ট হয়েছে: ${item.nickname || item.uid}`, 'info');
  };

  const handleRemoveSavedUid = (uidToRemove) => {
    sounds.playClick();
    const updated = savedUids.filter(item => item.uid !== uidToRemove);
    setSavedUids(updated);
    try {
      localStorage.setItem('topup_bd_saved_uids', JSON.stringify(updated));
    } catch {}
    showToast('সেভ করা UID সরানো হয়েছে', 'info');
  };

  useEffect(() => {
    if (selectedProduct) {
      setSelectedServer(selectedProduct.servers[0] || 'BD Server');
      if (!selectedPackage && selectedProduct.packages.length > 0) {
        setSelectedPackage(selectedProduct.packages[0]);
      }
    }
  }, [selectedProduct]);

  if (!isTopupOpen || !selectedProduct) return null;

  // Auto check nickname when UID is valid length
  const handleCheckNickname = async () => {
    sounds.playClick();
    if (!uid || uid.trim().length < 6) {
      showToast('অনুগ্রহ করে সঠিক প্লেয়ার UID দিন', 'error');
      return;
    }
    setCheckingNickname(true);
    try {
      const res = await checkPlayerNickname(uid.trim());
      if (res.success) {
        setVerifiedPlayer(res);
        sounds.playSuccess();
        showToast(`প্লেয়ার পাওয়া গেছে: ${res.nickname}`, 'success');
      } else {
        setVerifiedPlayer(null);
        showToast(res.message, 'error');
      }
    } finally {
      setCheckingNickname(false);
    }
  };

  const handlePasteUid = async () => {
    sounds.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUid(text.trim());
        showToast('UID পেস্ট করা হয়েছে', 'info');
      }
    } catch {
      // Fallback
      showToast('ক্লিপবোর্ড পারমিশন দিন', 'info');
    }
  };

  const handleCopyNumber = (num) => {
    sounds.playClick();
    navigator.clipboard.writeText(num);
    showToast(`নাম্বার কপি হয়েছে: ${num}`, 'success');
  };

  // Validate TrxID against format, common fakes, and duplicates
  const validateTrxId = (rawTrx) => {
    if (!rawTrx) return { valid: false, error: 'ট্রানজেকশন আইডি (TrxID) দিন' };
    const clean = rawTrx.trim().toUpperCase();

    // 1. Length check: bKash/Nagad/Rocket TrxIDs are usually 7 to 15 characters
    if (clean.length < 7 || clean.length > 15) {
      return { 
        valid: false, 
        error: 'সঠিক TrxID দিন (সাধারণত ৮ থেকে ১২ অক্ষরের হয়, যেমন: BJD82914K)' 
      };
    }

    // 2. Alphanumeric check
    if (!/^[A-Z0-9]+$/.test(clean)) {
      return { 
        valid: false, 
        error: 'TrxID-এ কোনো স্পেস বা স্পেশাল ক্যারেক্টার থাকা যাবে না' 
      };
    }

    // 3. Repeated character fake check (e.g. 00000000, 11111111)
    if (/^(.)\1+$/.test(clean)) {
      return { 
        valid: false, 
        error: 'নকল বা টেস্ট TrxID গ্রহণযোগ্য নয়! আসল TrxID দিন।' 
      };
    }

    // 4. Common fake words
    const dummyWords = ['TEST', 'DEMO', 'FAKE', 'BKASH', 'NAGAD', 'ROCKET', '123456', 'ABCDEF'];
    if (dummyWords.some(w => clean.includes(w))) {
      return { 
        valid: false, 
        error: 'বিকাশ/নগদ এসএমএস থেকে প্রাপ্ত আসল TrxID দিন' 
      };
    }

    // 5. Duplicate Check across existing orders
    const isDuplicateOrder = orders?.some(o => o.trxId && o.trxId.trim().toUpperCase() === clean);
    if (isDuplicateOrder) {
      return { 
        valid: false, 
        isDuplicate: true,
        error: '⚠️ এই TrxID দিয়ে ইতিমধ্যে একটি অর্ডার রয়েছে! একই TrxID বারবার দেওয়া যাবে না।' 
      };
    }

    // 6. Duplicate Check across wallet requests
    const isDuplicateWallet = walletRequests?.some(w => w.trxId && w.trxId.trim().toUpperCase() === clean);
    if (isDuplicateWallet) {
      return { 
        valid: false, 
        isDuplicate: true,
        error: '⚠️ এই TrxID দিয়ে ইতিমধ্যে ওয়ালেট রিকোয়েস্ট রয়েছে!' 
      };
    }

    return { valid: true, clean };
  };

  // 1-Tap Open bKash/Nagad app on mobile
  const handleOpenMfsApp = (methodName, phoneNum) => {
    sounds.playClick();
    if (phoneNum) {
      navigator.clipboard.writeText(phoneNum);
      showToast(`নম্বর (${phoneNum}) কপি হয়েছে!`, 'success');
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (methodName.includes('bKash')) {
      if (isAndroid) {
        window.location.href = 'intent://#Intent;scheme=bkash;package=com.bKash.customerapp;end';
      } else if (isIOS) {
        window.location.href = 'bkash://';
      } else {
        showToast('মোবাইলে এই বাটনে চাপ দিলে সরাসরি bKash অ্যাপ চালু হবে', 'info');
      }
    } else if (methodName.includes('Nagad')) {
      if (isAndroid) {
        window.location.href = 'intent://#Intent;scheme=nagad;package=com.konasl.nagad;end';
      } else if (isIOS) {
        window.location.href = 'nagad://';
      } else {
        showToast('মোবাইলে এই বাটনে চাপ দিলে সরাসরি Nagad অ্যাপ চালু হবে', 'info');
      }
    } else if (methodName.includes('Rocket')) {
      if (isAndroid) {
        window.location.href = 'intent://#Intent;scheme=rocket;package=com.dbbl.mbs.apps.main;end';
      } else {
        showToast('মোবাইলে এই বাটনে চাপ দিলে সরাসরি Rocket অ্যাপ চালু হবে', 'info');
      }
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!uid || uid.trim().length < 6) {
      sounds.playError();
      showToast('দয়া করে সঠিক প্লেয়ার UID দিন', 'error');
      return;
    }

    if (!selectedPackage) {
      sounds.playError();
      showToast('একটি প্যাকেজ সিলেক্ট করুন', 'error');
      return;
    }

    if (paymentMethod !== 'Wallet Balance') {
      const trxCheck = validateTrxId(trxId);
      if (!trxCheck.valid) {
        sounds.playError();
        showToast(trxCheck.error, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Save UID to local storage if checkbox is enabled
      if (saveUidEnabled && uid.trim()) {
        try {
          const cleanUid = uid.trim();
          const nick = verifiedPlayer ? verifiedPlayer.nickname : '';
          const prev = savedUids.filter(item => item.uid !== cleanUid);
          const updated = [{ uid: cleanUid, nickname: nick, server: selectedServer }, ...prev].slice(0, 5);
          setSavedUids(updated);
          localStorage.setItem('topup_bd_saved_uids', JSON.stringify(updated));
        } catch {}
      }

      await placeOrder({
        uid: uid.trim(),
        playerNickname: verifiedPlayer ? verifiedPlayer.nickname : 'Verified Player',
        server: selectedServer,
        product: selectedProduct,
        pkg: selectedPackage,
        method: paymentMethod,
        senderNumber: '',
        trxId: trxId.trim().toUpperCase()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeChannels = paymentChannels || PAYMENT_CHANNELS;
  const currentChannel = paymentMethod !== 'Wallet Balance' 
    ? (paymentMethod.includes('bKash') ? activeChannels.bkash : paymentMethod.includes('Nagad') ? activeChannels.nagad : activeChannels.rocket)
    : null;

  return (
    <div className="modal-backdrop" onClick={() => setIsTopupOpen(false)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          className="modal-close-btn" 
          onClick={() => {
            sounds.playClick();
            setIsTopupOpen(false);
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="modal-title">
          <Sparkles size={20} color="var(--primary)" />
          <span>{selectedProduct.title}</span>
        </div>

        {isAdmin && (
          <div style={{
            background: 'rgba(255, 0, 119, 0.12)',
            border: '1px solid rgba(255, 0, 119, 0.35)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#ffb3d1',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 800, color: '#ff0077', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} /> অ্যাডমিন একাউন্টে পারচেজ বন্ধ
            </div>
            অ্যাডমিন শুধুমাত্র ওয়েবসাইট পরিচালনা করবেন, কোনো কেনাকাটা করতে পারবেন না। কেনাকাটা বা ডায়মন্ড নিতে চাইলে নিচের বাটনে চাপ দিয়ে সাধারণ গ্রাহক মোডে চলে যান:
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="topup-card-btn"
                style={{ padding: '6px 12px', fontSize: '11px', background: '#00f0ff', color: '#000', fontWeight: 800 }}
                onClick={() => {
                  switchToCustomerAccount();
                  showToast('গ্রাহক একাউন্টে স্যুইচ হয়েছে! এখন আপনি অর্ডার করতে পারবেন।', 'success');
                }}
              >
                🎮 গ্রাহক একাউন্টে স্যুইচ করুন
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>

          {/* STEP 1: PLAYER ID / UID */}
          <div className="checkout-step-box">
            <div className="step-label">
              <span className="step-number">১</span>
              <span>প্লেয়ার আইডি (Player UID) দিন:</span>
            </div>

            <div className="uid-input-group">
              <input 
                type="text" 
                placeholder="যেমন: 284719482" 
                className="uid-input-field"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value);
                  setVerifiedPlayer(null);
                }}
                required
              />
              <button 
                type="button" 
                className="verify-uid-btn" 
                onClick={handlePasteUid}
                title="ক্লিপবোর্ড থেকে পেস্ট করুন"
              >
                পেস্ট
              </button>
              <button 
                type="button" 
                className="verify-uid-btn"
                onClick={handleCheckNickname}
                disabled={checkingNickname}
              >
                {checkingNickname ? 'যাচাই হচ্ছে...' : 'নাম চেক'}
              </button>
            </div>

            {/* Saved UIDs Quick Chips */}
            {savedUids.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Bookmark size={12} color="var(--primary)" /> সেভ করা UID:
                </span>
                {savedUids.map((item) => {
                  const isSelected = uid.trim() === item.uid;
                  return (
                    <div 
                      key={item.uid} 
                      onClick={() => handleSelectSavedUid(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '16px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        userSelect: 'none'
                      }}
                      title="ক্লিক করে এই UID অটো বসান"
                    >
                      <span style={{ color: isSelected ? 'var(--primary)' : '#fff', fontWeight: 600 }}>
                        {item.nickname || item.uid}
                      </span>
                      {item.nickname && (
                        <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>({item.uid})</span>
                      )}
                      <span 
                        style={{ marginLeft: '2px', color: 'var(--text-dim)', fontSize: '14px', lineHeight: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSavedUid(item.uid);
                        }}
                        title="তালিকা থেকে মুছুন"
                      >
                        ×
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save UID Checkbox */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={saveUidEnabled} 
                  onChange={(e) => setSaveUidEnabled(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span>পরবর্তী অর্ডারের জন্য এই UID সেভ রাখুন (Save UID)</span>
              </label>
            </div>

            {/* Verified Player Badge Preview */}
            {verifiedPlayer && (
              <div className="verified-player-box" style={{ marginTop: '10px' }}>
                <div className="verified-player-name">
                  <CheckCircle2 size={16} />
                  <span>আইডি নাম: {verifiedPlayer.nickname}</span>
                </div>
                <span className="verified-server-tag">✓ সার্ভার: {verifiedPlayer.server}</span>
              </div>
            )}
          </div>

          {/* STEP 2: SERVER SELECTION */}
          {selectedProduct.servers && selectedProduct.servers.length > 1 && (
            <div className="checkout-step-box">
              <div className="step-label">
                <span className="step-number">২</span>
                <span>গেমের সার্ভার বেছে নিন:</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedProduct.servers.map(server => (
                  <button
                    key={server}
                    type="button"
                    className={`cat-tab ${selectedServer === server ? 'active' : ''}`}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedServer(server);
                    }}
                  >
                    {server}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PACKAGE SELECTION */}
          <div className="checkout-step-box">
            <div className="step-label">
              <span className="step-number">৩</span>
              <span>প্যাকেজ নির্বাচন করুন:</span>
            </div>

            <div className="package-selection-grid">
              {selectedProduct.packages.map(pkg => {
                const isSelected = selectedPackage && selectedPackage.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`package-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedPackage(pkg);
                    }}
                  >
                    {pkg.tag && <span className="pkg-badge">{pkg.tag}</span>}
                    <div className="pkg-title">{pkg.name}</div>
                    <div className="pkg-price">৳{pkg.price}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 4: PAYMENT METHOD SELECTION */}
          <div className="checkout-step-box">
            <div className="step-label">
              <span className="step-number">৪</span>
              <span>পেমেন্ট মাধ্যম নির্বাচন করুন:</span>
            </div>

            <div className="payment-methods-grid">
              
              {/* Wallet 1-Click Option */}
              <button
                type="button"
                className={`payment-choice-btn ${paymentMethod === 'Wallet Balance' ? 'selected' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setPaymentMethod('Wallet Balance');
                }}
              >
                <div className="payment-logo-badge" style={{ background: 'var(--primary)', color: '#06080e' }}>
                  <Wallet size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>মাই ওয়ালেট</div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)' }}>ব্যালেন্স: ৳{walletBalance}</div>
                </div>
              </button>

              {/* bKash */}
              <button
                type="button"
                className={`payment-choice-btn ${paymentMethod === 'bKash Auto' ? 'selected' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setPaymentMethod('bKash Auto');
                }}
              >
                <div className="payment-logo-badge" style={{ background: '#e2136e' }}>
                  বিকাশ
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>bKash</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>সেন্ড মানি</div>
                </div>
              </button>

              {/* Nagad */}
              <button
                type="button"
                className={`payment-choice-btn ${paymentMethod === 'Nagad Auto' ? 'selected' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setPaymentMethod('Nagad Auto');
                }}
              >
                <div className="payment-logo-badge" style={{ background: '#f7931e' }}>
                  নগদ
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Nagad</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>সেন্ড মানি</div>
                </div>
              </button>

              {/* Rocket */}
              <button
                type="button"
                className={`payment-choice-btn ${paymentMethod === 'Rocket Auto' ? 'selected' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setPaymentMethod('Rocket Auto');
                }}
              >
                <div className="payment-logo-badge" style={{ background: '#8c3392' }}>
                  রকেট
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Rocket</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>সেন্ড মানি</div>
                </div>
              </button>

            </div>

            {/* Instructions for MFS Payment */}
            {paymentMethod === 'Wallet Balance' ? (
              <div style={{ marginTop: '12px', background: 'rgba(0, 240, 255, 0.08)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                {walletBalance >= (selectedPackage ? selectedPackage.price : 0) ? (
                  <div style={{ color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} />
                    <span>১-ক্লিকে তাৎক্ষণিক ডায়মন্ড অ্যাকাউন্টে পাঠানো হবে (০ সেকেন্ড ডেলিভারি)।</span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>পর্যাপ্ত ব্যালেন্স নেই (প্রয়োজন ৳{selectedPackage ? selectedPackage.price : 0})</span>
                    <button 
                      type="button" 
                      className="topup-card-btn"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => setIsWalletOpen(true)}
                    >
                      রিচার্জ করুন
                    </button>
                  </div>
                )}
              </div>
            ) : currentChannel && (
              <div style={{ marginTop: '14px', background: 'rgba(0, 0, 0, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {currentChannel.type} নাম্বার:
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button" 
                      className="topup-card-btn" 
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => handleCopyNumber(currentChannel.number)}
                      title="নাম্বার কপি করুন"
                    >
                      <Copy size={12} /> {currentChannel.number} (কপি)
                    </button>
                    <button 
                      type="button" 
                      className="topup-card-btn" 
                      style={{ 
                        padding: '3px 10px', 
                        fontSize: '11px', 
                        background: currentChannel.color || '#e2136e', 
                        color: '#fff', 
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenMfsApp(paymentMethod, currentChannel.number)}
                      title="অ্যাপ ওপেন করে Send Money করুন"
                    >
                      <Smartphone size={12} /> {paymentMethod.includes('bKash') ? 'bKash App' : paymentMethod.includes('Nagad') ? 'Nagad App' : 'Rocket App'}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '10px' }}>
                  {currentChannel.instructions} মোট টাকা পাঠাবেন: <b style={{ color: 'var(--gold)' }}>৳{selectedPackage ? selectedPackage.price : 0}</b>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input 
                      type="text" 
                      placeholder="ট্রানজেকশন আইডি দিন (TrxID, যেমন: BJD82914K)" 
                      className="uid-input-field"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'block',
                        paddingRight: '36px',
                        borderColor: trxId.trim().length >= 4 
                          ? (validateTrxId(trxId).valid ? 'var(--emerald)' : '#ef4444') 
                          : undefined
                      }}
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      required
                    />
                    {trxId.trim().length >= 4 && (
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                        {validateTrxId(trxId).valid ? (
                          <ShieldCheck size={18} color="var(--emerald)" />
                        ) : (
                          <ShieldAlert size={18} color="#ef4444" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Real-time TrxID feedback */}
                  {trxId.trim().length >= 4 && !validateTrxId(trxId).valid && (
                    <div style={{ fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <AlertCircle size={13} />
                      <span>{validateTrxId(trxId).error}</span>
                    </div>
                  )}

                  {trxId.trim().length >= 7 && validateTrxId(trxId).valid && (
                    <div style={{ fontSize: '11px', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <CheckCircle2 size={13} />
                      <span>সঠিক ও ইউনিক TrxID ভেরিফাইড ✓</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* CHECKOUT SUMMARY */}
          <div className="checkout-summary-box">
            <div className="summary-row">
              <span>প্যাকেজ:</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{selectedPackage ? selectedPackage.name : ''}</span>
            </div>
            <div className="summary-row">
              <span>সার্ভার:</span>
              <span style={{ color: '#fff' }}>{selectedServer}</span>
            </div>
            <div className="summary-row">
              <span>পেমেন্ট মাধ্যম:</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{paymentMethod}</span>
            </div>
            <div className="summary-row total">
              <span>মোট প্রদেয় টাকা:</span>
              <span className="summary-total-val">৳{selectedPackage ? selectedPackage.price : 0}</span>
            </div>

            <button 
              type="submit" 
              className="place-order-submit-btn" 
              id="confirm-order-btn"
              disabled={isSubmitting || isAdmin}
              style={{ opacity: isAdmin ? 0.6 : 1, cursor: isAdmin ? 'not-allowed' : 'pointer' }}
            >
              <ShieldCheck size={18} />
              <span>{isAdmin ? 'অ্যাডমিন একাউন্টে পারচেজ বন্ধ' : isSubmitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}</span>
              <ChevronRight size={18} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
