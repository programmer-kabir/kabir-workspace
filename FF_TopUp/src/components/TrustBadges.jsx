import React from 'react';
import { ShieldCheck, Zap, Smartphone, Users, Lock, Award, HeartHandshake, RefreshCw } from 'lucide-react';

export const TrustBadges = () => {
  return (
    <div style={{ margin: '14px 0' }}>
      {/* 4 Feature Highlights Grid */}
      <div className="trust-grid">
        <div className="trust-card">
          <div className="trust-icon-box" style={{ background: 'rgba(0, 240, 255, 0.15)', color: 'var(--primary)' }}>
            <Zap size={20} />
          </div>
          <div>
            <div className="trust-title">১ মিনিটে ডেলিভারি</div>
            <div className="trust-desc">২৪ ঘন্টা অটোমেটেড সিস্টেম</div>
          </div>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box" style={{ background: 'rgba(6, 214, 160, 0.15)', color: 'var(--emerald)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="trust-title">১০০% আইডি নিরাপদ</div>
            <div className="trust-desc">পাসওয়ার্ড ছাড়াই শুধু UID দিয়ে</div>
          </div>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box" style={{ background: 'rgba(226, 19, 110, 0.15)', color: '#e2136e' }}>
            <Smartphone size={20} />
          </div>
          <div>
            <div className="trust-title">বিকাশ ও নগদ পেমেন্ট</div>
            <div className="trust-desc">সহজ ও বিশ্বস্ত MFS গেটওয়ে</div>
          </div>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box" style={{ background: 'rgba(255, 190, 11, 0.15)', color: 'var(--gold)' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="trust-title">৫০,০০০+ নিয়মিত গেমার</div>
            <div className="trust-desc">বাংলাদেশ জুড়ে আস্থা ও ভরসা</div>
          </div>
        </div>
      </div>

      {/* Security & Money Back Guarantee Seal Banner */}
      <div style={{
        marginTop: '14px',
        padding: '12px 18px',
        background: 'linear-gradient(90deg, rgba(6, 214, 160, 0.08) 0%, rgba(0, 240, 255, 0.08) 100%)',
        border: '1px solid rgba(6, 214, 160, 0.25)',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} color="#06d6a0" />
          <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 700 }}>
            অফিসিয়াল UID টপ-আপ <span style={{ color: '#06d6a0', fontSize: '11px' }}>(পাসওয়ার্ড প্রয়োজন নেই)</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={16} color="#ffbe0b" />
          <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 700 }}>
            ০% আইডি ব্যান ঝুঁকি <span style={{ color: '#ffbe0b', fontSize: '11px' }}>(১০০% লিগ্যাল ডায়মন্ড)</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} color="#00f0ff" />
          <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 700 }}>
            ১০০% মানি-ব্যাক গ্যারান্টি <span style={{ color: '#00f0ff', fontSize: '11px' }}>(নিশ্চিত রিফান্ড পলিসি)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
