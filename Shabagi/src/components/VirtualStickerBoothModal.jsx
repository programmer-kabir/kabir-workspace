import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Download, 
  RotateCcw, 
  Camera, 
  Sliders, 
  SlidersHorizontal,
  Flame,
  Layers,
  Wand2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playClickSound, playSelectSound, playFanfare } from '../utils/audio';

export default function VirtualStickerBoothModal({
  isOpen,
  onClose,
  userPhoto,
  setUserPhoto,
  gender = 'female'
}) {
  const isFemale = gender === 'female';
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sticker Toggles
  const [stickers, setStickers] = useState({
    teep: true,
    glasses: true,
    beard: !isFemale,
    jhola: false,
    tea: true,
    headband: false,
  });

  // Fine-tuning adjustments
  const [teepY, setTeepY] = useState(24); // % from top
  const [teepSize, setTeepSize] = useState(26); // px radius
  const [glassesY, setGlassesY] = useState(38); // % from top
  const [glassesScale, setGlassesScale] = useState(1);
  const [beardY, setBeardY] = useState(62); // % from top
  const [beardScale, setBeardScale] = useState(1);

  const [activeTab, setActiveTab] = useState('stickers'); // 'stickers' | 'adjust'
  const [previewImage, setPreviewImage] = useState(userPhoto);

  useEffect(() => {
    setPreviewImage(userPhoto);
  }, [userPhoto]);

  // Update canvas rendering whenever stickers, adjustments, or photo changes
  useEffect(() => {
    if (!isOpen) return;
    renderCompositeCanvas();
  }, [isOpen, previewImage, stickers, teepY, teepSize, glassesY, glassesScale, beardY, beardScale]);

  if (!isOpen) return null;

  // Render photo + vector stickers onto high-res canvas
  const renderCompositeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const drawStickers = () => {
      // 1. HEADBAND STICKER
      if (stickers.headband) {
        ctx.save();
        ctx.fillStyle = '#dc2626';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.rect(0, height * 0.12, width, height * 0.11);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★ বিপ্লব চলবেই! ★', width / 2, height * 0.175);
        ctx.restore();
      }

      // 2. BIG RED TEEP STICKER
      if (stickers.teep) {
        ctx.save();
        const teepCenterX = width / 2;
        const teepCenterY = (height * teepY) / 100;
        const radius = teepSize;

        // Outer glow & shadow
        ctx.shadowColor = 'rgba(153, 27, 27, 0.7)';
        ctx.shadowBlur = 10;

        // Outer rim
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(teepCenterX, teepCenterY, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // Main deep red circle
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(teepCenterX, teepCenterY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner 3D highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(teepCenterX - radius * 0.3, teepCenterY - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. INTELLECTUAL ROUND GLASSES STICKER
      if (stickers.glasses) {
        ctx.save();
        const gY = (height * glassesY) / 100;
        const scale = glassesScale;
        const leftEyeX = width * 0.35;
        const rightEyeX = width * 0.65;
        const lensRadius = 55 * scale;

        ctx.lineWidth = 7 * scale;
        ctx.strokeStyle = '#0f172a';
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 8;

        // Left Lens
        ctx.fillStyle = 'rgba(241, 245, 249, 0.18)';
        ctx.beginPath();
        ctx.arc(leftEyeX, gY, lensRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right Lens
        ctx.beginPath();
        ctx.arc(rightEyeX, gY, lensRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nose Bridge
        ctx.lineWidth = 6 * scale;
        ctx.beginPath();
        ctx.arc(width / 2, gY - 6 * scale, lensRadius * 0.55, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        // Left Temple
        ctx.beginPath();
        ctx.moveTo(leftEyeX - lensRadius, gY - 5 * scale);
        ctx.lineTo(leftEyeX - lensRadius - 40 * scale, gY - 20 * scale);
        ctx.stroke();

        // Right Temple
        ctx.beginPath();
        ctx.moveTo(rightEyeX + lensRadius, gY - 5 * scale);
        ctx.lineTo(rightEyeX + lensRadius + 40 * scale, gY - 20 * scale);
        ctx.stroke();

        // Glare reflections
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(leftEyeX - 10 * scale, gY - 10 * scale, lensRadius * 0.6, Math.PI * 1.1, Math.PI * 1.45);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rightEyeX - 10 * scale, gY - 10 * scale, lensRadius * 0.6, Math.PI * 1.1, Math.PI * 1.45);
        ctx.stroke();

        ctx.restore();
      }

      // 4. REVOLUTIONARY BEARD & MOUSTACHE STICKER
      if (stickers.beard) {
        ctx.save();
        const bY = (height * beardY) / 100;
        const bScale = beardScale;
        ctx.fillStyle = '#1e1b18';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;

        // Moustache
        ctx.beginPath();
        ctx.moveTo(width / 2, bY - 35 * bScale);
        ctx.quadraticCurveTo(width * 0.32, bY - 45 * bScale, width * 0.22, bY - 10 * bScale);
        ctx.quadraticCurveTo(width * 0.38, bY - 15 * bScale, width / 2, bY - 22 * bScale);
        ctx.quadraticCurveTo(width * 0.62, bY - 15 * bScale, width * 0.78, bY - 10 * bScale);
        ctx.quadraticCurveTo(width * 0.68, bY - 45 * bScale, width / 2, bY - 35 * bScale);
        ctx.fill();

        // Beard
        ctx.beginPath();
        ctx.moveTo(width * 0.28, bY - 10 * bScale);
        ctx.quadraticCurveTo(width * 0.2, bY + 80 * bScale, width * 0.38, bY + 130 * bScale);
        ctx.quadraticCurveTo(width * 0.5, bY + 160 * bScale, width * 0.62, bY + 130 * bScale);
        ctx.quadraticCurveTo(width * 0.8, bY + 80 * bScale, width * 0.72, bY - 10 * bScale);
        ctx.quadraticCurveTo(width * 0.5, bY + 40 * bScale, width * 0.28, bY - 10 * bScale);
        ctx.fill();

        // Grey beard streaks (Intellectual salt and pepper)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2 * bScale;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(width / 2 + i * 18 * bScale, bY + 30 * bScale);
          ctx.lineTo(width / 2 + i * 22 * bScale, bY + 120 * bScale);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. SHANTINIKETANI JHOLA BAG STICKER (Bottom Left Corner)
      if (stickers.jhola) {
        ctx.save();
        const bagX = width * 0.05;
        const bagY = height * 0.62;

        // Hanging Strap
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        ctx.quadraticCurveTo(width * 0.12, bagY, bagX + 60, bagY + 40);
        ctx.stroke();

        // Bag body
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(bagX, bagY, 150, 180, [15, 15, 30, 30]);
        ctx.fill();
        ctx.stroke();

        // Flap
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(bagX + 5, bagY, 140, 75, [10, 10, 20, 20]);
        ctx.fill();

        // Traditional Flower / Sun pattern
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(bagX + 75, bagY + 40, 18, 0, Math.PI * 2);
        ctx.fill();

        // Bag Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('শান্তিনিকেতন', bagX + 75, bagY + 120);

        ctx.restore();
      }

      // 6. STEAMING RED TEA CUP STICKER (Bottom Right Corner)
      if (stickers.tea) {
        ctx.save();
        const teaX = width * 0.74;
        const teaY = height * 0.68;

        // Steam trails
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (let s = 0; s < 3; s++) {
          ctx.beginPath();
          const sx = teaX + 35 + s * 22;
          ctx.moveTo(sx, teaY - 10);
          ctx.bezierCurveTo(sx - 15, teaY - 35, sx + 15, teaY - 60, sx, teaY - 85);
          ctx.stroke();
        }

        // Ribbed glass tea cup
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(teaX, teaY);
        ctx.lineTo(teaX + 105, teaY);
        ctx.lineTo(teaX + 90, teaY + 140);
        ctx.lineTo(teaX + 15, teaY + 140);
        ctx.closePath();
        ctx.stroke();

        // Red Liquor tea inside glass
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(teaX + 6, teaY + 25);
        ctx.lineTo(teaX + 99, teaY + 25);
        ctx.lineTo(teaX + 86, teaY + 135);
        ctx.lineTo(teaX + 19, teaY + 135);
        ctx.closePath();
        ctx.fill();

        // Glass ribs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3;
        for (let r = 1; r <= 4; r++) {
          ctx.beginPath();
          ctx.moveTo(teaX + r * 20, teaY + 30);
          ctx.lineTo(teaX + r * 17 + 8, teaY + 130);
          ctx.stroke();
        }

        // Tea Label badge
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(teaX + 15, teaY + 148, 75, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TSC লাল চা', teaX + 52, teaY + 163);

        ctx.restore();
      }
    };

    if (previewImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw base image centered with cover aspect
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > canvasRatio) {
          sWidth = img.height * canvasRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / canvasRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
        drawStickers();
      };
      img.src = previewImage;
    } else {
      // Default Stylized Cartoon Comrade Background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f43f5e');
      gradient.addColorStop(0.5, '#e11d48');
      gradient.addColorStop(1, '#9f1239');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Cartoon face placeholder
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.45, width * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Simple smiling mouth
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.52, 45, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      drawStickers();
    }
  };

  const handleToggleSticker = (name) => {
    playSelectSound();
    setStickers(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleApplyPreset = (presetName) => {
    playSelectSound();
    switch (presetName) {
      case 'female-shahbagi':
        setStickers({ teep: true, glasses: true, beard: false, jhola: true, tea: true, headband: false });
        setTeepSize(30);
        setTeepY(24);
        break;
      case 'male-attel':
        setStickers({ teep: false, glasses: true, beard: true, jhola: true, tea: true, headband: false });
        setGlassesScale(1.1);
        break;
      case 'rebel-protest':
        setStickers({ teep: true, glasses: true, beard: true, jhola: false, tea: false, headband: true });
        break;
      case 'tea-lover':
        setStickers({ teep: false, glasses: true, beard: false, jhola: false, tea: true, headband: false });
        break;
      default:
        break;
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export from canvas and apply to userPhoto
  const handleApplyToCards = () => {
    playFanfare();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stickeredDataUrl = canvas.toDataURL('image/png');
    setUserPhoto(stickeredDataUrl);

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onClose();
  };

  // Direct PNG Download of meme photo
  const handleDownloadMemePhoto = () => {
    playClickSound();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `comrade-stickered-avatar-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="glass-card w-full max-w-4xl rounded-[36px] p-5 md:p-7 shadow-2xl border border-white/50 relative my-auto max-h-[96vh] overflow-y-auto no-scrollbar text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-90 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Wand2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
              বিপ্লবী ফটো ল্যাব
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              ভার্চুয়াল স্টিকার বুথ (টিপ, গোল চশমা ও ঝোলা ব্যাগ)
            </h3>
          </div>
        </div>

        {/* Preset Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
          <span className="text-xs font-black text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            ১-ক্লিক লুক:
          </span>
          <button
            onClick={() => handleApplyPreset('female-shahbagi')}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            <span>🔴 খাঁটি শাহবাগী নারী</span>
          </button>
          <button
            onClick={() => handleApplyPreset('male-attel')}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            <span>🧔 পুরোদস্তুর আঁতেল</span>
          </button>
          <button
            onClick={() => handleApplyPreset('rebel-protest')}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            <span>🚩 রাজপথের কমরেড</span>
          </button>
          <button
            onClick={() => handleApplyPreset('tea-lover')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            <span>☕ টিএসসি চাখোর</span>
          </button>
        </div>

        {/* Main Grid: Left Canvas Stage, Right Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Canvas Display Stage (6 cols) */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
              
              {/* Photo change overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{previewImage ? 'ছবি পরিবর্তন' : 'নিজের ছবি আপলোড'}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <p className="text-[11px] text-slate-500 font-medium text-center mt-2">
              * ছবির উপর স্টিকারগুলো স্বয়ংক্রিয়ভাবে প্রফেশনাল আর্টে যুক্ত হবে
            </p>
          </div>

          {/* Controls Panel (6 cols) */}
          <div className="md:col-span-6 flex flex-col gap-3">
            
            {/* Tabs: Stickers vs Adjustments */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('stickers')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'stickers'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                স্টিকার নির্বাচন ({Object.values(stickers).filter(Boolean).length})
              </button>
              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'adjust'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                পজিশন অ্যাডজাস্ট
              </button>
            </div>

            {/* TAB 1: STICKER TOGGLE GRID */}
            {activeTab === 'stickers' && (
              <div className="grid grid-cols-2 gap-2">
                
                {/* 1. Big Red Teep */}
                <button
                  type="button"
                  onClick={() => handleToggleSticker('teep')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    stickers.teep
                      ? 'bg-red-50 border-red-400 ring-2 ring-red-400/40 text-red-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <p className="text-xs font-black leading-none">সুবিশাল লাল টিপ</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">কপালের নীরব বিপ্লব</p>
                    </div>
                  </div>
                  {stickers.teep && <Check className="w-4 h-4 text-red-600" />}
                </button>

                {/* 2. Round Glasses */}
                <button
                  type="button"
                  onClick={() => handleToggleSticker('glasses')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    stickers.glasses
                      ? 'bg-slate-900 border-slate-950 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">👓</span>
                    <div>
                      <p className="text-xs font-black leading-none">আঁতেল গোল চশমা</p>
                      <p className={`text-[10px] ${stickers.glasses ? 'text-slate-300' : 'text-slate-500'} mt-0.5`}>
                        রেট্রো বুদ্ধিজীবী লুক
                      </p>
                    </div>
                  </div>
                  {stickers.glasses && <Check className="w-4 h-4 text-amber-400" />}
                </button>

                {/* 3. Revolutionary Beard */}
                <button
                  type="button"
                  onClick={() => handleToggleSticker('beard')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    stickers.beard
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 text-amber-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🧔</span>
                    <div>
                      <p className="text-xs font-black leading-none">বিপ্লবী কাঁচা-পাকা দাড়ি</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">মার্ক্সিস্ট গোঁফ-দাড়ি</p>
                    </div>
                  </div>
                  {stickers.beard && <Check className="w-4 h-4 text-amber-700" />}
                </button>

                {/* 4. Shantiniketani Jhola */}
                <button
                  type="button"
                  onClick={() => handleToggleSticker('jhola')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    stickers.jhola
                      ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/40 text-orange-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">👜</span>
                    <div>
                      <p className="text-xs font-black leading-none">শান্তিনিকেতনি ঝোলা</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">কাঁধের রঙিন ব্যাগ</p>
                    </div>
                  </div>
                  {stickers.jhola && <Check className="w-4 h-4 text-orange-600" />}
                </button>

                {/* 5. Steaming Red Tea */}
                <button
                  type="button"
                  onClick={() => handleToggleSticker('tea')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    stickers.tea
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 text-rose-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">☕</span>
                    <div>
                      <p className="text-xs font-black leading-none">ধোঁয়া ওঠা লাল চা</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">টিএসসি স্পেশাল লিকার</p>
                    </div>
                  </div>
                  {stickers.tea && <Check className="w-4 h-4 text-rose-600" />}
                </button>

                {/* 6. Rebel Headband */}
                <button
                  type="button"
                  onClick={() => handleToggleSticker('headband')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    stickers.headband
                      ? 'bg-red-600 border-red-700 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🚩</span>
                    <div>
                      <p className="text-xs font-black leading-none">বিপ্লবী হেডব্যান্ড</p>
                      <p className={`text-[10px] ${stickers.headband ? 'text-red-100' : 'text-slate-500'} mt-0.5`}>
                        'বিপ্লব চলবেই' ফেট্টি
                      </p>
                    </div>
                  </div>
                  {stickers.headband && <Check className="w-4 h-4 text-white" />}
                </button>

              </div>
            )}

            {/* TAB 2: FINE ADJUSTMENT SLIDERS */}
            {activeTab === 'adjust' && (
              <div className="space-y-3 bg-white/70 p-3.5 rounded-2xl border border-slate-200 text-xs">
                
                {/* Teep controls */}
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>🔴 কপালে টিপের উচ্চতা ({teepY}%)</span>
                    <span>সাইজ ({teepSize}px)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={teepY}
                      onChange={(e) => setTeepY(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                    <input
                      type="range"
                      min="15"
                      max="45"
                      value={teepSize}
                      onChange={(e) => setTeepSize(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>
                </div>

                {/* Glasses controls */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>👓 চশমার উচ্চতা ({glassesY}%)</span>
                    <span>সাইজ ({glassesScale.toFixed(1)}x)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="25"
                      max="55"
                      value={glassesY}
                      onChange={(e) => setGlassesY(Number(e.target.value))}
                      className="w-full accent-slate-900"
                    />
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={glassesScale}
                      onChange={(e) => setGlassesScale(Number(e.target.value))}
                      className="w-full accent-slate-900"
                    />
                  </div>
                </div>

                {/* Beard controls */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>🧔 দাড়ির পজিশন ({beardY}%)</span>
                    <span>সাইজ ({beardScale.toFixed(1)}x)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="45"
                      max="75"
                      value={beardY}
                      onChange={(e) => setBeardY(Number(e.target.value))}
                      className="w-full accent-amber-700"
                    />
                    <input
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.05"
                      value={beardScale}
                      onChange={(e) => setBeardScale(Number(e.target.value))}
                      className="w-full accent-amber-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleApplyToCards}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 border border-white/30"
              >
                <Check className="w-5 h-5" />
                <span>কনফার্ম করুন ও সব সনদে লাগান 🔥</span>
              </button>

              <button
                onClick={handleDownloadMemePhoto}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>মিম অবতার ছবি হিসেবে সেভ করুন (Profile Picture)</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
