import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Sparkles, Flame, Crown, Gift, ThumbsUp } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const ProductCatalog = () => {
  const { products, startTopup } = useApp();
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = activeTab === 'all' 
    ? products 
    : products.filter(p => p.category === activeTab);

  const tabs = [
    { id: 'all', label: 'সব সার্ভিস', icon: Sparkles },
    { id: 'freefire', label: 'Free Fire UID', icon: Flame },
    { id: 'membership', label: 'মেম্বারশিপ VIP', icon: Crown },
    { id: 'special', label: 'স্পেশাল এয়ারড্রপ', icon: Gift },
    { id: 'likes', label: 'প্রোফাইল লাইক', icon: ThumbsUp }
  ];

  return (
    <section style={{ margin: '30px 0' }}>
      
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-accent-line"></div>
          <h2 className="section-title">জনপ্রিয় টপ-আপ প্যাকেজ</h2>
          <span className="section-tag">ইনস্ট্যান্ট ডেলিভারি</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`cat-tab ${isActive ? 'active' : ''}`}
              onClick={() => {
                sounds.playClick();
                setActiveTab(tab.id);
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div className="products-grid" style={{ marginTop: '16px' }}>
        {filteredProducts.map(product => {
          const minPrice = Math.min(...product.packages.map(p => p.price));
          return (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => startTopup(product)}
            >
              <div className="product-image-box">
                <img src={product.image} alt={product.title} />
                <div className="product-card-badge">
                  {product.badge}
                </div>
              </div>

              <div className="product-body">
                <h3 className="product-card-title">{product.title}</h3>
                <p className="product-card-subtitle">{product.subtitle}</p>

                <div className="product-pricing-row">
                  <div>
                    <span className="price-start-label">শুরু মাত্র</span>
                    <div className="price-start-val">৳{minPrice}</div>
                  </div>

                  <button 
                    className="topup-card-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTopup(product);
                    }}
                  >
                    <Zap size={14} fill="currentColor" />
                    <span>টপ-আপ</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
