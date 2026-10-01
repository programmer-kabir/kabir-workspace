import React, { useMemo, useState } from "react";
import CustomerOrderInfo from "../../../components/Chart/CustomerOrderInfo";
import { InstallmentRow } from "../../../components/Chart/InstallmentRow";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  FaPlus,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaChartPie,
  FaReceipt,
} from "react-icons/fa";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";
import useUsers from "../../../utils/Hooks/useUsers";
import { useAuth } from "../../../Provider/AuthProvider";

const InstallmentChart = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get("cardId");
  const [showSaveButton, setShowSaveButton] = useState(false);

  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsError,
    refetch,
  } = useCustomerInstallmentPayments();

  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();

  const currentCard = useMemo(() => {
    if (!customerInstallmentCards?.length) return null;
    return (
      customerInstallmentCards.find(
        (card) =>
          card.card_id !== null &&
          card.card_id !== undefined &&
          String(card.card_id).trim() === String(cardId).trim()
      ) || null
    );
  }, [customerInstallmentCards, cardId]);

  const InstallmentPayments = useMemo(() => {
    if (!customerInstallmentPayments?.length || !currentCard) return [];
    return customerInstallmentPayments.filter(
      (payment) => String(payment.card_id).trim() === String(currentCard.card_id).trim()
    );
  }, [customerInstallmentPayments, currentCard]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installmentType, setInstallmentType] = useState("");
  const [hasDownPayment, setHasDownPayment] = useState(false);

  const { users = [] } = useUsers();
  const userId = currentCard?.user_id;

  const isCompanyStaff = useMemo(() => {
    if (!userId) return false;
    const foundUser = users.find(
      (u) => Number(u.user_id) === Number(userId)
    );
    if (!foundUser || !Array.isArray(foundUser.roles)) return false;

    const allowed = ["developer", "manager", "admin", "staff"];
    return foundUser.roles.some((r) => allowed.includes(r));
  }, [users, userId]);

  const isLoading =
    isCustomerInstallmentsCardsLoading || isCustomerInstallmentsPaymentsLoading;
  const isError =
    isCustomerInstallmentsCardsError || isCustomerInstallmentsPaymentsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (isError || !currentCard) {
    return (
      <div className="space-y-4 pt-2">
        <BackButton />
        <NoDataFound message="Card Not Found" subMessage="Please verify the card ID or selection" />
      </div>
    );
  }

  const isCompleted = currentCard?.status === "Fully Paid";
  const displayCardId = currentCard?.card_id || currentCard?.id;

  return (
    <div className="mx-auto space-y-6 pt-2 pb-12">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4">
        <BackButton />

        <div className="flex items-center gap-2">
          {/* Card ID Chip */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono font-bold text-xs sm:text-sm shadow-sm">
            <FaCreditCard className="text-xs text-cyan-400" />
            <span>Card #{displayCardId}</span>
          </span>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
            }`}
          >
            {isCompleted ? (
              <>
                <FaCheckCircle className="text-xs" /> Fully Paid
              </>
            ) : (
              <>
                <FaClock className="text-xs" /> Running
              </>
            )}
          </span>
        </div>
      </div>

      {/* Customer & Product Info Grid */}
      <CustomerOrderInfo currentCard={currentCard} />

      {/* Section Title & Setup Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm shadow-sm">
            <FaReceipt />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {location.pathname.includes("update") || InstallmentPayments.length > 0
                ? `কিস্তি কার্ড #${displayCardId} এর কিস্তি তালিকা ও পেমেন্ট আপডেট`
                : `কিস্তি কার্ড #${displayCardId} এর নতুন কিস্তি চার্ট তৈরি`}
            </h2>
            <p className="text-xs text-slate-400">
              {InstallmentPayments.length > 0
                ? `মোট ${InstallmentPayments.length} টি কিস্তি রেকর্ড অন্তর্ভুক্ত রয়েছে`
                : "নতুন কিস্তি শিডিউল সেটআপ করুন এবং সংরক্ষণ করুন"}
            </p>
          </div>
        </div>

        {InstallmentPayments?.length <= 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all self-start sm:self-auto"
          >
            <FaPlus className="text-xs" />
            <span>নতুন কিস্তি সেটআপ করুন</span>
          </button>
        )}
      </div>

      {/* Installment Table Component */}
      <InstallmentRow
        card={currentCard}
        installmentType={installmentType}
        hasDownPayment={hasDownPayment}
        InstallmentPayments={InstallmentPayments}
        onSaveSuccess={() => setShowSaveButton(false)}
        user={user}
        refetch={refetch}
      />

      {/* ===== Setup Modal ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0B1324] border border-slate-800 p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm">
                  <FaChartPie />
                </div>
                <h3 className="text-base font-bold text-white">নতুন কিস্তি শিডিউল সেটআপ</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Installment Options */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                কিস্তির মেয়াদ নির্বাচন করুন
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: "6", label: "৬ মাস কিস্তি" },
                  { value: "12", label: "১২ মাস কিস্তি" },
                  ...(isCompanyStaff
                    ? [
                        { value: "18", label: "১৮ মাস কিস্তি" },
                        { value: "24", label: "২৪ মাস কিস্তি" },
                      ]
                    : []),
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      installmentType === opt.value
                        ? "bg-cyan-500/15 border-cyan-400 text-white font-bold shadow-md shadow-cyan-500/15"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="installment"
                      value={opt.value}
                      checked={installmentType === opt.value}
                      onChange={() => setInstallmentType(opt.value)}
                      className="accent-cyan-400"
                    />
                    <span className="text-xs">{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Down Payment Checkbox */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={hasDownPayment}
                  onChange={(e) => setHasDownPayment(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Down Payment (ডাউন পেমেন্ট) অন্তর্ভুক্ত আছে
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ৳ {Number(currentCard?.down_payment || 0).toLocaleString()} প্রারম্ভিক জমা
                  </span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                বাতিল
              </button>

              <button
                disabled={!installmentType}
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-xl px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 transition"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentChart;
