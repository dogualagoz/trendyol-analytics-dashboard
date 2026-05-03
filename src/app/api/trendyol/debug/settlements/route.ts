// Settlements (Finance API) debug endpoint.
// Kullanım: GET /api/trendyol/debug/settlements?days=7&format=ms|s
// format=ms → milisaniye (varsayılan), format=s → saniye (bazı API'lar saniye bekler)
// Sonuç: ham settlement satırları + DB eşleşme raporu

import { getSettlements } from "@/lib/trendyol"
import { getSetting }     from "@/lib/settings"
import db from "@/lib/db"

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Sadece development ortamında çalışır." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const daysBack  = Math.min(Number(searchParams.get("days") ?? "7"), 15)
  const format    = searchParams.get("format") ?? "ms"  // "ms" | "s"
  const endDate   = format === "s" ? Math.floor(Date.now() / 1000) : Date.now()
  const startDate = endDate - daysBack * 24 * 60 * 60 * (format === "s" ? 1 : 1000)

  // Alternatif endpoint'leri de test etmek için
  const sellerId = await getSetting("trendyol_seller_id")

  try {
    const settlements = await getSettlements({ startDate, endDate, size: 20 })
    // URL: /integration/finance/che/sellers/{sellerId}/settlements

    if (settlements.length === 0) {
      return Response.json({
        durum:   "BOŞ",
        mesaj:   `Finance API çalışıyor ama ${daysBack} günde settlement verisi yok.`,
        öneri:   "days parametresini artır: /api/trendyol/debug/settlements?days=15",
      })
    }

    const first = settlements[0]

    // DB eşleşme kontrolü — ilk 10 settlement'ı tara
    const eslesmeSonuclari = await Promise.all(
      settlements.slice(0, 10).map(async (s) => {
        const packageKey  = String(s.shipmentPackageId ?? "")
        const orderKey    = String(s.orderNumber ?? "")

        const byPackageId = packageKey
          ? await db.order.findUnique({ where: { trendyolOrderId: packageKey } })
          : null
        const byOrderNum  = orderKey
          ? await db.order.findUnique({ where: { trendyolOrderId: orderKey } })
          : null

        return {
          settlement_id:       s.id,
          shipmentPackageId:   s.shipmentPackageId,
          orderNumber:         s.orderNumber,
          transactionType:     s.transactionType,
          commissionAmount:    s.commissionAmount,
          cargoAmount:         s.cargoAmount,
          serviceFee:          s.serviceFee,
          stoppageAmount:      s.stoppageAmount,
          netKdv:              s.netKdv,
          eslesti_packageId:   byPackageId ? `✅ order.id=${byPackageId.id}` : "❌ bulunamadı",
          eslesti_orderNumber: byOrderNum  ? `✅ order.id=${byOrderNum.id}`  : "❌ bulunamadı",
        }
      })
    )

    const eslesmeSayisi = eslesmeSonuclari.filter(
      r => r.eslesti_packageId.startsWith("✅") || r.eslesti_orderNumber.startsWith("✅")
    ).length

    return Response.json({
      durum:           "OK",
      toplamSettlement: settlements.length,
      eslesmeSayisi:   `${eslesmeSayisi} / ${eslesmeSonuclari.length}`,
      ilkSettlement:   first,
      eslemeRaporu:    eslesmeSonuclari,
      aciklama: eslesmeSayisi === 0
        ? "⚠️ Hiç eşleşme yok — trendyolOrderId formatı shipmentPackageId ile uyuşmuyor olabilir."
        : "✅ Eşleşmeler var — sync çalıştırınca DB güncellenecek.",
    })
  } catch (err) {
    const hataStr = String(err)
    const formatOneri = format === "ms"
      ? "Saniye formatını dene: /api/trendyol/debug/settlements?format=s"
      : "Milisaniye formatını dene: /api/trendyol/debug/settlements?format=ms"

    return Response.json({
      durum:           "HATA",
      hata:            hataStr,
      kullanilanFormat: format,
      startDate,
      endDate,
      tespit: [
        "500 hatası genellikle hesapta Finance API yetkisi olmadığını gösterir.",
        "403/401 değil 500 gelmesi: kimlik doğrulama geçti ama backend servisi reddetti.",
      ],
      cozumOnceligi: [
        "1. Trendyol Partner Portal → Entegrasyon → API Bilgileri → Finance API aktif mi kontrol et",
        "2. Aktif değilse Trendyol satıcı destek hattından Finance API erişimi talep et",
        formatOneri,
        `4. sellerId: ${sellerId ?? "YOK — önce ayarlar sayfasından gir"}`,
      ],
    }, { status: 500 })
  }
}
