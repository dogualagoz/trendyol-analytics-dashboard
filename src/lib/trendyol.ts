// Trendyol Seller API ile konuşan merkezi modül.
// Tüm API istekleri buradan geçer — başka dosyalar doğrudan fetch atmaz.

import { getSetting } from "@/lib/settings"
import type {
  TrendyolPage,
  TrendyolOrder,
  TrendyolProduct,
  TrendyolClaim,
} from "@/types/trendyol"

const BASE_URL = "https://apigw.trendyol.com"

// ─── Auth Header ─────────────────────────────────────────────────────────────

// Her istekte kullanılacak Authorization ve User-Agent header'larını oluşturur.
// Credentials DB'den okunur — .env'e yazılmaz, kullanıcı ayarlar sayfasından girer.
async function buildHeaders(): Promise<HeadersInit> {
  const apiKey    = await getSetting("trendyol_api_key")
  const apiSecret = await getSetting("trendyol_api_secret")
  const sellerId  = await getSetting("trendyol_seller_id")

  if (!apiKey || !apiSecret || !sellerId) {
    throw new Error("Trendyol API bilgileri eksik. Ayarlar sayfasından girin.")
  }

  // Basic Auth: "apiKey:apiSecret" stringini base64'e çeviriyoruz
  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

  return {
    "Authorization": `Basic ${token}`,
    // User-Agent formatı Trendyol tarafından zorunlu tutuluyor
    "User-Agent": `${sellerId} - SelfIntegration`,
    "Content-Type": "application/json",
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

    const res = await fetch(
      `${BASE_URL}/integration/order/sellers/${sellerId}/orders?${query}`,
      { headers }
    )

    if (!res.ok) {
      throw new Error(`Siparişler çekilemedi: ${res.status} ${res.statusText}`)
    }

    const data: TrendyolPage<TrendyolOrder> = await res.json()
    allOrders.push(...data.content)

    // İlk istekte kaç sayfa olduğunu öğreniyoruz
    totalPages = data.totalPages
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
      size:     "100",  // ürünlerde max 100
      approved: "true", // sadece onaylı ürünleri çek
    })

    const res = await fetch(
      `${BASE_URL}/integration/product/sellers/${sellerId}/products?${query}`,
      { headers }
    )

    if (!res.ok) {
      throw new Error(`Ürünler çekilemedi: ${res.status} ${res.statusText}`)
    }

    const data: TrendyolPage<TrendyolProduct> = await res.json()
    allProducts.push(...data.content)

    totalPages = data.totalPages
    page++
  }

  return allProducts
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

    const data: TrendyolPage<TrendyolClaim> = await res.json()
    allClaims.push(...data.content)

    totalPages = data.totalPages
    page++
  }

  return allClaims
}
