import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import { toast } from "react-toastify";

import useUsers from "../../../utils/Hooks/useUsers";

import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";
import SalesCardInvoice from "../../../components/SalesCardInvoice";

const Input = ({ label, name, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-400">{label}</label>

    <input
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const SalesCardDetails = () => {
  const [searchParams] = useSearchParams();

  const cardId = searchParams.get("cardId");

  const { users } = useUsers();

  const { isSalesCardLoading, salesCards } = useSalesCard();

  const { isSalesItemsLoading, salesItems } =
    useSalesItems();

  const {
    isSalesPaymentsLoading,
    salesPayments,
  } = useSalesPayments();

  const card = salesCards?.find(
    (c) => String(c.id) === String(cardId)
  );

  const items = salesItems?.filter(
    (i) => String(i.sale_card_id) === String(card?.id)
  );

  const payments = salesPayments?.filter(
    (p) => String(p.card_id) === String(card?.id)
  );
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editForm, setEditForm] = useState({});

  const officialStaff = useMemo(() => {
    const allowedRoles = [
      "admin",
      "manager",
      "staff",
      "developer",
    ];

    return (users || []).filter((u) => {
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) =>
          allowedRoles.includes(
            String(r).toLowerCase()
          )
        );
      }

      const role =
        u.role_name ??
        u.role ??
        "";

      return allowedRoles.includes(
        String(role).toLowerCase()
      );
    });
  }, [users]);

  const handleEditCard = (card) => {
    setEditForm({
      ...card,
      remarks: card.remarks || "",
    });

    setIsEditOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("id", editForm.id);
      formData.append("card_id", editForm.card_id);
      formData.append("user_id", editForm.user_id);
      formData.append(
        "reference_user_id",
        editForm.reference_user_id
      );

      formData.append(
        "sale_type",
        editForm.sale_type
      );

      formData.append(
        "additional_cost",
        editForm.additional_cost
      );

      formData.append(
        "purchase_price",
        editForm.purchase_price
      );

      formData.append(
        "cost_price",
        editForm.cost_price
      );

      formData.append(
        "sale_price",
        editForm.sale_price
      );

      formData.append(
        "down_payment",
        editForm.down_payment
      );

      formData.append(
        "total_due_amount",
        editForm.total_due_amount
      );

      formData.append(
        "installment_count",
        editForm.installment_count
      );

      formData.append(
        "profit",
        editForm.profit
      );

      formData.append(
        "delivery_date",
        editForm.delivery_date
      );

      formData.append(
        "first_installment_date",
        editForm.first_installment_date
      );

      formData.append(
        "status",
        editForm.status
      );

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/sales_cards/update_sales_card.php`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();

      if (!result.success) {
        toast.error(
          result.message || "Update Failed"
        );

        return;
      }

      toast.success("Card Updated");

      setIsEditOpen(false);
    } catch (err) {
      toast.error("Server Error");
    }
  };




  if (
    isSalesCardLoading ||
    isSalesItemsLoading ||
    isSalesPaymentsLoading
  ) {
    return <Loader />;
  }

  if (!card) {
    return (
      <p className="text-red-500">
        Card Not Found
      </p>
    );
  }

  const input =
    "w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

 const handlePrint = () => {
const today = new Date().toISOString().slice(0, 10);



  const bnDigits = (s) =>
    String(s ?? "")
      .replaceAll("0", "০")
      .replaceAll("1", "১")
      .replaceAll("2", "২")
      .replaceAll("3", "৩")
      .replaceAll("4", "৪")
      .replaceAll("5", "৫")
      .replaceAll("6", "৬")
      .replaceAll("7", "৭")
      .replaceAll("8", "৮")
      .replaceAll("9", "৯");

  const bnDate = (dateStr) => {
    // expects YYYY-MM-DD
    const d = (dateStr || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return bnDigits(d || "");
    const [y, m, day] = d.split("-");
    return `${bnDigits(day)}-${bnDigits(m)}-${bnDigits(y)}`;
  };

  const user = users.find(u=>Number(u.id)===Number(card?.user_id))

  const w = window.open("", "_blank", "width=900,height=650");
  if (!w) return;

const paidPayments = payments?.filter(payment=>payment.status==='Paid')
const totalPaidAmount = paidPayments?.reduce(
  (total, payment) =>
    total + Number(payment.due_amount || 0),
  0
);
const totalDueAmount = card?.sale_price-totalPaidAmount
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice</title>

  <style>
    @page{
      size:A4;
      margin:15mm;
    }

    body{
      font-family: Arial, sans-serif;
      background:#f3f4f6;
      margin:0;
      padding:20px;
    }

    .page{
      width:210mm;
      min-height:297mm;
      background:white;
      margin:auto;
      padding:20mm;
      box-sizing:border-box;
    }

    .top{
      display:flex;
      justify-content:space-between;
      border-bottom:1px solid #ccc;
      padding-bottom:15px;
    }

    table{
      width:100%;
      border-collapse:collapse;
      margin-top:20px;
    }

    th,td{
      border:1px solid #ccc;
      padding:10px;
      text-align:left;
    }

    .summary{
      width:300px;
      margin-left:auto;
      margin-top:30px;
    }

    .summary div{
      display:flex;
      justify-content:space-between;
      margin-bottom:10px;
    }

    .footer{
      margin-top:80px;
      display:flex;
      justify-content:space-between;
    }

    @media print{
      body{
        background:white;
        padding:0;
      }
 .toolbar{ display:none !important; }
      .page{
        margin:0;
        box-shadow:none;
      }
    }
  </style>
</head>

<body>
    <div class="toolbar">
      <button class="btn" onclick="window.print()">🖨️ Print</button>
      <button class="btn" onclick="window.print()">⬇️ Save as PDF</button>
      <button class="btn" onclick="window.close()">✖ Close</button>
    </div>

  <div class="page">

    <div class="top">

      <div>
        <h2>সাপ্লাইলিংক বাংলাদেশ লিমিটেড</h2>

        <p>
          রফিক মঞ্জিল, মঙ্গলকাটা,
          সুনামগঞ্জ সদর
        </p>

        <p>01941145876</p>
      </div>

      <div>
        <h1>INVOICE</h1>

        <p>Invoice: ${card?.card_id}</p>

        <p>Date: ${card?.delivery_date}</p>

        <p>Status: ${card?.status}</p>
      </div>

    </div>

    <h3 style="margin-top:30px">
      Customer Information
    </h3>

    <p>Name: ${user?.name || ""}</p>

    <p>Phone: ${user?.mobile || ""}</p>

    <p>Address: ${user?.address || ""}</p>

    <table>

      <thead>
        <tr>
          <th>#</th>
          <th>Product Name</th>
          <th>Product Prce</th>
          <th>Qty</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>

        ${items.map((item,index)=>`
          <tr>
            <td>${index+1}</td>
            <td>${item?.product_name}</td>
            <td>${item?.sale_price}</td>
            <td>${item?.qty}</td>
            <td>${item?.sale_price}</td>
          </tr>
        `).join("")}

      </tbody>

    </table>

<div class="summary">

  <div>
    <span>Product Total</span>

    <span>
      ${card?.sale_price} Tk
    </span>
  </div>

  <div>
    <span>Total</span>

    <span>
      ${card?.sale_price} Tk
    </span>
  </div>

  <div style="
    margin-top:20px;
    display:block;
  ">

    ${paidPayments.map((p)=>`
      <div style="
        display:flex;
        justify-content:space-between;
        gap:15px;
        margin-bottom:8px;
        font-size:14px;
      ">

        <span style="width:90px">
          ${p.paid_date}
        </span>

        <span style="
          flex:1;
          text-align:center;
        ">
          ${p.tag}
        </span>

        <span style="
          width:70px;
          text-align:right;
        ">
          ৳ ${Number(
            p.due_amount || 0
          ).toLocaleString()}
        </span>

      </div>
    `).join("")}

  </div>

  <div style="
    margin-top:20px;
    font-weight:bold;
  ">
    <strong>Due</strong>

    <strong>
      ${totalDueAmount || 0} Tk
    </strong>
  </div>

</div>
    <div class="footer">

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

</body>
</html>
`;

  w.document.open();
  w.document.write(html);
  w.document.close();
};
  return (
    <div>
      <BackButton />

      <div className="space-y-6 pt-5">

        {/* CARD INFO */}
        <div
          className="rounded-xl p-5 space-y-5"
          style={{
            backgroundColor: "#182337",
            border: "1px solid #0f1d3a",
            color: "#e5e7eb",
          }}
        >
          {/* HEADER */}
          <div className="flex justify-between items-start">

            <div>
              <p className="text-xs text-gray-400">
                Card Number
              </p>

              <p className="text-lg font-semibold">
                {card.card_id}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Created: {card.created_at}
              </p>
            </div>

            <div className="space-x-3">

              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    card.status === "Completed"
                      ? "rgba(16,185,129,0.15)"
                      : card.status ===
                          "Cancelled"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(59,130,246,0.15)",

                  color:
                    card.status === "Completed"
                      ? "#6ee7b7"
                      : card.status ===
                          "Cancelled"
                        ? "#fca5a5"
                        : "#93c5fd",
                }}
              >
                {card.status}
              </span>

              <button
                onClick={() =>
                  handleEditCard(card)
                }
                className="px-4 py-1 text-[#93c5fd] text-xs rounded-full"
                style={{
                  backgroundColor:
                    "rgba(59, 130, 246, 0.15)",
                }}
              >
                Edit
              </button>


