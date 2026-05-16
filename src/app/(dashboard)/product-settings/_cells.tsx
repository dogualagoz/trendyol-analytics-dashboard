"use client"

import Image from "next/image"
import { CheckCircle, ArrowDownLeft } from "lucide-react"
import type { ProductForSettings } from "@/lib/product-settings"

export function RangeVal({ products, field, suffix = "" }: {
  products: ProductForSettings[]
  field: "costPrice" | "costKdvRate" | "desi" | "extraCost" | "fabricCostTry"
  suffix?: string
}) {
  const vals = products.map(p => p[field]).filter((v): v is number => v != null)
  if (!vals.length) return <span className="text-[#d1cac5] text-xs">—</span>
  const min = Math.min(...vals), max = Math.max(...vals)
  const fmt = (v: number) => Number.isInteger(v) ? v.toString() : v.toFixed(2)
  return (
    <span className="text-xs tabular-nums font-medium text-[#574236]">
      {min === max ? `${fmt(min)}${suffix}` : `${fmt(min)}${suffix} – ${fmt(max)}${suffix}`}
    </span>
  )
}

export function ProductImage({ src, title }: { src: string | null; title: string }) {
  return (
    <div className="relative group/img shrink-0">
      <div className="w-14 h-14 rounded-md bg-[#F4F4F4] overflow-hidden flex items-center justify-center border border-[#ECECEC]">
        {src ? (
          <Image src={src} alt={title} width={56} height={56} className="w-full h-full object-cover" unoptimized />
        ) : (
          <span className="text-base font-bold text-[#8b7264] uppercase">
            {title.replace(/^[^a-zA-ZğüşıöçĞÜŞİÖÇ]*/, "").charAt(0) || title.charAt(0)}
          </span>
        )}
      </div>

      {src && (
        <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 z-[100] hidden group-hover/img:block pointer-events-none">
          <div className="w-48 h-48 rounded-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.20)] border-2 border-white bg-white">
            <Image src={src} alt={title} width={192} height={192} className="w-full h-full object-contain" unoptimized />
          </div>
        </div>
      )}
    </div>
  )
}

export function DeliveryBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#d1cac5] text-xs">—</span>
  const isFast = value.toLowerCase().includes("fast") || value.toLowerCase().includes("same")
  const label  = isFast ? "Hızlı" : "Normal"
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded text-[11px] font-medium ${
      isFast ? "bg-blue-50 text-blue-600" : "bg-[#F3F3F3] text-[#574236]"
    }`}>
      {label}
    </span>
  )
}

// Kumaş bazlı maliyet hücresi.
// Boyut ayrıştırılan ürünlerde hesaplanan TL maliyeti gösterir; "Uygula" butonu
// ile bu değeri ürünün costPrice alanına yazar. Mevcut maliyet zaten kumaş
// hesabına eşitse buton "Uygulandı" olarak görünür.
export function FabricCostCell({
  product,
  onApply,
}: {
  product: ProductForSettings
  onApply: () => void
}) {
  if (product.fabricCostTry == null || product.fabricWidthCm == null || product.fabricLengthCm == null) {
    return (
      <div className="flex items-center h-8 px-2">
        <span className="text-[#d1cac5] text-xs italic">boyut yok</span>
      </div>
    )
  }

  const isApplied =
    product.costPrice != null &&
    Math.abs(product.costPrice - product.fabricCostTry) < 0.01

  return (
    <div className="flex items-center gap-1.5 h-8 px-1">
      <div className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="text-sm font-medium text-[#984700] tabular-nums">
          {product.fabricCostTry.toFixed(2)} ₺
        </span>
        <span className="text-[10px] text-[#8b7264] tabular-nums">
          {product.fabricWidthCm}×{product.fabricLengthCm} cm
        </span>
      </div>
      <button
        onClick={onApply}
        disabled={isApplied}
        title={isApplied ? "Maliyet zaten kumaş hesabına eşit" : "Kumaş maliyetini ürün maliyetine uygula"}
        className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
          isApplied
            ? "bg-emerald-50 text-emerald-600 cursor-default"
            : "bg-orange-50 text-[#F27A1A] hover:bg-[#F27A1A] hover:text-white"
        }`}
      >
        {isApplied ? <CheckCircle className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
