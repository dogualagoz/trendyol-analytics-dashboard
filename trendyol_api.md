# Trendyol Seller API — Referans Doküman

> Bu dosya hem developer referansı hem de Claude'un kod yazarken başvurduğu kaynak.
> Her alan adı değişikliğinde, yeni keşfedilen API davranışında bu dosyayı güncelle.
> **Son güncelleme: 2026-05-04**

---

## Bağlantı Bilgileri

```
Base URL:  https://apigw.trendyol.com
Auth:      Basic <base64(apiKey:apiSecret)>
User-Agent: <sellerId> - SelfIntegration
```

Credentials DB'deki `settings` tablosunda saklanır: `trendyol_api_key`, `trendyol_api_secret`, `trendyol_seller_id`

---

## Endpoint'ler

### 1. Siparişler

```
GET /integration/order/sellers/{sellerId}/orders
```

| Parametre | Açıklama |
|-----------|----------|
| startDate | Başlangıç (Unix ms) |
| endDate   | Bitiş (Unix ms) — **max 14 gün** per sorgu |
| page      | 0'dan başlar |
| size      | max 200 |
| status    | opsiyonel filtre: "Delivered" vs. |

**Gerçek yanıt örneği (2026-05-04 doğrulandı):**

Sipariş üst seviyesi (`lines` hariç):
```json
{
  "id": 3717432760,
  "shipmentPackageId": 3717432760,
  "orderNumber": "11081650568",
  "orderDate": 1774478372765,
  "status": "Delivered",
  "shipmentPackageStatus": "Delivered",
  "grossAmount": 816.36,
  "packageGrossAmount": 816.36,
  "totalDiscount": 57.15,
  "packageSellerDiscount": 57.15,
  "totalTyDiscount": 0,
  "totalPrice": 759.21,
  "currencyCode": "TRY",
  "deliveryType": "normal",
  "deliveryAddressType": "CollectionPoint",
  "cargoProviderName": "Trendyol Express Marketplace",
  "cargoTrackingNumber": 7330031444426443,
  "cargoDeci": 1,
  "fastDelivery": false,
  "commercial": false,
  "isCod": false,
  "warehouseId": 7177029,
  "discountDisplays": [
    { "displayName": "Sepette %7 İndirim", "discountAmount": 57.15 }
  ],
  "packageHistories": [
    { "createdDate": 1774467600134, "status": "Awaiting" },
    { "createdDate": 1774467601904, "status": "Created" },
    { "createdDate": 1774611176000, "status": "Shipped" },
    { "createdDate": 1774858181867, "status": "AtCollectionPoint" },
    { "createdDate": 1774877538000, "status": "Delivered" }
  ],
  "shipmentAddress": { "city": "Antalya", "district": "Kepez", "...": "..." },
  "invoiceAddress":  { "city": "Antalya", "district": "Muratpaşa", "...": "..." },
  "customerFirstName": "Onur",
  "customerLastName": "Burkaç",
  "customerId": 29401393
}
```

Sipariş kalemi (`lines[0]`):
```json
{
  "id": 5324169837,
  "quantity": 1,
  "productName": "Kişiye Özel Duvar Örtüsü ... MDH00246, 150 x 200",
  "productCode": 1306779087,
  "merchantSku": "MDH01800",
  "sku": "MDH01800",
  "stockCode": "MDH01800",
  "barcode": "MDH01800",
  "productSize": "150 x 200",
  "productColor": "Renkli",
  "productCategoryId": 3536,
  "businessUnit": "Home Decoration",
  "currencyCode": "TRY",

  "amount": 816.36,           // ← BRÜT fiyat (indirim öncesi) = order.grossAmount ile aynı
  "lineGrossAmount": 816.36,  // ← amount'un kopyası
  "price": 759.21,            // ← NET fiyat (indirim sonrası) = order.totalPrice ile aynı
  "lineUnitPrice": 759.21,    // ← price'ın kopyası
  "discount": 57.15,
  "lineTotalDiscount": 57.15,
  "lineSellerDiscount": 57.15,
  "tyDiscount": 0,

  "commission": 19,           // ← Komisyon ORANI (%) — tutar = price × qty × 19/100 = 144.25 ₺
  "vatBaseAmount": 10,        // ← KDV matrahı ORANI (%) — TL tutar DEĞİL
  "vatRate": 10,
  // cargoPrice alanı MEVCUT DEĞİL — Settlements API'dan geliyor

  "salesCampaignId": 61,
  "orderLineItemStatusName": "Delivered",
  "discountDetails": [
    {
      "lineItemPrice": 759.21,
      "lineItemDiscount": 57.15,
      "lineItemSellerDiscount": 57.15,
      "lineItemTyDiscount": 0
    }
  ]
}
```

**Alan sözlüğü:**

