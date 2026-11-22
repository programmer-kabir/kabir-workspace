import React, { useState, useEffect } from 'react';
import { CheckCircle2, Zap, Crown, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchPublicPlans } from '../services/api';
import { SubscriptionPlan } from '../types';

interface PricingSectionProps {
  onSelectPlan: (planSlug: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicPlans()
      .then((data) => setPlans(data.plans))
      .catch((err) => console.error('Failed to load public plans:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentPlan = user?.plan || 'free';

  return (
    <section id="pricing" className="py-20 px-6 sm:px-10 lg:px-16 2xl:px-24 max-w-[1750px] mx-auto relative z-10">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Pricing in BDT (৳)</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Choose the Perfect Speed & Quota
        </h2>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          From casual personal media archiving to high-throughput enterprise API extraction.
          Pay seamlessly with your Bangladesh mobile wallets (bKash, Nagad, Rocket).
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-4 inline-flex items-center">
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
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
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = user && currentPlan === plan.slug;
          const isPopular = plan.slug === 'pro';
          const isEnterprise = plan.slug === 'enterprise';
          const price = billingPeriod === 'yearly' ? plan.priceYearlyBdt : plan.priceMonthlyBdt;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/15 scale-100 md:-translate-y-2'
                  : 'bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 backdrop-blur-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {isEnterprise && <Crown className="w-5 h-5 text-amber-400" />}
                  {isPopular && <Zap className="w-5 h-5 text-indigo-400" />}
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">৳{price}</span>
                  <span className="text-xs text-slate-400">BDT / {billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                </div>

                <p className="text-xs text-slate-400 mt-2.5">
                  {plan.slug === 'free'
                    ? 'Perfect for casual single video downloads with basic queue priority.'
                    : plan.slug === 'pro'
                    ? 'High speed, bulk downloader, and priority background processing.'
                    : 'Maximum power, uncapped queues, and high-frequency Developer API access.'}
                </p>

                {/* Quota Highlights */}
                <div className="mt-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Daily Downloads:</span>
                    <strong className="text-white">{plan.dailyDownloadQuota} / day</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Queue Speed:</span>
                    <strong className="text-indigo-400">{isEnterprise ? '10x Priority' : isPopular ? '5x Priority' : 'Standard'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">API Rate Limit:</span>
                    <strong className="text-slate-200">{plan.apiRpm} RPM</strong>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Included Features</div>
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
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectPlan(plan.slug)}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 shadow-indigo-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>{plan.slug === 'free' ? 'Get Started Free' : `Upgrade to ${plan.name}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Manual Verification Note */}
      <div className="mt-12 text-center text-xs text-slate-400 max-w-2xl mx-auto flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>Manual mobile banking verification guarantees zero gateway downtime and instant verification by our local team.</span>
      </div>

    </section>
  );
};