<button
  onClick={handlePrint}
  className="px-4 py-1 text-xs rounded-full bg-green-600 text-white"
>
  Print
</button>
<SalesCardInvoice card={card} items={items}/>
        </div>
          </div>

          {/* PRODUCTS */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-sky-300">
              📦 Products
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {items?.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0b1833] border border-[#1e293b] rounded-xl p-4"
                >
                  <p className="font-semibold">
                       {item.product_name}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">

                    <div>
                      <p className="text-gray-400">
                        MRP
                      </p>

                      <p>
                        ৳ {item.mrp}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">
                        Purchase
                      </p>

                      <p>
                        ৳ {item.purchase_price}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">
                        Sale
                      </p>

                      <p>
                        ৳ {item.sale_price}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">
                        Status
                      </p>

                      <p>
                        {item.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICE */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-emerald-300">
              💰 Price Summary
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

              <div>
                <p className="text-gray-400">
                  Additional Cost
                </p>

                <p>
                  ৳ {card.additional_cost}
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Cost Price
                </p>

                <p>
                  ৳ {Number(card.purchase_price) + Number(card?.additional_cost)}
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Sale Price
                </p>

                <p className="font-semibold">
                  ৳ {card.sale_price}
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Profit
                </p>

                <p className="font-semibold text-green-400">
                  ৳ {card.profit}
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Down Payment
                </p>

                <p>
                  ৳ {card.downpayment}
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Total Due
                </p>

                <p>
                  ৳ {Number(card.sale_price) - Number(card.downpayment)} 
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Installment Count
                </p>

                <p>
                  {card.installment_count}
                </p>
              </div>

              <div>
                <p className="text-gray-400">
                  Sale Type
                </p>

                <p>
                  {card.sale_type}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENTS */}
        <div className="bg-[#182337] border border-[#0f1d3a] rounded-xl overflow-x-auto">

          <div className="p-4 border-b border-[#0f1d3a]">
            <h3 className="text-lg font-semibold text-white">
              Payment History
            </h3>
          </div>

          <table className="min-w-[700px] w-full text-gray-200">

            <thead>
              <tr className="bg-[#0b1833]">

                <th className="p-3 border border-[#0f1d3a]">
                 Installment
                </th>

                <th className="p-3 border border-[#0f1d3a]">
                    Due Date
                </th>

                <th className="p-3 border border-[#0f1d3a]">
                 Amount
                </th>

                <th className="p-3 border border-[#0f1d3a]">
                  Paid Date
                </th>

                <th className="p-3 border border-[#0f1d3a]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>

              {payments?.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[#0b1833]/60"
                >
                  <td className="p-3 border border-[#0f1d3a] text-center">
                    {p.tag}
                  </td>
  <td className="p-3 border border-[#0f1d3a] text-center">
                    {p.due_date}
                  </td>
                  <td className="p-3 border border-[#0f1d3a] text-center">
                    ৳ {p.due_amount}
                  </td>

                

                  <td className="p-3 border border-[#0f1d3a] text-center">
                    {p.paid_date || "-"}
                  </td>

                  <td className="p-3 border border-[#0f1d3a] text-center">
                    {p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-3">

          <div className="bg-[#0f172a] w-full max-w-4xl rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-xl font-semibold text-white">
                Edit Sales Card
              </h2>

              <button
                onClick={() =>
                  setIsEditOpen(false)
                }
                className="text-gray-400 hover:text-red-400 text-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleUpdateCard}
              className="space-y-6"
            >

              <div>
                <h3 className="text-sm text-yellow-400 mb-3">
                  Basic Info
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <Input
                    label="Card ID"
                    name="card_id"
                    value={editForm.card_id}
                    onChange={handleChange}
                  />

                  <Input
                    label="User ID"
                    name="user_id"
                    value={editForm.user_id}
                    onChange={handleChange}
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">
                      Reference User
                    </label>

                    <select
                      name="reference_user_id"
                      value={
                        editForm.reference_user_id ||
                        ""
                      }
                      onChange={handleChange}
                      className={input}
                    >
                      <option value="">
                        Select User
                      </option>

                      {officialStaff?.map(
                        (u) => (
                          <option
                            key={u.id}
                            value={u.id}
                          >
                            {u.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-blue-400 mb-3">
                  Sales Info
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Input
                    label="Additional Cost"
                    name="additional_cost"
                    value={
                      editForm.additional_cost
                    }
                    onChange={handleChange}
                  />

                  <Input
                    label="Cost Price"
                    name="cost_price"
                    value={editForm.cost_price}
                    onChange={handleChange}
                  />

                  <Input
                    label="Sale Price"
                    name="sale_price"
                    value={editForm.sale_price}
                    onChange={handleChange}
                  />

                  <Input
                    label="Profit"
                    name="profit"
                    value={editForm.profit}
                    onChange={handleChange}
                  />

                  <Input
                    label="Down Payment"
                    name="down_payment"
                    value={
                      editForm.down_payment
                    }
                    onChange={handleChange}
                  />

                  <Input
                    label="Total Due"
                    name="total_due_amount"
                    value={
                      editForm.total_due_amount
                    }
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">

                <button
                  type="button"
                  onClick={() =>
                    setIsEditOpen(false)
                  }
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition font-medium shadow"
                >
                  Update Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCardDetails;