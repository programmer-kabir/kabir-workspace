import React from "react";
import { Link } from "react-router-dom";
import { FiPhone, FiMail, FiMapPin, FiExternalLink, FiShield } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { CONTACT_INFO, getWhatsAppUrl } from "../../constants/links";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-slate-50 text-slate-600 pt-14 pb-8 sm:pt-16 sm:pb-10 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-200">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-block group"
            >
              <img
                src="https://supplylinkbd.com/img/logo/sl_logo.webp"
                alt="SupplyLink"
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              SupplyLink একটি আধুনিক ফিনটেক ও কিস্তি প্ল্যাটফর্ম যা সহজ কিস্তিতে গ্রাহকদের স্বপ্নের পণ্য সরবরাহ করে এবং বিনিয়োগকারীদের অংশীদারিত্বের ভিত্তিতে হালাল মুনাফা প্রদান করে।
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition shadow-xs"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="h-4 w-4" />
              </a>
              <a
                href={`tel:${CONTACT_INFO.callNumber}`}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100/70 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-xs"
                aria-label="Phone"
              >
                <FiPhone className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              দ্রুত লিংক
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => scrollTo("hero")}
                  className="hover:text-indigo-600 font-medium transition cursor-pointer text-slate-600"
                >
                  হোম পেজ
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("products")}
                  className="hover:text-indigo-600 font-medium transition cursor-pointer text-slate-600"
                >
                  কিস্তিতে জনপ্রিয় পণ্য
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("calculator")}
                  className="hover:text-indigo-600 font-medium transition cursor-pointer text-slate-600"
                >
                  স্মার্ট EMI ক্যালকুলেটর
                </button>
              </li>
              <li>
                <Link
                  to="/installment-rules"
                  className="text-indigo-700 hover:text-indigo-900 font-bold transition flex items-center gap-1.5"
                >
                  <span>📜 কিস্তির পূর্ণাঙ্গ নির্দেশিকা (৬ ও ১২ মাস)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/investors"
                  className="text-emerald-700 hover:text-emerald-900 font-bold transition flex items-center gap-1.5"
                >
                  <span>💼 বিনিয়োগকারী নির্দেশিকা ও স্ট্যাম্প</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("about")}
                  className="hover:text-indigo-600 font-medium transition cursor-pointer text-slate-600"
                >
                  গ্রাহক ডেলিভারি গ্যালারি
                </button>
              </li>
            </ul>
          </div>

          {/* Dedicated Portals */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              পোর্টাল লগইন
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href={CONTACT_INFO.userPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-bold transition"
                >
                  <span>গ্রাহক ড্যাশবোর্ড</span>
                  <FiExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_INFO.userPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-bold transition"
                >
                  <span>ইনভেস্টর পোর্টাল</span>
                  <FiExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_INFO.adminPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition"
                >
                  <span>অ্যাডমিন ও স্টাফ প্যানেল</span>
                  <FiExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              যোগাযোগ ও অফিস
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <FiMapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="text-slate-700">{CONTACT_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="h-4 w-4 text-emerald-600 shrink-0" />
                <a href={`tel:${CONTACT_INFO.callNumber}`} className="text-slate-800 hover:text-indigo-600 font-semibold">
                  {CONTACT_INFO.callNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FaWhatsapp className="h-4 w-4 text-emerald-600 shrink-0" />
                <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 font-semibold">
                  {CONTACT_INFO.whatsappNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="text-slate-700">{CONTACT_INFO.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} SupplyLink Operational System. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <FiShield className="text-emerald-600 h-4 w-4" />
            <span>১০০% নিরাপদ ও স্বচ্ছ কিস্তি প্ল্যাটফর্ম</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
