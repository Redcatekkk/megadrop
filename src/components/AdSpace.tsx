"use client";

import { useEffect, useState } from "react";
import { Heart, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export default function AdSpace({ dataAdSlot, className = "" }: { dataAdSlot?: string, className?: string }) {
  const dict = useI18n();
  const [adBlocked, setAdBlocked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Solidniejsza metoda wykrycia AdBlocka bazująca na zablokowanych nazwach klas
    const adTest = document.createElement("div");
    adTest.innerHTML = "&nbsp;"; // wymuszenie zawartosici, by miec wysokosc
    adTest.className = "adsbox adplacement ad-placement doubleclick ad-placeholder adsense";
    adTest.style.position = "absolute";
    adTest.style.top = "-1000px";
    adTest.style.height = "10px";
    adTest.style.display = "block";
    document.body.appendChild(adTest);

    // Timeout by pozwolić rozszerzeniu na analizę
    setTimeout(() => {
      // Jeśli height jest 0, albo jest display none -> wtyczka wkroczyła
      if (adTest.offsetHeight === 0 || window.getComputedStyle(adTest).display === "none") {
        setAdBlocked(true);
      }
      adTest.remove();
      setIsLoaded(true);
    }, 400);
  }, []);

  useEffect(() => {
    if (isLoaded && !adBlocked) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Zignorowanie bledu np gdy zablokowane z innego poziomu sieci
      }
    }
  }, [isLoaded, adBlocked]);

  if (!isLoaded) {
    return <div className={`min-h-[120px] w-full flex items-center justify-center ${className}`}></div>;
  }

  if (adBlocked) {
    return (
      <div className={`w-full glass-panel rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
        <div className="flex gap-2 mb-1">
          <ShieldCheck className="w-10 h-10 text-[#F97316]" />
          <Heart className="w-10 h-10 text-red-500 fill-red-500" />
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">{dict.adspace.adblockDetected}</h3>
        <p className="text-base font-medium text-gray-600 max-w-sm leading-relaxed" dangerouslySetInnerHTML={{ 
          __html: dict.adspace.adblockMessage.replace('specially for you', '<b>specially for you</b>').replace('specjalnie dla Ciebie', '<b>specjalnie dla Ciebie</b>') 
        }} />
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center glass-panel shadow-sm rounded-[2rem] p-4 min-h-[120px] overflow-hidden ${className}`}>
      <span className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">{dict.adspace.sponsor}</span>
      <div className="w-full flex items-center justify-center relative min-h-[250px]">
        {/* Placeholder deweloperski widoczny na szaro jeśli AdSense nie wrzuci jeszcze iframe'a */}
        <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-slate-600 font-bold z-0 opacity-50 pointer-events-none">
           [ Miejsce na Google AdSense ]
        </div>
        <ins 
          className="adsbygoogle relative z-10"
          style={{ display: "block", minWidth: "300px", minHeight: "250px", width: "100%" }}
          data-ad-client="ca-pub-5365099957491511"
          data-ad-slot={dataAdSlot || "auto"} 
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
}
