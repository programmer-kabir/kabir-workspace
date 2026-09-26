import React, { useState, useRef } from 'react';
import { 
  FiX, 
  FiUploadCloud, 
  FiLink, 
  FiTag, 
  FiFileText, 
  FiAlertCircle, 
  FiLoader, 
  FiCheckCircle, 
  FiImage, 
  FiTrash2, 
  FiFlag 
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import axios from 'axios';

const CATEGORIES = [
  'Graphic Design',
  'Web Development',
  'UI/UX Design',
  'Video Editing',
  '3D & Animation',
  'Content & Copywriting',
  'Marketing & R&D',
  'Creative Concept'
];

const CreateSelfTaskModal = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  API_BASE
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Graphic Design');
  const [priority, setPriority] = useState('Normal');
  const [description, setDescription] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task Title is required.');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('user_id', currentUser?.id);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('description', description.trim());
      if (submissionLink.trim()) {
        formData.append('ref_links', submissionLink.trim());
        formData.append('submission_link', submissionLink.trim());
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post(`${API_BASE}api/tasks/create_self_task.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.status === 'success') {
        // Reset form
        setTitle('');
        setCategory('Graphic Design');
        setPriority('Normal');
        setDescription('');
        setSubmissionLink('');
        setImageFile(null);
        setImagePreview(null);

        onSuccess(response.data.task, response.data.message);
        onClose();
      } else {
        setError(response.data.message || 'Failed to create creative task.');
      }
    } catch (err) {
      console.error('Error creating self task:', err);
      setError(err.response?.data?.message || err.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={!isSubmitting ? onClose : undefined} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Glow Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 shrink-0" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
              <HiSparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20">
                  Self-Initiative
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Create Creative Task
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in">
              <FiAlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Modern UI Concept for E-Commerce App, Branding Mockup..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <FiTag size={13} className="text-rose-500" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <FiFlag size={13} className="text-rose-500" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer transition-all"
              >
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Reference / Resource Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FiLink size={13} className="text-rose-500" /> Reference / Resource Link <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..., https://www.figma.com/..., GitHub, or inspiration URL"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Optional inspiration, client brief, or reference link.
            </p>
          </div>

          {/* Concept / Task Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FiFileText size={13} className="text-rose-500" /> Concept Summary & Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain the background, goals, techniques to use, or concept highlights..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
            />
          </div>

          {/* Visual Thumbnail Upload Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FiImage size={13} className="text-rose-500" /> Reference Image / Cover <span className="text-slate-400 font-normal">(Optional)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageChange(e.target.files[0]);
                }
              }}
            />

            {imagePreview ? (
              <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center max-h-48">
                <img
                  src={imagePreview}
                  alt="Task Preview"
                  className="max-h-48 w-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm text-xs font-bold transition-colors"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-7 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-rose-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
                  <FiUploadCloud size={24} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Click to upload or drag & drop reference image
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  PNG, JPG, WEBP, GIF up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Submission Info Notice */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-950/20 dark:to-rose-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl flex items-start gap-3">
            <FiCheckCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              This task will be added to your <strong>To-Do</strong> board. You can start the task timer, work on it, and submit your finished work for review when ready.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" size={15} />
                  <span>Creating Task...</span>
                </>
              ) : (
                <>
                  <HiSparkles size={15} />
                  <span>Create & Add to To-Do</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSelfTaskModal;
