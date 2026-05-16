// Trendyol Seller API ile konuşan merkezi modül.
// Tüm API istekleri buradan geçer — başka dosyalar doğrudan fetch atmaz.

import { getSetting } from "@/lib/settings"
import type {
  TrendyolPage,
  TrendyolOrder,
  TrendyolProduct,
  TrendyolClaim,
  TrendyolSettlement,
} from "@/types/trendyol"

const BASE_URL = "https://apigw.trendyol.com"
const IS_DEV   = process.env.NODE_ENV !== "production"

// ─── Auth Header ─────────────────────────────────────────────────────────────

// Her istekte kullanılacak Authorization ve User-Agent header'larını oluşturur.
// Credentials DB'den okunur — .env'e yazılmaz, kullanıcı ayarlar sayfasından girer.
async function buildHeaders(): Promise<HeadersInit> {
  const apiKey    = await getSetting("trendyol_api_key")
  const apiSecret = await getSetting("trendyol_api_secret")
  const sellerId  = await getSetting("trendyol_seller_id")
  const integRef  = await getSetting("trendyol_integration_ref")

  if (!apiKey || !apiSecret || !sellerId) {
    throw new Error("Trendyol API bilgileri eksik. Ayarlar sayfasından girin.")
  }

  // Basic Auth: "apiKey:apiSecret" stringini base64'e çeviriyoruz
  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

  // User-Agent: Trendyol entegrasyon referans kodu varsa onu kullan, yoksa SelfIntegration
  const userAgent = integRef
    ? `${sellerId} - ${integRef}`
    : `${sellerId} - SelfIntegration`

  return {
    "Authorization": `Basic ${token}`,
    "User-Agent":    userAgent,
    "Content-Type":  "application/json",
  }
}

// ─── Siparişler ───────────────────────────────────────────────────────────────

type GetOrdersParams = {
  startDate: number  // Unix timestamp milisaniye
  endDate: number    // Unix timestamp milisaniye
  page?: number      // varsayılan: 0
  size?: number      // varsayılan: 200 (max)
  status?: string    // opsiyonel filtre: "Delivered", "Cancelled" vs.
}

// Belirli tarih aralığındaki siparişleri çeker.
// Tüm sayfaları otomatik olarak dolaşır, tek liste döner.
export async function getOrders(params: GetOrdersParams): Promise<TrendyolOrder[]> {
  const sellerId = await getSetting("trendyol_seller_id")
  const headers  = await buildHeaders()

  const allOrders: TrendyolOrder[] = []
  let page = params.page ?? 0
  let totalPages = 1  // ilk istekten sonra güncellenir

  // Trendyol sayfalı veri döndürür — tüm sayfaları teker teker çekiyoruz
  while (page < totalPages) {
    const query = new URLSearchParams({
      startDate: String(params.startDate),
      endDate:   String(params.endDate),
      page:      String(page),
      size:      String(params.size ?? 200),
      ...(params.status ? { status: params.status } : {}),
    })

    const url = `${BASE_URL}/integration/order/sellers/${sellerId}/orders?${query}`
    if (IS_DEV) console.log("[trendyol] GET", url)

    const res = await fetch(url, { headers })

    if (!res.ok) {
      const body = await res.text()
      console.error("[trendyol] Hata body:", body)
      throw new Error(`Siparişler çekilemedi: ${res.status} ${res.statusText} — ${body}`)
    }

    // Trendyol bazen boş veya null body dönebilir
    const raw: unknown = await res.json()
    if (!raw || typeof raw !== "object") {
      console.warn("[trendyol] Siparişler: null/boş yanıt, sayfa", page)
      break
    }
    const data = raw as TrendyolPage<TrendyolOrder>
    const content = data.content ?? []

    // İlk sayfada ham yanıtı ve ilk sipariş yapısını logla — alan adlarını görmek için
    if (IS_DEV && page === 0) {
      console.log("[trendyol] Sipariş yanıtı (page 0):", JSON.stringify({
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        contentLength: content.length,
      }))
      if (content[0]) {
        const first = content[0]
        console.log("[trendyol] İlk sipariş:", JSON.stringify(
          Object.fromEntries(Object.entries(first).filter(([k]) => k !== "lines")), null, 2
        ))
        if (first.lines?.[0]) {
          console.log("[trendyol] İlk kalem:", JSON.stringify(first.lines[0], null, 2))
        }
      }
    }

    allOrders.push(...content)
    totalPages = data.totalPages ?? 0
    page++
  }

  return allOrders
}

