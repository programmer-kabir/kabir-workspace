import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import Loader from "../../../components/Loader/Loader";
import useUsers from "../../../utils/Hooks/useUsers";
import CustomerCardView from "../../../components/Dashboard/CustomerCardView";
import BackButton from "../../../components/BackButton/BackButton";
import useCustomerGranter from "../../../utils/Granters/useCustomerGranter";
import CustomerDetailsPrintView from "../../../components/Dashboard/Customer/CustomerDetailsPrintView/CustomerDetailsPrintView";
import {
  FaUser,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaPrint,
  FaShieldAlt,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

const CustomerDetails = () => {
  const [showPrint, setShowPrint] = useState(false);

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const { users = [], isUsersError, isUsersLoading } = useUsers();
  const user = users.find(
    (u) => Number(u.user_id) === Number(userId) || Number(u.id) === Number(userId)
  );
  const {
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsError,
    isCustomerInstallmentsCardsLoading,
  } = useCustomerInstallmentCards();

  const {
    customerInstallmentPayments = [],
    isCustomerInstallmentsPaymentsError,
    isCustomerInstallmentsPaymentsLoading,
  } = useCustomerInstallmentPayments();

  const {
    CustomerGranter = [],
    isCustomerGranterError,
    isCustomerGranterLoading,
  } = useCustomerGranter();

  const runningUserGranter = CustomerGranter.find(
    (granter) =>
      Number(granter.customer_user_id) === Number(user?.user_id)
  );
  const granterId = runningUserGranter?.guarantor_user_id;
  const granter = users.find(
    (u) => Number(u.user_id) === Number(granterId)
  );

  if (
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    isCustomerGranterLoading ||
    isUsersLoading
  ) {
    return (
      <div className="text-center min-h-[60vh] w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (
    isCustomerInstallmentsCardsError ||
    isCustomerInstallmentsPaymentsError ||
    isCustomerGranterError ||
    isUsersError
  ) {
    return (
      <div className="px-5 md:px-20 py-10 text-center text-rose-400">
        Something went wrong. Please try again later.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-5 md:px-20 py-10 text-center text-rose-400">
        User not found.
      </div>
    );
  }

  const myCards =
    customerInstallmentCards.filter(
      (card) =>
        Number(card.user_id) === Number(user.user_id)
    ) || [];

  const myCardsWithPayments = myCards.map((card) => {
    const payments =
      customerInstallmentPayments.filter(
        (payment) =>
          Number(payment.card_id) === Number(card.card_id)
      ) || [];

    const downPayment = payments.find((p) => Number(p.installment_no) === 0);
    const hasDown = !!downPayment;
    const regular = payments.filter((p) => Number(p.installment_no) > 0);
    const all = hasDown ? [downPayment, ...regular] : regular;

    const paidCount = all.filter((p) => p.status === "Paid").length;
    const total = Number(card.installment_count) + (hasDown ? 1 : 0);
    const progress = total ? Math.round((paidCount / total) * 100) : 0;

    return { ...card, payments, progress };
  });

  // Running first, then completed
  const runningCards = myCardsWithPayments.filter(
    (card) => card.status !== "Fully Paid"
  );
  const completedCards = myCardsWithPayments.filter(
    (card) => card.status === "Fully Paid"
  );
  const sortedCards = [...runningCards, ...completedCards];

  // PRINT VIEW
  if (showPrint) {
    return (
      <CustomerDetailsPrintView
        user={user}
        granter={granter}
        cards={sortedCards}
        onClose={() => setShowPrint(false)}
        minRows={0}
        users={users}
      />
    );
  }

  const totalSaleAmount = sortedCards.reduce(
    (sum, c) => sum + Number(c.sale_price || 0),
    0
  );

  return (
    <div className="pt-2 pb-10 space-y-6">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between gap-4">
        <BackButton />

        <button
          onClick={() => setShowPrint(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition duration-200"
        >
          <FaPrint className="text-xs" />
          <span>Print View</span>
        </button>
      </div>

      {/* Customer Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0C1427]/90 to-slate-950/95 border border-slate-800 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Customer Avatar & Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg text-xl font-black">
              {user?.name?.slice(0, 2).toUpperCase() || <FaUser className="text-lg" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {user?.name || "Unnamed Customer"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono font-bold text-xs">
                  ID #{user?.user_id || user?.id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                {user?.mobile && (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <FaPhoneAlt className="text-cyan-400 text-[10px]" />
                    <span className="font-mono">{user.mobile}</span>
                  </span>
                )}
                {user?.address && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <FaMapMarkerAlt className="text-indigo-400 text-[10px]" />
                    <span className="truncate max-w-[280px] sm:max-w-md">
                      {user.address}
                    </span>
                  </span>
                )}
              </div>

              {granter && (
                <div className="pt-1 flex items-center gap-2 text-xs text-amber-300/90">
                  <FaShieldAlt className="text-amber-400 text-[11px]" />
                  <span>Guarantor:</span>
                  <span className="font-semibold text-white">{granter.name}</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    ID #{granter.user_id || granter.id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="px-3.5 py-2 rounded-2xl bg-[#070D1E]/90 border border-slate-800 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Cards
              </span>
              <span className="text-base font-black text-cyan-300 font-mono">
                {sortedCards.length}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#070D1E]/90 border border-slate-800 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Running
              </span>
              <span className="text-base font-black text-indigo-300 font-mono">
                {runningCards.length}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#070D1E]/90 border border-slate-800 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Value
              </span>
              <span className="text-base font-black text-emerald-300 font-mono">
                ৳ {totalSaleAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards List Section */}
      {sortedCards.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <FaCreditCard className="text-3xl text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            No Installment Cards Found
          </p>
          <p className="text-xs text-slate-500">
            This customer currently does not have any active or previous installment cards.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FaCreditCard className="text-cyan-400" />
              <span>Installment Cards ({sortedCards.length})</span>
            </h2>
          </div>

          {sortedCards.map((card) => (
            <CustomerCardView user={user} key={card.id || card.card_id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
