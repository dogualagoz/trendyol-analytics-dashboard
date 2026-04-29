// Dashboard ana sayfasının ihtiyaç duyduğu tüm metrikleri tek istekte döner.
// Sayfa açılınca bir kez çağrılır, 4 farklı sorgunun sonucunu birleştirir.

import { NextRequest, NextResponse } from "next/server"
import {
  getSummaryMetrics,
  getProfitPerformance,
  getCostDistribution,
  getTopProducts,
} from "@/lib/dashboard"

// Desteklenen tarih aralığı filtreleri
const DATE_PRESETS: Record<string, number> = {
  week:    7,
  month:   30,
  quarter: 90,
}

export async function GET(req: NextRequest) {
  // URL'den filtre parametresini oku — örn: /api/dashboard?range=month
  const range   = req.nextUrl.searchParams.get("range") ?? "month"
  const days    = DATE_PRESETS[range] ?? 30

  const endDate   = new Date()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // 4 sorguyu paralel çalıştır — sırayla beklemek yerine hepsini aynı anda başlat
  const [summary, profitPerformance, costDistribution, topProducts] =
    await Promise.all([
      getSummaryMetrics(startDate, endDate),
      getProfitPerformance(startDate, endDate),
      getCostDistribution(startDate, endDate),
      getTopProducts(startDate, endDate),
    ])

  return NextResponse.json({
    summary,
    profitPerformance,
    costDistribution,
    topProducts,
  })
}
