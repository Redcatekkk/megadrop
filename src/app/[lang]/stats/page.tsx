import { getGlobalStats } from "@/db/d1";
import { Zap, HardDrive, DownloadCloud, Activity } from "lucide-react";

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
    <main className="w-full flex-1 flex flex-col items-center max-w-7xl mx-auto p-6 md:p-12 min-h-screen pt-24 lg:pt-32 relative">
      
      {/* HEADER SECTION */}
      <div className="z-10 w-full flex flex-col items-center text-center space-y-8 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-bold shadow-sm">
          <Activity className="w-4 h-4 fill-primary" />
          <span>Live Metrics</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          System <span className="text-gradient">Analytics</span>
        </h1>
        
        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
          Statystyki z naszej platformy Dark Forge. Sprawdź, ile danych dotychczas pomyślnie przetransferowaliśmy w sieci anonimowego udostępniania plików.
        </p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        
        {/* TOTAL FILES */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <p className="text-5xl font-extrabold text-white">{stats.total_files || 0}</p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Przesłanych Plików</p>
        </div>

        {/* TOTAL BANDWIDTH (SIZE) */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-blue-500/50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center">
            <HardDrive className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-5xl font-extrabold text-white">{formatFileSize(stats.total_bytes)}</p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Wgranych Danych</p>
        </div>

        {/* TOTAL DOWNLOADS */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-emerald-500/50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
            <DownloadCloud className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-5xl font-extrabold text-white">{stats.total_downloads || 0}</p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Łącznych Pobrań</p>
        </div>

      </div>
    </main>
  );
}
