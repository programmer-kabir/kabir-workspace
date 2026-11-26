// frontend/src/components/hero/HomeHero.tsx
'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Smartphone, 
  Layers, 
  Code2, 
  Zap, 
  Shield, 
  Heart, 
  Compass, 
  Sliders, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { useIconCustomization } from '@/context/IconCustomizationContext';

interface HomeHeroProps {
  onSelectTag: (tag: string) => void;
  totalIcons: number;
}

const FEATURED_HERO_ICONS = [
  { 
    name: 'Zap', 
    icon: Zap, 
    tags: ['energy', 'fast', 'power'],
    path: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />' 
  },
  { 
    name: 'Shield', 
    icon: Shield, 
    tags: ['security', 'protect', 'safe'],
    path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />' 
  },
  { 
    name: 'Sparkles', 
    icon: Sparkles, 
    tags: ['ai', 'magic', 'clean'],
    path: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />' 
  },
  { 
    name: 'Heart', 
    icon: Heart, 
    tags: ['like', 'love', 'favorite'],
    path: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />' 
  },
  { 
    name: 'Compass', 
    icon: Compass, 
    tags: ['navigation', 'explore', 'map'],
    path: '<circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />' 
  },
  { 
    name: 'Sliders', 
    icon: Sliders, 
    tags: ['settings', 'controls', 'tuning'],
    path: '<line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="1" x2="7" y1="14" y2="14" /><line x1="9" x2="15" y1="8" y2="8" /><line x1="17" x2="23" y1="16" y2="16" />' 
  },
];

const TRENDING_TAGS = [
  { label: '🔥 Trending', query: 'trend' },
  { label: '⚡ Navigation', query: 'arrow' },
  { label: '🛡️ Security', query: 'shield' },
  { label: '🤖 AI & Cyber', query: 'cpu' },
  { label: '💳 FinTech', query: 'wallet' },
  { label: '🛍️ E-Commerce', query: 'cart' },
  { label: '📱 Mobile UI', query: 'user' },
];

