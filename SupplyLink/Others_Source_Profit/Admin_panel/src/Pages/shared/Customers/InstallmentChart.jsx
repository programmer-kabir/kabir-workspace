import React, { useMemo, useState } from "react";
import CustomerOrderInfo from "../../../components/Chart/CustomerOrderInfo";
import { InstallmentRow } from "../../../components/Chart/InstallmentRow";
import { useSearchParams, Link } from "react-router-dom";
import { FaPlus, FaCheck, FaTimes, FaFire } from "react-icons/fa";
import { HiDocumentText, HiChevronRight } from "react-icons/hi2";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";
import useUsers from "../../../utils/Hooks/useUsers";
import { useAuth } from "../../../Provider/AuthProvider";
import { EarlySettlementModal } from "../../../components/Modal/EarlySettlementModal";

const InstallmentChart = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get("cardId");
  const [, setShowSaveButton] = useState(false);

  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments = [],
    isCustomerInstallmentsPaymentsError,
    refetch,
  } = useCustomerInstallmentPayments();

  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();

  const currentCard = customerInstallmentCards?.find(
    (card) => Number(card.id) === Number(cardId),
  );

  const InstallmentPayments = useMemo(() => {
    return (customerInstallmentPayments || [])
      .filter((payment) => Number(payment.card_id) === Number(cardId))
      .sort((a, b) => {
        const isADown =
          Number(a.installment_no) === 0 ||
          String(a.tag).includes("ডাউন") ||
          String(a.tag).toLowerCase().includes("down");
        const isBDown =
          Number(b.installment_no) === 0 ||
          String(b.tag).includes("ডাউন") ||
          String(b.tag).toLowerCase().includes("down");
        if (isADown && !isBDown) return -1;
        if (!isADown && isBDown) return 1;
        return Number(a.installment_no || 0) - Number(b.installment_no || 0);
      });
  }, [customerInstallmentPayments, cardId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [installmentType, setInstallmentType] = useState("");
  const [hasDownPayment, setHasDownPayment] = useState(false);

  const { users = [] } = useUsers();
  const userId = currentCard?.user_id;

  const isCompanyStaff = useMemo(() => {
    const u = users.find((item) => Number(item.id) === Number(userId));
    if (!u || !Array.isArray(u.roles)) return false;

    const allowed = ["developer", "manager", "admin", "staff"];
    return u.roles.some((r) => allowed.includes(r));
  }, [users, userId]);

  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  React.useEffect(() => {
    if (currentCard) {
      setHasInitialLoaded(true);
    }
  }, [currentCard]);

  const isInitialLoading =
    !hasInitialLoaded &&
    (isCustomerInstallmentsCardsLoading || isCustomerInstallmentsPaymentsLoading);
  const isError =
    isCustomerInstallmentsCardsError || isCustomerInstallmentsPaymentsError;

  if (isInitialLoading) {
    return <Loader />;
  }

  if (isError || !currentCard) {
    return <NoDataFound />;
  }

  const hasExistingPayments = InstallmentPayments?.length > 0;
  const hasUnpaidPayments = InstallmentPayments?.some(
    (p) => p.status !== "Paid" && p.status !== "Waived"
  );

  return (
    <div className="mx-auto space-y-7 pb-10">
      {/* ================= BREADCRUMB & HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link
              to="/customers/installment_cards"
              className="hover:text-slate-200 transition-colors"
            >
              কিস্তি কার্ডসমূহ
            </Link>
            <HiChevronRight className="text-slate-600" />
            <span className="text-indigo-400 font-mono font-semibold">
              কার্ড #{cardId}
            </span>
          </div>
        </div>

        {/* Status Pill Badge & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentCard?.status === "Fully Paid" ? (
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              সম্পূর্ণ পরিশোধিত (Fully Paid)
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              চলমান কিস্তি (Running)
            </span>
          )}

          {/* Quick Early Settlement Button in Header */}
          {hasExistingPayments && hasUnpaidPayments && currentCard?.status !== "Fully Paid" && (
            <button
              onClick={() => setIsSettlementModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-xs font-bold text-white shadow-lg shadow-orange-950/30 hover:brightness-110 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <FaFire className="text-amber-200 text-xs" />
              <span>অগ্রিম নিষ্পত্তি ও ছাড়</span>
            </button>
          )}

          {!hasExistingPayments && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <FaPlus /> নতুন কিস্তি শিডিউল সেটআপ
            </button>
          )}
        </div>
      </div>

      {/* ================= TOP CUSTOMER & PRODUCT DOSSIER ================= */}
      <CustomerOrderInfo
        currentCard={currentCard}
        InstallmentPayments={InstallmentPayments}
      />

      {/* Daily Installment Card Alert Banner */}
      {(Number(currentCard?.is_daily) === 1 || String(currentCard?.remarks || "").toLowerCase() === "daily") && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-cyan-200">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>এটি একটি দৈনিক কিস্তির কার্ড (Daily Installment Card)</span>
                <span className="rounded bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 border border-cyan-500/30 font-mono">
                  দৈনিক আদায় সক্রিয়
                </span>
              </h4>
              <p className="text-xs text-cyan-300/80 mt-0.5">
                এই কার্ডের কিস্তি প্রতিদিন "দৈনিক কিস্তি" মডিউল থেকে আদায় ও ক্যাশ ইন হিসেবে রেকর্ড হয়। ক্যাশের ডাবল এন্ট্রি রোধ করতে মাসিক চার্ট থেকে কোনো ক্যাশ ইন যোগ হবে না।
              </p>
            </div>
          </div>
          <Link
            to={`/DailyInstallments/daily_installments_users/${cardId}`}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap transition shadow-lg shadow-cyan-950 cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-center"
          >
            <span>দৈনিক কিস্তি পেজে যান</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {/* ================= SECTION TITLE ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <HiDocumentText className="text-lg" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              কিস্তি কার্ড: #{cardId} {hasExistingPayments ? "এর কিস্তি চার্ট ও আপডেট" : "এর কিস্তি চার্ট তৈরি"}
            </h2>
            <p className="text-xs text-slate-400">
              {hasExistingPayments
                ? "বর্তমান কিস্তিগুলোর বিবরণ পর্যালোচনা করুন এবং প্রতিটি কিস্তির পেমেন্ট রেকর্ড আপডেট করুন"
                : "নতুন কিস্তির শিডিউল নির্ধারণ করতে উপরের বাটনে ক্লিক করুন"}
            </p>
          </div>
        </div>
      </div>

      {/* ================= INSTALLMENT TABLE ================= */}
      <InstallmentRow
        card={currentCard}
        installmentType={installmentType}
        hasDownPayment={hasDownPayment}
        InstallmentPayments={InstallmentPayments}
        onSaveSuccess={() => setShowSaveButton(false)}
        user={user}
        refetch={refetch}
      />

      {/* ================= MODAL FOR NEW INSTALLMENT SETUP ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FaPlus className="text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    নতুন কিস্তি শিডিউল সেটআপ
                  </h3>
                  <p className="text-xs text-slate-400">
                    কিস্তির মেয়াদ ও ডাউন পেমেন্ট নির্বাচন করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  কিস্তির মেয়াদ (মাসিক কিস্তি সংখ্যা)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "6", label: "৬ মাস কিস্তি", desc: "স্বল্পমেয়াদী প্ল্যান" },
                    { value: "12", label: "১২ মাস কিস্তি", desc: "স্ট্যান্ডার্ড ১ বছর" },
                    ...(isCompanyStaff
                      ? [
                          { value: "18", label: "১৮ মাস কিস্তি", desc: "স্টাফ স্পেশাল" },
                          { value: "24", label: "২৪ মাস কিস্তি", desc: "২ বছর দীর্ঘমেয়াদী" },
                        ]
                      : []),
                  ].map((option) => {
                    const isSelected = installmentType === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => setInstallmentType(option.value)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/20"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">
                            {option.label}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "border-slate-700 text-transparent"
                            }`}
                          >
                            <FaCheck />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {option.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Down Payment Option */}
              <div
                onClick={() => setHasDownPayment(!hasDownPayment)}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  hasDownPayment
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-xs border ${
                      hasDownPayment
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    {hasDownPayment && <FaCheck size={10} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">
                      Down Payment (অগ্রিম জমা) অন্তর্ভুক্ত আছে
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      কার্ডে ডাউন পেমেন্ট ৳ {Number(currentCard?.down_payment || 0).toLocaleString()} থাকলে প্রথম সারিতে যুক্ত হবে
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                disabled={!installmentType}
                onClick={() => setIsModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EARLY SETTLEMENT MODAL ================= */}
      <EarlySettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        card={currentCard}
        customerName={
          users.find((u) => Number(u.id) === Number(currentCard?.user_id))?.name ||
          "গ্রাহক"
        }
        payments={InstallmentPayments}
        user={user}
        onSettlementSuccess={() => {
          refetch?.();
        }}
      />
    </div>
  );
};

export default InstallmentChart;
