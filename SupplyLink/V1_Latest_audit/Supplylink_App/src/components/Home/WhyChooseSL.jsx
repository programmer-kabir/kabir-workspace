import React from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiHeadphones,
  FiShield,
} from "react-icons/fi";

const features = [
  {
    icon: <FiCalendar size={24} className="text-accent-500" />,
    title: "সহজ কিস্তি সুবিধা",
    desc: "৬/১২ মাসের নমনীয় কিস্তি পরিকল্পনা, স্বল্প প্রসেসিং ফি সহ",
  },
  {
    icon: <FiCheckCircle size={24} className="text-accent-500" />,
    title: "যাচাইকৃত পণ্য",
    desc: "প্রতিটি পণ্য যাচাইকৃত ও মানসম্পন্ন নিশ্চিত করা হয়",
  },
  {
    icon: <FiShield size={24} className="text-accent-500" />,
    title: "নিরাপদ বিনিয়োগ",
    desc: "ব্যাংক-মানের নিরাপত্তা ও সুরক্ষিত বিনিয়োগ ব্যবস্থাপনা",
  },
  {
    icon: <FiHeadphones size={24} className="text-accent-500" />,
    title: "২৪/৭ সহায়তা",
    desc: "সর্বক্ষণ গ্রাহক সহায়তা, সব মাধ্যমে দ্রুত সেবা",
  },
];

const WhyChooseSL = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-width mx-auto">
        <div className="text-center mb-14 anim-fade-up delay-100">
          <span className="text-accent-500 text-sm font-semibold tracking-widest uppercase">
            কেন আমরা
          </span>

          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            কেন সাপ্লাইলিংক বেছে নেবেন
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`glass-card rounded-2xl p-6 text-center anim-fade-up delay-${(i + 2) * 100} hover:border-accent-500/50 transition-all`}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
                {f.icon}
              </div>

              <h3 className="font-semibold text-sm text-gray-900">
                {f.title}
              </h3>

              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSL;