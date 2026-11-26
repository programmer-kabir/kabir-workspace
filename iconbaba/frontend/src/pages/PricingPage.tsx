// frontend/src/pages/PricingPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Loader2, PartyPopper, X, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SiteHeader from '@/components/header/SiteHeader';
import SiteFooter from '@/components/footer/SiteFooter';
import { getPricingPlans, getContentPage, syncSubscription } from '@/lib/api';
import { PricingPlan, ContentPage } from '@/types/cms';

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [pageInfo, setPageInfo] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, setShowAuthModal, setAuthMode, refreshUser } = useAuth();

  // Currency Switcher: USD ($) vs BDT (৳)
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('BDT');

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
          setPlans(plansRes.data.plans);
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

  const getCheckoutUrl = (plan: PricingPlan) => {
    let url = plan.cta_url || (plan as any).checkout_url || '#';
    if (!url.startsWith('http')) return '#';
    const glue = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    if (user?.email) params.append('checkout[email]', user.email);
    if (user?.full_name || user?.username) params.append('checkout[name]', user.full_name || user.username);
    if (user?.id) params.append('checkout[custom][user_id]', String(user.id));
    params.append('checkout[custom][plan_id]', String(plan.id));
    return `${url}${glue}${params.toString()}`;
  };

  const handleOpenCheckout = (e: React.MouseEvent, plan: PricingPlan) => {
    e.preventDefault();
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    const checkoutUrl = getCheckoutUrl(plan);
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

  // Fallback 4-tier cards if CMS has fewer plans, or formatted plan view
  const tierCards = [
    {
      id: 'free',
      name: 'Free',
      badge: 'Forever',
      priceUSD: '$0',
      priceBDT: '৳0',
      period: '/forever',
      description: 'Ideal for testing and personal side projects.',
      features: [
        'Access 90+ essential vector icons',
        'Lineal and Solid styles',
        'Personal and commercial use (with attribution)',
        'Standard SVG source files',
        'PNG exports up to 128px',
      ],
      isPopular: false,
      isFree: true,
      buttonText: 'Start Free',
    },
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Flexible',
      priceUSD: '$4.99',
      priceBDT: '৳480',
      period: '/month',
      description: 'Perfect for freelance creators and builders.',
      features: [
        'Access all 7+ curated icon packs',
        'Full Flat, Gradient & Lineal Color styles',
        'No attribution required',
        '1-Click Pack ZIP downloads',
        'Direct React JSX & Vue code copy',
        'Priority asset updates',
      ],
      isPopular: false,
      isFree: false,
      buttonText: 'Select Starter',
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Most Popular',
      priceUSD: '$9.99',
      priceBDT: '৳960',
      period: '/month',
      description: 'Maximum power for designers and modern dev teams.',
      features: [
        'Unlimited vector icon downloads',
        'All 5 visual styles (Flat, Gradient, Lineal, Solid)',
        'Full commercial license with zero limits',
        'High-resolution PNG up to 512px',
        'Custom palette and stroke editor',
        'Priority VIP support & requests',
      ],
      isPopular: true,
      isFree: false,
      buttonText: 'Select Pro',
    },
    {
      id: 'annual',
      name: 'Annual Pass',
      badge: 'Save 30%',
      priceUSD: '$79',
      priceBDT: '৳8,040',
      period: '/year',
      description: 'Best value for long-term production and agency scaling.',
      features: [
        'Everything in Pro included',
        'Full year of uninterrupted VIP access',
        'Early access to all upcoming packs',
        'Commercial license for client projects',
        'Dedicated license certificate',
        'Highest priority feature roadmap',
      ],
      isPopular: false,
      isFree: false,
      buttonText: 'Select Annual',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#08090f] text-slate-900 dark:text-slate-100 transition-colors">
      <SiteHeader />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3.5">
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Simple, Creator-Friendly Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
            {pageInfo?.title || 'Simple, Creator-Friendly Pricing'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            {pageInfo?.meta_description ||
              'Access cohesive vector icon packs with commercial freedom. Switch currencies seamlessly below.'}
          </p>

          {/* Currency Toggle Switcher: USD vs BDT */}
          <div className="mt-7 inline-flex items-center p-1 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrency('BDT')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currency === 'BDT'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>BDT (৳)</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currency === 'USD'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>USD ($)</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Creator-Friendly Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {tierCards.map((tier) => {
            const isHighlight = tier.isPopular;
            const price = currency === 'BDT' ? tier.priceBDT : tier.priceUSD;

            return (
              <div
                key={tier.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  isHighlight
                    ? 'bg-white dark:bg-[#121324] border-2 border-purple-500 shadow-xl shadow-purple-500/10 dark:shadow-purple-900/20 scale-[1.02] ring-4 ring-purple-500/10'
                    : 'bg-white dark:bg-[#11121c] border border-slate-200/90 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                {/* Popular Pill */}
                {isHighlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Card Title & Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      {tier.name}
                    </h3>
                    {!isHighlight && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Price Header */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                      {price}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                      {tier.period}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-8">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className={`size-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isHighlight 
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' 
                            : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Button */}
                <div className="pt-2">
                  {tier.isFree ? (
                    <Link
                      to="/icons"
                      className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all text-center cursor-pointer shadow-xs"
                    >
                      {tier.buttonText}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        const matchingPlan = plans.find(p => p.name.toLowerCase().includes(tier.id));
                        if (matchingPlan) {
                          handleOpenCheckout(e, matchingPlan);
                        } else if (plans[0]) {
                          handleOpenCheckout(e, plans[0]);
                        } else {
                          setShowAuthModal(true);
                        }
                      }}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all text-center cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                        isHighlight
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
                      }`}
                    >
                      {isCheckoutLoading === tier.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <span>{tier.buttonText}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Free License Notice */}
        <div className="mt-14 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Looking for free icons? Explore 90+ vector assets under our{' '}
            <Link
              to="/licenses/free"
              className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
            >
              Free License
            </Link>
            .
          </p>
        </div>

        {/* 14-Day Guarantee Notice */}
        <div className="mt-8 max-w-xl mx-auto text-center p-6 rounded-2xl bg-white dark:bg-[#11121c] border border-slate-200/90 dark:border-white/10 shadow-xs">
          <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-2.5">
            <Shield className="size-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            14-Day 100% Money-Back Guarantee
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Try IconBaba risk-free. If it doesn&apos;t accelerate your workflow, we will issue a full refund within 14 days.
          </p>
        </div>

        {/* Payment Success Overlay Modal */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#13141f] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-2xl">
              <button
                onClick={() => setPaymentSuccess(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="size-16 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-200 dark:border-purple-500/30 shadow-inner">
                <PartyPopper className="size-8 text-purple-600 dark:text-purple-300 animate-bounce" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Payment Successful! 🎉
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Thank you for subscribing to IconBaba! Your subscription has been activated with full commercial rights and unlimited downloads.
              </p>

              <div className="space-y-3">
                <Link
                  to="/"
                  onClick={() => setPaymentSuccess(false)}
                  className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="size-4" />
                  <span>Start Exploring Icons</span>
                </Link>
                <button
                  onClick={() => setPaymentSuccess(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
