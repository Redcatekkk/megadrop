"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File as FileIcon, X, Lock, ShieldAlert, Zap, Link as LinkIcon, CheckCircle2, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdSpace from "@/components/AdSpace";
import { useI18n } from "@/components/I18nProvider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const dict = useI18n();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(168);
  const [copied, setCopied] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  }, [isUploading]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(0);

    try {
      const res = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          isOneTime,
          hasPassword,
          password: hasPassword ? password : null,
          expiresInHours
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        if (res.status === 429) {
          alert(dict.home.rateLimitError || "Zbyt wiele zapytań (Rate Limit). Odczekaj przed kolejnym wysłaniem.");
        } else {
          alert(dict.home.dbError + (data.error || ""));
        }
        setIsUploading(false);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.signedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setIsUploading(false);
          const link = `${window.location.origin}/f/${data.fileId}`;
          setDownloadLink(link);
        } else {
          alert(dict.home.uploadError);
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        alert(dict.home.netError);
        setIsUploading(false);
      };

      xhr.send(file);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      alert(dict.home.unexpectedError);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(downloadLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const resetUpload = () => {
    setFile(null);
    setDownloadLink("");
    setProgress(0);
    setIsOneTime(false);
    setHasPassword(false);
    setPassword("");
    setExpiresInHours(168);
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen">
      <div className="z-10 w-full max-w-2xl flex flex-col items-center space-y-8">
        
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-semibold mb-2"
          >
            <Zap className="w-4 h-4 fill-primary" />
            <span>{dict.home.heroBadge}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4"
          >
            {dict.home.heroTitle1} <br className="md:hidden" /> {dict.home.heroTitle2} <span className="text-gradient">{dict.home.heroTitleHighlight}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-lg mx-auto font-medium"
          >
            {dict.home.heroDesc}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full glass-panel rounded-[2rem] p-4 md:p-8 relative"
        >
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "upload-zone relative w-full flex flex-col items-center justify-center rounded-[1.5rem] p-8 md:p-14 overflow-hidden",
              isDragging ? "drag-active border-primary/50" : "",
              isUploading ? "pointer-events-none opacity-90 border-transparent bg-white shadow-sm" : ""
            )}
          >
            <AnimatePresence mode="wait">
              {downloadLink ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center space-y-6 w-full z-20"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{dict.home.fileReady}</h3>
                    <p className="text-gray-600 font-medium">{dict.home.copyHelperText}</p>
                  </div>
                  
                  <div className="flex w-full overflow-hidden items-center pl-4 bg-secondary rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all">
                    <LinkIcon className="w-5 h-5 text-gray-500 shrink-0" />
                    <input 
                      readOnly 
                      value={downloadLink}
                      className="flex-1 bg-transparent border-none text-foreground focus:outline-none p-4 text-sm font-mono"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className={cn(
                        "h-full px-6 font-bold transition-colors m-1 rounded-lg",
                        copied ? "bg-green-600 text-white" : "bg-primary text-white hover:bg-blue-700 hover:shadow-md hover:shadow-primary/20"
                      )}
                    >
                      {copied ? dict.home.copied : dict.home.copy}
                    </button>
                  </div>

                  <button onClick={resetUpload} className="text-sm font-semibold text-gray-500 hover:text-black underline decoration-2 underline-offset-4 mt-2">
                    {dict.home.uploadNext}
                  </button>
                </motion.div>
              ) : !file ? (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center space-y-5"
                >
                  <div className="p-5 rounded-full bg-primary/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <UploadCloud className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{dict.home.clickOrDrag}</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">{dict.home.noLimits}</p>
                  </div>
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
                  }} />
                </motion.div>
              ) : (
                <motion.div
                  key="file-info"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full z-20"
                >
                  {/* KARTA PLIKU Z ENERGY BAREM */}
                  <div className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden h-20">
                    
                    {/* Energy Bar (Pasek Progresu) */}
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-primary z-0 overflow-hidden rounded-2xl"
                      initial={{ width: 0 }}
                      animate={{ width: isUploading ? `${progress}%` : 0 }}
                      transition={{ ease: "linear", duration: 0.2 }}
                    >
                      {/* Błysk przesuwający się po żywym pasku */}
                      <motion.div 
                        animate={{ x: ['-200%', '300%'] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                      />
                    </motion.div>

                    <div className="flex-shrink-0 p-3 bg-gray-100 rounded-xl relative z-10 transition-colors" style={isUploading ? { backgroundColor: 'white'} : {}}>
                      <FileIcon className={cn("w-6 h-6", isUploading ? "text-primary" : "text-gray-500")} />
                    </div>
                    
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className={cn("text-sm font-bold truncate transition-colors", isUploading ? "text-slate-900 drop-shadow-sm font-extrabold" : "text-foreground")}>
                        {file.name}
                      </p>
                      <p className={cn("text-xs mt-0.5 font-bold transition-colors", isUploading ? "text-slate-800 drop-shadow-sm" : "text-gray-500")}>
                        {isUploading ? `${dict.home.uploadingFile} ${progress}%` : formatFileSize(file.size)}
                      </p>
                    </div>

                    {!isUploading && (
                      <button 
                        onClick={() => setFile(null)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors relative z-10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {!isUploading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="w-full mt-6 space-y-4"
                    >
                      {/* Opcje przesyłania (Zabezpieczenie & Czas) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        
                        <label className={cn(
                          "flex flex-col gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer h-full", 
                          hasPassword ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-gray-300"
                        )}>
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={hasPassword} onChange={(e) => setHasPassword(e.target.checked)} className="mt-1 accent-primary w-4 h-4 cursor-pointer" />
                            <div>
                              <p className="text-sm font-bold flex items-center gap-1.5 text-foreground"><Lock className="w-4 h-4 text-gray-600"/> {dict.home.secureWithPassword}</p>
                              <p className="text-xs text-gray-500 mt-1 font-medium">{dict.home.passwordRequiredExt}</p>
                            </div>
                          </div>
                          {hasPassword && (
                            <input 
                              type="password" 
                              placeholder={dict.home.inputPasswordStrong} 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="mt-3 w-full bg-secondary border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-primary focus:ring-1 ring-primary/50"
                            />
                          )}
                        </label>

                        <div className="flex flex-col gap-4">
                          <label className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer", 
                            isOneTime ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
                          )}>
                            <input type="checkbox" checked={isOneTime} onChange={(e) => setIsOneTime(e.target.checked)} className="mt-1 accent-red-500 w-4 h-4 cursor-pointer shrink-0" />
                            <div>
                              <p className="text-sm font-bold flex items-center gap-1.5 text-foreground"><ShieldAlert className="w-4 h-4 text-red-500"/> {dict.home.bombFile}</p>
                              <p className="text-xs text-gray-500 mt-1 font-medium">{dict.home.bombFileExt}</p>
                            </div>
                          </label>

                          <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white transition-all">
                            <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              {dict.home.whenFileDie}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { l: dict.home.expires1Hour, v: 1 }, 
                                { l: dict.home.expires24Hours, v: 24 }, 
                                { l: dict.home.expires7Days, v: 168 }, 
                                { l: dict.home.expiresNever, v: 0 }
                              ].map(opt => (
                                <button
                                  key={opt.v}
                                  onClick={(e) => { e.preventDefault(); setExpiresInHours(opt.v); }}
                                  className={cn(
                                    "py-2.5 px-2 rounded-lg text-xs font-bold transition-all border outline-none",
                                    expiresInHours === opt.v 
                                      ? "bg-primary border-primary text-white shadow-md shadow-primary/30 scale-[1.02]" 
                                      : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 hover:border-gray-300"
                                  )}
                                >
                                  {opt.l}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      <button onClick={handleUpload} className="w-full mt-4 py-4 rounded-xl font-bold text-white text-lg bg-[#F97316] hover:bg-[#EA580C] focus:ring-4 focus:ring-[#F97316]/30 transition-all shadow-lg hover:shadow-[#F97316]/20 active:scale-[0.98]">
                        {dict.home.uploadBtnAction}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="w-full mt-4">
          <AdSpace dataAdSlot="upload_home_bottom" />
        </div>

      </div>
    </main>
  );
}
