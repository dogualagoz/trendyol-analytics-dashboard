// Trendyol'dan veri çekip veritabanına yazan senkronizasyon motoru.
// Hem otomatik (zamanlayıcı) hem manuel ("Güncelle" butonu) olarak çağrılır.

import db from "@/lib/db"
import { getSetting, setSetting } from "@/lib/settings"
import { getOrders, getProducts, getClaims, getSettlements } from "@/lib/trendyol"
import { calculateProfitFromLine, calculateCargoWithKdv } from "@/lib/calculations"
import {
  ORDER_MAX_RANGE_MS,
  SETTLEMENT_MAX_RANGE_MS,
  KDV_RATE,
  STOPAJ_RATE,
  DEFAULT_SYNC_LOOKBACK_DAYS,
} from "@/lib/constants"

// ─── Ürün Sync ────────────────────────────────────────────────────────────────

// Trendyol'daki tüm onaylı ürünleri çekip DB'ye yazar.
// Aynı ürün varsa günceller (upsert), yoksa oluşturur.
async function syncProducts(): Promise<number> {
  const products = await getProducts()

  for (const product of products) {
    await db.product.upsert({
      where: { trendyolId: product.id },
      update: {
        title:    product.title,
        barcode:  product.barcode,
        imageUrl: product.imageUrl,
        category: product.category,
        brand:    product.brand,
        // costPrice güncellenmez — kullanıcının elle girdiği değeri koruyoruz
      },
      create: {
        trendyolId: product.id,
        title:      product.title,
        barcode:    product.barcode,
        imageUrl:   product.imageUrl,
        category:   product.category,
        brand:      product.brand,
        // costPrice null olarak başlar, kullanıcı ürünler sayfasından girer
      },
    })
  }

  return products.length
}

// ─── Sipariş Sync ─────────────────────────────────────────────────────────────


// ── Sync Logger ───────────────────────────────────────────────────────────────
// console.log yerine yapılandırılmış JSON loglar — grep'lemeyi kolaylaştırır.
// Formatı: [sync:<olay>] { ...alanlar }

function logSync(event: string, data: Record<string, unknown>) {
  console.log(`[sync:${event}]`, JSON.stringify(data))
}

