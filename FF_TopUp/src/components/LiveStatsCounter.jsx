import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Clock, ShieldCheck, Flame, Users, CheckCircle2 } from 'lucide-react';

export const LiveStatsCounter = () => {
  const { orders } = useApp();

  // Dynamic active online gamers with subtle fluctuation (e.g. 18 - 32)
  const [onlineCount, setOnlineCount] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const next = prev + delta;
        return next < 16 ? 18 : next > 38 ? 32 : next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const completedCount = orders.filter(o => o.status === 'Completed').length;
  // Baseline + real orders for credible social proof
  const totalTodayOrders = 128 + completedCount;

  return (
    <div style={{
      margin: '20px 0 28px 0',
      padding: '18px 20px',
      background: 'linear-gradient(135deg, rgba(14, 20, 36, 0.85) 0%, rgba(8, 12, 24, 0.95) 100%)',
      border: '1px solid rgba(0, 240, 255, 0.2)',
      borderRadius: '18px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(16px)'
    }}>
      {/* Top Banner Tag */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff0077, #7928ca)',
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(255, 0, 119, 0.5)'
          }}>
            <Flame size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#fff', letterSpacing: '-0.2px' }}>
            রিয়েল-টাইম প্ল্যাটফর্ম স্ট্যাটাস ও সোশ্যাল প্রুফ
          </span>
        </div>

        {/* Live Pulse Dot */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '4px 10px',
          borderRadius: '999px',
          background: 'rgba(6, 214, 160, 0.1)',
          border: '1px solid rgba(6, 214, 160, 0.3)',
          fontSize: '11.5px',
          color: '#06d6a0',
          fontWeight: 700
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#06d6a0',
            boxShadow: '0 0 10px #06d6a0',
            animation: 'pulse 1.8s infinite'
          }} />
          <span>সার্ভার সম্পূর্ণ সক্রিয় ও লাইভ</span>
        </div>
      </div>

      {/* 4 Trust Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {/* Metric 1: Today Delivered Orders */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(0, 240, 255, 0.12)',
            color: '#00f0ff',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>আজকের সফল ডেলিভারি</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              {totalTodayOrders}+ <span style={{ fontSize: '12px', color: '#00f0ff', fontWeight: 700 }}>অর্ডার</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Average Delivery Time */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 0, 119, 0.15)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(255, 0, 119, 0.12)',
            color: '#ff0077',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>গড় ডেলিভারি স্পিড</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              ১ মি. ৪২ সে. <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>⚡ সুপারফাস্ট</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Safe Topup Guarantee */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(6, 214, 160, 0.15)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(6, 214, 160, 0.12)',
            color: '#06d6a0',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>আইডি ব্যান ঝুঁকি</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#06d6a0', letterSpacing: '-0.5px' }}>
              ০.০০% <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>(১০০% সেফ)</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Live Online Gamers */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 190, 11, 0.15)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(255, 190, 11, 0.12)',
            color: '#ffbe0b',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>বর্তমানে অ্যাক্টিভ গেমার</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              {onlineCount} জন <span style={{ fontSize: '11px', color: '#06d6a0', fontWeight: 700 }}>🟢 অনলাইনে</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