// ─── Ürünler ──────────────────────────────────────────────────────────────────

// Satıcının tüm onaylı ürünlerini çeker.
export async function getProducts(): Promise<TrendyolProduct[]> {
  const sellerId = await getSetting("trendyol_seller_id")
  const headers  = await buildHeaders()

  const allProducts: TrendyolProduct[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const query = new URLSearchParams({
      page:     String(page),
      size:     "100",    // ürünlerde max 100
      approval: "Approved", // sadece onaylı ürünleri çek
    })

    const res = await fetch(
      `${BASE_URL}/integration/product/sellers/${sellerId}/products?${query}`,
      { headers }
    )

    if (!res.ok) {
      throw new Error(`Ürünler çekilemedi: ${res.status} ${res.statusText}`)
    }

    const raw: unknown = await res.json()
    if (!raw || typeof raw !== "object") {
      console.warn("[trendyol] Ürünler: null/boş yanıt, sayfa", page)
      break
    }
    const data = raw as TrendyolPage<TrendyolProduct>
    allProducts.push(...(data.content ?? []))

    totalPages = data.totalPages ?? 0
    page++
  }

  return allProducts
}

// ─── Settlements (Finance API) ────────────────────────────────────────────────

type GetSettlementsParams = {
  startDate: number  // Unix ms
  endDate:   number  // Unix ms — API max 15 günlük aralık kabul eder
  page?:     number
  size?:     number  // max 500
}

// Komisyon, kargo, hizmet bedeli, stopaj ve KDV verilerini çeker.
// sync.ts bu fonksiyonu 15 günlük chunk'lara bölerek çağırır.
export async function getSettlements(params: GetSettlementsParams): Promise<TrendyolSettlement[]> {
  const sellerId = await getSetting("trendyol_seller_id")
  const headers  = await buildHeaders()

  const allSettlements: TrendyolSettlement[] = []
  let page       = params.page ?? 0
  let totalPages = 1

  while (page < totalPages) {
    const query = new URLSearchParams({
      startDate: String(params.startDate),
      endDate:   String(params.endDate),
      page:      String(page),
      size:      String(params.size ?? 500),
    })

    const url = `${BASE_URL}/integration/finance/sellers/${sellerId}/settlements?${query}`
    if (IS_DEV) console.log("[trendyol] GET settlements", url)

    const res = await fetch(url, { headers })

    if (!res.ok) {
      const body = await res.text()
      console.error("[trendyol] Settlements hata:", body)
      throw new Error(`Settlements çekilemedi: ${res.status} ${res.statusText} — ${body}`)
    }

    const raw: unknown = await res.json()
    if (!raw || typeof raw !== "object") break

    const data = raw as TrendyolPage<TrendyolSettlement>

    // İlk sayfada ham yapıyı logla — alan adlarını doğrulamak için
    if (IS_DEV && page === 0 && (data.content ?? []).length > 0) {
      console.log("[trendyol] İlk settlement satırı:", JSON.stringify(data.content[0], null, 2))
    }

    allSettlements.push(...(data.content ?? []))
    totalPages = data.totalPages ?? 0
    page++
  }

  return allSettlements
}

// ─── İadeler ──────────────────────────────────────────────────────────────────

type GetClaimsParams = {
  startDate: number
  endDate: number
  page?: number
  size?: number
}

// Belirli tarih aralığındaki iadeleri çeker.
export async function getClaims(params: GetClaimsParams): Promise<TrendyolClaim[]> {
  const sellerId = await getSetting("trendyol_seller_id")
  const headers  = await buildHeaders()

  const allClaims: TrendyolClaim[] = []
  let page = params.page ?? 0
  let totalPages = 1

  while (page < totalPages) {
    const query = new URLSearchParams({
      startDate: String(params.startDate),
      endDate:   String(params.endDate),
      page:      String(page),
      size:      String(params.size ?? 200),
    })

    const res = await fetch(
      `${BASE_URL}/integration/order/sellers/${sellerId}/claims?${query}`,
      { headers }
    )

    if (!res.ok) {
      throw new Error(`İadeler çekilemedi: ${res.status} ${res.statusText}`)
    }

    const raw: unknown = await res.json()
    if (!raw || typeof raw !== "object") {
      console.warn("[trendyol] İadeler: null/boş yanıt, sayfa", page)
      break
    }
    const data = raw as TrendyolPage<TrendyolClaim>
    allClaims.push(...(data.content ?? []))

    totalPages = data.totalPages ?? 0
    page++
  }

  return allClaims
}
