import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSubscriptions from '../utlis/Hooks/useSubscriptions';
import useAuth from '../utlis/Hooks/useAuth';
import { Check, X, Sparkles } from 'lucide-react';
import DayalLoader from '../components/Common/DayalLoader';

const PricingPage = () => {
  const { data: plans, isLoading, error } = useSubscriptions();
  const [isYearly, setIsYearly] = useState(false);
  const [activeTab, setActiveTab] = useState('subscription');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/users/get_user_details_by_email.php`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (data.success) {
          setUserData(data.data);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [user]);

  console.log("MySQL User ID:", userData?.id);
  // Load Lemon Squeezy Script
  useEffect(() => {
    const scriptId = 'lemonsqueezy-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://assets.lemonsqueezy.com/lemon.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Initialize Lemon Squeezy when plans are loaded
  useEffect(() => {
    if (!isLoading && plans && window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }
  }, [isLoading, plans]);

  const getVariantId = (slug) => {
    const variants = {
      'starter': '810e3875-02f0-45e7-a1fc-8b315ebab310',
      'premium': '12',
      'pro': '12',
      'pro-plus': '12'
    };
    return variants[slug] || '00000';
  };

  const handleUpgrade = (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If it's a free plan, you might just want to process it in backend directly
    if (Number(plan.price) === 0 || plan.billing_cycle === 'free') {
      navigate(`/checkout/${plan.id}`, { state: { plan } }); // Fallback for free plans if needed
      return;
    }

    const checkoutUrl = `https://dayalstock.lemonsqueezy.com/checkout/buy/${getVariantId(plan.slug)}?embed=1&checkout[email]=${user?.email || ''}&checkout[custom][user_id]=${userData?.id || user?.uid || ''}&checkout[custom][plan_id]=${plan.id}&dark=1`;

    // Check if Lemon Squeezy is loaded properly
    if (window.LemonSqueezy && window.LemonSqueezy.Url) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      console.warn('Lemon Squeezy not fully initialized, falling back to redirect');
      window.location.href = checkoutUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
        <DayalLoader text="Loading subscription plans..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-[#111] rounded-2xl shadow-xl p-8 text-center border border-red-500/20">
          <h2 className="text-xl font-bold text-red-500 mb-2">Oops!</h2>
          <p className="text-gray-500 dark:text-gray-400">Failed to load subscription plans. Please try again later.</p>
        </div>
      </div>
    );
  }

  const freePlan = plans?.find(p => p.price === "0.00" || p.billing_cycle === 'free');

  // Get the paid plans matching the current toggle
  const paidPlans = plans?.filter(p => {
    if (p.price === "0.00" || p.billing_cycle === 'free') return false;
    return isYearly ? p.billing_cycle === 'yearly' : p.billing_cycle === 'monthly';
  }).sort((a, b) => Number(a.sort_order) - Number(b.sort_order)) || [];

  const displayPlans = [freePlan, ...paidPlans].filter(Boolean);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] pt-36 pb-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 font-outfit">
            Pricing that scales with your creativity
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Choose the perfect plan for your creative journey. Cancel anytime.
          </p>

          {/* Tabs for Subscription / Credit */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-[#111] p-1 rounded-xl inline-flex shadow-sm border border-gray-200 dark:border-white/5">
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'subscription'
                  ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-md border border-gray-200 dark:border-white/10'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('credit')}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'credit'
                  ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-md border border-gray-200 dark:border-white/10'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
              >
                Credits
              </button>
            </div>
          </div>

          {/* Billing Toggle (Only for Subscription Tab) */}
          {activeTab === 'subscription' && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-[#050505] ${isYearly ? 'bg-[#00D4FF]' : 'bg-gray-300 dark:bg-gray-700'}`}
                role="switch"
                aria-checked={isYearly}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isYearly ? 'translate-x-7' : 'translate-x-0'}`}
                />
              </button>
              <span className={`text-sm font-medium flex items-center gap-2 ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                Yearly <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#00D4FF]/10 dark:bg-[#00D4FF]/20 text-[#0088b3] dark:text-[#00D4FF] border border-[#00D4FF]/20 dark:border-[#00D4FF]/30">Save 20%</span>
              </span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-8">
          {activeTab === 'subscription' && displayPlans.map((plan) => {
            const isPopular = Number(plan.is_popular) === 1 || plan.slug === 'pro' || plan.slug === 'yearly-pro';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 ${isPopular
                  ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow-[0_0_40px_rgba(0,212,255,0.15)] scale-105 z-10 border border-[#00D4FF]'
                  : 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow-xl border border-gray-200 dark:border-white/5 mt-4 md:mt-4'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                      <Sparkles size={14} /> Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white font-outfit">{plan.name.replace('Yearly ', '')}</h3>
                  <p className="text-sm h-10 text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline">
                  <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  {plan.billing_cycle !== 'free' && (
                    <span className="ml-1 text-lg font-medium text-gray-500">
                      /{plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleUpgrade(plan);
                  }}
                  className={`mt-2 w-full block rounded-xl py-3.5 px-4 text-center text-sm font-bold transition-all duration-200 lemonsqueezy-button ${isPopular
                    ? 'bg-[#00D4FF] text-[#050505] hover:bg-[#33DEFF] shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                    : 'bg-gray-100 dark:bg-white/5 text-[#0088b3] dark:text-[#00D4FF] border border-[#00D4FF]/20 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                >
                  {Number(plan.price) === 0 ? 'Start For Free' : 'Upgrade to ' + plan.name.replace('Yearly ', '')}
                </a>

                {/* Features List */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                  <p className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
                    What's included:
                  </p>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-x-3 items-start">
                      <Check className="h-5 w-5 shrink-0 text-[#00D4FF]" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-gray-200">{plan.download_limit || plan.image_limit}</strong> downloads per {plan.limit_period}
                      </span>
                    </li>

                    <FeatureItem
                      active={Number(plan.premium_access) === 1}
                      text="Premium content access"
                    />
                    <FeatureItem
                      active={Number(plan.commercial_license) === 1}
                      text="Commercial license"
                    />
                    <FeatureItem
                      active={Number(plan.ad_free) === 1}
                      text="Ad-free experience"
                    />
                    <FeatureItem
                      active={Number(plan.attribution_required) === 0}
                      text="No attribution required"
                    />
                    <FeatureItem
                      active={Number(plan.priority_support) === 1}
                      text="Priority support"
                    />
                  </ul>
                </div>
              </div>
            );
          })}

          {activeTab === 'credit' && creditPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-[#111] rounded-3xl p-8 transition-all duration-300 flex flex-col h-full
                ${plan.isPopular
                  ? 'border border-[#00D4FF] shadow-[0_0_40px_rgba(0,212,255,0.15)] scale-105 z-10'
                  : 'border border-gray-200 dark:border-white/5 shadow-xl mt-4 md:mt-4'
                }
              `}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                    <Sparkles size={14} /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-2xl font-bold mb-2 text-gray-900 dark:text-white font-outfit`}>
                  {plan.name}
                </h3>
                <p className="text-sm h-10 text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline">
                <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">${plan.price}</span>
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                className={`mt-2 w-full rounded-xl py-3.5 px-4 text-center text-sm font-bold transition-all duration-200
                  ${plan.isPopular
                    ? 'bg-[#00D4FF] text-[#050505] hover:bg-[#33DEFF] shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                    : 'bg-gray-100 dark:bg-white/5 text-[#0088b3] dark:text-[#00D4FF] border border-[#00D4FF]/20 hover:bg-gray-200 dark:hover:bg-white/10'
                  }
                `}
              >
                {plan.buttonText}
              </button>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                <p className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
                  What's included:
                </p>
                <ul className="space-y-4 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-x-3 items-start">
                      <Check className="h-5 w-5 shrink-0 text-[#00D4FF]" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-outfit">Frequently Asked Questions</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need to know about our plans and licenses.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const creditPlans = [
  {
    id: 'credit-1',
    name: 'Starter Pack',
    description: 'Perfect for one-off projects',
    price: '9.99',
    isPopular: false,
    buttonText: 'Buy 10 Credits',
    features: ['10 Premium Downloads', 'No Expiration', 'Standard Support'],
  },
  {
    id: 'credit-2',
    name: 'Pro Pack',
    description: 'Best value for freelancers',
    price: '39.99',
    isPopular: true,
    buttonText: 'Buy 50 Credits',
    features: ['50 Premium Downloads', 'No Expiration', 'Priority Support'],
  },
  {
    id: 'credit-3',
    name: 'Agency Pack',
    description: 'For high volume needs',
    price: '69.99',
    isPopular: false,
    buttonText: 'Buy 100 Credits',
    features: ['100 Premium Downloads', 'No Expiration', '24/7 Priority Support'],
  }
];

const faqs = [
  {
    question: "What is the difference between Free and Pro plans?",
    answer: "Free plan users have access to a limited library of basic assets and require attribution when using them. Pro plan gives you unlimited access to our entire premium library, including commercial licenses and an ad-free experience with no attribution required."
  },
  {
    question: "What does the Commercial License cover?",
    answer: "The Commercial License allows you to use our assets in commercial projects, such as websites, advertising, social media, apps, and print materials for yourself or your clients without providing attribution."
  },
  {
    question: "Can I use the resources for client projects?",
    answer: "Yes! If you have a Pro subscription, you can use our assets for any number of client projects. The commercial license covers agency work and freelance projects."
  },
  {
    question: "Do I need to provide attribution for the assets?",
    answer: "If you are on the Free plan, you must provide a link back to our website. If you are on the Pro plan, no attribution is required for any of the assets you download."
  },
  {
    question: "Are there any download limits?",
    answer: "Our Pro plans come with specific daily or monthly download limits to prevent abuse and ensure fair usage for all users. You can check your plan's specific limits on the pricing card."
  },
  {
    question: "What happens to my downloaded assets if I cancel my subscription?",
    answer: "You can continue to use any assets you downloaded and incorporated into final projects while your subscription was active. However, you cannot start new projects with those assets or download new ones once your subscription expires."
  },
  {
    question: "Can I resell or redistribute the assets?",
    answer: "No. You cannot resell, redistribute, or share our raw assets on other platforms or as part of a template where the asset is the main value. Assets must be incorporated into a larger design."
  }
];

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#111] overflow-hidden transition-all duration-200 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-gray-200">{question}</span>
        <span className={`ml-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 transition-all duration-200 ${isOpen ? 'rotate-180 bg-[#00D4FF]/10 dark:bg-[#00D4FF]/20 text-[#0088b3] dark:text-[#00D4FF]' : 'text-gray-500 dark:text-gray-400'}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-200 dark:border-white/5 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
};


// Helper component for feature list items
const FeatureItem = ({ active, text }) => {
  if (!active) {
    return (
      <li className="flex gap-x-3 items-start opacity-50">
        <X className="h-5 w-5 shrink-0 text-gray-500" />
        <span className="text-gray-500 line-through">
          {text}
        </span>
      </li>
    );
  }

  return (
    <li className="flex gap-x-3 items-start">
      <Check className="h-5 w-5 shrink-0 text-[#00D4FF]" />
      <span className="text-gray-600 dark:text-gray-400">
        {text}
      </span>
    </li>
  );
};

export default PricingPage;