| API alanı | Anlam | DB |
|---|---|---|
| `order.id` | Paket ID — `shipmentPackageId` ile aynı | `orders.trendyolOrderId` |
| `order.grossAmount` | Brüt tutar — indirim öncesi | `orders.grossAmount` |
| `order.totalDiscount` | Toplam indirim | `orders.discountAmount` |
| `order.totalPrice` | Net tutar — indirim sonrası | kullanılmıyor |
| `line.price` | **NET** kalem fiyatı (indirim sonrası) | `orderItems.salePrice` |
| `line.amount` | Brüt kalem tutarı (indirim öncesi) | grossAmount fallback |
| `line.commission` | Komisyon **ORANI** (%) — `price × qty × rate/100` ile tutara çevir | `orderItems.commission` |
| `line.vatBaseAmount` | KDV matrahı **ORANI** (%) — TL tutar değil | kullanılmıyor |
| `line.cargoPrice` | ❌ **ALAN YOK** | `orderItems.cargoShare` = 0 |
| `line.barcode` | = `merchantSku` = `sku` = `stockCode` | ürün eşleştirme |

> `order.id` bazen `number` bazen `string` geliyor — her zaman `String(order.id)` ile kaydet.
> `line.salePrice` yok → doğrusu `line.price`. `approved=true` çalışmıyor → `approval=Approved`.

---

### 2. Ürünler

```
GET /integration/product/sellers/{sellerId}/products
```

| Parametre | Açıklama |
|-----------|----------|
| page | 0'dan başlar |
| size | max 100 |
| approval | `"Approved"` — `approved=true` ❌ çalışmıyor |

**Alan sözlüğü:**

| API alanı | DB |
|---|---|
| `product.id` | `products.trendyolId` |
| `product.barcode` | `products.barcode` |
| `product.title` | `products.title` |
| `product.category` | `products.category` |
| `product.brand` | `products.brand` |
| `product.imageUrl` | `products.imageUrl` |

> `costPrice` Trendyol'dan **gelmez** — kullanıcı ürünler sayfasından elle girer.

---

### 3. İadeler

```
GET /integration/order/sellers/{sellerId}/claims
```

Query: `startDate`, `endDate`, `page`, `size` (siparişlerle aynı)

```json
{
  "claimId": "CLM-123",
  "claimDate": 1704067200000,
  "claimReason": "Damaged",
  "claimItemStatus": "Created",
  "orderNumber": "123456789",
  "items": [{ "productName": "...", "barcode": "...", "quantity": 1 }]
}
```

---

### 4. Settlements (Finance API)

```
GET /integration/finance/sellers/{sellerId}/settlements
```

| Parametre | Açıklama |
|-----------|----------|
| startDate | Başlangıç (Unix ms) |
| endDate | Bitiş (Unix ms) — **max 15 gün** per sorgu |
| page | 0'dan başlar |
| size | max 500 |

**Alan sözlüğü:**

| API alanı | Anlam | DB |
|---|---|---|
| `shipmentPackageId` | `order.id` ile eşleşir — join anahtarı | `orders.trendyolOrderId` |
| `commissionAmount` | Komisyon tutarı (negatif gelebilir) | `orders.commissionAmount` |
| `cargoAmount` | Kargo ücreti | `orders.cargoAmount` |
| `serviceFee` | Hizmet bedeli | `orders.serviceFee` |
| `stoppageAmount` | Stopaj | `orders.stoppageAmount` |
| `netKdv` | Net KDV | `orders.netKdv` |

> ⚠️ Değerler negatif gelebilir. İlk sync'te `[trendyol] İlk settlement satırı:` logunu kontrol et.
> 556 hatası → Finance API yetkisi kapalı, Trendyol desteğiyle etkinleştir.
> Bir paket için birden fazla satır (`Sale` + `CommissionNegative`) gelebilir — sync `shipmentPackageId` bazında gruplayarak topluyor.

**transactionType değerleri:**

| Değer | Anlam |
|---|---|
| `Sale` | Satış |
| `Return` | İade |
| `CommissionNegative` | Komisyon kesintisi |
| `Discount` | İndirim |
| `SellerRevenuePositive` | Satıcı hakediş ödemesi |

---

## Kargo Maliyeti

`cargoPrice` Orders API'da yok. Kullanılan öncelik sırası:

1. **Settlements API** — gerçek fatura tutarı (en doğru)
2. **Kargo baremi** — ayarlardan `cargo_tier_1/2/3`; `grossAmount`'a göre tier seçilip `calculateCargoWithKdv()` ile KDV (%20) eklenerek hesaplanır

---

## Durum Değerleri

**Sipariş akışı:** `Awaiting` → `Created` → `Shipped` → `AtCollectionPoint` → `Delivered`
**Diğerleri:** `UnDelivered`, `Returned`, `Cancelled`

**İade:** `Created` → `Accepted` / `Rejected`
