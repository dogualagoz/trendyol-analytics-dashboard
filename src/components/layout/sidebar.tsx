"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  RotateCcw,
  Calculator,
  BarChart3,
  Zap,
  Settings,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Dashboard",      href: "/",          icon: LayoutDashboard },
  { label: "Ürünler",        href: "/products",  icon: Package },
  { label: "Siparişler",     href: "/orders",    icon: ShoppingCart },
  { label: "İadeler",        href: "/returns",   icon: RotateCcw },
  { label: "Fiyatlandırma",  href: "/pricing",   icon: Calculator },
  { label: "Raporlar",       href: "/reports",   icon: BarChart3 },
  { label: "Canlı",          href: "/live",      icon: Zap },
]

const bottomNavItems: NavItem[] = [
  { label: "Ayarlar", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    // Stitch tasarımı: beyaz sidebar, sağ kenarda ince gri çizgi
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-20">

      {/* Logo alanı */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 bg-[#F27A1A] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <div className="min-w-0">
          {/* Stitch: logo yazıları koyu, beyaz arka plan üzerinde */}
          <p className="text-[#1a1c1c] font-semibold text-sm leading-tight truncate">
            Trendyol Seller
          </p>
          <p className="text-[#574236] text-xs truncate">Partner Analytics</p>
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* Ana navigasyon — flex-1 ile ayarlar aşağıya itilir */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Tüm itemlerin ortak stili: tam genişlik, 44px yükseklik
                "flex items-center gap-3 h-11 text-sm font-medium transition-colors w-full",
                isActive
                  // Stitch aktif state:
                  // border-l-[3px] → sol turuncu çizgi (3px)
                  // pl-[13px] → normal 16px - 3px border = 13px (ikon hizası korunur)
                  // bg-orange-50 → çok açık turuncu arka plan
                  // text-[#984700] → Stitch primary: koyu turuncu, design.md'den
                  ? "border-l-[3px] border-[#F27A1A] bg-orange-50 text-[#984700] font-semibold pl-[13px] pr-4"
                  // Pasif: design.md on-surface-variant rengi, hover hafif gri
                  : "text-[#574236] hover:bg-gray-50 hover:text-[#1a1c1c] pl-4 pr-4"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-gray-100" />

      {/* Alt navigasyon */}
      <nav className="py-3">
        {bottomNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-11 text-sm font-medium transition-colors w-full",
                isActive
                  ? "border-l-[3px] border-[#F27A1A] bg-orange-50 text-[#984700] font-semibold pl-[13px] pr-4"
                  : "text-[#574236] hover:bg-gray-50 hover:text-[#1a1c1c] pl-4 pr-4"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
