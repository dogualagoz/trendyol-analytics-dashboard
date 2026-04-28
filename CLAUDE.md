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

> Yeni shadcn bileşeni eklemek için: `npx shadcn-ui@latest add <bileşen-adı>`

---

## Mimari

### 4 Katmanlı Yapı

Proje katmanlı mimari kullanır. Her katmanın tek bir sorumluluğu vardır ve her katman yalnızca bir alt katmanla konuşur.

```
┌─────────────────────────────┐
│  UI Katmanı                 │  app/(dashboard)/**
│  Sadece gösterir            │
├─────────────────────────────┤
│  API Katmanı                │  app/api/**
│  Sadece HTTP'yi yönetir     │
├─────────────────────────────┤
│  Service Katmanı            │  lib/**
│  İş mantığı ve DB sorguları │
├─────────────────────────────┤
│  DB Katmanı                 │  PostgreSQL + Prisma
│  Sadece veri saklar         │
└─────────────────────────────┘
```

**Veri akışı:** UI → API → Service → DB (her zaman bu yönde)

**Katman kuralları:**
- `app/api/` → ince tutar: body parse et, service fonksiyonunu çağır, JSON dön
- `lib/` → iş mantığı buraya girer; HTTP ve UI'dan habersizdir
- Prisma client doğrudan kullanılır; repository pattern eklenmez
- Trendyol API key'leri asla client'a çıkmaz, her zaman `app/api/` üzerinden proxy'lenir

### Her Modül 3 Dosya

| Katman | Dosya | Görev |
|---|---|---|
| Service | `lib/xxx.ts` | DB sorgusu, hesaplama |
| API | `app/api/xxx/route.ts` | HTTP endpoint |
| UI | `app/(dashboard)/xxx/page.tsx` | Sayfayı göster |

### Klasör Yapısı

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/               # Giriş sayfası
│   ├── (dashboard)/             # Korumalı sayfalar — layout ile sidebar+navbar+auth gelir
│   │   ├── layout.tsx           # Sidebar + navbar + auth kontrolü
│   │   ├── page.tsx             # Ana dashboard
│   │   ├── products/            # Ürün listesi ve maliyet girişi
│   │   ├── orders/              # Sipariş listesi
│   │   ├── returns/             # İade metrikleri
│   │   ├── pricing/             # Fiyat hesaplayıcı
│   │   ├── reports/             # Karlılık raporları ve analizler
│   │   ├── live/                # Canlı performans (bugünkü kar)
│   │   └── settings/            # API credentials, genel ayarlar
│   └── api/
│       ├── auth/                # NextAuth endpoint
│       ├── products/            # Ürün CRUD
│       ├── orders/              # Sipariş sorguları
│       ├── returns/             # İade sorguları
│       ├── settings/            # Ayar okuma/yazma
│       ├── sync/                # Veri senkronizasyon tetikleyici
│       └── trendyol/            # Trendyol API proxy (key güvenliği)
├── components/
│   ├── ui/                      # shadcn bileşenleri — dokunma
│   ├── charts/                  # Recharts sarmalayıcılar
│   ├── dashboard/               # Dashboard'a özel bileşenler
│   ├── products/                # Ürün bileşenleri
│   └── layout/                  # Sidebar, Navbar
├── lib/
│   ├── db.ts                    # Prisma client singleton
│   ├── auth.ts                  # NextAuth config
│   ├── utils.ts                 # Genel yardımcılar (cn, para formatı vs.)
│   ├── settings.ts              # Ayar okuma/yazma (getSetting, setSetting)
│   ├── trendyol.ts              # Trendyol API client
│   ├── calculations.ts          # Kar hesaplama formülleri
│   ├── sync.ts                  # Senkronizasyon mantığı
│   ├── dashboard.ts             # Dashboard metrik sorguları
│   ├── products.ts              # Ürün sorguları
│   ├── orders.ts                # Sipariş sorguları
│   └── mock/                    # Mock veriler — gerçek API bağlanana kadar kullanılır
│       ├── dashboard.ts
│       ├── orders.ts
│       └── products.ts
└── types/
    ├── trendyol.ts              # Trendyol API response tipleri
    └── index.ts                 # Uygulama geneli tipler
