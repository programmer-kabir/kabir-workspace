import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ThumbsUp, MessageSquarePlus, CheckCircle2, X, Send } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { useApp } from '../context/AppContext';

const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    name: '亗_RAKIB_亗',
    package: '240 Diamond',
    rating: 5,
    time: '১০ মিনিট আগে',
    verified: true,
    comment: 'ভাই সত্যি বলতে এতো ফাস্ট ডেলিভারি আশা করিনি! TrxID দেওয়ার ১ মিনিটের মধ্যে ২৪০ ডায়মন্ড পাইসি। কোনো পাসওয়ার্ড ছাড়াই শুধু UID দিয়ে এমন সার্ভিস পুরাই আগুন 🔥।'
  },
  {
    id: 'rev-2',
    name: 'SK_SABBIR_FF',
    package: 'Weekly Membership',
    rating: 5,
    time: '৩৫ মিনিট আগে',
    verified: true,
    comment: 'উইকলি মেম্বারশিপ নিলাম, বাজারের চেয়ে অনেক কম রেটে পাইলাম। বিশেষ করে প্লেয়ার নাম চেক করার সিস্টেমটা দারুণ, ভুল আইডিতে ডায়মন্ড যাওয়ার কোনো চান্স নাই।'
  },
  {
    id: 'rev-3',
    name: 'TANVIR_GAMER',
    package: '115 Diamond',
    rating: 5,
    time: '১ ঘন্টা আগে',
    verified: true,
    comment: 'বিকাশ অ্যাপ ওপেন বাটনে চাপ দিতেই নাম্বার কপি হয়ে সোজা অ্যাপ ওপেন হয়ে গেল! এতো ফাস্ট পেমেন্ট কোনো সাইটে দেখিনি। লাভ ইউ ভাই।'
  },
  {
    id: 'rev-4',
    name: 'MAFIA_BOSS_BD',
    package: 'Monthly VIP Pass',
    rating: 5,
    time: '২ ঘন্টা আগে',
    verified: true,
    comment: 'আগে অন্য পেজে ফেক ট্রানজেকশনে টাকা লস খাইসিলাম। এই সাইট থেকে নিয়ে পুরাই নিশ্চিন্ত। রাত ১২ টায়ও স্বয়ংক্রিয়ভাবে অর্ডার ডান হয়। ১০০% ট্রাস্টেড।'
  },
  {
    id: 'rev-5',
    name: 'MD_NAHID_PRO',
    package: '610 Diamond',
    rating: 5,
    time: '৩ ঘন্টা আগে',
    verified: true,
    comment: 'ইউজার ফ্রেন্ডলি ওয়েবসাইট। ফোন নাম্বার ছাড়া শুধু TrxID দিয়ে অর্ডার করার আইডিয়াটা সেরা। ডায়মন্ড দ্রুত চলে আসে।'
  }
];

