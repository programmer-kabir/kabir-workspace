// frontend/src/components/auth/WelcomeToast.tsx
// Premium notification toast that appears at TOP-RIGHT after login, register, or logout.
// Auto-dismisses after 4 seconds with smooth top-slide animation and progress bar.

import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

export type ToastType = 'login' | 'register' | 'logout';

interface WelcomeToastProps {
  user?: {
    full_name?: string;
    username?: string;
  };
  type?: ToastType;
  onClose: () => void;
}

const DURATION = 4000; // 4 seconds

export default function WelcomeToast({ user, type = 'login', onClose }: WelcomeToastProps) {
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = user?.full_name || user?.username || 'there';

  useEffect(() => {
    // Animate in from top
    const t = setTimeout(() => setVisible(true), 30);

    // Progress bar countdown
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct     = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
    }, 30);

    // Auto-close
    timeoutRef.current = setTimeout(() => {
      handleClose();
    }, DURATION);

    return () => {
      clearTimeout(t);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // wait for exit animation
  };

  // Config based on action type
  const isLogout   = type === 'logout';
  const isRegister = type === 'register';

  const gradientFrom = isLogout
    ? 'from-slate-700'
    : isRegister
    ? 'from-indigo-600'
    : 'from-purple-600';

  const gradientTo = isLogout
    ? 'to-slate-900'
    : isRegister
    ? 'to-purple-600'
    : 'to-indigo-600';

  const accentBorder = isLogout
    ? 'border-slate-700/60'
    : isRegister
    ? 'border-indigo-500/30'
    : 'border-purple-500/30';

  const glowColor = isLogout
    ? 'shadow-black/40'
    : isRegister
    ? 'shadow-indigo-500/20'
    : 'shadow-purple-500/20';

  const Icon = isLogout ? LogOut : isRegister ? Sparkles : CheckCircle2;

  const title = isLogout
    ? 'Signed out 👋'
    : isRegister
    ? 'Welcome to IconBaba! 🎉'
    : 'Welcome back! 👋';

  const subtitle = isLogout
    ? `See you again soon, ${displayName}!`
    : isRegister
    ? `Your account is ready, ${displayName}`
    : `Good to see you, ${displayName}`;

  return (
    <div
      className="fixed top-6 right-6 z-[9999] pointer-events-none"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`
          pointer-events-auto
          relative w-[340px] rounded-2xl overflow-hidden
          bg-[#12131d]/95 backdrop-blur-xl border ${accentBorder}
          shadow-2xl ${glowColor}
          transition-all duration-300 ease-out
          ${visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-4 scale-95'
          }
        `}
        style={{ transitionProperty: 'opacity, transform' }}
        role="status"
        aria-live="polite"
      >
        {/* Top subtle gradient accent line */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`} />

        {/* Body */}
        <div className="flex items-center gap-3.5 px-4 pt-3.5 pb-3">
          {/* Avatar / Icon */}
          <div
            className={`
              shrink-0 w-10 h-10 rounded-xl
              bg-gradient-to-br ${gradientFrom} ${gradientTo}
              flex items-center justify-center shadow-md
            `}
          >
            <Icon className="size-5 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {subtitle}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Countdown progress bar */}
        <div className="px-4 pb-3 pt-0.5">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full transition-none`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
