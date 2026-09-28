import { CreditCard } from "lucide-react"
import { Link } from "react-router-dom"
import DayalLoader from "../../components/Common/DayalLoader"

const Billing = ({subLoading, subscription, limitData, limitLoading}) => {
    return (
         <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">Plan & Billing</h1>
              
              <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 p-8 transition-colors">
                {(subLoading || limitLoading) ? (
                  <div className="flex justify-center py-10">
                    <DayalLoader size="sm" text="Loading plan & billing details..." />
                  </div>
                ) : subscription ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Plan</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          You are currently on the <strong className="text-gray-900 dark:text-white">{subscription.plan_name}</strong> plan.
                        </p>
                      </div>
                      <span className="bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {subscription.status}
                      </span>
                    </div>
                    
                    <div className="flex items-end gap-2 mb-8">
                      <span className="text-4xl font-extrabold text-[#0088b3] dark:text-[#00D4FF]">${subscription.price}</span>
                      <span className="text-gray-500 mb-1 capitalize">/ {subscription.billing_cycle}</span>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-white/5 p-4 sm:p-6 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Next billing date</p>
                        <p className="text-sm text-[#00D4FF] font-medium mt-1">{new Date(subscription.end_date).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Download Limit</p>
                        <p className="text-sm text-[#0088b3] dark:text-[#00D4FF] font-medium mt-1">{subscription.image_limit} per {subscription.billing_cycle}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex flex-wrap gap-4">
                      <Link to="/join-pro" className="bg-[#00D4FF] text-[#050505] px-5 py-2.5 rounded-xl font-semibold hover:bg-[#33DEFF] transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                        Change Plan
                      </Link>
                      <button className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-colors">
                        Cancel Subscription
                      </button>
                    </div>

                    {/* Download Limits Section */}
                    {limitData && (
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col gap-6">
                        {/* Image Limit */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                              {limitData.period === 'monthly' ? 'Monthly' : 'Daily'} Image Limit
                            </h4>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {limitData.image_total || 0} / {limitData.image_limit || 0} used
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-2.5 mb-1 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full ${(limitData.image_total || 0) >= (limitData.image_limit || 0) ? 'bg-red-500' : 'bg-[#0088b3] dark:bg-[#00D4FF]'}`}
                              style={{ width: `${Math.min(100, ((limitData.image_total || 0) / (limitData.image_limit || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-500 text-right mt-2">
                            {Math.max(0, (limitData.image_limit || 0) - (limitData.image_total || 0))} image downloads remaining this {limitData.period === 'monthly' ? 'month' : 'day'}
                          </p>
                        </div>

                        {/* Video Limit */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                              {limitData.period === 'monthly' ? 'Monthly' : 'Daily'} Video Limit
                            </h4>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {limitData.video_total || 0} / {limitData.video_limit || 0} used
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-2.5 mb-1 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full ${(limitData.video_total || 0) >= (limitData.video_limit || 0) ? 'bg-red-500' : 'bg-[#0088b3] dark:bg-[#00D4FF]'}`}
                              style={{ width: `${Math.min(100, ((limitData.video_total || 0) / (limitData.video_limit || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-500 text-right mt-2">
                            {Math.max(0, (limitData.video_limit || 0) - (limitData.video_total || 0))} video downloads remaining this {limitData.period === 'monthly' ? 'month' : 'day'}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard size={28} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">Free Plan</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
                      You are currently using the free version. Upgrade to Pro for premium assets and commercial licenses.
                    </p>
                    <Link to="/join-pro" className="inline-block bg-[#8B5CF6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#9333EA] transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      View Plans & Upgrade
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 p-8 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 font-outfit">Payment Method</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-white/5 gap-4 bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center shrink-0 shadow-sm dark:shadow-none">
                      <CreditCard className="text-[#0088b3] dark:text-[#00D4FF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Visa ending in 4242</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/2026</p>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto text-center text-[#0088b3] dark:text-[#00D4FF] font-semibold text-sm hover:underline py-2 sm:py-0 border sm:border-none border-[#0088b3]/20 dark:border-[#00D4FF]/20 rounded-lg sm:rounded-none bg-[#0088b3]/10 dark:bg-[#00D4FF]/10 sm:bg-transparent dark:sm:bg-transparent">Update</button>
                </div>
              </div>
            </div>
    )
}
export default Billing