import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle2, ShoppingBag } from 'lucide-react';
import useAuth from '../utlis/Hooks/useAuth';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);

  const plan = location.state?.plan;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no plan is passed or not logged in, redirect
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (!plan) {
    return <Navigate to="/join-pro" />;
  }

  // Load Lemon Squeezy Script
  useEffect(() => {
    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
      }
    };

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Temporary Map for Lemon Squeezy Variant IDs (You will replace these with real IDs)
  const getVariantId = (slug) => {
    const variants = {
      'starter': '810e3875-02f0-45e7-a1fc-8b315ebab310',
      'premium': '12346',
      'pro': '12347',
      'pro-plus': '12348'
    };
    return variants[slug] || '00000';
  };

  const checkoutUrl = `https://dayalstock.lemonsqueezy.com/checkout/buy/${getVariantId(plan.slug)}?embed=1&checkout[email]=${user?.email || ''}&checkout[custom][user_id]=${user?.uid || ''}&checkout[custom][plan_id]=${plan?.id || ''}&dark=1`;

  const handleCheckoutClick = (e) => {
    e.preventDefault();
    if (window.LemonSqueezy && window.LemonSqueezy.Url) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-center">

        {/* Left Side: Lemon Squeezy Checkout Trigger */}
        <div className="flex-1 w-full md:max-w-[500px] bg-[#111] rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.02)] p-8 border border-white/5 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-[#00D4FF]" />
          </div>
          <h2 className="text-3xl font-bold text-white font-outfit mb-3">Complete Your Purchase</h2>
          <p className="text-gray-400 mb-8 max-w-sm">
            You will be securely redirected to our payment partner, Lemon Squeezy, to complete your subscription.
          </p>

          <a
            href={checkoutUrl}
            onClick={handleCheckoutClick}
            className="w-full max-w-sm flex items-center justify-center py-4 px-6 rounded-xl font-bold text-lg transition-all bg-[#00D4FF] hover:bg-[#33DEFF] text-[#050505] shadow-[0_0_15px_rgba(0,212,255,0.2)]"
          >
            Pay ${plan.price} Now
          </a>

          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Lock size={14} className="text-green-400" />
            Secure 128-bit encrypted payment
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full md:w-96">
          <div className="bg-[#111] rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-white/5 p-8 sticky top-8">
            <h3 className="text-xl font-bold text-white font-outfit mb-6">Order Summary</h3>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div>
                <h4 className="font-bold text-white text-lg">{plan.name} Plan</h4>
                <p className="text-sm text-[#00D4FF] capitalize">{plan.billing_cycle} billing</p>
              </div>
              <div className="text-2xl font-bold text-white">
                ${plan.price}
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                <span className="text-sm text-gray-300">{plan.download_limit} downloads per {plan.limit_period}</span>
              </li>
              {Number(plan.premium_access) === 1 && (
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                  <span className="text-sm text-gray-300">Full Premium Access</span>
                </li>
              )}
              {Number(plan.commercial_license) === 1 && (
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                  <span className="text-sm text-gray-300">Commercial License Included</span>
                </li>
              )}
            </ul>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-medium text-center">
                This is a secure demo payment environment. No real charges will be made.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