```

### Server vs Client Component Kuralı

- Varsayılan: her bileşen **Server Component**'tir (`'use client'` yazılmaz)
- `'use client'` yalnızca şu durumlarda eklenir:
  - `useState`, `useEffect`, `useCallback` gibi React hook kullanılıyorsa
  - `onClick`, `onChange` gibi event handler varsa
  - Browser-only API'ye erişiliyorsa (localStorage, window vb.)
- Kural: Server Component'ten Client Component'e veri prop olarak geçilir, tersi olmaz
- Grafik bileşenleri (Recharts) `'use client'` gerektirir

### Prisma Client

- Output yolu: `src/generated/prisma`
- Import: `import { PrismaClient } from '@/generated/prisma/client'`
- `lib/db.ts` singleton pattern ile global instance yönetir

---

## Veritabanı Şeması (Ana Tablolar)

```
products
  id, trendyolId, title, barcode, imageUrl
  costPrice           ← satıcının girdiği maliyet (TL) — Trendyol'dan gelmez
  category, brand
  createdAt, updatedAt

orders
  id, trendyolOrderId, orderDate, status
  grossAmount         ← brüt satış tutarı
  discountAmount      ← indirim
  commissionAmount    ← komisyon
  cargoAmount         ← kargo maliyeti
  serviceFee          ← hizmet bedeli
  stoppageAmount      ← stopaj kesintisi
  netKdv              ← net KDV
  extraCost           ← ekstra maliyet

orderItems
  id, orderId, productId
  quantity, salePrice, discount, commission, cargoShare
  profit              ← hesaplanmış kar (sync sırasında saklanır)

settings
  id, key, value      ← API credentials, sync interval vs.

syncLogs
  id, syncedAt, recordsFetched, status, errorMessage
```

### Kar Hesaplama Formülü

```
Kar = Satış Tutarı - Komisyon - Kargo Payı - Hizmet Bedeli - Stopaj - Net KDV - Ürün Maliyeti - Ekstra Maliyet
```

---

## Özellikler (Modüller)

### Dashboard (Ana Sayfa)
- Toplam Ciro, Net Kar, Sipariş Sayısı, Kar/Satış Oranı
- Maliyet Dağılımı (donut grafik): Ürün Maliyeti, Komisyon, Kargo, Hizmet Bedeli, Stopaj, KDV, Ekstra
- Kâr Performansı (çizgi grafik, tarih aralığına göre)
- En iyi performans gösteren ürünler tablosu
- Filtre: Tarih aralığı

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

### Fiyatlandırma Hesaplayıcı
- Girdi: Ürün maliyeti, teslimat tipi, istenilen kar oranı, kargo, KDV, komisyon oranı
- Çıktı: Önerilen satış fiyatı

### Canlı Performans
- Bugünkü satış, kar, sipariş sayısı
- Dünle karşılaştırma

### Raporlar
- Aylık/haftalık karlılık analizi
- Ürün bazlı karlılık sıralaması
- Excel/CSV export

### Ayarlar
- Trendyol API Key, API Secret, Seller ID girişi
- Sync aralığı (varsayılan: 30 dakika)

---

## Trendyol API

- **Base URL:** `https://apigw.trendyol.com`
- **Auth:** Basic Authentication — `Base64(apiKey:apiSecret)`
- **Rate limit:** 1000 istek / dakika, maks 2 haftalık tarih aralığı
- **Kullanılan endpoint'ler:**
  - `GET /integration/order/sellers/{sellerId}/orders` — siparişler
  - `GET /integration/product/sellers/{sellerId}/products` — ürünler
  - `GET /integration/order/sellers/{sellerId}/claims` — iadeler

### Veri Senkronizasyonu
- Otomatik sync: 30 dakikada bir (ayarlardan değiştirilebilir)
- Manuel sync: Dashboard'daki "Güncelle" butonu
- Sync mantığı: Son sync tarihinden itibaren yeni siparişler çekilir (delta sync)

---

## Auth

- NextAuth.js credentials provider (kullanıcı adı + şifre)
- Şifre hash'li saklanır (bcrypt)
- Session tabanlı, cookie ile
- Tüm `(dashboard)` route'ları middleware ile korunur

---

## Tasarım Sistemi

