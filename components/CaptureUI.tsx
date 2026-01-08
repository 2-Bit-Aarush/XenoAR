
import React, { useRef, useState, useEffect } from 'react';
import { CaptureImage } from '../types';

interface CaptureUIProps {
  onComplete: (images: CaptureImage[]) => void;
  onCancel: () => void;
}

const CaptureUI: React.FC<CaptureUIProps> = ({ onComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<CaptureImage[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64 = dataUrl.split(',')[1];
    
    setCapturedImages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      url: dataUrl,
      base64,
      mimeType: 'image/jpeg'
    }]);

    // Simple haptic-like flash
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-white z-[100] animate-out fade-out duration-300 pointer-events-none';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 300);
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
      <div className="relative flex-1 bg-neutral-900">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Viewfinder Overlay */}
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 -translate-x-1 -translate-y-1 rounded-tl-lg" />
             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 translate-x-1 -translate-y-1 rounded-tr-lg" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 -translate-x-1 translate-y-1 rounded-bl-lg" />
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 translate-x-1 translate-y-1 rounded-br-lg" />
          </div>
        </div>

        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button onClick={onCancel} className="p-3 glass rounded-full text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="px-4 py-2 glass rounded-full text-[10px] font-bold text-blue-500 mono tracking-widest uppercase">
            Captured: {capturedImages.length}/5
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="p-8 pb-12 flex items-center justify-between gap-6">
        <div className="w-16 h-16 rounded-xl overflow-hidden glass border border-white/10">
          {capturedImages.length > 0 ? (
            <img src={capturedImages[capturedImages.length - 1].url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-800" />
          )}
        </div>

        <button 
          onClick={takePhoto}
          disabled={capturedImages.length >= 8}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center group active:scale-90 transition-all border-4 border-white/20"
        >
          <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
        </button>

        <button 
          onClick={() => onComplete(capturedImages)}
          disabled={capturedImages.length < 2}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${capturedImages.length >= 2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-neutral-800 text-neutral-600'}`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </button>
      </div>

      <div className="px-10 pb-6 text-center">
        <p className="text-gray-500 text-xs italic">Take at least 2 photos from different angles for better reconstruction.</p>
      </div>
    </div>
  );
};

export default CaptureUI;
