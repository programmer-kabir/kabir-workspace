import React from "react";

const CtaBanner = () => {
  const whatsappNumber = "8801339631586"; // BD format (without 0)
  const callNumber = "01339631586";

  return (
    <section className="py-20 px-6">
      <div className="max-width mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden px-4 py-10 md:p-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #fae8ff 100%)",
          }}
        >
          <div
            className="orb w-48 h-48 bg-accent-500/20 absolute"
            style={{ top: "-20px", left: "-20px" }}
          ></div>

          <div
            className="orb w-36 h-36 bg-purple-500/20 absolute"
            style={{ bottom: "-20px", right: "-20px" }}
          ></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-gray-900">
              আপনার আর্থিক ভবিষ্যৎ করুন{" "}
              <span className="gradient-text">আরও স্মার্ট ও সহজ</span>
            </h2>

            <p className="mt-5 text-gray-700 text-lg max-w-2xl mx-auto">
              আজই SupplyLink-এ যুক্ত হয়ে কিস্তিতে সহজ কেনাকাটা করুন অথবা
              একজন যাচাইকৃত বিনিয়োগকারী হিসেবে আয় শুরু করুন।
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              
              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold"
              >
                ফ্রি অ্যাকাউন্ট খুলুন
              </a>

              {/* Call Button */}
              <a
                href={`tel:${callNumber}`}
                className="px-10 py-4 rounded-xl text-base font-medium text-accent-700 border-2 border-accent-300 hover:bg-accent-50 transition-all"
              >
                আমাদের সাথে কথা বলুন
              </a>
            </div>

            <p className="mt-6 text-xs text-gray-600">
              কোনো ক্রেডিট কার্ড প্রয়োজন নেই • ২ মিনিটে শুরু করুন
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;