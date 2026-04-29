// Trendyol API'dan gelen verilerin TypeScript tipleri.
// Burası değişirse lib/trendyol.ts'deki fonksiyonlar da güncellenmeli.

// ─── Ortak ───────────────────────────────────────────────────────────────────

// Tüm liste endpoint'leri bu yapıda sayfalama bilgisi döner
export type TrendyolPage<T> = {
  totalElements: number  // toplam kayıt sayısı
  totalPages: number     // toplam sayfa sayısı
  page: number           // şu anki sayfa (0'dan başlar)
  size: number           // sayfa başına kayıt
  content: T[]           // asıl veri listesi
}

// ─── Siparişler ───────────────────────────────────────────────────────────────

// Sipariş içindeki her bir ürün kalemi
// Alan adları Trendyol seller API v2 dokümantasyonuna göre güncellendi.
export type TrendyolOrderLine = {
  quantity:      number
  productName?:  string
  barcode?:      string
  merchantSku?:  string
  price?:        number   // birim satış fiyatı (KDV dahil)
  amount?:       number   // toplam tutar (price × quantity - discount)
  discount?:     number   // indirim tutarı
  commission?:   number   // Trendyol komisyonu
  cargoPrice?:   number   // kargo payı
  vatBaseAmount?: number  // KDV matrahı
  vatValue?:     number   // KDV tutarı
  currencyCode?: string
}

// Trendyol'dan gelen sipariş objesi
export type TrendyolOrder = {
  id: string | number        // Trendyol bazen number gönderiyor — DB'ye String olarak kaydediyoruz
  orderNumber: string        // sipariş numarası (müşteriye gösterilen)
  orderDate: number          // Unix timestamp milisaniye
  status: string             // "Delivered", "Cancelled", "Returned" vs.
  grossAmount?: number       // sipariş toplam brüt tutarı (sipariş seviyesinde)
  totalDiscount?: number     // toplam indirim
  lines: TrendyolOrderLine[] // siparişteki ürün kalemleri
}

// ─── Ürünler ──────────────────────────────────────────────────────────────────

// Trendyol'dan gelen ürün objesi
export type TrendyolProduct = {
  id: string             // Trendyol ürün ID'si (trendyolId olarak kaydediyoruz)
  barcode: string        // barkod
  title: string          // ürün adı
  category: string       // kategori adı
  brand: string          // marka adı
  imageUrl: string       // ana görsel URL'si
  price: number          // satış fiyatı (Trendyol'daki)
  quantity: number       // stok adedi
  approvalStatus: string // "Approved", "Rejected", "Waiting"
}

// ─── İadeler ──────────────────────────────────────────────────────────────────

// İade içindeki ürün kalemi
export type TrendyolClaimItem = {
  productName: string  // iade edilen ürün adı
  barcode: string      // barkod
  quantity: number     // iade miktarı
}

// Trendyol'dan gelen iade objesi
export type TrendyolClaim = {
  claimId: string             // iade talep ID'si
  claimDate: number           // Unix timestamp milisaniye
  claimReason: string         // iade nedeni ("Damaged", "Wrong Product" vs.)
  claimItemStatus: string     // "Created", "Accepted", "Rejected" vs.
  orderNumber: string         // hangi siparişten iade edildi
  items: TrendyolClaimItem[]  // iade edilen ürünler
}
