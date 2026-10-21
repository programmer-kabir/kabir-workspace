import React, { useState, useRef } from 'react';
import { 
  Tv, 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  Radio, 
  MessageCircle,
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import BreakingNewsCard from './cards/BreakingNewsCard';
import { playClickSound, playNewsIntroSound } from '../utils/audio';

const channelList = [
  'শাহবাগ ২৪',
  'টিএসসি টিভি',
  'আঁতেল নিউজ',
  'বিপ্লব লাইভ'
];

const locationList = [
  'শাহবাগ মোড়, ঢাকা',
  'টিএসসি ক্যাফেটেরিয়া ও পায়রা চত্বর',
  'চারুকলা বকুলতলা',
  'আজিজ সুপার মার্কেট ৩য় তলা',
  'মধুর ক্যান্টিন'
];

const headlinePresets = [
  (name) => `টানা ৪২ দিন গোসল বর্জন করে শাহবাগে মার্ক্সবাদের বই পড়ার দায়ে কমরেড ${name} আটক!`,
  (name) => `টিএসসিতে চায়ের দাম ১ টাকা বাড়ায় শাহবাগ মোড়ে ৩ দিনের অনশনের ডাক দিয়েছেন আঁতেল ${name}!`,
  (name) => `কপালে আড়াই ইঞ্চির কম সাইজের লাল টিপ পরায় কমরেড ${name}-কে সমাজ থেকে সাময়িক বহিষ্কার!`,
  (name) => `প্রেম ভেঙে যাওয়ার পর ক্যাফেতে বসে নিও-লিবারেল পুঁজিবাদকে গালাগালি করতে গিয়ে হাতেনাতে ধৃত ${name}!`,
  (name) => `শান্তিনিকেতনি রঙিন ঝোলা ব্যাগ ছাড়া রাস্তায় বের হওয়ায় বুদ্ধিজীবী সনদ বাতিল হলো ${name}-এর!`,
  (name) => `চায়ে মাত্র আধা চামচ চিনি বেশি পড়ায় গোটা টং দোকান বয়কট করলেন বিপ্লবী ${name}!`,
  (name) => `মা মাথায় খাঁটি সরিষার তেল ও সাবান দেওয়ার চেষ্টা করায় জাতিসংঘে নালিশ পাঠালেন কমরেড ${name}!`,
  (name) => `দাঁড়ি-কমা ছাড়া ২০ লাইনের অতি-জটিল মেটাফোরিক্যাল কবিতা লিখে বন্ধুদের ট্রমাটাইজ করলেন ${name}!`
];

const tickerPresets = [
  'টিএসসিতে চায়ের দাম ১ টাকা বাড়ায় ৩ দিনের অনশনের ডাক • কপালে ৩ ইঞ্চি লাল টিপ না পরলে শাহবাগে প্রবেশ নিষেধ!',
  'জরুরি নির্দেশ: গোসল করা পুঁজিতান্ত্রিক চক্রান্ত, সাবান কোম্পানি বয়কটের ডাক বিপ্লবী ফ্রন্টের!',
  'ব্রেকিং: শান্তিনিকেতনি ঝোলা ব্যাগের দাম ৩০০ টাকা বৃদ্ধিতে বুদ্ধিজীবী মহলে তীব্র ক্ষোভ ও বিক্ষোভ মিছিল!',
  'টিএসসি টংয়ের লাল চা ছাড়া দিন শুরু করা শাস্তিযোগ্য অপরাধ হিসেবে ঘোষণার জোর দাবি!'
];

export default function BreakingNewsModal({
  isOpen,
  onClose,
  defaultName = '',
  defaultGender = 'female',
  defaultPhoto = null,
  defaultDistrict = 'ঢাকা',
  defaultDivision = 'ঢাকা বিভাগ',
  onOpenStickerBooth
}) {
  const [friendName, setFriendName] = useState(defaultName || 'কমরেড সুমন');
  const [gender, setGender] = useState(defaultGender);
  const [userPhoto, setUserPhoto] = useState(defaultPhoto || null);
  const [selectedChannel, setSelectedChannel] = useState(channelList[0]);
  const [selectedLocation, setSelectedLocation] = useState(locationList[0]);
  const [selectedHeadlineIdx, setSelectedHeadlineIdx] = useState(0);
  const [customHeadline, setCustomHeadline] = useState('');
  const [selectedTickerIdx, setSelectedTickerIdx] = useState(0);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const displayName = friendName.trim() || (gender === 'female' ? 'কমরেড তাসনুভা' : 'কমরেড আঁতেল');
  const currentHeadline = customHeadline.trim() ? customHeadline.trim() : headlinePresets[selectedHeadlineIdx](displayName);
  const currentTicker = tickerPresets[selectedTickerIdx];

  const handleRandomize = () => {
    playNewsIntroSound();
    const nextHeadline = (selectedHeadlineIdx + 1) % headlinePresets.length;
    const nextTicker = (selectedTickerIdx + 1) % tickerPresets.length;
    const nextChannel = (channelList.indexOf(selectedChannel) + 1) % channelList.length;
    setSelectedHeadlineIdx(nextHeadline);
    setSelectedTickerIdx(nextTicker);
    setSelectedChannel(channelList[nextChannel]);
    setCustomHeadline('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ছবির সাইজ ৫MB এর কম হতে হবে!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    playClickSound();
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#050505',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `shabagi-breaking-news-${displayName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      console.error('Download error:', err);
      alert("ছবি সেভ করতে সমস্যা হয়েছে। দয়া করে স্ক্রিনশট নিন!");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareText = `🔴 ব্রেকিং নিউজ: ${currentHeadline}\n\n📺 সম্প্রচারে: ${selectedChannel} (লাইভ ফ্রম ${selectedLocation})\n\n👉 আপনিও আপনার বন্ধুর ব্রেকিং নিউজ মিম বানান:\n${typeof window !== 'undefined' ? window.location.origin : ''}`;

  const handleCopyText = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      prompt("নিউজ টেক্সট কপি করুন:", shareText);
    }
  };

  const handleWhatsApp = () => {
    playClickSound();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    playClickSound();
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=500');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 rounded-[32px] border-2 border-red-600/50 shadow-2xl shadow-red-950/70 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-600/30 bg-black/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Tv className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>টিভি ব্রেকিং নিউজ মিম মেকার</span>
                <span className="text-[10px] bg-red-600/40 text-red-200 px-2 py-0.5 rounded-full border border-red-500/50 font-bold uppercase">
                  VIRAL TV FX
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                বন্ধুকে নিয়ে লাইভ টিভির ব্রেকিং নিউজ কার্ড বানান ও ফেসবুকে কাঁপিয়ে দিন!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playNewsIntroSound()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-all text-xs flex items-center gap-1 font-bold"
              title="টিভি ব্রেকিং নিউজ সাউন্ড শুনুন"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">সাউন্ড</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white transition-all"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 1. Live Preview of the Breaking News Card */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-[620px] transition-transform">
              <BreakingNewsCard
                cardRef={cardRef}
                displayName={displayName}
                gender={gender}
                userPhoto={userPhoto}
                channelName={selectedChannel}
                locationName={selectedLocation}
                headline={currentHeadline}
                tickerText={currentTicker}
                district={defaultDistrict}
                division={defaultDivision}
              />
            </div>
          </div>

          {/* 2. Control Form: Name, Channel, Headline, Photo */}
          <div className="bg-slate-900/90 rounded-2xl p-4 md:p-5 border border-red-600/30 space-y-4">
            
            {/* Row 1: Friend's Name, Gender & Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  অভিযুক্ত বন্ধুর নাম:
                </label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="বন্ধুর নাম লিখুন"
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-white font-bold text-xs focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  টিভি চ্যানেল:
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-amber-300 font-bold text-xs focus:border-red-500 outline-none"
                >
                  {channelList.map((ch, idx) => (
                    <option key={idx} value={ch}>🚩 {ch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ঘটনার স্থান:
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-slate-200 font-bold text-xs focus:border-red-500 outline-none"
                >
                  {locationList.map((loc, idx) => (
                    <option key={idx} value={loc}>📍 {loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Headline Presets + Randomize Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ব্রেকিং নিউজ হেডলাইন নির্বাচন করুন:
                </label>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-amber-300 font-bold text-xs active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>🎲 র‍্যান্ডমাইজ</span>
                </button>
              </div>

              <select
                value={selectedHeadlineIdx}
                onChange={(e) => {
                  setSelectedHeadlineIdx(Number(e.target.value));
                  setCustomHeadline('');
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-slate-700 text-white font-bold text-xs focus:border-red-500 outline-none leading-relaxed"
              >
                {headlinePresets.map((fn, idx) => (
                  <option key={idx} value={idx}>
                    {idx + 1}. {fn(displayName)}
                  </option>
                ))}
              </select>

              {/* Or Custom headline input */}
              <div className="mt-2">
                <input
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  placeholder="অথবা নিজের মতো কাস্টম ব্রেকিং হেডলাইন লিখুন..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-dashed border-slate-700 text-amber-200 text-xs font-medium focus:border-red-500 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Row 3: Photo Upload and Sticker Booth Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all flex items-center gap-1.5 active:scale-95">
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  <span>{userPhoto ? 'ছবি পরিবর্তন' : 'বন্ধুর ছবি আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {userPhoto && (
                  <button
                    onClick={() => setUserPhoto(null)}
                    className="px-2.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-rose-300 font-bold border border-red-500/30"
                  >
                    ছবি মুছুন
                  </button>
                )}
              </div>

              {onOpenStickerBooth && (
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenStickerBooth();
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-400/40 text-amber-300 font-black flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>👓 ছবিতে লাল টিপ ও চশমা লাগান</span>
                </button>
              )}
            </div>

          </div>

          {/* 3. Action Buttons: Download, Share, Copy */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all border border-white/20"
            >
              <Download className="w-5 h-5 text-white" />
              <span>{isDownloading ? 'এইচডি ব্রেকিং নিউজ প্রস্তুত হচ্ছে...' : '📥 ব্রেকিং নিউজ কার্ড ডাউনলোড করুন (HD PNG)'}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleFacebook}
                className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>ফেসবুকে শেয়ার</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>হোয়াটসঅ্যাপে পাঠান</span>
              </button>

              <button
                onClick={handleCopyText}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'কপি হয়েছে!' : 'ক্যাপশন কপি'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
