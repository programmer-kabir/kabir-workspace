import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const LivePurchasePopup = () => {
  const { orders } = useApp();
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fallback realistic recent purchases for Bangladeshi Free Fire gamers
  const mockPurchases = [
    { name: 'তানভীর আহমেদ', uid: '1849****02', package: '115 Diamonds', time: '১ মিনিট আগে', amount: '৮৫' },
    { name: 'সাকিবুল হাসান', uid: '2901****88', package: '240 Diamonds', time: '২ মিনিট আগে', amount: '১৭৫' },
    { name: 'আরিফ হোসেন', uid: '3812****54', package: 'Weekly Membership', time: 'এইমাত্র', amount: '১৯০' },
    { name: 'মেহেদী হাসান রনি', uid: '1723****90', package: '610 Diamonds', time: '৩ মিনিট আগে', amount: '৪২০' },
    { name: 'রাকিবুল ইসলাম', uid: '2049****15', package: 'Level Up Pass', time: '৪ মিনিট আগে', amount: '১৯০' },
    { name: 'ফারহান চৌধুরী', uid: '3182****77', package: '1240 Diamonds', time: '৫ মিনিট আগে', amount: '৮৪০' },
    { name: 'ইমরান খান', uid: '1984****33', package: 'Monthly Membership', time: 'এইমাত্র', amount: '৯২০' }
  ];

  useEffect(() => {
    if (isDismissed) return;

    let timer;
    let hideTimer;

    const showRandomOrder = () => {
      // Pick either from real orders or mock
      const realOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Processing');
      let item;

      if (realOrders.length > 0 && Math.random() > 0.4) {
        const rand = realOrders[Math.floor(Math.random() * realOrders.length)];
        item = {
          name: rand.customerName || 'গেমার',
          uid: rand.uid ? `${rand.uid.slice(0, 4)}****${rand.uid.slice(-2)}` : '1849****02',
          package: rand.packageName || 'Diamonds Pack',
          time: 'এইমাত্র',
          amount: rand.amount || '৮৫'
        };
      } else {
        item = mockPurchases[Math.floor(Math.random() * mockPurchases.length)];
      }

      setCurrentNotification(item);
      setIsVisible(true);

      // Hide after 5 seconds
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // First appearance after 3 seconds
    const initialDelay = setTimeout(() => {
      showRandomOrder();
      // Then repeat every 14 seconds
      timer = setInterval(showRandomOrder, 14000);
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, [orders, isDismissed]);

  if (isDismissed || !currentNotification || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px', // Stays nicely above mobile navigation bar and doesn't block buttons
        left: '16px',
        zIndex: 999,
        maxWidth: '340px',
        width: 'calc(100vw - 32px)',
        background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.95) 0%, rgba(8, 12, 22, 0.98) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 240, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Gamer Avatar with glowing badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 119, 0.2))',
          border: '1.5px solid rgba(0, 240, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          color: '#00f0ff',
          fontSize: '16px'
        }}>
          {currentNotification.name.charAt(0)}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '-3px',
          right: '-3px',
          background: '#06d6a0',
          borderRadius: '50%',
          width: '15px',
          height: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #0d1424'
        }}>
          <CheckCircle2 size={10} color="#000" />
        </div>
      </div>

      {/* Info Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{
            fontWeight: 800,
            fontSize: '12.5px',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentNotification.name}
          </div>
          <span style={{ fontSize: '10.5px', color: '#00f0ff', fontWeight: 700, flexShrink: 0 }}>
            {currentNotification.time}
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
          🔥 <b style={{ color: '#ff0077' }}>{currentNotification.package}</b> সফল ডেলিভারি!
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
          <span>UID: {currentNotification.uid}</span>
          <span>•</span>
          <span style={{ color: '#06d6a0', fontWeight: 700 }}>৳{currentNotification.amount} পরিশোধিত</span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          sounds.playClick();
          setIsVisible(false);
          setIsDismissed(true); // Don't annoy user if closed
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          alignSelf: 'flex-start',
          flexShrink: 0
        }}
        title="বন্ধ করুন"
      >
        <X size={14} />
      </button>
    </div>
  );
};
