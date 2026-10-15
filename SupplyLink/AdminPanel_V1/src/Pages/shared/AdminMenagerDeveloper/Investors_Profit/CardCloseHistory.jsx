import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { MONTHS } from "../../../../../public/month";
import useUsers from "../../../../utils/Hooks/useUsers";
import useProfitAnalytics from "../../../../utils/Hooks/useProfitAnalytics";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import Loader from "../../../../components/Loader/Loader";
import { useAuth } from "../../../../Provider/AuthProvider";

const money = (n) => `৳ ${Number(n || 0).toLocaleString()}`;

const getMonthLabel = (m) => {
  const mm = MONTHS.find((x) => Number(x.value) === Number(m));
  return mm?.label || `Month ${m}`;
};

const CardCloseHistory = () => {
  const { users = [] } = useUsers();
  const {
    isProfitAnalyticsLoading,
    profitAnalytics,
    isUProfitAnalyticsError,
    refetch,
  } = useProfitAnalytics();
  const { user, logout } = useAuth();
  const { investmentCards = [] } = useInvestmentCards();

  const rows = Array.isArray(profitAnalytics) ? profitAnalytics : [];

  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [transferringCardIds, setTransferringCardIds] = useState(new Set());
const [cardIdSearch, setCardIdSearch] = useState("");
  /* ================= YEAR LIST ================= */
  const years = useMemo(() => {
    return [...new Set(rows.map((r) => r.profit_year))]
      .filter(Boolean)
      .sort((a, b) => b - a);
  }, [rows]);

  /* ================= MONTH LIST ================= */
  const availableMonths = useMemo(() => {
    if (yearFilter === "All") return [];

    return [
      ...new Set(
        rows
          .filter((r) => String(r.profit_year) === String(yearFilter))
          .map((r) => r.profit_month),
      ),
    ]
      .filter(Boolean)
      .sort((a, b) => a - b);
  }, [rows, yearFilter]);

  /* ================= MAP HELPERS ================= */
  const cardById = useMemo(() => {
    const m = new Map();
    investmentCards.forEach((c) => m.set(Number(c.id), c));
    return m;
  }, [investmentCards]);

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  const investorLabel = (investorId) => {
    const u = userById.get(Number(investorId));
    if (!u) return `ID: ${investorId}`;
    return u.name || u.full_name || u.username || `User ${u.id}`;
  };

  /* ================= FORFEIT CHECK ================= */
  const isForfeitEligible = (card) => {
    if (!card) return false;
    if (String(card.status) !== "closed") return false;
    if (!card.end_date || !card.maturity_date) return false;
    return String(card.end_date) < String(card.maturity_date);
  };
  const ALLOWED_TYPES = ["flexible"];

  /* ================= FILTER ================= */
  // const filteredRows = useMemo(() => {
  //   let data = rows;

  //   if (yearFilter !== "All") {
  //     data = data.filter((r) => String(r.profit_year) === String(yearFilter));
  //   }

  //   if (monthFilter !== "All") {
  //     data = data.filter((r) => String(r.profit_month) === String(monthFilter));
  //   }

  //   // data = data.filter((r) => {
  //   //   const card = cardById.get(Number(r.card_id));
  //   //   return card && String(card.status) === "closed";
  //   // });
  //   data = data.filter((r) => {
  //     const card = cardById.get(Number(r.card_id));

  //     return (
  //       card &&
  //       String(card.status) === "closed" &&
  //       String(card.payment_type) === "flexible"
  //     );
      
  //   }
  
  
  // );
  //   return data;
  // }, [rows, yearFilter, monthFilter, cardById]);
 const filteredRows = useMemo(() => {
  let data = rows;

  if (yearFilter !== "All") {
    data = data.filter((r) => String(r.profit_year) === String(yearFilter));
  }

  if (monthFilter !== "All") {
    data = data.filter((r) => String(r.profit_month) === String(monthFilter));
  }

  data = data.filter((r) => {
    const card = cardById.get(Number(r.card_id));

    return (
      card &&
      String(card.status) === "closed" &&
      String(card.payment_type) === "flexible"
    );
  });

  // ✅ NEW: Card ID search
  if (cardIdSearch.trim() !== "") {
    data = data.filter(
  (r) => String(r.card_id) === cardIdSearch.trim()
);
  }

  return data;
}, [rows, yearFilter, monthFilter, cardById, cardIdSearch]);
 const totalProfit = useMemo(() => {
  return filteredRows.reduce((sum, r) => {
    return sum + Number(r.profit_amount || 0);
  }, 0);
}, [filteredRows]);
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteMeta, setNoteMeta] = useState({
    cardId: null,
    month: null,
    year: null,
  });
  const openTransferNoteModal = (r) => {
    setNoteMeta({
       profitGeneratorId: Number(r.id),
      cardId: Number(r.card_id),
      month: Number(r.profit_month),
      year: Number(r.profit_year),
    });
    setNoteText("");
    setOpenNoteModal(true);
  };
  /* ================= TRANSFER ================= */

  // if (isProfitAnalyticsLoading)
  //   return <div className="flex items-center justify-center h-screen"><Loader /></div>;

  if (isUProfitAnalyticsError)
    return (
      <div className="p-6 text-red-400">Failed to load Profit Analytics</div>
    );

  
  const handleTransferToCompany = async (
    profitGeneratorId,
    cardId,
    profit_month,
    profit_year,
    note = "",
  ) => {
    const id = Number(cardId);
    const card = cardById.get(id);
    if (!card) return toast.info("Card not found");

    setTransferringCardIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/profit_generator/demo_closed_card_profit.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
              profit_generator_id: profitGeneratorId,
            card_id: id,
            investor_id: card.investor_id,
            end_date: card.end_date,
            profit_month,
            profit_year,
            note: String(note || "").trim(),
            signature_by: user?.role?.[0] || "client",
          }),
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Transfer failed");
      }

      toast.success("Your Credit and Profit Amount Transferred");
      refetch();
    } finally {
      setTransferringCardIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };
  
  
  const handleConfirmTransfer = async () => {
const { cardId, month, year, profitGeneratorId } = noteMeta;
    if (!cardId || !month || !year)
      return toast.error("Invalid Month/Year/Card");
    await handleTransferToCompany(  profitGeneratorId,cardId, month, year, noteText);
    setOpenNoteModal(false);
    setNoteMeta({ cardId: null, month: null, year: null });
    setNoteText("");
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-semibold mb-5">Closed Card Profit History</h2>

      {/* FILTERS */}
      <div className="flex gap-3 mb-5">
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setMonthFilter("All");
          }}
          className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        >
          <option value="All">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        >
          <option value="All">All Months</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {getMonthLabel(m)}
            </option>
          ))}
        </select>
        <input
  type="text"
  placeholder="Search by Card ID..."
  value={cardIdSearch}
  onChange={(e) => setCardIdSearch(e.target.value)}
  className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white"
