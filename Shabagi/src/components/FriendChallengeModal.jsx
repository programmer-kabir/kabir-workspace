import React, { useState } from 'react';
import { Swords, X, Copy, Check, MessageCircle, Share2, Flame, Sparkles } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function FriendChallengeModal({
  isOpen,
  onClose,
  userName = 'আপনি',
  score = 96,
  gender = 'male'
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const challengeUrl = `${currentUrl}?challenge=true&challenger=${encodeURIComponent(userName)}&challengerScore=${score}&challengerGender=${gender}`;

  const messageText = `⚔️ এই শোন বন্ধু! আমি আঁতেলস্কোপে ${score}% খাঁটি শাহবাগী স্বীকৃতি পেয়েছি! 🚩\nতুই তো সবসময় নিজেকে অনেক বড় বুদ্ধিজীবী আর বিপ্লবী দাবি করিস! তোর দম থাকলে আমার এই স্কোর ভেঙে দেখা!\n\n👇 এই লিংকে ক্লিক করে আমার সাথে ডুয়েল টেস্ট দে:\n${challengeUrl}`;

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleWhatsApp = () => {
    playClickSound();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    playClickSound();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(challengeUrl)}&quote=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-lg rounded-[34px] p-6 md:p-7 shadow-2xl border border-white/40 relative overflow-hidden text-slate-900">
        
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Swords className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              ভাইরাল ফ্রেন্ড ডুয়েল
            </span>
            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
              বন্ধুকে শাহবাগী ডুয়েল চ্যালেঞ্জ পাঠান!
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium mb-4">
          আপনার বন্ধু যখন এই লিংকে ঢুকবে, সে আপনার স্কোর (<span className="font-black text-rose-600">{score}%</span>) দেখতে পাবে এবং টেস্ট শেষ করলে আপনাদের দুইজনের একটি <span className="font-bold text-slate-800">"বনাম (VS) ডুয়েল সনদ"</span> তৈরি হবে!
        </p>

        {/* Message Preview Box */}
        <div className="bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 mb-4 font-mono select-all">
          <p className="whitespace-pre-line leading-relaxed text-[11px]">
            {messageText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleCopy}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'চ্যালেঞ্জ বার্তা কপি হয়েছে!' : 'চ্যালেঞ্জ লিংক ও টেক্সট কপি করুন'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে পাঠান</span>
            </button>

            <button
              onClick={handleFacebook}
              className="py-3 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-black shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>ফেসবুকে শেয়ার</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-500 font-bold mt-3">
          * বন্ধুদের গ্রুপ চ্যাট বা মেসেঞ্জারে পাঠিয়ে দেখুন কে বড় আঁতেল! ☕🔥
        </p>
      </div>
    </div>
  );
}
