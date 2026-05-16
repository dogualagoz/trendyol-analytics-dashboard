// Fiyatlandırma hesaplama formülleri.
// DB ve API'dan habersizdir — sadece matematiksel hesaplamalar yapar.

import { KDV_RATE, STOPAJ_RATE } from "@/lib/constants"

export type ProfitMode = "amount" | "rate"

export type PricingInput = {
  costPrice:      number  // ürün maliyeti (₺)
  commissionRate: number  // komisyon oranı 0-1 (ör: 0.20 = %20)
  cargoFee:       number  // kargo bedeli (₺)
  desiredProfit:  number  // kâr tutarı (₺) veya oranı (0-1)
  profitMode:     ProfitMode
}

export type PricingResult = {
  salePrice:      number  // önerilen satış fiyatı
  commission:     number  // komisyon kesintisi
  commissionKdv:  number  // komisyon üzeri KDV (%10)
  stoppage:       number  // stopaj (%1)
  cargoFee:       number  // kargo
  costPrice:      number  // ürün maliyeti
  profit:         number  // net kâr
  profitRate:     number  // kâr oranı % (kâr / satış fiyatı)
}

// Trendyol kesintileri sonrası satıcıda kalan oran.
// Formül: 1 - komisyon - komisyon KDV'si - stopaj
function netRetentionRate(commissionRate: number): number {
  return 1 - commissionRate - commissionRate * KDV_RATE - STOPAJ_RATE
}

// Verilen girdilere göre önerilen satış fiyatını ve kâr dökümünü hesaplar.
export function calculateSuggestedPrice(input: PricingInput): PricingResult {
  const { costPrice, commissionRate, cargoFee, desiredProfit, profitMode } = input
  const R = netRetentionRate(commissionRate)

  if (R <= 0) return emptyResult(input)

  let salePrice: number
  if (profitMode === "amount") {
    // Kâr = salePrice × R - cargo - cost  →  salePrice çöz
    salePrice = (desiredProfit + cargoFee + costPrice) / R
  } else {
    // desiredProfit = 0-1 (ör: 0.30 = %30 kâr marjı)
    // kâr = salePrice × desiredProfit  →  salePrice × (R - desiredProfit) = cargo + cost
    const denominator = R - desiredProfit
    if (denominator <= 0) return emptyResult(input)
    salePrice = (cargoFee + costPrice) / denominator
  }

  if (salePrice <= 0 || !isFinite(salePrice)) return emptyResult(input)

  const commission    = salePrice * commissionRate
  const commissionKdv = commission * KDV_RATE
  const stoppage      = salePrice * STOPAJ_RATE
  const profit        = salePrice - commission - commissionKdv - stoppage - cargoFee - costPrice

  return {
    salePrice:     r2(salePrice),
    commission:    r2(commission),
    commissionKdv: r2(commissionKdv),
    stoppage:      r2(stoppage),
    cargoFee:      r2(cargoFee),
    costPrice:     r2(costPrice),
    profit:        r2(profit),
    profitRate:    r2(salePrice > 0 ? (profit / salePrice) * 100 : 0),
  }
}

function r2(n: number) { return Math.round(n * 100) / 100 }

function emptyResult(input: PricingInput): PricingResult {
  return {
    salePrice: 0, commission: 0, commissionKdv: 0,
    stoppage: 0, cargoFee: input.cargoFee, costPrice: input.costPrice,
    profit: 0, profitRate: 0,
  }
}

// Yaygın Trendyol kategorileri ve varsayılan komisyon oranları (%)
export const TRENDYOL_CATEGORIES = [
  { label: "Giyim & Tekstil",             commissionRate: 20 },
  { label: "Ayakkabı & Çanta",            commissionRate: 18 },
  { label: "Saat & Aksesuar",             commissionRate: 20 },
  { label: "Elektronik",                  commissionRate: 8  },
  { label: "Bilgisayar & Tablet",         commissionRate: 8  },
  { label: "Telefon & Aksesuar",          commissionRate: 8  },
  { label: "Ev & Yaşam",                  commissionRate: 14 },
  { label: "Mutfak & Ev Aletleri",        commissionRate: 14 },
  { label: "Kitap & Müzik",               commissionRate: 8  },
  { label: "Oyun & Oyuncak",              commissionRate: 12 },
  { label: "Kozmetik & Kişisel Bakım",    commissionRate: 14 },
  { label: "Spor & Outdoor",              commissionRate: 14 },
  { label: "Bahçe & Yapı Market",         commissionRate: 12 },
  { label: "Anne & Bebek",                commissionRate: 12 },
  { label: "Pet Shop",                    commissionRate: 12 },
  { label: "Süpermarket",                 commissionRate: 10 },
  { label: "Otomotiv",                    commissionRate: 8  },
  { label: "Özel (Manuel Giriş)",         commissionRate: 0  },
] as const
