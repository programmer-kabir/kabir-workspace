import React from 'react';
import { FiType, FiExternalLink } from 'react-icons/fi';

// Extract pure font name (e.g. "Roboto (Google Fonts)" -> "Roboto", or from URL "specimen/Roboto")
const extractFontFamilyName = (font) => {
  if (!font) return '';
  if (font.value && font.value.includes('fonts.google.com/specimen/')) {
    const match = font.value.match(/specimen\/([^/?#]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).replace(/\+/g, ' ');
    }
  }
  return (font.title || '').replace(/\s*\(.*?\)\s*/g, '').trim();
};

// Dynamically inject Google Font into <head> at runtime (Zero index.html edits needed!)
const dynamicallyLoadFont = (fontFamily) => {
  if (!fontFamily || fontFamily === 'inherit') return;
  const cleanId = `gfont-${fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(cleanId)) return;

  const link = document.createElement('link');
  link.id = cleanId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:ital,wght@0,400;0,600;0,700;1,400&display=swap`;
  document.head.appendChild(link);
};

// Resolve authentic typography preview styling per font
const getFontDetails = (font) => {
  const t = (font?.title || '').toLowerCase();
  const tag = (font?.format_tag || '').toLowerCase();
  const cleanName = extractFontFamilyName(font);

  // Auto-load font from Google Fonts dynamically if external
  if (cleanName) {
    dynamicallyLoadFont(cleanName);
  }

  if (t.includes('hind siliguri') || tag.includes('siliguri')) {
    return {
      family: "'Hind Siliguri', sans-serif",
      sample: 'সবার উপরে মানুষ সত্য, তাহার উপরে নাই • ক্রিয়েটিভ কম্পিউটার একাডেমি',
      sub: 'Modern Bengali Sans-Serif • Aa Bb Cc 1 2 3',
      weight: '600',
    };
  }
  if (t.includes('tiro bangla') || tag.includes('tiro')) {
    return {
      family: "'Tiro Bangla', serif",
      sample: 'জ্ঞানই শক্তি, দক্ষতাই ভবিষ্যৎ • অফিশিয়াল প্রশংসাপত্র ও স্মারক',
      sub: 'Formal Bengali Serif • ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ০',
      weight: '400',
    };
  }
  if (t.includes('kalpurush') || tag.includes('kalpurush')) {
    return {
      family: "'Kalpurush', 'Hind Siliguri', sans-serif",
      sample: 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি • গণপ্রজাতন্ত্রী বাংলাদেশ',
      sub: 'Classic Bengali Standard • অ আ ক খ গ ঘ ঙ',
      weight: '500',
    };
  }
  if (t.includes('montserrat')) {
    return {
      family: "'Montserrat', sans-serif",
      sample: 'CREATIVE COMPUTER ACADEMY • EXCELLENCE IN IT',
      sub: 'Bold Geometric Display • ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      weight: '800',
    };
  }
  if (t.includes('poppins')) {
    return {
      family: "'Poppins', sans-serif",
      sample: 'Empowering Next-Generation Tech Leaders & Designers',
      sub: 'Friendly Modern Geometric • 0123456789',
      weight: '600',
    };
  }
  if (t.includes('inter')) {
    return {
      family: "'Inter', sans-serif",
      sample: 'The quick brown fox jumps over the lazy dog • Clean UI Architecture',
      sub: 'Standard Interface Typography • Regular & Medium',
      weight: '500',
    };
  }
  if (t.includes('roboto')) {
    return {
      family: "'Roboto', sans-serif",
      sample: 'The quick brown fox jumps over the lazy dog • Google Android Standard',
      sub: 'Modern Grotesque Sans-Serif • Aa Bb 1 2 3',
      weight: '500',
    };
  }
  return {
    family: cleanName ? `'${cleanName}', sans-serif` : 'inherit',
    sample: 'The quick brown fox jumps over the lazy dog • Creativity is intelligence',
    sub: `${cleanName || 'Custom'} Typography • Aa Bb 1 2 3`,
    weight: '500',
  };
};

const BrandFontsSection = ({ filteredFonts }) => {
  if (!filteredFonts || filteredFonts.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <span className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <FiType size={15} />
        </span>
        <span>Typography & Fonts Library</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFonts.map((font) => {
          const fontDetails = getFontDetails(font);
          return (
            <div
              key={font.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                    {font.title}
                  </h4>
                  {font.format_tag && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {font.format_tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{font.subtitle}</p>
              </div>

              {/* Live Typography Preview in its real font */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 space-y-2 overflow-hidden transition-all group-hover:border-amber-400/40">
                <p
                  className="text-base text-slate-800 dark:text-slate-100 leading-relaxed"
                  style={{ fontFamily: fontDetails.family, fontWeight: fontDetails.weight }}
                >
                  "{fontDetails.sample}"
                </p>
                <p
                  className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wide"
                  style={{ fontFamily: fontDetails.family }}
                >
                  {fontDetails.sub}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {font.value?.startsWith('http') ? 'Google / Web Font' : 'Local Resource'}
                </span>
                <a
                  href={font.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <span>Get Font</span>
                  <FiExternalLink size={13} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandFontsSection;

