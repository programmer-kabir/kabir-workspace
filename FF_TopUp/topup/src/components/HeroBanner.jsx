import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Search, 
  ShieldCheck, 
  Flame, 
  Crown, 
  Gift, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

const SLIDES = [
  {
    id: 'ff-bd-uid',
    productId: 'ff-bd-uid',
    tag: 'গ্যারেনা অফিসিয়াল পার্টনার • ১-৩ মিনিটে অটো ডেলিভারি',
    tagIcon: Zap,
    tagColor: 'bg-sky-50 border-sky-200 text-sky-700',
    titleStart: 'সবচেয়ে কম রেটে',
    titleHighlight: 'ডায়মন্ড ও মেম্বারশিপ',
    titleEnd: 'টপ-আপ',
    highlightGradient: 'from-sky-600 via-blue-600 to-indigo-600',
    desc: 'বিকাশ, নগদ, রকেট ও ইনস্ট্যান্ট ওয়ালেট পেমেন্টে ১-৩ মিনিটে ইন-গেম ডায়মন্ড ডেলিভারি। কোনো পাসওয়ার্ড ছাড়াই শুধুমাত্র আপনার প্লেয়ার UID দিয়ে নিশ্চিন্তে রিচার্জ করুন।',
    ctaText: 'এখনই টপ-আপ করুন',
    ctaGradient: 'from-sky-600 via-blue-600 to-sky-500 hover:from-sky-700 hover:to-blue-700',
    ctaShadow: 'shadow-sky-500/25 hover:shadow-sky-500/40',
    badges: [
      { text: '১০০% আইডি ব্যান ঝুঁকি নেই', icon: CheckCircle2, color: 'text-emerald-600' },
      { text: 'পাসওয়ার্ড ছাড়া শুধু UID', icon: ShieldCheck, color: 'text-sky-600' },
      { text: '২৪/৭ লাইভ ডেলিভারি', icon: Flame, color: 'text-amber-500' }
    ],
    image: '/images/ff_diamond.jpg',
    imageTitle: 'Free Fire UID',
    imageSubtitle: '২৫ থেকে ২৫৩০ ডায়মন্ড',
    badgeText: 'সেরা অফার ৩৫% ছাড়',
    badgeBg: 'bg-rose-600',
    startingPrice: '৳২৩',
    ambientBg: 'bg-sky-400/10'
  },
  {
    id: 'ff-membership',
    productId: 'ff-membership',
    tag: 'ভিআইপি মেম্বারশিপ পাস • প্রতিদিন ডায়মন্ড ক্লেইম',
    tagIcon: Crown,
    tagColor: 'bg-amber-50 border-amber-200 text-amber-700',
    titleStart: 'সর্বোচ্চ সেভিংস অফারে',
    titleHighlight: 'উইকলি ও মান্থলি VIP',
    titleEnd: 'পাস',
    highlightGradient: 'from-amber-600 via-orange-600 to-rose-600',
    desc: 'বাজারে সবচেয়ে কম খরচে সর্বোচ্চ ২৬০০ ডায়মন্ড ও এক্সক্লুসিভ গান স্কিন আনলক করুন এক ক্লিকে। ডেইলি ক্লেইম ডায়মন্ড সহ ইনস্ট্যান্ট অ্যাক্টিভেশন।',
    ctaText: 'মেম্বারশিপ নিন',
    ctaGradient: 'from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600',
    ctaShadow: 'shadow-amber-500/25 hover:shadow-amber-500/40',
    badges: [
      { text: 'সর্বোচ্চ ২৬০০ ডায়মন্ড', icon: Crown, color: 'text-amber-600' },
      { text: 'ডেইলি ৫০ ডায়মন্ড ক্লেইম', icon: Sparkles, color: 'text-rose-500' },
      { text: 'ইনস্ট্যান্ট অ্যাক্টিভেশন', icon: Zap, color: 'text-emerald-600' }
    ],
    image: '/images/membership.jpg',
    imageTitle: 'VIP Pass',
    imageSubtitle: 'উইকলি ও মান্থলি মেম্বারশিপ',
    badgeText: 'VIP মেম্বারশিপ 👑',
    badgeBg: 'bg-amber-600',
    startingPrice: '৳৪২',
    ambientBg: 'bg-amber-400/10'
  },
  {
    id: 'ff-special-airdrop',
    productId: 'ff-special-airdrop',
    tag: '৯৯% ডিসকাউন্ট ডিল • স্পেশাল ড্রপ ও বক্স',
    tagIcon: Gift,
    tagColor: 'bg-purple-50 border-purple-200 text-purple-700',
    titleStart: 'লাকি গিফট অফার',
    titleHighlight: 'স্পেশাল এয়ারড্রপ ও মিস্ট্রি',
    titleEnd: 'বক্স',
    highlightGradient: 'from-purple-600 via-pink-600 to-rose-600',
    desc: 'মাত্র ১০ টাকা থেকে শুরু! আপনার গেম আইডির জন্য ইনস্ট্যান্ট লাকি এয়ারড্রপ ও মিস্ট্রি বক্স নিশ্চিত ডায়মন্ড সহ বুঝে নিন ১ মিনিটে।',
    ctaText: 'এয়ারড্রপ নিন',
    ctaGradient: 'from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-pink-700',
    ctaShadow: 'shadow-purple-500/25 hover:shadow-purple-500/40',
    badges: [
      { text: '১০ টাকার অফার শুরু', icon: Gift, color: 'text-purple-600' },
      { text: '১-ট্যাপে এমএফএস পে', icon: Zap, color: 'text-sky-600' },
      { text: 'নিশ্চিত ডায়মন্ড বক্স', icon: CheckCircle2, color: 'text-emerald-600' }
    ],
    image: '/images/ff_diamond.jpg',
    imageTitle: 'Special Deal',
    imageSubtitle: 'মিস্ট্রি বক্স ও লাকি এয়ারড্রপ',
    badgeText: '৯৯% ডিসকাউন্ট 🎁',
    badgeBg: 'bg-purple-600',
    startingPrice: '৳১০',
    ambientBg: 'bg-purple-400/10'
  }
];

