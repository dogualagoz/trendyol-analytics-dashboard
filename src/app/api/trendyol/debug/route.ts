// Trendyol API'dan gelen ham veriyi ve hesaplama sonuçlarını gösterir.
// Sadece geliştirme ortamında kullanılır — prod'da 403 döner.
// Kullanım: GET /api/trendyol/debug?days=7

import { getOrders } from "@/lib/trendyol"
import { calculateProfitFromLine } from "@/lib/calculations"
import db from "@/lib/db"

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Bu endpoint sadece geliştirme ortamında çalışır." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const daysBack = Math.min(Number(searchParams.get("days") ?? "7"), 14) // max 14 gün
  const endDate   = Date.now()
  const startDate = endDate - daysBack * 24 * 60 * 60 * 1000

  try {
    // Tek bir sipariş çek (analiz için yeterli)
    const orders = await getOrders({ startDate, endDate, size: 5 })

    if (orders.length === 0) {
      return Response.json({
        message: `Son ${daysBack} günde sipariş bulunamadı. 'days' parametresini artırmayı dene.`,
        startDate: new Date(startDate).toISOString(),
        endDate:   new Date(endDate).toISOString(),
        tip: "GET /api/trendyol/debug?days=14",
      })
    }

    const first = orders[0]
    const firstLine = first.lines?.[0]

    // ── Order seviyesi alan analizi ────────────────────────────────────────────

    // Her bir üst-düzey alanın varlığını ve değerini raporla
    const orderFieldAnalysis = Object.entries(first).reduce<Record<string, unknown>>((acc, [key, val]) => {
      if (key === "lines") return acc // ayrıca işleniyor
      acc[key] = { value: val, type: typeof val, isNull: val === null || val === undefined }
      return acc
    }, {})

    // grossAmount'u 3 farklı yöntemle hesapla — hangisi doğru olduğunu görmek için
    const grossAmountVariants = {
      "order.grossAmount (API alanı)":  Number(first.grossAmount) || null,
      "sum(lines[].amount)":            first.lines?.reduce((s, l) => s + (Number(l.amount) || 0), 0) || 0,
      "sum(lines[].price × qty)":       first.lines?.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 1), 0) || 0,
    }

    // ── Line seviyesi alan analizi ─────────────────────────────────────────────

    const lineFieldAnalysis = firstLine
      ? Object.entries(firstLine).reduce<Record<string, unknown>>((acc, [key, val]) => {
          acc[key] = { value: val, type: typeof val, isNull: val === null || val === undefined }
          return acc
        }, {})
      : null

    // ── Hesaplama analizi ──────────────────────────────────────────────────────

    const profitCalcBreakdown = firstLine
      ? {
          price_x_qty:    (Number(firstLine.price) || 0) * (Number(firstLine.quantity) || 1),
          minus_discount: -(Number(firstLine.discount)   || 0),
          minus_commission: -(Number(firstLine.commission) || 0),
          minus_cargoPrice: -(Number(firstLine.cargoPrice) || 0),
          minus_costPrice:  0, // costPrice DB'den geliyor, burada 0
          result_profit:  calculateProfitFromLine(firstLine, 0),
          uyarılar: [] as string[],
        }
      : null

    if (profitCalcBreakdown) {
      if ((Number(firstLine?.commission) || 0) === 0) {
        profitCalcBreakdown.uyarılar.push("⚠️ commission = 0 — Trendyol sipariş API'sında komisyon alanı olmayabilir. Settlements API gerekebilir.")
      }
      if ((Number(firstLine?.cargoPrice) || 0) === 0) {
        profitCalcBreakdown.uyarılar.push("⚠️ cargoPrice = 0 — Kargo maliyeti sipariş API'sında olmayabilir.")
      }
      if ((Number(firstLine?.amount) || 0) === 0 && (Number(firstLine?.price) || 0) > 0) {
        profitCalcBreakdown.uyarılar.push("⚠️ amount = 0 ama price > 0 — 'amount' alanı yanlış eşleşiyor olabilir. Gerçek alan adını kontrol et.")
      }
    }

    // ── DB'deki mevcut veri özeti ──────────────────────────────────────────────

    const dbSummary = await db.order.aggregate({
      _count: { id: true },
      _sum: { grossAmount: true },
    })

    const dbItemSummary = await db.orderItem.aggregate({
      _count: { id: true },
      _sum: { profit: true, salePrice: true },
    })

    const dbZeroGrossCount = await db.order.count({
      where: { grossAmount: { equals: 0 } },
    })

    return Response.json({
      özet: {
        istekBilgisi: {
          startDate: new Date(startDate).toISOString(),
          endDate:   new Date(endDate).toISOString(),
          daysBack,
          dönenSipariş: orders.length,
        },
        db: {
          toplamSipariş:          dbSummary._count.id,
          toplamGrossAmount:      dbSummary._sum.grossAmount,
          sıfırGrossAmountSayısı: dbZeroGrossCount,
          toplamKalem:            dbItemSummary._count.id,
          toplamProfit:           dbItemSummary._sum.profit,
          toplamSalePrice:        dbItemSummary._sum.salePrice,
        },
      },
      grossAmountVariants,
      ilkSipariş: {
        alanAnalizi: orderFieldAnalysis,
        hamVeri: { ...first, lines: undefined },
        linesSayısı: first.lines?.length ?? 0,
      },
      ilkKalem: {
        alanAnalizi: lineFieldAnalysis,
        hamVeri: firstLine,
        hesaplamalar: profitCalcBreakdown,
      },
      tümSiparişlerHızlıBakış: orders.map(o => ({
        id:           o.id,
        status:       o.status,
        grossAmount_api:   o.grossAmount,
        grossAmount_calc:  o.lines?.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 1), 0),
        lineCount:    o.lines?.length,
      })),
    }, { status: 200 })
  } catch (err) {
    return Response.json({
      error:   String(err),
      message: "Hata oluştu — API credentials ayarlandı mı? /settings sayfasını kontrol et.",
    }, { status: 500 })
  }
}
