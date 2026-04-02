"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File as FileIcon, X, Lock, ShieldAlert, Zap, Link as LinkIcon, CheckCircle2, Clock, QrCode, Archive } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import JSZip from "jszip";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdSpace from "@/components/AdSpace";
import { useI18n } from "@/components/I18nProvider";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const dict = useI18n();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(168);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

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
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length === 1) {
        setFile(dropped[0]);
        setFiles([]);
      } else {
        setFiles(dropped);
        setFile(null);
      }
    }
  }, [isUploading]);

  const handleUpload = async () => {
    if (!file && files.length === 0) return;
    setIsUploading(true);
    setProgress(0);

    // Auto-ZIP jeśli wiele plików
    let uploadFile = file;
    if (files.length > 1) {
      const zip = new JSZip();
      files.forEach(f => zip.file(f.name, f));
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }, (meta) => {
        setProgress(Math.round(meta.percent / 2)); // pierwsza połowa - pakowanie
      });
      uploadFile = new File([blob], `megadrop-${files.length}-files.zip`, { type: "application/zip" });
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );
      
      const fileBuffer = await uploadFile!.arrayBuffer();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        fileBuffer
      );

      const finalBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      finalBuffer.set(iv, 0);
      finalBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

      const encryptedBlob = new Blob([finalBuffer], { type: uploadFile!.type || "application/octet-stream" });

      const res = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile!.name,
          sizeBytes: encryptedBlob.size,
          mimeType: uploadFile!.type,
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
      xhr.setRequestHeader("Content-Type", uploadFile!.type || "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const base = files.length > 1 ? 50 : 0; // jeśli był ZIP, upload = 50-100%
          const uploadPercent = (e.loaded / e.total) * (files.length > 1 ? 50 : 100);
          setProgress(Math.round(base + uploadPercent));
        }
      };

      xhr.onerror = () => {
        alert(dict.home.netError);
        setIsUploading(false);
      };

      xhr.onload = async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setIsUploading(false);
          const exportedKey = await crypto.subtle.exportKey('raw', key);
          const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
          const match = window.location.pathname.match(/^\/(en|pl)/);
          const langPrefix = match ? match[0] : '';
          const link = `${window.location.origin}${langPrefix}/f/${data.fileId}#${keyBase64}`;
          setDownloadLink(link);
          setFiles([]);
        } else {
          alert(dict.home.uploadError);
          setIsUploading(false);
        }
      };

      xhr.send(encryptedBlob);
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
    setFiles([]);
    setDownloadLink("");
    setProgress(0);
    setIsOneTime(false);
    setHasPassword(false);
    setPassword("");
    setExpiresInHours(168);
  }

  return (
    <HeroGeometric 
       badge={dict.home.heroBadge}
       title1={dict.home.heroTitle1 + " " + dict.home.heroTitle2}
       title2={dict.home.heroTitleHighlight}
    >
      <div className="w-full flex justify-center mt-12 z-20">

      {/* PRAWA KOLUMNA: Interfejs Uploadu */}
      <div className="z-10 w-full lg:w-1/2 max-w-xl flex flex-col space-y-6">
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
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{dict.home.fileReady}</h3>
                    <p className="text-slate-400 font-medium">{dict.home.copyHelperText}</p>
                  </div>
                  
                  <div className="flex w-full overflow-hidden items-center pl-4 bg-white/5 rounded-xl border border-white/10 focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all">
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
                        copied ? "bg-green-600 text-white" : "bg-primary text-white hover:bg-emerald-600 hover:shadow-md hover:shadow-primary/20"
                      )}
                    >
                      {copied ? dict.home.copied : dict.home.copy}
                    </button>
                  </div>

                  {/* QR CODE TOGGLE */}
                  <div className="w-full">
                    <button
                      onClick={() => setShowQr(v => !v)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-primary transition-colors mx-auto"
                    >
                      <QrCode className="w-4 h-4" />
                      {showQr ? "Ukryj QR Code" : "Pokaż QR Code"}
                    </button>
                    <AnimatePresence>
                      {showQr && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex justify-center mt-4 overflow-hidden"
                        >
                          <div className="p-3 bg-white rounded-2xl shadow-lg shadow-black/30">
                            <QRCodeSVG
                              value={downloadLink}
                              size={160}
                              bgColor="#ffffff"
                              fgColor="#0A0A0F"
                              level="M"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={resetUpload} className="text-sm font-semibold text-slate-400 hover:text-white underline decoration-2 underline-offset-4 mt-2">
                    {dict.home.uploadNext}
                  </button>
                </motion.div>
              ) : (!file && files.length === 0) ? (
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
                    <p className="text-sm text-slate-500 mt-2 font-medium">{dict.home.noLimits}</p>
                    <p className="text-xs text-primary/70 mt-1 font-medium">Wiele plików? Wrzuc wszystkie — zapakujemy w ZIP!</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const picked = Array.from(e.target.files);
                      if (picked.length === 1) { setFile(picked[0]); setFiles([]); }
                      else { setFiles(picked); setFile(null); }
                    }}
                  />
                </motion.div>
              ) : files.length > 1 ? (
                /* MULTI-FILE VIEW */
                <motion.div key="multi-file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full z-20 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Archive className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-extrabold text-white">{files.length} plików wybranych</p>
                    <p className="text-xs text-slate-400 mt-0.5">Zostaną spakowane w ZIP przed wysłaniem</p>
                  </div>
                  <div className="w-full max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                        <FileIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-xs text-slate-300 truncate flex-1">{f.name}</span>
                        <span className="text-xs text-slate-500 shrink-0">{formatFileSize(f.size)}</span>
                      </div>
                    ))}
                  </div>
                  {!isUploading && (
                    <button onClick={() => setFiles([])} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                      <X className="w-3.5 h-3.5" /> Wyczyść wybrane pliki
                    </button>
                  )}
                  {isUploading && (
                    <div className="w-full">
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                        <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.2 }} />
                      </div>
                      <p className="text-center text-sm text-slate-400 mt-2 font-bold">
                        {progress < 50 ? `Pakowanie ZIP... ${Math.round(progress * 2)}%` : `Wysyłanie... ${Math.round((progress - 50) * 2)}%`}
                      </p>
                    </div>
                  )}
                  {!isUploading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full space-y-3 mt-4">
                      {/* Premium List Layout */}
                      <div className="flex flex-col gap-2 w-full">
                        
                        {/* Zabezpiecz hasłem */}
                        <div className={cn("flex flex-col p-4 rounded-2xl border transition-all duration-300", hasPassword ? "bg-primary/5 border-primary/30 shadow-sm shadow-primary/5" : "bg-white/5 border-white/5 hover:border-white/10")}>
                          <label className="flex items-center justify-between cursor-pointer w-full">
                            <div className="flex items-center gap-4">
                              <div className={cn("p-2.5 rounded-xl transition-colors", hasPassword ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-400")}>
                                <Lock className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-white leading-none">{dict.home.secureWithPassword}</p>
                                <p className="text-xs text-slate-400 mt-1.5 font-medium">{dict.home.passwordRequiredExt}</p>
                              </div>
                            </div>
                            <div className={cn("w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer shrink-0 ml-4", hasPassword ? "bg-primary" : "bg-white/20")}>
                               <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", hasPassword ? "translate-x-5" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={hasPassword} onChange={(e) => setHasPassword(e.target.checked)} />
                          </label>
                          <AnimatePresence>
                            {hasPassword && (
                              <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 16 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden">
                                <input type="password" placeholder={dict.home.inputPasswordStrong} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-primary/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 ring-primary/50 shadow-inner" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Bezpieczne usunięcie po 1 pobraniu / Bomb */}
                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer", isOneTime ? "bg-red-500/5 border-red-500/30 shadow-sm shadow-red-500/5" : "bg-white/5 border-white/5 hover:border-white/10")}>
                          <div className="flex items-center gap-4 w-3/4">
                            <div className={cn("p-2.5 rounded-xl transition-colors shrink-0", isOneTime ? "bg-red-500/20 text-red-500" : "bg-white/10 text-slate-400")}>
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="text-left w-full pr-2">
                              <p className="text-sm font-bold text-white leading-none">{dict.home.bombFile}</p>
                              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-tight">{dict.home.bombFileExt}</p>
                            </div>
                          </div>
                          <div className={cn("w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0", isOneTime ? "bg-red-500" : "bg-white/20")}>
                             <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", isOneTime ? "translate-x-5" : "translate-x-0")} />
                          </div>
                          <input type="checkbox" className="hidden" checked={isOneTime} onChange={(e) => setIsOneTime(e.target.checked)} />
                        </label>

                        {/* Wygasanie pliku */}
                        <div className="flex flex-col items-start gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 mt-1">
                           <div className="flex items-center gap-4 w-full">
                              <div className="p-2.5 rounded-xl bg-white/10 text-slate-400">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="text-sm font-bold text-white leading-none">{dict.home.whenFileDie}</p>
                              </div>
                           </div>
                           <div className="flex w-full gap-2">
                              {[{ l: dict.home.expires1Hour, v: 1 }, { l: dict.home.expires24Hours, v: 24 }, { l: dict.home.expires7Days, v: 168 }, { l: dict.home.expiresNever, v: 0 }].map(opt => (
                                <button key={opt.v} onClick={(e) => { e.preventDefault(); setExpiresInHours(opt.v); }} className={cn("flex-1 py-2.5 px-1 rounded-xl text-xs font-extrabold transition-all border outline-none", expiresInHours === opt.v ? "bg-primary/20 border-primary text-primary shadow-sm" : "bg-black/30 border-white/5 hover:border-white/20 text-slate-400 hover:text-white")}>{opt.l}</button>
                              ))}
                           </div>
                        </div>

                      </div>
                      
                      <button onClick={handleUpload} className="w-full mt-6 py-4 rounded-xl font-bold text-white text-lg bg-primary hover:bg-emerald-600 tracking-wide focus:ring-4 focus:ring-primary/30 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]">
                        {dict.home.uploadBtnAction}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="file-info"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full z-20"
                >
                  {/* KARTA PLIKU Z ENERGY BAREM */}
                  <div className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm relative overflow-hidden h-20">
                    
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

                    <div className="flex-shrink-0 p-3 bg-white/10 rounded-xl relative z-10 transition-colors" style={isUploading ? { backgroundColor: 'rgba(255,255,255,0.08)'} : {}}>
                      <FileIcon className={cn("w-6 h-6", isUploading ? "text-primary" : "text-gray-500")} />
                    </div>
                    
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className={cn("text-sm font-bold truncate transition-colors", isUploading ? "text-white drop-shadow-sm font-extrabold" : "text-foreground")}>
                        {file?.name}
                      </p>
                      <p className={cn("text-xs mt-0.5 font-bold transition-colors", isUploading ? "text-white/70 drop-shadow-sm" : "text-gray-400")}>
                        {isUploading ? `${dict.home.uploadingFile} ${progress}%` : formatFileSize(file?.size ?? 0)}
                      </p>
                    </div>

                    {!isUploading && (
                      <button 
                        onClick={() => setFile(null)}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative z-10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {!isUploading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full mt-6 space-y-3">
                      {/* Premium List Layout */}
                      <div className="flex flex-col gap-2 w-full">
                        
                        {/* Zabezpiecz hasłem */}
                        <div className={cn("flex flex-col p-4 rounded-2xl border transition-all duration-300", hasPassword ? "bg-primary/5 border-primary/30 shadow-sm shadow-primary/5" : "bg-white/5 border-white/5 hover:border-white/10")}>
                          <label className="flex items-center justify-between cursor-pointer w-full">
                            <div className="flex items-center gap-4">
                              <div className={cn("p-2.5 rounded-xl transition-colors", hasPassword ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-400")}>
                                <Lock className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-white leading-none">{dict.home.secureWithPassword}</p>
                                <p className="text-xs text-slate-400 mt-1.5 font-medium">{dict.home.passwordRequiredExt}</p>
                              </div>
                            </div>
                            <div className={cn("w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer shrink-0 ml-4", hasPassword ? "bg-primary" : "bg-white/20")}>
                               <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", hasPassword ? "translate-x-5" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={hasPassword} onChange={(e) => setHasPassword(e.target.checked)} />
                          </label>
                          <AnimatePresence>
                            {hasPassword && (
                              <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 16 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden">
                                <input type="password" placeholder={dict.home.inputPasswordStrong} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-primary/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 ring-primary/50 shadow-inner" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Bezpieczne usunięcie po 1 pobraniu / Bomb */}
                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer", isOneTime ? "bg-red-500/5 border-red-500/30 shadow-sm shadow-red-500/5" : "bg-white/5 border-white/5 hover:border-white/10")}>
                          <div className="flex items-center gap-4 w-3/4">
                            <div className={cn("p-2.5 rounded-xl transition-colors shrink-0", isOneTime ? "bg-red-500/20 text-red-500" : "bg-white/10 text-slate-400")}>
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="text-left w-full pr-2">
                              <p className="text-sm font-bold text-white leading-none">{dict.home.bombFile}</p>
                              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-tight">{dict.home.bombFileExt}</p>
                            </div>
                          </div>
                          <div className={cn("w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0", isOneTime ? "bg-red-500" : "bg-white/20")}>
                             <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", isOneTime ? "translate-x-5" : "translate-x-0")} />
                          </div>
                          <input type="checkbox" className="hidden" checked={isOneTime} onChange={(e) => setIsOneTime(e.target.checked)} />
                        </label>

                        {/* Wygasanie pliku */}
                        <div className="flex flex-col items-start gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 mt-1">
                           <div className="flex items-center gap-4 w-full">
                              <div className="p-2.5 rounded-xl bg-white/10 text-slate-400">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="text-sm font-bold text-white leading-none">{dict.home.whenFileDie}</p>
                              </div>
                           </div>
                           <div className="flex w-full gap-2">
                              {[{ l: dict.home.expires1Hour, v: 1 }, { l: dict.home.expires24Hours, v: 24 }, { l: dict.home.expires7Days, v: 168 }, { l: dict.home.expiresNever, v: 0 }].map(opt => (
                                <button key={opt.v} onClick={(e) => { e.preventDefault(); setExpiresInHours(opt.v); }} className={cn("flex-1 py-2.5 px-1 rounded-xl text-xs font-extrabold transition-all border outline-none", expiresInHours === opt.v ? "bg-primary/20 border-primary text-primary shadow-sm" : "bg-black/30 border-white/5 hover:border-white/20 text-slate-400 hover:text-white")}>{opt.l}</button>
                              ))}
                           </div>
                        </div>

                      </div>
                      <button onClick={handleUpload} className="w-full mt-6 py-4 rounded-xl font-bold text-white text-lg bg-primary hover:bg-emerald-600 tracking-wide focus:ring-4 focus:ring-primary/30 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]">
                        {dict.home.uploadBtnAction}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        </div>
      </div>
    </HeroGeometric>
  );
}
