import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  MessageCircle,
  Award,
  Stamp
} from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import ShabagiPassportCard from './cards/ShabagiPassportCard';
import { playClickSound, playStampSound } from '../utils/audio';
import { divisionsData, getDistrictsForDivision } from '../data/districts';

const bloodGroups = [
  'চা পজিটিভ (Tea+)',
  'ক্যাফেইন ও+ (Caffeine O+)',
  'কড়া লিকার এবি+ (Liquer AB+)',
  'চিনিমুক্ত লাল চা (Pure Red Tea)'
];

const birthPlaces = [
  'টিএসসি টংয়ের আড্ডা, ঢাকা',
  'আজিজ সুপার মার্কেট ৩য় তলা',
  'মধুর ক্যান্টিন, ঢাবি',
  'চারুকলা বকুলতলা',
  'শাহবাগ ওভারব্রিজের মোড়'
];

const identMarks = [
  'কপালে আড়াই ইঞ্চি সুবিশাল লাল টিপ ও কাঁধে শান্তিনিকেতনি রঙচটা ঝোলা ব্যাগ',
  'উশকোখুশকো অবিন্যস্ত চুল ও সাবানমুক্ত প্রাকৃতিক ত্বক',
  'হাতে মাটির ভাঁড়ে কড়া লিকারের লাল চা ও বিপ্লবী দৃষ্টিভঙ্গি',
  'শাড়ির নিচে স্নিকার্স ও চোখে ফ্রয়েডিয়ান তত্ত্ব অনুসন্ধানী গোল চশমা',
  'সোশ্যাল মিডিয়ায় দাঁড়ি-কমা ছাড়া ২০ লাইনের জটিল স্ট্যাটাস দেওয়ার মুখভঙ্গি'
];

