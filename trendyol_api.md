# Trendyol Seller API — Referans Doküman

> Bu dosya hem developer referansı hem de Claude'un kod yazarken başvurduğu kaynak.
> Her alan adı değişikliğinde, yeni keşfedilen API davranışında bu dosyayı güncelle.
> **Son güncelleme: 2026-04-29**

---

## Bağlantı Bilgileri

```
Base URL:  https://apigw.trendyol.com
Auth tipi: Basic Authentication
```

### Authentication

```
Authorization: Basic <base64(apiKey:apiSecret)>
User-Agent:    <sellerId> - SelfIntegration
Content-Type:  application/json
```

Node.js'te:
```typescript
const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
// header: `Basic ${token}`
```

Credentials DB'de `settings` tablosunda saklanır. Key'ler:
- `trendyol_api_key`
- `trendyol_api_secret`
- `trendyol_seller_id`

---

## Kullandığımız Endpoint'ler

### 1. Siparişler

```
GET /integration/order/sellers/{sellerId}/orders
```

**Query parametreleri:**

| Parametre | Tip    | Açıklama                        | Örnek |
|-----------|--------|---------------------------------|-------|
| startDate | long   | Başlangıç (Unix ms)             | 1704067200000 |
| endDate   | long   | Bitiş (Unix ms)                 | 1704153600000 |
| page      | int    | Sayfa numarası (0'dan başlar)   | 0 |
| size      | int    | Sayfa başına kayıt (max: 200)   | 200 |
| status    | string | Durum filtresi (opsiyonel)      | "Delivered" |

> ⚠️ **Kısıt:** Tek istekte maksimum 14 günlük aralık. Daha uzun aralık için chunking gerekir (`sync.ts:MAX_RANGE_MS`).

**Response yapısı (sayfalı):**

```json
{
  "totalElements": 312,
  "totalPages": 2,
  "page": 0,
  "size": 200,
  "content": [ /* TrendyolOrder[] */ ]
}
```

**Sipariş objesi — onaylı alan adları:**

```json
{
  "id": 12345678,
  "orderNumber": "123456789",
  "orderDate": 1704067200000,
  "status": "Delivered",
  "grossAmount": 299.97,
  "totalDiscount": 30.00,
  "totalPrice": 269.97,
  "currencyCode": "TRY",
  "lines": [ /* TrendyolOrderLine[] */ ]
}
```

**Sipariş kalemi (line) — onaylı alan adları:**

```json
{
  "id": 98765,
  "quantity": 3,
  "productName": "Ürün Adı",
  "barcode": "123456789012",
  "merchantSku": "SKU-001",
  "price": 99.99,
  "amount": 299.97,
  "discount": 30.00,
  "vatBaseAmount": 229.00,
  "currencyCode": "TRY"
}
```

**Alan adı sözlüğü (karışıklığı önlemek için):**

| API alanı          | Tip    | Anlam                                   | DB'de nereye gidiyor          |
|--------------------|--------|-----------------------------------------|-------------------------------|
| `order.id`         | number | Paket ID (Trendyol iç)                  | `orders.trendyolOrderId`      |
| `order.orderNumber`| string | Müşteriye gösterilen sipariş no         | kullanılmıyor (sadece log)    |
| `order.orderDate`  | number | Unix timestamp ms                       | `orders.orderDate`            |
| `order.status`     | string | Paket durumu                            | `orders.status`               |
| `order.grossAmount`| number | Brüt sipariş tutarı (KDV dahil, indirim öncesi) | `orders.grossAmount`  |
| `order.totalDiscount` | number | Toplam indirim                       | `orders.discountAmount`       |
| `line.price`       | number | **Birim** satış fiyatı (KDV dahil)      | `orderItems.salePrice`        |
| `line.amount`      | number | `price × quantity` (brüt kalem tutarı)  | grossAmount fallback hesabı   |
| `line.discount`    | number | Kalem indirimi                          | `orderItems.discount`         |
| `line.commission`  | ❌     | **API'DA YOK** — bkz. Bilinen Eksikler  | `orderItems.commission` = 0   |
| `line.cargoPrice`  | ❌     | **API'DA YOK** — bkz. Bilinen Eksikler  | `orderItems.cargoShare` = 0   |
| `line.barcode`     | string | Barkod — ürünle eşleştirmek için        | `orderItems.productId` join   |
| `line.vatBaseAmount` | number | KDV matrahı                           | kullanılmıyor (şimdilik)      |

> ⚠️ **ESKİ YANLIŞ ALAN ADLARI** (kod içinde artık yok, tipe asla ekleme):
> - `line.salePrice` → doğrusu `line.price`
> - `line.grossAmount` (line seviyesinde) → doğrusu `line.amount`
> - ürün query'de `approved=true` → doğrusu `approval=Approved`

---

### 2. Ürünler

```
GET /integration/product/sellers/{sellerId}/products
```

**Query parametreleri:**

| Parametre | Tip    | Açıklama                             |
|-----------|--------|--------------------------------------|
| page      | int    | Sayfa numarası                       |
| size      | int    | Sayfa başına kayıt (max: 100)        |
| approval  | string | `"Approved"` — sadece onaylı ürünler |

> ⚠️ `approved=true` ÇALIŞMIYOR. Doğrusu `approval=Approved`.

**Ürün objesi:**

```json
{
  "id": "prod-123",
  "barcode": "123456789012",
  "title": "Erkek Slim Fit Gömlek",
  "category": "Giyim",
  "brand": "MyBrand",
  "imageUrl": "https://cdn.trendyol.com/...",
  "price": 99.99,
  "quantity": 50,
  "approvalStatus": "Approved"
}
```

**Alan sözlüğü:**

| API alanı         | DB'de nereye gidiyor          |
|-------------------|-------------------------------|
| `product.id`      | `products.trendyolId`         |
| `product.barcode` | `products.barcode`            |
| `product.title`   | `products.title`              |
| `product.category`| `products.category`           |
| `product.brand`   | `products.brand`              |
| `product.imageUrl`| `products.imageUrl`           |
| `product.price`   | kullanılmıyor (Trendyol fiyatı)|

> `costPrice` (maliyet fiyatı) Trendyol'dan **gelmez**. Kullanıcı ürünler sayfasından elle girer.

---

### 3. İadeler

```
GET /integration/order/sellers/{sellerId}/claims
```

**Query parametreleri:** `startDate`, `endDate`, `page`, `size` (siparişlerle aynı)

**İade objesi:**

```json
{
  "claimId": "CLM-123",
  "claimDate": 1704067200000,
  "claimReason": "Damaged",
  "claimItemStatus": "Created",
  "orderNumber": "123456789",
  "items": [
    {
      "productName": "Erkek Gömlek",
      "barcode": "123456789012",
      "quantity": 1
    }
  ]
}
```

> İadeler şu an sadece sayı olarak sync log'a yazılıyor. İadeler sayfası her görüntülemede API'dan çekiyor.

---

---

## 4. Settlements (Finance API) — Komisyon, Kargo, Hizmet, Stopaj, KDV

```
GET /integration/finance/che/sellers/{sellerId}/settlements
```

> Bu endpoint olmadan kar hesabı yapılamaz. Orders API komisyon/kargo döndürmez.

**Query parametreleri:**

| Parametre | Tip    | Açıklama                              |
|-----------|--------|---------------------------------------|
| startDate | long   | Başlangıç (Unix ms)                   |
| endDate   | long   | Bitiş (Unix ms) — max 15 gün         |
| page      | int    | Sayfa numarası (0'dan)                |
| size      | int    | Sayfa başına kayıt (max: 500)         |

> ⚠️ **Kısıt:** Tek istekte max 15 gün. `sync.ts:syncSettlements()` 15 günlük chunk'larla çağırıyor.

**Response yapısı (sayfalı):**

```json
{
  "totalElements": 450,
  "totalPages": 1,
  "page": 0,
  "size": 500,
  "content": [ /* TrendyolSettlement[] */ ]
}
```

**Settlement objesi — beklenen alanlar:**

```json
{
  "id": 987654,
  "transactionDate": 1704067200000,
  "orderNumber": "123456789",
  "shipmentPackageId": 12345678,
  "transactionType": "Sale",
  "barcode": "123456789012",
  "commissionAmount": -45.00,
  "cargoAmount": -9.99,
  "serviceFee": -1.30,
  "stoppageAmount": -2.00,
  "netKdv": -8.11,
  "sellerRevenue": 148.33,
  "debt": 214.96,
  "credit": 0,
  "paymentOrderId": "PAY-001",
  "paymentDate": 1704240000000
}
```

**Alan sözlüğü:**

| API alanı             | Anlam                                      | DB'de nereye gidiyor          |
|-----------------------|--------------------------------------------|-------------------------------|
| `shipmentPackageId`   | Paket ID — `order.id` ile eşleşir         | `orders.trendyolOrderId` join |
| `transactionType`     | "Sale", "Return", "CommissionNegative" vs. | eşleşme mantığında kullanılır |
| `commissionAmount`    | Trendyol komisyonu (genellikle negatif)    | `orders.commissionAmount`     |
| `cargoAmount`         | Kargo ücreti                               | `orders.cargoAmount`          |
| `serviceFee`          | Hizmet bedeli                              | `orders.serviceFee`           |
| `stoppageAmount`      | Stopaj kesintisi                           | `orders.stoppageAmount`       |
| `netKdv`              | Net KDV                                    | `orders.netKdv`               |
| `sellerRevenue`       | Tüm kesintiler sonrası satıcı geliri       | şimdilik kullanılmıyor        |
| `orderNumber`         | Sipariş no (müşteri görür)                 | matching fallback             |

> ⚠️ **Gerçek alan adları henüz doğrulanmadı.** İlk sync'te konsola `[trendyol] İlk settlement satırı: {...}` logu çıkacak. O logu görünce alan adlarını buraya güncelle.

**Negatif değer uyarısı:**

Trendyol, kesintileri (komisyon, kargo, vb.) **negatif** değer olarak gönderebilir.
`sync.ts:syncSettlements()` mutlak değer almadan topluyor — gerçek veriye göre bunu düzeltmek gerekebilir.
İlk çalıştırmada `[sync:settlements-ozet]` loguna bakarak doğrula.

**transactionType değerleri (bilinen):**

| Değer                 | Anlam                          |
|-----------------------|--------------------------------|
| `Sale`                | Satış                          |
| `Return`              | İade                           |
| `Discount`            | İndirim                        |
| `CommissionNegative`  | Komisyon kesintisi (ayrı satır) |
| `ProvisionPositive`   | Provizyon                      |
| `SellerRevenuePositive` | Satıcı hakediş ödemesi       |

> Bir sipariş için `Sale` + `CommissionNegative` gibi birden fazla settlement satırı gelebilir. `syncSettlements()` tüm satırları `shipmentPackageId` bazında gruplayarak topluyor.

**Kod referansı:**
- Client: `lib/trendyol.ts → getSettlements()`
- Sync: `lib/sync.ts → syncSettlements()`
- Tipler: `types/trendyol.ts → TrendyolSettlement`

---

## Bilinen Eksikler (Orders API'dan gelmeyen veriler)

### Komisyon (`commission`)

❌ **Orders API'nda komisyon bilgisi yok.**

Komisyon yalnızca **Finance/Settlements API**'sından alınabilir:
```
GET /integration/finance/sellers/{sellerId}/transaction-items
```

Şu anki durum: `orderItems.commission = 0`, bu yüzden **kar hesaplamamız komisyon içermiyor** — gerçek kar bu değerden yüksek göründüğü anlamına gelir.

**Geçici çözüm seçenekleri (henüz uygulanmadı):**
1. Settlements API'ını ayrıca sync'le ve komisyon tutarlarını `orders.commissionAmount`'a yaz
2. Kullanıcıdan kategori bazlı komisyon oranı girmesini iste (settings sayfasında)

### Kargo Maliyeti (`cargoPrice`)

❌ **Orders API'nda kalem bazlı kargo maliyeti yok.**

Kargo tutarı öğrenme yolları:
1. Settlements API (yukarıdaki ile aynı endpoint)
2. Manuel giriş (settings sayfasında sabit kargo tutarı)

Şu anki durum: `orderItems.cargoShare = 0`

### Sonuç: Mevcut Kar Hesabı

```
Mevcut kar = Satış Tutarı - İndirim - Ürün Maliyeti
           (Komisyon ve kargo düşülemiyor — veriler eksik)
```

Gerçek kar formülü (CLAUDE.md):
```
Gerçek kar = Satış - Komisyon - Kargo - Hizmet Bedeli - Stopaj - KDV - Maliyet - Ekstra
```

**Bu eksiklik dashboard'daki "Kar > Ciro" durumunu açıklamaktadır.**

---

## Bilinen API Davranışları

### grossAmount Hesabı (sync.ts'de 3 katmanlı fallback)

```typescript
const grossFromAPI    = Number(order.grossAmount) || 0    // 1. öncelik
const grossFromAmount = sum(lines[].amount)               // 2. öncelik
const grossFromPrice  = sum(lines[].price × qty)          // 3. öncelik (en güvenilir)
const grossAmount     = grossFromAPI || grossFromAmount || grossFromPrice
```

> `order.grossAmount` bazen null/0 geliyor. Sebebi araştırılıyor (debug endpoint'i ile takip et).

### ID tipi karışıklığı

`order.id` bazen `number`, bazen `string` geliyor. Her zaman `String(order.id)` ile DB'ye yazılır.

### Pagination

`totalPages: 0` gelebilir (hiç sipariş yoksa). Bu durumu `data.totalPages ?? 0` ile handle ediyoruz.

### Rate Limit

- 1000 istek/dakika
- Max 14 günlük tarih aralığı per sorgu → `sync.ts:MAX_RANGE_MS` ile chunking yapılıyor

---

## Debug

**Canlı API verisini görmek için:**
```
GET /api/trendyol/debug?days=7
```

Bu endpoint:
- Son N günün ilk 5 siparişini çeker (DB'ye yazmaz)
- Her siparişin ham field'larını + hesaplanan değerleri yan yana gösterir
- `grossAmount`'u 3 farklı yöntemle hesaplar (hangisi doğru olduğunu görmek için)
- `commission = 0` ve `cargoPrice = 0` uyarılarını verir
- DB'deki mevcut veri özetini gösterir (kaç sipariş, kaçında gross = 0)

> Sadece development ortamında çalışır (production'da 403 döner).

**Sync sırasında logları grep'lemek için:**
```bash
# Sadece sync loglarını filtrele
pm2 logs | grep "\[sync:"

# Belirli olayları filtrele
pm2 logs | grep "\[sync:uyari"      # sadece uyarılar
pm2 logs | grep "\[sync:ozet\]"     # sadece sync özetleri
pm2 logs | grep "\[sync:ilk-kalem"  # ham API field adlarını görmek için
```

---

## Durum Değerleri

### Sipariş Durumları (`order.status`)

| Değer | Anlam |
|-------|-------|
| `Created` | Oluşturuldu |
| `Picking` | Hazırlanıyor |
| `Invoiced` | Faturalandı |
| `Shipped` | Kargoya verildi |
| `Delivered` | Teslim edildi |
| `UnDelivered` | Teslim edilemedi |
| `Returned` | İade edildi |
| `Cancelled` | İptal edildi |

### İade Durumları (`claimItemStatus`)

| Değer | Anlam |
|-------|-------|
| `Created` | Talep oluşturuldu |
| `Accepted` | Kabul edildi |
| `Rejected` | Reddedildi |

---

## Endpoint Özet Tablosu

| | Siparişler | Ürünler | İadeler |
|---|---|---|---|
| Path | `/integration/order/sellers/{id}/orders` | `/integration/product/sellers/{id}/products` | `/integration/order/sellers/{id}/claims` |
| Max/sayfa | 200 | 100 | 200 |
| Tarih filtresi | Var (max 14 gün) | Yok | Var |
| Komisyon | ❌ Yok | — | — |
| Kargo maliyeti | ❌ Yok | — | — |
| Amaç | Kar hesaplama | Ürün kataloğu + barkod | İade takibi |
