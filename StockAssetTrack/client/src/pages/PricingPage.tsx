import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, CreditCard, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { createBillingCheckout, simulateLocalWebhook } from '../services/api';
import type { BillingGateway, PlanTier } from '../types/stock';

type DisplayCurrency = 'USD' | 'BDT';
type BillingCycle = 'monthly' | 'yearly';

interface PricingCardPlan {
  id: string;
  tier: PlanTier;
  name: string;
  usdPrice: number;
  bdtPrice: number;
  period: string;
  userSlotText: string;
  highlighted?: boolean;
  ctaLabel: string;
  features: string[];
}

const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = {
  USD: '$',
  BDT: '৳',
};

export function PricingPage() {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [currency, setCurrency] = useState<DisplayCurrency>('USD');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [gateway, setGateway] = useState<BillingGateway>('stripe');
  const [pendingCheckout, setPendingCheckout] = useState<{
    sessionId: string;
    planTier: Exclude<PlanTier, 'free'>;
    gateway: BillingGateway;
    amountDisplay: string;
    localTestWebhookEnabled: boolean;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const plans: PricingCardPlan[] = [
    {
      id: 'free',
      tier: 'free',
      name: 'Free',
      usdPrice: 0,
      bdtPrice: 0,
      period: '/forever',
      userSlotText: '1 x user · 1 device',
      ctaLabel: 'Start Free',
      features: [
        '2 niche searches per day',
        'Market demand & competition bar',
        '12 instant client-side sorts',
        'Null-safe asset previews',
        'Local favorites drawer',
      ],
    },
    {
      id: 'starter',
      tier: 'starter',
      name: 'Starter',
      usdPrice: cycle === 'yearly' ? 38 : 4,
      bdtPrice: cycle === 'yearly' ? 4560 : 480,
      period: cycle === 'yearly' ? '/yr' : '/mo',
      userSlotText: '1 x user · 1 device',
      ctaLabel: 'Choose Starter',
      features: [
        '20 daily niche & portfolio searches',
        'Contributor Portfolio Tracker',
        '6-type Category Heat Map',
        'Analytics & Adobe Stock CSV export',
        'Saved watchlist & search history',
      ],
    },
    {
      id: 'pro',
      tier: cycle === 'yearly' ? 'annual' : 'pro',
      name: cycle === 'yearly' ? 'Pro Annual' : 'Pro',
      usdPrice: cycle === 'yearly' ? 67 : 8,
      bdtPrice: cycle === 'yearly' ? 7990 : 960,
      period: cycle === 'yearly' ? '/yr' : '/mo',
      userSlotText: cycle === 'yearly' ? '1 x user · 5 devices' : '1 x user · 3 devices',
      highlighted: true,
      ctaLabel: cycle === 'yearly' ? 'Choose Annual' : 'Choose Pro',
      features: [
        'Unlimited daily searches & filters',
        'Trending & Velocity Breakout Spy',
        'Visual Similar & Image Upload search',
        'Top-10 Tag Cluster Studio & CSV',
        'AI Prompt Reverse Engineer (MJ / Flux / SD)',
        '60-90 Day Seasonal Upload Calendar',
      ],
    },
  ];

  const formatAmount = (plan: PricingCardPlan) => {
    const num = currency === 'BDT' ? plan.bdtPrice : plan.usdPrice;
    return `${CURRENCY_SYMBOL[currency]}${num.toLocaleString()}`;
  };

  const handleSelectPlan = async (tier: PlanTier) => {
    if (tier === 'free') {
      navigate(user ? '/dashboard' : '/auth');
      return;
    }

    if (!user) {
      toast.info('Please sign in first to activate your plan.');
      navigate('/auth?redirect=/pricing');
      return;
    }

    setProcessing(true);
    try {
      const res = await createBillingCheckout({
        planTier: tier,
        billingCycle: cycle,
        gateway,
        currency,
      });
      setPendingCheckout({
        sessionId: res.checkoutSessionId,
        planTier: res.planTier,
        gateway: res.gateway,
        amountDisplay: res.amountDisplay,
        localTestWebhookEnabled: res.localTestWebhookEnabled,
      });
      toast.success(`Checkout session ready for ${tier.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Simple, Creator-Friendly Pricing
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Start free forever or unlock unlimited research tools as you grow.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#0d101b]">
            {(['USD', 'BDT'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`rounded-lg px-4 py-1.5 font-semibold transition ${
                  currency === curr
                    ? 'bg-brand-indigo text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {curr === 'USD' ? 'USD ($)' : 'BDT (৳)'}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#0d101b]">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                cycle === 'monthly'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                cycle === 'yearly'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Yearly (Save 30%)
            </button>
          </div>
        </div>
      </div>

      {pendingCheckout && user && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-indigo/35 bg-brand-indigo/10 p-5 text-xs">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-brand-indigo" />
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Checkout Ready: {pendingCheckout.planTier.toUpperCase()} ({pendingCheckout.amountDisplay})
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-mono">{pendingCheckout.sessionId}</span>
                <span>· Method:</span>
                {(['stripe', 'creem', 'cryptomus'] as const).map((gw) => (
                  <button
                    key={gw}
                    type="button"
                    onClick={() => setGateway(gw)}
                    className={`rounded px-2 py-0.5 uppercase font-semibold ${
                      gateway === gw
                        ? 'bg-brand-indigo text-white'
                        : 'bg-white/70 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {gw}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {pendingCheckout.localTestWebhookEnabled && (
            <button
              type="button"
              onClick={async () => {
                await simulateLocalWebhook(gateway, {
                  checkoutSessionId: pendingCheckout.sessionId,
                  planTier: pendingCheckout.planTier,
                  userId: user.id,
                });
                await refreshSession();
                setPendingCheckout(null);
                toast.success(`Activated ${pendingCheckout.planTier.toUpperCase()} tier!`);
                navigate('/dashboard');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 font-semibold text-white shadow-md shadow-purple-500/20 hover:opacity-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Activate Plan</span>
            </button>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = user?.planTier === plan.tier;
          return (
            <div
              key={plan.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800/90 dark:bg-[#0d101b]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" />
                    Current
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatAmount(plan)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {plan.period}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4 text-purple-500" />
                <span>{plan.userSlotText}</span>
              </div>

              <div className="my-6 border-t border-slate-200 dark:border-slate-800/80" />

              <ul className="flex-1 space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={processing || isCurrent}
                onClick={() => void handleSelectPlan(plan.tier)}
                className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:opacity-95'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800'
                }`}
              >
                {isCurrent ? 'Active Plan' : plan.ctaLabel}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
