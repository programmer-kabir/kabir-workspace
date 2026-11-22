import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Zap,
  Crown,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchPublicPlans,
  fetchActivePaymentMethods,
  fetchMySubscription,
  fetchMyTransactions,
  submitCheckout
} from '../../services/api';
import {
  SubscriptionPlan,
  PaymentMethod,
  PaymentTransaction,
  UserSubscriptionDetails
} from '../../types';

export const SubscriptionView: React.FC = () => {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subDetails, setSubDetails] = useState<UserSubscriptionDetails | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, methodsData, subData, txData] = await Promise.all([
        fetchPublicPlans(),
        fetchActivePaymentMethods(),
        fetchMySubscription(),
        fetchMyTransactions()
      ]);

      setPlans(plansData.plans);
      setPaymentMethods(methodsData);
      setSubDetails(subData);
      setTransactions(txData);

      if (methodsData.length > 0 && !selectedMethod) {
        setSelectedMethod(methodsData[0]);
      }
    } catch (err: any) {
      console.error('Subscription data load error:', err);
      setError(err.message || 'Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleOpenCheckout = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSubmitError(null);
    setSubmitSuccess(null);
    setSenderNumber('');
    setTransactionId('');
    setScreenshotUrl('');
    if (paymentMethods.length > 0) {
      setSelectedMethod(paymentMethods[0]);
    }
  };

  const handleCloseCheckout = () => {
    setSelectedPlan(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !selectedMethod) return;

    const amount = billingPeriod === 'yearly' ? selectedPlan.priceYearlyBdt : selectedPlan.priceMonthlyBdt;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitCheckout({
        planSlug: selectedPlan.slug,
        billingPeriod,
        paymentMethodId: selectedMethod.id,
        senderNumber,
        transactionId,
        amount,
        screenshotUrl: screenshotUrl.trim() || undefined
      });

      setSubmitSuccess('Your payment details have been submitted successfully! Our team will manually verify the transaction and activate your plan.');
      // Reload updated subscription & transaction data
      setTimeout(() => {
        loadData();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit payment details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading plans and billing information...</p>
      </div>
    );
  }

  const currentPlanSlug = subDetails?.currentPlan || 'free';
  const activeSub = subDetails?.subscription;
  const pendingPayment = subDetails?.pendingPayment;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            <span>Subscription & Billing</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upgrade your download speed, remove limits, and unlock high-concurrency API access.
          </p>
        </div>

        {/* Currency badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Currency: <strong>BDT (৳)</strong> via Mobile Wallets</span>
        </div>
      </div>

      {/* Pending Payment Notification Banner */}
      {pendingPayment && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-300">
              Payment Verification Under Review
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We received your manual payment of <strong>৳{pendingPayment.amount} BDT</strong> via {pendingPayment.methodName} with Transaction ID <code className="px-1.5 py-0.5 bg-slate-900 rounded text-amber-300 font-mono text-[11px]">{pendingPayment.transactionId}</code>.
              Our administrators are verifying the transaction with the mobile wallet statement. Your plan will activate immediately upon verification.
            </p>
          </div>
        </div>
      )}

      {/* Active Subscription Status Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                currentPlanSlug === 'enterprise'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : currentPlanSlug === 'pro'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {currentPlanSlug.toUpperCase()}
              </span>
            </div>

            <div className="text-xl font-bold text-white flex items-center gap-2">
              {currentPlanSlug === 'enterprise' ? (
                <>
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Enterprise Master</span>
                </>
              ) : currentPlanSlug === 'pro' ? (
                <>
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <span>Pro Downloader</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-slate-400" />
                  <span>Free Tier</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-xl">
              {activeSub ? (
                <span>
                  Active {activeSub.billingPeriod} plan. Renews / expires on{' '}
                  <strong className="text-slate-200">{new Date(activeSub.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
                </span>
              ) : (
                <span>You are currently using the Free plan with standard queue priority and limited daily downloads.</span>
              )}
            </p>
          </div>

          {/* Days Remaining or Quota Meters */}
          <div className="flex flex-wrap items-center gap-4">
            {activeSub?.daysRemaining !== null && activeSub?.daysRemaining !== undefined && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[110px]">
                <div className="text-2xl font-black text-indigo-400">{activeSub.daysRemaining}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Days Left</div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 min-w-[130px]">
              <div className="text-xs text-slate-400">Daily Quota</div>
              <div className="text-base font-bold text-white mt-0.5">
                {subDetails?.planDetails.dailyQuota} downloads/day
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 min-w-[130px]">
              <div className="text-xs text-slate-400">API Speed</div>
              <div className="text-base font-bold text-white mt-0.5">
                {subDetails?.planDetails.apiRpm} RPM
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly / Yearly Billing Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Yearly Billing</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug;
          const isPopular = plan.slug === 'pro';
          const isEnterprise = plan.slug === 'enterprise';
          const price = billingPeriod === 'yearly' ? plan.priceYearlyBdt : plan.priceMonthlyBdt;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {isEnterprise && <Crown className="w-5 h-5 text-amber-400" />}
                  {isPopular && <Zap className="w-5 h-5 text-indigo-400" />}
                </div>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">৳{price}</span>
                  <span className="text-xs text-slate-400">BDT / {billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  {plan.slug === 'free'
                    ? 'Perfect for casual single video downloads with basic queue priority.'
                    : plan.slug === 'pro'
                    ? 'Engineered for power users needing high speed and bulk downloading.'
                    : 'Uncapped power for developers, organizations, and high-frequency APIs.'}
                </p>

                {/* Feature List */}
                <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Key Capabilities</div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-slate-800/80">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-default"
                  >
                    Your Current Plan
                  </button>
                ) : plan.slug === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-800/60 text-slate-500 text-xs font-bold cursor-not-allowed"
                  >
                    Free Access Included
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(plan)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 shadow-indigo-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Upgrade to {plan.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Manual Payment Verification Instructions Strip */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span>Manual Payment Verification Process</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">1</span>
            <div className="font-bold text-white">Send Money</div>
            <p className="text-slate-400">Send exact BDT amount via your bKash, Nagad, or Rocket mobile app to our verified personal wallet number.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">2</span>
            <div className="font-bold text-white">Submit TrxID</div>
            <p className="text-slate-400">Copy the Transaction ID (TrxID) from your SMS receipt and submit it along with your sender mobile number.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">3</span>
            <div className="font-bold text-white">Admin Verification</div>
            <p className="text-slate-400">Our team manually cross-checks your TrxID with our wallet statement and activates your subscription.</p>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Payment History</span>
          </h3>
          <span className="text-xs text-slate-400">{transactions.length} record(s)</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-400">No Payment Records Yet</div>
            <p className="text-xs text-slate-500">Your submitted manual payments and their verification statuses will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Sender Number</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {transactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{tx.transaction_id}</td>
                      <td className="py-3.5 px-4 font-sans uppercase font-bold text-slate-300">
                        {tx.plan_name || tx.plan_slug} ({tx.billing_period})
                      </td>
                      <td className="py-3.5 px-4 font-sans">{tx.payment_method_name}</td>
                      <td className="py-3.5 px-4">{tx.sender_number}</td>
                      <td className="py-3.5 px-4 font-sans font-bold text-emerald-400">৳{tx.amount} BDT</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase ${
                          tx.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                    {tx.status === 'rejected' && tx.admin_note && (
                      <tr className="bg-rose-950/20">
                        <td colSpan={7} className="py-2.5 px-4 text-xs font-sans text-rose-300">
                          <strong>Admin Rejection Note:</strong> {tx.admin_note}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Payment Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span>Manual Payment Checkout</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upgrading to {selectedPlan.name} ({billingPeriod})
                </p>
              </div>

              <button
                onClick={handleCloseCheckout}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Payment Submitted Successfully!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{submitSuccess}</p>
                <button
                  onClick={handleCloseCheckout}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Close & View Status
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                
                {submitError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Amount to Send */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Total Subscription Fee:</span>
                    <div className="text-2xl font-black text-white">
                      ৳{billingPeriod === 'yearly' ? selectedPlan.priceYearlyBdt : selectedPlan.priceMonthlyBdt} BDT
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white uppercase">
                    {billingPeriod}
                  </span>
                </div>

                {/* Step 1: Select Payment Method */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">1. Select Mobile Wallet</label>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map((method) => {
                      const isSelected = selectedMethod?.id === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethod(method)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs">{method.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{method.account_type}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Display Payment Details & Copy Number */}
                {selectedMethod && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{selectedMethod.name} ({selectedMethod.account_type}) Number:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(selectedMethod.account_number)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="text-xl font-mono font-bold text-white tracking-wider">
                      {selectedMethod.account_number}
                    </div>

                    {selectedMethod.instructions && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Instructions
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                          {selectedMethod.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Verification Form Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Sender Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 017XXXXXXXX"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400">The mobile number from which you sent money.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Transaction ID (TrxID) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BL92A8XYZ9"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                    <span className="text-[10px] text-slate-400">Found in your mobile wallet SMS or transaction receipt.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Payment Screenshot / Receipt URL <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Verification...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Submit Payment for Verification</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