export const HeroBanner = () => {
  const { products, startTopup, openOrderTracker } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = () => {
    sounds.playClick();
    setCurrentSlide(prev => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    sounds.playClick();
    setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const goToSlide = (idx) => {
    sounds.playClick();
    setCurrentSlide(idx);
  };

  // Auto-play slider every 5.5s
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 5500);

    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  const slide = SLIDES[currentSlide];
  const TagIcon = slide.tagIcon;

  const handleTopupClick = () => {
    sounds.playClick();
    const targetProduct = products.find(p => p.id === slide.productId) || products[0];
    if (targetProduct) {
      startTopup(targetProduct);
    }
  };

  const handleTrackClick = () => {
    sounds.playClick();
    if (openOrderTracker) {
      openOrderTracker();
    }
  };

  return (
    <section className="py-5 sm:py-7 relative group">
      <div 
        className="relative rounded-3xl overflow-hidden border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-sky-50/40 shadow-lg p-6 sm:p-8 md:p-11 transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        
        {/* Ambient Subtle Glow */}
        <div className={`absolute -top-24 -left-24 w-80 h-80 ${slide.ambientBg} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Headlines, Paragraph & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Top Verified Tag */}
            <div className={`self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${slide.tagColor} text-xs font-bold mb-4 shadow-2xs transition-all duration-300`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <TagIcon size={14} className="fill-current" />
              <span>{slide.tag}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-slate-900 leading-[1.2] tracking-tight mb-4 transition-all duration-300">
              {slide.titleStart}{' '}
              <span className={`bg-gradient-to-r ${slide.highlightGradient} bg-clip-text text-transparent`}>
                {slide.titleHighlight}
              </span>{' '}
              {slide.titleEnd}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed mb-6 font-medium transition-all duration-300">
              {slide.desc}
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              <button 
                id="hero-topup-cta-btn"
                onClick={handleTopupClick}
                className={`inline-flex items-center gap-2.5 bg-gradient-to-r ${slide.ctaGradient} text-white font-black px-7 py-3.5 rounded-2xl shadow-lg ${slide.ctaShadow} hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-xs sm:text-sm tracking-wide`}
              >
                <Sparkles size={17} />
                <span>{slide.ctaText}</span>
                <ArrowRight size={17} />
              </button>

              <button 
                onClick={handleTrackClick}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold px-6 py-3.5 rounded-2xl border border-slate-300 hover:border-slate-400 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm shadow-2xs"
              >
                <Search size={16} className="text-sky-600" />
                <span>অর্ডার ট্র্যাক করুন</span>
              </button>
            </div>

            {/* Trust Micro-Pill Badges with Generous Breathing Room */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 pt-2">
              {slide.badges.map((badge, bIdx) => {
                const BIcon = badge.icon;
                return (
                  <div 
                    key={bIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs"
                  >
                    <BIcon size={14} className={badge.color} />
                    <span>{badge.text}</span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div 
              className="w-full max-w-md lg:max-w-xl bg-white border border-slate-200/90 rounded-3xl p-3 sm:p-4 shadow-xl hover:shadow-2xl hover:border-sky-300 transition-all duration-300 cursor-pointer"
              onClick={handleTopupClick}
            >
              <div className="aspect-[16/10] rounded-2xl overflow-hidden relative bg-slate-900">
                <img 
                  src={slide.image} 
                  alt={slide.imageTitle} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                {/* Floating Offer Badge */}
                <div className={`absolute top-3 left-3 ${slide.badgeBg} text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1`}>
                  <span>{slide.badgeText}</span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white">
                  <div>
                    <div className="text-xs text-sky-300 font-bold uppercase tracking-wider">{slide.imageTitle}</div>
                    <div className="text-base sm:text-lg font-black">{slide.imageSubtitle}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 font-bold block">শুরু মাত্র</span>
                    <span className="text-lg sm:text-xl font-black text-amber-300">{slide.startingPrice}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-slate-700">স্বয়ংক্রিয় ডেলিভারি সক্রিয়</span>
                </div>
                <div className="font-black text-sky-600 flex items-center gap-1 hover:text-sky-700 transition-colors">
                  <span>টপ-আপ নিন</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Navigation Arrows (Codashop / UniPin Style) */}
        <button 
          onClick={prevSlide}
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-md hover:bg-white hover:scale-110 active:scale-95 items-center justify-center transition-all cursor-pointer z-20"
          title="পূর্ববর্তী স্লাইড"
        >
          <ChevronLeft size={18} />
        </button>

        <button 
          onClick={nextSlide}
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-md hover:bg-white hover:scale-110 active:scale-95 items-center justify-center transition-all cursor-pointer z-20"
          title="পরবর্তী স্লাইড"
        >
          <ChevronRight size={18} />
        </button>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8 relative z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 cursor-pointer ${
                currentSlide === idx 
                  ? 'w-7 h-2 rounded-full bg-sky-600 shadow-xs' 
                  : 'w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400'
              }`}
              title={`স্লাইড ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