// Belirli tarih aralığındaki siparişleri çekip DB'ye yazar.
// Her sipariş kalemi için kar hesaplayıp saklar.
async function syncOrders(startDate: number, endDate: number): Promise<number> {
  // 14 günlük parçalar halinde tüm aralığı çek
  const allOrders = []
  let chunkStart = startDate
  while (chunkStart < endDate) {
    const chunkEnd = Math.min(chunkStart + ORDER_MAX_RANGE_MS, endDate)
    const chunk = await getOrders({ startDate: chunkStart, endDate: chunkEnd })
    allOrders.push(...chunk)
    chunkStart = chunkEnd + 1
  }
  const orders = allOrders

  // Kargo barem fiyatları (kullanıcı ayarlardan girer, KDV hariç)
  const cargoTier1 = Number(await getSetting("cargo_tier_1")) || 0
  const cargoTier2 = Number(await getSetting("cargo_tier_2")) || 0
  const cargoTier3 = Number(await getSetting("cargo_tier_3")) || 0

  // Sync özeti için sayaçlar
  let totalGrossAmount   = 0
  let totalProfit        = 0
  let zeroGrossCount     = 0
  let zeroCommissionCount = 0

  // İlk siparişi detaylı logla — alan adlarını doğrulamak için
  if (orders[0]) {
    const first     = orders[0]
    const firstLine = first.lines?.[0]
    logSync("ilk-siparis-ham", {
      id:           first.id,
      status:       first.status,
      grossAmount_api:   first.grossAmount,           // Trendyol'dan gelen
      totalDiscount_api: first.totalDiscount,
      lineCount:    first.lines?.length ?? 0,
    })
    if (firstLine) {
      logSync("ilk-kalem-ham", {
        barcode:    firstLine.barcode,
        qty:        firstLine.quantity,
        price:      firstLine.price,        // birim fiyat mı, toplam mı? — bunu doğrula
        amount:     firstLine.amount,       // price×qty mi? — bunu doğrula
        discount:   firstLine.discount,
        commission: firstLine.commission,   // 0 geliyorsa settlements API gerekebilir
        cargoPrice: firstLine.cargoPrice,   // 0 geliyorsa order API'da yok demektir
      })
    }
  }

  for (const order of orders) {
    // Trendyol bazen ID'yi number olarak gönderiyor — DB String bekliyor
    const trendyolOrderId = String(order.id)

    // grossAmount hesabı: 3 fallback katmanlı
    // 1. order.grossAmount (API'da varsa)
    // 2. sum(lines[].amount) — toplam kalem tutarı
    // 3. sum(lines[].price × qty) — birim fiyat × adet (en güvenilir fallback)
    const grossFromAPI    = Number(order.grossAmount) || 0
    const grossFromAmount = order.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const grossFromPrice  = order.lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 1), 0)
    const grossAmount     = grossFromAPI || grossFromAmount || grossFromPrice

    if (grossAmount === 0) {
      zeroGrossCount++
      logSync("uyari-sifir-gross", { trendyolOrderId, grossFromAPI, grossFromAmount, grossFromPrice })
    }

    const discountAmount   = Number(order.totalDiscount) || order.lines.reduce((s, l) => s + (Number(l.discount) || 0), 0)
    // commission API'dan oran (%) olarak geliyor — tutara çeviriyoruz: netFiyat × oran/100
    const commissionAmount = order.lines.reduce((s, l) => {
      const netPrice = Number(l.price)    || 0
      const qty      = Number(l.quantity) || 1
      const rate     = Number(l.commission) || 0
      return s + netPrice * qty * rate / 100
    }, 0)
    // Kargo: Orders API'dan gelmez → barem tablosundan hesapla (kullanıcı ayarlarından)
    const cargoFromApi   = order.lines.reduce((s, l) => s + (Number(l.cargoPrice) || 0), 0)
    const cargoAmount    = cargoFromApi || calculateCargoWithKdv(grossAmount, cargoTier1, cargoTier2, cargoTier3)
    const netRevenue     = grossAmount - discountAmount
    const estimatedKdv      = Math.round(commissionAmount * KDV_RATE    * 100) / 100
    const estimatedStoppage = Math.round(netRevenue      * STOPAJ_RATE * 100) / 100

    if (commissionAmount === 0) zeroCommissionCount++

    // Siparişi kaydet veya güncelle — update'te tutarlar da yenilenir (yanlış alan adıyla kaydedilmiş eski kayıtları düzeltir)
    const savedOrder = await db.order.upsert({
      where: { trendyolOrderId },
      update: {
        status: order.status,
        grossAmount,
        discountAmount,
        commissionAmount,
        cargoAmount,
        netKdv:         estimatedKdv,
        stoppageAmount: estimatedStoppage,
      },
      create: {
        trendyolOrderId,
        orderDate: new Date(order.orderDate),
        status:    order.status,
        grossAmount,
        discountAmount,
        commissionAmount,
        cargoAmount,
        netKdv:         estimatedKdv,
        stoppageAmount: estimatedStoppage,
      },
    })

    let orderProfit = 0

    // Her sipariş kalemi için
    for (const line of order.lines) {
      // Barkodla ürünü bul — maliyet fiyatını almak için
      const product = line.barcode
        ? await db.product.findFirst({ where: { barcode: line.barcode } })
        : null

      const costPrice = product?.costPrice ? Number(product.costPrice) : 0

      // Kar hesapla
      const profit = calculateProfitFromLine(line, costPrice)
      orderProfit += profit

      // Kalem DB'de var mı kontrol et
      const existingItem = await db.orderItem.findFirst({
        where: {
          orderId:  savedOrder.id,
          product: { barcode: line.barcode ?? undefined },
        },
      })

      if (existingItem) {
        await db.orderItem.update({
          where: { id: existingItem.id },
          data: {
            salePrice:  Number(line.price)      || 0,
            discount:   Number(line.discount)   || 0,
            commission: Number(line.commission) || 0,
            cargoShare: Number(line.cargoPrice) || 0,
            profit,
          },
        })
      } else {
        await db.orderItem.create({
          data: {
            orderId:    savedOrder.id,
            productId:  product?.id ?? null,
            quantity:   line.quantity,
            salePrice:  Number(line.price)      || 0,
            discount:   Number(line.discount)   || 0,
            commission: Number(line.commission) || 0,
            cargoShare: Number(line.cargoPrice) || 0,
            profit:     isNaN(profit) ? 0 : profit,
          },
        })
      }
    }

    totalGrossAmount += grossAmount
    totalProfit      += orderProfit
  }

  // Sync tamamlandı — özet log
  logSync("ozet", {
    toplamSiparis:    orders.length,
    toplamGross:      Math.round(totalGrossAmount * 100) / 100,
    toplamProfit:     Math.round(totalProfit * 100) / 100,
    sıfırGrossSayısı: zeroGrossCount,
    sıfırKomisyonSayısı: zeroCommissionCount,
    uyarı: zeroCommissionCount > 0
      ? "Komisyon değerleri 0 — Trendyol Orders API komisyon döndürmüyor olabilir. Bkz: trendyol_api.md#bilinen-eksikler"
      : null,
  })

  return orders.length
}

// ─── Settlement Sync ──────────────────────────────────────────────────────────

