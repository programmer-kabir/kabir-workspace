import { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey: string;
          size: 'normal' | 'compact' | 'flexible';
          appearance: 'always' | 'execute' | 'interaction-only';
          callback: (token: string) => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? '';

export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) {
      return;
    }

    let widgetId: string | null = null;
    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return;
      // Avoid TasTracker's invalid size:"invisible" crash by using flexible + interaction-only
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        size: 'flexible',
        appearance: 'interaction-only',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onToken]);

  if (!SITE_KEY) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>Anti-Bot Protection: Turnstile + MySQL Rate Limits ready (local dev bypass)</span>
      </div>
    );
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
}
