import React, { useMemo } from "react";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";
import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";

const ProfitReport = () => {
  const {
    salesItems,
    isSalesItemsError,
    isSalesItemsLoading,
  } = useSalesItems();

  const {
    salesCards,
    isSalesCardError,
    isSalesCardLoading,
  } = useSalesCard();

  const { salesPayments } = useSalesPayments();

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // ================= TOTAL PROFIT =================
  const totalProfit = useMemo(() => {
    return salesItems.reduce((sum, item) => {
      return (
        sum +
        (
          toNum(item.sale_price) -
          (
            toNum(item.purchase_price) +
            toNum(item.additional_cost)
          )
        )
      );
    }, 0);
  }, [salesItems]);

const today = new Date().toISOString().split("T")[0];

const contractProfit = useMemo(() => {
  return salesCards.reduce(
    (sum, card) => sum + toNum(card.profit),
    0
  );
}, [salesCards]);

const expectedProfit = useMemo(() => {
  return salesPayments
    .filter(
      (payment) =>
        payment.due_date &&
        payment.due_date <= today
    )
    .reduce(
      (sum, payment) =>
        sum + toNum(payment.profit_amount),
      0
    );
}, [salesPayments]);

const collectedProfit = useMemo(() => {
  return salesPayments
    .filter((payment) => payment.paid_date)
    .reduce(
      (sum, payment) =>
        sum + toNum(payment.profit_amount),
      0
    );
}, [salesPayments]);

const pendingProfit = Math.max(
  0,
  expectedProfit - collectedProfit
);

const collectionRate =
  expectedProfit > 0
    ? (
        (collectedProfit / expectedProfit) *
        100
      ).toFixed(2)
    : 0;
    const monthlyProfitReport = useMemo(() => {
  const report = {};

  salesPayments.forEach((payment) => {
    if (!payment.due_date) return;

    const dueDate = new Date(payment.due_date);

    const key = `${dueDate.getFullYear()}-${String(
      dueDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!report[key]) {
      report[key] = {
        expectedProfit: 0,
        collectedProfit: 0,
      };
    }

    report[key].expectedProfit += toNum(
      payment.profit_amount
    );

    if (payment.paid_date) {
      report[key].collectedProfit += toNum(
        payment.profit_amount
      );
    }
  });

  return Object.entries(report).sort((a, b) =>
    b[0].localeCompare(a[0])
  );
}, [salesPayments]);
  if (isSalesItemsError || isSalesCardError)
    return <NoDataFound />;

  if (isSalesItemsLoading || isSalesCardLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );

  return (
    <main className="p-6 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Profit Report
      </h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
<div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
  <p className="text-gray-400 text-sm">Contract Profit</p>
  <h3 className="text-2xl font-bold text-cyan-400 mt-2">
    ৳ {contractProfit.toFixed(2)}
  </h3>
</div>

<div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
  <p className="text-gray-400 text-sm">Expected Profit</p>
  <h3 className="text-2xl font-bold text-yellow-400 mt-2">
    ৳ {expectedProfit.toFixed(2)}
  </h3>
</div>

<div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
  <p className="text-gray-400 text-sm">Collected Profit</p>
  <h3 className="text-2xl font-bold text-green-400 mt-2">
    ৳ {collectedProfit.toFixed(2)}
  </h3>
</div>

<div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
  <p className="text-gray-400 text-sm">Pending Profit</p>
  <h3 className="text-2xl font-bold text-red-400 mt-2">
    ৳ {pendingProfit.toFixed(2)}
  </h3>
</div>

<div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
  <p className="text-gray-400 text-sm">Collection Rate</p>
  <h3 className="text-2xl font-bold text-blue-400 mt-2">
    {collectionRate}%
  </h3>
</div>
      </div>

      {/* MONTHLY REPORT */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">
          Monthly Profit Report
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-3 text-left">Month</th>
              <th className="p-3 text-left">
                Expected Profit
              </th>
              <th className="p-3 text-left">
                Collected Profit
              </th>
              <th className="p-3 text-left">
               Pending Profit
              </th>
              <th className="p-3 text-left">
               Collection %
              </th>
            </tr>
          </thead>

        <tbody>
  {monthlyProfitReport.map(([month, data]) => {
    const pending =
      data.expectedProfit -
      data.collectedProfit;

    const rate =
      data.expectedProfit > 0
        ? (
            (data.collectedProfit /
              data.expectedProfit) *
            100
          ).toFixed(2)
        : 0;

    return (
      <tr
        key={month}
        className="border-b border-gray-700"
      >
        <td className="p-3">{month}</td>

        <td className="p-3 text-yellow-400">
          ৳ {data.expectedProfit.toFixed(2)}
        </td>

        <td className="p-3 text-green-400">
          ৳ {data.collectedProfit.toFixed(2)}
        </td>

        <td className="p-3 text-red-400">
          ৳ {pending.toFixed(2)}
        </td>

        <td className="p-3 text-blue-400">
          {rate}%
        </td>
      </tr>
    );
  })}
</tbody>
        </table>
      </div>

      {/* TOP PRODUCTS */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
        <h2 className="text-xl font-semibold mb-4">
          Top 10 Profitable Products
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">
                Sale Price
              </th>
              <th className="p-3 text-left">
                Profit
              </th>
            </tr>
          </thead>

          {/* <tbody>
            {topProducts.map((item, index) => (
              <tr
                key={item.id}
                className="border-b border-gray-700"
              >
                <td className="p-3">{index + 1}</td>

                <td className="p-3">
                  {item.product_name}
                </td>

                <td className="p-3">
                  ৳ {item.sale_price}
                </td>

                <td className="p-3 text-green-400 font-semibold">
                  ৳ {item.profit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody> */}
        </table>
      </div>
    </main>
  );
};

export default ProfitReport;