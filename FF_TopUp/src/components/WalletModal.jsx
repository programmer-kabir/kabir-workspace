import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Wallet, Copy, CheckCircle, ArrowRight, Shield, Smartphone, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { PAYMENT_CHANNELS } from '../services/dataService';
import { sounds } from '../services/soundEffects';

export const WalletModal = () => {
  const { isWalletOpen, setIsWalletOpen, submitWalletRechargeRequest, paymentChannels, orders, walletRequests, showToast } = useApp();
  const { currentUser, walletBalance, setIsLoginModalOpen } = useAuth();

  const [amount, setAmount] = useState('200');
  const [method, setMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');

  if (!isWalletOpen) return null;

  const quickAmounts = ['50', '100', '200', '500', '1000'];

  const currentChannel = (paymentChannels && paymentChannels[method.toLowerCase()]) || {
    name: method,
    number: '01738679399',
    type: 'Send Money (Personal)'
  };

  const handleCopy = (num) => {
    sounds.playClick();
    navigator.clipboard.writeText(num);
    showToast(`নাম্বার কপি হয়েছে: ${num}`, 'success');
  };

  // Validate TrxID against format, common fakes, and duplicates
  const validateTrxId = (rawTrx) => {
    if (!rawTrx) return { valid: false, error: 'ট্রানজেকশন আইডি (TrxID) দিন' };
    const clean = rawTrx.trim().toUpperCase();

    if (clean.length < 7 || clean.length > 15) {
      return { valid: false, error: 'সঠিক TrxID দিন (সাধারণত ৮ থেকে ১২ অক্ষরের হয়)' };
    }
    if (!/^[A-Z0-9]+$/.test(clean)) {
      return { valid: false, error: 'TrxID-এ কোনো স্পেস বা স্পেশাল ক্যারেক্টার গ্রহণযোগ্য নয়' };
    }
    if (/^(.)\1+$/.test(clean)) {
      return { valid: false, error: 'নকল বা টেস্ট TrxID গ্রহণযোগ্য নয়! আসল TrxID দিন।' };
    }
    const dummyWords = ['TEST', 'DEMO', 'FAKE', 'BKASH', 'NAGAD', 'ROCKET', '123456', 'ABCDEF'];
    if (dummyWords.some(w => clean.includes(w))) {
      return { valid: false, error: 'বিকাশ/নগদ এসএমএস থেকে প্রাপ্ত আসল TrxID দিন' };
    }
    const isDuplicateOrder = orders?.some(o => o.trxId && o.trxId.trim().toUpperCase() === clean);
    if (isDuplicateOrder) {
      return { valid: false, isDuplicate: true, error: '⚠️ এই TrxID দিয়ে ইতিমধ্যে একটি অর্ডার রয়েছে!' };
    }
    const isDuplicateWallet = walletRequests?.some(w => w.trxId && w.trxId.trim().toUpperCase() === clean);
    if (isDuplicateWallet) {
      return { valid: false, isDuplicate: true, error: '⚠️ এই TrxID দিয়ে ইতিমধ্যে ওয়ালেট রিকোয়েস্ট জমা দেওয়া হয়েছে!' };
    }
    return { valid: true, clean };
  };

  // 1-Tap Open bKash/Nagad on mobile
  const handleOpenMfsApp = (methodName, phoneNum) => {
    sounds.playClick();
    if (phoneNum) {
      navigator.clipboard.writeText(phoneNum);
      showToast(`নম্বর (${phoneNum}) কপি হয়েছে!`, 'success');
    }
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (methodName.toLowerCase().includes('bkash')) {
      if (isAndroid) {
        window.location.href = 'intent://#Intent;scheme=bkash;package=com.bKash.customerapp;end';
      } else if (isIOS) {
        window.location.href = 'bkash://';
      } else {
        showToast('মোবাইলে এই বাটনে চাপ দিলে সরাসরি bKash অ্যাপ চালু হবে', 'info');
      }
    } else if (methodName.toLowerCase().includes('nagad')) {
      if (isAndroid) {
        window.location.href = 'intent://#Intent;scheme=nagad;package=com.konasl.nagad;end';
      } else if (isIOS) {
        window.location.href = 'nagad://';
      } else {
        showToast('মোবাইলে এই বাটনে চাপ দিলে সরাসরি Nagad অ্যাপ চালু হবে', 'info');
      }
    } else if (methodName.toLowerCase().includes('rocket')) {
      if (isAndroid) {
        window.location.href = 'intent://#Intent;scheme=rocket;package=com.dbbl.mbs.apps.main;end';
      } else {
        showToast('মোবাইলে এই বাটনে চাপ দিলে সরাসরি Rocket অ্যাপ চালু হবে', 'info');
      }
    }
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      sounds.playError();
      showToast('ওয়ালেটে টাকা যোগ করতে অনুগ্রহ করে আগে লগইন করুন', 'error');
      setIsWalletOpen(false);
      setIsLoginModalOpen(true);
      return;
    }
    if (!amount || Number(amount) < 10) {
      sounds.playError();
      showToast('সর্বনিম্ন ১০ টাকা রিচার্জ করতে হবে', 'error');
      return;
    }
    const trxCheck = validateTrxId(trxId);
    if (!trxCheck.valid) {
      sounds.playError();
      showToast(trxCheck.error, 'error');
      return;
    }

    submitWalletRechargeRequest({
      amount,
      method,
      senderNumber: '',
      trxId: trxId.trim().toUpperCase()
    });
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsWalletOpen(false)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        <button 
          className="modal-close-btn" 
          onClick={() => {
            sounds.playClick();
            setIsWalletOpen(false);
          }}
        >
          <X size={18} />
        </button>

        <div className="modal-title">
          <Wallet size={20} color="var(--primary)" />
          <span>ওয়ালেট ব্যালেন্স রিচার্জ</span>
        </div>

        {/* Warning Banner if Guest */}
        {!currentUser && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ fontSize: '12px', color: '#fef3c7' }}>
              ⚠️ আপনি লগইন অবস্থায় নেই। রিচার্জ করা ব্যালেন্স নিরাপদে রাখতে অনুগ্রহ করে প্রথমে লগইন করুন।
            </div>
            <button
              type="button"
              className="topup-card-btn"
              style={{ flexShrink: 0, padding: '6px 12px', fontSize: '11px', background: 'var(--primary)', color: '#06080e', fontWeight: 700 }}
              onClick={() => {
                sounds.playClick();
                setIsWalletOpen(false);
                setIsLoginModalOpen(true);
              }}
            >
              লগইন করুন
            </button>
          </div>
        )}

        {/* Current Balance Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
          border: '1px solid var(--primary-border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>বর্তমান মোট ব্যালেন্স</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 800, color: 'var(--primary)' }}>
              ৳{walletBalance}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} />
            <span>১-ক্লিক পারচেজ একটিভ</span>
          </div>
        </div>

        <form onSubmit={handleDepositSubmit}>
          
          {/* Step 1: Select Amount */}
          <div className="checkout-step-box">
            <div className="step-label">
              <span className="step-number">১</span>
              <span>টাকার পরিমাণ নির্বাচন বা লিখুন:</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {quickAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  className={`cat-tab ${amount === val ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playClick();
                    setAmount(val);
                  }}
                >
                  ৳{val}
                </button>
              ))}
            </div>

            <input 
              type="number" 
              placeholder="টাকার পরিমাণ (যেমন: 500)" 
              className="uid-input-field"
              style={{ width: '100%' }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Step 2: Select MFS */}
          <div className="checkout-step-box">
            <div className="step-label">
              <span className="step-number">২</span>
              <span>পেমেন্ট মাধ্যম বেছে নিন:</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                className={`cat-tab ${method === 'bKash' ? 'active' : ''}`}
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  sounds.playClick();
                  setMethod('bKash');
                }}
              >
                বিকাশ
              </button>
              <button
                type="button"
                className={`cat-tab ${method === 'Nagad' ? 'active' : ''}`}
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  sounds.playClick();
                  setMethod('Nagad');
                }}
              >
                নগদ
              </button>
              <button
                type="button"
                className={`cat-tab ${method === 'Rocket' ? 'active' : ''}`}
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  sounds.playClick();
                  setMethod('Rocket');
                }}
              >
                রকেট
              </button>
            </div>

            {/* Instruction Card */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentChannel.type}:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    className="topup-card-btn" 
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => handleCopy(currentChannel.number)}
                    title="নম্বর কপি করুন"
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
                    onClick={() => handleOpenMfsApp(method, currentChannel.number)}
                    title="অ্যাপ ওপেন করে Send Money করুন"
                  >
                    <Smartphone size={12} /> {method} App
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '10px' }}>
                উপরের নাম্বারে <b>৳{amount || 0}</b> টাকা Send Money করুন এবং নিচের বক্সে তথ্য দিন।
              </p>

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
                    <CheckCircle size={13} />
                    <span>সঠিক ও ইউনিক TrxID ভেরিফাইড ✓</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Verification Notice */}
          <div style={{
            background: 'rgba(255, 190, 11, 0.08)',
            border: '1px solid rgba(255, 190, 11, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '14px',
            fontSize: '11.5px',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} color="#ffbe0b" style={{ flexShrink: 0 }} />
            <span>নিরাপত্তা নোটিশ: টাকা পাঠানোর পর অ্যাডমিন TrxID যাচাই করে অনুমোদন দিলেই ওয়ালেটে ব্যালেন্স যুক্ত হবে।</span>
          </div>

          <button 
            type="submit" 
            className="place-order-submit-btn" 
            id="wallet-add-submit-btn"
          >
            <Shield size={18} />
            <span>রিচার্জ রিকোয়েস্ট পাঠান (৳{amount})</span>
            <ArrowRight size={18} />
          </button>

        </form>

      </div>
    </div>
  );
};
