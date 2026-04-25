# Trendyol Analytics Dashboard — CLAUDE.md

## Proje Özeti

Trendyol satıcıları için gelir, gider, kar ve ürün metriklerini görselleştiren analitik dashboard uygulaması. Trendyol Seller API'ından veri çekip kendi veritabanında saklayan, satıcıya ürün maliyet girişi ve fiyatlandırma hesaplama imkânı sunan tek kullanıcılı (genişletilebilir) web uygulaması.

Referans ürün: [Melontik](https://melontik.com/dashboard) — benzer özellik seti hedefleniyor.

---

## Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Veritabanı | PostgreSQL |
| ORM | Prisma |
| UI Bileşenleri | shadcn/ui + Tailwind CSS |
| Grafikler | Recharts |
| Auth | NextAuth.js (credentials provider) |
| Form Validasyon | Zod |
| Process Yönetimi (prod) | PM2 |
| Hosting | VPS + Plesk (Node.js app) |

---

## Mimari

### Klasör Yapısı

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/               # Giriş sayfası
│   ├── (dashboard)/             # Korumalı sayfalar (layout ile auth kontrolü)
│   │   ├── page.tsx             # Ana dashboard
│   │   ├── urunler/             # Ürün listesi ve maliyet girişi
│   │   ├── siparisler/          # Sipariş listesi
│   │   ├── iadeler/             # İade metrikleri
│   │   ├── fiyatlandirma/       # Fiyat hesaplayıcı
│   │   ├── raporlar/            # Karlılık raporları ve analizler
│   │   ├── canli/               # Canlı performans (bugünkü kar)
│   │   └── ayarlar/             # API credentials, genel ayarlar
│   └── api/
│       ├── auth/                # NextAuth endpoint
│       ├── trendyol/            # Trendyol API proxy (key güvenliği)
│       ├── urunler/             # Ürün CRUD
│       ├── siparisler/          # Sipariş sorguları
│       └── sync/                # Veri senkronizasyon tetikleyici
├── components/
│   ├── ui/                      # shadcn bileşenleri (dokunma)
│   ├── charts/                  # Recharts sarmalayıcılar
│   ├── dashboard/               # Dashboard'a özel bileşenler
│   ├── products/                # Ürün bileşenleri
│   └── layout/                  # Sidebar, Navbar, sayfa iskeletleri
├── lib/
│   ├── db.ts                    # Prisma client singleton
│   ├── trendyol.ts              # Trendyol API client
│   ├── calculations.ts          # Kar hesaplama formülleri
│   └── utils.ts                 # Genel yardımcılar (cn, para formatı vs.)
└── types/
    ├── trendyol.ts              # Trendyol API response tipleri
    └── index.ts                 # Uygulama geneli tipler
```

### Katman Kuralları

- `app/api/` → İnce: istek parse et, lib fonksiyonunu çağır, cevap dön
- `lib/` → İş mantığı ve hesaplamalar buraya girer
- Prisma client doğrudan kullanılır; repository pattern eklenmez
- Trendyol API key'leri asla client'a çıkmaz, her zaman `app/api/` üzerinden proxy'lenir

---

## Veritabanı Şeması (Ana Tablolar)

```
products
  id, trendyol_id, title, barcode, image_url
  cost_price          ← satıcının girdiği maliyet (TL)
  category, brand
  created_at, updated_at

orders
  id, trendyol_order_id, order_date, status
  gross_amount        ← brüt satış tutarı
  discount_amount     ← indirim
  commission_amount   ← komisyon
  cargo_amount        ← kargo maliyeti
  service_fee         ← hizmet bedeli
  stoppage_amount     ← stopaj kesintisi
  net_kdv             ← net KDV
  extra_cost          ← ekstra maliyet

order_items
  id, order_id, product_id
  quantity, sale_price, discount, commission, cargo_share
  profit              ← hesaplanmış kar (upsert sırasında saklanır)

settings
  id, key, value      ← API credentials, sync interval vs.

sync_logs
  id, synced_at, records_fetched, status, error_message
```

### Kar Hesaplama Formülü

```
Kar = Satış Tutarı - Komisyon - Kargo Payı - Hizmet Bedeli - Stopaj - Net KDV - Ürün Maliyeti - Ekstra Maliyet
```

---

## Özellikler (Modüller)

### Dashboard (Ana Sayfa)
- Toplam Ciro
- Maliyeti Olan Ciro
- Kâr Tutarı
- Kâr / Satış Fiyatı Oranı
- Kâr / Ürün Maliyeti Oranı
- Maliyet Dağılımı (donut/halka grafiği): Ürün Maliyeti, Komisyon, Kargo, Hizmet Bedeli, Uluslararası Hizmet, Operasyon, Stopaj, KDV, Ekstra
- Kâr Performansı (çizgi grafiği, tarih aralığına göre)
- Ürün Metrikleri: Net satış adedi, ürün başına satış tutarı, ürün başına ort. kar, ürün başına ort. kargo maliyeti, ort. komisyon oranı, ort. indirim oranı
- Sipariş Metrikleri: sipariş sayısı, sipariş başına satış tutarı, sipariş başına ort. kar, sipariş başına ort. kargo maliyeti
- Filtre: Tarih aralığı, Ülke/Bölge seçimi

### Ürünler
- Trendyol'dan çekilen ürün listesi
- Her ürün için maliyet fiyatı girişi
- CSV ile toplu maliyet import
- Ürün bazlı karlılık görünümü

### Siparişler
- Sipariş listesi (filtrelenebilir, sıralanabilir)
- Sipariş detay: her kalem için kar dökümü

### İadeler
- İade adedi, tutarı, oranı
- İade edilen ürün listesi

### Fiyatlandırma Hesaplayıcı (Melontik benzeri)
- Girdi: Ürün maliyeti, Teslimat tipi, İstenilen kar oranı/tutarı, Kargo ücreti, Desi, KDV oranı, Kategori, Komisyon oranı
- Çıktı: Önerilen satış fiyatı

### Canlı Performans
- Bugünkü satış, kar, sipariş sayısı (son sync verisiyle)
- Dünle karşılaştırma

### Raporlar
- Aylık/haftalık karlılık analizi
- Ürün bazlı karlılık sıralaması
- Excel/CSV export

### Ayarlar
- Trendyol API Key, API Secret, Seller ID girişi
- Sync aralığı (varsayılan: 30 dakika)
- Dashboard şifre değiştirme

---

## Trendyol API

- **Base URL:** `https://apigw.trendyol.com`
- **Auth:** Basic Authentication (Seller ID + API Key + API Secret)
- **Rate limit:** 50 istek / 10 saniye / endpoint
- **Ortamlar:** PROD ve STAGE (ayrı credentials)
- **Kullanılan endpoint'ler:**
  - `GET /sapigw/suppliers/{sellerId}/orders` — siparişler
  - `GET /sapigw/suppliers/{sellerId}/products` — ürünler
  - `GET /sapigw/suppliers/{sellerId}/claims` — iadeler

### Veri Senkronizasyonu
- Otomatik sync: 30 dakikada bir (ayarlardan değiştirilebilir)
- Manuel sync: Dashboard'daki "Verileri Güncelle" butonu
- Sync mantığı: Son sync tarihinden itibaren yeni siparişler çekilir (delta sync)

---

## Auth

- NextAuth.js credentials provider (kullanıcı adı + şifre)
- Şifre hash'li saklanır (bcrypt)
- Session tabanlı, cookie ile
- Tüm `/dashboard` route'ları middleware ile korunur
- Gelecekte: çoklu kullanıcı, rol bazlı yetkilendirme için genişletilebilir yapı

---

## Geliştirme Prensipleri

- Over-engineering yapma; sade ama düzenli tut
- Her route handler ince olmalı, iş mantığı `lib/` içinde
- TypeScript strict mode açık
- Zod ile tüm API input'ları validate edilmeli
- `any` kullanma; Trendyol response tipleri `types/trendyol.ts`'de tanımlanmalı
- Türkçe arayüz, İngilizce kod (değişken/fonksiyon isimleri İngilizce)
- Responsive tasarım (mobil uyumlu)
- shadcn bileşenlerini `components/ui/` dışında değiştirme

---

## Deployment (VPS + Plesk)

```bash
npm run build
npm run start   # veya PM2 ile: pm2 start npm --name "trendyol-dashboard" -- start
```

- PostgreSQL VPS üzerinde kurulu
- Environment variables: `.env.local` (geliştirme), Plesk env panel (production)
- Port: 3000 (Plesk reverse proxy ile domain'e bağlanır)

### Gerekli Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
TRENDYOL_API_KEY=...
TRENDYOL_API_SECRET=...
TRENDYOL_SELLER_ID=...
DASHBOARD_PASSWORD=...
```

---

## Geliştirme Sırası (Yol Haritası)

1. Proje kurulumu (Next.js + Prisma + shadcn + NextAuth)
2. DB şeması + migration
3. Trendyol API client + sync mekanizması
4. Layout (sidebar, navbar)
5. Ana dashboard sayfası (KPI kartları + grafikler)
6. Ürün sayfası (liste + maliyet girişi)
7. Sipariş sayfası
8. Fiyatlandırma hesaplayıcı
9. İade metrikleri
10. Canlı performans
11. Raporlar + export
12. Ayarlar sayfası
