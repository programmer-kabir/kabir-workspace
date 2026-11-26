// frontend/src/components/footer/SiteFooter.tsx
import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Mail, ShieldCheck } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0b10] text-slate-600 dark:text-slate-400 transition-colors">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Description (2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src="/icon.png"
                alt="IconBaba Logo"
                className="size-8 sm:size-8.5 object-contain filter drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]"
              />
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
                Icon<span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent ml-0.5">Baba</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 ml-1">
                5,000+
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Precision-crafted vector icon library for modern designers and developers. Explore 5,000+ customizable icons across 42 categories in Outlined and Filled styles.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors shadow-xs"
                aria-label="IconBaba on GitHub"
              >
                <Github className="size-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors shadow-xs"
                aria-label="IconBaba on Twitter"
              >
                <Twitter className="size-4" />
              </a>
              <Link
                to="/contact"
                className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors shadow-xs"
                aria-label="Contact IconBaba"
              >
                <Mail className="size-4" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Product
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link to="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Licenses Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Licenses
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link to="/licenses" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Licenses
                </Link>
              </li>
              <li>
                <Link to="/licenses/free" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Free License
                </Link>
              </li>
              <li>
                <Link to="/licenses/pro" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Pro License
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Legal
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} IconBaba. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <ShieldCheck className="size-3.5 text-purple-600 dark:text-purple-400" />
              Verified & Secure
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 font-medium transition-colors">
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
