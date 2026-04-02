"use client";

import { useState, useEffect } from "react";
import { DownloadCloud, Lock, Eye, Film, Image as ImgIcon, Timer, ShieldAlert, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdSpace from "@/components/AdSpace";
import { useI18n } from "@/components/I18nProvider";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export default function DownloadClientUI({ id, fileName, sizeBytes, hasPassword, isOneTime, expiresAt }: { id: string, fileName: string, sizeBytes: number, hasPassword: boolean, isOneTime?: boolean, expiresAt?: number | null }) {
  const dict = useI18n();
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
        setTimeLeft(dict.download.expired);
        return;
      }
      
      if (diffHours < 1) {
        const mins = Math.floor(diffHours * 60);
        setTimeLeft(`${dict.download.expiresIn} ${mins} ${mins === 1 ? dict.download.minute : mins >= 2 && mins <= 4 ? dict.download.minutes24 : dict.download.minutes}`);
      } else if (diffHours < 24) {
        const hrs = Math.floor(diffHours);
        setTimeLeft(`${dict.download.expiresIn} ${hrs} ${hrs === 1 ? dict.download.hour : hrs >= 2 && hrs <= 4 ? dict.download.hours24 : dict.download.hours}`);
      } else {
        const days = Math.floor(diffHours / 24);
        setTimeLeft(`${dict.download.expiresIn} ${days} ${days === 1 ? dict.download.day : dict.download.days}`);
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
      
      const hash = window.location.hash.substring(1);
      let targetUrl = data.signedUrl;
      let targetMime = data.file?.mimeType || 'application/octet-stream';
      let previewTargetUrl = data.previewUrl || data.signedUrl;
      
      if (hash) {
        const fileRes = await fetch(data.signedUrl);
        const finalBuffer = await fileRes.arrayBuffer();
        const finalBytes = new Uint8Array(finalBuffer);
        const iv = finalBytes.slice(0, 12);
        const ciphertext = finalBytes.slice(12);

        const keyBuffer = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
          'raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']
        );
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          cryptoKey,
          ciphertext
        );
        const blob = new Blob([decryptedBuffer], { type: targetMime });
        targetUrl = URL.createObjectURL(blob);
        previewTargetUrl = targetUrl;
      }

      if (action === 'download' || !data.previewUrl) {
        if (hash) {
          const a = document.createElement('a');
          a.href = targetUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.location.href = data.signedUrl;
        }
      } else {
        setPreviewData({ url: previewTargetUrl, mime: targetMime, dlUrl: targetUrl });
      }
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setError(dict.download.errorClient);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!previewData ? (
          <motion.div key="split-view" exit={{ opacity: 0, scale: 0.95 }} className="w-full relative z-10">
            <HeroGeometric 
               badge={dict.download.heroBadge}
               title1={dict.download.heroTitle1 + " " + dict.download.heroTitle2}
               title2={dict.download.heroTitleHighlight}
            >
            <div className="w-full flex justify-center mt-12 z-20">

            {/* KARTA W STYLU UPLOADU */}
            <div className="z-10 w-full max-w-xl flex flex-col space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full glass-panel rounded-[2rem] p-4 md:p-8 relative"
              >
                <div className="upload-zone relative w-full flex flex-col items-center justify-center rounded-[1.5rem] p-8 md:p-10 overflow-hidden">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                  <DownloadCloud className="w-7 h-7 text-primary" />
                </div>
                
                <h1 className="text-xl font-extrabold text-foreground mb-1 max-w-sm text-center truncate w-full" title={fileName}>
                  {fileName}
                </h1>
            
            <div className="flex items-center justify-center gap-2 mt-1 mb-8">
              <p className="text-slate-400 font-bold text-xs">
                {formatSize(sizeBytes)}
              </p>
              
              {isOneTime && (
                <p className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3"/> {dict.download.bombWarningTag}
                </p>
              )}
              
              {timeLeft && (
                <p className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  <Timer className="w-3 h-3"/> {timeLeft}
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
                  placeholder={dict.download.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-4 ring-primary/20 transition-all font-medium placeholder-slate-500"
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm font-bold mb-6 w-full text-center bg-red-500/10 border border-red-500/20 py-3 rounded-lg shadow-sm">{error}</p>
            )}

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => handleAction('download')}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-primary hover:bg-emerald-600 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
              >
                {isProcessing ? dict.download.processing : dict.download.downloadBtn}
                {!isProcessing && <DownloadCloud className="w-5 h-5"/>}
              </button>

              {showPreviewBtn && (
                <button
                  onClick={() => handleAction('preview')}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  <Eye className="w-5 h-5"/> {dict.download.previewBtn}
                </button>
              )}
            </div>

            <div className="w-full mt-8 lg:hidden block">
              <AdSpace dataAdSlot="glowne_miejsce_pobierania" />
            </div>

            <p className="text-xs text-slate-500 font-medium text-center mt-6">
              {dict.download.tosText}
            </p>
                </div>
              </motion.div>
            </div>

            </div>
            </HeroGeometric>
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
                    {dict.download.backBtnText}
                 </button>
                 <button 
                   onClick={() => window.location.href = previewData?.dlUrl || ''}
                   className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-primary/20"
                  >
                    <DownloadCloud className="w-4 h-4"/> {dict.download.saveBtn}
                 </button>
               </div>
             </div>

             <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex-shrink-0 flex items-center justify-center border border-gray-200">
               {previewData?.mime.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                 <img src={previewData.url} alt={dict.download.previewTitle} className="max-w-full max-h-full object-contain" />
               ) : previewData?.mime.startsWith('video/') ? (
                 <video src={previewData.url} controls autoPlay className="w-full h-full outline-none" />
               ) : (
                 <div className="flex flex-col items-center text-white p-8">
                   <Film className="w-12 h-12 mb-4 text-gray-500" />
                   <p>{dict.download.mustDownloadText}</p>
                 </div>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
