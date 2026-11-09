import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquarePlus, CheckCircle2, X, Send } from 'lucide-react';
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
    <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 my-8 sm:my-12 shadow-sm">
      
      {/* Header & Overall Rating Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs text-amber-700 font-bold mb-2">
            <ThumbsUp size={14} /> 
            <span>১০০% সন্তুষ্ট গেমারদের অভিজ্ঞতা</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
            ⭐ গেমারদের রিভিউ ও রেটিং (Customer Reviews)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            হাজারো গেমারের বিশ্বাস ও আস্থার প্রমাণ। দেখে নিন অন্য গেমারদের মতামত:
          </p>
        </div>

        {/* Rating Score Card */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 leading-none">
              4.9
            </div>
            <div className="flex gap-0.5 text-amber-500 mt-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-semibold">
              ১,৪২০+ সফল অর্ডার
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <MessageSquarePlus size={15} />
            <span>রিভিউ দিন</span>
          </button>
        </div>
      </div>

      {/* Reviews Grid with Generous Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map((rev) => (
          <div
            key={rev.id}
            className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header: User name, package, rating */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {rev.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900">
                      {rev.name}
                    </div>
                    <div className="text-[11px] text-sky-600 font-semibold">
                      {rev.package}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex gap-0.5 text-amber-500 justify-end">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {rev.time}
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium not-italic my-2.5">
                "{rev.comment}"
              </p>
            </div>

            {/* Verified buyer badge */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-4 pt-3 border-t border-slate-200">
              <CheckCircle2 size={13} />
              <span>যাচাইকৃত ক্রেতা (Verified Buyer)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors" 
              onClick={() => {
                sounds.playClick();
                setIsModalOpen(false);
              }}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-5 text-base sm:text-lg font-black text-slate-900">
              <Star size={22} className="text-amber-500 fill-amber-500" />
              <span>আপনার অভিজ্ঞতা শেয়ার করুন</span>
            </div>

            <form onSubmit={handleSubmitReview}>
              {/* Star Rating Selector */}
              <div className="mb-4 text-center">
                <div className="text-xs text-slate-500 mb-2 font-medium">
                  রেটিং সিলেক্ট করুন:
                </div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={28}
                      fill={star <= newRating ? '#f59e0b' : 'none'}
                      color={star <= newRating ? '#f59e0b' : '#cbd5e1'}
                      className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      onClick={() => {
                        sounds.playClick();
                        setNewRating(star);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Gamer Name Input */}
              <div className="mb-3.5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  আপনার গেম নাম বা আসল নাম:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 亗_RAKIB_亗 বা শাকিব"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-colors shadow-xs"
                  value={gamerName}
                  onChange={(e) => setGamerName(e.target.value)}
                  required
                />
              </div>

              {/* Package Bought */}
              <div className="mb-3.5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  কোন প্যাকেজটি নিয়েছেন?
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-colors shadow-xs"
                  value={pkgBought}
                  onChange={(e) => setPkgBought(e.target.value)}
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
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  আপনার অভিজ্ঞতা ও মন্তব্য:
                </label>
                <textarea
                  rows={3}
                  placeholder="ডেলিভারি কেমন লাগলো এবং সার্ভিস সম্পর্কে মতামত লিখুন..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 resize-none transition-colors shadow-xs"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Send size={16} />
                <span>রিভিউ পোস্ট করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