- **Font:** Inter (tüm ağırlıklar)
- **Primary:** `#984700` (Trendyol turuncu koyu) — aktif nav yazısı
- **Accent/CTA:** `#F27A1A` (Trendyol turuncu) — buton, aktif nav sol çizgisi, vurgu
- **Background:** `#F9F9F9`
- **Card:** beyaz zemin, `1rem` border-radius, `1px` `#E2E2E2` border, `0px 4px 20px rgba(0,0,0,0.04)` shadow
- **Sidebar zemini:** `#FFFFFF`
- **Sidebar aktif item:** sol `3px #F27A1A` çizgi + `orange-50` arka plan + `#984700` koyu turuncu metin
- **Sidebar pasif item:** `#574236` metin, hover'da `gray-50`
- **Data viz paleti:** Teal `#00D1FF`, Violet `#7C3AED`, Soft Orange `#FF7F5D`
- **Spacing ritmi:** 4px base, kartlar arası `24px` gutter, iç padding `24px`

### Sidebar Kuralı
```
Aktif:  border-l-[3px] border-[#F27A1A] bg-orange-50 text-[#984700] font-semibold pl-[13px]
Pasif:  text-[#574236] pl-4
```

### Navbar Kuralı
3 bölüm: sol başlık | orta arama kutusu | sağ aksiyonlar (zil + grid + avatar)

---

## Geliştirme Prensipleri

- Over-engineering yapma; sade ama düzenli tut
- Her route handler ince olmalı, iş mantığı `lib/` içinde
- TypeScript strict mode açık
- `any` kullanma; Trendyol response tipleri `types/trendyol.ts`'de tanımlanmalı
- Türkçe arayüz, İngilizce kod (değişken/fonksiyon/klasör isimleri İngilizce)
- Responsive tasarım (mobil uyumlu)
- shadcn bileşenlerini `components/ui/` dışında değiştirme

### Geliştirme Döngüsü (Olgun Aşama)

```
1. Service  →  lib/xxx.ts          (DB sorgusu, iş mantığı)
2. API      →  app/api/xxx/route.ts (HTTP endpoint)
3. UI       →  app/(dashboard)/xxx/page.tsx (sayfa)
4. Bağla    →  Mock veriyi sil, gerçek API'a çek
```

- Bir özellik tamamlanmadan bir sonrakine geçilmez
- Altyapı değişiklikleri (migration, yeni bağımlılık) döngünün dışında ayrıca yapılır

---

## Deployment (VPS + Plesk)

```bash
npm run build
npm run start   # veya: pm2 start npm --name "trendyol-dashboard" -- start
```

### Gerekli Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
DASHBOARD_PASSWORD=...
```

---

## Mevcut Durum

**Şu an: Backend → Frontend bağlama aşaması**

### Tamamlananlar ✅
- Proje kurulumu (Next.js 14 + TypeScript + Tailwind + Prisma + NextAuth + Recharts + shadcn/ui)
- DB şeması + Prisma migration (20260427214915_init)
- `lib/db.ts` — Prisma singleton
- `lib/auth.ts` — NextAuth config
- Layout: sidebar + navbar (`components/layout/`)
- Auth: login sayfası + middleware
- Dashboard ana sayfası (mock veriyle)
- Grafik bileşenleri: ProfitChart, CostDistributionChart
- **Ayarlar modülü:**
  - `lib/settings.ts` — getSetting, setSetting
  - `app/api/settings/route.ts` — GET + POST
  - `app/(dashboard)/settings/page.tsx` — form sayfası

### Sıradaki Adımlar
- [ ] `lib/trendyol.ts` — Trendyol API client
- [ ] `types/trendyol.ts` — API response tipleri
- [ ] `lib/calculations.ts` — kar formülü
- [ ] `lib/sync.ts` — senkronizasyon mantığı
- [ ] `app/api/sync/route.ts` — sync tetikleyici
- [ ] `lib/dashboard.ts` — gerçek metrik sorguları
- [ ] `app/api/dashboard/route.ts` — dashboard endpoint
- [ ] Dashboard sayfasını mock'tan gerçeğe bağla
- [ ] Ürünler modülü (service + api + ui)
- [ ] Siparişler modülü (service + api + ui)
- [ ] İadeler, Fiyatlandırma, Canlı, Raporlar
