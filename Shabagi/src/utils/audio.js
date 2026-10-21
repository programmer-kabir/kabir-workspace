// Lightweight synthesized Web Audio sound effects (Zero external assets needed)

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}

export function playClickSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Graceful fallback
  }
}

export function playSelectSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06); // E5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) {
    // Graceful fallback
  }
}

export function playFanfare() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Notes: C4, E4, G4, C5 triumph
    const notes = [261.63, 329.63, 392.00, 523.25];
    const duration = 0.12;

    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const noteDuration = idx === notes.length - 1 ? 0.4 : duration;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  } catch (e) {
    // Graceful fallback
  }
}

export function playBattleSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Dramatic fanfare / brass hit
    const notes = [196.00, 246.94, 293.66, 392.00];
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (e) {
    // Graceful fallback
  }
}

export function playRoastSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Comical slide down boing / buzzer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    // Graceful fallback
  }
}

export function playVictorySound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Joyful arpeggio
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    // Graceful fallback
  }
}

// Speech Synthesis for satirical Bengali Voice Dialogues
export function speakDialogue(text) {
  if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 1.0;
    utterance.pitch = 1.08;

    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('BD') || v.lang.includes('IN'));
    if (bnVoice) {
      utterance.voice = bnVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Graceful fallback
  }
}

export function stopAllSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// 1. Police / Protest Siren Sound
export function playSirenSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.25);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.75);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {}
}

// 2. Tea Spoon Clinking Sound
export function playTeaClinkSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    [2400, 3100, 2800].forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  } catch (e) {}
}

// 3. Megaphone / Protest Rally Echo Sound
export function playMegaphoneSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {}
}

// 4. Punch / Slap Sound
export function playPunchSlapSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}

// 5. Sad Trombone (Fail sound)
export function playSadTromboneSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [293.66, 277.18, 261.63, 246.94]; // D4, C#4, C4, B3
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      if (idx === notes.length - 1) {
        osc.frequency.linearRampToValueAtTime(freq - 15, startTime + 0.45);
      }

      const dur = idx === notes.length - 1 ? 0.5 : 0.16;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  } catch (e) {}
}

// 6. Bugle Fanfare
export function playBugleChargeSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [196.00, 261.63, 329.63, 392.00]; // G3, C4, E4, G4
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  } catch (e) {}
}

// 7. Biometric Scanner Futuristic Laser Sweep
export function playScanLaserSweep() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.18);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch (e) {}
}

// 8. Futuristic Telemetry Ping / Radar Beep
export function playScanBeepSound(frequency = 880) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {}
}

// 9. Biometric Lock-on Double Chirp
export function playBiometricLockSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    [980, 1318].forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  } catch (e) {}
}

// 10. Scan Complete Confirmed Chime
export function playScanCompleteSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  } catch (e) {}
}

// 11. TV Breaking News Dramatic Stinger / Intro Beat
export function playNewsIntroSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // 4 quick staccato pulses: dum-dum-dum-dum...
    [0, 0.08, 0.16, 0.24].forEach((timeOffset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime + timeOffset);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.06);
    });

    // Big dramatic brass hit at 0.35s: DAAAM!
    const chord = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4 dramatic major chord
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35 + 0.6);
    });
  } catch (e) {}
}

// 12. Heavy Official Passport Rubber Stamp Thud
export function playStampSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Heavy low frequency impact (thump)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);

    // Paper slap resonance
    const slap = ctx.createOscillator();
    const slapGain = ctx.createGain();
    slap.type = 'sawtooth';
    slap.frequency.setValueAtTime(450, ctx.currentTime + 0.02);
    slap.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

    slapGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.02);
    slapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    slap.connect(slapGain);
    slapGain.connect(ctx.destination);
    slap.start(ctx.currentTime + 0.02);
    slap.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

