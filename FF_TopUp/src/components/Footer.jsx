import React from 'react';
import { Zap, MessageCircle, Send, ShieldAlert, Heart } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { paymentChannels } = useApp();
  const supportNumber = paymentChannels?.bkash?.number || '01738679399';
  const cleanWaNumber = supportNumber.replace(/\D/g, '').replace(/^0/, '880');

  return (
    <>
      <footer style={{ 
        background: '#070a12', 
        borderTop: '1px solid var(--border-subtle)', 
        padding: '40px 0 24px 0',
        marginTop: '40px',
        color: 'var(--text-muted)'
      }}>
        <div className="app-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px' }}>
            
            {/* Column 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div className="brand-logo-icon" style={{ width: '32px', height: '32px' }}>
                  <Zap size={18} fill="currentColor" />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: '#fff' }}>TOPUP BD</span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8' }}>
                বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ও দ্রুততম ফ্রি ফায়ার ডায়মন্ড ও মেম্বারশিপ টপ-আপ প্ল্যাটফর্ম। বিকাশ, নগদ ও রকেটে ১-৩ মিনিটে স্বয়ংক্রিয় ডেলিভারি।
              </p>
            </div>

            {/* Column 2: Legal & Safety Notice */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffbe0b', fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                <ShieldAlert size={16} />
                <span>সতর্কবার্তা ও নীতিমালা</span>
              </div>
              <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#94a3b8' }}>
                মা-বাবা বা পরিবারের কারো মোবাইল থেকে না বলে টাকা পাঠিয়ে অর্ডার করা সম্পূর্ণ নিষিদ্ধ। কোনো নিয়ম ভঙ্গ করলে বা ফেক TrxID দিলে একাউন্ট স্থায়ীভাবে ব্লক করা হবে।
              </p>
            </div>

            {/* Column 3: Contact & Community */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                কমিউনিটি ও হেল্পলাইন
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <a 
                  href={`https://wa.me/${cleanWaNumber}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25d366' }}
                  onClick={() => sounds.playClick()}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp: {supportNumber}</span>
                </a>
                <a 
                  href="https://t.me/topupshopapps" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0088cc' }}
                  onClick={() => sounds.playClick()}
                >
                  <Send size={16} />
                  <span>টেলিগ্রাম অফিশিয়াল গ্রুপ</span>
                </a>
              </div>
            </div>

          </div>

          <div style={{ 
            borderTop: '1px solid var(--border-subtle)', 
            marginTop: '30px', 
            paddingTop: '20px', 
            textAlign: 'center', 
            fontSize: '12px',
            color: 'var(--text-dim)'
          }}>
            © {new Date().getFullYear()} TopUp BD. All rights reserved. Crafted with gaming passion.
          </div>
        </div>
      </footer>

      {/* Floating 24/7 WhatsApp Button */}
      <a 
        href={`https://wa.me/${cleanWaNumber}`} 
        target="_blank" 
        rel="noreferrer" 
        className="floating-whatsapp-btn"
        title={`২৪ ঘন্টা WhatsApp কাস্টমার সাপোর্ট (${supportNumber})`}
        onClick={() => sounds.playClick()}
      >
        <MessageCircle size={26} fill="currentColor" />
      </a>
    </>
  );
};
