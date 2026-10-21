import React, { useState, useRef } from 'react';
import { 
  Skull, 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Camera, 
  Sparkles, 
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import FriendRoastNoticeCard from './cards/FriendRoastNoticeCard';
import { playClickSound, playRoastSound } from '../utils/audio';

const roastReasons = [
  "সপ্তাহে একদিনও গোসল না করে ফ্রয়েড ও মার্ক্স চর্চা করা",
  "টিএসসিতে গিয়ে বন্ধুদের পকেট কেটে চায়ের বিল দেওয়ানো",
  "দাঁড়ি-কমা ছাড়া ২০ লাইনের অতি-জটিল মেটাফোরিক্যাল কবিতা লিখে সবাইকে ট্রমাটাইজ করা",
  "চায়ের কাপে সামান্য চিনি বেশি পড়ায় শাহবাগ মোড় অবরোধের হুমকি দেওয়া",
  "শাড়ির নিচে স্নিকার্স পরে এসে পুঁজিতন্ত্র ধ্বংসের লেকচার মারা",
  "প্রেম ভেঙে গেলে ক্যাফেতে বসে নিও-লিবারেল পুঁজিবাদকে দোষারোপ করা"
];

const roastPenalties = [
  "সমস্ত বন্ধুদের নিজ খরচে ৩ কাপ মালাই চা খাওয়ানো এবং ফেসবুকে ক্ষমা চাওয়া!",
  "ফেসবুক লাইভে এসে সাবান ও শ্যাম্পু দিয়ে মাথা ধোয়ার প্রমাণ দেওয়া!",
  "টিএসসির পায়রা চত্বরে দাঁড়িয়ে 'আমি আর জ্ঞান দেব না' বলে কান ধরে উঠবস করা!",
  "সব বন্ধুদের এক প্লেট করে বিরিয়ানি খাইয়ে পাপস্খলন করা!"
];

export default function FriendRoastModal({
  isOpen,
  onClose,
  defaultSenderName = 'কমরেড বন্ধু'
}) {
  const [friendName, setFriendName] = useState('কমরেড রাকিব');
  const [friendGender, setFriendGender] = useState('male');
  const [friendPhoto, setFriendPhoto] = useState(null);
  const [hasVirtualTeep, setHasVirtualTeep] = useState(false);
  const [selectedReasonIdx, setSelectedReasonIdx] = useState(0);
  const [selectedPenaltyIdx, setSelectedPenaltyIdx] = useState(0);
  const [roastScore, setRoastScore] = useState(98);
  const [senderName, setSenderName] = useState(defaultSenderName || 'আপনার শুভাকাঙ্ক্ষী বন্ধু');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const cardRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFriendPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRandomize = () => {
    playRoastSound();
    const newReason = Math.floor(Math.random() * roastReasons.length);
    const newPenalty = Math.floor(Math.random() * roastPenalties.length);
    const newScore = Math.floor(Math.random() * 5) + 95; // 95 to 99
    setSelectedReasonIdx(newReason);
    setSelectedPenaltyIdx(newPenalty);
    setRoastScore(newScore);
  };

  const handleDownload = async () => {
    playClickSound();
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#fffbeb',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `roast-notice-${encodeURIComponent(friendName)}-${roastScore}percent.png`;
      link.href = dataUrl;
      link.click();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } catch (err) {
      alert("কার্ড ডাউনলোডে সমস্যা হয়েছে। দয়া করে স্ক্রিনশট নিন!");
    } finally {
      setIsDownloading(false);
    }
  };

  const roastCaption = `🚨 জরুরি শোকজ নোটিশ: আঁতেলস্কোপ জাতীয় ব্যুরো থেকে আমাদের বন্ধু @${friendName}-এর নামে এই অফিসিয়াল রোস্ট সনদ জারি করা হলো! 🤣\n\n📌 অভিযোগ: "${roastReasons[selectedReasonIdx]}"\n⚖️ শাস্তি: ${roastPenalties[selectedPenaltyIdx]}\n\nবন্ধু তুই দ্রুত জরিমানা দে, নয়তো শাহবাগ মোড়ে তোকে নিয়ে মানববন্ধন হবে! 🚩☕\nটেস্ট দিয়ে নিজের সনদ যাচাই করতে: ${typeof window !== 'undefined' ? window.location.origin : ''}`;

  const handleCopyCaption = () => {
    playClickSound();
    navigator.clipboard.writeText(roastCaption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    playClickSound();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(roastCaption)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="glass-card w-full max-w-4xl rounded-[36px] p-5 md:p-8 shadow-2xl border border-white/40 relative my-auto max-h-[95vh] overflow-y-auto no-scrollbar text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-90 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Skull className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              বন্ধু পঁচানি মোড
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              বন্ধুর নামে অফিসিয়াল শাহবাগী শোকজ / রোস্ট সনদ বানান!
            </h3>
          </div>
        </div>

        {/* Main Grid: Left Controls, Right Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Friend Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                বন্ধুর নাম:
              </label>
              <input
                type="text"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="যেমন: কমরেড তানভীর বা সাদিয়া"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-300 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
              />
            </div>

            {/* Gender Toggle */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                বন্ধুর জেন্ডার:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFriendGender('female');
                    setHasVirtualTeep(true);
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    friendGender === 'female'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  <span>👩🏻‍🦰 নারী কমরেড</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFriendGender('male');
                    setHasVirtualTeep(false);
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    friendGender === 'male'
                      ? 'bg-red-700 text-white shadow'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  <span>🧔🏻 পুরুষ কমরেড</span>
                </button>
              </div>
            </div>

            {/* Photo Upload & Teep Toggle */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Camera className="w-4 h-4 text-rose-600" />
                <span>{friendPhoto ? 'ছবি পরিবর্তন' : 'বন্ধুর ছবি আপলোড'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHasVirtualTeep(!hasVirtualTeep)}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1 border transition-all ${
                  hasVirtualTeep
                    ? 'bg-red-100 border-red-400 text-red-700'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                <span>🔴 কপালে লাল টিপ</span>
              </button>
            </div>

            {/* Select Crime */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  আনীত অভিযোগ:
                </label>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> র‍্যান্ডমাইজ
                </button>
              </div>
              <select
                value={selectedReasonIdx}
                onChange={(e) => setSelectedReasonIdx(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-300 font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
              >
                {roastReasons.map((reason, idx) => (
                  <option key={idx} value={idx}>{reason}</option>
                ))}
              </select>
            </div>

            {/* Select Penalty */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                নির্ধারিত শাস্তি:
              </label>
              <select
                value={selectedPenaltyIdx}
                onChange={(e) => setSelectedPenaltyIdx(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-300 font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
              >
                {roastPenalties.map((pen, idx) => (
                  <option key={idx} value={idx}>{pen}</option>
                ))}
              </select>
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                আপনার নাম (প্রেরক):
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="যেমন: কমরেড কবীর"
                className="w-full px-4 py-2 rounded-2xl bg-white border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
              />
            </div>
          </div>

          {/* Preview & Action Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              কার্ড প্রিভিউ (সরাসরি ডাউনলোড করার জন্য প্রস্তুত):
            </div>

            {/* The Actual Rendered Card */}
            <FriendRoastNoticeCard
              cardRef={cardRef}
              friendName={friendName || 'কমরেড বন্ধু'}
              friendGender={friendGender}
              friendPhoto={friendPhoto}
              roastReason={roastReasons[selectedReasonIdx]}
              roastPenalty={roastPenalties[selectedPenaltyIdx]}
              roastScore={roastScore}
              senderName={senderName || 'আপনার শুভাকাঙ্ক্ষী বন্ধু'}
              hasVirtualTeep={hasVirtualTeep}
            />

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'রোস্ট নোটিশ ডাউনলোড হচ্ছে...' : 'রোস্ট নোটিশ ডাউনলোড করুন (ছবি হিসেবে)'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyCaption}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'ক্যাপশন কপি হয়েছে!' : 'ফেসবুক ক্যাপশন কপি'}</span>
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপে পাঠান</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