export const CustomerReviews = () => {
  const { showToast } = useApp();
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('topup_bd_customer_reviews');
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [gamerName, setGamerName] = useState('');
  const [userComment, setUserComment] = useState('');
  const [pkgBought, setPkgBought] = useState('115 Diamond');

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!gamerName.trim()) {
      showToast('আপনার গেম নাম বা নাম লিখুন', 'error');
      sounds.playError();
      return;
    }
    if (!userComment.trim() || userComment.trim().length < 5) {
      showToast('অনুগ্রহ করে বিস্তারিত রিভিউ লিখুন', 'error');
      sounds.playError();
      return;
    }

    sounds.playCoin();
    const newRev = {
      id: 'rev-' + Date.now(),
      name: gamerName.trim(),
      package: pkgBought,
      rating: newRating,
      time: 'এইমাত্র (Just now)',
      verified: true,
      comment: userComment.trim()
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem('topup_bd_customer_reviews', JSON.stringify(updated));
    } catch {}

    showToast('আপনার মূল্যবান রিভিউর জন্য ধন্যবাদ! ⭐', 'success');
    setIsModalOpen(false);
    setGamerName('');
    setUserComment('');
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(10, 16, 28, 0.7) 0%, rgba(6, 10, 18, 0.95) 100%)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px 20px',
      margin: '28px 0',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header & Overall Rating Summary */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 190, 11, 0.1)',
            border: '1px solid rgba(255, 190, 11, 0.25)',
            padding: '4px 12px',
            borderRadius: '30px',
            fontSize: '11.5px',
            color: 'var(--gold)',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
            <ThumbsUp size={14} /> ১০০% সন্তুষ্ট গেমারদের অভিজ্ঞতা
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '22px',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.3px',
            marginBottom: '4px'
          }}>
            ⭐ গেমারদের রিভিউ ও রেটিং (Customer Reviews)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            হাজারো গেমারের বিশ্বাস ও আস্থার প্রমাণ। দেখে নিন অন্য গেমারদের মতামত:
          </p>
        </div>

        {/* Rating Score Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '12px 18px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>
              4.9
            </div>
            <div style={{ display: 'flex', gap: '2px', color: '#ffbe0b', marginTop: '4px' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#ffbe0b" color="#ffbe0b" />
              ))}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '3px' }}>
              ১,৪২০+ সফল অর্ডার
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsModalOpen(true);
            }}
            style={{
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <MessageSquarePlus size={15} />
            <span>রিভিউ দিন</span>
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {reviews.slice(0, 6).map((rev) => (
          <div
            key={rev.id}
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
          >
            <div>
              {/* Header: User name, package, rating */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00f0ff 0%, #ff0077 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {rev.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                      {rev.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--primary)' }}>
                      {rev.package}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '1px', color: '#ffbe0b' }}>
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={12} fill="#ffbe0b" color="#ffbe0b" />
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {rev.time}
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <p style={{
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: 1.55,
                margin: '8px 0 0 0'
              }}>
                "{rev.comment}"
              </p>
            </div>

            {/* Verified buyer badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10.5px',
              color: 'var(--emerald)',
              fontWeight: 700,
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <CheckCircle2 size={12} />
              <span>যাচাইকৃত ক্রেতা (Verified Buyer)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={() => {
                sounds.playClick();
                setIsModalOpen(false);
              }}
            >
              <X size={18} />
            </button>

            <div className="modal-title" style={{ marginBottom: '14px' }}>
              <Star size={20} color="var(--gold)" fill="var(--gold)" />
              <span>আপনার অভিজ্ঞতা শেয়ার করুন</span>
            </div>

            <form onSubmit={handleSubmitReview}>
              {/* Star Rating Selector */}
              <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  রেটিং সিলেক্ট করুন:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={28}
                      fill={star <= newRating ? '#ffbe0b' : 'none'}
                      color={star <= newRating ? '#ffbe0b' : '#64748b'}
                      style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                      onClick={() => {
                        sounds.playClick();
                        setNewRating(star);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Gamer Name Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  আপনার গেম নাম বা আসল নাম:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 亗_RAKIB_亗 বা শাকিব"
                  className="uid-input-field"
                  value={gamerName}
                  onChange={(e) => setGamerName(e.target.value)}
                  required
                />
              </div>

              {/* Package Bought */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  কোন প্যাকেজটি নিয়েছেন?
                </label>
                <select
                  className="uid-input-field"
                  value={pkgBought}
                  onChange={(e) => setPkgBought(e.target.value)}
                  style={{ background: '#0e1726', color: '#fff' }}
                >
                  <option value="115 Diamond">115 Diamond</option>
                  <option value="240 Diamond">240 Diamond</option>
                  <option value="610 Diamond">610 Diamond</option>
                  <option value="Weekly Membership">Weekly Membership</option>
                  <option value="Monthly Membership">Monthly Membership</option>
                  <option value="Special Airdrop">Special Airdrop</option>
                </select>
              </div>

              {/* Comment text */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  আপনার অভিজ্ঞতা ও মন্তব্য:
                </label>
                <textarea
                  rows={3}
                  placeholder="ডেলিভারি কেমন লাগলো এবং সার্ভিস সম্পর্কে মতামত লিখুন..."
                  className="uid-input-field"
                  style={{ resize: 'none', height: 'auto', padding: '10px' }}
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ffbe0b 0%, #ff8400 100%)',
                  color: '#06080e',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(255, 190, 11, 0.35)'
                }}
              >
                <Send size={16} />
                <span>রিভিউ পোস্ট করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
