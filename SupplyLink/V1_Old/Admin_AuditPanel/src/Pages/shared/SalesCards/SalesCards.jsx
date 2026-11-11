import React, { useMemo } from "react";

import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";
import {
  CalendarDays,
  CreditCard,
  Phone,
  User,
  ChartNoAxesCombined,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaPhoneAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSearch,
  FaChartLine,
  FaArrowRight,
} from "react-icons/fa";
import useUsers from "../../../utils/Hooks/useUsers";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";
const SalesCards = () => {
  const { isSalesCardLoading, salesCards, isSalesCardError } = useSalesCard();
  const { users } = useUsers();
  const { isSalesItemsLoading, isSalesItemsError, salesItems } =
    useSalesItems();
  const { salesPayments } = useSalesPayments();

  const paymentCardMap = useMemo(() => {
    if (!salesPayments?.length) return {};

    return salesPayments.reduce((acc, payment) => {
      const cardId = String(payment?.card_id);
      acc[cardId] = true;
      return acc;
    }, {});
  }, [salesPayments]);

  if (isSalesCardLoading || isSalesItemsLoading) {
    return <div className="text-white text-center py-10">Loading...</div>;
  }

  if (isSalesCardError || isSalesItemsError) {
    return (
      <div className="text-red-500 text-center py-10">Failed to load data</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {salesCards?.map((card) => {
        const cardItems = salesItems?.filter(
          (item) => item?.sale_card_id === card?.id,
        );
        const matchedUser = users?.find((user) => user?.id === card?.user_id);
        return (
          <Link
            to={`/customers/installment_cards/card_Details?cardId=${card.id}`}
            key={card.id}
            className="rounded-2xl border border-gray-800
                         bg-gradient-to-b from-gray-900 to-gray-950
                         p-5 hover:border-blue-500
                         hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">Card No</p>

                <h2 className="font-semibold text-white">{card?.card_id}</h2>
              </div>

              <div
                className={`px-2.5 py-1  rounded-full text-xs font-medium
                  ${
                    card.status === "Running"
                      ? " bg-blue-900/30 text-blue-300"
                      : card.status === "Fully Paid"
                        ? "bg-emerald-900/30 text-emerald-300"
                        : "bg-red-900 text-red-300"
                  }
                `}
              >
                {card.status}
              </div>
            </div>

            <div className="mb-4 space-y-1">
              <div className="">
                {cardItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-gray-300 text-sm"
                  >
                    <FaBoxOpen size={16} className="mt-1 text-gray-400" />

                    <p className="text-gray-100">{item?.product_name}</p>
                  </div>
                ))}
              </div>

              <div className="text-sm">
                <span className="text-gray-400">Sale Type:</span>{" "}
                <span className="text-xs text-white-400 font-medium">
                  {card?.sale_type}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <User size={18} className="text-gray-400" />

                <p className="font-semibold">
                  ({card?.user_id}) {matchedUser?.name}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Phone size={18} className="text-gray-200" />

                <p className="text-gray-200">
                  {matchedUser?.mobile || "No phone"}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-gray-500" />

                <p className="text-gray-400">Delivery: {card.delivery_date}</p>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-gray-400" />

                <p className="text-gray-400">
                  First Installment: {card.first_installment_date}
                </p>
              </div>
            </div>

{card.status === "Fully Paid" ? (
  <div className="mt-3 text-center">
    <span className="px-3 py-2 rounded-lg bg-green-900/30 text-green-400 text-sm font-semibold">
      ✓ Payment Completed
    </span>
  </div>
) : (
   <div className="mt-auto h-[64px] flex items-end">
    <Link
      to={`/customer/create_installment_chart?cardId=${card.id}`}
      className="w-full"
    >
      <button
        className="group w-full flex items-center justify-center gap-2
        rounded-xl px-4 py-2.5
        bg-gradient-to-r from-blue-600/90 to-indigo-600/90
        text-sm font-semibold text-white
        hover:from-blue-500 hover:to-indigo-500
        transition-all"
      >
        <FaChartLine />

        <span>
          {paymentCardMap[String(card.id)]
            ? "Update Installment Chart"
            : "Create Installment Chart"}
        </span>

        <FaArrowRight className="group-hover:translate-x-1 transition" />
      </button>
    </Link>
  </div>
)}



          </Link>
        );
      })}
    </div>
  );
};

export default SalesCards;
