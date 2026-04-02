import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Megadrop - Szybki transfer",
  description: "Błyskawiczne i bezpieczne przesyłanie plików bez limitów",
};

import Link from "next/link";
import { Zap } from "lucide-react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Oficjalny skrypt Google AdSense do auto-reklam - bezpośrednio w kodzie źródłowym by robot AdSense widział go od razu */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5365099957491511" crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-full flex flex-col relative text-black">
        <header className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
          <Link href="/" className="flex items-center gap-2.5 font-black text-2xl tracking-tight text-foreground hover:opacity-80 transition-opacity group">
            Megadrop
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
