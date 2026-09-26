const PaymentHistory = ({billingHistory, generateInvoicePDF}) => {
    return (
        <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">Payment History</h1>
              <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 overflow-hidden transition-colors">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {billingHistory.length > 0 ? (
                      billingHistory.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-200 dark:border-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                            {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${inv.amount}</td>
                          <td className="px-6 py-4">
                            <span className="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20 px-2.5 py-1 rounded-md text-xs font-bold capitalize">{inv.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => generateInvoicePDF(inv)}
                              className="text-[#0088b3] dark:text-[#00D4FF] text-sm font-semibold hover:underline"
                            >
                              Download PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No payment history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
    )
}
export default PaymentHistory