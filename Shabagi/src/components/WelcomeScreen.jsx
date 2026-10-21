import React, { useRef } from 'react';
import { 
  Flame, 
  Sparkles, 
  ArrowRight, 
  User, 
  Users, 
  Camera, 
  Upload, 
  X, 
  AlertCircle, 
  Radio, 
  CheckCircle2,
  Scan,
  Skull,
  Swords,
  Tv,
  ShieldCheck,
  MapPin,
  Trophy
} from 'lucide-react';
import { playClickSound, playRoastSound } from '../utils/audio';
import ChallengerWelcomeBanner from './ChallengerWelcomeBanner';
import { divisionsData, getDistrictsForDivision, getDistrictTitle } from '../data/districts';

export default function WelcomeScreen({ 
  onStart, 
  userName, 
  setUserName, 
  gender, 
  setGender, 
  userPhoto, 
  setUserPhoto, 
  userDivision = 'ঢাকা বিভাগ',
  setUserDivision,
  userDistrict = 'ঢাকা',
  setUserDistrict,
  challenger, 
  onOpenRoastModal, 
  onOpenStickerBooth,
  onOpenScannerModal,
  onOpenNewsModal,
  onOpenPassportModal,
  onOpenCensusModal
}) {
  const fileInputRef = useRef(null);

  const handleStart = () => {
    playClickSound();
    onStart();
  };

  const handleSelectGender = (selected) => {
    playClickSound();
    setGender(selected);
  };

  const handleImageChange = (e) => {
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

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setUserPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFemale = gender === 'female';

  return (
    <div className="w-full max-w-xl md:max-w-2xl mx-auto px-4 py-4 md:py-8 animate-fadeIn">
      
      {/* Challenger Welcome Banner (If friend challenged) */}
      {challenger && (
        <ChallengerWelcomeBanner
          challenger={challenger}
          onAccept={handleStart}
        />
      )}

      {/* Satirical Live Breaking News Ticker */}
      <div className="w-full mb-4 overflow-hidden rounded-2xl bg-black/40 border border-white/20 backdrop-blur-md p-2 flex items-center gap-2 text-xs text-white/90 shadow-md">
        <span className="flex items-center gap-1 bg-red-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase animate-pulse flex-shrink-0">
          <Radio className="w-3 h-3" />
          ব্রেকিং
        </span>
        <div className="whitespace-nowrap overflow-hidden text-ellipsis font-medium text-amber-200">
          📢 টিএসসিতে চায়ের দাম ১ টাকা বাড়ায় ৩ দিনের শাহবাগ অবরোধের ডাক! • 🔴 কপালে আড়াই ইঞ্চি লাল টিপ পরার বিশেষ নির্দেশ জারি!
        </div>
      </div>

      {/* Live community counter badge */}
      <div className="flex items-center justify-center mb-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/35 backdrop-blur-md text-white text-xs md:text-sm font-bold shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <Users className="w-4 h-4 text-amber-300" />
          <span>আজ পর্যন্ত ৭৯,৫১০ জন সনদ ও লাইসেন্স নিয়েছেন</span>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="glass-card rounded-[38px] p-6 md:p-9 shadow-2xl relative overflow-hidden border border-white/60">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/25 rounded-full blur-3xl pointer-events-none"></div>

        {/* Hero Graphic / Uploaded Photo Preview */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            {userPhoto ? (
              <div className="relative group">
                <img
                  src={userPhoto}
                  alt="আপনার ছবি"
                  className="w-24 h-24 rounded-full object-cover border-4 border-rose-500 shadow-xl shadow-rose-500/30"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition-all"
                  title="ছবি মুছুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-22 h-22 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 p-1 shadow-2xl shadow-rose-500/35 animate-float cursor-pointer group"
                title="নিজের ছবি আপলোড করতে ক্লিক করুন"
              >
                <div className="w-full h-full bg-gradient-to-tr from-red-700 via-rose-600 to-amber-500 rounded-[22px] flex flex-col items-center justify-center text-white relative overflow-hidden p-2">
                  <span className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform">
                    {isFemale ? '👩🏻‍🦰' : '🧔🏻'}
                  </span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}

            <span className="absolute -bottom-1 -right-1 bg-white text-rose-600 p-1.5 rounded-full shadow-md border border-rose-100">
              <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-xs mb-2 border border-rose-200">
            <span>🔥 কাস্টমাইজড জেন্ডার শাহবাগী টেস্ট</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            আঁতেলস্কোপ ৩.০ (AntelScope™)
          </h2>
          <p className="text-xs md:text-sm font-extrabold text-rose-600 mt-1 uppercase tracking-wider">
            জাতীয় শাহবাগী, কপালে টিপ ও আঁতেল সনাক্তকারী স্যাটেলাইট রাডার
          </p>
          <p className="mt-2 text-slate-600 text-sm md:text-base leading-relaxed max-w-lg font-medium">
            যাচাই করুন আপনার রক্তে কতটুকু খাঁটি শাহবাগী চেতনা! কপালে টিপ, কাঁধে ঝোলা, মত প্রকাশের স্বাধীনতা, ধর্মনিরপেক্ষতা ও গোসল বর্জনের ১২টি মজার প্রশ্নের উত্তর দিয়ে বুঝে নিন আপনার ৫টি এক্সক্লুসিভ সনদ।
          </p>
        </div>

        {/* STEP 1: GENDER SELECTION (Crucial User Requirement) */}
        <div className="mt-5 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/90">
          <label className="block text-xs font-black text-slate-800 mb-2 text-center">
            👇 প্রথমে আপনার জেন্ডার সিলেক্ট করুন (প্রশ্নমালা স্বয়ংক্রিয় পরিবর্তিত হবে):
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectGender('female')}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                isFemale
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-[1.02]'
                  : 'bg-white hover:bg-rose-50/50 text-slate-700 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl">👩</span>
                <span className="font-black text-sm">মেয়ে (Girl)</span>
                {isFemale && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <span className={`text-[10px] ${isFemale ? 'text-rose-100 font-bold' : 'text-slate-500'}`}>
                কপালে বড় লাল টিপ, শাড়ি ও স্নিকার্স
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectGender('male')}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                !isFemale
                  ? 'bg-red-600 text-white border-red-700 shadow-md scale-[1.02]'
                  : 'bg-white hover:bg-rose-50/50 text-slate-700 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl">👨</span>
                <span className="font-black text-sm">ছেলে (Boy)</span>
                {!isFemale && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <span className={`text-[10px] ${!isFemale ? 'text-rose-100 font-bold' : 'text-slate-500'}`}>
                উশকোখুশকো চুল, লাল চা ও কুর্তি
              </span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-2 text-center">
            <span className="text-xl block mb-0.5">{isFemale ? '🔴' : '☕'}</span>
            <p className="text-[11px] font-black text-slate-800">{isFemale ? 'কপালে লাল টিপ' : 'টিএসসি লাল চা'}</p>
            <p className="text-[9px] text-slate-500">{isFemale ? 'ভার্চুয়াল টিপ স্টিকার' : 'টংয়ের আড্ডা স্পেশাল'}</p>
          </div>
          <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-2 text-center">
            <span className="text-xl block mb-0.5">🚿</span>
            <p className="text-[11px] font-black text-slate-800">গোসল লাইসেন্স</p>
            <p className="text-[9px] text-slate-500">১০০% সাবানমুক্ত আইডি</p>
          </div>
          <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-2 text-center">
            <span className="text-xl block mb-0.5">📜</span>
            <p className="text-[11px] font-black text-slate-800">৫টি কার্ড অ্যালবাম</p>
            <p className="text-[9px] text-slate-500">৮৫%+ স্কোর গ্যারান্টি</p>
          </div>
        </div>

        {/* Form: Name & Photo Upload */}
        <div className="mt-4 space-y-3.5">
          {/* User Name input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-rose-600" />
              আপনার নাম (সনদপত্রে লেখার জন্য):
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={isFemale ? "উদাঃ কমরেড তাসনুভা / বিপ্লবী রুমানা" : "উদাঃ কমরেড রাকিব / আঁতেল সুমন"}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 outline-none transition-all text-sm font-semibold text-slate-800 bg-white/90 shadow-inner"
            />
          </div>

          {/* DIVISION & DISTRICT SELECTOR (Separated 2 dropdowns as user requested) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-red-500/10 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>আপনার বিভাগ ও জেলা নির্বাচন করুন:</span>
              </label>

              {onOpenCensusModal && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenCensusModal();
                  }}
                  className="text-[11px] font-black text-rose-600 hover:text-red-700 underline flex items-center gap-1 active:scale-95"
                >
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span>জাতীয় জেলা আদমশুমারি</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ১. বিভাগ (Division):
                </label>
                <select
                  value={userDivision}
                  onChange={(e) => {
                    playClickSound();
                    const newDiv = e.target.value;
                    setUserDivision && setUserDivision(newDiv);
                    const dists = getDistrictsForDivision(newDiv);
                    if (!dists.includes(userDistrict)) {
                      setUserDistrict && setUserDistrict(dists[0]);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-inner focus:border-rose-500 outline-none"
                >
                  {divisionsData.map((d) => (
                    <option key={d.id} value={d.name}>
                      🚩 {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ২. জেলা (District):
                </label>
                <select
                  value={userDistrict}
                  onChange={(e) => {
                    playClickSound();
                    setUserDistrict && setUserDistrict(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-red-700 bg-white shadow-inner focus:border-rose-500 outline-none"
                >
                  {getDistrictsForDivision(userDivision).map((dst, idx) => (
                    <option key={idx} value={dst}>
                      📍 {dst} জেলা
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected District Satirical Title & Census Link */}
            <div className="flex items-center justify-between text-[11px] bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-amber-400/40">
              <span className="text-slate-700 font-bold truncate">
                উপাধি: <strong className="text-red-700">"{getDistrictTitle(userDistrict)}"</strong>
              </span>
              {onOpenCensusModal && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenCensusModal();
                  }}
                  className="text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-lg font-black text-[10px] ml-2 flex-shrink-0 active:scale-95"
                >
                  📊 র‍্যাঙ্ক দেখুন
                </button>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Photo upload, Sticker Booth, and Scanner action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-2 rounded-2xl border border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/60 hover:bg-rose-50 text-rose-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Upload className="w-3.5 h-3.5 text-rose-600" />
              <span>{userPhoto ? 'ছবি বদল' : 'ছবি যোগ'}</span>
            </button>

            {onOpenStickerBooth && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenStickerBooth();
                }}
                className="py-2.5 px-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-300 text-slate-800 text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
              >
                <span>👓 স্টিকার বুথ</span>
              </button>
            )}

            {onOpenScannerModal && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenScannerModal();
                }}
                className="py-2.5 px-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
              >
                <Scan className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                <span>🔍 ফেস স্ক্যানার</span>
              </button>
            )}
          </div>

          {/* Start Quiz Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-base shadow-xl shadow-rose-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 group border border-white/20 mt-1"
          >
            <span>{isFemale ? 'নারী বিপ্লবী টেস্ট শুরু করুন' : 'কমরেড টেস্ট শুরু করুন'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          {/* Quick Friend Roast Direct CTA */}
          {onOpenRoastModal && (
            <button
              type="button"
              onClick={() => {
                playRoastSound();
                onOpenRoastModal();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-black text-xs md:text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 border border-white/30"
            >
              <Skull className="w-4 h-4 text-white" />
              <span>🔥 কুইজ ছাড়া সরাসরি বন্ধুকে "শাহবাগী রোস্ট ও শোকজ সনদ" পাঠান</span>
            </button>
          )}

          {/* Quick Breaking News Direct CTA */}
          {onOpenNewsModal && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenNewsModal();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-black text-xs md:text-sm shadow-lg shadow-red-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 border border-white/30"
            >
              <Tv className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>📺 বন্ধুকে নিয়ে "টিভি ব্রেকিং নিউজ মিম" বানান (যমুনা ও সময় টিভি স্টাইল)</span>
            </button>
          )}

          {/* Quick Passport Direct CTA */}
          {onOpenPassportModal && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenPassportModal();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-700 hover:from-emerald-900 hover:to-teal-900 text-white font-black text-xs md:text-sm shadow-lg shadow-emerald-900/30 active:scale-98 transition-all flex items-center justify-center gap-2 border border-emerald-400/40"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>🛂 নিজের নামে "গণপ্রজাতন্ত্রী শাহবাগী কমরেড পাসপোর্ট" তৈরি করুন</span>
            </button>
          )}

          {/* Quick National Census Direct CTA */}
          {onOpenCensusModal && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenCensusModal();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-black text-xs md:text-sm shadow-lg shadow-amber-900/30 active:scale-98 transition-all flex items-center justify-center gap-2 border border-amber-400/40"
            >
              <Trophy className="w-4 h-4 text-amber-200 animate-bounce" />
              <span>🗺️ জাতীয় শাহবাগী আদমশুমারি ও জেলা র‍্যাঙ্কিং (কোন জেলায় কতজন?)</span>
            </button>
          )}
        </div>

        {/* Humorous Disclaimer */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2 text-slate-400 text-[11px] leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            * এটি সম্পূর্ণ রম্য ও স্যাটায়ারধর্মী বিনোদনমূলক টেস্ট। কাউকে আঘাত করা উদ্দেশ্য নয়। কপালে টিপ, কাঁধে ঝোলা ও গোসল বর্জনের স্যাটায়ার শুধু বিনোদনের জন্য উপভোগ করুন!
          </p>
        </div>
      </div>
    </div>
  );
}
