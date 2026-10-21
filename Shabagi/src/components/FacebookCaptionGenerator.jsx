import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  AtSign, 
  Flame, 
  RefreshCw,
  Hash
} from 'lucide-react';
import { playClickSound, playSelectSound } from '../utils/audio';

const captionTemplates = [
  {
    id: 'challenge',
    title: '⚔️ বন্ধুদের ওপেন চ্যালেঞ্জ',
    subtitle: 'স্কোর দিয়ে ফ্রেন্ডদের রোস্ট করুন',
    icon: '⚔️',
    getCaption: ({ displayName, score, friends, link }) => 
`অবশেষে আঁতেলস্কোপ জাতীয় ব্যুরো আমাকে ${score}% খাঁটি শাহবাগী সনদ দিল! 🚩 কপালে আড়াই ইঞ্চির লাল টিপ আর কাঁধে শান্তিনিকেতনি ঝোলা ছাড়া আমার কোনো গতি নাই! ☕

আমার ফ্রেন্ডলিস্টের সবচেয়ে বড় আঁতেল ও বুদ্ধিজীবী ${friends}, তোদের দম থাকলে আমার এই স্কোর ভেঙে দেখা! তোরা তো এখনও সাবান দিয়ে গোসল করা ছাড়তে পারিস নাই! 🤣

👇 আমার সাথে ডুয়েল টেস্ট দিতে আর নিজের সনদ নিতে ক্লিক কর:
${link}

#আঁতেলস্কোপ #শাহবাগী_সনদ #বিপ্লব_চলবে #TSC_লালচা`
  },
  {
    id: 'shower',
    title: '🚿 গোসলবিমুখ বন্ধুদের ট্রল',
    subtitle: 'সাবানমুক্ত লাইসেন্স শো-অফ',
    icon: '🚿',
    getCaption: ({ displayName, score, friends, link }) => 
`ব্রেকিং নিউজ! আঁতেলস্কোপ ব্যুরো আমাকে আজীবন সাবানমুক্ত থাকার 'অফিসিয়াল গোসল লাইসেন্স' দিয়েছে! 🧼🚫

আমার ফ্রেন্ডলিস্টের যেসব বন্ধুরা সপ্তাহে একদিনও ঠিকমতো গোসল করিস না—যেমন ${friends}—তোরা অবিলম্বে এই লাইসেন্সটা নিয়ে নে, নয়তো বিপ্লব তোদের ক্ষমা করবে না! 🚿

👇 ফ্রিতে গোসল লাইসেন্স পেতে টেস্ট দে:
${link}

#গোসল_বুর্জোয়া_চক্রান্ত #আঁতেলস্কোপ #সাবান_বয়কট`
  },
  {
    id: 'tea-bill',
    title: '☕ টিএসসি চায়ের বিল ফাঁকিবাজ',
    subtitle: 'টংয়ের চাখোর ফ্রেন্ডদের ট্যাগ',
    icon: '☕',
    getCaption: ({ displayName, score, friends, link }) => 
`টিএসসির টংয়ে আড্ডা মেরে বন্ধুদের দিয়ে চায়ের বিল দেওয়ানোর কারণে আমাকে ১০০% আঁতেল ঘোষণা করা হলো! ☕

এই সনদের সিংহভাগ কৃতিত্ব আমার বন্ধু ${friends} এর, যাদের পকেট কেটে আমি এতোদিন কড়া লিকারের লাল চা খেয়ে আসছি! তোরা কালকে টিএসসিতে আইস, তোদের স্পেশাল চা খাওয়ামু! 🚩

👇 তোর বিল চোর বন্ধুদের ট্যাগ কর আর টেস্ট দে:
${link}

#টিএসসি_লালচা #আঁতেলস্কোপ #কমরেড_চাখোর`
  },
  {
    id: 'intellectual',
    title: '🔴 কপালে লাল টিপ ও বিপ্লবী',
    subtitle: 'সোশ্যাল মিডিয়া বুদ্ধিজীবী লুক',
    icon: '🔴',
    getCaption: ({ displayName, score, friends, link }) => 
`কপালে আড়াই ইঞ্চির সুবিশাল লাল টিপ আর কাঁধে কাপড়ের ঝোলা ছাড়া বিপ্লব কোনোদিন সফল হবে না! 🔴👜

আমার ফ্রেন্ডলিস্টের প্রগতিশীল কমরেড ${friends}, সমাজ পরিবর্তনের ব্যাপারে তোদের কী অভিমত? দ্রুত টেস্ট দিয়ে নিজের সনদের ছবি ফেসবুকে পোস্ট দে! 🔥

👇 নিজের বিপ্লবী সনদ নিতে ক্লিক কর:
${link}

#নীরব_বিপ্লব #আঁতেলস্কোপ #কপালে_লালটিপ`
  },
  {
    id: 'warrant',
    title: '📢 শাহবাগ মোড় অবরোধ ঘোষণা',
    subtitle: 'তাৎক্ষণিক মশাল মিছিল ট্যাগ',
    icon: '🚩',
    getCaption: ({ displayName, score, friends, link }) => 
`জরুরি নোটিশ! চায়ের কাপে সামান্য চিনি বেশি পড়ায় আমরা শাহবাগ মোড় অবরোধের ডাক দিয়েছি! 📢🔥

আমার মশাল মিছিলের প্রধান দুই সহযোদ্ধা ${friends}, তোরা অবিলম্বে ব্যানার নিয়ে রাজপথে হাজির হ! 🚩

👇 আন্দোলন ওয়ারেন্ট ও সনদ পেতে টেস্ট দাও:
${link}

#শাহবাগ_অবরোধ #আঁতেলস্কোপ #বিপ্লবী_কমরেড`
  },
  {
    id: 'district',
    title: '🗺️ জেলা বনাম জেলা ফাইট',
    subtitle: 'নিজের জেলাকে টপে তোলার চ্যালেঞ্জ',
    icon: '🗺️',
    getCaption: ({ displayName, score, friends, link, district = 'ঢাকা', division = 'ঢাকা বিভাগ' }) => 
`🗺️ জাতীয় শাহবাগী ও আঁতেল আদমশুমারিতে আমার জেলা [${district}] (${division}) জাতীয় র‍্যাঙ্কিংয়ে কাঁপিয়ে দিচ্ছে! 🏆🔥

আমার জেলার নিবেদিতপ্রাণ কমরেড ${friends}, তোদের জেলার আঁতেলরা কই? নিজেদের জেলাকে সারাদেশে এক নম্বরে তুলতে দ্রুত টেস্ট দিয়ে ভোট দে! 🚩

👇 নিজের জেলাকে শীর্ষে তুলতে ক্লিক কর:
${link}

#${district.replace(/\s+/g, '_')}_আঁতেল #জেলা_চ্যালেঞ্জ #আঁতেলস্কোপ #জাতীয়_আদমশুমারি`
  }
];

