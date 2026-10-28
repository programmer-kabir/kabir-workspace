import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const HeroBanner = () => {
  const { products, startTopup } = useApp();

  const handleQuickTopup = () => {
    sounds.playClick();
    if (products.length > 0) {
      startTopup(products[0]);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-banner-card">
        <img 
          src="/images/banner1.jpg" 
          alt="Free Fire Diamond Top-Up BD" 
          className="hero-banner-img"
        />

        <div className="hero-banner-overlay">
          <div className="hero-banner-badge">
            <Zap size={13} fill="currentColor" />
            <span>২৪ ঘন্টা সুপারফাস্ট অটোমেটিক ডেলিভারি</span>
          </div>

          <h1 className="hero-banner-title">
            সবচেয়ে কম রেটে ডায়মন্ড ও মেম্বারশিপ টপ-আপ
          </h1>

          <p className="hero-banner-desc">
            বিকাশ, নগদ, রকেট ও ইনস্ট্যান্ট ওয়ালেট পেমেন্টে ১-৩ মিনিটে ইন-গেম ডায়মন্ড ডেলিভারি। কোনো পাসওয়ার্ড ছাড়াই শুধুমাত্র UID দিয়ে রিচার্জ করুন।
          </p>

          <button 
            className="hero-cta-btn" 
            id="hero-topup-cta-btn"
            onClick={handleQuickTopup}
          >
            <Sparkles size={16} />
            <span>এখনই টপ-আপ করুন</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
