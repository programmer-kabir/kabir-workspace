import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  FiUploadCloud, FiFile, FiImage, FiVideo, FiX, FiCheck, 
  FiAlertCircle, FiLoader, FiExternalLink, FiPaperclip, FiLock,
  FiCheckCircle, FiZap
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CreateiveComputerAcademy/server/';

export default function TaskFileUploader({ files = [], setFiles, taskId = 0, userId = 0, disabled = false, lockRemainingText = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({ total: 0, completed: 0, currentProgress: 0 });
  const [fileProgressMap, setFileProgressMap] = useState({});
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileBadge = (ext = '', fileType = '') => {
    const extLower = ext.toLowerCase();
    if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
    if (['zip', 'rar', '7z'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    if (['mp4', 'mov', 'webm'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
    if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/10 text-red-600 border-red-500/20' };
    return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  // Upload a single file using the high-speed parallel worker
  const uploadSingleFile = async (fileItem, index, totalCount) => {
    const fileName = fileItem.name;
    setFileProgressMap(prev => ({ ...prev, [fileName]: 10 }));

    // Strategy 1: Try Fast Direct Presigned R2 Upload
    try {
      const presignedRes = await axios.post(`${API_BASE}api/tasks/get_upload_presigned_url.php`, {
        task_id: taskId,
        user_id: userId,
        file_name: fileName,
        file_type: fileItem.type || 'application/octet-stream',
        file_size: fileItem.size,
        index: index + 1
      }, { timeout: 8000 });

      if (presignedRes.data?.status === 'success' && presignedRes.data.presigned_url) {
        const { presigned_url, public_url, r2_key, ext, file_type } = presignedRes.data;

        // Direct PUT to Cloudflare R2
        await axios.put(presigned_url, fileItem, {
          headers: {
            'Content-Type': fileItem.type || 'application/octet-stream'
          },
          onUploadProgress: (pe) => {
            if (pe.total) {
              const p = Math.round((pe.loaded * 100) / pe.total);
              setFileProgressMap(prev => ({ ...prev, [fileName]: p }));
            }
          }
        });

        setFileProgressMap(prev => ({ ...prev, [fileName]: 100 }));
        return {
          name: fileName,
          url: public_url,
          key: r2_key,
          size: fileItem.size,
          ext: ext || (fileName.split('.').pop() || '').toLowerCase(),
          mime: fileItem.type || 'application/octet-stream',
          file_type: file_type || 'other',
          file: fileItem
        };
      }
    } catch (directErr) {
      // If presigned URL fails (e.g. CORS on some networks), seamlessly fallback to fast single worker
      console.warn(`Presigned upload fallback for ${fileName}:`, directErr);
    }

    // Strategy 2: Fast Single File Parallel Worker endpoint
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('user_id', userId);
    formData.append('index', index + 1);
    formData.append('file', fileItem);

    const singleRes = await axios.post(`${API_BASE}api/tasks/upload_single_task_file.php`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (pe) => {
        if (pe.total) {
          const p = Math.round((pe.loaded * 100) / pe.total);
          setFileProgressMap(prev => ({ ...prev, [fileName]: p }));
        }
      }
    });

    if (singleRes.data?.status === 'success' && singleRes.data.file) {
      setFileProgressMap(prev => ({ ...prev, [fileName]: 100 }));
      return {
        ...singleRes.data.file,
        file: fileItem
      };
    } else {
      throw new Error(singleRes.data?.message || 'Single file upload failed');
    }
  };

  // High-Speed Concurrent Multi-Thread Upload Manager
  const handleFiles = async (selectedFiles) => {
    if (disabled || !selectedFiles || selectedFiles.length === 0) return;

    const fileList = Array.from(selectedFiles);
    setUploading(true);
    setUploadStats({ total: fileList.length, completed: 0, currentProgress: 0 });
    setFileProgressMap({});

    const successfulUploads = [];
    const errors = [];

    // Run in parallel with concurrency pool (3 simultaneous threads)
    const CONCURRENCY_LIMIT = 3;
    let activeIndex = 0;

    const runWorker = async () => {
      while (activeIndex < fileList.length) {
        const currentIndex = activeIndex++;
        const currentFile = fileList[currentIndex];

        try {
          const uploadedResult = await uploadSingleFile(currentFile, currentIndex, fileList.length);
          successfulUploads.push(uploadedResult);
          setFiles(prev => [...prev, uploadedResult]);
          setUploadStats(prev => {
            const newCompleted = prev.completed + 1;
            return {
              ...prev,
              completed: newCompleted,
              currentProgress: Math.round((newCompleted / fileList.length) * 100)
            };
          });
        } catch (err) {
          console.error(`Upload error for ${currentFile.name}:`, err);
          errors.push(`${currentFile.name}: ${err.message || 'Failed'}`);
          setFileProgressMap(prev => ({ ...prev, [currentFile.name]: -1 }));
        }
      }
    };

    try {
      const workers = [];
      const workerCount = Math.min(CONCURRENCY_LIMIT, fileList.length);
      for (let w = 0; w < workerCount; w++) {
        workers.push(runWorker());
      }
      await Promise.all(workers);

      if (successfulUploads.length > 0) {
        toast.success(`⚡ ${successfulUploads.length} of ${fileList.length} file(s) uploaded in super fast mode!`);
      }
      if (errors.length > 0) {
        toast.error(`Some files failed: ${errors.join(', ')}`);
      }
    } catch (generalErr) {
      console.error('Batch error:', generalErr);
      toast.error('Unexpected error during batch upload.');
    } finally {
      setUploading(false);
      setUploadStats({ total: 0, completed: 0, currentProgress: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    if (e.dataTransfer?.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
          disabled
            ? 'border-amber-500/30 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10 cursor-not-allowed opacity-90'
            : isDragging 
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 scale-[0.99] cursor-pointer' 
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer'
        } ${uploading ? 'opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".psd,.eps,.ai,.svg,.zip,.rar,.7z,.jpg,.jpeg,.png,.webp,.pdf,.mp4,.mov"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {disabled ? (
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
              <FiLock className="w-6 h-6 animate-pulse" />
            </div>
          ) : uploading ? (
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-inner">
              <FiZap className="w-6 h-6 animate-bounce text-emerald-500" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiUploadCloud className="w-6 h-6" />
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              {disabled ? (
                <>
                  <span>File Upload Locked</span>
                  <span className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                    {lockRemainingText ? `Unlocks in ${lockRemainingText}` : 'Wait'}
                  </span>
                </>
              ) : uploading ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <FiLoader className="w-4 h-4 animate-spin inline" />
                  Fast Parallel Uploading ({uploadStats.completed}/{uploadStats.total} Files Done)
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Click to upload or drag & drop files here
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md">
                    Fast Multi-thread
                  </span>
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {disabled
                ? 'The file dropzone will activate after the cooldown period.'
                : <>Supports <span className="font-semibold text-blue-600 dark:text-blue-400">PSD, EPS, AI, ZIP, JPG, PNG, MP4, PDF</span> (Select 8-10 files at once)</>}
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="w-full max-w-sm mt-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadStats.currentProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1.5">
                <span className="text-emerald-600 font-bold">{uploadStats.completed} of {uploadStats.total} Completed</span>
                <span className="font-mono text-blue-600 font-bold">{uploadStats.currentProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
            <span>Attached Submission Files ({files.length})</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <FiZap size={12} /> Cloudflare R2 Direct
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file, idx) => {
              const badge = getFileBadge(file.ext, file.file_type);
              const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes((file.ext || '').toLowerCase());

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-2 animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isImage ? (
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                      />
                    ) : (
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg border shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatFileSize(file.size)} • <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="View / Download"
                    >
                      <FiExternalLink size={13} />
                    </a>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove file"
                      >
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
