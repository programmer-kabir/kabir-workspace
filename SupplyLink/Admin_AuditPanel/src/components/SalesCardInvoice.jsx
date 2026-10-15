import React, { useState } from "react";
import useUsers from "../utils/Hooks/useUsers";

const SalesCardInvoice = ({ card, items }) => {
  const [open, setOpen] = useState(false);
  const { users } = useUsers();

  const user = users.find(
    (u) => Number(u.id) === Number(card?.user_id)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* PRINT CSS */}
      <style>
        {`
          @media print {
            html, body {
              height: auto !important;
              overflow: visible !important;
              background: white;
            }

            body * {
              visibility: hidden;
            }
            
            #print-area, #print-area * {
              visibility: visible;
            }

            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              box-shadow: none !important;
              background: white;
              margin: 0 !important;
              padding: 0 !important;
            }

            .modal-backdrop {
              background: transparent !important;
              position: absolute !important;
              display: block !important;
            }

            @page {
              size: A4;
              margin: 15mm 10mm 15mm 10mm; /* top, right, bottom, left */
            }
          }
        `}
      </style>

      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="bg-black text-white px-5 py-2 rounded-lg"
      >
        Invoice
      </button>

      {/* MODAL */}
      {open && (
        <div className="modal-backdrop fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:bg-transparent">

          {/* MODAL BOX */}
          <div
            id="print-area"
            className="bg-white rounded-xl w-[70%] h-[70%] relative shadow-2xl overflow-auto"
          >

            {/* TOP BUTTONS */}
            <div className="absolute right-5 top-5 flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="bg-black text-white px-4 py-2 rounded-lg"
              >
                Print
              </button>
              <button
                onClick={() => setOpen(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* A4 PAPER */}
            {/* এখানে print:w-full এবং print:max-w-full যোগ করা হয়েছে ২য় ব্ল্যাঙ্ক পেজ আটকানোর জন্য */}
            <div className="w-[210mm] print:w-full max-w-full min-h-[297mm] print:min-h-0 bg-white mx-auto p-10 print:p-0 text-black relative flex flex-col justify-between">
              
              {/* MAIN CONTENT WRAPPER */}
              <div>
                {/* HEADER */}
                <div className="flex justify-between border-b pb-5">
                  <div>
                    <h1 className="text-3xl font-bold">
                      সাপ্লাইলিংক বাংলাদেশ লিমিটেড
                    </h1>
                    <p>
                      রফিক মঞ্জিল, মঙ্গলকাটা,
                      <br />সুনামগঞ্জ সদর, সুনামগঞ্জ
                    </p>
                    <p>01941145876</p>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                    <p>Invoice: {card?.id}</p>
                    <p>Date: {card?.delivery_date}</p>
                    <p>Status: {card?.status}</p>
                  </div>
                </div>

                {/* CUSTOMER */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-2">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                    <p>
                      <span className="font-semibold">Name:</span> {user?.name}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span> {user?.mobile}
                    </p>
                    <p>
                      <span className="font-semibold">Address:</span> {user?.address}
                    </p>
                    <p>
                      <span className="font-semibold">Customer ID:</span> {user?.id}
                    </p>
                  </div>
                </div>

                {/* PRODUCTS TABLE */}
                <div className="mt-8">
                  <table className="w-full border border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-3 text-left">#</th>
                        <th className="border p-3 text-left">Product</th>
                        <th className="border p-3 text-left">MRP</th>
                        <th className="border p-3 text-left">Sale Price</th>
                        <th className="border p-3 text-left">Qty</th>
                        <th className="border p-3 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items?.map((item, index) => (
                        <tr key={item.id}>
                          <td className="border p-3">{index + 1}</td>
                          <td className="border p-3">{item.product_name}</td>
                          <td className="border p-3">{item?.qty}</td>
                          <td className="border p-3">{item.sale_price}</td>
                          <td className="border p-3">1</td>
                          <td className="border p-3">{item.sale_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* SUMMARY */}
                <div className="flex justify-end mt-10">
                  <div className="w-[320px] border rounded-lg p-5 space-y-3">
                    <div className="flex justify-between">
                      <span>Product Total</span>
                      <span>
                        {card?.sale_price - card?.additional_cost} Tk
                      </span>
                    </div>

                    {Number(card?.additional_cost) > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Cost</span>
                        <span>{card?.additional_cost} Tk</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>{card?.sale_price} Tk</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Down Payment</span>
                      <span>{card?.down_payment} Tk</span>
                    </div>

                    <div className="flex justify-between text-xl font-bold border-t pt-3">
                      <span>Due</span>
                      <span>{card?.total_due_amount} Tk</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER (SIGNATURE) */}
              <div className="mt-20 print:mt-16 flex justify-between w-full">
                <div className="text-center">
                  <div className="border-t w-40 mx-auto mb-2"></div>
                  <p>Customer Signature</p>
                </div>
                <div className="text-center">
                  <div className="border-t w-40 mx-auto mb-2"></div>
                  <p>Authorized Signature</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesCardInvoice;