import React, { useState } from 'react';
import { X, Scan, Sparkles, RefreshCw, Camera, Upload, CheckCircle2 } from 'lucide-react';
import BiometricScannerScreen from './BiometricScannerScreen';
import { playClickSound, playRoastSound } from '../utils/audio';

export default function BiometricScannerModal({
  isOpen,
  onClose,
  defaultPhoto,
  defaultName = '',
  defaultGender = 'female',
  onProceedToResult
}) {
  const [userName, setUserName] = useState(defaultName || '');
  const [gender, setGender] = useState(defaultGender);
  const [userPhoto, setUserPhoto] = useState(defaultPhoto || null);
  const [scanKey, setScanKey] = useState(1);

  if (!isOpen) return null;

  const handleRestartScan = () => {
    playClickSound();
    setScanKey(prev => prev + 1);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target.result);
        setScanKey(prev => prev + 1);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-950 rounded-[32px] border-2 border-rose-500/50 shadow-2xl shadow-rose-950/70 overflow-hidden my-4">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-rose-500/30 bg-black/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>AI ফেস স্ক্যানার ও চেতনা রাডার FX</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  LIVE BIOMETRICS
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestartScan}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1 font-bold"
              title="নতুন করে স্ক্যান করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">রিস্ক্যান</span>
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

        {/* Quick Toolbar to adjust Name & Photo for Scanner */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-slate-300 font-bold">নাম:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="কমরেড নাম লিখুন"
              className="px-2.5 py-1 rounded-lg bg-black/70 border border-rose-500/30 text-white font-semibold text-xs outline-none focus:border-rose-500 w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition-all flex items-center gap-1.5 active:scale-95">
              <Camera className="w-3.5 h-3.5" />
              <span>{userPhoto ? 'ছবি বদলান' : 'ছবি যোগ করুন'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Scanner Body */}
        <div className="p-3 md:p-6">
          <BiometricScannerScreen
            key={scanKey}
            userPhoto={userPhoto}
            userName={userName}
            gender={gender}
            score={96}
            isModal={true}
            onComplete={() => {
              if (onProceedToResult) onProceedToResult();
              onClose();
            }}
            onClose={onClose}
          />
        </div>

      </div>
    </div>
  );
}