/>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900">
        <table className="min-w-full text-white">
          <thead className="bg-slate-800 text-sm text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Investor</th>
              <th className="px-4 py-3 text-left">Card</th>
              <th className="px-4 py-3 text-right">Main Amount</th>
              <th className="px-4 py-3 text-right">Profit Amount</th>
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No data found
                </td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => {
                const card = cardById.get(Number(r.card_id));
                const eligible = isForfeitEligible(card);

                return (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      {investorLabel(r.investor_id)}
                    </td>
                    <td className="px-4 py-3">{r.card_id}</td>

                    {/* MAIN AMOUNT */}
                    <td className="px-4 py-3 text-blue-400 font-semibold text-right">
                      {money(card?.amount || card?.main_amount)}
                    </td>

                    {/* PROFIT */}
                    <td className="px-4 py-3 text-emerald-400 font-semibold text-right">
                      {money(r.profit_amount)}
                    </td>

                    <td className="px-4 py-3">
                      {getMonthLabel(r.profit_month)} / {r.profit_year}
                    </td>

                    <td className="px-4 py-3">
                      {eligible && (
                        <button
                          onClick={() => openTransferNoteModal(r)}
                          className="rounded px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-500"
                        >
                          Transfer to Company
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
  <tr>
    <td colSpan="4" className="text-right px-4 py-3 font-bold">
      Total:
    </td>
    <td className="px-4 py-3 text-right text-emerald-400 font-bold">
      {money(totalProfit)}
    </td>
    <td colSpan="2"></td>
  </tr>
</tfoot>
        </table>
      </div>
      {openNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white">
                Transfer Note
              </h3>

              <button
                onClick={() => {
                  setOpenNoteModal(false);
                  setNoteMeta({ cardId: null, month: null, year: null });
                  setNoteText("");
                }}
                className="rounded-lg px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="mb-2 text-sm text-slate-300">
                Card ID: <span className="text-white">{noteMeta.cardId}</span>
                <span className="ml-3 text-slate-400">
                  Month/Year: {noteMeta.month}/{noteMeta.year}
                </span>
              </div>

              <label className="mb-1 block text-sm text-slate-300">Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-indigo-500"
                placeholder="Write a note (optional)..."
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setOpenNoteModal(false);
                    setNoteMeta({ cardId: null, month: null, year: null });
                    setNoteText("");
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                >
                  Cancel
                </button>

                {(() => {
                  const id = Number(noteMeta.cardId);
                  const isTransferring = transferringCardIds.has(id);

                  return (
                    <button
                      disabled={isTransferring}
                      onClick={handleConfirmTransfer}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                        isTransferring
                          ? "cursor-not-allowed bg-slate-600 opacity-60"
                          : "bg-red-600 hover:bg-red-500"
                      }`}
                    >
                      {isTransferring ? "Transferring..." : "Save & Transfer"}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardCloseHistory;
