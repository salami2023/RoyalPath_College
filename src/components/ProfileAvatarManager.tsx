import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Video, VideoOff, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { db } from '../database';

interface ProfileAvatarManagerProps {
  userId: string;
  userFullName: string;
  onAvatarUpdated: () => void;
}

export default function ProfileAvatarManager({
  userId,
  userFullName,
  onAvatarUpdated,
}: ProfileAvatarManagerProps) {
  const [currentUser, setCurrentUser] = useState(() => {
    return db.getRawData().users.find((u) => u.id === userId);
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Sync state if userId changes
  useEffect(() => {
    setCurrentUser(db.getRawData().users.find((u) => u.id === userId));
  }, [userId]);

  // Clean up camera stream on unmount or when camera deactivated
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => {
          console.error("Error starting video play:", err);
        });
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Could not access standard camera. Please check camera permissions in your browser.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas to a clean square sizing
        const size = Math.min(video.videoWidth, video.videoHeight) || 300;
        canvas.width = size;
        canvas.height = size;

        // Crop center of video feed for square avatar standard
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;

        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

        // Convert canvas image to Base64 representation
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Save to Database
        db.updateUserAvatar(userId, dataUrl);

        // Update local session storage so the change propagates
        const rawSession = localStorage.getItem('school_portal_user_session');
        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            if (parsed.id === userId) {
              parsed.avatarUrl = dataUrl;
              localStorage.setItem('school_portal_user_session', JSON.stringify(parsed));
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Trigger dynamic updates
        onAvatarUpdated();
        setCurrentUser(db.getRawData().users.find((u) => u.id === userId));
        stopCamera();
      }
    } catch (err) {
      console.error('Capture photo error:', err);
      setCameraError('Failed to capture image snapshot. Please retry.');
    }
  };

  // Handle uploaded picture files
  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only image files (JPEG, PNG, WebP) are supported.');
      return;
    }

    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;

      try {
        db.updateUserAvatar(userId, base64String);

        // Update local session storage
        const rawSession = localStorage.getItem('school_portal_user_session');
        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            if (parsed.id === userId) {
              parsed.avatarUrl = base64String;
              localStorage.setItem('school_portal_user_session', JSON.stringify(parsed));
            }
          } catch (e) {
            console.error(e);
          }
        }

        onAvatarUpdated();
        setCurrentUser(db.getRawData().users.find((u) => u.id === userId));
      } catch (err) {
        console.error(err);
        alert('File upload failed. Try a smaller image.');
      } finally {
        setIsSaving(false);
      }
    };

    reader.onerror = () => {
      alert('Could not parse image file.');
      setIsSaving(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const deleteCurrentAvatar = () => {
    db.updateUserAvatar(userId, '');
    
    const rawSession = localStorage.getItem('school_portal_user_session');
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        if (parsed.id === userId) {
          delete parsed.avatarUrl;
          localStorage.setItem('school_portal_user_session', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error(e);
      }
    }

    onAvatarUpdated();
    setCurrentUser(db.getRawData().users.find((u) => u.id === userId));
  };

  const initials = userFullName
    ? userFullName
        .split(' ')
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'UP';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-6">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <Camera className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">
          Profile Picture Manager
        </h3>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar Display Frame */}
        <div className="relative shrink-0 select-none">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={userFullName}
              className="w-32 h-32 rounded-3xl object-cover border-4 border-indigo-100 shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-32 h-32 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-md border-4 border-indigo-100">
              {initials}
            </div>
          )}

          {currentUser?.avatarUrl && (
            <button
              onClick={deleteCurrentAvatar}
              type="button"
              className="absolute -bottom-2 -right-2 bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl shadow-xs hover:scale-105 transition-all text-xs border border-rose-200 cursor-pointer"
              title="Remove Profile photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls / Forms */}
        <div className="flex-1 w-full space-y-4">
          {!isCameraActive ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Capture an instant photo using your device webcam, or upload an image file (PNG, JPEG, WebP) directly from your current storage drive. Max safe resolution size recommended is 500x500px.
              </p>

              {/* Upload Drag/Drop Box Or Selection */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6.5 text-center transition-all cursor-pointer select-none ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-700">
                  {isSaving ? 'Processing photo...' : 'Drag & Drop your picture here'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">
                  Or click here to browse files
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-slate-900 hover:bg-black text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Use Camera Snap</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Container */
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-4 max-w-sm w-full mx-auto md:mx-0">
              <div className="relative aspect-square rounded-xl bg-black overflow-hidden flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-black text-[8px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                  <span>Live Camera View</span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="border border-slate-750 hover:bg-slate-800 text-slate-300 font-bold py-2 px-3 rounded-lg text-[11px] uppercase tracking-wide transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-indigo-600 hover:bg-indigo-505 text-white font-black py-2 px-4.5 rounded-lg text-[11px] uppercase tracking-wide transition-all shadow-md flex items-center gap-1 animate-pulse cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture Snap</span>
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-150 rounded-2xl text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
