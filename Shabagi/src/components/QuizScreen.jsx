import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Swords } from 'lucide-react';
import { playClickSound, playSelectSound } from '../utils/audio';

const optionLetters = ['ক', 'খ', 'গ', 'ঘ'];

export default function QuizScreen({
  questions,
  currentIndex,
  answers,
  onSelectOption,
  onNext,
  onPrev,
  challenger
}) {
  const safeIndex = Math.min(Math.max(0, currentIndex), questions.length - 1);
  const currentQ = questions[safeIndex];

  if (!currentQ) return null;

  const selectedOptionIndex = answers[safeIndex];
  const progressPercent = Math.round(((safeIndex + 1) / questions.length) * 100);

  const handleOptionClick = (idx) => {
    playSelectSound();
    onSelectOption(safeIndex, idx);
    // Smooth auto-advance after 260ms for fluid UX (if not last question)
    if (safeIndex < questions.length - 1) {
      setTimeout(() => {
        onNext();
      }, 260);
    }
  };

  const handlePrev = () => {
    playClickSound();
    onPrev();
  };

  const handleNext = () => {
    playClickSound();
    onNext();
  };

  return (
    <div className="w-full max-w-xl md:max-w-2xl mx-auto px-4 py-4 md:py-8 animate-fadeIn">
      {/* Challenger Live Duel Pill */}
      {challenger && (
        <div className="mb-3 py-1.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/30 to-red-600/30 border border-amber-400/50 backdrop-blur-md flex items-center justify-between text-xs text-white shadow-md">
          <span className="flex items-center gap-1.5 font-bold">
            <Swords className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>ডুয়েল চলছে: কমরেড <strong className="text-amber-200">{challenger.name}</strong></span>
          </span>
          <span className="font-black text-amber-300 bg-black/50 px-2.5 py-0.5 rounded-full border border-amber-400/40">
            টার্গেট: {challenger.score}%+
          </span>
        </div>
      )}

      {/* Progress & Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-white text-xs font-bold mb-2">
          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
            <span>প্রশ্ন {safeIndex + 1} / {questions.length}</span>
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
            {progressPercent}% সম্পন্ন
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 backdrop-blur-md border border-white/20">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-white rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl border border-white/60 relative">
        {/* Category Badge */}
        {currentQ.category && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black mb-3 border border-rose-200">
            <span>{currentQ.category}</span>
          </div>
        )}

        <div className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex-shrink-0 flex items-center justify-center text-rose-700 font-black text-sm">
            {safeIndex + 1}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-start gap-3.5 group relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-700 shadow-lg shadow-rose-600/30 scale-[1.01]'
                    : 'bg-white/85 hover:bg-white text-slate-700 border-slate-200/90 hover:border-rose-300 hover:shadow-md active:scale-[0.99]'
                }`}
              >
                {/* Option Letter Badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs transition-colors ${
                    isSelected
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-600'
                  }`}
                >
                  {optionLetters[idx]}
                </div>

                {/* Option Text */}
                <span className={`text-sm md:text-base font-medium flex-1 pt-0.5 leading-snug ${
                  isSelected ? 'text-white font-semibold' : 'text-slate-800'
                }`}>
                  {option.text}
                </span>

                {/* Checkmark when selected */}
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 animate-scaleIn" />
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={safeIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              safeIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>আগের প্রশ্ন</span>
          </button>

          <button
            onClick={handleNext}
            disabled={selectedOptionIndex === undefined}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedOptionIndex !== undefined
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-95'
                : 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500'
            }`}
          >
            <span>{safeIndex === questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
