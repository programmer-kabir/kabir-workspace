import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, History, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const OrderHistoryModal = () => {
  const { isOrdersHistoryOpen, setIsOrdersHistoryOpen, orders, setActiveReceipt } = useApp();
  const { currentUser } = useAuth();

  if (!isOrdersHistoryOpen) return null;

  // Filter orders strictly for current logged-in user
  const userOrders = currentUser 
    ? orders.filter(o => o.userId === currentUser.uid)
    : [];

  return (
    <div className="modal-backdrop" onClick={() => setIsOrdersHistoryOpen(false)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        <button 
          className="modal-close-btn" 
          onClick={() => {
            sounds.playClick();
            setIsOrdersHistoryOpen(false);
          }}
        >
          <X size={18} />
        </button>

        <div className="modal-title">
          <History size={20} color="var(--primary)" />
          <span>আমার অর্ডার হিস্ট্রি</span>
        </div>

        {userOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>আপনার কোনো পূর্ববর্তী অর্ডার পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {userOrders.map(order => {
              const isCompleted = order.status === 'Completed';
              return (
                <div 
                  key={order.id} 
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        {order.id}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span className={`order-status-badge ${order.status.toLowerCase()}`}>
                      {isCompleted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      <span>{order.status === 'Completed' ? 'ডেলিভারি সম্পন্ন' : order.status}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{order.packageName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>UID: {order.uid} ({order.playerNickname || 'Player'})</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)', fontSize: '16px' }}>
                        ৳{order.amount}
                      </div>
                      <button 
                        style={{ fontSize: '11px', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        onClick={() => {
                          sounds.playClick();
                          setActiveReceipt(order);
                        }}
                      >
                        <Eye size={12} /> মেমো দেখুন
                      </button>
                    </div>
                  </div>

                  {/* Real-time Order Progress Bar */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', height: '4px', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: isCompleted ? 'var(--emerald)' : 'var(--primary)',
                        width: isCompleted ? '100%' : '60%',
                        transition: 'width 0.5s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
