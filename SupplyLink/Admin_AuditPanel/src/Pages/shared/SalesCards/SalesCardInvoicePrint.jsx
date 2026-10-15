import React, { useState } from "react";
import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";

const SalesCardInvoicePrint = () => {
  const { salesCards, isSalesCardLoading } = useSalesCard();
  const { users, isUsersLoading } = useUsers();
  const { isSalesItemsLoading, salesItems } = useSalesItems();
  const { isSalesPaymentsLoading, salesPayments } = useSalesPayments();

  const [selectedCards, setSelectedCards] = useState([]);

  if (
    isSalesCardLoading ||
    isSalesPaymentsLoading ||
    isSalesItemsLoading ||
    isUsersLoading
  ) {
    return <Loader />;
  }

  const handleSelect = (cardId) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );
  };

  const handleSelectAll = () => {
    if (selectedCards.length === salesCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(salesCards.map((card) => card.id));
    }
  };

  const handlePrint = () => {
    const selectedInvoices = salesCards.filter((card) =>
      selectedCards.includes(card.id),
    );

    if (!selectedInvoices.length) {
      alert("Please select at least one card.");
      return;
    }

    const html = `
<html>
<body>
  <style>
      .top{
      display:flex;
      justify-content:space-between;
      border-bottom:1px solid #ccc;
      padding-bottom:15px;
    }

     table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    font-size: 14px;
    background: #fff;
  }

  thead tr {
    background: #1e293b;
    color: #fff;
  }

  th {
    padding: 12px 16px;
    font-weight: 500;
    text-align: left;
  }

  td {
    padding: 14px 16px;
    border-top: 1px solid #f3f4f6;
  }

  tbody tr {
    border-bottom: 1px solid #f3f4f6;
  }

  .text-right {
    text-align: right;
  }

  .text-center {
    text-align: center;
  }

  .font-medium {
    font-weight: 500;
    color: #111827;
  }

  .font-semibold {
    font-weight: 600;
    color: #111827;
  }

  .text-gray {
    color: #000;
  }

.statusButton {
  display: inline-flex;
  align-items: center;

  padding: 2px 7px;

  border-radius: 9999px;

  font-size: 12px;
  font-weight: 600;

  background-color: #dcfce7;
  color: #166534;
}
  .payment-summary-wrapper{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:24px;
  margin-top:30px;
}

/* Left Side */

.payment-history{
  flex:1;
  border:1px solid #f1f5f9;
  border-radius:8px;
  padding:16px;
  background:#ffffff;
}

.payment-history h4{
  margin:0 0 12px 0;
  padding-bottom:8px;

  font-size:12px;
  font-weight:700;
  text-transform:uppercase;

  color:#000;

  border-bottom:1px solid #f1f5f9;
}

.payment-row{
  display:flex;
  justify-content:space-between;
  align-items:center;

  padding:5px 0;

  font-size:12px;
}

.payment-date{
  color:#000;
  width:90px;
}

.payment-name{
  flex:1;
  text-align:center;

  color:#1f2937;
  font-weight:500;
}

.payment-amount{
  width:90px;
  text-align:right;

  color:#334155;
  font-weight:600;
}

/* Right Side */

.summary{
  width:320px;

  border:1px solid #f1f5f9;
  border-radius:8px;

  padding:16px;

  background:#f8fafc;
}

.summary > div{
  display:flex;
  justify-content:space-between;

  margin-bottom:12px;

  font-size:14px;
}

.summary-total{
  padding-bottom:10px;

  border-bottom:1px solid #e5e7eb;

  color:#111827;
  font-weight:600;
}

.summary-due{
  padding-top:8px;

  font-size:17px !important;
  font-weight:800 !important;

  color:#000;
}
.page{
  min-height:95vh;
  display:flex;
  flex-direction:column;
}

.footer{
  margin-top:auto;
  display:flex;
  justify-content:space-between;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  thead tr {
    background: #1e293b !important;
    color: #fff !important;
  }

  .statusButton {
    background-color: #dcfce7 !important;
    color: #166534 !important;
  }
      .payment-summary-wrapper{
    page-break-inside:avoid;
  }

  .payment-history,
  .summary{
    border:1px solid #ddd;
  }

}
  </style>
${selectedInvoices
  .map((card) => {
    const user = users.find((u) => Number(u.id) === Number(card.user_id));

    const items = salesItems.filter(
      (item) => Number(item.sale_card_id) === Number(card.id),
    );

    const paidPayments = salesPayments.filter(
      (payment) =>
        Number(payment.card_id) === Number(card.id) &&
        payment.status === "Paid",
    );

    const totalPaidAmount = paidPayments.reduce(
      (total, payment) => total + Number(payment.due_amount || 0),
      0,
    );

    const totalDueAmount =
      Number(card.sale_price || 0) - Number(totalPaidAmount || 0);
    const footerMarginTop = paidPayments.length > 8 ? 40 : 200;
    return `
    <div class="page">
  <div class="top">

      <div>
        <h2>সাপ্লাইলিংক বাংলাদেশ লিমিটেড</h2>

        <p>
          রফিক মঞ্জিল, মঙ্গলকাটা,
          সুনামগঞ্জ সদর
        </p>

        <p>মোবাইল: 01941145876</p>
      </div>

      <div>
        <h1>INVOICE</h1>

<p
  style="
    font-size: 17px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    line-height: 1.2;
  "
>
  Invoice: <span style="
   
    font-weight: 400;
   
  "> ${card?.card_id}</span>
</p>
<p
  style="
    font-size: 17px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    line-height: 1.2;
  "
>
  Date: <span   style="
   
    font-weight: 400;
   
  "> ${card?.delivery_date}</span>
</p>

        <p class="statusButton"> ${card?.status}</p>
      </div>

    </div>

    <h3 style="margin-top:20px">
      Customer Information
    </h3>

    <p style="
    font-size: 15px;
    margin: 0;
    line-height: 1.4;
  ">নাম: ${user?.name || ""}</p>
    <p style="
    font-size: 15px;
    margin: 0;
    line-height: 1.4;
  ">ফোন: ${user?.mobile || ""}</p>

    <p style="
    font-size: 15px;
    margin: 0;
    line-height: 1.4;
  ">ঠিকানা : ${user?.address || ""}</p>

 <table>
  <thead>
    <tr>
      <th>#</th>
      <th>Product Name</th>
      <th class="text-right">Product Price</th>
      <th class="text-center">Qty</th>
      <th class="text-right">Total</th>
    </tr>
  </thead>

  <tbody>
    ${items
      .map(
        (item, index) => `
      <tr>
        <td class="text-gray">${index + 1}</td>
        <td class="font-medium">${item?.product_name}</td>
        <td class="text-right text-gray">${Number(item?.sale_price).toFixed(2)} Tk</td>
        <td class="text-center text-gray">${item?.qty}</td>
        <td class="text-right font-semibold">
          ${(Number(item?.sale_price) * Number(item?.qty)).toFixed(2)} Tk
        </td>
      </tr>
    `
      )
      .join("")}
  </tbody>
</table>


<div class="payment-summary-wrapper">

  <!-- Payment History -->
  <div class="payment-history">

    <h4>
      Payment History / কিস্তি বিবরণী
    </h4>

    ${paidPayments
      .map(
        (p) => `
      <div class="payment-row">

        <span class="payment-date">
          ${p.paid_date}
        </span>

        <span class="payment-name">
          ${p.tag}
        </span>

        <span class="payment-amount">
          ৳ ${Number(p.due_amount || 0).toLocaleString()}
        </span>

      </div>
    `,
      )
      .join("")}

  </div>

  <!-- Summary -->
  <div class="summary">

    <div>
      <span>Product Total</span>

      <span>
        ${card?.sale_price} Tk
      </span>
    </div>

    <div class="summary-total">
      <span>Total</span>

      <span>
        ${card?.sale_price} Tk
      </span>
    </div>

    <div class="summary-due">
      <span>Due</span>

      <span>
        ${totalDueAmount || 0} Tk
      </span>
    </div>

  </div>

</div>







 <div class="footer"  >

      <div>
        ___________________
        <br/>
        Customer Signature
      </div>

      <div>
        ___________________
        <br/>
        Authorized Signature
      </div>

    </div>

  </div>

    </div>

    <div style="page-break-after:always"></div>
  `;
  })
  .join("")}

</body>
</html>
`;
    const printWindow = window.open("", "_blank");

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Sales Card Invoice Print</h2>

        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Print Selected
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={
                    salesCards.length > 0 &&
                    selectedCards.length === salesCards.length
                  }
                  onChange={handleSelectAll}
                />
              </th>

              <th className="p-3 text-left">Card No</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-left">Sale Price</th>
              <th className="p-3 text-left">Down Payment</th>
              <th className="p-3 text-left">Installments</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {salesCards?.map((card) => {
              const user = users.find(
                (u) => Number(u.id) === Number(card.user_id),
              );

              return (
                <tr key={card.id} className="border-t border-gray-700">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes(card.id)}
                      onChange={() => handleSelect(card.id)}
                    />
                  </td>

                  <td className="p-3">{card.card_id}</td>

                  <td className="p-3">{user?.name || "-"}</td>

                  <td className="p-3">{user?.mobile || "-"}</td>

                  <td className="p-3">৳ {card.sale_price}</td>

                  <td className="p-3">৳ {card.downpayment || 0}</td>

                  <td className="p-3">{card.installment_count}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        card.status === "Fully Paid"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {card.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesCardInvoicePrint;
