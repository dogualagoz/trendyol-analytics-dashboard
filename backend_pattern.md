# Backend → Frontend Bağlama Planı

## Tekrarlayan Pattern (Her Özellik İçin)

```
1. lib/ fonksiyonu   →  iş mantığı, DB sorgusu
2. API route         →  ince kapı, lib'i çağırır, JSON döner
3. Frontend sayfası  →  API'ı çağırır, veriyi gösterir
```

---

## Tüm Adımlar (Sırasıyla)

### Altyapı (Tek Seferlik) ✅
- [x] Prisma şeması yaz (`schema.prisma`)
- [x] Migration çalıştır (`prisma migrate dev`)
- [x] `lib/db.ts` — Prisma singleton

---

### 1. Ayarlar Modülü
> Kullanıcı Trendyol API bilgilerini buradan girer. Diğer her şey buna bağlı.

- [x] `lib/settings.ts` — `getSetting`, `setSetting` fonksiyonları
- [x] `app/api/settings/route.ts` — GET (oku) + POST (kaydet)
- [x] `app/(dashboard)/settings/page.tsx` — form sayfası (API Key, Secret, Seller ID)

---

### 2. Trendyol API Client
> Trendyol'a istek atan merkezi modül. Credentials'ı settings'ten okur.

- [ ] `lib/trendyol.ts` — `getOrders()`, `getProducts()`, `getClaims()` fonksiyonları
- [ ] `types/trendyol.ts` — API response tipleri

---

### 3. Sync Modülü
> Trendyol'dan çekilen veriyi veritabanına yazar.

- [ ] `lib/sync.ts` — siparişleri + ürünleri çekip DB'ye upsert eden fonksiyon
- [ ] `app/api/sync/route.ts` — POST (tetikleyici), dashboard'daki "Güncelle" butonu bunu çağırır
- [ ] `lib/calculations.ts` — kar formülü (sync sırasında `profit` hesaplanır)

---

### 4. Dashboard Metrikleri
> Mock veriyi gerçek DB sorgularıyla değiştir.

- [ ] `lib/dashboard.ts` — `getSummaryMetrics()`, `getProfitPerformance()`, `getCostDistribution()` fonksiyonları
- [ ] `app/api/dashboard/route.ts` — GET (metrikleri döner)
- [ ] `app/(dashboard)/page.tsx` güncelle — mock import'ları sil, API'dan çek

---

### 5. Ürünler Modülü
> Ürün listesi + kullanıcının maliyet fiyatı girmesi.

- [ ] `lib/products.ts` — `getProducts()`, `updateCostPrice()` fonksiyonları
- [ ] `app/api/products/route.ts` — GET (liste)
- [ ] `app/api/products/[id]/route.ts` — PATCH (maliyet güncelle)
- [ ] `app/(dashboard)/products/page.tsx` — tablo + maliyet giriş formu

---

### 6. Siparişler Modülü
> Sipariş listesi ve kar dökümü.

- [ ] `lib/orders.ts` — `getOrders()`, `getOrderDetail()` fonksiyonları
- [ ] `app/api/orders/route.ts` — GET (liste, filtreli)
- [ ] `app/api/orders/[id]/route.ts` — GET (detay)
- [ ] `app/(dashboard)/orders/page.tsx` — tablo
- [ ] `app/(dashboard)/orders/[id]/page.tsx` — detay sayfası

---

### 7. İadeler Modülü

- [ ] `lib/returns.ts` — `getReturns()` fonksiyonu
- [ ] `app/api/returns/route.ts` — GET
- [ ] `app/(dashboard)/returns/page.tsx` — metrikler + liste

---

### 8. Fiyatlandırma Hesaplayıcı
> Veritabanı yok, sadece hesaplama mantığı.

- [ ] `lib/pricing.ts` — `calculateSuggestedPrice()` fonksiyonu
- [ ] `app/api/pricing/route.ts` — POST (girdi alır, fiyat döner)
- [ ] `app/(dashboard)/pricing/page.tsx` — form + sonuç

---

### 9. Canlı Performans

- [ ] `lib/live.ts` — bugünkü siparişleri filtrele
- [ ] `app/api/live/route.ts` — GET
- [ ] `app/(dashboard)/live/page.tsx` — bugünkü kar, satış, sipariş

---

### 10. Raporlar

- [ ] `lib/reports.ts` — aylık/haftalık gruplama sorguları
- [ ] `app/api/reports/route.ts` — GET (tarih aralığı parametreli)
- [ ] `app/(dashboard)/reports/page.tsx` — grafikler + CSV export

---

## Özet: Her Modül 3 Dosya

| Katman | Dosya | Görev |
|---|---|---|
| lib/ | `lib/xxx.ts` | DB sorgusu, iş mantığı |
| API | `app/api/xxx/route.ts` | HTTP endpoint, ince kapı |
| UI | `app/(dashboard)/xxx/page.tsx` | Veriyi göster |

---

## Şu An Neredeyiz

Ayarlar modülünün 1. adımı bitti (`lib/settings.ts`).
Sıradaki: `app/api/settings/route.ts`
