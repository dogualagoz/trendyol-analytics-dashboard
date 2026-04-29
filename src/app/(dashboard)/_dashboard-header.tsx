"use client"

// Tarih filtre butonları ve Güncelle butonu — kullanıcı etkileşimi olduğu için Client Component.
// Filtre değişince URL güncellenir, page.tsx yeni veriyle yeniden render olur.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

const FILTERS = [
  { label: "Bu Hafta",  value: "week"    },
  { label: "Bu Ay",     value: "month"   },
  { label: "Son 3 Ay",  value: "quarter" },
  { label: "Son 1 Yıl", value: "year"    },
] as const

export function DashboardHeader({ range }: { range: string }) {
  const router   = useRouter()
  const [syncing, setSyncing] = useState(false)

  // Trendyol'dan veri çekip DB'ye yazar, sonra sayfayı yeniler
  async function handleSync() {
    setSyncing(true)
    await fetch("/api/sync", { method: "POST" })
    router.refresh()  // Server Component'i yeniden render et
    setSyncing(false)
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">Genel Bakış</h2>
        <p className="text-sm text-[#574236] mt-0.5">
          Tüm satış ve karlılık metrikleriniz
        </p>
      </div>

      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => router.push(`?range=${f.value}`)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
              range === f.value
                ? "bg-[#F27A1A] border-[#F27A1A] text-white"
                : "bg-white border-[#E2E2E2] text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A]"
            }`}
          >
            {f.label}
          </button>
        ))}

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white border border-[#E2E2E2] text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors ml-1 disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Güncelleniyor..." : "Güncelle"}
        </button>
      </div>
    </div>
  )
}
