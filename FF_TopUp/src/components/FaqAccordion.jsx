import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldCheck, MessageCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { useApp } from '../context/AppContext';

export const FaqAccordion = () => {
  const { paymentChannels } = useApp();
  const supportNumber = paymentChannels?.bkash?.number || '01738679399';
  const cleanWaNumber = supportNumber.replace(/\D/g, '').replace(/^0/, '880');

  const [openIndex, setOpenIndex] = useState(0); // First FAQ open by default

  const faqs = [
    {
      q: 'টাকা পাঠানোর কতক্ষণ পর অ্যাকাউন্টে ডায়মন্ড আসবে?',
      a: 'বিকাশ, নগদ বা রকেটে টাকা পাঠিয়ে সঠিক TrxID দেওয়ার পর সাধারণত ১ থেকে ৩ মিনিটের মধ্যেই স্বয়ংক্রিয়ভাবে আপনার গেম অ্যাকাউন্টে ডায়মন্ড যুক্ত হয়ে যায়। রাত-দিন ২৪ ঘণ্টাই এই সার্ভিস চালু থাকে।'
    },
    {
      q: 'টপ-আপের জন্য কি পাসওয়ার্ড বা জিমেইল দিতে হবে?',
      a: 'না, কখনোই নয়! আপনার গেম আইডির পাসওয়ার্ড বা ফেসবুক/জিমেইল দেওয়ার কোনো প্রয়োজন নেই। শুধু আপনার ৮-১০ ডিজিটের প্লেয়ার আইডি (Player UID) দিয়েই সম্পূর্ণ নিরাপদে ডায়মন্ড টপ-আপ হয়।'
    },
    {
      q: 'ভুল প্লেয়ার আইডি (UID) দিলে কী হবে?',
      a: 'ভুল এড়াতে আমাদের সাইটে স্বয়ংক্রিয় "নাম চেক" সিস্টেম রয়েছে। UID লেখার পর নাম চেক বাটনে ক্লিক করলে আপনার গেমের সঠিক নিকনেম শো করবে, ফলে ভুল আইডিতে ডায়মন্ড যাওয়ার কোনো ঝুঁকি নেই।'
    },
    {
      q: 'টাকা পাঠিয়েছি কিন্তু TrxID দিতে ভুলে গেছি বা পেজ বন্ধ হয়ে গেছে?',
      a: 'কোনো চিন্তা করবেন না! বিকাশ বা নগদের মেসেজ থেকে TrxID কপি করে সাইটের শীর্ষে থাকা "ট্র্যাক অর্ডার" অপশনে দিন অথবা নিচে থাকা আমাদের WhatsApp হেল্পলাইনে মেসেজ দিন। অ্যাডমিন তাৎক্ষণিক ভেরিফাই করে ডেলিভারি দিয়ে দেবে।'
    },
    {
      q: 'উইকলি বা মান্থলি মেম্বারশিপ নিলে কীভাবে ডায়মন্ড পাবো?',
      a: 'মেম্বারশিপ প্যাকেজ কেনার সাথে সাথে প্রথম দিনের ইনস্ট্যান্ট ডায়মন্ড আপনার অ্যাকাউন্টে ঢুকে যাবে এবং পরবর্তী দিনগুলোর ডায়মন্ড আপনি গেমে ঢুকে ডেইলি ক্লেইম করে নিতে পারবেন।'
    }
  ];

  const toggleFaq = (index) => {
    sounds.playClick();
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.7) 0%, rgba(8, 12, 22, 0.95) 100%)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px 20px',
      margin: '28px 0',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
          <HelpCircle size={14} /> সাধারণ জিজ্ঞাসা ও সমাধান
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.3px',
          marginBottom: '4px'
        }}>
          ❓ সাধারণ প্রশ্নোত্তর (FAQ)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
          টপ-আপ নিয়ে গেমারদের সচরাচর সব প্রশ্নের উত্তর এক নজরে দেখে নিন:
        </p>
      </div>

      {/* Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '780px', margin: '0 auto' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              style={{
                background: isOpen ? 'rgba(0, 240, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: isOpen ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.25s ease'
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: isOpen ? 'var(--primary)' : '#fff',
                  lineHeight: 1.4
                }}>
                  {faq.q}
                </span>
                <span style={{
                  color: isOpen ? 'var(--primary)' : 'var(--text-dim)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <ChevronDown size={18} />
                </span>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 16px 14px 16px',
                  fontSize: '13px',
                  color: '#cbd5e1',
                  lineHeight: 1.6,
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  paddingTop: '10px'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need More Help WhatsApp Banner */}
      <div style={{
        marginTop: '20px',
        padding: '14px',
        borderRadius: '12px',
        background: 'rgba(37, 211, 102, 0.08)',
        border: '1px solid rgba(37, 211, 102, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        maxWidth: '780px',
        margin: '20px auto 0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={18} color="#25d366" />
          <span style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
            অন্য কোনো সমস্যা বা প্রশ্ন থাকলে আমাদের সাথে সরাসরি যোগাযোগ করুন:
          </span>
        </div>
        <a
          href={`https://wa.me/${cleanWaNumber}`}
          target="_blank"
          rel="noreferrer"
          style={{
            background: '#25d366',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none'
          }}
          onClick={() => sounds.playClick()}
        >
          <span>WhatsApp সাপোর্ট</span>
        </a>
      </div>
    </div>
  );
};
