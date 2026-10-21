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

const CustomerDetails = () => {
  const [showPrint, setShowPrint] = useState(false);

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const { users = [], isUsersError, isUsersLoading } = useUsers();
  const user = users.find((u) => Number(u.id) === Number(userId));
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
    (granter) => Number(granter.customer_user_id) === Number(userId),
  );
  const granterId = runningUserGranter?.guarantor_user_id;
  const granter = users.find((u) => Number(u.id) === Number(granterId));

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
      <div className="px-5 md:px-20 py-10 text-center text-red-600">
        Something went wrong. Please try again later.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-5 md:px-20 py-10 text-center text-red-600">
        User not found.
      </div>
    );
  }

  const myCards =
    customerInstallmentCards.filter(
      (card) => Number(card.user_id) === Number(user.id),
    ) || [];

  const myCardsWithPayments = myCards.map((card) => {
    const payments =
      customerInstallmentPayments.filter(
        (payment) => Number(payment.card_id) === Number(card.id),
      ) || [];

    // ✅ down payment সহ progress (consistent)
    const downPayment = payments.find((p) => Number(p.installment_no) === 0);
    const hasDown = !!downPayment;
    const regular = payments.filter((p) => Number(p.installment_no) > 0);
    const all = hasDown ? [downPayment, ...regular] : regular;

    const paidCount = all.filter((p) => p.status === "Paid").length;
    const total = Number(card.installment_count) + (hasDown ? 1 : 0);
    const progress = total ? Math.round((paidCount / total) * 100) : 0;

    return { ...card, payments, progress };
  });

  if (myCardsWithPayments.length === 0) {
    return (
      <div className="px-5 md:px-20 py-10 text-center text-gray-500">
        No installment cards found.
      </div>
    );
  }

  // ✅ Running first, then completed
  const runningCards = myCardsWithPayments.filter(
    (card) => card.status !== "Fully Paid",
  );
  const completedCards = myCardsWithPayments.filter(
    (card) => card.status === "Fully Paid",
  );
  const sortedCards = [...runningCards, ...completedCards];

  // ✅ PRINT VIEW
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

  return (
    <div className="mx-auto text-gray-200 max-w-[1600px] p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <BackButton />

        <button
          onClick={() => setShowPrint(true)}
          className="btn-primary text-xs md:text-sm px-4 py-2 font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
        >
          <span>🖨️ কাস্টমার ডিটেইলস প্রিন্ট</span>
        </button>
      </div>

      {/* Customer Header Banner */}
      <div className="card-surface p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.photo
                ? `https://api.supplylinkbd.com/${user.photo.replace(/^uploads\//, "uploads/")}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "Customer"
                  )}&background=10b981&color=fff`
            }
            alt={user?.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-md shrink-0"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || "Customer"
              )}&background=10b981&color=fff`;
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">
                {user?.name}
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ID #{user?.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-1 font-mono">
              <span>📞 {user?.mobile}</span>
              {user?.id_number && <span>• NID: {user?.id_number}</span>}
            </p>
            {user?.address && (
              <p className="text-xs text-slate-400 mt-0.5">
                📍 {user?.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl">
          <span className="text-slate-400">মোট কিস্তি কার্ড:</span>
          <span className="text-white font-bold text-sm">{sortedCards.length} টি</span>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="space-y-6">
        {sortedCards.map((card) => (
          <CustomerCardView user={user} key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};

export default CustomerDetails;
