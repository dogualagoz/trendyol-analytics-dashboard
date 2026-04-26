"use client"

import { Bell, Grid3X3, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    // Stitch tasarımı: beyaz navbar, 3 bölüm (sol başlık, orta arama, sağ aksiyonlar)
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between gap-4">

      {/* SOL: Sayfa başlığı — ilerleyen aşamada prop veya usePathname ile dinamikleşir */}
      <h1 className="text-sm font-semibold text-[#1a1c1c] shrink-0">
        Analytics Central
      </h1>

      {/* ORTA: Arama kutusu — Stitch'te ortada konumlanmış */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 h-9 w-64 max-w-xs">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      {/* SAĞ: Aksiyonlar */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Bildirim zili */}
        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-gray-800">
          <Bell className="w-4 h-4" />
        </Button>

        {/* Uygulamalar grid ikonu — Stitch'te mevcut */}
        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-gray-800">
          <Grid3X3 className="w-4 h-4" />
        </Button>

        {/* Kullanıcı avatarı — Stitch'te koyu arkaplan
            Gerçek kullanıcı verisi NextAuth session'dan gelecek */}
        <Avatar className="w-8 h-8 cursor-pointer ml-1">
          <AvatarFallback className="bg-[#1E293B] text-white text-xs font-semibold">
            TS
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
