import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import useSiteSettings from "../utlis/Hooks/useSiteSettings";

const Footer = () => {
  const { data: settings = {} } = useSiteSettings();
  
  const socialLinks = settings?.social_links || {
    facebook: "#",
    instagram: "#",
    linkedin: "#",
    x: "#",
    youtube: "#"
  };

  return (
    <footer className="relative overflow-hidden bg-white dark:bg-[#050505] text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/5 pt-12 transition-colors duration-300">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/10 dark:via-[#00D4FF]/30 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00D4FF]/5 dark:bg-[#00D4FF]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Footer */}
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8 py-16 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 md:grid-cols-4 lg:gap-16">
          {/* Our Network */}
          <div>
            <h3 className="mb-6 font-outfit text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
              Our Network
            </h3>

            <ul className="space-y-4 font-inter text-sm sm:text-base text-gray-600 dark:text-gray-400">
              <li><Link to="/" className="hover:text-[#00D4FF] transition-colors">Dayal Stock</Link></li>
              <li><Link to="/join-pro" className="hover:text-[#00D4FF] transition-colors flex items-center gap-2">Premium Assets <span className="text-[10px] uppercase font-bold bg-[#8B5CF6]/20 text-[#8B5CF6] px-1.5 py-0.5 rounded-sm">Pro</span></Link></li>
            </ul>
          </div>

          {/* Site Links */}
          <div>
            <h3 className="mb-6 font-outfit text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
              Site Links
            </h3>

            <ul className="space-y-4 font-inter text-sm sm:text-base text-gray-600 dark:text-gray-400">
              <li><Link to="/licensing" className="hover:text-[#00D4FF] transition-colors">Licensing Agreement</Link></li>
              <li><Link to="/dmca" className="hover:text-[#00D4FF] transition-colors">DMCA</Link></li>
            </ul>
          </div>

          {/* Learn More */}
          <div>
            <h3 className="mb-6 font-outfit text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
              Learn More
            </h3>

            <ul className="space-y-4 font-inter text-sm sm:text-base text-gray-600 dark:text-gray-400">
              <li><Link to="/faqs" className="hover:text-[#00D4FF] transition-colors">FAQs</Link></li>
              <li><Link to="/contact-us" className="hover:text-[#00D4FF] transition-colors">Contact Us</Link></li>
              <li><Link to="/about-us" className="hover:text-[#00D4FF] transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Languages & Subscribe */}
          <div>
            <h3 className="mb-6 font-outfit text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
              Languages
            </h3>
            <div className="flex flex-wrap gap-2 mb-8">
              <button className="px-3 py-1.5 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm hover:border-[#00D4FF]/50 transition-colors shadow-sm">English</button>
              <button className="px-3 py-1.5 rounded border border-transparent text-gray-500 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Bengali</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-200 dark:border-white/5 relative z-10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-8 px-6 lg:px-8 py-8 lg:flex-row">
          {/* Logo & Social */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              {settings?.site_logo ? (
                <img src={`https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/${settings.site_logo}`} alt="Logo" className="h-[30px]" />
              ) : (
                <span className="text-xl font-outfit font-bold tracking-tight">DayalStock</span>
              )}
            </div>

            <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-white/10"></div>

            <div className="flex items-center gap-5 text-gray-500 dark:text-gray-400">
              {socialLinks?.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer"><FaFacebookF size={18} className="hover:text-white transition-colors hover:scale-110 transform" /></a>}
              {socialLinks?.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer"><FaInstagram size={18} className="hover:text-white transition-colors hover:scale-110 transform" /></a>}
              {socialLinks?.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer"><FaLinkedinIn size={18} className="hover:text-white transition-colors hover:scale-110 transform" /></a>}
              {socialLinks?.x && <a href={socialLinks.x} target="_blank" rel="noreferrer"><FaXTwitter size={18} className="hover:text-white transition-colors hover:scale-110 transform" /></a>}
              {socialLinks?.youtube && <a href={socialLinks.youtube} target="_blank" rel="noreferrer"><FaYoutube size={18} className="hover:text-white transition-colors hover:scale-110 transform" /></a>}
            </div>
          </div>

          {/* Copyright & Links */}
          <div className="text-center text-sm font-inter text-gray-600 dark:text-gray-500 lg:text-right flex flex-col sm:block">
            <span>{settings?.footer_copyright || "© 2026 DayalStock. All rights reserved."}</span>
            <span className="hidden sm:inline mx-2 text-gray-400 dark:text-gray-700">|</span>
            <div className="mt-3 sm:mt-0 sm:inline">
              <Link to="/terms-of-use" className="mx-2 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
              <span className="text-gray-400 dark:text-gray-700">|</span>
              <Link to="/privacy-policy" className="mx-2 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
              <span className="text-gray-400 dark:text-gray-700">|</span>
              <Link to="/refund-policy" className="mx-2 hover:text-gray-900 dark:hover:text-white transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
