// GEÇİCİ TEST SAYFASI — iadeleri Trendyol API'dan canlı çeker

import { getClaims } from "@/lib/trendyol"
import { getSetting } from "@/lib/settings"
import type { TrendyolClaim } from "@/types/trendyol"

export default async function ReturnsPage() {
  // Trendyol API bilgileri girilmemişse boş göster
  const apiKey = await getSetting("trendyol_api_key")

  if (!apiKey) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">İadeler</h2>
        <div className="bg-white rounded-xl border border-[#E2E2E2] p-10 text-center">
          <p className="text-sm font-medium text-[#1a1c1c]">API bilgileri girilmemiş</p>
          <p className="text-xs text-[#574236] mt-1">Ayarlar sayfasından Trendyol API bilgilerini girin.</p>
        </div>
      </div>
    )
  }

  // Son 90 günün iadelerini çek
  const endDate   = Date.now()
  const startDate = endDate - 90 * 24 * 60 * 60 * 1000

  let claims: TrendyolClaim[] = []
  let error  = ""

  try {
    claims = await getClaims({ startDate, endDate })
  } catch (e) {
    error = e instanceof Error ? e.message : "Bilinmeyen hata"
  }

  // Özet hesapla
  const totalClaims  = claims.length
  const statusCounts = claims.reduce((acc: Record<string, number>, c) => {
    acc[c.claimItemStatus] = (acc[c.claimItemStatus] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">İadeler</h2>
        <p className="text-sm text-[#574236] mt-0.5">Son 90 gün — Trendyol&apos;dan canlı çekiliyor</p>
      </div>

      {error ? (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-sm text-red-600">
          Hata: {error}
        </div>
      ) : (
        <>
          {/* Özet kartlar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E2E2E2] p-5">
              <p className="text-xs font-medium text-[#574236] uppercase tracking-wide">Toplam İade</p>
              <p className="text-2xl font-bold text-[#1a1c1c] mt-2">{totalClaims}</p>
            </div>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="bg-white rounded-xl border border-[#E2E2E2] p-5">
                <p className="text-xs font-medium text-[#574236] uppercase tracking-wide">{status}</p>
                <p className="text-2xl font-bold text-[#1a1c1c] mt-2">{count}</p>
              </div>
            ))}
          </div>

          {/* Liste */}
          {claims.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E2E2] p-10 text-center">
              <p className="text-sm text-[#574236]">Son 90 günde iade bulunamadı.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">

              <div className="grid grid-cols-[1fr_140px_120px_120px] gap-4 px-5 py-3 border-b border-[#F4F4F4] bg-[#FAFAFA]">
                {["SİPARİŞ NO", "TARİH", "NEDEN", "DURUM"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">{h}</span>
                ))}
              </div>

              <div className="divide-y divide-[#F4F4F4]">
                {claims.map((claim) => (
                  <div key={claim.claimId} className="grid grid-cols-[1fr_140px_120px_120px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">

                    <span className="text-sm font-medium text-[#1a1c1c] font-mono">{claim.orderNumber}</span>

                    <span className="text-sm text-[#574236]">
                      {new Date(claim.claimDate).toLocaleDateString("tr-TR")}
                    </span>

                    <span className="text-sm text-[#574236] truncate">{claim.claimReason ?? "—"}</span>

                    <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${
                      claim.claimItemStatus === "Accepted"  ? "bg-emerald-50 text-emerald-600" :
                      claim.claimItemStatus === "Rejected"  ? "bg-red-50 text-red-500"         :
                      claim.claimItemStatus === "Created"   ? "bg-blue-50 text-blue-600"       :
                                                              "bg-amber-50 text-amber-600"
                    }`}>
                      {claim.claimItemStatus}
                    </span>

                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
