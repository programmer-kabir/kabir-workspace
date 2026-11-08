import React from 'react';
import { FiFileText } from 'react-icons/fi';

const EventExpensesBoard = ({ expenses, setPreviewImage, API_BASE }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Live Transparency & Expense Vouchers</span>
            <span className="text-sm font-normal text-slate-400">(খাতে খাতে খরচের হিসাব)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every food packet, bus fare, or grocery cost verified with photo receipts.
          </p>
        </div>
      </div>

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
            No expenses recorded yet. Once food or bus tickets are purchased, they will appear here with receipts.
          </div>
        ) : (
          expenses.map((ex) => (
            <div
              key={ex.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {ex.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {ex.item_name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Purchased by: <strong className="text-slate-700 dark:text-slate-300">{ex.paid_by_name}</strong>
                    </p>
                  </div>
                  <div className="text-base font-black text-rose-600 dark:text-rose-400">
                    ৳{parseFloat(ex.amount).toLocaleString()}
                  </div>
                </div>
                {ex.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                    {ex.notes}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {ex.receipt_url ? (
                  <button
                    onClick={() =>
                      setPreviewImage(
                        ex.receipt_url.startsWith('http')
                          ? ex.receipt_url
                          : `${API_BASE}${ex.receipt_url}`
                      )
                    }
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <FiFileText size={13} />
                    <span>View Receipt Photo 📸</span>
                  </button>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">No receipt attached</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventExpensesBoard;

