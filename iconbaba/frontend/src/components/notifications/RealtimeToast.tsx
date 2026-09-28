// frontend/src/components/notifications/RealtimeToast.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Bell, ArrowRight, Sparkles } from 'lucide-react';

export interface RealtimeToastData {
  id?: number | string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  action_data?: any;
}

interface RealtimeToastProps {
  data: RealtimeToastData;
  onClose: () => void;
}

const DURATION = 8000; // 8 seconds display time for invitations

export default function RealtimeToast({ data, onClose }: RealtimeToastProps) {
  const navigate = useNavigate();
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTeamInvite = data.type === 'team_invite';

  useEffect(() => {
    // Smooth entry
    const t = setTimeout(() => setVisible(true), 40);

    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct     = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
    }, 40);

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
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    handleClose();
    if (data.link) {
      navigate(data.link);
    }
  };

  return (
    <div
      className="fixed top-20 right-6 z-[9999] pointer-events-none"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`
          pointer-events-auto
          relative w-[360px] rounded-2xl overflow-hidden
          bg-[#121320]/95 backdrop-blur-2xl
          border ${isTeamInvite ? 'border-purple-500/40' : 'border-indigo-500/40'}
          shadow-2xl shadow-purple-500/25
          transition-all duration-350 ease-out
          ${visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-4 scale-95'
          }
        `}
        style={{ transitionProperty: 'opacity, transform' }}
        role="alert"
        aria-live="assertive"
      >
        {/* Top vibrant glowing accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500" />

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3.5">
            {/* Animated Icon */}
            <div className="shrink-0 relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                {isTeamInvite ? (
                  <Users className="size-5 text-white" />
                ) : (
                  <Bell className="size-5 text-white" />
                )}
              </div>
              {/* Pulsing live dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#121320]"></span>
              </span>
            </div>

            {/* Texts */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {isTeamInvite ? 'Team Invitation' : 'Notification'}
                </p>
                <Sparkles className="size-3 text-amber-400" />
              </div>

              <h4 className="text-sm font-bold text-white leading-snug mt-0.5">
                {data.title}
              </h4>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {data.message}
              </p>

              {/* Action button */}
              {data.link && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleAction}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/25 transition-all group"
                  >
                    <span>{isTeamInvite ? 'Review & Accept' : 'View Details'}</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
