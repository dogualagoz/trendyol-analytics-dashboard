// Trendyol'dan veri çekip veritabanına yazan senkronizasyon motoru.
// Hem otomatik (zamanlayıcı) hem manuel ("Güncelle" butonu) olarak çağrılır.

import db from "@/lib/db"
import { getSetting, setSetting } from "@/lib/settings"
import { getOrders, getProducts, getClaims } from "@/lib/trendyol"
import { calculateProfitFromLine } from "@/lib/calculations"

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

// Trendyol max 14 günlük tarih aralığı kabul ediyor.
// Daha uzun aralıklar için isteği parçalara böleriz.
const MAX_RANGE_MS = 14 * 24 * 60 * 60 * 1000

// Belirli tarih aralığındaki siparişleri çekip DB'ye yazar.
// Her sipariş kalemi için kar hesaplayıp saklar.
async function syncOrders(startDate: number, endDate: number): Promise<number> {
  // 14 günlük parçalar halinde tüm aralığı çek
  const allOrders = []
  let chunkStart = startDate
  while (chunkStart < endDate) {
    const chunkEnd = Math.min(chunkStart + MAX_RANGE_MS, endDate)
    const chunk = await getOrders({ startDate: chunkStart, endDate: chunkEnd })
    allOrders.push(...chunk)
    chunkStart = chunkEnd + 1
  }
  const orders = allOrders

  for (const order of orders) {
    // Trendyol bazen ID'yi number olarak gönderiyor — DB String bekliyor
    const trendyolOrderId = String(order.id)

    // Sipariş seviyesi tutarları hesapla
    const grossAmount      = Number(order.grossAmount) || order.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
    const discountAmount   = Number(order.totalDiscount) || order.lines.reduce((sum, l) => sum + (Number(l.discount) || 0), 0)
    const commissionAmount = order.lines.reduce((sum, l) => sum + (Number(l.commission) || 0), 0)
    const cargoAmount      = order.lines.reduce((sum, l) => sum + (Number(l.cargoPrice) || 0), 0)

    // Siparişi kaydet veya güncelle — update'te tutarlar da yenilenir (yanlış alan adıyla kaydedilmiş eski kayıtları düzeltir)
    const savedOrder = await db.order.upsert({
      where: { trendyolOrderId },
      update: {
        status: order.status,
        grossAmount,
        discountAmount,
        commissionAmount,
        cargoAmount,
      },
      create: {
        trendyolOrderId,
        orderDate: new Date(order.orderDate),
        status:    order.status,
        grossAmount,
        discountAmount,
        commissionAmount,
        cargoAmount,
      },
    })

    // Her sipariş kalemi için
    for (const line of order.lines) {
      // Barkodla ürünü bul — maliyet fiyatını almak için
      const product = line.barcode
        ? await db.product.findFirst({ where: { barcode: line.barcode } })
        : null

      const costPrice = product?.costPrice ? Number(product.costPrice) : 0

      // Kar hesapla
      const profit = calculateProfitFromLine(line, costPrice)

      // Kalem DB'de var mı kontrol et
      const existingItem = await db.orderItem.findFirst({
        where: {
          orderId:  savedOrder.id,
          // Aynı siparişte aynı barkodlu ürün = aynı kalem
          product: { barcode: line.barcode ?? undefined },
        },
      })

      if (existingItem) {
        // Varsa güncelle — salePrice ve profit dahil tüm tutarları yenile
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
        // Yoksa oluştur — Number() || 0: Trendyol undefined/null gönderirse 0 yaz
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
  }

  return orders.length
}

// ─── İade Sync ────────────────────────────────────────────────────────────────

// İadeleri şimdilik sadece SyncLog'a sayı olarak yansıtıyoruz.
// İadeler sayfası için ham veri DB'de ayrı tutulmayacak — her görüntülemede API'dan çekilecek.
async function syncClaims(startDate: number, endDate: number): Promise<number> {
  const claims = await getClaims({ startDate, endDate })
  return claims.length
}

// ─── Ana Sync Fonksiyonu ──────────────────────────────────────────────────────

// Dışarıdan çağrılan tek fonksiyon budur.
// 1. Son sync tarihini okur
// 2. Ürünleri sync'ler
// 3. Siparişleri sync'ler
// 4. Son sync tarihini günceller
// 5. Sync log kaydı oluşturur
export async function runSync(): Promise<{ success: boolean; message: string }> {
  try {
    // İlk sync'te 90 gün geriye git (Trendyol'un izin verdiği max)
    const lastSyncStr = await getSetting("last_sync_date")
    const startDate   = lastSyncStr
      ? Number(lastSyncStr)
      : Date.now() - 90 * 24 * 60 * 60 * 1000
    const endDate = Date.now()

    // Ürünleri sync'le
    const productCount = await syncProducts()

    // Siparişleri sync'le
    const orderCount = await syncOrders(startDate, endDate)

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
      message: `${productCount} ürün, ${orderCount} sipariş, ${claimCount} iade sync'lendi.`,
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
