# Trendyol Seller API — Özet

## Bağlantı Bilgileri

```
Base URL:  https://apigw.trendyol.com
Auth tipi: Basic Authentication
```

### Authentication Nasıl Çalışır?

Her istekte header'a şunu eklemen gerekiyor:

```
Authorization: Basic <base64(apiKey:apiSecret)>
User-Agent:    <sellerId> - SelfIntegration
```

`base64(apiKey:apiSecret)` → API Key ve Secret'ı birleştirip şifreliyorsun:
```
"abc123:xyz789"  →  base64  →  "YWJjMTIzOnh5ejc4OQ=="
```

Node.js'te:
```typescript
const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
// Authorization: `Basic ${token}`
```

---

## Kullandığımız 3 Endpoint

### 1. Siparişler
```
GET /integration/order/sellers/{sellerId}/orders
```

**Göndereceğimiz parametreler:**
| Parametre | Açıklama | Örnek |
|---|---|---|
| startDate | Başlangıç tarihi (milisaniye) | 1704067200000 |
| endDate | Bitiş tarihi (milisaniye) | 1704153600000 |
| page | Sayfa numarası (0'dan başlar) | 0 |
| size | Sayfa başına kayıt (max 200) | 200 |
| status | Durum filtresi (opsiyonel) | "Delivered" |

**Gelecek olan veri (response):**
```json
{
  "totalElements": 312,
  "totalPages": 2,
  "page": 0,
  "size": 200,
  "content": [
    {
      "id": "PKG-123",
      "orderNumber": "123456789",
      "orderDate": 1704067200000,
      "status": "Delivered",
      "lines": [
        {
          "quantity": 2,
          "productName": "Erkek Gömlek",
          "barcode": "123456789012",
          "salePrice": 99.99,
          "discount": 10.00,
          "commission": 15.00,
          "cargoPrice": 5.00,
          "grossAmount": 189.98
        }
      ]
    }
  ]
}
```

**Bizim için önemli alanlar:**
- `orderNumber` → trendyolOrderId olarak kaydediyoruz
- `orderDate` → sipariş tarihi
- `status` → sipariş durumu
- `lines[].salePrice` → satış fiyatı
- `lines[].discount` → indirim
- `lines[].commission` → komisyon
- `lines[].cargoPrice` → kargo payı
- `lines[].grossAmount` → brüt tutar

---

### 2. Ürünler
```
GET /integration/product/sellers/{sellerId}/products
```

**Göndereceğimiz parametreler:**
| Parametre | Açıklama |
|---|---|
| page | Sayfa numarası |
| size | Sayfa başına kayıt (max 100) |
| approved | Onaylı ürünleri getir |

**Gelecek olan veri:**
```json
{
  "totalElements": 85,
  "totalPages": 1,
  "content": [
    {
      "id": "prod-123",
      "barcode": "123456789012",
      "title": "Erkek Slim Fit Gömlek",
      "category": "Giyim",
      "brand": "MyBrand",
      "imageUrl": "https://...",
      "price": 99.99,
      "quantity": 50,
      "approvalStatus": "Approved"
    }
  ]
}
```

**Bizim için önemli alanlar:**
- `id` → trendyolId olarak kaydediyoruz
- `barcode` → barkod
- `title` → ürün adı
- `category` → kategori
- `brand` → marka
- `imageUrl` → ürün görseli

> Not: `costPrice` (maliyet fiyatı) Trendyol'dan **gelmez**. Bunu kullanıcı kendisi girer.

---

### 3. İadeler
```
GET /integration/order/sellers/{sellerId}/claims
```

**Gelecek olan veri:**
```json
{
  "totalElements": 12,
  "content": [
    {
      "claimId": "CLM-123",
      "claimDate": 1704067200000,
      "claimReason": "Damaged",
      "claimItemStatus": "Accepted",
      "orderNumber": "123456789",
      "items": [
        {
          "productName": "Erkek Gömlek",
          "quantity": 1
        }
      ]
    }
  ]
}
```

---

## Önemli Notlar

### Tarih Formatı
Trendyol tarihleri **Unix timestamp milisaniye** olarak gönderir ve bekler.

```typescript
// Bugünün başlangıcını milisaniyeye çevirmek:
const startDate = new Date().setHours(0, 0, 0, 0)  // → 1704067200000

// Gelen tarihi okunabilir hale getirmek:
new Date(1704067200000)  // → Mon Jan 01 2024
```

### Sayfalama (Pagination)
API aynı anda max 200 sipariş döner. Toplam 500 siparişin varsa:

```
Sayfa 0 → 200 sipariş
Sayfa 1 → 200 sipariş
Sayfa 2 → 100 sipariş  (toplam 500)
```

Tüm veriyi çekmek için `totalPages` kadar döngü kurmamız gerekiyor.

### Rate Limit
- 1000 istek / dakika
- Maksimum 2 haftalık tarih aralığı per sorgu
- Bu yüzden delta sync yapıyoruz: her seferinde sadece son sync'ten beri gelen siparişleri çekiyoruz

---

## Endpoint Karşılaştırma Tablosu

| | Siparişler | Ürünler | İadeler |
|---|---|---|---|
| Path | `/integration/order/sellers/{id}/orders` | `/integration/product/sellers/{id}/products` | `/integration/order/sellers/{id}/claims` |
| Max kayıt | 200/sayfa | 100/sayfa | 200/sayfa |
| Tarih filtresi | Var | Yok | Var |
| Bizim kullanım amacı | Kar hesaplama | Ürün kataloğu | İade takibi |
