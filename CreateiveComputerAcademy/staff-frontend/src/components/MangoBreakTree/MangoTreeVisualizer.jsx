import React from 'react';
import { formatHoursToHuman } from './treeUtils';
import { soundFx } from '../../utils/soundFx';

/**
 * MangoTreeVisualizer
 * Sculpted SVG Mango Tree with swaying ripe mangoes, growing raw mango,
 * animated interactive boy character, and rustic harvest wicker basket.
 */
export default function MangoTreeVisualizer({
  summary,
  ripeCount,
  extraBasketMangoesCount,
  allRipeMangoes = [],
  treeMangoes = [],
  growingMango,
  safeTreePositions = [],
  shiftHours = 8,
  boyBouncing,
  handleBoyClick,
  handleMangoClick,
  setSelectedMango,
  setIsClaimModalOpen,
  setSelectedMonth,
  fetchTreeData,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 md:p-8 relative overflow-hidden">
      {/* Orchard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Interactive Mango Orchard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700/60">
              Live Interactive Tree
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Click on any ripe mango 🥭 hanging on the tree to inspect details, see which days earned it, and book your break day!
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-800/80 p-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="text-base">🥭</span>
            <span>
              Ripe ({ripeCount})
              {extraBasketMangoesCount > 0 && (
                <span className="ml-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  (গাছে ৪টি • ঝুড়িতে {extraBasketMangoesCount}টি)
                </span>
              )}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="text-base">🍏</span>
            <span>Growing ({growingMango ? '1' : '0'})</span>
          </div>
          {!summary?.is_all_time && (summary?.all_time_ripe_mangoes_count || 0) > 0 && (
            <>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth('all');
                  fetchTreeData('all');
                }}
                title="Click to view all cumulative ripe mangoes across all time"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer text-[11px] font-bold border border-indigo-200 dark:border-indigo-800/60"
              >
                <span>🌐 All-Time Bank: {summary?.all_time_ripe_mangoes_count} Ripe 🥭</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tree Container Canvas */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[620px] min-h-[420px] bg-gradient-to-b from-sky-100/80 via-emerald-50/50 to-amber-50/70 dark:from-slate-950 dark:via-emerald-950/25 dark:to-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex items-center justify-center select-none shadow-inner">
        {/* Embedded Custom Keyframe Animations */}
        <style>{`
          @keyframes mangoSway {
            0%, 100% { transform: rotate(-3.5deg); }
            50% { transform: rotate(3.5deg); }
          }
          @keyframes foliageDrift {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.008) rotate(0.4deg); }
          }
          @keyframes sunRayGleam {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.35; }
          }
          @keyframes basketGlow {
            0%, 100% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25); }
            50% { box-shadow: 0 8px 30px rgba(245, 158, 11, 0.45); }
          }
          @keyframes boyIdleBreath {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          @keyframes boyThoughtFloat {
            0%, 100% { transform: translateY(0px); opacity: 0.95; }
            50% { transform: translateY(-5px); opacity: 1; }
          }
          @keyframes boyJumpAction {
            0% { transform: translateY(0) scale(1, 1); }
            20% { transform: translateY(5px) scale(1.06, 0.94); }
            50% { transform: translateY(-28px) scale(0.95, 1.06); }
            75% { transform: translateY(-8px) scale(1.02, 0.98); }
            100% { transform: translateY(0) scale(1, 1); }
          }
          .boy-idle {
            animation: boyIdleBreath 3.2s ease-in-out infinite;
          }
          .boy-jumping {
            animation: boyJumpAction 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>

        {/* Sky Ambient Light & Sunlight Beams */}
        <div className="absolute top-4 left-8 w-40 h-40 bg-amber-300/30 dark:bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-8 right-16 w-52 h-52 bg-emerald-400/25 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 left-1/4 w-72 h-36 bg-yellow-200/20 dark:bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Realistic Sculpted Mango Tree SVG */}
        <svg
          viewBox="0 0 1000 680"
          className="w-full h-full object-contain pointer-events-none drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sun Flare Gradient */}
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Realistic Bark & Wood Gradients */}
            <linearGradient id="trunkMainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d1d06" />
              <stop offset="25%" stopColor="#5c2e0b" />
              <stop offset="55%" stopColor="#783a0e" />
              <stop offset="80%" stopColor="#542607" />
              <stop offset="100%" stopColor="#2e1302" />
            </linearGradient>

            <linearGradient id="barkHighlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9a3412" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#78350f" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#451a03" stopOpacity="1" />
            </linearGradient>

            {/* Foliage Layer 1: Deep Core Foliage (Shadows & Depth) */}
            <radialGradient id="deepFoliage" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="55%" stopColor="#14532d" />
              <stop offset="85%" stopColor="#052e16" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>

            {/* Foliage Layer 2: Mid-Canopy Lush Mango Leaves */}
            <radialGradient id="midFoliage" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="40%" stopColor="#22c55e" />
              <stop offset="75%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>

            {/* Foliage Layer 3: Sun-drenched Canopy Highlights */}
            <radialGradient id="sunlitFoliage" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="35%" stopColor="#86efac" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </radialGradient>

            {/* Crown Sun-Kissed Crest */}
            <radialGradient id="crownFoliage" cx="50%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#dcfce7" />
              <stop offset="40%" stopColor="#4ade80" />
              <stop offset="80%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>

            {/* Rolling Grassy Hills Gradients */}
            <linearGradient id="hillForeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="45%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>

            <linearGradient id="hillBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0.9" />
            </linearGradient>

            {/* Soft Drop Shadow Filter for Leaves */}
            <filter id="foliageShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#064e3b" floodOpacity="0.35" />
            </filter>

            {/* Boy Character Design Gradients */}
            <linearGradient id="boySkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="100%" stopColor="#fed7aa" />
            </linearGradient>

            <linearGradient id="boyHairGrad" x1="0%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="60%" stopColor="#271103" />
              <stop offset="100%" stopColor="#0f0501" />
            </linearGradient>

            <linearGradient id="boyShirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="45%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>

            <linearGradient id="boyShortsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="boySneakerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            <linearGradient id="boyBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
          </defs>

          {/* Sun in upper corner with radiant sunbeams */}
          <circle cx="110" cy="80" r="70" fill="url(#sunGlow)" />
          <polygon points="110,80 320,320 230,360" fill="#fef08a" opacity="0.07" style={{ animation: 'sunRayGleam 6s ease-in-out infinite' }} />
          <polygon points="110,80 520,380 430,420" fill="#fef08a" opacity="0.05" style={{ animation: 'sunRayGleam 7s ease-in-out infinite' }} />
          <polygon points="110,80 680,280 600,320" fill="#fef08a" opacity="0.04" style={{ animation: 'sunRayGleam 8s ease-in-out infinite' }} />

          {/* Background Hill */}
          <path
            d="M-50,640 Q240,580 500,600 T1050,620 L1050,680 L-50,680 Z"
            fill="url(#hillBackGrad)"
          />

          {/* Foreground Grassy Lawn & Orchard Ground Mound */}
          <path
            d="M-50,670 Q280,575 500,580 T1050,605 L1050,680 L-50,680 Z"
            fill="url(#hillForeGrad)"
          />
          {/* Tree Base Root Mound Soil Shadow */}
          <ellipse cx="500" cy="635" rx="220" ry="25" fill="#0f391b" opacity="0.45" />

          {/* Dotted Orchard Lawn Flowers (Buttercups & Wild Flora) */}
          <circle cx="160" cy="625" r="3.5" fill="#fde047" />
          <circle cx="168" cy="628" r="2.5" fill="#ffffff" />
          <circle cx="270" cy="610" r="3" fill="#fde047" />
          <circle cx="360" cy="622" r="3" fill="#ffffff" />
          <circle cx="680" cy="615" r="3.5" fill="#fde047" />
          <circle cx="750" cy="628" r="3" fill="#fbcfe8" />
          <circle cx="860" cy="625" r="3.5" fill="#fde047" />

          {/* Fallen Golden Mango Leaves on the Meadow */}
          <path d="M320,626 Q332,621 342,627 Q332,631 320,626 Z" fill="#ca8a04" opacity="0.85" />
          <path d="M640,628 Q654,624 664,630 Q652,634 640,628 Z" fill="#ca8a04" opacity="0.85" />
          <path d="M410,634 Q422,630 432,635 Q420,638 410,634 Z" fill="#15803d" opacity="0.75" />

          {/* 1. DEEP BACKGROUND FOLIAGE CANOPY */}
          <g filter="url(#foliageShadow)">
            <path
              d="M120,330 C70,270 90,190 160,150 C210,100 300,90 370,130 C420,70 530,60 610,100 C670,70 770,90 820,150 C890,180 920,260 880,330 C840,400 740,410 660,390 C580,420 420,420 340,390 C260,420 160,400 120,330 Z"
              fill="url(#deepFoliage)"
            />
          </g>

          {/* 2. CONTINUOUS SCULPTED TREE TRUNK & BRANCH SKELETON */}
          <g id="treeWoodWork">
            <path
              d="M 370,640 
                 C 410,605 440,555 450,485 
                 C 445,430 420,390 350,350 
                 C 290,320 220,300 150,290 
                 C 210,310 280,335 340,370 
                 C 385,398 410,430 425,470
                 C 400,380 370,300 330,220 
                 C 355,230 380,270 410,330 
                 C 435,380 445,420 455,470
                 C 465,410 475,340 485,260 
                 C 490,200 495,160 500,140 
                 C 505,160 510,200 515,260 
                 C 525,340 535,410 545,470
                 C 555,420 565,380 590,330 
                 C 620,270 645,230 670,220 
                 C 630,300 600,380 575,470
                 C 590,430 615,398 660,370 
                 C 720,335 790,310 850,290 
                 C 780,300 710,320 650,350 
                 C 580,390 555,430 550,485 
                 C 560,555 590,605 630,640 
                 C 560,645 440,645 370,640 Z"
              fill="url(#trunkMainGrad)"
            />

            {/* Bark Grain Striations */}
            <path d="M410,635 C435,600 450,560 455,500" stroke="#1c0b02" strokeWidth="4.5" strokeLinecap="round" opacity="0.65" fill="none" />
            <path d="M590,635 C565,600 550,560 545,500" stroke="#1c0b02" strokeWidth="4.5" strokeLinecap="round" opacity="0.65" fill="none" />
            <path d="M500,640 C500,580 502,520 498,460" stroke="#1c0b02" strokeWidth="5.5" strokeLinecap="round" opacity="0.6" fill="none" />

            <path d="M475,540 C470,490 460,440 435,395" stroke="#78350f" strokeWidth="3.5" opacity="0.75" fill="none" />
            <path d="M525,540 C530,490 540,440 565,395" stroke="#2e1302" strokeWidth="3.5" opacity="0.65" fill="none" />
            <path d="M490,460 C485,390 470,320 440,260" stroke="#9a3412" strokeWidth="2.5" opacity="0.75" fill="none" />
            <path d="M510,460 C515,390 530,320 560,260" stroke="#451a03" strokeWidth="3" opacity="0.65" fill="none" />

            {/* Secondary Wood Twigs Weaving Towards Mango Zones */}
            <path d="M340,370 C290,340 240,320 180,310 C210,325 260,350 310,375" stroke="#5c2e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M250,330 C220,300 180,270 140,250 C170,270 210,295 240,325" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M660,370 C710,340 760,320 820,310 C790,325 740,350 690,375" stroke="#5c2e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M750,330 C780,300 820,270 860,250 C830,270 790,295 760,325" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M485,260 C460,220 420,180 370,160 C410,180 445,215 475,250" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M515,260 C540,220 580,180 630,160 C590,180 555,215 525,250" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>

          {/* 3. MID & FOREGROUND FOLIAGE CLUSTERS */}
          <g id="lushCanopy" style={{ animation: 'foliageDrift 9s ease-in-out infinite' }}>
            <path
              d="M130,320 C90,290 100,230 140,200 C120,160 160,110 210,120 C250,80 310,90 340,130 C380,100 430,120 450,160 C470,200 450,250 410,270 C430,310 390,360 330,360 C270,370 220,360 180,340 C150,350 135,335 130,320 Z"
              fill="url(#midFoliage)"
              opacity="0.94"
            />
            <path
              d="M870,320 C910,290 900,230 860,200 C880,160 840,110 790,120 C750,80 690,90 660,130 C620,100 570,120 550,160 C530,200 550,250 590,270 C570,310 610,360 670,360 C730,370 780,360 820,340 C850,350 865,335 870,320 Z"
              fill="url(#midFoliage)"
              opacity="0.94"
            />
            <path
              d="M310,250 C280,200 310,140 360,120 C400,80 470,75 510,110 C560,70 630,85 660,130 C700,160 700,220 660,260 C680,310 630,360 570,355 C510,370 460,360 410,350 C360,360 320,310 310,250 Z"
              fill="url(#midFoliage)"
              opacity="0.96"
            />
            <path
              d="M210,210 C190,170 220,120 270,130 C310,100 360,110 380,150 C410,130 450,150 460,190 C440,230 390,250 350,240 C310,260 250,250 210,210 Z"
              fill="url(#sunlitFoliage)"
              opacity="0.92"
            />
            <path
              d="M590,210 C570,160 620,120 670,130 C710,100 760,115 780,155 C810,140 840,170 840,210 C820,240 770,255 730,240 C690,260 630,250 590,210 Z"
              fill="url(#sunlitFoliage)"
              opacity="0.9"
            />
            <path
              d="M370,130 C350,80 400,30 460,25 C520,20 570,50 590,95 C620,85 650,115 640,150 C610,185 550,190 510,180 C460,195 410,180 370,130 Z"
              fill="url(#crownFoliage)"
              opacity="0.95"
            />
            <path d="M130,250 C105,245 95,260 85,265 C100,275 118,270 132,262 Z" fill="#22c55e" />
            <path d="M200,130 C180,105 168,112 158,115 C170,132 185,135 202,132 Z" fill="#4ade80" />
            <path d="M430,30 C425,8 440,2 450,0 C458,18 452,30 435,35 Z" fill="#86efac" />
            <path d="M540,28 C550,8 568,2 578,0 C578,20 568,30 545,35 Z" fill="#86efac" />
            <path d="M860,250 C885,245 895,260 905,265 C890,275 872,270 858,262 Z" fill="#22c55e" />
            <path d="M790,130 C810,105 822,112 832,115 C820,132 805,135 788,132 Z" fill="#4ade80" />
          </g>

          {/* CUTE BOY CHARACTER LOOKING UP AT MANGOES (INTERACTIVE) */}
          <g
            id="eagerBoyIllustration"
            onClick={handleBoyClick}
            className={`select-none cursor-pointer group/boy ${boyBouncing ? 'boy-jumping' : 'boy-idle'}`}
            style={{
              pointerEvents: 'auto',
              transformOrigin: '325px 614px',
            }}
          >
            <title>আমের দিকে চেয়ে থাকা খোকা (ক্লিক করুন!)</title>

            <ellipse cx="325" cy="614" rx="36" ry="7" fill="#04230c" opacity="0.45" />

            {/* Left Sneaker */}
            <rect x="298" y="610" width="22" height="4" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
            <path d="M299,610 C298,604 306,601 313,605 C319,608 319,610 320,610 Z" fill="url(#boySneakerGrad)" />
            <path d="M316,610 C317,607 319,607 320,610 Z" fill="#ffffff" />
            <path d="M305,606 L311,608 M304,608 L310,610" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

            {/* Right Sneaker */}
            <rect x="330" y="612" width="24" height="4" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
            <path d="M331,612 C330,605 340,602 348,607 C354,610 354,612 354,612 Z" fill="url(#boySneakerGrad)" />
            <path d="M349,612 C350,608 353,608 354,612 Z" fill="#ffffff" />
            <path d="M337,607 L343,609 M336,609 L342,611" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

            {/* Socks */}
            <rect x="303" y="598" width="11" height="8" rx="2" fill="#ffffff" />
            <line x1="303" y1="601" x2="314" y2="601" stroke="#3b82f6" strokeWidth="1" />
            <rect x="334" y="600" width="11" height="8" rx="2" fill="#ffffff" />
            <line x1="334" y1="603" x2="345" y2="603" stroke="#3b82f6" strokeWidth="1" />

            {/* Legs */}
            <rect x="304" y="568" width="10" height="32" rx="5" fill="url(#boySkinGrad)" />
            <rect x="335" y="568" width="10" height="34" rx="5" fill="url(#boySkinGrad)" />
            <path d="M306,585 Q309,587 312,585" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none" />
            <path d="M337,586 Q340,588 343,586" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none" />

            {/* Denim Shorts */}
            <path d="M298,536 C298,535 348,535 348,536 L348,570 C348,573 328,573 328,570 L323,552 L318,570 C318,573 298,573 298,570 Z" fill="url(#boyShortsGrad)" />
            <rect x="297" y="567" width="21" height="4.5" rx="1.5" fill="#2563eb" opacity="0.6" />
            <rect x="328" y="567" width="21" height="4.5" rx="1.5" fill="#2563eb" opacity="0.6" />
            <path d="M302,544 Q310,556 314,562" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2,2" fill="none" opacity="0.8" />
            <path d="M344,544 Q336,556 332,562" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2,2" fill="none" opacity="0.8" />
            <rect x="297" y="535" width="52" height="4.5" rx="1" fill="#334155" />
            <rect x="320" y="534" width="7" height="6.5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />

            {/* Torso & Mango T-Shirt */}
            <path d="M301,482 C312,479 336,479 347,482 L349,537 C349,538 299,538 299,537 Z" fill="url(#boyShirtGrad)" />
            <path d="M315,480 Q324,487 333,480" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="328" cy="504" rx="5" ry="6.5" fill="#fde047" transform="rotate(-15 328 504)" />
            <path d="M328,498 Q331,496 333,498" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" fill="none" />

            {/* Left Arm */}
            <path d="M301,482 C293,487 290,496 290,503 L298,505 C299,499 301,490 304,485 Z" fill="url(#boyShirtGrad)" />
            <path d="M293,503 C291,514 292,525 295,534 C299,534 302,532 299,522 C297,515 296,507 297,504 Z" fill="url(#boySkinGrad)" />
            <circle cx="296" cy="535" r="4.5" fill="url(#boySkinGrad)" />

            {/* Right Arm pointing up */}
            <path d="M344,482 C350,483 356,488 358,495 L351,497 C349,492 346,486 343,484 Z" fill="url(#boyShirtGrad)" />
            <path d="M352,488 C360,474 368,456 376,438 C381,440 383,444 378,450 C371,465 364,481 356,494 Z" fill="url(#boySkinGrad)" />
            <circle cx="377" cy="439" r="4.5" fill="url(#boySkinGrad)" />
            <path d="M376,438 Q384,428 388,422" stroke="url(#boySkinGrad)" strokeWidth="3.6" strokeLinecap="round" fill="none" />

            {/* Neck */}
            <rect x="319" y="470" width="9" height="14" rx="3" fill="url(#boySkinGrad)" transform="rotate(7 323 477)" />

            {/* Head tilted upwards */}
            <g transform="rotate(-15 324 452)">
              <ellipse cx="323" cy="442" rx="18" ry="19" fill="#1f0e04" />
              <path d="M309,448 C306,444 308,440 311,441 L313,450 C310,450 308,449 309,448 Z" fill="url(#boySkinGrad)" />
              <path d="M312,450 C310,436 322,427 335,429 C348,431 355,442 353,454 C351,466 337,472 325,468 C316,465 312,458 312,450 Z" fill="url(#boySkinGrad)" />
              <ellipse cx="320" cy="453" rx="4.5" ry="3" fill="#f87171" opacity="0.55" />
              <ellipse cx="343" cy="455" rx="4.5" ry="3" fill="#f87171" opacity="0.55" />

              <ellipse cx="323" cy="445" rx="5" ry="6.5" fill="#0f172a" />
              <circle cx="325" cy="443" r="2.2" fill="#ffffff" />
              <circle cx="322" cy="447" r="1.1" fill="#ffffff" />
              <path d="M318,446 Q323,439 328,445" stroke="#020617" strokeWidth="1.2" fill="none" />

              <ellipse cx="339" cy="446" rx="5" ry="6.5" fill="#0f172a" />
              <circle cx="341" cy="444" r="2.2" fill="#ffffff" />
              <circle cx="338" cy="448" r="1.1" fill="#ffffff" />
              <path d="M334,447 Q339,440 344,446" stroke="#020617" strokeWidth="1.2" fill="none" />

              <path d="M317,437 Q323,432 329,436" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M334,437 Q340,432 346,437" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              <path d="M331,448 Q333,450 330,451" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M326,456 Q333,465 340,456 Q333,460 326,456 Z" fill="#881337" stroke="#4c0519" strokeWidth="0.8" />
              <path d="M328,456 Q333,459 338,456" fill="#ffffff" />
              <path d="M329,461 Q333,458 337,461" fill="#fb7185" />

              <path d="M310,440 C308,426 316,415 328,414 C342,412 355,420 357,432 C359,440 354,444 350,442 C346,434 338,426 328,427 C322,428 316,434 315,441 C314,440 312,442 310,440 Z" fill="url(#boyHairGrad)" />
              <path d="M324,417 Q330,409 337,416 Q345,411 349,420 Q358,417 356,428" stroke="#5c2e0b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>

            {/* Thought Bubble Floating Above Boy */}
            <circle cx="352" cy="402" r="3.5" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.12))" />
            <circle cx="360" cy="388" r="5" fill="#ffffff" opacity="0.95" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.12))" />

            <g style={{ animation: 'boyThoughtFloat 3.5s ease-in-out infinite' }}>
              <rect
                x="328"
                y="335"
                width="172"
                height="44"
                rx="22"
                fill="url(#boyBubbleGrad)"
                stroke="#f59e0b"
                strokeWidth="1.6"
                filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
              />
              <text x="344" y="362" fontSize="16">🤤</text>
              <text x="368" y="354" fontSize="11" fontWeight="800" fill="#92400e" fontFamily="sans-serif">
                {extraBasketMangoesCount > 0 ? `ঝুড়িতে +${extraBasketMangoesCount}টি আম জমা!` : 'কখন পড়বে আমটা!'}
              </text>
              <text x="368" y="368" fontSize="9.5" fontWeight="700" fill="#b45309" fontFamily="sans-serif">
                {extraBasketMangoesCount > 0 ? `গাছে ৪টি • ঝুড়িতে ${extraBasketMangoesCount}টি 🧺` : 'পাকা আম দেখছে খোকা 🥭'}
              </text>
            </g>
          </g>
        </svg>

        {/* 4. INTERACTIVE RIPE MANGOES ANCHORED ON TREE BRANCHES */}
        {treeMangoes.map((mango, idx) => {
          const swayDelay = ((idx * 0.45) % 2.5).toFixed(2);
          const swayDuration = (3.2 + (idx % 3) * 0.5).toFixed(2);
          const pos = safeTreePositions[idx % safeTreePositions.length];
          return (
            <div
              key={mango.id || idx}
              onClick={() => handleMangoClick(mango)}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group select-none"
              title={`Click to inspect: ${mango.title} (+${formatHoursToHuman(mango.hours)} Break)`}
            >
              <div className="relative flex flex-col items-center">
                {/* Branch Node Passing Above */}
                <svg
                  width="96"
                  height="32"
                  viewBox="0 0 100 34"
                  className="overflow-visible pointer-events-none -mb-1 z-10 drop-shadow-md"
                >
                  <defs>
                    <linearGradient id={`branchWood_${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3d1d06" />
                      <stop offset="35%" stopColor="#5c2e0b" />
                      <stop offset="70%" stopColor="#78350f" />
                      <stop offset="100%" stopColor="#2e1302" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M -15,16 Q 25,10 50,16 Q 75,22 115,14"
                    stroke={`url(#branchWood_${idx})`}
                    strokeWidth="7.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M -15,15 Q 25,9 50,15 Q 75,21 115,13"
                    stroke="#9a3412"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                  />
                  <circle cx="50" cy="17" r="4.5" fill="#3d1d06" />
                  <path
                    d="M 46,16 C 24,2 10,10 2,19 C 16,23 32,21 46,18 Z"
                    fill="#15803d"
                    className="drop-shadow-xs"
                  />
                  <path d="M 46,16 Q 22,11 4,19" stroke="#86efac" strokeWidth="1.2" fill="none" opacity="0.85" />
                  <path
                    d="M 54,17 C 76,4 90,10 98,19 C 84,23 68,21 54,19 Z"
                    fill="#16a34a"
                    className="drop-shadow-xs"
                  />
                  <path d="M 54,17 Q 78,12 96,19" stroke="#bbf7d0" strokeWidth="1.2" fill="none" opacity="0.85" />
                </svg>

                {/* Pendulum Sway Wrapper */}
                <div
                  style={{
                    transformOrigin: 'top center',
                    animation: `mangoSway ${swayDuration}s ease-in-out infinite alternate`,
                    animationDelay: `${swayDelay}s`,
                  }}
                  className="flex flex-col items-center transition-transform duration-300 group-hover:scale-115 group-hover:z-40"
                >
                  <div className="w-[3.5px] h-4.5 bg-gradient-to-b from-[#3d1d06] to-[#78350f] rounded-full -mb-1 shadow-xs" />

                  <div className="relative flex flex-col items-center">
                    <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-xl scale-110 group-hover:bg-amber-300/60 group-hover:blur-2xl transition-all duration-300" />

                    <svg
                      width="66"
                      height="80"
                      viewBox="0 0 100 120"
                      className="relative z-10 filter drop-shadow-[0_10px_16px_rgba(180,83,9,0.45)] group-hover:drop-shadow-[0_14px_24px_rgba(245,158,11,0.7)] transition-all duration-200"
                    >
                      <defs>
                        <radialGradient id={`juicySkin_${idx}`} cx="35%" cy="32%" r="70%">
                          <stop offset="0%" stopColor="#fffbeb" />
                          <stop offset="15%" stopColor="#fef08a" />
                          <stop offset="42%" stopColor="#fbbf24" />
                          <stop offset="70%" stopColor="#f97316" />
                          <stop offset="92%" stopColor="#e11d48" />
                          <stop offset="100%" stopColor="#be123c" />
                        </radialGradient>
                        <linearGradient id={`leafSkin_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4ade80" />
                          <stop offset="60%" stopColor="#15803d" />
                          <stop offset="100%" stopColor="#052e16" />
                        </linearGradient>
                      </defs>

                      <g id="mangoLeafGroup">
                        <path
                          d="M50,14 C72,-4 92,6 98,20 C82,24 66,22 50,16 Z"
                          fill={`url(#leafSkin_${idx})`}
                          className="drop-shadow-sm"
                        />
                        <path
                          d="M50,15 Q74,8 96,19"
                          stroke="#86efac"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.8"
                        />
                        <circle cx="50" cy="16" r="3.5" fill="#451a03" />
                      </g>

                      <path
                        d="M48,16 C28,16 15,34 13,58 C11,83 24,106 45,114 C64,120 80,114 87,98 C91,88 90,76 88,58 C86,34 70,16 48,16 Z"
                        fill={`url(#juicySkin_${idx})`}
                      />
                      <path
                        d="M45,22 C30,22 20,38 18,58 C16,78 26,96 42,104 C32,88 28,66 34,44 C38,30 42,24 45,22 Z"
                        fill="#fef08a"
                        opacity="0.3"
                      />
                      <path
                        d="M26,36 C22,48 23,64 28,76 C29,64 28,48 33,38 C30,36 28,36 26,36 Z"
                        fill="#ffffff"
                        opacity="0.55"
                      />
                      <circle cx="28" cy="40" r="3" fill="#ffffff" opacity="0.75" />
                      <path
                        d="M46,111 C60,116 74,111 82,99"
                        stroke="#fef08a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>

                    <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/95 text-amber-300 text-[10px] font-black tracking-wide border border-amber-400/50 shadow-md flex items-center gap-1 z-20 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                      <span>🥭</span>
                      <span>+{formatHoursToHuman(mango.hours)}</span>
                    </div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-950/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap z-50 border border-amber-500/40 flex flex-col items-center gap-0.5">
                    <span className="text-amber-400 font-black">🥭 {mango.title} (1 Full Day Off)</span>
                    <span className="text-[10px] text-slate-300 font-semibold">100% Ripe &bull; Click to Redeem!</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 5. GROWING / UNRIPE MANGO (IN PROGRESS) */}
        {growingMango && (
          <div
            onClick={() => handleMangoClick(growingMango)}
            style={{
              left: '50%',
              top: '33%',
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group select-none"
            title={`Ripening: ${formatHoursToHuman(growingMango.current_hours)} / ${formatHoursToHuman(growingMango.target_hours)}`}
          >
            <div className="relative flex flex-col items-center">
              <svg
                width="86"
                height="28"
                viewBox="0 0 100 34"
                className="overflow-visible pointer-events-none -mb-1 z-10 drop-shadow-sm"
              >
                <path
                  d="M -10,16 Q 25,10 50,16 Q 75,22 110,14"
                  stroke="#451a03"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M -10,15 Q 25,9 50,15 Q 75,21 110,13"
                  stroke="#78350f"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="50" cy="17" r="4" fill="#2e1d09" />
                <path d="M 46,16 C 26,4 12,12 2,20 C 16,24 32,22 46,18 Z" fill="#15803d" />
                <path d="M 54,17 C 74,6 88,12 98,20 C 84,24 68,22 54,19 Z" fill="#16a34a" />
              </svg>

              <div
                style={{
                  transformOrigin: 'top center',
                  animation: 'mangoSway 3.8s ease-in-out infinite alternate',
                }}
                className="flex flex-col items-center transition-transform duration-300 group-hover:scale-115 group-hover:z-40"
              >
                <div className="w-[3px] h-4 bg-[#2e1d09] rounded-full -mb-1 shadow-xs" />

                <div className="relative flex flex-col items-center">
                  <div className="absolute inset-0 bg-lime-400/25 rounded-full blur-md" />

                  <svg width="54" height="66" viewBox="0 0 100 120" className="relative z-10 filter drop-shadow-md">
                    <defs>
                      <radialGradient id="growingRawGrad" cx="35%" cy="32%" r="70%">
                        <stop offset="0%" stopColor="#f7fee7" />
                        <stop offset="25%" stopColor="#d9f99d" />
                        <stop offset="60%" stopColor="#84cc16" />
                        <stop offset="90%" stopColor="#4d7c0f" />
                        <stop offset="100%" stopColor="#365314" />
                      </radialGradient>
                    </defs>

                    <path d="M50,14 C70,-2 88,6 94,18 C78,22 64,20 50,16 Z" fill="#15803d" />
                    <circle cx="50" cy="16" r="3" fill="#2e1d09" />

                    <path
                      d="M48,16 C30,16 18,34 16,56 C14,80 26,104 46,112 C64,118 78,112 85,98 C89,88 88,76 86,58 C84,34 70,16 48,16 Z"
                      fill="url(#growingRawGrad)"
                    />
                    <ellipse cx="30" cy="44" rx="4" ry="12" fill="#ffffff" opacity="0.4" transform="rotate(-18 30 44)" />
                  </svg>

                  <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[9px] font-black tracking-wide border border-emerald-500/50 shadow-md flex items-center gap-1">
                    <span>🍏</span>
                    <span>{Math.round(growingMango.progress_percent)}%</span>
                  </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-950/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap z-50 border border-emerald-500/40 flex flex-col items-center gap-0.5">
                  <span className="text-emerald-400 font-black">
                    🍏 Ripening: {formatHoursToHuman(growingMango.current_hours)} / {formatHoursToHuman(growingMango.target_hours)}
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold">
                    +{formatHoursToHuman(growingMango.remaining_hours)} more overtime to mature
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. RUSTIC HARVEST WICKER BASKET ON ORCHARD LAWN */}
        {ripeCount > 0 && (
          <div
            onClick={() => {
              const firstRipe = allRipeMangoes[0];
              if (firstRipe) {
                try {
                  soundFx?.playPop?.();
                } catch {}
                setSelectedMango(firstRipe);
                setIsClaimModalOpen(true);
              }
            }}
            className="absolute right-4 sm:right-8 md:right-12 bottom-3 sm:bottom-5 z-20 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-amber-400 dark:border-amber-600 shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all select-none group"
            style={{ animation: 'basketGlow 4s ease-in-out infinite' }}
            title="ক্লিক করে ছুটি বা টাকা রেডিম করুন ➔"
          >
            <div className="relative text-3xl shrink-0">
              <span>🧺</span>
              <span className="absolute -top-1.5 -right-1.5 text-base animate-bounce">🥭</span>
              {extraBasketMangoesCount > 0 && (
                <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black border border-white dark:border-slate-900 shadow-sm animate-pulse">
                  +{extraBasketMangoesCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                <span>Harvest Ready:</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-black shadow-xs">
                  {ripeCount} Mango{ripeCount > 1 ? 'es' : ''}
                </span>
                {extraBasketMangoesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black shadow-xs animate-pulse">
                    +{extraBasketMangoesCount} ঝুড়িতে জমা
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {extraBasketMangoesCount > 0
                  ? `গাছে ৪টি • ঝুড়িতে ${extraBasketMangoesCount}টি • ক্লিক করে রেডিম করুন ➔`
                  : `${ripeCount} paid break day${ripeCount > 1 ? 's' : ''} stored in orchard • ক্লিক করুন ➔`}
              </div>
            </div>
          </div>
        )}

        {/* Empty Tree Banner when 0 Mangoes */}
        {allRipeMangoes.length === 0 && !growingMango && (
          <div className="absolute inset-x-8 bottom-8 md:bottom-12 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl space-y-2 z-20 animate-fadeIn">
            <span className="text-3xl">🌱</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Your Mango Tree is Waiting to Bloom!</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Work beyond your standard {shiftHours}-hour shift. Every {shiftHours} hours of accumulated overtime will bear 1 delicious ripe mango here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

