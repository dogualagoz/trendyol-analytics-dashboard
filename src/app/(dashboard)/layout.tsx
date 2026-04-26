// Server Component — 'use client' yok çünkü bu dosyada hook veya event yok
// Next.js App Router'da layout.tsx: altındaki tüm sayfalara ortak iskelet sağlar
// (dashboard) klasörü bir "route group" → URL'e yansımaz, sadece Next.js içinde gruplandırma

import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
  children, // Bu layout'u kullanan sayfanın içeriği buraya gelir
}: {
  children: React.ReactNode
}) {
  return (
    // min-h-screen: sayfa içeriği az olsa bile arka plan dolduruyor
    // bg-[#F9F9F9]: design.md → background: #F9F9F9
    <div className="min-h-screen bg-[#F9F9F9]">

      {/* Sidebar: kendi içinde fixed konumlu, 240px (w-60) genişlikte */}
      <Sidebar />

      {/* Ana içerik alanı: sidebar genişliği kadar (ml-60 = 240px) soldan boşluk bırakır */}
      <div className="ml-60">

        {/* Üst navbar: bu div içinde sticky, sadece içerik alanında yapışır */}
        <Navbar />

        {/* Sayfa içeriği: design.md → margin-page: 40px, card padding: 24px
            p-6 = 24px → kartlar kendi padding'ini getiriyor, dış boşluk 24px yeterli */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
