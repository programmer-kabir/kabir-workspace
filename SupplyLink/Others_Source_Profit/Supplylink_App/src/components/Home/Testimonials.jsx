import React, { useState, useEffect } from "react";
import { useKeenSlider } from "keen-slider/react";
import { FaStar, FaQuoteLeft } from "react-icons/fa6";
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import "keen-slider/keen-slider.min.css";

const testimonials = [
  {
    id: 1,
    name: "মোহাম্মদ আলী",
    role: "স্মার্টফোন কিস্তি ক্রেতা",
    product: "Samsung Galaxy A55 5G",
    location: "মঙ্গলকাটা, সুনামগঞ্জ সদর",
    text: "কোনো জটিল ব্যাংকিং ঝামেলা ছাড়াই মাত্র ৩০% ডাউনপেমেন্টে অফিশিয়াল ফোন হাতে পেয়েছি। প্রতি মাসের কিস্তি পরিশোধও খুব সহজ।",
    initial: "আ",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: 2,
    name: "মোছাঃ নাজমা আক্তার",
    role: "অংশীদারী বিনিয়োগকারী",
    product: "মাসিক মুনাফা পার্টনার",
    location: "মঙ্গলকাটা বাজার, সুনামগঞ্জ",
    text: "লিখিত স্ট্যাম্প চুক্তির মাধ্যমে বিনিয়োগ করেছি। প্রতি মাসের নির্ধারিত তারিখে লাভ পেয়ে যাই। সম্পূর্ণ স্বচ্ছ ও হালাল ব্যবসার অংশীদার হতে পেরে আনন্দিত।",
    initial: "না",
    color: "from-purple-600 to-pink-600",
  },
  {
    id: 3,
    name: "মাহবুব আলম",
    role: "মোটরসাইকেল কিস্তি ক্রেতা",
    product: "Suzuki Gixxer 155 Monotone",
    location: "জাহাঙ্গীরনগর, সুনামগঞ্জ সদর",
    text: "১২ মাসের কিস্তিতে মাত্র ১৫% ফিতে বাইক নিয়েছিলাম। পরে সময়ের আগেই এককালীন বকেয়া পরিশোধ করায় ফির ওপর বিশেষ ছাড়ও পেয়েছি। কোনো হিডেন চার্জ নেই!",
    initial: "মা",
    color: "from-emerald-600 to-teal-600",
  },
  {
    id: 4,
    name: "রহিম উদ্দিন",
    role: "হোম অ্যাপ্লায়েন্স ক্রেতা",
    product: "Walton Non-Frost Refrigerator",
    location: "সুরমা, সুনামগঞ্জ সদর",
    text: "ডাউনপেমেন্ট দেওয়ার পরদিনই ঘরে ফ্রিজ ডেলিভারি পেয়েছি। কিস্তির শর্তগুলো একদম পরিষ্কার, কোনো হিডেন চার্জ ছিল না।",
    initial: "র",
    color: "from-amber-600 to-orange-600",
  },
  {
    id: 5,
    name: "সাবিনা ইয়াসমিন",
    role: "ল্যাপটপ কিস্তি ক্রেতা",
    product: "HP Core i5 Laptop",
    location: "ইসলামপুর, সুনামগঞ্জ সদর",
    text: "ছোট ভাইয়ের পড়াশোনা ও ফ্রিল্যান্সিং কাজের জন্য ল্যাপটপ প্রয়োজন ছিল। সহজ কিস্তিতে অল্প ডাউনপেমেন্টে অফিসিয়াল ল্যাপটপ পেয়েছি।",
    initial: "সা",
    color: "from-indigo-600 to-purple-600",
  },
  {
    id: 6,
    name: "আব্দুল করিম",
    role: "স্মার্ট টিভি ক্রেতা",
    product: "Singer 43\" 4K Smart TV",
    location: "মঙ্গলকাটা, সুনামগঞ্জ সদর",
    text: "কমিটমেন্ট ১০০% ঠিক রাখে। যে পণ্য দেখিয়েছে সেটাই ডেলিভারি দিয়েছে। সুনামগঞ্জ সদরে এরকম নির্ভরযোগ্য প্রতিষ্ঠান সত্যিই প্রশংসনীয়।",
    initial: "কা",
    color: "from-rose-600 to-red-600",
  },
];

export default function Testimonials() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    loop: true,
    mode: "free-snap",
    slides: {
      perView: 3,
      spacing: 24,
    },
    breakpoints: {
      "(max-width: 1024px)": {
        slides: { perView: 2, spacing: 16 },
      },
      "(max-width: 640px)": {
        slides: { perView: 1, spacing: 12 },
      },
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  // Auto slide with pleasant 4.5 second interval
  useEffect(() => {
    const timer = setInterval(() => {
      instanceRef.current?.next();
    }, 4500);

    return () => clearInterval(timer);
  }, [instanceRef]);

  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/60 relative overflow-hidden">
      <div className=" mx-auto">
        {/* Section Heading with Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-14">
          <div className="text-center sm:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
              বিশ্বাস ও অভিজ্ঞতা
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              গ্রাহক ও বিনিয়োগকারীদের বাস্তব মতামত
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              সুনামগঞ্জ অঞ্চলের গ্রাহকরা কীভাবে SupplyLink-এর সেবায় উপকৃত হয়েছেন শুনুন তাদের মুখ থেকেই।
            </p>
          </div>

          {/* Navigation Arrow Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => instanceRef.current?.prev()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition active:scale-95 cursor-pointer"
              aria-label="Previous review"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => instanceRef.current?.next()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition active:scale-95 cursor-pointer"
              aria-label="Next review"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Keen Slider Container */}
        <div ref={sliderRef} className="keen-slider py-2">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="keen-slider__slide flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm hover:shadow-xl hover:border-indigo-400/50 transition-all duration-300 relative group"
            >
              <div>
                {/* Header: User Avatar, Info & Verified Tag */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${item.color} text-white font-bold text-base shadow-md`}
                    >
                      {item.initial}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                    <FiCheckCircle className="h-3 w-3" />
                    <span>ভেরিফাইড</span>
                  </span>
                </div>

                {/* Product / Service Badge */}
                <div className="mb-4 inline-block rounded-xl bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] font-mono font-bold text-slate-700">
                  পণ্য: {item.product}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic relative z-10">
                  "{item.text}"
                </p>
              </div>

              {/* Bottom: 5 Stars & Location */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} size={13} />
                  ))}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <FiMapPin className="text-slate-400 h-3 w-3" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Pagination Dots */}
        {loaded && instanceRef.current && (
          <div className="flex justify-center items-center gap-2 mt-10">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => instanceRef.current?.moveToIdx(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? "w-8 bg-indigo-600"
                    : "w-2.5 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
