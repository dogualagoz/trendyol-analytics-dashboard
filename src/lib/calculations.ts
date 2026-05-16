// Kar hesaplama formülleri.
// Bu dosya sadece matematiksel hesaplamalar yapar — DB ve API'dan habersizdir.
// Sync sırasında her sipariş kalemi için çağrılır, sonuç DB'ye kaydedilir.

import type { TrendyolOrderLine } from "@/types/trendyol"
import { CARGO_KDV_RATE, CARGO_TIER_2_MIN, CARGO_TIER_3_MIN } from "@/lib/constants"

// ─── Kalem Karı ───────────────────────────────────────────────────────────────

type CalculateProfitParams = {
  salePrice:   number   // birim satış fiyatı
  quantity:    number   // kaç adet satıldı
  discount:    number   // indirim tutarı
  commission:  number   // Trendyol komisyonu
  cargoShare:  number   // kargo payı
  serviceFee:  number   // hizmet bedeli
  stoppage:    number   // stopaj kesintisi
  netKdv:      number   // net KDV
  costPrice:   number   // ürün maliyeti (kullanıcının girdiği)
  extraCost?:  number   // ek maliyet (ambalaj, işçilik vs.) — opsiyonel
}

// Tek bir sipariş kalemi için kar hesaplar.
// Formül: Satış Tutarı - tüm kesintiler - maliyet
export function calculateProfit(params: CalculateProfitParams): number {
  const {
    salePrice,
    quantity,
    discount,
    commission,
    cargoShare,
    serviceFee,
    stoppage,
    netKdv,
    costPrice,
    extraCost = 0,
  } = params

  const grossAmount = salePrice * quantity  // brüt satış tutarı

  const profit =
    grossAmount
    - discount
    - commission
    - cargoShare
    - serviceFee
    - stoppage
    - netKdv
    - costPrice * quantity  // toplam maliyet (adet * birim maliyet)
    - extraCost

  // Ondalıklı hataları önlemek için 2 basamağa yuvarlıyoruz
  return Math.round(profit * 100) / 100
}

// ─── Trendyol Kalemi → Kar ────────────────────────────────────────────────────

// Trendyol'dan gelen ham sipariş kalemini alıp kar hesaplar.
// Sync sırasında costPrice DB'den okunur, buraya parametre olarak geçilir.
export function calculateProfitFromLine(
  line: TrendyolOrderLine,
  costPrice: number,
  overrides?: { serviceFee?: number; stoppage?: number; netKdv?: number; extraCost?: number }
): number {
  const netPrice = Number(line.price)    || 0
  const qty      = Number(line.quantity) || 1
  // commission API'dan oran (%) olarak geliyor → tutara çevir
  const commissionAmt = netPrice * qty * (Number(line.commission) || 0) / 100

  return calculateProfit({
    salePrice:  netPrice,
    quantity:   qty,
    discount:   Number(line.discount)   || 0,
    commission: commissionAmt,
    cargoShare: Number(line.cargoPrice) || 0,
    serviceFee: overrides?.serviceFee ?? 0,
    stoppage:   overrides?.stoppage   ?? 0,
    netKdv:     overrides?.netKdv     ?? 0,
    costPrice,
    extraCost:  overrides?.extraCost  ?? 0,
  })
}

// ─── Kargo Barem Hesaplama ────────────────────────────────────────────────────

// Siparişin brüt tutarına göre hangi kargo bareminin uygulanacağını bulur,
// KDV ekler ve nihai kargo maliyetini döner.
// tier1/2/3: kullanıcının ayarlardan girdiği KDV hariç barem fiyatları (TL)
export function calculateCargoWithKdv(
  orderGrossAmount: number,
  tier1: number,
  tier2: number,
  tier3: number
): number {
  if (!tier1 && !tier2 && !tier3) return 0
  const base =
    orderGrossAmount < CARGO_TIER_2_MIN ? tier1 :
    orderGrossAmount < CARGO_TIER_3_MIN ? tier2 :
    tier3
  return Math.round(base * (1 + CARGO_KDV_RATE) * 100) / 100
}

// ─── OrderItem Kar Yeniden Hesabı ────────────────────────────────────────────

// Kayıtlı sipariş kalemi verisinden kar hesaplar.
// OrderItem'da `commission` alan adı, Trendyol'dan gelen oranı (%) depolar.
// costPrice güncellendikten sonra DB'deki profit değerini güncellemek için kullanılır.
export function recalcOrderItemProfit(
  item: {
    salePrice:  unknown
    quantity:   number
    discount:   unknown
    commission: unknown  // oran (%) olarak saklanır
    cargoShare: unknown
  },
  costPrice: number
): number {
  const price          = Number(item.salePrice) || 0
  const qty            = item.quantity          || 1
  const commissionAmt  = price * qty * (Number(item.commission) || 0) / 100
  return calculateProfit({
    salePrice:  price,
    quantity:   qty,
    discount:   Number(item.discount)   || 0,
    commission: commissionAmt,
    cargoShare: Number(item.cargoShare) || 0,
    serviceFee: 0,
    stoppage:   0,
    netKdv:     0,
    costPrice,
  })
}

// ─── Oran Hesaplamaları ───────────────────────────────────────────────────────

// Kar / Satış Fiyatı oranı — "Satışın yüzde kaçı kar?"
export function profitToSalesRatio(profit: number, revenue: number): number {
  if (revenue === 0) return 0
  return Math.round((profit / revenue) * 10000) / 100  // yüzde, 2 ondalık
}

// Kar / Ürün Maliyeti oranı — "Maliyetin yüzde kaçı kar?"
export function profitToCostRatio(profit: number, totalCost: number): number {
  if (totalCost === 0) return 0
  return Math.round((profit / totalCost) * 10000) / 100
}

// ─── Fiyatlandırma Hesaplayıcı ────────────────────────────────────────────────

type PricingParams = {
  costPrice:       number  // ürün maliyeti
  commissionRate:  number  // komisyon oranı (yüzde, örn: 15 → %15)
  cargoPrice:      number  // kargo ücreti
  vatRate:         number  // KDV oranı (yüzde, örn: 20 → %20)
  targetProfitRate: number // hedeflenen kar oranı (yüzde)
}

// Hedef kar oranına göre önerilen satış fiyatını hesaplar.
// Fiyatlandırma hesaplayıcı sayfasında kullanılır.
export function calculateSuggestedPrice(params: PricingParams): number {
  const { costPrice, commissionRate, cargoPrice, vatRate, targetProfitRate } = params

  // Satış fiyatından düşülecek toplam kesinti oranı
  const deductionRate = (commissionRate + vatRate) / 100

  // Kar dahil toplam maliyet
  const totalCost = costPrice + cargoPrice

  // Hedef kar oranını karşılayacak fiyat
  const suggestedPrice = totalCost / (1 - deductionRate - targetProfitRate / 100)

  return Math.round(suggestedPrice * 100) / 100
}
