import { useMemo, useState } from "react";

import NoDataFound from "../../../components/NoData/NoDataFound";
import Loader from "../../../components/Loader/Loader";
import { MONTHS } from "../../../../public/month";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";
import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useSuppliers from "../../../utils/Hooks/Suppliers/useSuppliers";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";

const getYMD = (d) => (d ? String(d).slice(0, 10) : "");
const getYear = (d) => Number(getYMD(d).split("-")[0] || 0);
const getMonth = (d) => Number(getYMD(d).split("-")[1] || 0);

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const ProductsSummery = () => {


  const {salesItems,isSalesItemsError,isSalesItemsLoading} = useSalesItems()
const {salesCards,isSalesCardError,isSalesCardLoading} = useSalesCard()
const {isSuppliersError,isSuppliersLoading,refetch,suppliers} = useSuppliers()
  const today = new Date().toISOString().split("T")[0];
  const { salesPayments } = useSalesPayments();
  const [openModal, setOpenModal] = useState(false);
  const [openMemoTable, setOpenMemoTable] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState("monthly"); // all | daily | monthly | yearly
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const years = useMemo(() => {
    const set = new Set();
    salesItems.forEach((c) => {
      const y = getYear(c.delivery_date || c.created_at);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [salesItems]);

  const filterSalesItems = useMemo(() => {
    return salesItems.filter((c) => {
      const date = c.delivery_date || c.created_at;
      const ymd = getYMD(date);
      if (!ymd) return false;

      const y = getYear(date);
      const m = getMonth(date);

      if (selectedYear && Number(selectedYear) !== y) return false;

      if (filterType === "daily") {
        if (!selectedDate) return true;
        return ymd === selectedDate;
      }

      if (filterType === "monthly") {
        if (!selectedMonth) return true;
        return Number(selectedMonth) === m;
      }

      if (filterType === "yearly") {
        return true;
      }

      return true;
    }) 
  }, [
    salesItems,
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
  ]);
 const filterSalesCards = useMemo(() => {
    return salesCards.filter((c) => {
      const date = c.delivery_date || c.created_at;
      const ymd = getYMD(date);
      if (!ymd) return false;

      const y = getYear(date);
      const m = getMonth(date);

      if (selectedYear && Number(selectedYear) !== y) return false;

      if (filterType === "daily") {
        if (!selectedDate) return true;
        return ymd === selectedDate;
      }

      if (filterType === "monthly") {
        if (!selectedMonth) return true;
        return Number(selectedMonth) === m;
      }

      if (filterType === "yearly") {
        return true;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.delivery_date);
      const dateB = new Date(b.delivery_date);
      return dateA - dateB;
    });
  }, [
    salesCards,
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
  ]);

  const monthlyCollectedProfit = salesPayments.reduce((acc, payment) => {
  const date = payment.paid_date;

  if (!date) return acc;

  const year = getYear(date);
  const month = getMonth(date);

  const key = `${year}-${month}`;

  acc[key] = (acc[key] || 0) + toNum(payment.profit_amount);

  return acc;
}, {});
const collectedProfit = salesPayments
  .filter((payment) => {
    const date = payment.paid_date;

    if (!date) return false;

    const y = getYear(date);
    const m = getMonth(date);

    if (selectedYear && Number(selectedYear) !== y) return false;

    if (filterType === "monthly" && selectedMonth) {
      return Number(selectedMonth) === m;
    }

    if (filterType === "daily" && selectedDate) {
      return getYMD(date) === selectedDate;
    }

    return true;
  })
  .reduce(
    (sum, payment) => sum + toNum(payment.profit_amount),
    0
  );

  if (isSalesItemsError || isSuppliersError || isSalesCardError) return <NoDataFound />;
  // if (isSalesItemsLoading || isSuppliersLoading || isSalesCardLoading )
  //   return (
  //     <span className="w-full flex items-center justify-center h-screen">
  //       <Loader />
  //     </span>
  //   );


const totalPurchase = filterSalesItems.reduce(
  (sum, item) =>
    sum +
    toNum(item.purchase_price) +
    toNum(item.additional_cost),
  0,
);

  const totalSale = filterSalesItems.reduce(
    (sum, item) => sum + toNum(item.sale_price),
    0,
  );

const totalProfit = filterSalesItems.reduce(
  (sum, item) =>
    sum +
    (
      toNum(item.sale_price) -
      (
        toNum(item.purchase_price) +
        toNum(item.additional_cost)
      )
    ),
  0
);

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
  return (
    <main>
      <div className="p-6 min-h-screen text-white">
        {/* ================= FILTER BAR ================= */}
        <div className="flex flex-wrap items-end gap-3 rounded bg-gray-800 border border-gray-700 p-4 mb-6">
          {/* View */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">View</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setSelectedDate("");
                setSelectedMonth("");
              }}
              className="h-10 rounded bg-gray-900 px-3 text-sm text-white border border-gray-700"
            >
              <option value="all">All</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Daily */}
          {filterType === "daily" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 rounded bg-gray-900 px-3 text-sm text-white border border-gray-700"
              />
            </div>
          )}

          {/* Monthly */}
          {filterType === "monthly" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 rounded bg-gray-900 px-3 text-sm text-white border border-gray-700"
              >
                <option value="">All</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 rounded bg-gray-900 px-3 text-sm text-white border border-gray-700"
            >
              <option value="">All</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setFilterType("monthly");
              setSelectedDate("");
              setSelectedMonth("");
              setSelectedYear("");
            }}
            className="h-10 rounded bg-gray-900 px-4 text-sm text-white hover:bg-gray-700"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* মোট ক্রয় মূল্য */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <p className="text-gray-400 text-sm">মোট ক্রয় মূল্য</p>
            <h3 className="text-xl font-bold text-white mt-2">
              ৳ {totalPurchase}
            </h3>
          </div>

          {/* মোট বিক্রয় মূল্য */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <p className="text-gray-400 text-sm">মোট বিক্রয় মূল্য</p>
            <h3 className="text-xl font-bold text-blue-400 mt-2">
              ৳ {totalSale}
            </h3>
          </div>

          {/* মোট লাভ */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <p className="text-gray-400 text-sm">মোট লাভ</p>
            <h3 className="text-xl font-bold text-green-400 mt-2">
              ৳ {totalProfit}
            </h3>
          </div>

         <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
  <p className="text-gray-400 text-sm">আদায়কৃত লাভ</p>
  <h3 className="text-xl font-bold text-green-400 mt-2">
    ৳ {collectedProfit.toFixed(2)}
  </h3>
</div>
        </div>

        <table className="w-full shadow  text-start">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3 text-start">#</th>
              <th className="p-3 text-start">পণ্যের নাম</th>
              <th className="p-3 text-start">তারিখ</th>
              <th className="p-3 text-start">ক্রয়মূল্য</th>
              <th className="p-3 text-start">বিক্রয়মূল্য</th>
              <th className="p-3 text-start">লাভ</th>
              <th className="p-3 text-start">মেমো</th>
              <th className="p-3 text-start">রিমার্কস</th>
              <th className="p-3 text-start">একশন</th>
            </tr>
          </thead>

          <tbody>
            {filterSalesItems.map((item, index) => {

                const itemSuppliers = suppliers.filter(
    (supplier) => Number(supplier.sales_items_id) === Number(item.id)
  );
const cost_price=Number(item.purchase_price) + Number(item.additional_cost)
              
              return (
                <>
                
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-3">{item.id}</td>
                  <td className="p-3 max-w-[200px] break-words whitespace-normal">
                    {item.product_name || "-"}
                  </td>
                  <td className="p-3">
  {formatDate(item.created_at)}
</td>

                  <td className="p-3">
                    {item.purchase_price ? `৳ ${Number(item.purchase_price) + Number(item.additional_cost)}` : "-"}
                  </td>

                  <td className="p-3">
                    {item.sale_price ? `৳ ${item.sale_price}` : "-"}
                  </td>

                  <td className="p-3 font-semibold text-green-400">
                    {item.profit ? `৳ ${item.profit}` : "-"}
                  </td>

                  {/* Memo Image */}
                 <td className="p-3">
  {itemSuppliers.length > 0 ? (
    <button
      onClick={() =>
        setOpenMemoTable(
          openMemoTable === item.id ? null : item.id
        )
      }
      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-xs"
    >
      View All Memo ({itemSuppliers.length})
    </button>
  ) : item.memo ? (
    <img
      onClick={() => {
        setSelectedItem(item);
        setOpenModal(true);
      }}
      src={`https://auditing.supplylinkbd.com/${item.memo}`}
      alt="memo"
      className="w-12 h-12 object-cover rounded cursor-pointer"
    />
  ) : (
    "-"
  )}
</td>

                  {/* Remarks */}
                  <td className="p-3 text-red-400">{item.remarks || "-"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setOpenModal(true);
                      }}
                      className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 transition"
                    >
                      Details
                    </button>
                  </td>
                </tr>
                {
  openMemoTable === item.id && (
    <tr className="bg-gray-900 border-b border-gray-700">
      <td colSpan={9} className="p-4">

        <table className="w-full text-sm border border-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-2 text-start">#</th>
              <th className="p-2 text-start">Supplier</th>
              <th className="p-2 text-start">Address</th>
              <th className="p-2 text-start">Phone</th>
              <th className="p-2 text-start">Memo</th>
            </tr>
          </thead>

          <tbody>
            {itemSuppliers.map((supplier, idx) => {
              console.log(itemSuppliers)
              return(
              <tr
                key={idx}
                className="border-b border-gray-700"
              >
                <td className="p-2">{idx + 1}</td>

                <td className="p-2">
                  {supplier.name || "-"}
                </td>
                <td className="p-2">
                  {supplier.address || "-"}
                </td>

                <td className="p-2">
                  {supplier.phone || "-"}
                </td>

                <td className="p-2">
  {supplier.memo_no ? (
    <div className="flex items-center">
      <img
        src={`https://auditing.supplylinkbd.com/${supplier.memo_no}`}
        alt="memo"
        onClick={() => {
          setSelectedItem({
            ...item,
            memo: supplier.memo_no,
            supplier_name: supplier.name,
            supplier_phone: supplier.phone,
            purchase_price:supplier?.price,
            sale_price:"-"
          });

          setOpenModal(true);
        }}
        className="w-20 h-20 min-w-[80px] rounded-lg object-cover cursor-pointer border border-gray-600 hover:scale-105 transition"
      />
    </div>
  ) : (
    "-"
  )}
</td>
              </tr>
            )})}
          </tbody>
        </table>

      </td>
    </tr>
  )
}
                </>
                
              );
            })}
          </tbody>
          <tfoot>
            
          </tfoot>
        </table>
      </div>
      {openModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
<div className="bg-[#1f2428] w-full max-w-5xl h-[95vh] rounded-lg shadow-lg overflow-hidden flex flex-col">            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {selectedItem.product_name || "-"} Details
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 text-white">
              {/* Image Preview */}
              <div className="flex justify-center">
                {selectedItem.memo ? (
                  <img
                    src={`https://auditing.supplylinkbd.com/${selectedItem.memo}`}
                    alt="preview"
                    className="rounded border border-gray-700 w-full max-h-[600px]"
                  />
                ) : (
                  <div className="w-full h-[300px] flex items-center justify-center border border-gray-700 text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400">পণ্যের নাম</p>
                  <p>{selectedItem.product_name || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-400">বর্ণনা</p>
                  <p className="whitespace-pre-wrap">
                    {selectedItem.description || "-"}
                  </p>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-gray-400">ক্রয়মূল্য</p>
                    <p>
                      {selectedItem.purchase_price
                        ? `৳ ${selectedItem.purchase_price}`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">বিক্রয়মূল্য</p>
                    <p>
                      {selectedItem.sale_price
                        ? `৳ ${selectedItem.sale_price}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">লাভ</p>
                    <p className="text-green-400 font-semibold">
                      {selectedItem.profit ? `৳ ${selectedItem.profit}` : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400">বিক্রয়ের ধরণ</p>
                  <p className="font-semibold">
                    {selectedItem.sale_type ? `${selectedItem.sale_type}` : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">Remarks</p>
                  <p className="text-red-400">{selectedItem.remarks || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductsSummery;
