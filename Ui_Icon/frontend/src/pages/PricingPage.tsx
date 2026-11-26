// frontend/src/pages/PricingPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, User, Users, Plus, Minus, Shield, Sparkles, Loader2, PartyPopper, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SiteHeader from '@/components/header/SiteHeader';
import { getPricingPlans, getContentPage, syncSubscription } from '@/lib/api';
import { PricingPlan, ContentPage } from '@/types/cms';

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [pageInfo, setPageInfo] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, setShowAuthModal, setAuthMode, refreshUser } = useAuth();

  // Interactive plan seats map (planId -> number of seats)
  const [planSeats, setPlanSeats] = useState<Record<number, number>>({});
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Initialize Lemon Squeezy Modal Overlay (Lemon.js)
  useEffect(() => {
    const initLemon = () => {
      if (typeof window !== 'undefined') {
        if (window.createLemonSqueezy) {
          window.createLemonSqueezy();
        }
        if (window.LemonSqueezy?.Setup) {
          window.LemonSqueezy.Setup({
            eventHandler: async (event) => {
              if (event.event === 'Checkout.Success') {
                setPaymentSuccess(true);
                setIsCheckoutLoading(null);
                try {
                  await syncSubscription();
                } catch (err) {
                  console.error('Error syncing subscription:', err);
                }
                refreshUser();
              } else if (event.event === 'Checkout.Close') {
                setIsCheckoutLoading(null);
              }
            },
          });
          return true;
        }
      }
      return false;
    };

    if (!initLemon()) {
      const timer = setInterval(() => {
        if (initLemon()) {
          clearInterval(timer);
        }
      }, 400);
      return () => clearInterval(timer);
    }
  }, [refreshUser]);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, pageRes] = await Promise.all([
          getPricingPlans(),
          getContentPage('pricing'),
        ]);

        if (plansRes.success && plansRes.data?.plans) {
          const loadedPlans: PricingPlan[] = plansRes.data.plans;
          setPlans(loadedPlans);
          const initialSeats: Record<number, number> = {};
          loadedPlans.forEach((p) => {
            const baseUsers = Number(p.user_count) || 1;
            initialSeats[p.id] = baseUsers;
          });
          setPlanSeats(initialSeats);
        }
        if (pageRes.success && pageRes.data) {
          setPageInfo(pageRes.data);
        }
      } catch (err) {
        console.error('Failed to load pricing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Determine if a plan is multi-seat / team enabled
  const isMultiSeatPlan = (plan: PricingPlan) => {
    const baseUsers = Number(plan.user_count) || 1;
    const extraSeatPrice = Number(plan.extra_seat_price) || 0;
    const isTeamNamed = plan.name.toLowerCase().includes('team');
    return baseUsers > 1 || extraSeatPrice > 0 || isTeamNamed;
  };

  // Calculate dynamic price based on selected seats
  const getDisplayPrice = (plan: PricingPlan) => {
    const basePrice = Number(plan.price) || 0;
    const baseUsers = Number(plan.user_count) || 1;
    const extraSeatPrice = Number(plan.extra_seat_price) || 0;
    const currentSeats = planSeats[plan.id] ?? baseUsers;

    if (!isMultiSeatPlan(plan) || currentSeats <= baseUsers || extraSeatPrice <= 0) {
      return basePrice;
    }
    return basePrice + (currentSeats - baseUsers) * extraSeatPrice;
  };

  // Build Lemon Squeezy checkout URL with overlay mode (?embed=1) and custom user data
  const getCheckoutUrl = (plan: PricingPlan, seats: number) => {
    const isMulti = isMultiSeatPlan(plan);
    const baseUrl = isMulti
      ? `https://iconstests.lemonsqueezy.com/checkout/buy/51e771b4-0ae0-496f-8400-8b593690c08c?embed=1&quantity=${seats}`
      : `https://iconstests.lemonsqueezy.com/checkout/buy/5b26a250-efef-4f03-9bf6-31aedca671e7?embed=1`;

    const url = new URL(baseUrl);
    if (user) {
      url.searchParams.set('checkout[custom][user_id]', String(user.id));
      url.searchParams.set('checkout[custom][plan_id]', String(plan.id));
      url.searchParams.set('checkout[custom][seats]', String(seats));
      url.searchParams.set('checkout[custom][plan_type]', isMulti ? 'team' : 'solo');
      if (user.email) {
        url.searchParams.set('checkout[email]', user.email);
      }
      if (user.full_name || user.username) {
        url.searchParams.set('checkout[name]', user.full_name || user.username);
      }
    }
    url.searchParams.set('dark', '1');
    return url.toString();
  };

  const handleOpenCheckout = (e: React.MouseEvent, plan: PricingPlan, seats: number) => {
    e.preventDefault();
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    const checkoutUrl = getCheckoutUrl(plan, seats);
    setIsCheckoutLoading(String(plan.id));

    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.open(checkoutUrl, '_blank');
      setIsCheckoutLoading(null);
    }
  };

  const hasActiveSubscription = Boolean(
    user && (user.is_pro || user.subscription?.status === 'active' || user.roles?.includes('admin') || user.role === 'admin')
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d0e15] transition-colors">
      <SiteHeader />

      <main className="flex-1 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 mx-auto w-full">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium mb-4">
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
            Simple & Transparent Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {pageInfo?.title || 'Simple, Transparent Pricing'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            {pageInfo?.meta_description ||
              'Access 5,000+ precision-crafted vector icons. Start solo or collaborate with your team with commercial freedom and zero attribution.'}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto animate-pulse">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[520px] rounded-3xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-8"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto items-stretch">
            {plans.map((plan) => {
              const isMulti = isMultiSeatPlan(plan);
              const isSolo = !isMulti && !plan.name.toLowerCase().includes('free');
              const isFree = plan.name.toLowerCase().includes('free');
              const baseUsers = Number(plan.user_count) || 1;
              const extraSeatPrice = Number(plan.extra_seat_price) || 0;
              const currentSeats = planSeats[plan.id] ?? baseUsers;
              const displayPrice = getDisplayPrice(plan);

              return (
                <div
                  key={plan.id}
                  className="rounded-3xl p-8 sm:p-9 bg-white dark:bg-[#11121c] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between shadow-xl dark:shadow-2xl relative"
                >
                  <div>
                    {/* Plan Name */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      {hasActiveSubscription && (isSolo || isMulti) && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          Active Plan
                        </span>
                      )}
                    </div>

                    {/* Price Header */}
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        ${displayPrice}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        /{plan.billing_period || 'yr'}
                      </span>
                    </div>

                    {/* User Badge / Seat Stepper */}
                    <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
                      {!isMulti ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                          <User className="size-4 text-purple-600 dark:text-purple-400" />
                          <span>1 x user</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                              <Users className="size-4 text-purple-600 dark:text-purple-400" />
                              <span>{currentSeats} x users</span>
                            </div>
                            {extraSeatPrice > 0 && (
                              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 px-2 py-0.5 rounded-full">
                                +${extraSeatPrice}/{plan.billing_period || 'yr'} per extra seat
                              </span>
                            )}
                          </div>

                          {/* Seat Stepper Controller */}
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <span className="text-xs text-slate-500 dark:text-slate-400 pl-2">Adjust seats:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPlanSeats((prev) => ({
                                    ...prev,
                                    [plan.id]: Math.max(baseUsers, (prev[plan.id] ?? baseUsers) - 1),
                                  }))
                                }
                                disabled={currentSeats <= baseUsers}
                                className="size-7 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={`Remove seat (Min ${baseUsers})`}
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="text-xs font-bold text-slate-900 dark:text-white w-6 text-center">
                                {currentSeats}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPlanSeats((prev) => ({
                                    ...prev,
                                    [plan.id]: (prev[plan.id] ?? baseUsers) + 1,
                                  }))
                                }
                                className="size-7 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white flex items-center justify-center transition-colors"
                                title={`Add seat (+$${extraSeatPrice || 20})`}
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features Checklist */}
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-8">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="size-4 rounded-full bg-purple-100 dark:bg-white/10 text-purple-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="size-2.5 text-purple-700 dark:text-slate-200 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-2">
                    {(() => {
                      if (isFree) {
                        return (
                          <Link
                            to="/"
                            className="w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all text-center"
                          >
                            {plan.cta_text || 'Start Free'}
                          </Link>
                        );
                      }

                      const checkoutUrl = getCheckoutUrl(plan, currentSeats);
                      const isThisLoading = isCheckoutLoading === String(plan.id);

                      return (
                        <a
                          href={checkoutUrl}
                          onClick={(e) => handleOpenCheckout(e, plan, currentSeats)}
                          className="lemonsqueezy-button w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all text-center cursor-pointer"
                        >
                          {isThisLoading ? (
                            <>
                              <Loader2 className="size-4 animate-spin text-white" />
                              <span>Opening Checkout...</span>
                            </>
                          ) : (
                            plan.cta_text || `Choose ${plan.name}`
                          )}
                        </a>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Free Plan Notice */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400">
            Looking for free icons? Explore 5,000+ icons under our{' '}
            <Link
              to="/licenses/free"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
            >
              Free License
            </Link>
            .
          </p>
        </div>

        {/* 14-Day Guarantee Notice */}
        <div className="mt-12 max-w-xl mx-auto text-center p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="size-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-2.5">
            <Shield className="size-4" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            14-Day 100% Money-Back Guarantee
          </h4>
          <p className="text-xs text-slate-400">
            Try IconBaba risk-free. If it doesn&apos;t accelerate your workflow, we will issue a full refund within 14 days.
          </p>
        </div>

        {/* Payment Success Overlay Modal */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#13141f] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-2xl shadow-purple-900/40">
              <button
                onClick={() => setPaymentSuccess(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="size-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-inner">
                <PartyPopper className="size-8 text-purple-300 animate-bounce" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Payment Successful! 🎉
              </h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Thank you for subscribing to IconBaba! Your subscription has been activated with full commercial rights and unlimited downloads.
              </p>

              <div className="space-y-3">
                <Link
                  to="/"
                  onClick={() => setPaymentSuccess(false)}
                  className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="size-4" />
                  Start Exploring Icons
                </Link>
                <button
                  onClick={() => setPaymentSuccess(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

