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

> **Not:** shadcn/ui henüz kurulmadı. Kurulum: `npx shadcn-ui@latest init`
> Yeni bileşen eklemek için: `npx shadcn-ui@latest add <bileşen-adı>`

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
│   │   ├── products/            # Ürün listesi ve maliyet girişi
│   │   ├── orders/              # Sipariş listesi
│   │   ├── returns/             # İade metrikleri
│   │   ├── pricing/             # Fiyat hesaplayıcı
│   │   ├── reports/             # Karlılık raporları ve analizler
│   │   ├── live/                # Canlı performans (bugünkü kar)
│   │   └── settings/            # API credentials, genel ayarlar
│   └── api/
│       ├── auth/                # NextAuth endpoint
│       ├── trendyol/            # Trendyol API proxy (key güvenliği)
│       ├── products/            # Ürün CRUD
│       ├── orders/              # Sipariş sorguları
│       ├── returns/             # İade sorguları
│       ├── settings/            # Ayar okuma/yazma
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
│   ├── utils.ts                 # Genel yardımcılar (cn, para formatı vs.)
│   └── mock/                    # Erken aşama mock verileri (UI-first geliştirme)
│       ├── dashboard.ts         # Dashboard mock metrikleri
│       ├── orders.ts            # Sipariş mock verisi
│       └── products.ts          # Ürün mock verisi
└── types/
    ├── trendyol.ts              # Trendyol API response tipleri
    └── index.ts                 # Uygulama geneli tipler
```

### Katman Kuralları

- `app/api/` → İnce: istek parse et, lib fonksiyonunu çağır, cevap dön
- `lib/` → İş mantığı ve hesaplamalar buraya girer
- Prisma client doğrudan kullanılır; repository pattern eklenmez
- Trendyol API key'leri asla client'a çıkmaz, her zaman `app/api/` üzerinden proxy'lenir

### Server vs Client Component Kuralı (Next.js App Router)

- Varsayılan: her bileşen **Server Component**'tir (`'use client'` yazılmaz)
- `'use client'` yalnızca şu durumlarda eklenir:
  - `useState`, `useEffect`, `useCallback` gibi React hook kullanılıyorsa
  - `onClick`, `onChange` gibi event handler varsa
  - Browser-only API'ye erişiliyorsa (localStorage, window vb.)
- Kural: Server Component'ten Client Component'e veri prop olarak geçilir, tersi olmaz
- Grafik bileşenleri (Recharts) `'use client'` gerektirir

### Prisma Client

- Output yolu: `src/generated/prisma` (schema.prisma'da tanımlı)
- Import: `import { PrismaClient } from '@/generated/prisma'`
- `lib/db.ts` singleton pattern ile global instance yönetir

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

## Tasarım Sistemi

Detaylar `design.md` dosyasında. Referans: **Stitch tasarımı** (`stitch.withgoogle.com` projesi).

- **Font:** Inter (tüm ağırlıklar)
- **Primary:** `#984700` (Trendyol turuncu koyu) — aktif nav yazısı
- **Accent/CTA:** `#F27A1A` (Trendyol turuncu) — buton, aktif nav sol çizgisi, vurgu
- **Background:** `#F9F9F9`
- **Card:** beyaz zemin, `1rem` border-radius, `1px` `#E2E2E2` border, `0px 4px 20px rgba(0,0,0,0.04)` shadow
- **Sidebar zemini:** `#FFFFFF` (beyaz) — Stitch tasarımına göre güncellendi
- **Sidebar aktif item:** sol `3px #F27A1A` çizgi + `orange-50` arka plan + `#984700` koyu turuncu metin
- **Sidebar pasif item:** `#574236` (on-surface-variant) metin, hover'da `gray-50`
- **Data viz paleti:** Teal `#00D1FF`, Violet `#7C3AED`, Soft Orange `#FF7F5D`
- **Spacing ritmi:** 4px base, kartlar arası `24px` gutter, iç padding `24px`
- **Yazı hiyerarşisi:** `display-lg` 32px/700, `headline-md` 24px/600, `body-md` 14px/400, sayısal veriler tabular figures

### Sidebar Kuralı
Sidebar beyaz arka planlıdır. Aktif navigasyon öğesi:
```
border-l-[3px] border-[#F27A1A] bg-orange-50 text-[#984700] font-semibold pl-[13px]
```
Pasif öğe: `text-[#574236] pl-4` (pl-[13px] ile ikon hizası korunur)

### Navbar Kuralı
Navbar 3 bölüm: sol başlık | orta arama kutusu | sağ aksiyonlar (zil + grid + avatar)

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

### Geliştirme Döngüsü

Proje iki farklı yaklaşımla ilerler:

**Erken aşama** (uygulama olgunlaşana kadar):
```
1. UI önce  → Mock veriyle yap, içine sinene kadar düzenle
2. Backend  → UI'ın tam ihtiyacına göre tasarla
3. Bağla    → Mock veriyi gerçek API'a çek
```

**Olgun aşama** (veri modeli ve UI netleştikten sonra):
```
1. Backend  → API route + lib fonksiyonu + DB sorgusu
2. Frontend → Bileşen + sayfa
3. Bağla    → Frontend'i backend'e bağla, çalıştığını doğrula
```

**Her iki yaklaşımda ortak kurallar:**
- Bir özellik tamamlanmadan bir sonrakine geçilmez
- Her adımda kullanıcıdan onay beklenir
- Altyapı değişiklikleri (DB migration, yeni bağımlılık) döngünün dışında ayrıca yapılır
- Kapsam dışı iyileştirmeler o an yapılmaz, not alınır

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

## Mevcut Durum

**Şu an: Erken Aşama** — UI-first, mock veriyle geliştirme yapılıyor.

- Proje kurulumu tamamlandı (Next.js 14 + TypeScript + Tailwind + Prisma + NextAuth + Recharts)
- Klasör yapısı oluşturuldu, içerik boş
- shadcn/ui kurulmadı
- Prisma şeması boş (migration yapılmadı)
- Hiç sayfa/bileşen yazılmadı

---

## Geliştirme Sırası (Yol Haritası)

### Aşama 1 — Altyapı (tek seferlik, döngü dışı)
- [x] Proje kurulumu (Next.js 14 + TypeScript + Tailwind)
- [ ] DB şeması + Prisma migration
- [ ] shadcn/ui kurulumu
- [ ] Layout: sidebar + navbar
- [ ] Auth: login sayfası + middleware

### Aşama 2 — Özellik Döngüleri (backend → frontend → bağla)
- [ ] Dashboard: Toplam Ciro
- [ ] Dashboard: Kâr Tutarı
- [ ] Dashboard: Kâr Oranları
- [ ] Dashboard: Maliyet Dağılımı (donut grafik)
- [ ] Dashboard: Kâr Performansı (çizgi grafik)
- [ ] Ürünler: liste + maliyet girişi
- [ ] Siparişler: liste + detay
- [ ] Fiyatlandırma hesaplayıcı
- [ ] İade metrikleri
- [ ] Canlı performans
- [ ] Raporlar + export
- [ ] Ayarlar sayfası
