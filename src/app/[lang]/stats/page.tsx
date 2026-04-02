import { getGlobalStats } from "@/db/d1";
import { Zap, HardDrive, DownloadCloud } from "lucide-react";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export const revalidate = 60; // odświeżaj statystyki co 60 sekund w CDN

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default async function StatsPage() {
  const stats = await getGlobalStats();

  return (
    <HeroGeometric 
      badge="Live Metrics" 
      title1="System" 
      title2="Analytics" 
      description="Statystyki z naszej platformy Dark Forge. Sprawdź, ile danych dotychczas pomyślnie przetransferowaliśmy w sieci anonimowego udostępniania plików."
    >
      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10 mx-auto">
        
        {/* TOTAL FILES */}
        <div className="bg-[#0f0f13] border border-white/10 backdrop-blur-xl p-8 rounded-[2rem] flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-colors shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center relative z-10">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <p className="text-5xl font-extrabold text-white relative z-10">{stats.total_files || 0}</p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest relative z-10">Przesłanych Plików</p>
        </div>

        {/* TOTAL BANDWIDTH (SIZE) */}
        <div className="bg-[#0f0f13] border border-white/10 backdrop-blur-xl p-8 rounded-[2rem] flex flex-col items-center text-center space-y-4 hover:border-blue-500/50 transition-colors shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center relative z-10">
            <HardDrive className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-5xl font-extrabold text-white relative z-10">{formatFileSize(stats.total_bytes)}</p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest relative z-10">Wgranych Danych</p>
        </div>

        {/* TOTAL DOWNLOADS */}
        <div className="bg-[#0f0f13] border border-white/10 backdrop-blur-xl p-8 rounded-[2rem] flex flex-col items-center text-center space-y-4 hover:border-emerald-500/50 transition-colors shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center relative z-10">
            <DownloadCloud className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-5xl font-extrabold text-white relative z-10">{stats.total_downloads || 0}</p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest relative z-10">Łącznych Pobrań</p>
        </div>

      </div>
    </HeroGeometric>
  );
}
