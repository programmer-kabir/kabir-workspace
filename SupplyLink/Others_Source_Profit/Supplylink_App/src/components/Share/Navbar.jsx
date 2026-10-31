import React, { useEffect, useState } from "react";
import Content from "./Content";
import { FiMenu, FiX, FiLogIn, FiPhoneCall } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import TopAnnouncementBar from "./TopAnnouncementBar";
import { CONTACT_INFO, getWhatsAppUrl } from "../../constants/links";

const NAV_LINKS = [
  { name: "হোম", href: "hero" },
  { name: "পণ্যসমূহ", href: "products" },
  { name: "ক্যালকুলেটর", href: "calculator" },
  { name: "কিস্তির নিয়ম", route: "/installment-rules" },
  { name: "বিনিয়োগ গাইড", route: "/investors" },
  { name: "গ্যালারি", href: "about" },
  { name: "যোগাযোগ", href: "contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    setOpen(false);

    if (item.route) {
      navigate(item.route);
      window.scrollTo(0, 0);
      return;
    }

    if (item.href) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const el = document.getElementById(item.href);
          if (el) {
            const navbarHeight = 90;
            const pos = el.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: pos - navbarHeight, behavior: "smooth" });
          }
        }, 150);
        return;
      }

      const element = document.getElementById(item.href);
      const navbarHeight = 90;
      if (element) {
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navbarHeight,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const handleScrollEvent = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScrollEvent);
    return () => window.removeEventListener("scroll", handleScrollEvent);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sticky top-0 left-0 w-full z-[100]">
      {/* Top Special Offer Announcement Bar */}
      {showAnnouncement && (
        <TopAnnouncementBar onClose={() => setShowAnnouncement(false)} />
      )}

      {/* Main Navbar Header */}
      <header
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/90 py-3"
            : "bg-white/90 backdrop-blur-md py-3.5 border-b border-slate-100"
        }`}
      >
        <Content>
          <nav className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link
              to="/"
              onClick={() => handleNavClick({ href: "hero" })}
              className="flex items-center gap-2 group shrink-0"
            >
              <img
                src="https://supplylinkbd.com/img/logo/sl_logo.webp"
                alt="SupplyLink — সহজ কিস্তিতে কেনাকাটা ও লাভজনক বিনিয়োগ"
                className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <ul className="hidden lg:flex items-center gap-7">
              {NAV_LINKS.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className="relative text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600 py-1 cursor-pointer"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Right Action Section */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Customer / Investor Portal Login */}
              <a
                href={CONTACT_INFO.userPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition shadow-xs"
                title="গ্রাহক ও বিনিয়োগকারী পোর্টাল লগইন"
              >
                <FiLogIn className="h-3.5 w-3.5 text-indigo-600" />
                <span>পোর্টাল লগইন</span>
              </a>

              {/* Glowing WhatsApp Action Button */}
              <a
                href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তিতে পণ্য কেনা বা বিনিয়োগ সম্পর্কে জানতে আগ্রহী।")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-md shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <FaWhatsapp className="h-4 w-4" />
                <span>WhatsApp সাহায্য</span>
              </a>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                aria-label="Open menu"
              >
                <FiMenu className="text-xl" />
              </button>
            </div>
          </nav>
        </Content>

        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-[120] lg:hidden transition-opacity duration-300 ${
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Panel */}
          <aside
            onClick={(e) => e.stopPropagation()}
            className={`fixed right-0 top-0 z-[130] h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <Link
                to="/"
                onClick={() => {
                  setOpen(false);
                  handleNavClick({ href: "hero" });
                }}
                className="flex items-center"
              >
                <img
                  src="https://supplylinkbd.com/img/logo/sl_logo.webp"
                  alt="SupplyLink"
                  className="h-9 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close menu"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV_LINKS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className="flex w-full items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <span>{item.name}</span>
                  <span className="text-slate-400 text-xs">→</span>
                </button>
              ))}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2.5 bg-slate-50">
              <a
                href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তিতে কেনাকাটা সম্পর্কে সরাসরি কথা বলতে চাই।")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md shadow-green-500/20"
              >
                <FaWhatsapp className="h-4 w-4" />
                <span>WhatsApp-এ মেসেজ পাঠান</span>
              </a>

              <a
                href={`tel:${CONTACT_INFO.callNumber}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FiPhoneCall className="h-3.5 w-3.5 text-indigo-600" />
                <span>সরাসরি কল: {CONTACT_INFO.callNumber}</span>
              </a>

              <a
                href={CONTACT_INFO.userPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 py-2.5 text-xs font-semibold text-indigo-700"
              >
                <FiLogIn className="h-3.5 w-3.5" />
                <span>গ্রাহক / ইনভেস্টর পোর্টাল</span>
              </a>
            </div>
          </aside>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
