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
  quantity:       number
  productName?:   string
  barcode?:       string
  merchantSku?:   string   // satıcının kendi SKU'su — products.modelCode olarak kaydedilir
  stockCode?:     string   // alternatif SKU
  contentId?:     number   // Trendyol ürün içerik ID — products.trendyolId ile eşleştirilebilir
  productCode?:   number   // contentId ile aynı
  price?:         number   // birim satış fiyatı (KDV dahil)
  amount?:        number   // toplam tutar (price × quantity - discount)
  discount?:      number   // indirim tutarı
  commission?:    number   // Trendyol komisyon ORANI (%) — örn. 21 → %21; tutar = price × qty × rate/100
  cargoPrice?:    number   // kargo payı
  vatBaseAmount?: number   // KDV matrahı oranı (%)
  vatRate?:       number   // KDV oranı (%) — örn. 10 → %10
  vatValue?:      number   // KDV tutarı
  currencyCode?:  string
  productColor?:  string   // renk — products.color olarak kaydedilir
  productSize?:   string   // beden — products.size olarak kaydedilir
  orderLineItemStatusName?: string  // "Delivered", "Cancelled", "Returned" vs.
}

// Trendyol'dan gelen sipariş objesi
export type TrendyolOrder = {
  id:             string | number  // Trendyol bazen number gönderiyor — DB'ye String olarak kaydediyoruz
  orderNumber:    string           // sipariş numarası (müşteriye gösterilen)
  orderDate:      number           // Unix timestamp milisaniye
  status:         string           // "Delivered", "Cancelled", "Returned" vs.
  grossAmount?:   number           // sipariş toplam brüt tutarı (sipariş seviyesinde)
  totalDiscount?: number           // toplam indirim
  deliveryType?:  string           // "normal", "fast" vs. — products.deliveryType olarak kaydedilir
  cargoDeci?:     number           // siparişin toplam desisi
  lines:          TrendyolOrderLine[]
}

// ─── Ürünler ──────────────────────────────────────────────────────────────────

export type TrendyolProductAttribute = {
  attributeName:  string
  attributeValue: string
}

// Trendyol'dan gelen ürün objesi
export type TrendyolProduct = {
  id:             string             // Trendyol ürün ID'si (trendyolId olarak kaydediyoruz)
  barcode?:       string             // barkod (bazı ürünlerde yok)
  title:          string             // ürün adı
  categoryName?:  string             // kategori adı (API'da categoryName olarak gelir)
  category?:      string             // alternatif alan adı
  brandName?:     string             // marka adı (API'da brandName olarak gelir)
  brand?:         string             // alternatif alan adı
  images?:        Array<{ url: string }>  // görseller array olarak gelir — images[0].url kullan
  imageUrl?:      string             // bazı yanıtlarda doğrudan string olarak gelebilir
  listPrice?:     number             // liste fiyatı
  salePrice?:     number             // satış fiyatı
  price?:         number             // alternatif alan adı
  quantity:       number             // stok adedi
  approvalStatus?: string            // "Approved", "Rejected", "Waiting"
  // Ek alanlar
  productMainId?:      string        // model kodu / satıcı SKU
  stockCode?:          string        // alternatif stok kodu
  dimensionalWeight?:  number        // desi (boyutsal ağırlık)
  deliveryOption?:     string | Record<string, unknown>  // string veya obje gelebilir
  attributes?:         TrendyolProductAttribute[]  // renk, beden gibi varyant özellikleri
}

// ─── Settlements (Finance API) ────────────────────────────────────────────────

// GET /integration/finance/che/sellers/{sellerId}/settlements
// Her sipariş paketi için finansal kalemleri döner.
// Bir paket için birden fazla satır gelebilir (satış + komisyon kesintisi ayrı satırlar olabilir).
export type TrendyolSettlement = {
  id?:                string | number
  transactionDate?:   number           // Unix ms
  orderNumber?:       string           // sipariş numarası (müşteriye gösterilen)
  shipmentPackageId?: number           // paket ID — orders.trendyolOrderId ile eşleşir
  transactionType?:   string           // "Sale", "Return", "CommissionNegative" vs.
  barcode?:           string
  commissionAmount?:  number           // Trendyol komisyonu (negatif veya pozitif gelebilir)
  cargoAmount?:       number           // kargo ücreti
  serviceFee?:        number           // hizmet bedeli
  stoppageAmount?:    number           // stopaj kesintisi
  netKdv?:            number           // net KDV
  sellerRevenue?:     number           // satıcı hakediş (tüm kesintiler sonrası)
  debt?:              number           // borç tutarı
  credit?:            number           // alacak tutarı
  paymentOrderId?:    string
  paymentDate?:       number
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
