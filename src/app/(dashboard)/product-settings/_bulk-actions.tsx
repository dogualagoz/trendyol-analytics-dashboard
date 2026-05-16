"use client"

import { Scissors, Upload, RefreshCw } from "lucide-react"

export function BulkActions({
  fabricEligibleCount,
  bulkApplying,
  bulkResult,
  onApplyFabricBulk,
}: {
  fabricEligibleCount: number
  bulkApplying: boolean
  bulkResult: { applied: number; skipped: number } | null
  onApplyFabricBulk: () => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Kumaş Maliyetinden Uygula */}
      <div className="bg-white rounded-xl border border-[#F0D5C4] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-[#F27A1A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1c1c]">Kumaş Maliyetini Uygula</p>
            <p className="text-xs text-[#8b7264] mt-0.5">
              {bulkResult
                ? <span className="text-[#F27A1A] font-medium">{bulkResult.applied} ürün güncellendi · {bulkResult.skipped} atlandı</span>
                : <>Boyutu ayrıştırılan {fabricEligibleCount.toLocaleString("tr-TR")} ürünün maliyetini kumaş hesabıyla doldur</>
              }
            </p>
          </div>
          <button
            onClick={onApplyFabricBulk}
            disabled={bulkApplying || fabricEligibleCount === 0}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
            {bulkApplying ? "Uygulanıyor…" : "Tümüne Uygula"}
          </button>
        </div>
      </div>

      {/* Excel Placeholder */}
      <div className="bg-white rounded-xl border border-dashed border-[#E8E8E8] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F4F4F4] flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-[#8b7264]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1c1c]">Toplu Maliyet Yükleme</p>
            <p className="text-xs text-[#8b7264] mt-0.5">
              Excel ile toplu güncelleme — <span className="text-[#F27A1A] font-medium">yakında</span>
            </p>
          </div>
          <button disabled className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#E8E8E8] text-sm text-[#c0bbb7] cursor-not-allowed">
            <Upload className="w-3.5 h-3.5" /> Excel Yükle
          </button>
        </div>
      </div>
    </div>
  )
}
