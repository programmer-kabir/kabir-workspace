import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Trophy, 
  Users, 
  Flame, 
  Sparkles, 
  Share2, 
  MessageCircle, 
  Check, 
  Copy,
  ChevronRight,
  TrendingUp,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  divisionsData, 
  initialDistrictCounts, 
  getDistrictsForDivision, 
  getDistrictTitle 
} from '../data/districts';
import { playClickSound, playVictorySound } from '../utils/audio';

export default function DistrictCensusModal({
  isOpen,
  onClose,
  userDivision = 'ঢাকা বিভাগ',
  userDistrict = 'ঢাকা',
  onSelectDistrict
}) {
  const [selectedDivision, setSelectedDivision] = useState(userDivision || 'ঢাকা বিভাগ');
  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || 'ঢাকা');
  const [districtCounts, setDistrictCounts] = useState(initialDistrictCounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const currentDistricts = getDistrictsForDivision(selectedDivision);

  const handleDivisionChange = (divName) => {
    playClickSound();
    setSelectedDivision(divName);
    const newDistricts = getDistrictsForDivision(divName);
    if (!newDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(newDistricts[0]);
    }
  };

  const handleDistrictChange = (distName) => {
    playClickSound();
    setSelectedDistrict(distName);
    if (onSelectDistrict) onSelectDistrict(selectedDivision, distName);
  };

  const handleAddCensusVote = () => {
    if (hasVoted) return;
    playVictorySound();
    setHasVoted(true);

    setDistrictCounts(prev => {
      const exists = prev.find(d => d.district === selectedDistrict);
      if (exists) {
        return prev.map(d => d.district === selectedDistrict ? { ...d, count: d.count + 1 } : d)
          .sort((a, b) => b.count - a.count);
      } else {
        return [...prev, { district: selectedDistrict, division: selectedDivision, count: 1200, badge: '🔥 সক্রিয় কমরেড' }]
          .sort((a, b) => b.count - a.count);
      }
    });

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  // Find rank of selected district
  const sortedDistricts = [...districtCounts].sort((a, b) => b.count - a.count);
  const districtRankIndex = sortedDistricts.findIndex(d => d.district === selectedDistrict);
  const currentRank = districtRankIndex !== -1 ? districtRankIndex + 1 : 'সেরা ২০-এ';
  const currentCount = sortedDistricts.find(d => d.district === selectedDistrict)?.count || '৩,০০০+';
  const currentSatiricalTitle = getDistrictTitle(selectedDistrict);

  // Filtered leaderboard
  const filteredLeaderboard = sortedDistricts.filter(item => 
    item.district.includes(searchQuery.trim()) || item.division.includes(searchQuery.trim())
  );

  const totalRegisteredCount = districtCounts.reduce((acc, curr) => acc + curr.count, 0) + 14200;

  const shareText = `🗺️ জাতীয় শাহবাগী ও আঁতেল আদমশুমারি ২০২৬!\n\n🚩 আমার জেলা: [${selectedDistrict}] (${selectedDivision})\n🏆 জাতীয় র‍্যাঙ্কিং: ${currentRank} নং শীর্ষ জেলা!\n👥 নিবন্ধিত আঁতেল: ${currentCount} জন!\n🎖️ উপাধি: ${currentSatiricalTitle}\n\n⚔️ তোদের জেলার আঁতেলরা কই? নিজেদের জেলাকে টপে তোল:\n${typeof window !== 'undefined' ? window.location.origin : ''}`;

  const handleShareFacebook = () => {
    playClickSound();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    playClickSound();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopy = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (e) {
      prompt("কপি করুন:", shareText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 rounded-[32px] border-2 border-amber-500/50 shadow-2xl shadow-amber-950/70 overflow-hidden my-4 max-h-[92vh] flex flex-col text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/30 bg-black/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md">
              <MapPin className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>জাতীয় শাহবাগী আদমশুমারি ও জেলা র‍্যাঙ্কিং</span>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 font-bold uppercase">
                  CENSUS 2026
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                কোন বিভাগে ও কোন জেলায় কতজন আঁতেল সনদ নিয়েছেন তা দেখুন ও জেলাকে শীর্ষে তুলুন!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white transition-all"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Total Census Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-black to-amber-950/70 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                সারাদেশে লাইভ নিবন্ধিত শাহবাগী ও কমরেড সংখ্যা:
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                {totalRegisteredCount.toLocaleString('bn-BD')} <span className="text-base font-bold text-amber-300">জন সনদধারী</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCensusVote}
                disabled={hasVoted}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md ${
                  hasVoted
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white active:scale-95'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hasVoted ? '✓ আপনার জেলা কাউন্ট হয়েছে!' : '+১ নিজ জেলাকে ভোট দিন'}</span>
              </button>
            </div>
          </div>

          {/* Division & District Selection Row */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-3">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📍 আপনার বিভাগ ও জেলা সিলেক্ট করুন:</span>
            </h4>

            {/* Division Pills */}
            <div className="flex flex-wrap gap-1.5">
              {divisionsData.map((div) => {
                const isSelected = selectedDivision === div.name;
                return (
                  <button
                    key={div.id}
                    onClick={() => handleDivisionChange(div.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-black/60 text-slate-300 border-slate-700 hover:bg-white/10'
                    }`}
                  >
                    {div.name}
                  </button>
                );
              })}
            </div>

            {/* District Dropdown & Specific District Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {selectedDivision}-এর জেলাসমূহ:
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black border border-amber-500/40 text-amber-300 font-bold text-sm outline-none"
                >
                  {currentDistricts.map((d, idx) => (
                    <option key={idx} value={d}>📍 {d} জেলা</option>
                  ))}
                </select>
              </div>

              {/* Selected District Highlight Card */}
              <div className="bg-gradient-to-tr from-black to-slate-900 p-3.5 rounded-xl border border-amber-400/40 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>নির্বাচিত জেলা: <strong className="text-white font-black">{selectedDistrict}</strong></span>
                    <span className="text-amber-400 font-black">র‍্যাঙ্ক: #{currentRank}</span>
                  </div>
                  <p className="text-xs text-amber-200 font-bold mt-1">
                    উপাধি: "{currentSatiricalTitle}"
                  </p>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 pt-1.5">
                  <span>নিবন্ধিত কমরেড: <strong className="text-emerald-400 font-bold">{currentCount} জন</strong></span>
                  <span className="text-emerald-400 font-bold">● সক্রিয় জোন</span>
                </div>
              </div>
            </div>
          </div>

          {/* District Census Leaderboard Table */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>দেশসেরা আঁতেল জেলা র‍্যাঙ্কিং (TOP DISTRICTS):</span>
              </h4>

              {/* Search Filter */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="জেলা খুঁজুন..."
                  className="px-2.5 py-1 pl-7 rounded-lg bg-black border border-slate-700 text-xs text-white outline-none w-28 sm:w-36 focus:border-amber-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredLeaderboard.map((item, idx) => {
                const isSelected = item.district === selectedDistrict;
                return (
                  <div
                    key={idx}
                    onClick={() => handleDistrictChange(item.district)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold shadow-sm'
                        : 'bg-black/40 border-slate-800 text-slate-300 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 text-center font-black text-xs ${
                        idx === 0 ? 'text-amber-400 text-sm' : idx === 1 ? 'text-slate-300 text-sm' : idx === 2 ? 'text-amber-600 text-sm' : 'text-slate-500'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-white">{item.district}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">({item.division})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-amber-300 font-bold hidden sm:inline">
                        {item.badge}
                      </span>
                      <strong className="text-xs sm:text-sm font-mono text-emerald-400 font-black">
                        {item.count.toLocaleString('bn-BD')} জন
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social District Pride Sharing CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>নিজের জেলা [{selectedDistrict}]-কে সবার উপরে তুলতে বন্ধুদের চ্যালেঞ্জ দিন!</span>
                </h4>
                <p className="text-xs text-rose-100 mt-0.5">
                  ফেসবুকে বন্ধুদের ট্যাগ করে বলুন আপনার জেলার অবস্থান এবং তাদেরকেও সনদ নিতে বলুন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={handleShareFacebook}
                className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>ফেসবুকে জেলা চ্যালেঞ্জ দিন</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>হোয়াটসঅ্যাপে পাঠান</span>
              </button>

              <button
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/20 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'কপি হয়েছে!' : 'জেলা ডাটা কপি'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
