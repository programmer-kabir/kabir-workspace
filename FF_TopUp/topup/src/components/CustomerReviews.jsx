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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-5 sm:p-7 my-6 sm:my-8 shadow-xs">
      {/* Header & Overall Rating Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full text-xs text-amber-600 dark:text-amber-400 font-bold mb-1.5">
            <ThumbsUp size={14} /> ১০০% সন্তুষ্ট গেমারদের অভিজ্ঞতা
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            ⭐ গেমারদের রিভিউ ও রেটিং (Customer Reviews)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            হাজারো গেমারের বিশ্বাস ও আস্থার প্রমাণ। দেখে নিন অন্য গেমারদের মতামত:
          </p>
        </div>

        {/* Rating Score Card */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 leading-none">
              4.9
            </div>
            <div className="flex gap-0.5 text-amber-500 mt-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              ১,৪২০+ সফল অর্ডার
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <MessageSquarePlus size={15} />
            <span>রিভিউ দিন</span>
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {reviews.slice(0, 6).map((rev) => (
          <div
            key={rev.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-amber-500/30 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header: User name, package, rating */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {rev.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {rev.name}
                    </div>
                    <div className="text-[10px] text-sky-500 font-semibold">
                      {rev.package}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex gap-0.5 text-amber-500 justify-end">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {rev.time}
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{rev.comment}"
              </p>
            </div>

            {/* Verified buyer badge */}
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <CheckCircle2 size={12} />
              <span>যাচাইকৃত ক্রেতা (Verified Buyer)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer" 
              onClick={() => {
                sounds.playClick();
                setIsModalOpen(false);
              }}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4 text-base font-bold text-slate-900 dark:text-white">
              <Star size={20} className="text-amber-500 fill-amber-500" />
              <span>আপনার অভিজ্ঞতা শেয়ার করুন</span>
            </div>

            <form onSubmit={handleSubmitReview}>
              {/* Star Rating Selector */}
              <div className="mb-4 text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                  রেটিং সিলেক্ট করুন:
                </div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={28}
                      fill={star <= newRating ? '#f59e0b' : 'none'}
                      color={star <= newRating ? '#f59e0b' : '#94a3b8'}
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
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  আপনার গেম নাম বা আসল নাম:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 亗_RAKIB_亗 বা শাকিব"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                  value={gamerName}
                  onChange={(e) => setGamerName(e.target.value)}
                  required
                />
              </div>

              {/* Package Bought */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  কোন প্যাকেজটি নিয়েছেন?
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
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
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  আপনার অভিজ্ঞতা ও মন্তব্য:
                </label>
                <textarea
                  rows={3}
                  placeholder="ডেলিভারি কেমন লাগলো এবং সার্ভিস সম্পর্কে মতামত লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 resize-none"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
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
