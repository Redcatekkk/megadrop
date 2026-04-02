import { Metadata } from 'next';
import { getFileRecord } from '@/db/d1';
import DownloadClientUI from './DownloadClientUI';
import { AlertCircle } from 'lucide-react';

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  
  try {
    const file = await getFileRecord(id);
    if (!file) return { title: "Plik usunięty - Megadrop" };

    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasPassword = !!file.password_hash;
    const title = `Pobierz: ${file.original_name} (${formatSize(file.size_bytes)})`;
    const description = hasPassword 
      ? "Ten plik jest zabezpieczony hasłem 🔒" 
      : "Szybko i bez limitów.";

    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        siteName: "Megadrop",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
      }
    };
  } catch (e) {
    return { title: "Megadrop File" };
  }
}

export default async function DownloadPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  let file = null;
  let dbError = false;

  try {
    file = await getFileRecord(id);
  } catch (e) {
    dbError = true;
  }

  if (dbError) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center p-8 glass-panel rounded-3xl max-w-md w-full mx-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Błąd bazy danych</h1>
          <p className="text-gray-500 font-medium">Serwer nie mógł autoryzować połączenia z bazą. Spróbuj wygenerować link ponownie.</p>
        </div>
      </main>
    );
  }

  if (!file) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center p-12 glass-panel rounded-[2rem] max-w-md w-full mx-4 relative overflow-hidden bg-white border border-gray-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black mb-3 text-foreground">Plik niedostępny</h1>
          <p className="text-gray-600 font-medium leading-relaxed">Ten plik nie istnieje lub uległ samozniszczeniu po pierwszym pobraniu.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-1 flex flex-col lg:flex-row items-center lg:items-center justify-center max-w-7xl mx-auto p-6 md:p-12 min-h-screen gap-12 lg:gap-24 pt-24 lg:pt-0 relative overflow-hidden">
      <DownloadClientUI 
        id={id} 
        fileName={file.original_name} 
        sizeBytes={file.size_bytes} 
        hasPassword={!!file.password_hash} 
        isOneTime={file.max_downloads === 1}
        expiresAt={file.expires_at}
      />
    </main>
  );
}
