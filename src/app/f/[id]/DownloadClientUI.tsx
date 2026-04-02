"use client";

import { useState, useEffect } from "react";
import { DownloadCloud, Lock, Eye, Film, Image as ImgIcon, Timer, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdSpace from "@/components/AdSpace";

export default function DownloadClientUI({ id, fileName, sizeBytes, hasPassword, isOneTime, expiresAt }: { id: string, fileName: string, sizeBytes: number, hasPassword: boolean, isOneTime?: boolean, expiresAt?: number | null }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [previewData, setPreviewData] = useState<{ url: string, mime: string, dlUrl: string } | null>(null);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isPossibleMedia = /\.(mp4|webm|ogg|jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const showPreviewBtn = isPossibleMedia && !isOneTime;

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTime = () => {
      const diffHours = (expiresAt - Date.now()) / (1000 * 60 * 60);
      if (diffHours <= 0) {
        setTimeLeft("plik wygasł");
        return;
      }
      
      if (diffHours < 1) {
        const mins = Math.floor(diffHours * 60);
        setTimeLeft(`wygasa za ${mins} ${mins === 1 ? 'minutę' : mins >= 2 && mins <= 4 ? 'minuty' : 'minut'}`);
      } else if (diffHours < 24) {
        const hrs = Math.floor(diffHours);
        setTimeLeft(`wygasa za ${hrs} ${hrs === 1 ? 'godzinę' : hrs >= 2 && hrs <= 4 ? 'godziny' : 'godzin'}`);
      } else {
        const days = Math.floor(diffHours / 24);
        setTimeLeft(`wygasa za ${days} ${days === 1 ? 'dzień' : 'dni'}`);
      }
    };

    updateTime();
    // Odświeżaj co minutę
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleAction = async (action: 'download' | 'preview') => {
    setError("");
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/download/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error);
        setIsProcessing(false);
        return;
      }
      
      if (action === 'download' || !data.previewUrl) {
        window.location.href = data.signedUrl;
      } else {
        setPreviewData({ url: data.previewUrl, mime: data.file.mimeType, dlUrl: data.signedUrl });
      }
      setIsProcessing(false);
    } catch (e) {
      setError("Wystąpił błąd po stronie klienta.");
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel w-full max-w-xl p-8 md:p-12 rounded-[2rem] flex flex-col items-center relative z-10 bg-white"
    >
      <AnimatePresence mode="wait">
        {!previewData ? (
          <motion.div key="main" className="w-full flex flex-col items-center" exit={{ opacity: 0, scale: 0.95 }}>
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100 shadow-inner">
              <DownloadCloud className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-foreground mb-3 max-w-sm text-center truncate w-full" title={fileName}>
              {fileName}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
              <p className="text-gray-600 font-bold bg-gray-100/80 border border-gray-200 px-4 py-1.5 rounded-full text-sm">
                {formatSize(sizeBytes)}
              </p>
              
              {isOneTime && (
                <p className="text-red-600 font-bold bg-red-50 border border-red-200 px-4 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-sm">
                  <ShieldAlert className="w-4 h-4"/> Wybucha po pobraniu
                </p>
              )}
              
              {timeLeft && (
                <p className="text-orange-600 font-bold bg-orange-50 border border-orange-200 px-4 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-sm">
                  <Timer className="w-4 h-4"/> {timeLeft}
                </p>
              )}
            </div>

            {hasPassword && (
              <div className="w-full mb-6 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="password"
                  placeholder="Ten plik wymaga hasła"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl py-4 pl-12 pr-4 text-black focus:outline-none focus:border-primary focus:ring-4 ring-primary/20 transition-all font-medium placeholder-gray-400"
                />
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm font-bold mb-6 w-full text-center bg-red-50 border border-red-100 py-3 rounded-lg shadow-sm">{error}</p>
            )}

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => handleAction('download')}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-primary hover:bg-[#e66000] transition-all shadow-xl shadow-primary/25 active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
              >
                {isProcessing ? "Przetwarzanie..." : "Pobierz Teraz"}
                {!isProcessing && <DownloadCloud className="w-5 h-5"/>}
              </button>

              {showPreviewBtn && (
                <button
                  onClick={() => handleAction('preview')}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  <Eye className="w-5 h-5"/> Podgląd wideo
                </button>
              )}
            </div>

            <div className="w-full mt-8">
              <AdSpace dataAdSlot="glowne_miejsce_pobierania" />
            </div>

            <p className="text-xs text-gray-400 font-medium text-center mt-6 px-4">
              Zgodnie z naszym regulaminem, plik pobierasz na własną odpowiedzialność. Zapisz go bezpiecznie na dysku lokalnym.
            </p>
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col items-center">
             <div className="w-full flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold truncate pr-4">{fileName}</h2>
               <div className="flex items-center gap-3 shrink-0">
                 <button 
                   onClick={() => setPreviewData(null)}
                   className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Wróć
                 </button>
                 <button 
                   onClick={() => window.location.href = previewData.dlUrl}
                   className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-[#e66000] flex items-center gap-2 shadow-md shadow-primary/20"
                  >
                    <DownloadCloud className="w-4 h-4"/> Zapisz
                 </button>
               </div>
             </div>

             <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex-shrink-0 flex items-center justify-center border border-gray-200">
               {previewData.mime.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                 <img src={previewData.url} alt="Podgląd" className="max-w-full max-h-full object-contain" />
               ) : previewData.mime.startsWith('video/') ? (
                 <video src={previewData.url} controls autoPlay className="w-full h-full outline-none" />
               ) : (
                 <div className="flex flex-col items-center text-white p-8">
                   <Film className="w-12 h-12 mb-4 text-gray-500" />
                   <p>Ten plik musi zostać pobrany aby go zobaczyć.</p>
                 </div>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
