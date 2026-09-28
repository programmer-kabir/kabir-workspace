// frontend/src/components/pricing/PricingModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, Check, Crown, Zap, Shield, Sparkles, User, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPricingPlans } from '@/lib/api';
import { PricingPlan } from '@/types/cms';
import { useAuth } from '@/context/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'pro_icon' | 'quota_reached' | 'general';
  iconName?: string;
}

export default function PricingModal({
  isOpen,
  onClose,
  reason = 'pro_icon',
  iconName,
}: PricingModalProps) {
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamSeats, setTeamSeats] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getPricingPlans().then((res) => {
      if (isMounted && res.success && res.data?.plans) {
        setPlans(res.data.plans);
      }
      if (isMounted) setLoading(false);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const proPlans = plans.filter((p) => p.name.toLowerCase() !== 'free');
  const displayPlans = proPlans.length > 0 ? proPlans : [
    {
      id: 2,
      name: 'Solo Pro',
      price: 99,
      billing_period: 'yr',
      is_popular: false,
      features: [
        'All 5,000+ Vector Icons (Outlined & Filled)',
        'Exclusive access to all 👑 Pro Icons',
        'Unlimited SVG & PNG Downloads',
        'Unlimited React JSX & SVG Clipboard Copying',
        'Commercial Freedom (No attribution required)',
        'Single user license',
      ],
      cta_text: 'Get Solo Pro',
      cta_url: '/pricing',
      display_order: 1,
    },
    {
      id: 3,
      name: 'Team Pro',
      price: 249,
      billing_period: 'yr',
      is_popular: true,
      features: [
        'Everything in Solo Pro',
        'Shared organization collections',
        '5 seats included (+ $20/yr per extra seat)',
        'Centralized billing & invoice management',
        'Priority vector format support',
        'Unlimited team exports',
      ],
      cta_text: 'Get Team Pro',
      cta_url: '/pricing',
      display_order: 2,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-[#11121d] border border-white/10 shadow-2xl p-5 sm:p-8 overflow-hidden text-slate-100">
        
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
          aria-label="Close pricing dialog"
        >
          <X className="size-5" />
        </button>

        {/* Header / Notice */}
        <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Crown className="size-3.5 fill-amber-400 text-amber-400" />
            <span>IconBaba Pro Access</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {reason === 'pro_icon' ? (
              <>
                Unlock Exclusive <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Pro Icons</span>
              </>
            ) : reason === 'quota_reached' ? (
              <>
                Daily Free Limit Reached <span className="text-rose-400">(20/20)</span>
              </>
            ) : (
              <>
                Simple, Transparent <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">Pricing</span>
              </>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {reason === 'pro_icon' && iconName ? (
              <span>The icon <strong className="text-amber-300 font-mono">"{iconName}"</strong> is exclusive to Pro members. Upgrade today for unlimited SVG & PNG downloads and full commercial freedom.</span>
            ) : reason === 'quota_reached' ? (
              <span>You have used all 20 of your free icon downloads for today. Upgrade to Pro for unlimited daily downloads and copies!</span>
            ) : (
              <span>Get instant access to 5,000+ vector icons, Pro icons, and unlimited commercial downloads.</span>
            )}
          </p>

          {!user && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Already have a Pro account?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10 mb-6">
          {displayPlans.map((plan) => {
            const isTeam = plan.name.toLowerCase().includes('team');
            const displayPrice = isTeam
              ? plan.price + Math.max(0, teamSeats - 5) * 20
              : plan.price;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                  plan.is_popular
                    ? 'bg-gradient-to-b from-purple-900/30 to-[#141524] border-2 border-purple-500/50 shadow-xl shadow-purple-900/20'
                    : 'bg-white/[0.03] border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {isTeam ? <Users className="size-4 text-purple-400" /> : <User className="size-4 text-purple-400" />}
                      <span>{plan.name}</span>
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl sm:text-4xl font-black text-white">${displayPrice}</span>
                    <span className="text-xs text-slate-400 font-medium">/{plan.billing_period || 'yr'}</span>
                  </div>

                  {/* Seat Stepper for Teams */}
                  {isTeam && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 mb-4 text-xs">
                      <span className="text-slate-300 font-medium">{teamSeats} User Seats</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTeamSeats((s) => Math.max(5, s - 1))}
                          disabled={teamSeats <= 5}
                          className="size-6 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold text-purple-300 px-1">{teamSeats}</span>
                        <button
                          type="button"
                          onClick={() => setTeamSeats((s) => s + 1)}
                          className="size-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    {plan.features.slice(0, 5).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (!user) {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    } else {
                      window.location.href = '/pricing';
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    plan.is_popular
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  <span>{plan.cta_text || `Choose ${plan.name}`}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info: Free plan info & Guarantee */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-purple-400 shrink-0" />
            <span>14-day 100% money-back guarantee • Cancel anytime</span>
          </div>

          <Link
            to="/pricing"
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 transition-colors"
          >
            View Full Pricing & License Comparison →
          </Link>
        </div>

      </div>
    </div>
  );
}