// Trendyol Finance API'sından komisyon, kargo, hizmet bedeli, stopaj, KDV verilerini çeker.
// Her sipariş için bu alanları DB'ye yazar — doğru kar hesabı için gerekli.
async function syncSettlements(startDate: number, endDate: number): Promise<number> {
  const allSettlements = []

  let chunkStart = startDate
  while (chunkStart < endDate) {
    const chunkEnd = Math.min(chunkStart + SETTLEMENT_MAX_RANGE_MS, endDate)
    const chunk = await getSettlements({ startDate: chunkStart, endDate: chunkEnd })
    allSettlements.push(...chunk)
    chunkStart = chunkEnd + 1
  }

  if (allSettlements.length === 0) return 0

  // shipmentPackageId bazında grupla — bir paket için birden fazla satır olabilir
  const grouped = new Map<string, {
    commissionAmount: number
    cargoAmount:      number
    serviceFee:       number
    stoppageAmount:   number
    netKdv:           number
  }>()

  for (const s of allSettlements) {
    const key = String(s.shipmentPackageId ?? s.orderNumber ?? "")
    if (!key) continue

    const existing = grouped.get(key) ?? {
      commissionAmount: 0,
      cargoAmount:      0,
      serviceFee:       0,
      stoppageAmount:   0,
      netKdv:           0,
    }

    // Her alan için ilgili settlement satırını topla
    existing.commissionAmount += Number(s.commissionAmount) || 0
    existing.cargoAmount      += Number(s.cargoAmount)      || 0
    existing.serviceFee       += Number(s.serviceFee)       || 0
    existing.stoppageAmount   += Number(s.stoppageAmount)   || 0
    existing.netKdv           += Number(s.netKdv)           || 0

    grouped.set(key, existing)
  }

  let updatedCount = 0

  for (const [packageId, amounts] of Array.from(grouped.entries())) {
    const order = await db.order.findUnique({ where: { trendyolOrderId: packageId } })
    if (!order) continue

    // Tüm finansal alanları güncelle — sadece gerçek değer varsa yaz
    await db.order.update({
      where: { id: order.id },
      data: {
        ...(amounts.commissionAmount !== 0 && { commissionAmount: amounts.commissionAmount }),
        ...(amounts.cargoAmount      !== 0 && { cargoAmount:      amounts.cargoAmount }),
        ...(amounts.serviceFee       !== 0 && { serviceFee:       amounts.serviceFee }),
        ...(amounts.stoppageAmount   !== 0 && { stoppageAmount:   amounts.stoppageAmount }),
        ...(amounts.netKdv           !== 0 && { netKdv:           amounts.netKdv }),
      },
    })
    updatedCount++
  }

  logSync("settlements-ozet", {
    toplamSettlement: allSettlements.length,
    gruplanmisPackage: grouped.size,
    guncellenenSiparis: updatedCount,
  })

  return allSettlements.length
}

// ─── İade Sync ────────────────────────────────────────────────────────────────

async function syncClaims(startDate: number, endDate: number): Promise<number> {
  const claims = await getClaims({ startDate, endDate })
  return claims.length
}

// ─── Ana Sync Fonksiyonu ──────────────────────────────────────────────────────

// force=true → last_sync_date'i görmezden gelir, 90 gün geriye gider (mevcut veriyi düzeltmek için)
export async function runSync(force = false): Promise<{ success: boolean; message: string }> {
  try {
    const lastSyncStr = await getSetting("last_sync_date")
    const startDate   = (force || !lastSyncStr)
      ? Date.now() - DEFAULT_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
      : Number(lastSyncStr)
    const endDate = Date.now()

    if (force) logSync("force-resync", { startDate: new Date(startDate).toISOString() })

    // Ürünleri sync'le
    const productCount = await syncProducts()

    // Siparişleri sync'le (grossAmount 3-katmanlı fallback ile)
    const orderCount = await syncOrders(startDate, endDate)

    // Settlements: komisyon, kargo, hizmet, stopaj, KDV
    let settlementCount = 0
    try {
      settlementCount = await syncSettlements(startDate, endDate)
    } catch (err) {
      // Settlements API erişilemezse sync durmasın — sadece logla
      logSync("settlements-hata", { error: String(err) })
    }

    // İadeleri sync'le
    const claimCount = await syncClaims(startDate, endDate)

    // Son sync tarihini güncelle
    await setSetting("last_sync_date", String(endDate))

    // Başarılı sync kaydı oluştur
    await db.syncLog.create({
      data: {
        recordsFetched: orderCount + productCount + claimCount,
        status:         "success",
      },
    })

    return {
      success: true,
      message: `${productCount} ürün, ${orderCount} sipariş, ${settlementCount} settlement, ${claimCount} iade sync'lendi.`,
    }
  } catch (error) {
    // Hata olursa log'a yaz, uygulamayı çökertme
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata"

    await db.syncLog.create({
      data: {
        recordsFetched: 0,
        status:         "error",
        errorMessage,
      },
    })

    return {
      success: false,
      message: errorMessage,
    }
  }
}