export default function FacebookCaptionGenerator({
  displayName = 'কমরেড',
  score = 98,
  gender = 'female',
  district = 'ঢাকা',
  division = 'ঢাকা বিভাগ',
  challengeLink
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('district');
  const [friendTagInput, setFriendTagInput] = useState('@Friend1 @Friend2');
  const [isCopied, setIsCopied] = useState(false);

  const activeTemplate = captionTemplates.find(t => t.id === selectedTemplateId) || captionTemplates[0];

  const friendsString = friendTagInput.trim() ? friendTagInput.trim() : '@Friend1 @Friend2';
  const fullCaption = activeTemplate.getCaption({
    displayName,
    score,
    friends: friendsString,
    district,
    division,
    link: challengeLink || (typeof window !== 'undefined' ? window.location.origin : '')
  });

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(fullCaption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFacebookPost = () => {
    playClickSound();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(challengeLink || window.location.href)}&quote=${encodeURIComponent(fullCaption)}`;
    window.open(url, '_blank');
  };

  const handleWhatsApp = () => {
    playClickSound();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullCaption)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="glass-card rounded-[32px] p-5 md:p-6 shadow-xl border border-white/50 text-slate-900 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Share2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 leading-none">
              অটো ফ্রেন্ড-ট্যাগিং ফেসবুক ক্যাপশন জেনারেটর
              <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase">
                Viral
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              বন্ধুদের ট্যাগ করে ফেসবুকে পোস্ট দিলে অ্যালগরিদমে সর্বোচ্চ রিচ পাওয়া যায়!
            </p>
          </div>
        </div>
      </div>

      {/* Friend Name/Tag Input */}
      <div>
        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <AtSign className="w-3.5 h-3.5 text-blue-600" />
          বন্ধুদের নাম বা মেনশন লিখুন (যেমন: @রাকিব @তানভীর):
        </label>
        <input
          type="text"
          value={friendTagInput}
          onChange={(e) => setFriendTagInput(e.target.value)}
          placeholder="@সাদিয়া @রাকিব @তানভীর"
          className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <p className="text-[10px] text-slate-500 mt-1 italic">
          * ফেসবুকে পেস্ট করার পর @ এর পরের অক্ষরে ক্লিক করলে ফ্রেন্ডের আসল ফেসবুক আইডি ট্যাগ হয়ে যাবে!
        </p>
      </div>

      {/* Template Selector Pills */}
      <div>
        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          ক্যাপশন স্টাইল বেছে নিন (৫টি ভাইরাল ফরম্যাট):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {captionTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  playSelectSound();
                  setSelectedTemplateId(template.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{template.icon}</span>
                  <span className="text-xs truncate">{template.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Caption Preview Box */}
      <div className="relative bg-slate-950 text-slate-100 p-4 rounded-2xl border border-slate-800 text-xs font-sans shadow-inner">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
          <span>রেডি ফেসবুক পোস্ট প্রিভিউ</span>
          <span className="text-emerald-400 font-bold">✓ ফ্রেন্ড ট্যাগিং রেডি</span>
        </div>
        <p className="whitespace-pre-line leading-relaxed text-[11px] font-medium text-slate-200 select-all">
          {fullCaption}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        <button
          onClick={handleCopy}
          className="py-3 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{isCopied ? 'ক্যাপশন কপি হয়েছে!' : 'সম্পূর্ণ ক্যাপশন কপি'}</span>
        </button>

        <button
          onClick={handleFacebookPost}
          className="py-3 px-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>ফেসবুকে শেয়ার করুন</span>
        </button>

        <button
          onClick={handleWhatsApp}
          className="py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>হোয়াটসঅ্যাপে পাঠান</span>
        </button>
      </div>
    </div>
  );
}