export default function PassportModal({
  isOpen,
  onClose,
  defaultName = '',
  defaultGender = 'female',
  defaultPhoto = null,
  defaultDivision = 'ঢাকা বিভাগ',
  defaultDistrict = 'ঢাকা',
  onUpdateLocation,
  onOpenStickerBooth
}) {
  const [comradeName, setComradeName] = useState(defaultName || 'কমরেড তাসনুভা');
  const [gender, setGender] = useState(defaultGender);
  const [userPhoto, setUserPhoto] = useState(defaultPhoto || null);
  const [selectedDivision, setSelectedDivision] = useState(defaultDivision || 'ঢাকা বিভাগ');
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict || 'ঢাকা');
  const [selectedBlood, setSelectedBlood] = useState(bloodGroups[0]);
  const [selectedBirth, setSelectedBirth] = useState(birthPlaces[0]);
  const [selectedIdentIdx, setSelectedIdentIdx] = useState(0);
  const [passportSerial, setPassportSerial] = useState('SHB2026-TEA-99');

  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const currentDistricts = getDistrictsForDivision(selectedDivision);

  const handleDivisionChange = (divName) => {
    playClickSound();
    setSelectedDivision(divName);
    const dists = getDistrictsForDivision(divName);
    const newDist = dists.includes(selectedDistrict) ? selectedDistrict : dists[0];
    setSelectedDistrict(newDist);
    if (onUpdateLocation) onUpdateLocation(divName, newDist);
  };

  const handleDistrictChange = (distName) => {
    playClickSound();
    setSelectedDistrict(distName);
    if (onUpdateLocation) onUpdateLocation(selectedDivision, distName);
  };

  const displayName = comradeName.trim() || (gender === 'female' ? 'কমরেড তাসনুভা' : 'কমরেড আঁতেল');

  const handleRandomize = () => {
    playStampSound();
    const nextIdent = (selectedIdentIdx + 1) % identMarks.length;
    const nextBlood = (bloodGroups.indexOf(selectedBlood) + 1) % bloodGroups.length;
    const nextBirth = (birthPlaces.indexOf(selectedBirth) + 1) % birthPlaces.length;
    const randomSerial = `SHB2026-${Math.floor(1000 + Math.random() * 9000)}-TEA`;
    
    setSelectedIdentIdx(nextIdent);
    setSelectedBlood(bloodGroups[nextBlood]);
    setSelectedBirth(birthPlaces[nextBirth]);
    setPassportSerial(randomSerial);
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
    playStampSound();
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#064e3b',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `shabagi-passport-${displayName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Download error:', err);
      alert("পাসপোর্ট সেভ করতে সমস্যা হয়েছে। দয়া করে স্ক্রিনশট নিন!");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareText = `🛂 আমার অফিসিয়াল "গণপ্রজাতন্ত্রী শাহবাগী কমরেড পাসপোর্ট" তৈরি হয়ে গেছে!\n\n🚩 নাম: কমরেড ${displayName}\n📍 জেলা ঘাঁটি: [${selectedDistrict}] (${selectedDivision})\n🩸 রক্তের গ্রুপ: ${selectedBlood}\n🔍 শনাক্তকারী চিহ্ন: ${identMarks[selectedIdentIdx]}\n\n👉 আপনিও নিজের নামের অফিসিয়াল শাহবাগী ই-পাসপোর্ট নিন:\n${typeof window !== 'undefined' ? window.location.origin : ''}`;

  const handleCopyText = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      prompt("পাসপোর্ট টেক্সট কপি করুন:", shareText);
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
      <div className="relative w-full max-w-4xl bg-slate-950 rounded-[32px] border-2 border-emerald-600/60 shadow-2xl shadow-emerald-950/70 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-600/30 bg-emerald-950/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-amber-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>গণপ্রজাতন্ত্রী শাহবাগী কমরেড পাসপোর্ট</span>
                <span className="text-[10px] bg-emerald-600/40 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40 font-bold uppercase">
                  e-PASSPORT FX
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                জাতীয় বায়োমেট্রিক শাহবাগী ডেটা পেজ ও আইসিএও এমআরজেড বারকোড সহ অফিসিয়াল পাসপোর্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playStampSound()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-all text-xs flex items-center gap-1 font-bold"
              title="অফিসিয়াল সিলমোহর সাউন্ড শুনুন"
            >
              <span>🔊 সিলমোহর</span>
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
          
          {/* 1. Live Preview of the Passport Card */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-[620px] transition-transform">
              <ShabagiPassportCard
                cardRef={cardRef}
                displayName={displayName}
                gender={gender}
                userPhoto={userPhoto}
                passportNo={passportSerial}
                division={selectedDivision}
                district={selectedDistrict}
                bloodGroup={selectedBlood}
                birthPlace={selectedBirth}
                identMark={identMarks[selectedIdentIdx]}
              />
            </div>
          </div>

          {/* 2. Passport Data Customization Form */}
          <div className="bg-slate-900/90 rounded-2xl p-4 md:p-5 border border-emerald-600/30 space-y-4">
            
            {/* Row 1: Name, Gender & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  পাসপোর্টধারীর নাম:
                </label>
                <input
                  type="text"
                  value={comradeName}
                  onChange={(e) => setComradeName(e.target.value)}
                  placeholder="আপনার বা বন্ধুর নাম"
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-white font-bold text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  জেন্ডার নির্বাচন:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setGender('female');
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      gender === 'female'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-black/60 text-slate-300 border-slate-700'
                    }`}
                  >
                    👩 নারী (টিপ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setGender('male');
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      gender === 'male'
                        ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                        : 'bg-black/60 text-slate-300 border-slate-700'
                    }`}
                  >
                    👨 পুরুষ (চুল)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  রক্তের গ্রুপ:
                </label>
                <select
                  value={selectedBlood}
                  onChange={(e) => setSelectedBlood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-amber-300 font-bold text-xs focus:border-emerald-500 outline-none"
                >
                  {bloodGroups.map((b, idx) => (
                    <option key={idx} value={b}>🩸 {b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Division & District Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-emerald-600/30">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  বিভাগ নির্বাচন (DIVISION):
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-xs focus:border-amber-400 outline-none"
                >
                  {divisionsData.map((d) => (
                    <option key={d.id} value={d.name}>
                      🚩 {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">
                  জেলা নির্বাচন (DISTRICT):
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs focus:border-emerald-400 outline-none"
                >
                  {currentDistricts.map((dst, idx) => (
                    <option key={idx} value={dst}>
                      📍 {dst} জেলা
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Place of Birth & Identification Mark with Randomize */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  জন্মস্থান (বিপ্লবী উৎস):
                </label>
                <select
                  value={selectedBirth}
                  onChange={(e) => setSelectedBirth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-slate-200 font-bold text-xs focus:border-emerald-500 outline-none"
                >
                  {birthPlaces.map((bp, idx) => (
                    <option key={idx} value={bp}>📍 {bp}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    শনাক্তকারী চিহ্ন:
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-bold active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>🎲 নতুন ডাটা র‍্যান্ডমাইজ</span>
                  </button>
                </div>
                <select
                  value={selectedIdentIdx}
                  onChange={(e) => setSelectedIdentIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-700 text-emerald-300 font-bold text-xs focus:border-emerald-500 outline-none"
                >
                  {identMarks.map((im, idx) => (
                    <option key={idx} value={idx}>
                      {idx + 1}. {im}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Photo Upload and Sticker Booth Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all flex items-center gap-1.5 active:scale-95">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{userPhoto ? 'ছবি পরিবর্তন' : 'পাসপোর্ট ছবি আপলোড'}</span>
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
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-400/40 text-amber-300 font-black flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>👓 ছবিতে কপালে লাল টিপ ও চশমা লাগান</span>
                </button>
              )}
            </div>

          </div>

          {/* 3. Action Buttons: Download, Share, Copy */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-700 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2 active:scale-98 transition-all border border-white/20"
            >
              <Download className="w-5 h-5 text-white" />
              <span>{isDownloading ? 'এইচডি পাসপোর্ট প্রস্তুত হচ্ছে...' : '📥 শাহবাগী কমরেড পাসপোর্ট ডাউনলোড করুন (HD PNG)'}</span>
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
                <span>{isCopied ? 'কপি হয়েছে!' : 'পাসপোর্ট ডাটা কপি'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
