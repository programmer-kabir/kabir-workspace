import React, { useEffect, useState } from "react";
import useInvestInstallmentCards from "../Utils/Hooks/useInvestInstallmentCards";
import useInvestInstallment from "../Utils/Hooks/useInvestInstallments";
import currentUser from "../Utils/currentUser";
import { formatCurrency } from "./formatCurrency";
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Award,
  Layers,
  Calendar
} from "lucide-react";

const fmt = (v) => (v !== null && v !== undefined && v !== "" ? v : "-");

const getMaturityProgress = (startDate, maturityDate) => {
  if (!startDate || !maturityDate) return { percent: 0, daysLeft: 0, isMatured: false };
  const start = new Date(startDate).getTime();
  const end = new Date(maturityDate).getTime();
  const now = Date.now();
  if (isNaN(start) || isNaN(end)) return { percent: 0, daysLeft: 0, isMatured: false };
  
  const total = Math.max(1, end - start);
  const passed = Math.max(0, now - start);
  const percent = Math.min(100, Math.round((passed / total) * 100));
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  return { percent, daysLeft, isMatured: now >= end };
};

const InvestmentCardLayout = ({ children, onSelectedCardChange }) => {
  const { investInstallmentCards } = useInvestInstallmentCards();
  const runningUser = currentUser();

  const [selectedCardId, setSelectedCardId] = useState(null);
  const { investInstallments, inInvestInstallmentsLoading } =
    useInvestInstallment(selectedCardId);

  const currentCard = (investInstallmentCards || []).filter(
    (card) => String(card.investor_id) === String(runningUser?.id)
  );

  const sortedCards = [...currentCard].sort((a, b) => {
    if (a.status === "running" && b.status === "closed") return -1;
    if (a.status === "closed" && b.status === "running") return 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  useEffect(() => {
    if (!selectedCardId && sortedCards.length > 0) {
      setSelectedCardId(sortedCards[0].id);
    }
  }, [selectedCardId, sortedCards]);

  const selectedCard = currentCard.find(
    (c) => String(c.id) === String(selectedCardId)
  );

  useEffect(() => {
    if (onSelectedCardChange) {
      onSelectedCardChange(selectedCard || null);
    }
  }, [selectedCard, onSelectedCardChange]);

  const statusBadgeClass =
    selectedCard?.status === "running"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="space-y-6">
      {/* 📜 Investment Cards Selector (Digital Certificate Grid) */}
      <div>
        {sortedCards.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">
                  আপনার বিনিয়োগ পোর্টফোলিও কার্ডসমূহ
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                মোট {sortedCards.length} টি কার্ড রক্ষিত
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedCards.map((card) => {
                const isSelected = selectedCardId === card.id;
                const { percent, daysLeft, isMatured } = getMaturityProgress(card.start_date, card.maturity_date);

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={`relative w-full text-left rounded-2xl p-5 transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-[1.01]"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Active Selected Marker */}
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
                      </span>
                    )}

                    {/* Card Header: ID & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        কার্ড #{card.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          card.status === "running"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${card.status === "running" ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {card.status === "running" ? "চলমান" : "মেয়াদ পূর্ণ"}
                      </span>
                    </div>

                    {/* Card Title & Amount */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight mb-1">
                        {fmt(card.card_name)}
                      </h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-slate-400">৳</span>
                        <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                          {formatCurrency(card.investment_amount)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        টাইপ: {fmt(card.payment_type)}
                      </p>
                    </div>

                    {/* 1-Year Maturity Progress Bar */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          ১ বছরের মেয়াদ
                        </span>
                        <span className={isMatured ? "text-emerald-600 font-bold" : "text-indigo-600 font-bold"}>
                          {isMatured ? "পূর্ণ হয়েছে" : `${daysLeft} দিন বাকি`}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMatured ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-blue-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                        <span>শুরু: {fmt(card.start_date)}</span>
                        <span>শেষ: {fmt(card.maturity_date)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Child Content (Details, Chart, Filter, Table) */}
      {children &&
        (typeof children === "function"
          ? children({
              selectedCard,
              sortedCards,
              investInstallments,
              inInvestInstallmentsLoading,
              statusBadgeClass,
            })
          : children)}
    </div>
  );
};

export default InvestmentCardLayout;
