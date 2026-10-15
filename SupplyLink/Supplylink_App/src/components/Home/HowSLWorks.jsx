
import { FiCreditCard, FiTruck, FiUserCheck } from "react-icons/fi";

const steps = [
  {
    icon: <FiUserCheck size={26} />,
    title: "👉 কিস্তির জন্য আবেদন করুন",
    desc: "কিস্তিতে পণ্য ক্রয়ের জন্য আমাদের অফিসে সরাসরি যোগাযোগ করুন অথবা WhatsApp এর মাধ্যমে প্রয়োজনীয় তথ্য ও কাগজপত্র জমা দিন। আমাদের প্রতিনিধি দ্রুত আপনার আবেদন যাচাই করবেন।",
    details: [
      "জাতীয় পরিচয়পত্র (NID) এর ফটোকপি",
      "১ কপি পাসপোর্ট সাইজ ছবি",
      "একজন গ্যারান্টরের NID ও ছবি",
      "সক্রিয় মোবাইল নম্বর ও বর্তমান ঠিকানা",
    ],
  },
  {
    icon: <FiCreditCard size={26} />,
    title: "👉 পণ্য ও কিস্তির প্ল্যান নির্বাচন করুন",
    desc: "আপনার পছন্দের পণ্য বাছাই করুন এবং আপনার আয় ও সামর্থ্য অনুযায়ী সুবিধাজনক কিস্তির মেয়াদ নির্বাচন করুন। সব মূল্য ও শর্তাবলী পরিষ্কারভাবে জানিয়ে দেওয়া হবে।",
    details: [
      "আপনার সামর্থ্য অনুযায়ী নমনীয় কিস্তি পরিকল্পনা",
      "কোনো লুকানো চার্জ ছাড়া সম্পূর্ণ স্বচ্ছ মূল্য",
      "ডাউন পেমেন্ট ও মাসিক কিস্তির স্পষ্ট হিসাব",
      "সহজ ও দ্রুত অনুমোদন প্রক্রিয়া",
    ],
  },
  {
    icon: <FiTruck size={26} />,
    title: "👉 পণ্য গ্রহণ করুন",
    desc: "অনুমোদন ও ডাউন পেমেন্ট সম্পন্ন হওয়ার পর নির্ধারিত সময়ের মধ্যে আপনার পণ্য সরবরাহ করা হবে। এরপর নির্ধারিত সময় অনুযায়ী সহজ কিস্তিতে পরিশোধ করুন।",
    details: [
      "দ্রুত ও নির্ভরযোগ্য পণ্য ডেলিভারি",
      "সম্পূর্ণ নিরাপদ ও বৈধ ডকুমেন্টেশন",
      "ঝামেলাহীন সহজ মাসিক কিস্তি পরিশোধ",
      "গ্রাহক সহায়তা টিম সর্বদা প্রস্তুত",
    ],
  },
];

export const HowSLWorks = () => {

  return (
    <section
      id="how-it-works"
      className="py-24 px-6 bg-gradient-to-br from-slate-50 to-indigo-50 relative"
    >
      <div className="max-width mx-auto relative ">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-xs font-semibold tracking-[0.25em] uppercase">
           প্রক্রিয়া
          </span>

          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">
             কিস্তিতে কেনাকাটা কীভাবে কাজ করে
          </h2>

          <p className="mt-4 text-slate-600 max-w-xl mx-auto">
           সহজ ৩টি ধাপে আপনার পছন্দের পণ্য কিস্তিতে কিনুন — দ্রুত, স্বচ্ছ এবং নির্ভরযোগ্য প্রক্রিয়ায়।
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div
              key={i}
              className="relative p-8 rounded-2xl bg-white shadow-lg border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                {i + 1}
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                {s.icon}
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                {s.title}
              </h3>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {s.desc}
              </p>

              {/* Extra Details */}
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {s.details.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
