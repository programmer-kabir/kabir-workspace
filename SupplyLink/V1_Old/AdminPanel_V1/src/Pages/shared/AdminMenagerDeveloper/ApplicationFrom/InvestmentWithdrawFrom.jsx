import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../../../Provider/AuthProvider";
import { InvestmentWithdrawApplicationModal } from "../../../../components/InvestmentWithdraw/InvestmentWithdrawApplicationModal";
import useUsers from "../../../../utils/Hooks/useUsers";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import useProfitAnalytics from "../../../../utils/Hooks/useProfitAnalytics";

/* ================= helpers ================= */
const bdTodayYMD = () => {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );
  return d.toISOString().slice(0, 10);
};

const cn = (...s) => s.filter(Boolean).join(" ");

const money = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const InvestmentWithdrawFrom = () => {
  const { user } = useAuth();

  const { users = [] } = useUsers();
  const { investmentCards = [] } = useInvestmentCards();
  const {
    isProfitAnalyticsLoading,
    profitAnalytics,
    isUProfitAnalyticsError,
    refetch,
  } = useProfitAnalytics();
  const [investorId, setInvestorId] = useState("");
  const [cardId, setCardId] = useState("");
  const [withdrawDate, setWithdrawDate] = useState(bdTodayYMD());
  const [reason, setReason] = useState("");

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);

  // ===== find investor by id =====
  const investor = useMemo(() => {
    const id = Number(investorId);
    if (!id) return null;
    return users.find((u) => Number(u.id) === id) || null;
  }, [users, investorId]);

  // ===== investor's cards (filter) =====
  const investorCards = useMemo(() => {
    const id = Number(investorId);
    if (!id) return [];
    return investmentCards
      .filter((c) => Number(c.investor_id) === id) // ✅ important
      .slice()
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [investmentCards, investorId]);

  // ===== selected card =====
  const selectedCard = useMemo(() => {
    const cid = Number(cardId);
    if (!cid) return null;
    return investorCards.find((c) => Number(c.id) === cid) || null;
  }, [investorCards, cardId]);
  const selectedCardProfitRows = useMemo(() => {
    const cid = Number(cardId);
    if (!cid) return [];
    return (profitAnalytics || []).filter((r) => Number(r.card_id) === cid);
  }, [profitAnalytics, cardId]);
  const sumOfCardProfit = useMemo(() => {
    return selectedCardProfitRows.reduce(
      (sum, r) => sum + Number(r.profit_amount || 0),
      0,
    );
  }, [selectedCardProfitRows]);

  // ✅ fetchPreview: demo modal open
  const canFetchPreview = Boolean(investorId.trim() && cardId.trim());

  const fetchPreview = async () => {
    if (!investorId.trim()) return toast.error("Investor ID required");
    if (!cardId.trim()) return toast.error("Card ID required");
    if (!investor) return toast.error("Investor not found");
    if (!selectedCard)
      return toast.error("This card is not found for this investor");
if ((selectedCard?.status || "").toLowerCase() === "closed") {
  return toast.error("This card is closed.");
}
    try {
      setLoadingPreview(true);
      setPreview(null);

      // ✅ demo open modal
      setOpenPreviewModal(true);
      setPreview({ demo: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingPreview(false);
    }
  };
  const totalProfit = useMemo(() => {
    return Number(sumOfCardProfit || 0);
  }, [sumOfCardProfit]);
  const payableAmount = useMemo(() => {
    if (!selectedCard) return 0;

    const today = bdTodayYMD(); // "2026-02-01"
    const maturity = selectedCard.maturity_date;

    // 🟢 short time card → always profit
    if (selectedCard.payment_type === "shorttime") {
      return Number(sumOfCardProfit || 0);
    }

    // 🟡 flexible card
    if (selectedCard.payment_type === "flexible") {
      // maturity date today or passed
      if (maturity && maturity <= today) {
        return Number(sumOfCardProfit || 0);
      }
      // maturity not reached
      return 0;
    }

    // fallback
    return 0;
  }, [selectedCard, sumOfCardProfit]);
  const submitRequest = async () => {
    if (!preview) return toast.error("Please load preview first");
    if (!withdrawDate) return toast.error("Withdraw date required");
    if (!reason.trim()) return toast.error("Reason required");

    const confirm = await Swal.fire({
      title: "Submit withdraw request?",
      text: "Are you sure you want to submit this withdraw request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/withdraw_applications/create_withdraw_request.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            investor_id: investorId,
            card_id: cardId,
            withdraw_date: withdrawDate,
            reason: reason.trim(),
            requested_by: user?.id,
            total_profit: Number(totalProfit || 0),
            payable_amount: Number(payableAmount || 0),
            amount: selectedCard?.investment_amount,
            mobile: investor?.mobile,
             maturity_date: selectedCard?.maturity_date || null,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Submit failed");

      toast.success("Withdraw request submitted ✅");
      setReason("");
      setPreview(null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // UI classes
  const textareaCls =
    "min-h-[140px] rounded-2xl border border-white/10 bg-[#071025] px-4 py-3 text-sm text-white " +
    "outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/15";

  const labelCls = "text-xs text-slate-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">
          Investment Withdraw Request
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter Investor ID and select Card, then review preview and submit.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">
                Withdraw Form
              </div>
              <div className="text-sm text-slate-400">
                Fill the form and submit.
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
              Ready
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* IDs + date */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Identification
                  </div>
                  <div className="text-xs text-slate-400">
                    Investor + Card নির্বাচন করো
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-sky-400/70" />
                  Required
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Investor ID */}
                <div className="rounded-2xl border border-white/10 bg-[#071025]/60 p-4 hover:bg-[#071025]/80 transition">
                  <label className={labelCls}>Investor/User ID</label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:ring-2 focus-within:ring-white/15">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-200">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="opacity-80"
                      >
                        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z" />
                      </svg>
                    </div>

                    <input
                      value={investorId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setInvestorId(v);
                        setCardId(""); // ✅ investor change হলে card reset
                        setPreview(null);
                      }}
                      className={cn(
                        "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35",
                      )}
                      placeholder="e.g. 222"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500">
                    {investorId && !investor ? (
                      <span className="text-rose-300">Investor not found</span>
                    ) : investor ? (
                      <span className="text-emerald-300">
                        Found: {investor?.name || "Investor"} (#{investor?.id})
                      </span>
                    ) : (
                      "Example: investor id from Users table"
                    )}
                  </div>
                </div>

                {/* Card dropdown */}
                <div className="rounded-2xl border border-white/10 bg-[#071025]/60 p-4 hover:bg-[#071025]/80 transition">
                  <label className={labelCls}>Card</label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:ring-2 focus-within:ring-white/15">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-200">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="opacity-80"
                      >
                        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4H4V6h16ZM4 18v-8h16v8Z" />
                      </svg>
                    </div>

                    <select
                      value={cardId}
                      onChange={(e) => {
                        setCardId(e.target.value);
                        setPreview(null);
                      }}
                      disabled={
                        !investorId || !investor || investorCards.length === 0
                      }
                      className={cn(
                        "w-full bg-[#071025] text-sm text-white outline-none",
                        "dark:[color-scheme:dark]",
                        (!investorId ||
                          !investor ||
                          investorCards.length === 0) &&
                          "text-slate-500 cursor-not-allowed",
                      )}
                    >
                      <option value="">
                        {!investorId
                          ? "Enter Investor ID first"
                          : !investor
                            ? "Investor not found"
                            : investorCards.length === 0
                              ? "No cards for this investor"
                              : "Select a card"}
                      </option>

                      {/* {investorCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.id} — {c.card_name || "Card"} — ৳
                          {money(c.investment_amount)} —{" "}
                          {(c.status || "").toUpperCase()}
                        </option>
                      ))} */}
                      {investorCards.map((c) => (
  <option
    key={c.id}
    value={c.id}
    disabled={(c.status || "").toLowerCase() === "closed"}
  >
    #{c.id} — {c.card_name || "Card"} — ৳
    {money(c.investment_amount)} —{" "}
    {(c.status || "").toUpperCase()}
    {(c.status || "").toLowerCase() === "closed" ? " (Closed)" : ""}
  </option>
))}
                    </select>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500">
                    {investorCards.length > 0
                      ? `Total cards: ${investorCards.length}`
                      : "Example: investment card list will appear here"}
                  </div>
                </div>
              </div>

              {/* selected card mini preview */}
              {selectedCard && (
                <div className="mt-4 rounded-2xl bg-[#071025] p-4">
                  <div className="text-xs text-slate-400 mb-2">
                    Selected Card
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="text-sm text-white font-semibold">
                      #{selectedCard.id}
                    </div>
                    <div className="text-sm text-slate-200">
                      {selectedCard.card_name || "Card"}
                    </div>
                    <div className="text-sm text-slate-200">
                      ৳ {money(selectedCard?.investment_amount)}
                    </div>
                    <div className="text-sm text-slate-300">
                      {(selectedCard.status || "—").toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Withdraw Date */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5">
              <div className="mb-4">
                <div className="text-sm font-semibold text-white">
                  Withdraw Schedule
                </div>
                <div className="text-xs text-slate-400">
                  Select a date for eligibility
                </div>
              </div>

              <label className={labelCls}>Withdraw Date</label>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:ring-2 focus-within:ring-white/15">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-200">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="opacity-80"
                  >
                    <path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3Zm15 8H2v12h20Zm0-4H2v2h20Z" />
                  </svg>
                </div>

                <input
                  type="date"
                  value={withdrawDate}
                  onChange={(e) => setWithdrawDate(e.target.value)}
                  className={cn(
                    "w-full bg-transparent text-sm text-white outline-none dark:[color-scheme:dark]",
                  )}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-[#071025]/60 p-3 text-xs text-slate-400">
                *Profit eligibility will be calculated based on this date.
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={fetchPreview}
              disabled={!canFetchPreview || loadingPreview}
              className={cn(
                "h-11 w-full md:w-auto rounded-2xl px-6 text-sm font-semibold transition border",
                !canFetchPreview || loadingPreview
                  ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
                  : "bg-white text-slate-900 border-white/10 hover:bg-white/90",
              )}
            >
              {loadingPreview ? "Loading..." : "Load Preview"}
            </button>

            <button
              type="button"
              onClick={() => {
                setInvestorId("");
                setCardId("");
                setWithdrawDate(bdTodayYMD());
                setReason("");
                setPreview(null);
              }}
              className="h-11 w-full md:w-auto rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 px-6 text-sm font-semibold transition border border-white/10"
            >
              Reset
            </button>
          </div>

          {/* Reason */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5">
            {/* header */}
            <div className="mb-3">
              <label className="text-sm font-semibold text-white">
                Withdraw Reason
              </label>
              <p className="mt-0.5 text-xs text-slate-400">
                Explain why this withdraw is being requested
              </p>
            </div>

            {/* textarea */}
            <div className="relative">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className={cn(
                  "w-full resize-none rounded-2xl border border-white/10 bg-[#071025]",
                  "px-4 py-3 text-sm text-white outline-none",
                  "placeholder:text-white/30",
                  "focus:ring-2 focus:ring-white/15 focus:border-white/20",
                  "transition",
                )}
                placeholder="Write withdraw reason in short (e.g. urgent cash need, early exit, etc.)"
              />

              {/* subtle icon */}
              <div className="pointer-events-none absolute right-3 bottom-3 text-white/20">
                ✍️
              </div>
            </div>

            {/* info note */}
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <span className="mt-0.5 text-amber-300">ℹ️</span>
              <p className="text-xs leading-relaxed text-amber-200">
                If the withdraw date is earlier than the eligible date,
                <span className="font-semibold"> profit may be 0</span>{" "}
                according to policy.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={submitRequest}
            disabled={!preview}
            className={cn(
              "h-12 w-full rounded-2xl text-sm font-semibold transition border",
              !preview
                ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
                : "bg-white text-slate-900 border-white/10 hover:bg-white/90",
            )}
          >
            Submit Withdraw Request
          </button>
        </div>
      </div>

      {/* Modal */}
      <InvestmentWithdrawApplicationModal
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        investorId={investorId}
        investor={investor}
        cardId={cardId}
        card={selectedCard}
        withdrawDate={withdrawDate}
        sumOfCardProfit={sumOfCardProfit}
        payableAmount={payableAmount}
      />
    </div>
  );
};

export default InvestmentWithdrawFrom;
