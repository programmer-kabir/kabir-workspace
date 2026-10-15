import React, { useEffect } from "react";
import { useKeenSlider } from "keen-slider/react";
import { FaStar } from "react-icons/fa6";
import { FiCheckCircle } from "react-icons/fi";
import "keen-slider/keen-slider.min.css";

const testimonials = [
  {
    name: "মোহাম্মদ আলী",
    role: "গ্রাহক ও বিনিয়োগকারী",
    location: "মঙ্গলকাটা, সুনামগঞ্জ সদর, সুনামগঞ্জ",
    text: "কিস্তিতে ফোন কিনেছি, সাথে বিনিয়োগে ভালো রিটার্ন পাচ্ছি।",
    avatar: "👩🏽‍💼",
  },
  {
    name: " মোছাঃ নাজমা আক্তার",
    role: "গ্রাহক ও বিনিয়োগকারী",
    location: " ও বিনিয়োগকারী",
    location: "মঙ্গলকাটা, সুনামগঞ্জ সদর,সুনামগঞ্জ",
    text: "সহজ কিস্তি ও নির্ভরযোগ্য বিনিয়োগ—দুটোই একসাথে পেয়েছি।",
    avatar: "👨🏻‍💻",
  },
  {
    name: "মাহবুব আলম",
    role: "গ্রাহক ",
    location: "জাহাঙ্গীরনগর, মঙ্গলকাটা, সুনামগঞ্জ সদর",
text: "কিস্তিতে সহজেই মোটরসাইকেল কিনেছি, সার্ভিস খুবই ভালো।",
    avatar: "👩🏽‍🔬",
  },
  {
    name: "রহিম উদ্দিন",
    role: "গ্রাহক",
    location: "জাহাঙ্গীরনগর, মঙ্গলকাটা, সুনামগঞ্জ সদর",
    text: "ডাউন পেমেন্ট দিয়ে দ্রুত পণ্য পেয়েছি।",
    avatar: "👨🏽‍💼",
  },
  {
    name: "সাবিনা ইয়াসমিন",
    role: "গ্রাহক",
    location: "ইসলামপুর, মঙ্গলকাটা, সুনামগঞ্জ সদর",
    text: "কোনো লুকানো চার্জ নেই। খুব ভালো লেগেছে।",
    avatar: "👩🏻‍💻",
  },
];

export default function Testimonials() {
  const [sliderRef, slider] = useKeenSlider({
    loop: true,
    mode: "free-snap",
    slides: {
      perView: 4,
      spacing: 20,
    },
    breakpoints: {
      "(max-width: 1024px)": {
        slides: { perView: 2, spacing: 15 },
      },
      "(max-width: 640px)": {
        slides: { perView: 1, spacing: 10 },
      },
    },
  });

  // Auto slide
  useEffect(() => {
    if (!slider) return;
    const interval = setInterval(() => {
      slider.current?.next();
    }, 2000);

    return () => clearInterval(interval);
  }, [slider]);

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-width mx-auto text-center">
        <span className="text-indigo-600 text-xs font-semibold tracking-widest uppercase">
          গ্রাহকদের মতামত
        </span>

        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">
          আমাদের উপর হাজারো মানুষের বিশ্বাস
        </h2>

        <div ref={sliderRef} className="keen-slider mt-14">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="keen-slider__slide bg-white shadow-lg rounded p-6 border border-slate-100 hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                  {t.avatar}
                </div>

                <div className="text-left">
                  <p className="font-semibold text-sm text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-indigo-600">{t.role}</p>
                  <p className="text-xs text-slate-500">{t.location}</p>
                </div>

                <FiCheckCircle className="text-green-500 ml-auto" size={16} />
              </div>

              <p className="text-sm text-slate-600 leading-relaxed text-start">
                "{t.text}"
              </p>

              <div className="mt-4 flex gap-1 text-yellow-400">
                {[...Array(5)].map((_, index) => (
                  <FaStar key={index} size={14} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