export default function HomeHero({ onSelectTag, totalIcons }: HomeHeroProps) {
  const { customization } = useIconCustomization();
  const [activeIconIndex, setActiveIconIndex] = useState(0);
  const [activeStage, setActiveStage] = useState<'mockup' | 'card' | 'code'>('mockup');
  const [activeCodeTab, setActiveCodeTab] = useState<'jsx' | 'inline' | 'svg'>('jsx');
  const [copied, setCopied] = useState(false);

  const selectedHeroIcon = FEATURED_HERO_ICONS[activeIconIndex];
  const IconComponent = selectedHeroIcon.icon;

  const currentSize = customization.size || 24;
  const currentColor = customization.color || '#a855f7';
  const currentStrokeWidth = customization.strokeWidth || 2;

  // Self-contained code templates (No NPM installation required)
  const codeTemplates = {
    jsx: `// React JSX Component (Zero dependencies - Drop into any React / Next.js app)
export function ${selectedHeroIcon.name}Icon({ 
  size = ${currentSize}, 
  color = "${currentColor}", 
  strokeWidth = ${currentStrokeWidth}, 
  className = "", 
  ...props 
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      ${selectedHeroIcon.path}
    </svg>
  );
}`,
    inline: `// Inline React JSX (Paste directly inside your component)
<svg
  xmlns="http://www.w3.org/2000/svg"
  width={${currentSize}}
  height={${currentSize}}
  viewBox="0 0 24 24"
  fill="none"
  stroke="${currentColor}"
  strokeWidth={${currentStrokeWidth}}
  strokeLinecap="round"
  strokeLinejoin="round"
>
  ${selectedHeroIcon.path}
</svg>`,
    svg: `<!-- Raw Vector SVG (Universal HTML / Figma) -->
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="${currentSize}" 
  height="${currentSize}" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="${currentColor}" 
  stroke-width="${currentStrokeWidth}" 
  stroke-linecap="round" 
  stroke-linejoin="round"
>
  ${selectedHeroIcon.path}
</svg>`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeTemplates[activeCodeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedLine = (line: string) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('<!--') || line.trim().endsWith('-->')) {
      return <span className="text-slate-400 dark:text-slate-500 italic">{line}</span>;
    }

    const tokenRegex = /(export\s+function|export|function|return|const|import|\.\.\.props|\bprops\b|<\/?svg|<\/?path|<\/?circle|<\/?polygon|<\/?line|xmlns|width|height|viewBox|fill|strokeWidth|stroke-width|strokeLinecap|stroke-linecap|strokeLinejoin|stroke-linejoin|stroke|className|d=|r=|cx=|cy=|points=|x1=|x2=|y1=|y2=|"[^"]*"|'[^']*'|\{|\}|\(|\)|=|;|:|,|[0-9]+)/g;

    const parts = line.split(tokenRegex);
    return (
      <span>
        {parts.map((part, idx) => {
          if (!part) return null;
          if (['export function', 'export', 'function', 'return', 'const', 'import'].includes(part)) {
            return <span key={idx} className="text-pink-400 font-bold">{part}</span>;
          }
          if (part.includes('Icon')) {
            return <span key={idx} className="text-amber-300 font-bold">{part}</span>;
          }
          if (['<svg', '</svg>', '<path', '</path>', '<circle', '</circle>', '<polygon', '</polygon>', '<line', '</line>'].includes(part)) {
            return <span key={idx} className="text-purple-400 font-semibold">{part}</span>;
          }
          if (['xmlns', 'width', 'height', 'viewBox', 'fill', 'stroke', 'strokeWidth', 'stroke-width', 'strokeLinecap', 'stroke-linecap', 'strokeLinejoin', 'stroke-linejoin', 'className', 'size', 'color', 'd=', 'r=', 'cx=', 'cy=', 'points=', 'x1=', 'x2=', 'y1=', 'y2='].includes(part)) {
            return <span key={idx} className="text-sky-300">{part}</span>;
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={idx} className="text-emerald-300">{part}</span>;
          }
          if (['...props', 'props'].includes(part)) {
            return <span key={idx} className="text-indigo-300 italic">{part}</span>;
          }
          if (/^[0-9]+$/.test(part)) {
            return <span key={idx} className="text-amber-300">{part}</span>;
          }
          if (['{', '}', '(', ')', '=', ';', ':', ','].includes(part)) {
            return <span key={idx} className="text-slate-400">{part}</span>;
          }
          return <span key={idx} className="text-slate-200">{part}</span>;
        })}
      </span>
    );
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-8 sm:pt-10 sm:pb-12 border-b border-slate-200 dark:border-white/10 bg-gradient-to-b from-slate-50 via-purple-50/40 to-slate-100 dark:from-[#090a10] dark:via-[#0d0e17] dark:to-[#090a10] transition-colors">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className=" mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Story & Mission */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-semibold backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-purple-500 animate-pulse" />
              <span>IconBaba Studio 2.0</span>
              <span className="text-purple-900/30 dark:text-white/20">|</span>
              <span className="text-slate-700 dark:text-slate-300">{totalIcons.toLocaleString()}+ Vector Icons</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              The Modern Vector Icon Ecosystem for{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Next-Gen Interfaces
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Precision-crafted, customizable SVGs with live stroke, size, and multi-tone tuning. Built for developers, designers, and creators who need clean vector graphics and instant React &amp; Vue code.
            </p>

            {/* Quick stats & features badges */}
            <div className="grid grid-cols-3 gap-3 pt-1 max-w-md">
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                <div className="text-base font-bold text-slate-900 dark:text-white">{totalIcons.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Icons in Catalog</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                <div className="text-base font-bold text-purple-600 dark:text-purple-400">0 KB</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Zero Dependencies</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">MIT</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Free for Commercial</div>
              </div>
            </div>

            {/* Trending Quick Search Pills */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                <Flame className="size-3.5 text-amber-500 dark:text-amber-400" />
                <span>Trending Explorations:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag.query}
                    onClick={() => onSelectTag(tag.query)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 dark:bg-white/5 dark:hover:bg-white/10 text-xs text-slate-700 hover:text-purple-700 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 shadow-sm dark:shadow-none transition-all cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span>{tag.label}</span>
                    <ArrowRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-600 dark:text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Component Sandbox */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white/90 dark:bg-[#12131f]/90 border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4 transition-all">
              
              {/* Sandbox Top Bar: Icon Selector */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Live Component Stage</span>
                </div>
                
                {/* Quick Icon Selector Chips */}
                <div className="flex items-center gap-1">
                  {FEATURED_HERO_ICONS.map((item, idx) => (
                    <button
                      key={item.name}
                      onClick={() => setActiveIconIndex(idx)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        activeIconIndex === idx
                          ? 'bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-600/30 dark:border-purple-500 dark:text-purple-300 scale-105 shadow-sm'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/5 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="size-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Switcher: Mockup vs Glass Card vs Code Exporter */}
              <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <button
                  onClick={() => setActiveStage('mockup')}
                  className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeStage === 'mockup' ? 'bg-purple-600 text-white shadow-md' : 'hover:text-purple-600 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  <span>Mobile UI</span>
                </button>
                <button
                  onClick={() => setActiveStage('card')}
                  className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeStage === 'card' ? 'bg-purple-600 text-white shadow-md' : 'hover:text-purple-600 dark:hover:text-white'
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Glass Card</span>
                </button>
                <button
                  onClick={() => setActiveStage('code')}
                  className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeStage === 'code' ? 'bg-purple-600 text-white shadow-md' : 'hover:text-purple-600 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="size-3.5" />
                  <span>Code Snippet</span>
                </button>
              </div>

              {/* Live Stage Display Canvas */}
              <div className={`min-h-[240px] flex items-center justify-center rounded-2xl border relative overflow-hidden transition-all ${
                activeStage === 'code'
                  ? 'p-0 bg-[#0d1117] border-slate-800 dark:border-white/10 shadow-2xl'
                  : 'p-5 bg-slate-100/90 dark:bg-[#0a0b14] border-slate-200 dark:border-white/10'
              }`}>
                
                {/* 1. Mobile UI Mockup Stage */}
                {activeStage === 'mockup' && (
                  <div className="w-full max-w-xs space-y-4">
                    {/* Simulated App Header / Card */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-3 shadow-md">
                      <div 
                        className="size-10 rounded-xl flex items-center justify-center transition-all shadow-md shrink-0"
                        style={{ backgroundColor: `${currentColor}20`, border: `1px solid ${currentColor}40` }}
                      >
                        <IconComponent 
                          size={22} 
                          color={currentColor} 
                          strokeWidth={currentStrokeWidth} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">{selectedHeroIcon.name} Action</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Triggered in application flow</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
                        Active
                      </span>
                    </div>

                    {/* Simulated Mobile Bottom Tab Bar */}
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 flex items-center justify-around shadow-lg">
                      <div className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">
                        <Compass className="size-4" />
                        <span className="text-[9px] font-medium">Explore</span>
                      </div>
                      
                      {/* Active Center Icon Highlight */}
                      <div className="flex flex-col items-center gap-1 text-purple-600 dark:text-purple-300 scale-110 cursor-pointer">
                        <div 
                          className="size-8 rounded-full flex items-center justify-center shadow-md transition-all"
                          style={{ backgroundColor: `${currentColor}25`, border: `1.5px solid ${currentColor}` }}
                        >
                          <IconComponent 
                            size={18} 
                            color={currentColor} 
                            strokeWidth={currentStrokeWidth} 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">
                        <Heart className="size-4" />
                        <span className="text-[9px] font-medium">Saved</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Glass Card Stage */}
                {activeStage === 'card' && (
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-2xl text-center max-w-xs space-y-3.5 w-full">
                    <div 
                      className="size-16 mx-auto rounded-2xl flex items-center justify-center transition-all shadow-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30"
                      style={{ 
                        boxShadow: `0 0 25px ${currentColor}25`
                      }}
                    >
                      <IconComponent 
                        size={36} 
                        color={currentColor} 
                        strokeWidth={currentStrokeWidth} 
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedHeroIcon.name} Feature</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">High-fidelity vector integration with customizable attributes.</p>
                    </div>
                    <button 
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-600/25 cursor-pointer"
                    >
                      Interactive Action
                    </button>
                  </div>
                )}

                {/* 3. Code Exporter Stage (Sleek Dark IDE / Terminal Feel) */}
                {activeStage === 'code' && (
                  <div className="w-full rounded-2xl bg-[#0d1117] border border-slate-800 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
                    {/* IDE Header: macOS Traffic Lights + Tabs + Copy */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#161b22] border-b border-slate-800 text-xs">
                      {/* Left: Window Dots */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="size-2.5 rounded-full bg-[#ff5f56]" />
                        <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
                        <span className="size-2.5 rounded-full bg-[#27c93f]" />
                      </div>

                      {/* Middle: File Tabs */}
                      <div className="flex items-center gap-1 mx-2 overflow-x-auto no-scrollbar">
                        {[
                          { id: 'jsx', label: `${selectedHeroIcon.name}Icon.tsx` },
                          { id: 'inline', label: 'Inline.jsx' },
                          { id: 'svg', label: `${selectedHeroIcon.name.toLowerCase()}.svg` },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setActiveCodeTab(t.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                              activeCodeTab === t.id
                                ? 'bg-[#0d1117] text-purple-300 font-semibold border border-slate-700/80 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-purple-400" />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right: Copy Code Button */}
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-[10px] font-semibold transition-all shrink-0 cursor-pointer shadow-sm"
                        title="Copy code to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="size-3 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* IDE Code Editor Body with Line Numbers & Syntax Highlighting */}
                    <div className="p-3.5 font-mono text-[11px] text-slate-200 overflow-x-auto text-left leading-relaxed max-h-48 flex gap-3 bg-[#0d1117]">
                      <div className="select-none text-slate-600 text-right pr-2.5 border-r border-slate-800 font-mono text-[10px] leading-relaxed shrink-0">
                        {codeTemplates[activeCodeTab].split('\n').map((_, idx) => (
                          <div key={idx}>{idx + 1}</div>
                        ))}
                      </div>
                      <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto flex-1">
                        <code>
                          {codeTemplates[activeCodeTab].split('\n').map((line, idx) => (
                            <div key={idx} className="whitespace-pre">
                              {renderHighlightedLine(line)}
                            </div>
                          ))}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Note */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>Active Icon: <strong className="text-slate-900 dark:text-white">{selectedHeroIcon.name}</strong></span>
                <span className="font-mono text-purple-600 dark:text-purple-300 font-semibold">{currentSize}px / {currentStrokeWidth}px</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
