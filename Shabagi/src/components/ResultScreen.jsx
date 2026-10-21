import React, { useEffect, useRef, useState } from 'react';
import { 
  Download, 
  Share2, 
  RotateCcw, 
  Check, 
  Copy, 
  Sparkles, 
  Camera, 
  MessageCircle, 
  PackageCheck, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  Layers, 
  Flame, 
  CircleDot, 
  Swords, 
  Skull,
  Volume2,
  VolumeX,
  Play,
  Square,
  Scan,
  Tv,
  ShieldCheck,
  Trophy,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { 
  playClickSound, 
  playFanfare, 
  playBattleSound, 
  playRoastSound,
  speakDialogue,
  stopAllSpeech,
  playMemeSfx
} from '../utils/audio';
import { getUnlockedGoals } from '../data/questions';

import MasterCertificateCard from './cards/MasterCertificateCard';
import AntiShowerLicenseCard from './cards/AntiShowerLicenseCard';
import UniversalFestivalCard from './cards/UniversalFestivalCard';
import RebelWarrantCard from './cards/RebelWarrantCard';
import AttelDegreeCard from './cards/AttelDegreeCard';
import DuelBattleCard from './cards/DuelBattleCard';
import BreakingNewsCard from './cards/BreakingNewsCard';
import ShabagiPassportCard from './cards/ShabagiPassportCard';
import FacebookCaptionGenerator from './FacebookCaptionGenerator';
import { getDistrictRank, getDistrictTitle, getDistrictCount } from '../data/districts';

export default function ResultScreen({ 
  score, 
  result, 
  gender = 'female',
  userName, 
  userPhoto, 
  setUserPhoto, 
  userDivision = 'ঢাকা বিভাগ',
  userDistrict = 'ঢাকা',
  onRetake,
  challenger,
  onOpenChallengeModal,
  onOpenRoastModal,
  onOpenStickerBooth,
  onOpenSoundboard,
  onOpenScannerModal,
  onOpenNewsModal,
  onOpenPassportModal,
  onOpenCensusModal
}) {
  const isFemale = gender === 'female';
  const [activeTab, setActiveTab] = useState(challenger && challenger.name ? 'duel' : 'master');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [hasVirtualTeep, setHasVirtualTeep] = useState(isFemale);
  const [isPlayingCardVoice, setIsPlayingCardVoice] = useState(false);
  
  // Card Refs
  const duelRef = useRef(null);
  const masterRef = useRef(null);
  const licenseRef = useRef(null);
  const harmonyRef = useRef(null);
  const warrantRef = useRef(null);
  const degreeRef = useRef(null);
  const newsRef = useRef(null);
  const passportRef = useRef(null);
  
  const photoInputRef = useRef(null);
  const goals = getUnlockedGoals(score, gender);
  const displayName = userName?.trim() ? userName.trim() : (isFemale ? 'কমরেড তাসনুভা' : 'কমরেড আঁতেল');

  const cardTabs = [
    ...(challenger && challenger.name ? [{
      id: 'duel',
      label: '⚔️ ডুয়েল ফেস-অফ',
      subtitle: `${challenger.name} (${challenger.score}%) বনাম আপনি (${score}%)`,
      icon: '⚔️',
      sfx: 'battle',
      voiceQuote: score >= (challenger.score || 96)
        ? `অভিনন্দন কমরেড ${displayName}! আপনি কমরেড ${challenger.name}-কে গুঁড়িয়ে দিয়ে শাহবাগের একচ্ছত্র নেতা বনে গেছেন!`
        : `হায় হায় কমরেড ${displayName}! কমরেড ${challenger.name} আপনার চেয়ে বড় আঁতেল প্রমাণিত হয়েছেন! যান আগে এক কাপ লাল চা খান!`
    }] : []),
    { 
      id: 'master', 
      label: isFemale ? 'শাহবাগী নারী সনদ' : 'মহা শাহবাগী সনদ', 
      subtitle: isFemale ? '১০০% কপালে লাল টিপ ও ঝোলা' : '১০০% টিপ ও বিপ্লবী ঝোলা', 
      icon: '📜',
      sfx: 'bugle',
      voiceQuote: isFemale
        ? `কমরেড ${displayName}! কপালে আড়াই ইঞ্চির সুবিশাল লাল টিপ আর কাঁধে শান্তিনিকেতনি রঙিন ঝোলা ঝুলিয়ে আপনি ১০০ পার্সেন্ট সার্টিফাইড শাহবাগী নারী কমরেড!`
        : `বিপ্লবী কমরেড ${displayName}! উশকোখুশকো চুল আর তুচ্ছ কারণে শাহবাগ মোড় অবরোধের ১০০ পার্সেন্ট মহা শাহবাগী সনদ আপনার নামে মঞ্জুর করা হলো!`
    },
    { 
      id: 'license', 
      label: 'গোসল লাইসেন্স', 
      subtitle: 'স্মার্ট পরিচয়পত্র (সাবানমুক্ত)', 
      icon: '🚿',
      sfx: 'roast',
      voiceQuote: `বিশেষ জরুরি নোটিশ! গোসল হলো পুঁজিতান্ত্রিক সাবান কোম্পানির চক্রান্ত! কমরেড ${displayName}-কে আজীবন সাবানমুক্ত ও সুগন্ধিমুক্ত থাকার আইনি অনুমতি দেওয়া হলো!`
    },
    { 
      id: 'passport', 
      label: 'কমরেড পাসপোর্ট', 
      subtitle: 'গণপ্রজাতন্ত্রী শাহবাগ ই-পাসপোর্ট', 
      icon: '🛂',
      sfx: 'stamp',
      voiceQuote: `পাসপোর্ট জারি সম্পন্ন! কমরেড ${displayName}-কে বিশ্বের যেকোনো মুক্তাঞ্চলে চলাচলের জন্য সরকারি শাহবাগী কমরেড পাসপোর্ট প্রদান করা হলো!`
    },
    { 
      id: 'harmony', 
      label: '\'উৎসব সবার\' পাস', 
      subtitle: 'খিচুড়ি ও সম্প্রীতি ভিআইপি', 
      icon: '🎉',
      sfx: 'teaClink',
      voiceQuote: `ধর্ম যার যার উৎসব সবার! সব উৎসবে ফ্রন্টলাইনে হাজির হয়ে ৩ প্লেট খিচুড়ি ও পায়েস খাওয়ার জন্য কমরেড ${displayName}-কে স্পেশাল ভিআইপি পাস দেওয়া হলো!`
    },
    { 
      id: 'warrant', 
      label: isFemale ? 'মশাল নেত্রী ওয়ারেন্ট' : 'আন্দোলন ওয়ারেন্ট', 
      subtitle: 'শাহবাগ অবরোধ পারমিট', 
      icon: '🚩',
      sfx: 'megaphone',
      voiceQuote: `জরুরি আন্দোলন ওয়ারেন্ট! চায়ের দোকানে চিনি সামান্য বেশি হলেও কিংবা মনে ক্ষোভ জাগলেই অবিলম্বে শাহবাগ মোড় অবরোধ করার বিপ্লবী অধিকার আপনার রয়েছে!`
    },
    { 
      id: 'degree', 
      label: 'আঁতেল পিএইচডি', 
      subtitle: isFemale ? 'ডক্টরেট অব ফেমিনিস্ট আঁতেলিজম' : 'ইউনিসেক্স ডক্টরেট ডিপ্লোমা', 
      icon: '🎓',
      sfx: 'victory',
      voiceQuote: `অভিনন্দন কমরেড ${displayName}! আপনি ডক্টরেট অব আঁতেলিজম পিএইচডি ডিগ্রি অর্জন করেছেন! এখন থেকে সোশ্যাল মিডিয়ায় দাঁড়ি-কমা ছাড়া ২০ লাইনের জটিল স্ট্যাটাস দিতে পারবেন!`
    },
    { 
      id: 'news', 
      label: 'ব্রেকিং নিউজ', 
      subtitle: 'শাহবাগ ২৪ টিভি বুলেটিন', 
      icon: '📺',
      sfx: 'news',
      voiceQuote: `ব্রেকিং নিউজ! টানা ৪২ দিন গোসল বর্জন করে শাহবাগে মার্ক্সবাদের বই পড়ার দায়ে কমরেড ${displayName}-কে আটক করেছে বিপ্লবী টাস্কফোর্স!`
    },
  ];

  const activeCardTab = cardTabs.find(t => t.id === activeTab) || cardTabs[0];

  const handlePlayCardAudio = (tabItem) => {
    const target = tabItem || activeCardTab;
    if (!target) return;
    playMemeSfx(target.sfx || 'bugle');
    speakDialogue(target.voiceQuote);
    setIsPlayingCardVoice(true);
  };

  const handleStopCardAudio = () => {
    stopAllSpeech();
    setIsPlayingCardVoice(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playFanfare();

    try {
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#e11d48', '#f59e0b', '#dc2626', '#10b981']
      });
    } catch (e) {
      // Graceful fallback
    }

    // Auto-announce the active card voice after fanfare
    const timer = setTimeout(() => {
      const initialTab = cardTabs.find(t => t.id === activeTab) || cardTabs[0];
      if (initialTab) {
        handlePlayCardAudio(initialTab);
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      stopAllSpeech();
    };
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRefForTab = (tabId) => {
    switch (tabId) {
      case 'duel': return duelRef.current;
      case 'master': return masterRef.current;
      case 'license': return licenseRef.current;
      case 'harmony': return harmonyRef.current;
      case 'warrant': return warrantRef.current;
      case 'degree': return degreeRef.current;
      case 'news': return newsRef.current;
      case 'passport': return passportRef.current;
      default: return masterRef.current;
    }
  };

  const activeIndex = cardTabs.findIndex(t => t.id === activeTab);
  const handlePrevCard = () => {
    playClickSound();
    const newIdx = (activeIndex - 1 + cardTabs.length) % cardTabs.length;
    const newTab = cardTabs[newIdx];
    setActiveTab(newTab.id);
    handlePlayCardAudio(newTab);
  };
  const handleNextCard = () => {
    playClickSound();
    const newIdx = (activeIndex + 1) % cardTabs.length;
    const newTab = cardTabs[newIdx];
    setActiveTab(newTab.id);
    handlePlayCardAudio(newTab);
  };

  // Download Single Active Card
  const handleDownloadActiveCard = async () => {
    playClickSound();
    const targetRef = getRefForTab(activeTab);
    if (!targetRef) return;

    try {
      setIsDownloading(true);
      const dataUrl = await toPng(targetRef, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#1c0f0f',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `antelscope-${gender}-${activeTab}-${score}percent.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn('First attempt error, retrying:', err);
      try {
        const fallbackUrl = await toPng(targetRef, {
          quality: 0.9,
          pixelRatio: 1.5,
          backgroundColor: '#1c0f0f',
        });
        const link = document.createElement('a');
        link.download = `antelscope-${gender}-${activeTab}-${score}percent.png`;
        link.href = fallbackUrl;
        link.click();
      } catch (e2) {
        alert("কার্ড ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে স্ক্রিনশট নিন!");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Download All 5 Cards (Album pack)
  const handleDownloadAllCards = async () => {
    playClickSound();
    setIsDownloading(true);
    setBulkProgress({ current: 0, total: cardTabs.length });

    try {
      for (let i = 0; i < cardTabs.length; i++) {
        const tab = cardTabs[i];
        setBulkProgress({ current: i + 1, total: cardTabs.length });

        const targetRef = getRefForTab(tab.id);
        if (targetRef) {
          const wasVisible = targetRef.parentElement.style.display;
          targetRef.parentElement.style.display = 'block';

          await new Promise(r => setTimeout(r, 120));

          const dataUrl = await toPng(targetRef, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#1c0f0f',
            cacheBust: true,
          });

          targetRef.parentElement.style.display = wasVisible;

          const link = document.createElement('a');
          link.download = `antelscope-${gender}-${i + 1}-${tab.id}-${score}percent.png`;
          link.href = dataUrl;
          link.click();

          await new Promise(r => setTimeout(r, 250));
        }
      }
    } catch (err) {
      console.error('Bulk download error:', err);
      alert("সবগুলো কার্ড একবারে প্রস্তুত করতে সমস্যা হয়েছে। দয়া করে একে একে কার্ড ডাউনলোড করুন!");
    } finally {
      setIsDownloading(false);
      setBulkProgress(null);
    }
  };

  // Friend Challenge Link & Share Text
  const currentOrigin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const challengeLink = `${currentOrigin}?challenge=true&challenger=${encodeURIComponent(displayName)}&challengerScore=${score}&challengerGender=${gender}`;

  const currentDistrict = userDistrict || 'ঢাকা';
  const currentDivision = userDivision || 'ঢাকা বিভাগ';
  const districtRank = getDistrictRank(currentDistrict);
  const districtTitle = getDistrictTitle(currentDistrict);

  // Copy Result Text
  const shareText = `🔥 আমার আঁতেল ও শাহবাগী স্কোর: ${score}% (${result.title})!\n📍 আমার জেলা ঘাঁটি: [${currentDistrict}] (${currentDivision}) • জাতীয় র‍্যাঙ্ক: #${districtRank}!\n🎖️ জেলা উপাধি: "${districtTitle}"\n🚩 কপালে বড় লাল টিপ, কাঁধে ঝোলা, গোসল বর্জন আর তুচ্ছ ইস্যুতে শাহবাগ মোড় অবরোধে আমি ভেরিফাইড!\n\n⚔️ আমার ফ্রেন্ডলিস্টের বড় আঁতেলরা, তোদের দম থাকলে আমার এই স্কোর ভেঙে দেখা!\n👇 চ্যালেঞ্জ গ্রহণ করতে টেস্ট দে:\n${challengeLink}`;

  const handleCopy = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      prompt('ফলাফল কপি করুন:', shareText);
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    playClickSound();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // Facebook Share
  const handleFacebookShare = () => {
    playClickSound();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6 animate-fadeIn">
      
      {/* Top Banner: Guaranteed High Score Toast */}
      <div className="flex items-center justify-center mb-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 backdrop-blur-md text-rose-200 text-xs md:text-sm font-bold shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>অভিনন্দন! আপনি জাতীয় কমরেড ও আঁতেল ক্লাবে ভেরিফাইড ({isFemale ? 'নারী বিপ্লবী ক্যাটাগরি' : 'কমরেড ক্যাটাগরি'})</span>
        </div>
      </div>

      {/* District Pride & National Rank Box */}
      <div className="w-full max-w-lg lg:max-w-4xl mx-auto mb-4 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-red-950 via-slate-950 to-amber-950 border-2 border-amber-500/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-red-600 flex items-center justify-center text-2xl shadow-lg border border-amber-300 flex-shrink-0 animate-bounce-slow">
            📍
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black text-amber-300">
                আপনার জেলা: <strong className="text-white underline decoration-amber-400">{currentDistrict}</strong>
              </span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-2.5 py-0.5 rounded-full border border-red-400">
                {currentDivision}
              </span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow">
                জাতীয় র‍্যাঙ্ক: #{districtRank}
              </span>
            </div>
            <p className="text-xs text-amber-100 font-bold mt-0.5">
              উপাধি: <span className="text-amber-300 font-black">"{districtTitle}"</span>
            </p>
          </div>
        </div>

        {onOpenCensusModal && (
          <button
            onClick={() => {
              playClickSound();
              onOpenCensusModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-black text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0 border border-amber-300"
          >
            <Trophy className="w-4 h-4 text-yellow-200" />
            <span>জাতীয় জেলা র‍্যাঙ্কিং দেখুন</span>
          </button>
        )}
      </div>

      {/* Main Responsive Layout: Side-by-side on PC, stacked on Mobile */}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">

        {/* LEFT COLUMN: 5-CARD VIEWER & SWITCHER */}
        <div className="w-full lg:w-[57%] flex flex-col items-center">
          
          {/* Card Tabs Carousel on Mobile / Quick Switcher */}
          <div className="w-full max-w-lg mb-3">
            <div className="flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md overflow-x-auto no-scrollbar shadow-inner">
              {cardTabs.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playClickSound();
                      setActiveTab(tab.id);
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md scale-[1.02]'
                        : 'text-rose-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden font-mono">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Virtual Red Teep (Only for Females) & Photo Bar */}
          <div className="w-full max-w-lg mb-2 flex items-center justify-between px-2 text-xs">
            {/* Virtual Teep Toggle Button - only for females */}
            {isFemale ? (
              <button
                onClick={() => {
                  playClickSound();
                  setHasVirtualTeep(prev => !prev);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                  hasVirtualTeep 
                    ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30' 
                    : 'bg-white/15 text-white/80 border-white/25 hover:bg-white/25'
                }`}
              >
                <span className="text-sm">🔴</span>
                <span>{hasVirtualTeep ? 'কপালে লাল টিপ: অন' : 'কপালে লাল টিপ: অফ'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 border border-white/20 text-rose-200 text-xs font-bold">
                <span>🧔</span>
                <span>উশকোখুশকো চুল ও লাল চা ক্যাটাগরি</span>
              </div>
            )}

            {/* Quick change photo */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all text-xs font-bold">
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>{userPhoto ? 'ছবি পরিবর্তন' : 'নিজের ছবি যোগ করুন'}</span>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            {/* Virtual Sticker Booth Launcher */}
            {onOpenStickerBooth && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenStickerBooth();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-rose-500/30 hover:from-amber-500/40 hover:to-rose-500/40 text-amber-200 border border-amber-400/50 transition-all text-xs font-black shadow-sm active:scale-95"
              >
                <span>👓 স্টিকার বুথ (টিপ ও চশমা)</span>
              </button>
            )}
          </div>

          {/* INTERACTIVE CARD VOICE ANNOUNCEMENT PLAYER */}
          <div className="w-full max-w-lg mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-zinc-950 to-neutral-900 border border-amber-500/50 shadow-xl backdrop-blur-md text-white flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-sm flex-shrink-0 shadow ${
                  isPlayingCardVoice ? 'animate-bounce' : ''
                }`}>
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block leading-tight">
                    {isPlayingCardVoice ? '🔊 এই কার্ডের ভয়েস ঘোষণা বাজছে:' : 'এই কার্ডের অফিসিয়াল অডিও ঘোষণা:'}
                  </span>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {activeCardTab?.label} • {activeCardTab?.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isPlayingCardVoice ? (
                  <button
                    onClick={handleStopCardAudio}
                    className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow active:scale-95 transition-all"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>থামান</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlayCardAudio()}
                    className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-red-600 hover:from-amber-500 hover:to-red-700 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all animate-pulse"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>ভয়েস শুনুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Subtitle / Quote preview bar */}
            <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-amber-100 italic flex items-center gap-2">
              <span className="text-sm">🗣️</span>
              <span className="truncate">"{activeCardTab?.voiceQuote}"</span>
            </div>
          </div>

          {/* ACTIVE CARD DISPLAY STAGE */}
          <div className="w-full max-w-lg relative">
            <div className="transition-all duration-200">
              {challenger && challenger.name && (
                <div style={{ display: activeTab === 'duel' ? 'block' : 'none' }}>
                  <DuelBattleCard
                    cardRef={duelRef}
                    challengerName={challenger.name}
                    challengerScore={challenger.score || 96}
                    challengerGender={challenger.gender || 'male'}
                    userName={displayName}
                    userScore={score}
                    userGender={gender}
                    userPhoto={userPhoto}
                    userDistrict={currentDistrict}
                    hasVirtualTeep={isFemale && hasVirtualTeep}
                  />
                </div>
              )}

              <div style={{ display: activeTab === 'master' ? 'block' : 'none' }}>
                <MasterCertificateCard
                  cardRef={masterRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  score={score}
                  result={result}
                  goals={goals}
                  district={currentDistrict}
                  division={currentDivision}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>

              <div style={{ display: activeTab === 'license' ? 'block' : 'none' }}>
                <AntiShowerLicenseCard
                  cardRef={licenseRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  score={score}
                  district={currentDistrict}
                  division={currentDivision}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>

              <div style={{ display: activeTab === 'harmony' ? 'block' : 'none' }}>
                <UniversalFestivalCard
                  cardRef={harmonyRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  score={score}
                  district={currentDistrict}
                  division={currentDivision}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>

              <div style={{ display: activeTab === 'warrant' ? 'block' : 'none' }}>
                <RebelWarrantCard
                  cardRef={warrantRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  score={score}
                  district={currentDistrict}
                  division={currentDivision}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>

              <div style={{ display: activeTab === 'degree' ? 'block' : 'none' }}>
                <AttelDegreeCard
                  cardRef={degreeRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  score={score}
                  district={currentDistrict}
                  division={currentDivision}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>

              <div style={{ display: activeTab === 'news' ? 'block' : 'none' }}>
                <BreakingNewsCard
                  cardRef={newsRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  channelName="শাহবাগ ২৪"
                  locationName={`${currentDistrict} বিশেষ ব্যুরো, ${currentDivision}`}
                  headline={`টানা ৪২ দিন গোসল বর্জন করে ${currentDistrict}-তে মার্ক্সবাদের বই পড়ার দায়ে কমরেড ${displayName} আটক!`}
                  tickerText="টিএসসিতে চায়ের দাম ১ টাকা বাড়ায় ৩ দিনের অনশনের ডাক • কপালে ৩ ইঞ্চি লাল টিপ না পরলে প্রবেশ নিষেধ!"
                  district={currentDistrict}
                  division={currentDivision}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>

              <div style={{ display: activeTab === 'passport' ? 'block' : 'none' }}>
                <ShabagiPassportCard
                  cardRef={passportRef}
                  displayName={displayName}
                  gender={gender}
                  userPhoto={userPhoto}
                  passportNo={`SHB2026-${score}-TEA`}
                  division={currentDivision}
                  district={currentDistrict}
                  bloodGroup="চা পজিটিভ (Tea+)"
                  birthPlace="টিএসসি টংয়ের আড্ডা, ঢাকা"
                  identMark={isFemale ? 'কপালে আড়াই ইঞ্চি সুবিশাল লাল টিপ ও কাঁধে রঙচটা ঝোলা ব্যাগ' : 'উশকোখুশকো চুল ও সাবানমুক্ত প্রাকৃতিক ত্বক'}
                  hasVirtualTeep={isFemale && hasVirtualTeep}
                />
              </div>
            </div>
          </div>

          {/* Gallery Prev / Next Controls */}
          <div className="flex items-center justify-between w-full max-w-lg mt-3 px-2">
            <button
              onClick={handlePrevCard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/30 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>আগের কার্ড</span>
            </button>

            <span className="text-white/90 text-xs font-black tracking-wider">
              {activeIndex + 1} / {cardTabs.length} • {cardTabs[activeIndex].label}
            </span>

            <button
              onClick={handleNextCard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/30 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            >
              <span>পরের কার্ড</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL DASHBOARD & 5-CARD SELECTOR */}
        <div className="w-full lg:w-[43%] flex flex-col gap-4">
          
          {/* User Score & Status Pill Card */}
          <div className="glass-card rounded-[32px] p-4 md:p-5 shadow-xl border border-white/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt="ইউজার"
                      className="w-12 h-12 rounded-full object-cover border-2 border-rose-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center text-xl shadow-inner">
                      {isFemale ? '👩🏻‍🦰' : '🧔🏻'}
                    </div>
                  )}
                  {isFemale && hasVirtualTeep && (
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight truncate">{displayName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-xs font-bold text-rose-600">{result.badge}</p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black border border-emerald-300">
                      📍 {userDistrict}
                    </span>
                  </div>
                </div>
              </div>

              {/* Glowing Score Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-3.5 py-2 rounded-2xl shadow-md">
                <Flame className="w-4 h-4 fill-white" />
                <span className="text-lg font-black leading-none">{score}%</span>
              </div>
            </div>
          </div>

          {/* DESKTOP 5-CARD SELECTOR GALLERY */}
          <div className="hidden lg:block glass-card rounded-[32px] p-5 shadow-xl border border-white/40">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-600" />
                কার্ড কালেকশন (৫টি এক্সক্লুসিভ সনদ)
              </h4>
              <span className="text-[11px] font-bold text-rose-600">ক্লিক করে দেখুন</span>
            </div>

            <div className="space-y-2">
              {cardTabs.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playClickSound();
                      setActiveTab(tab.id);
                      handlePlayCardAudio(tab);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg scale-[1.01]'
                        : 'bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                        isActive ? 'bg-white/20' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tab.icon}
                      </div>
                      <div>
                        <p className={`text-xs font-black leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {idx + 1}. {tab.label}
                        </p>
                        <p className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-rose-100' : 'text-slate-500'}`}>
                          {tab.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="text-[10px] font-black bg-white text-rose-600 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                          <span>অডিও</span>
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DOWNLOAD & SHARE ACTION HUB */}
          <div className="glass-card rounded-[32px] p-5 shadow-xl border border-white/40 space-y-3">
            
            {/* VIRAL FRIEND CHALLENGE & ROAST ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-1">
              <button
                onClick={() => {
                  playBattleSound();
                  onOpenChallengeModal && onOpenChallengeModal();
                }}
                className="py-3.5 px-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/30 group"
              >
                <Swords className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>বন্ধুকে ডুয়েল চ্যালেঞ্জ দিন</span>
              </button>

              <button
                onClick={() => {
                  playRoastSound();
                  onOpenRoastModal && onOpenRoastModal();
                }}
                className="py-3.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/30 group"
              >
                <Skull className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>বন্ধু রোস্ট ও শোকজ সনদ</span>
              </button>
            </div>

            {onOpenNewsModal && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenNewsModal && onOpenNewsModal();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/30 group"
              >
                <Tv className="w-4 h-4 text-amber-300 animate-pulse group-hover:scale-110 transition-transform" />
                <span>📺 বন্ধুর নামে "টিভি ব্রেকিং নিউজ মিম" বানান</span>
              </button>
            )}

            {onOpenPassportModal && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenPassportModal && onOpenPassportModal();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-700 hover:from-emerald-900 hover:to-teal-900 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-400/40 group mt-1"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse group-hover:scale-110 transition-transform" />
                <span>🛂 নিজের নামে "শাহবাগী কমরেড পাসপোর্ট" তৈরি করুন</span>
              </button>
            )}

            {onOpenCensusModal && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenCensusModal && onOpenCensusModal();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/30 group mt-1"
              >
                <Trophy className="w-4 h-4 text-amber-200 animate-bounce group-hover:scale-110 transition-transform" />
                <span>🗺️ আপনার জেলা [{userDistrict}]-এর জাতীয় আঁতেল র‍্যাঙ্কিং ও আদমশুমারি</span>
              </button>
            )}

            {/* HERO 6-CARD ALBUM BUNDLE DOWNLOAD BUTTON */}
            <button
              onClick={handleDownloadAllCards}
              disabled={isDownloading}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 hover:from-amber-500 hover:to-red-700 text-white font-black text-sm md:text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-2 border-white/40 group"
            >
              <PackageCheck className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span>{isDownloading ? (bulkProgress ? `ডাউনলোড হচ্ছে (${bulkProgress.current}/${bulkProgress.total})...` : 'প্রস্তুত হচ্ছে...') : `সবগুলো (${cardTabs.length}টি) কার্ড একসাথে ডাউনলোড করুন`}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center font-medium">
              * ফেসবুকে {cardTabs.length}টি ছবির অ্যালবাম বা ফটো স্টোরি পোস্ট করার জন্য প্রস্তুত
            </p>

            {/* SECONDARY ACTIONS: SAVE CURRENT CARD & COPY LINK */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleDownloadActiveCard}
                disabled={isDownloading}
                className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>বর্তমান কার্ড সেভ</span>
              </button>

              <button
                onClick={handleCopy}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{isCopied ? 'কপি হয়েছে!' : 'টেক্সট কপি'}</span>
              </button>
            </div>

            {/* SOCIAL SHARING BUTTONS */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2.5">
              <button
                onClick={handleFacebookShare}
                className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>ফেসবুকে শেয়ার</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>হোয়াটসঅ্যাপ</span>
              </button>
            </div>

            {/* BIOMETRIC SCANNER REPLAY BUTTON */}
            {onOpenScannerModal && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenScannerModal();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-red-600/15 to-amber-500/15 hover:from-rose-500/25 hover:to-amber-500/25 border border-rose-500/40 text-slate-800 text-xs font-black shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-1"
              >
                <Scan className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>🔍 বায়োমেট্রিক ফেস স্ক্যানার FX পুনরায় চালান</span>
              </button>
            )}

            {/* VIRAL MEME SOUNDBOARD BUTTON */}
            {onOpenSoundboard && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenSoundboard();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-red-600/15 hover:from-amber-500/25 hover:to-red-600/25 border border-amber-400/50 text-slate-800 text-xs font-black shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-1"
              >
                <span className="text-base">🔊</span>
                <span>শাহবাগী মিম সাউন্ডবোর্ড ও ভয়েস ডায়লগ শুনুন</span>
              </button>
            )}

            {/* RETAKE QUIZ BUTTON */}
            <div className="pt-2 text-center">
              <button
                onClick={onRetake}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>আবার টেস্ট দিন (জেন্ডার বা নাম পরিবর্তন)</span>
              </button>
            </div>
          </div>

          {/* AUTO FRIEND-TAGGING FACEBOOK CAPTION GENERATOR */}
          <FacebookCaptionGenerator
            displayName={displayName}
            score={score}
            gender={gender}
            district={currentDistrict}
            division={currentDivision}
            challengeLink={challengeLink}
          />
        </div>

      </div>
    </div>
  );
}
