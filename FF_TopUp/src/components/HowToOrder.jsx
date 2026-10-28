import React from 'react';
import { Gamepad2, Smartphone, Zap, ArrowRight, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const HowToOrder = () => {
  const scrollToCatalog = () => {
    sounds.playClick();
    const el = document.querySelector('.product-catalog-section') || document.querySelector('.product-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const steps = [
    {
      step: '০১',
      title: 'প্যাকেজ ও UID দিন',
      subtitle: 'আইডি ভেরিফিকেশন',
      desc: 'আপনার পছন্দের ডায়মন্ড বা পাস সিলেক্ট করুন। প্লেয়ার UID দিয়ে "নাম চেক" করে নিশ্চিত হন ভুল আইডিতে ডায়মন্ড যাবে না।',
      icon: Gamepad2,
      color: '#00f0ff',
      tag: '১ম ধাপ'
    },
    {
      step: '০২',
      title: 'বিকাশ / নগদে Send Money',
      subtitle: '১-ট্যাপ অ্যাপ ওপেন',
      desc: 'স্ক্রিনে প্রদর্শিত নম্বরে Send Money করুন। মোবাইলে থাকলে ১-ট্যাপে সরাসরি বিকাশ বা নগদ অ্যাপ ওপেন করতে পারবেন।',
      icon: Smartphone,
      color: '#e2136e',
      tag: '২য় ধাপ'
    },
    {
      step: '০৩',
      title: 'TrxID দিন ও ডায়মন্ড বুঝে নিন',
      subtitle: '১ মিনিটে অটো ডেলিভারি',
      desc: 'এসএমএস থেকে TrxID কপি করে দিন এবং কনফার্ম করুন। ০-২ মিনিটে আপনার ফ্রি ফায়ার আইডিতে ডায়মন্ড পৌঁছে যাবে!',
      icon: Zap,
      color: '#ffbe0b',
      tag: '৩য় ধাপ'
    }
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(14, 22, 40, 0.7) 0%, rgba(8, 12, 22, 0.95) 100%)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px 20px',
      margin: '28px 0',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          padding: '4px 12px',
          borderRadius: '30px',
          fontSize: '11.5px',
          color: 'var(--primary)',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          <ShieldCheck size={14} /> সহজ ও ১০০% নিরাপদ গাইডলাইন
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.3px',
          marginBottom: '6px'
        }}>
          ⚡ কীভাবে অর্ডার করবেন? (মাত্র ৩টি সহজ ধাপে)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto' }}>
          কোনো ঝামেলা ছাড়া নিজের মোবাইল থেকে সহজে ডায়মন্ড কিনুন। নিচে ধাপগুলো অনুসরণ করুন:
        </p>
      </div>

      {/* Steps Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Background Step Watermark */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '10px',
                fontSize: '64px',
                fontWeight: 900,
                fontFamily: 'var(--font-heading)',
                color: 'rgba(255, 255, 255, 0.025)',
                userSelect: 'none',
                lineHeight: 1
              }}>
                {s.step}
              </div>

              <div>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.color
                  }}>
                    <Icon size={22} />
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    background: `${s.color}15`,
                    color: s.color,
                    border: `1px solid ${s.color}30`
                  }}>
                    ধাপ {idx + 1}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '6px'
                }}>
                  {s.title}
                </h3>

                <p style={{
                  fontSize: '12.5px',
                  color: '#94a3b8',
                  lineHeight: 1.55
                }}>
                  {s.desc}
                </p>
              </div>

              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: s.color,
                fontWeight: 700
              }}>
                <CheckCircle2 size={13} />
                <span>{s.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick CTA to start top-up */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button
          type="button"
          onClick={scrollToCatalog}
          style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #00a8ff 100%)',
            color: '#06080e',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 24px',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(0, 240, 255, 0.35)',
            transition: 'transform 0.2s ease'
          }}
        >
          <span>প্যাকেজ দেখুন ও এখনই টপ-আপ করুন</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
