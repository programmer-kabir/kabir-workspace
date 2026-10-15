"use client";
import React, { useState } from "react";

export default function InstallmentCalculator() {
  const [mrp, setMrp] = useState("");
  const [additionsCost, setAdditionsCost] = useState("");
  const [months, setMonths] = useState("");
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    if (!mrp || !months) return;

    const price = Number(mrp);
    const extraCost = Number(additionsCost) || 0;
    const monthCount = Number(months);

    // Step 1: price + additions cost
    let total = price + extraCost;

    // Step 2: Interest add
    let interestRate = 0;
    if (monthCount === 6) interestRate = 0.1;
    if (monthCount === 12) interestRate = 0.15;

    const interestAmount = total * interestRate;
    total += interestAmount;

    // Step 3: 30% Down Payment
    const downAmount = total * 0.3;

    // Step 4: Remaining 70%
    const remaining = total - downAmount;

    // Step 5: Monthly EMI
    const monthly = Math.ceil(remaining / monthCount);

    setResult({
      total,
      interestAmount,
      downAmount,
      remaining,
      monthly,
    });
  };

  return (
    <div className="max-width mx-auto p-8 bg-white shadow-xl rounded-2xl mt-20">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
        SupplyLink EMI ক্যালকুলেটর
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          placeholder="পণ্যের MRP (৳)"
          value={mrp}
          onChange={(e) => setMrp(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <input
          type="number"
          placeholder="Additions Cost (৳)"
          value={additionsCost}
          onChange={(e) => setAdditionsCost(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="border p-3 rounded-lg"
        >
          <option value="">মাস নির্বাচন করুন</option>
          <option value="6">৬ মাস (10%)</option>
          <option value="12">১২ মাস (15%)</option>
        </select>
      </div>

      <button
        onClick={handleCalculate}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        হিসাব করুন
      </button>
      {result && (
        <div className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-md p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-3">
            ইএমআই পরিশোধ সংক্ষিপ্তসার
          </h3>

          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between">
              <span>মোট মূল্য </span>
              <span className="font-medium">
                ৳ {result.total.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>ডাউন পেমেন্ট (৩০%)</span>
              <span className="font-medium text-red-500">
                ৳ {result.downAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-t pt-4">
              <span>অবশিষ্ট পরিশোধযোগ্য</span>
              <span className="font-semibold">
                ৳ {result.remaining.toLocaleString()}
              </span>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600 mb-1">মাসিক কিস্তি</p>
              <p className="text-3xl font-bold text-green-600 tracking-wide">
                ৳ {result.monthly.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
