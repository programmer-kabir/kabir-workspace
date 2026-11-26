interface LegalPageProps {
  kind: 'contact' | 'privacy' | 'terms';
}

const LEGAL_COPY: Record<LegalPageProps['kind'], { title: string; body: string[] }> = {
  contact: {
    title: 'Contact StockAssetTrack',
    body: [
      'StockAssetTrack provides market research, keyword analytics, and workflow tooling for microstock contributors and digital creators.',
      'For product support, partnership inquiries, or Adobe Affiliate compliance verification, reach us at support@stockassettrack.com.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'StockAssetTrack stores only essential account, preference, and saved watchlist data needed to deliver your dashboard experience.',
      'Uploaded visual search images are processed transiently for similarity matching and are never resold or shared with third-party advertisers.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      'All analytics scores, monthly download estimates, and opportunity indicators are informational guides and do not guarantee marketplace revenue.',
      'Accounts are bound by plan-specific daily quotas and active device slot limits to ensure platform reliability for all contributors.',
    ],
  },
};

export function LegalPage({ kind }: LegalPageProps) {
  const { title, body } = LEGAL_COPY[kind];

  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