// Play by SFX Key helper
export function playMemeSfx(sfxKey) {
  switch (sfxKey) {
    case 'stamp': playStampSound(); break;
    case 'news': playNewsIntroSound(); break;
    case 'bugle': playBugleChargeSound(); break;
    case 'teaClink': playTeaClinkSound(); break;
    case 'megaphone': playMegaphoneSound(); break;
    case 'roast': playRoastSound(); break;
    case 'punch': playPunchSlapSound(); break;
    case 'sadTrombone': playSadTromboneSound(); break;
    case 'siren': playSirenSound(); break;
    case 'battle': playBattleSound(); break;
    case 'victory': playVictorySound(); break;
    default: playClickSound(); break;
  }
}

export const memeSoundList = [
  {
    id: 'biplob',
    title: 'বিপ্লব দীর্ঘজীবী হোক!',
    tagline: 'সার্বক্ষণিক স্লোগান',
    icon: '🚩',
    quote: 'বিপ্লব দীর্ঘজীবী হোক! সমাজতন্ত্রের জয় হোক!',
    sfx: 'bugle',
    gradient: 'from-red-600 to-rose-600'
  },
  {
    id: 'lalcha',
    title: '১ কাপ কড়া লাল চা দেন!',
    tagline: 'টিএসসি টংয়ের ডায়লগ',
    icon: '☕',
    quote: 'মামা, এক কাপ কড়া লিকারের লাল চা দেন তো! চিনি ছাড়া!',
    sfx: 'teaClink',
    gradient: 'from-amber-600 to-orange-700'
  },
  {
    id: 'oborodh',
    title: 'শাহবাগ অবরোধ চলবে!',
    tagline: 'তাৎক্ষণিক মশাল মিছিল',
    icon: '📢',
    quote: 'এই সমাজ মানি না, মানব না! অনির্দিষ্টকালের জন্য শাহবাগ অবরোধ চলবে!',
    sfx: 'megaphone',
    gradient: 'from-rose-600 to-red-700'
  },
  {
    id: 'gosol',
    title: 'গোসল বুর্জোয়া চক্রান্ত!',
    tagline: 'সাবানমুক্ত দর্শন',
    icon: '🚿',
    quote: 'গোসল হলো সাবান কোম্পানির পুঁজিতান্ত্রিক চক্রান্ত! সাবান বয়কট করুন!',
    sfx: 'roast',
    gradient: 'from-cyan-600 to-blue-700'
  },
  {
    id: 'teep',
    title: 'কপালে আড়াই ইঞ্চি টিপ!',
    tagline: 'নীরব চপেটাঘাত',
    icon: '🔴',
    quote: 'কপালে সুবিশাল লাল টিপ—পিতৃতান্ত্রিক সমাজের গালে নীরব চপেটাঘাত!',
    sfx: 'punch',
    gradient: 'from-red-700 to-pink-700'
  },
  {
    id: 'prem',
    title: 'পুঁজিবাদ ধ্বংস হোক!',
    tagline: 'ব্রেকআপের তাত্ত্বিক শোক',
    icon: '💔',
    quote: 'প্রেম কোনো ব্যক্তিমালিকানা নয়! সঙ্গী পুঁজিতান্ত্রিক মোহে অন্ধ হয়েছে, পুঁজিবাদ ধ্বংস হোক!',
    sfx: 'sadTrombone',
    gradient: 'from-purple-600 to-indigo-800'
  },
  {
    id: 'police',
    title: 'পুলিশ ডাকেন! আঁতেল আসছে!',
    tagline: 'জরুরি সাইরেন',
    icon: '🚨',
    quote: 'জরুরি এলার্ট! চারদিকে আঁতেল আর বুদ্ধিজীবীদের আনাগোনা বেড়ে গেছে!',
    sfx: 'siren',
    gradient: 'from-red-600 to-blue-700'
  },
  {
    id: 'jholabag',
    title: 'শান্তিনিকেতনি ঝোলা জিন্দাবাদ!',
    tagline: 'কাঁধের বিপ্লবী প্রেস্টিজ',
    icon: '👜',
    quote: 'কাঁধে শান্তিনিকেতনি রঙিন ঝোলা ছাড়া কোনো আত্মসম্মানবোধ সম্পন্ন বুদ্ধিজীবী রাস্তায় নামে না!',
    sfx: 'battle',
    gradient: 'from-amber-500 to-orange-600'
  }
];
