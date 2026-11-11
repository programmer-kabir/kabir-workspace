import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import TopHeader from "../components/Dashboard/TopHeader";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../Provider/AuthProvider";
import { FaShieldAlt } from "react-icons/fa";
import LuxuryToast from "../components/Modal/LuxuryToast";
import "./Scrollbar.css";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [auditLuxuryToast, setAuditLuxuryToast] = useState(null);
  const { isAudit } = useAuth();

  const mainRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleScroll = () => {
      if (!window.scrollPositions) window.scrollPositions = {};
      window.scrollPositions[location.pathname] = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll);

    const savedPos = window.scrollPositions?.[location.pathname];
    if (savedPos) {
      container.scrollTo({ top: savedPos, behavior: "instant" });
    } else {
      container.scrollTo({ top: 0, behavior: "instant" });
    }

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  // 🛡️ Global Read-Only Interceptor for Audit Role
  useEffect(() => {
    if (!isAudit) return;

    // 1. Prevent form submit actions in Audit Mode
    const handleFormSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setAuditLuxuryToast({
        title: "অডিট মোড সক্রিয় (Read-Only) 🛡️",
        message: "অডিটর অ্যাকাউন্টে কোনো ফর্ম সাবমিট বা ডাটা এন্ট্রি করার অনুমতি নেই।",
        tag: "Audit Mode",
        type: "warning",
      });
      return false;
    };

    // 2. Intercept mutation action clicks (delete, remove, edit submit, approve, reject)
    const handleActionClick = (e) => {
      const btn = e.target.closest("button, a, input[type='submit']");
      if (!btn) return;

      const text = (btn.innerText || btn.textContent || btn.value || btn.title || "").toLowerCase();

      // Allow navigation links, report viewers, logout, report generation, drive backups, filters, print & view modals
      const isAllowedViewAction =
        Boolean(btn.closest("a")) ||
        text.includes("logout") ||
        text.includes("লগআউট") ||
        text.includes("sign out") ||
        text.includes("signout") ||
        btn.hasAttribute("data-logout") ||
        text.includes("report") ||
        text.includes("রিপোর্ট") ||
        text.includes("drive") ||
        text.includes("ড্রাইভ") ||
        text.includes("today") ||
        text.includes("আজকের") ||
        text.includes("print") ||
        text.includes("প্রিন্ট") ||
        text.includes("filter") ||
        text.includes("ফিল্টার") ||
        text.includes("reset") ||
        text.includes("রিসেট") ||
        text.includes("search") ||
        text.includes("খুঁজুন") ||
        text.includes("refresh") ||
        text.includes("reload") ||
        text.includes("details") ||
        text.includes("বিস্তারিত") ||
        text.includes("view") ||
        text.includes("দেখুন") ||
        text.includes("close") ||
        text.includes("বন্ধ") ||
        text.includes("copy") ||
        text.includes("next") ||
        text.includes("prev") ||
        btn.classList.contains("print-btn") ||
        Boolean(btn.closest("nav")) ||
        Boolean(btn.closest(".pagination"));

      if (isAllowedViewAction) {
        return; // Allow action to execute normally
      }

      const isMutationAction =
        (btn.type === "submit" && Boolean(btn.closest("form"))) ||
        text.includes("delete") ||
        text.includes("delete") ||
        text.includes("ডিলিট") ||
        text.includes("মুছুন") ||
        text.includes("remove") ||
        text.includes("approve") ||
        text.includes("অনুমোদন") ||
        text.includes("reject") ||
        text.includes("বাতিল") ||
        text.includes("withdraw") ||
        text.includes("উত্তোলন") ||
        text.includes("update") ||
        text.includes("আপডেট") ||
        text.includes("create") ||
        text.includes("তৈরি") ||
        text.includes("add ") ||
        text.includes("যোগ করুন") ||
        text.includes("save") ||
        text.includes("সংরক্ষণ");

      if (isMutationAction) {
        e.preventDefault();
        e.stopPropagation();
        setAuditLuxuryToast({
          title: "অডিট মোড সক্রিয় (Read-Only) 🛡️",
          message: "অডিটর হিসেবে আপনি শুধু সিস্টেম দেখতে ও রিপোর্ট পর্যবেক্ষণ করতে পারবেন। কোনো ডাটা পরিবর্তনযোগ্য নয়।",
          tag: "Audit Read-Only",
          type: "warning",
        });
      }
    };

    document.addEventListener("submit", handleFormSubmit, true);
    document.addEventListener("click", handleActionClick, true);

    return () => {
      document.removeEventListener("submit", handleFormSubmit, true);
      document.removeEventListener("click", handleActionClick, true);
    };
  }, [isAudit]);

  return (
    <div className={`h-screen bg-[#060a14] text-slate-100 overflow-hidden flex flex-col md:flex-row selection:bg-indigo-500/30 selection:text-white ${isAudit ? "audit-readonly-mode" : ""}`}>
      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#090f1d] border-r border-white/[0.08] p-4 overflow-y-auto custom-scrollbar shadow-2xl">
          <Sidebar
            closeDrawer={() => setSidebarOpen(false)}
            onLinkClick={() => setSidebarOpen(false)}
          />
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block overflow-y-auto w-72 bg-[#090f1d] border-r border-white/[0.08] custom-scrollbar h-screen sticky top-0 shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden bg-[#060a14]">
        {/* Header */}
        <header className="w-full z-20 shrink-0">
          <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        </header>

        {/* 🛡️ Audit Mode Floating Alert Banner */}
        {isAudit && (
          <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/15 to-emerald-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 shrink-0 z-30 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FaShieldAlt className="text-xs" />
              </span>
              <span className="font-bold text-white tracking-wide">
                Audit Mode Active (সম্পূর্ণ সিস্টেম অডিট - Read-Only)
              </span>
              <span className="text-amber-200/70 hidden lg:inline">
                | সকল মডিউল, ডেটা ও রিপোর্ট দেখার পূর্ণ অনুমতি রয়েছে। কোনো ডেটা তৈরি, এডিট বা মোছার সুযোগ নেই।
              </span>
            </div>
            <span className="bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Read-Only
            </span>
          </div>
        )}

        {/* Scrollable Container with Ambient Top Glow */}
        <main
          id="app-scroll-container"
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 py-5 md:p-6 custom-scrollbar relative bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(99,102,241,0.12),transparent_70%)]"
        >
          <Outlet />
        </main>
      </div>

      {/* 🌟 Luxury Toast for Audit Security Alerts */}
      {auditLuxuryToast && (
        <LuxuryToast
          toast={auditLuxuryToast}
          onClose={() => setAuditLuxuryToast(null)}
          duration={3800}
        />
      )}
    </div>
  );
};

export default MainLayout;
