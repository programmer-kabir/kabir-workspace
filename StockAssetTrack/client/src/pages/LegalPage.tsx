import { Link } from 'react-router-dom';

interface LegalPageProps {
  kind: 'contact' | 'privacy' | 'terms' | 'disclosure';
}

const LEGAL_COPY: Record<
  LegalPageProps['kind'],
  { title: string; subtitle: string; sections: { heading: string; text: string }[] }
> = {
  contact: {
    title: 'Contact & Support',
    subtitle: 'We are here to help with questions regarding StockAssetTrack analytics, billing, or affiliate compliance.',
    sections: [
      {
        heading: 'Product Support & Inquiries',
        text: 'For customer service, bug reports, and account questions, please reach our technical operations team at support@stockassettrack.com. We respond to inquiries within 24 to 48 business hours.',
      },
      {
        heading: 'Affiliate & Compliance Verification',
        text: 'For Adobe Stock Affiliate compliance inquiries, Partnerize partner audits, or API data queries, please email compliance@stockassettrack.com.',
      },
      {
        heading: 'Platform Operations',
        text: 'StockAssetTrack is operated as an independent software-as-a-service provider serving digital creators, commercial stock photographers, vector artists, and AI creators worldwide.',
      },
    ],
  },
  disclosure: {
    title: 'Affiliate & Trademark Disclosure',
    subtitle: 'Full legal transparency regarding our relationship with Adobe Stock and outbound referral links.',
    sections: [
      {
        heading: 'Non-Affiliation Trademark Notice',
        text: 'StockAssetTrack is an independent market analytics platform. StockAssetTrack is not affiliated with, sponsored by, authorized by, or endorsed by Adobe Inc. Adobe, the Adobe logo, Adobe Stock, and Creative Cloud are registered trademarks or trademarks of Adobe Inc. in the United States and/or other countries.',
      },
      {
        heading: 'FTC & Partnerize Affiliate Disclosure',
        text: 'Certain links on StockAssetTrack are affiliate links. If you click an outbound link to Adobe Stock or partner services and subscribe or license digital assets, StockAssetTrack may earn an affiliate referral commission via authorized affiliate networks (such as Partnerize). This occurs at zero additional cost to you and supports ongoing platform research and maintenance.',
      },
      {
        heading: 'Data Accuracy & Editorial Independence',
        text: 'All opportunity scores, velocity metrics (~D/M), and category saturation ratings are generated algorithmically and independently. We do not accept payment to artificially elevate creator rankings, search positions, or asset visibility.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we protect your personal, account, and analytical data.',
    sections: [
      {
        heading: 'Information We Collect',
        text: 'We collect only essential data needed to deliver your dashboard: your email address, hashed password, selected plan tier, and active device identifiers to enforce device-slot security (1/1/3/5 slots). We do not collect or store unhashed payment card numbers.',
      },
      {
        heading: 'Visual Search Images',
        text: 'Images uploaded to the Visual Similar or Image Match feature are processed transiently in memory to extract visual similarity embeddings. Uploaded reference images are never published, shared with third parties, or used for model training.',
      },
      {
        heading: 'Cookies & Analytics',
        text: 'We use strictly necessary session cookies and local storage tokens to maintain authenticated state, dark/light theme preferences, and your saved creator watchlists. We do not use invasive third-party cross-site advertising trackers.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Terms governing your use of StockAssetTrack intelligence tools and subscriptions.',
    sections: [
      {
        heading: 'Service Scope & Informational Purpose',
        text: 'StockAssetTrack provides market research, trend analytics, and metadata organization tools. Market demand indicators, download velocities, and keyword rankings are algorithmic estimates intended for research and do not constitute financial advice or revenue guarantees.',
      },
      {
        heading: 'Usage Quotas & Fair-Use Policy',
        text: 'Accounts are bound by tier-specific daily search quotas and concurrent active device slots. Automated scraping, abuse, or sharing account credentials across unauthorized parties is strictly prohibited and subject to account suspension.',
      },
      {
        heading: 'Billing, Cancellation & 14-Day Refund Window',
        text: 'Subscriptions renew automatically per selected billing cycle (monthly or yearly). You may cancel your subscription at any time via your Dashboard. We offer a 14-day refund window on initial subscription payments upon contacting support@stockassettrack.com.',
      },
      {
        heading: 'Intellectual Property & Trademarks',
        text: 'StockAssetTrack software, algorithms, and interface designs are proprietary. Third-party trademarks, including Adobe Stock, remain the sole property of their respective owners.',
      },
    ],
  },
};

export function LegalPage({ kind }: LegalPageProps) {
  const { title, subtitle, sections } = LEGAL_COPY[kind];

  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-12">
        <div className="border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-indigo dark:text-indigo-300">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="uppercase text-slate-500">{kind}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {sections.map(({ heading, text }) => (
            <div key={heading} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800/60 dark:bg-slate-950/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {heading}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200/80 pt-6 text-xs text-slate-500 dark:border-slate-800/80">
          <p>
            Questions regarding our compliance or data protection policies? Contact{' '}
            <a href="mailto:support@stockassettrack.com" className="font-semibold text-brand-indigo underline">
              support@stockassettrack.com
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
}
