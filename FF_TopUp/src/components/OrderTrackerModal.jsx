import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Zap, 
  Copy, 
  Printer, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const OrderTrackerModal = () => {
  const { 
    isOrderTrackerOpen, 
    setIsOrderTrackerOpen, 
    orderTrackerQuery, 
    setOrderTrackerQuery, 
    orders, 
    setActiveReceipt,
    showToast,
    paymentChannels
  } = useApp();

  const { currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState(orderTrackerQuery || '');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [lastOrderId, setLastOrderId] = useState(() => {
    try {
      return localStorage.getItem('topup_bd_last_order_id') || '';
    } catch {
      return '';
    }
  });

  // Re-read last order ID on modal open
  useEffect(() => {
    if (isOrderTrackerOpen) {
      try {
        const id = localStorage.getItem('topup_bd_last_order_id') || '';
        setLastOrderId(id);
      } catch {}
    }
  }, [isOrderTrackerOpen]);

  // Live 1-second countdown ticker
  useEffect(() => {
    if (!isOrderTrackerOpen || !selectedOrder) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOrderTrackerOpen, selectedOrder]);

  // Calculate live countdown and delivery progress percentage
  const getDeliveryProgress = (order) => {
    if (!order) return { remainingSec: 0, percent: 0 };
    if (order.status === 'Completed') return { remainingSec: 0, percent: 100, completed: true };
    if (order.status === 'Cancelled' || order.status === 'Refunded') return { remainingSec: 0, percent: 100, cancelled: true };

    const createdAtMs = order.createdAt ? new Date(order.createdAt).getTime() : currentTime;
    const elapsedSec = Math.max(0, Math.floor((currentTime - createdAtMs) / 1000));
    const targetSec = 120; // 2 minutes delivery window
    const remainingSec = Math.max(0, targetSec - elapsedSec);
    const percent = Math.min(95, Math.max(15, Math.floor((elapsedSec / targetSec) * 100)));
    return { remainingSec, percent, completed: false };
  };

  // Sync initial query if passed
  useEffect(() => {
    if (orderTrackerQuery) {
      setSearchInput(orderTrackerQuery);
      performSearch(orderTrackerQuery);
    } else if (orders.length > 0) {
      // Default to the most recent order if available
      const defaultOrder = currentUser 
        ? orders.find(o => o.userId === currentUser.uid) || orders[0]
        : orders[0];
      setSelectedOrder(defaultOrder);
    }
  }, [orderTrackerQuery, isOrderTrackerOpen]);

  if (!isOrderTrackerOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    setIsOrderTrackerOpen(false);
    setSearchInput('');
    setHasSearched(false);
  };

  const performSearch = (queryStr) => {
    const q = (queryStr || searchInput).trim().toLowerCase();
    if (!q) {
      showToast('অনুগ্রহ করে অর্ডার আইডি বা প্লেয়ার UID দিন', 'error');
      return;
    }

    setHasSearched(true);
    // Search by exact order id, partial id, or UID
    const found = orders.find(o => 
      o.id?.toLowerCase() === q ||
      o.id?.toLowerCase().replace('top-', '') === q.replace('top-', '') ||
      o.uid?.toLowerCase() === q ||
      o.trxId?.toLowerCase() === q
    );

    if (found) {
      sounds.playSuccess();
      setSelectedOrder(found);
    } else {
      sounds.playError();
      setSelectedOrder(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  const handleCopy = (text, label) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    showToast(`${label} কপি করা হয়েছে!`, 'success');
  };

  const handleOpenReceipt = (order) => {
    sounds.playClick();
    setActiveReceipt(order);
  };

  const handleWhatsAppHelp = (order) => {
    sounds.playClick();
    const phone = paymentChannels?.bkash?.number || '01738679399';
    const message = encodeURIComponent(
      `হ্যালো TopUp BD সাপোর্ট, আমার অর্ডার #${order ? order.id : 'N/A'} (UID: ${order ? order.uid : ''}) নিয়ে সাহায্য প্রয়োজন।`
    );
    window.open(`https://wa.me/880${phone.replace(/^0/, '')}?text=${message}`, '_blank');
  };

  // Timeline Step calculator
  const getStepStatus = (order) => {
    if (!order) return { step1: false, step2: false, step3: false, step4: false };
    const status = order.status;

    if (status === 'Completed') {
      return { step1: 'done', step2: 'done', step3: 'done', step4: 'done' };
    }
    if (status === 'Processing') {
      return { step1: 'done', step2: 'done', step3: 'current', step4: 'pending' };
    }
    if (status === 'Cancelled') {
      return { step1: 'done', step2: 'cancelled', step3: 'cancelled', step4: 'cancelled' };
    }
    // Pending
    return { step1: 'done', step2: 'current', step3: 'pending', step4: 'pending' };
  };

  const steps = getStepStatus(selectedOrder);

  return (
    <div className="modal-backdrop active" onClick={handleClose}>
      <div 
        className="modal-card active" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '94%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 114, 255, 0.2))',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f0ff'
            }}>
              <Search size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '18px', margin: 0 }}>
                লাইভ অর্ডার ট্র্যাকার
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                রিয়েল-টাইম ডেলিভারি স্ট্যাটাস ও ট্র্যাকিং
              </div>
            </div>
          </div>

          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '20px 24px 10px 24px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-dim)' 
                }} 
              />
              <input
                type="text"
                placeholder="অর্ডার আইডি (যেমন: TOP-12345) বা প্লেয়ার UID দিন..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: '38px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.03)'
                }}
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                borderRadius: '12px',
                padding: '0 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>খুঁজুন</span>
            </button>
          </form>

          {/* Quick Last Order Shortcut */}
          {lastOrderId && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>📌 আপনার শেষ অর্ডার:</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSearchInput(lastOrderId);
                  performSearch(lastOrderId);
                }}
                style={{
                  background: 'rgba(0, 240, 255, 0.12)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>#{lastOrderId}</span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>(ক্লিক করে ট্র্যাক করুন)</span>
              </button>
            </div>
          )}

          {/* Quick history pill selector */}
          {orders.length > 0 && (
            <div style={{ 
              marginTop: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              overflowX: 'auto', 
              paddingBottom: '4px' 
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                সাম্প্রতিক:
              </span>
              {orders.slice(0, 4).map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedOrder(o);
                    setSearchInput(o.id);
                    setHasSearched(true);
                  }}
                  style={{
                    background: selectedOrder?.id === o.id ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: selectedOrder?.id === o.id ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: selectedOrder?.id === o.id ? '#00f0ff' : 'var(--text-dim)',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 600
                  }}
                >
                  #{o.id} ({o.status === 'Completed' ? '✅' : '⏳'})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '10px 24px 24px 24px' }}>
          {selectedOrder ? (
            <div>
              {/* Live Countdown Timer & Progress Bar for Pending / Processing Orders */}
              {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Processing') && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(255, 190, 11, 0.08))',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 20px rgba(0, 240, 255, 0.15)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(0, 240, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00f0ff'
                      }}>
                        <Zap size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                          ডেলিভারি প্রক্রিয়াধীন রয়েছে
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          অ্যাডমিন TrxID যাচাই করে ডায়মন্ড পাঠাচ্ছেন
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>আনুমানিক বাকি সময়:</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffbe0b', fontFamily: 'var(--font-mono)' }}>
                        {getDeliveryProgress(selectedOrder).remainingSec > 0 
                          ? `${Math.floor(getDeliveryProgress(selectedOrder).remainingSec / 60).toString().padStart(2, '0')}:${(getDeliveryProgress(selectedOrder).remainingSec % 60).toString().padStart(2, '0')} মিনিট` 
                          : 'যেকোনো মুহূর্তে'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Track */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${getDeliveryProgress(selectedOrder).percent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #00f0ff, #ffbe0b)',
                      borderRadius: '20px',
                      transition: 'width 1s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10.5px', color: 'var(--text-dim)' }}>
                    <span>TrxID ভেরিফিকেশন</span>
                    <span>{getDeliveryProgress(selectedOrder).percent}% সম্পন্ন</span>
                    <span>ডেলিভারি প্রস্তুত</span>
                  </div>
                </div>
              )}

              {/* Order Primary Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95), rgba(10, 15, 29, 0.95))',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>অর্ডার আইডি:</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#00f0ff', letterSpacing: '0.5px' }}>
                        #{selectedOrder.id}
                      </span>
                      <button 
                        onClick={() => handleCopy(selectedOrder.id, 'অর্ডার আইডি')}
                        style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer', padding: 0 }}
                        title="কপি করুন"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '3px' }}>
                      অর্ডারের সময়: {new Date(selectedOrder.createdAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    background: selectedOrder.status === 'Completed' ? 'rgba(6, 214, 160, 0.15)' :
                               selectedOrder.status === 'Processing' ? 'rgba(0, 240, 255, 0.15)' :
                               selectedOrder.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: selectedOrder.status === 'Completed' ? '#06d6a0' :
                           selectedOrder.status === 'Processing' ? '#00f0ff' :
                           selectedOrder.status === 'Cancelled' ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${selectedOrder.status === 'Completed' ? '#06d6a0' :
                                         selectedOrder.status === 'Processing' ? '#00f0ff' :
                                         selectedOrder.status === 'Cancelled' ? '#ef4444' : '#f59e0b'}`
                  }}>
                    {selectedOrder.status === 'Completed' && <CheckCircle2 size={13} />}
                    {selectedOrder.status === 'Processing' && <Zap size={13} />}
                    {selectedOrder.status === 'Cancelled' && <XCircle size={13} />}
                    {selectedOrder.status === 'Pending' && <Clock size={13} />}
                    <span>
                      {selectedOrder.status === 'Completed' ? 'ডেলিভারি সম্পন্ন' :
                       selectedOrder.status === 'Processing' ? 'ডেলিভারি প্রসেসিং হচ্ছে' :
                       selectedOrder.status === 'Cancelled' ? 'অর্ডার বাতিল ও রিফান্ড' : 'পেমেন্ট যাচাই চলছে'}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  margin: '14px 0', 
                  height: '1px', 
                  background: 'rgba(255, 255, 255, 0.08)' 
                }} />

                {/* Gamer UID & Nickname preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>প্লেয়ার UID</div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{selectedOrder.uid}</span>
                      <button 
                        onClick={() => handleCopy(selectedOrder.uid, 'প্লেয়ার UID')}
                        style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer', padding: 0 }}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ইন-গেম নিকনেম</div>
                    <div style={{ fontWeight: 800, color: '#ff007f', fontSize: '13.5px' }}>
                      {selectedOrder.playerNickname || 'Gamer'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>প্যাকেজ</div>
                    <div style={{ fontWeight: 800, color: '#00f0ff', fontSize: '13.5px' }}>
                      {selectedOrder.packageName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>মোট পরিশোধিত মূল্য</div>
                    <div style={{ fontWeight: 900, color: '#06d6a0', fontSize: '15px' }}>
                      ৳{selectedOrder.amount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual 4-Step Progress Tracker */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="#00f0ff" />
                  <span>লাইভ ডেলিভারি টাইমলাইন:</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Step 1 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#06d6a0',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                        ১. অর্ডার গ্রহণ করা হয়েছে
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        গ্রাহকের রিকোয়েস্ট সিস্টেমে নিবন্ধিত হয়েছে ({new Date(selectedOrder.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })})
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: steps.step2 === 'done' ? '#06d6a0' : steps.step2 === 'current' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                      color: steps.step2 === 'done' || steps.step2 === 'current' ? '#000' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0
                    }}>
                      {steps.step2 === 'done' ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: steps.step2 === 'current' ? '#f59e0b' : '#fff' }}>
                        ২. পেমেন্ট ভেরিফিকেশন ({selectedOrder.method})
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        {steps.step2 === 'done' 
                          ? `টাকা প্রাপ্তি নিশ্চিত করা হয়েছে (TrxID: ${selectedOrder.trxId || 'Verified'})` 
                          : 'অ্যাডমিন বিকাশ/নগদ TrxID মিলিয়ে দেখছেন...'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: steps.step3 === 'done' ? '#06d6a0' : steps.step3 === 'current' ? '#00f0ff' : 'rgba(255,255,255,0.1)',
                      color: steps.step3 === 'done' || steps.step3 === 'current' ? '#000' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0
                    }}>
                      <Zap size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: steps.step3 === 'current' ? '#00f0ff' : '#fff' }}>
                        ৩. আইডিতে ডায়মন্ড পাঠানো হচ্ছে
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        {steps.step3 === 'done'
                          ? `গ্যারেনা সার্ভারে ${selectedOrder.diamonds || selectedOrder.packageName} ডায়মন্ড সফলভাবে ট্রান্সফার হয়েছে`
                          : steps.step3 === 'current'
                          ? `প্লেয়ার আইডি ${selectedOrder.uid} এ টপ-আপ ইন-ট্রানজিট...`
                          : 'পূর্ববর্তী ধাপ সম্পন্ন হওয়ার অপেক্ষায়'}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: steps.step4 === 'done' ? '#06d6a0' : 'rgba(255,255,255,0.1)',
                      color: steps.step4 === 'done' ? '#000' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: steps.step4 === 'done' ? '#06d6a0' : 'var(--text-dim)' }}>
                        ৪. ডেলিভারি সম্পন্ন 🎉
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        {steps.step4 === 'done' 
                          ? 'ডায়মন্ড প্লেয়ারের ইন-গেম মেইলবক্সে বা ওয়ালেটে যোগ হয়ে গেছে। ধন্যবাদ!'
                          : 'অর্ডারটি প্রক্রিয়াধীন রয়েছে'}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleOpenReceipt(selectedOrder)}
                  style={{
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                >
                  <Printer size={15} color="#00f0ff" />
                  <span>ক্যাশ মেমো প্রিন্ট</span>
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => handleWhatsAppHelp(selectedOrder)}
                  style={{
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(37, 211, 102, 0.15)',
                    border: '1px solid rgba(37, 211, 102, 0.35)',
                    color: '#25d366'
                  }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp সাহায্য</span>
                </button>
              </div>
            </div>
          ) : hasSearched ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-dim)'
            }}>
              <AlertCircle size={44} color="#f59e0b" style={{ margin: '0 auto 12px auto', display: 'block' }} />
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>
                কোনো অর্ডার খুঁজে পাওয়া যায়নি
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                আপনার দেওয়া আইডি <b>"{searchInput}"</b> দিয়ে কোনো অর্ডার পাওয়া যায়নি। সঠিক ৮-১০ ডিজিটের প্লেয়ার UID বা অর্ডার আইডি লিখুন।
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleWhatsAppHelp(null)}
                style={{ fontSize: '13px', borderRadius: '10px' }}
              >
                <MessageCircle size={15} /> WhatsApp এ সরাসরি সাহায্য নিন
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: 'var(--text-dim)'
            }}>
              <ShoppingBag size={40} style={{ opacity: 0.3, margin: '0 auto 10px auto', display: 'block' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                অর্ডার ট্র্যাক করতে আইডি দিন
              </div>
              <div style={{ fontSize: '12px' }}>
                অর্ডারের পর পাওয়া ৫-ডিজিটের কোড (যেমন: <b>TOP-12345</b>) অথবা আপনার প্লেয়ার UID দিয়ে সার্চ করুন।
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
