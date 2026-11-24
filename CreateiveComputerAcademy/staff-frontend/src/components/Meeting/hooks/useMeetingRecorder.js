import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  createCompositeMeetingStream,
  getSupportedMimeType,
  formatRecordingDuration,
  formatRecordingSize
} from '../meetingRecorderEngine';

/**
 * useMeetingRecorder Hook
 * Step 2: Manages meeting recording lifecycle:
 * - Start / Pause / Resume / Stop recording
 * - Real-time duration timer and size calculation
 * - Audio-video stream cleanup
 * - Local offline download as .webm / .mp4
 * - Prepares recorded video Blob for Step 5 (Google Drive upload)
 */
export function useMeetingRecorder({ isBn, roomId, currentUser }) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'starting' | 'recording' | 'paused' | 'stopped'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [recordedFileSize, setRecordedFileSize] = useState(0);
  const [recordingModalOpen, setRecordingModalOpen] = useState(false);

  // Upload state for Step 5
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const engineCleanupRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const mimeTypeRef = useRef('video/webm');

  const isRecording = recordingState === 'recording' || recordingState === 'paused';
  const isPaused = recordingState === 'paused';

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // 1. Start Recording
  const startRecording = useCallback(async ({ localStream, remotePeerList = [] }) => {
    if (isRecording) return;

    try {
      setRecordingState('starting');
      toast.info(isBn ? 'মিটিং ট্যাবটি সিলেক্ট করে "Share" চাপুন...' : 'Select the meeting tab and click "Share"...');

      // Step 1 Engine: Mix audio and capture viewport
      const { compositeStream, cleanup, videoTrack } = await createCompositeMeetingStream({
        localStream,
        remotePeerList,
        onScreenEnded: () => {
          // Trigger stop if user clicks browser's native "Stop sharing" bar
          stopRecording();
        }
      });

      engineCleanupRef.current = cleanup;
      recordedChunksRef.current = [];

      // Determine best supported MIME codec
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(compositeStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps crisp 1080p
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        if (chunks.length > 0) {
          const finalBlob = new Blob(chunks, { type: mimeTypeRef.current });
          const blobUrl = URL.createObjectURL(finalBlob);

          setRecordedBlob(finalBlob);
          setRecordedBlobUrl(blobUrl);
          setRecordedFileSize(finalBlob.size);
          setRecordingModalOpen(true);

          toast.success(isBn ? '🎉 মিটিং রেকর্ডিং সম্পন্ন হয়েছে!' : '🎉 Meeting recording completed!');
        } else {
          toast.error(isBn ? 'রেকর্ডিং ডেটা পাওয়া যায়নি।' : 'No recording data captured.');
        }

        setRecordingState('stopped');
        clearTimer();

        // Safe teardown of screen capture and audio mixer
        if (typeof engineCleanupRef.current === 'function') {
          engineCleanupRef.current();
          engineCleanupRef.current = null;
        }
      };

      // Collect data every 1000ms (incremental streaming chunks)
      mediaRecorder.start(1000);
      setRecordingState('recording');
      setRecordingDuration(0);

      // Start duration counter
      clearTimer();
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(sec => sec + 1);
      }, 1000);

      toast.success(isBn ? '🔴 মিটিং রেকর্ডিং শুরু হয়েছে' : '🔴 Meeting recording started');
    } catch (err) {
      console.warn('Recording start error:', err);
      setRecordingState('idle');
      clearTimer();

      if (typeof engineCleanupRef.current === 'function') {
        engineCleanupRef.current();
        engineCleanupRef.current = null;
      }

      if (err.name === 'NotAllowedError') {
        toast.error(isBn ? 'স্ক্রিন শেয়ার পারমিশন দেওয়া হয়নি।' : 'Screen share permission was denied.');
      } else {
        toast.error(err.message || (isBn ? 'রেকর্ডিং শুরু করা সম্ভব হয়নি।' : 'Failed to start recording.'));
      }
    }
  }, [isRecording, isBn, clearTimer]);

  // 2. Pause Recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      clearTimer();
      toast.info(isBn ? '⏸️ রেকর্ডিং স্থগিত রাখা হয়েছে' : '⏸️ Recording paused');
    }
  }, [clearTimer, isBn]);

  // 3. Resume Recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');

      clearTimer();
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(sec => sec + 1);
      }, 1000);

      toast.info(isBn ? '▶️ রেকর্ডিং পুনরায় চালু হয়েছে' : '▶️ Recording resumed');
    }
  }, [clearTimer, isBn]);

  // 4. Stop Recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
      clearTimer();
    } else if (recordingState === 'starting') {
      setRecordingState('idle');
      clearTimer();
      if (typeof engineCleanupRef.current === 'function') {
        engineCleanupRef.current();
        engineCleanupRef.current = null;
      }
    }
  }, [clearTimer, recordingState]);

  // 5. Download Locally to User's PC
  const downloadLocally = useCallback((customName) => {
    if (!recordedBlob) {
      toast.error(isBn ? 'কোনো রেকর্ডিং ফাইল পাওয়া যায়নি।' : 'No recording file found.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeRoomId = roomId ? roomId.replace(/[^a-zA-Z0-9]/g, '_') : 'meeting';
    const isMp4 = mimeTypeRef.current.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const defaultName = `CCA_Meeting_${safeRoomId}_${timestamp}.${ext}`;
    const filename = customName || defaultName;

    const url = recordedBlobUrl || URL.createObjectURL(recordedBlob);
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.setAttribute('download', filename);
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    toast.success(isBn ? `💾 "${filename}" পিসিতে ডাউনলোড হচ্ছে...` : `💾 Downloading "${filename}" to PC...`);
  }, [recordedBlob, recordedBlobUrl, roomId, isBn]);

  // 6. Discard Recording & Free Memory
  const discardRecording = useCallback(() => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlob(null);
    setRecordedBlobUrl(null);
    setRecordedFileSize(0);
    setRecordingDuration(0);
    setRecordingModalOpen(false);
    setRecordingState('idle');
    setUploadProgress(0);
    setIsUploading(false);
  }, [recordedBlobUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (typeof engineCleanupRef.current === 'function') {
        try { engineCleanupRef.current(); } catch (e) {}
      }
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl);
      }
    };
  }, [clearTimer, recordedBlobUrl]);

  return {
    recordingState,
    isRecording,
    isPaused,
    recordingDuration,
    formattedDuration: formatRecordingDuration(recordingDuration),
    recordedBlob,
    recordedBlobUrl,
    recordedFileSize,
    formattedFileSize: formatRecordingSize(recordedFileSize),
    recordingModalOpen,
    setRecordingModalOpen,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadLocally,
    discardRecording,
  };
}
