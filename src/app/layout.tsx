import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// Inter: design.md'de belirlenen tek font ailesi
// subsets: Türkçe karakterler için "latin" yeterli
// variable: CSS değişkeni olarak tanımlanıyor → globals.css'de --font-sans ile eşleşiyor
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Trendyol Analytics Dashboard",
  description: "Trendyol satıcıları için gelir, gider ve kar analitik paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="tr" → Türkçe içerik için doğru dil tanımı
    // inter.variable → CSS değişkenini sayfaya bağlar, font aktif olur
    <html lang="tr" className={cn("font-sans", inter.variable)}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
