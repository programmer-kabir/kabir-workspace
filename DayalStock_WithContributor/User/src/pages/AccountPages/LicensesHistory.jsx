import { Download } from "lucide-react"
import { Link } from "react-router-dom"

const LicensesHistory = ({downloadsHistory, downloadsLoading}) => {
    return (
         <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">License History</h1>
              <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 overflow-hidden transition-colors">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Asset Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">License Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {downloadsLoading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-[#0088b3] dark:border-[#00D4FF] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </td>
                      </tr>
                    ) : downloadsHistory.length > 0 ? (
                      downloadsHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-200 dark:border-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                            {new Date(item.downloaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">{item.content_title || item.content_slug || 'Premium Asset'}</td>
                          <td className="px-6 py-4">
                            {item.plan_name ? (
                              <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2.5 py-1 rounded-md text-xs font-bold">{item.plan_name} License</span>
                            ) : (
                              <span className="bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 px-2.5 py-1 rounded-md text-xs font-bold">Free License</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/${item.content_type || 'images'}/${item.content_slug}`} className="text-[#0088b3] dark:text-[#00D4FF] text-sm font-semibold hover:underline">
                              View Asset
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                          <Download size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">No Licenses Yet</h3>
                          <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">When you download premium assets, your licenses will appear here for easy access.</p>
                          <Link to="/" className="mt-6 inline-block bg-[#00D4FF] text-[#050505] px-6 py-3 rounded-xl font-bold hover:bg-[#33DEFF] transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                            Browse Assets
                          </Link>
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
export default LicensesHistory