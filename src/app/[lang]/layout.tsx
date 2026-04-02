import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "../globals.css";

import { getDictionary, Locale } from "@/lib/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamiczne meta tagi wg. języka
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  
  return {
    title: dict.layout.title,
    description: dict.layout.description,
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5365099957491511" crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-full flex flex-col relative text-black">
        <I18nProvider dictionary={dict}>
          <header className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
            <Link href={`/${lang}`} className="flex items-center gap-2.5 font-black text-2xl tracking-tight text-foreground hover:opacity-80 transition-opacity group">
              Megadrop
            </Link>
          </header>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
