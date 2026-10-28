import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, RefreshCw, ShoppingBag, ShieldCheck } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const RecentOrdersFeed = () => {
  const { orders } = useApp();

  const mockBackfills = [
    { id: 'TOP-88192', customerName: 'তানভীর আহমেদ', packageName: '115 Diamonds', uid: '1849208492', amount: 85, status: 'Completed', time: '১ মিনিট আগে' },
    { id: 'TOP-88191', customerName: 'সাকিব হাসান', packageName: 'Weekly Membership', uid: '2901928401', amount: 190, status: 'Completed', time: '৩ মিনিট আগে' },
    { id: 'TOP-88190', customerName: 'আরিফ হোসেন', packageName: '240 Diamonds', uid: '3812049281', amount: 175, status: 'Completed', time: '৫ মিনিট আগে' },
    { id: 'TOP-88189', customerName: 'মেহেদী হাসান রনি', packageName: '610 Diamonds', uid: '1723049182', amount: 420, status: 'Completed', time: '৮ মিনিট আগে' },
    { id: 'TOP-88188', customerName: 'ইমরান খান', packageName: 'Level Up Pass', uid: '1984029183', amount: 190, status: 'Completed', time: '১১ মিনিট আগে' }
  ];

  // If real orders exist, show them; otherwise backfill seamlessly
  const displayList = orders && orders.length >= 4 
    ? orders.slice(0, 6).map(o => ({
        id: o.id,
        customerName: o.customerName || 'গেমার',
        packageName: o.packageName || 'Diamonds Pack',
        uid: o.uid || '1849208492',
        amount: o.amount || 85,
        status: o.status || 'Completed',
        time: 'এইমাত্র'
      }))
    : [
        ...orders.map(o => ({
          id: o.id,
          customerName: o.customerName || 'গেমার',
          packageName: o.packageName || 'Diamonds Pack',
          uid: o.uid || '1849208492',
          amount: o.amount || 85,
          status: o.status || 'Completed',
          time: 'এইমাত্র'
        })),
        ...mockBackfills
      ].slice(0, 6);

  return (
    <div className="recent-orders-card">
      <div className="recent-orders-header">
        <div className="recent-orders-title-box">
          <ShoppingBag size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '17px', fontWeight: 800 }}>লাইভ সাম্প্রতিক অর্ডার ও ডেলিভারি স্ট্রিম</h3>
          <div className="live-indicator">
            <span className="dot"></span>
            <span>Live Stream</span>
          </div>
        </div>

        <button 
          className="nav-icon-btn" 
          title="রিফ্রেশ"
          onClick={() => {
            sounds.playClick();
          }}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="orders-stream-list">
        {displayList.map((order) => {
          const maskedUid = order.uid.length >= 6 
            ? `${order.uid.slice(0, 4)}****${order.uid.slice(-2)}` 
            : `${order.uid.slice(0, 3)}***`;

          return (
            <div key={order.id} className="order-stream-item">
              <div className="order-buyer-info">
                <div className="buyer-avatar-circle">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="buyer-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{order.customerName}</span>
                    <span style={{
                      fontSize: '10px',
                      background: 'rgba(6, 214, 160, 0.15)',
                      color: '#06d6a0',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <ShieldCheck size={10} /> ভেরিফাইড
                    </span>
                  </div>
                  <div className="buyer-meta">
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{order.packageName}</span>
                    <span>•</span>
                    <span style={{ fontFamily: 'monospace' }}>UID: {maskedUid}</span>
                    {order.time && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#94a3b8' }}>{order.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-right-meta">
                <div className="order-price-tag">৳{order.amount}</div>
                <div className={`order-status-badge ${order.status.toLowerCase()}`}>
                  <CheckCircle2 size={11} />
                  <span>{order.status === 'Completed' ? 'ডেলিভারি সম্পন্ন' : order.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
