import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FiStar, FiX, FiCheck, FiMessageSquare, FiTag, FiZap, FiAward } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { soundFx } from '../utils/soundFx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const STAR_LABELS = {
  1: { label: 'Needs Improvement', desc: 'Minimal acceptable quality, several flaws', color: 'text-amber-500' },
  2: { label: 'Below Average', desc: 'Acceptable with minor issues or corrections', color: 'text-amber-500 dark:text-amber-400' },
  3: { label: 'Good', desc: 'Meets requirements and quality standards', color: 'text-yellow-600 dark:text-yellow-400' },
  4: { label: 'Very Good', desc: 'High quality, well structured and polished', color: 'text-emerald-600 dark:text-emerald-400' },
  5: { label: 'Outstanding!', desc: 'Exceptional, flawless execution and creative', color: 'text-indigo-600 dark:text-brand-400' }
};

const SUGGESTED_TAGS = [
  '⚡ Fast Delivery',
  '🎯 High Accuracy',
  '🎨 Creative Design',
  '🧹 Clean Layers & Files',
  '💡 Followed Instructions',
  '✨ Great Typography',
  '🔥 Pixel Perfect'
];

const ApprovalRatingModal = ({ isOpen, onClose, task, onConfirm }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState(['⚡ Fast Delivery', '🎯 High Accuracy']);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const currentStar = hoverRating || rating;
  const starInfo = STAR_LABELS[currentStar] || STAR_LABELS[5];

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Trigger festive celebration confetti & audio chime
      soundFx.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      await onConfirm({
        rating,
        feedback_notes: feedbackNotes.trim(),
        tags: selectedTags,
        reward_credit: task.category_credit || task.credit || task.custom_credit || 5
      });
      onClose();
    } catch (err) {
      console.error('Error submitting approval rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve staff avatar URL safely
  const avatarUrl = task.staff_avatar
    ? (task.staff_avatar.startsWith('http') ? task.staff_avatar : `${API_BASE}${task.staff_avatar}`)
    : null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-lg glass bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 md:p-7 text-slate-800 dark:text-white"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <FiX size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-xs">
              <HiSparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Accept & Rate Task
              </h2>
              <p className="text-slate-500 dark:text-white/40 text-xs truncate max-w-sm">
                {task.title || 'Task Review'}
              </p>
            </div>
          </div>

          {/* Staff Info pill */}
          {task.staff_name && (
            <div className="mb-4 p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={task.staff_name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-brand-500/20 text-indigo-700 dark:text-brand-400 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-brand-500/30">
                    {task.staff_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase font-bold tracking-wider">Assigned Staff</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{task.staff_name}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                Marking as Completed
              </span>
            </div>
          )}

          {/* Dynamic Category Credit Reward Preview */}
          <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🪙</span>
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Category Credit Reward
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                  অ্যাপ্রুভ করার সাথে সাথে কর্মীর ওয়ালেটে ক্যাটাগরি ক্রেডিট জমা হবে
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
              +{task.category_credit || task.credit || 5} Credits
            </span>
          </div>

          {/* 5-Star Rating Section */}
          <div className="mb-6 text-center bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 shadow-xs">
            <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">
              Performance & Quality Rating
            </label>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= currentStar;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                  >
                    <FiStar
                      size={32}
                      className={`${
                        isActive
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-200 dark:text-white/20'
                      } transition-colors duration-150`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Star Label & Description */}
            <div className="min-h-[40px] flex flex-col items-center justify-center">
              <span className={`text-sm font-bold ${starInfo.color} flex items-center gap-1.5`}>
                {rating} / 5 ⭐ {starInfo.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
                {starInfo.desc}
              </span>
            </div>
          </div>

          {/* Suggested Quick Tags */}
          <div className="mb-5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2.5">
              <FiTag size={13} />
              Quick Quality Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-brand-500/20 dark:border-brand-500/40 dark:text-brand-300 shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 dark:bg-white/[0.03] dark:border-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviewer Feedback Textarea */}
          <div className="mb-6">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">
              <FiMessageSquare size={13} />
              Feedback / Appreciation Notes <span className="text-slate-400 dark:text-white/30 lowercase font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder="e.g. Great attention to typography and clean layers. Well done!"
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-indigo-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-indigo-500/40 dark:focus:ring-brand-500/50 transition-all resize-none shadow-inner"
            />
          </div>

          {/* Reviewer Incentive Banner */}
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-300 font-semibold">
              <span className="text-base">🪙</span>
              <span>Reviewer Reward: <strong>+1 Credit</strong></span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
              Verified QA
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-[2] py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiCheck size={16} />
              {submitting ? 'Submitting Review...' : `Approve with ${rating} Star${rating > 1 ? 's' : ''}`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ApprovalRatingModal;
