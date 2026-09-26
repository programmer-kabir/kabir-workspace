import React, { useState } from 'react';
import { FiX, FiFileText, FiUploadCloud, FiPlay, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { toast } from 'sonner';

const CustomTextModal = ({ isOpen, onClose, onStartPractice }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [durationSec, setDurationSec] = useState(120); // default 2 minutes
  const [isNoTimer, setIsNoTimer] = useState(false);

  if (!isOpen) return null;

  // Sanitize text: replace smart quotes, dashes, non-ascii chars to standard ascii
  const sanitizeCustomText = (raw) => {
    return raw
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\r\n/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast.error('Please upload a valid .txt plain text file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const clean = sanitizeCustomText(content);
        setText(clean);
        if (!title) {
          setTitle(file.name.replace('.txt', ''));
        }
        toast.success(`Loaded "${file.name}" (${clean.split(/\s+/).length} words)`);
      }
    };
    reader.readAsText(file);
  };

  const handleStart = () => {
    const clean = sanitizeCustomText(text);
    if (!clean || clean.length < 20) {
      toast.error('Please enter at least 20 characters of text to practice.');
      return;
    }

    const finalTitle = title.trim() || 'Custom Practice Text';
    const finalDuration = isNoTimer ? 0 : durationSec;

    onStartPractice({
      id: `custom_${Date.now()}`,
      title: finalTitle,
      category: 'custom',
      difficulty: 'custom',
      text: clean,
      durationSec: finalDuration
    });

    onClose();
  };

  const wordsCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charsCount = text.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
              📝 Custom Practice
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Practice Your Own Text or Document
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste an article, code notes, or upload a .txt file to practice typing with instant feedback.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Title Input & File Drop Area */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. My English Essay, Meeting Notes, Tech Summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Text Content
              </label>
              <label className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1">
                <FiUploadCloud size={14} />
                <span>Upload .txt File</span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={6}
              placeholder="Paste your paragraph or text here... Smart quotes and extra line breaks will be cleaned automatically."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{wordsCount} words • {charsCount} characters</span>
              {wordsCount > 0 && wordsCount < 10 && (
                <span className="text-amber-500 font-medium">Add a bit more text for a better test.</span>
              )}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Practice Timer:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '1 Minute', sec: 60 },
                { label: '2 Minutes', sec: 120 },
                { label: '3 Minutes', sec: 180 },
                { label: '5 Minutes', sec: 300 }
              ].map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => {
                    setDurationSec(item.sec);
                    setIsNoTimer(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                    !isNoTimer && durationSec === item.sec
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsNoTimer(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                  isNoTimer
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                No Timer (Type to End)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!text.trim() || text.length < 20}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
              text.trim().length >= 20
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white shadow-purple-500/25 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <FiPlay size={14} />
            <span>Start Practice</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomTextModal;
