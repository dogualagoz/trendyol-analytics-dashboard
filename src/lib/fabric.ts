// Kumaş bazlı ürün maliyeti hesaplaması.
// Kumaşı top olarak alıyoruz: metresi sabit USD fiyatlı, top eni 140 veya 150 cm.
//
// Mantık:
//   • Ürünün boyutlarından biri top eninde ise (140/150) → kumaş top boyunca
//     tek seferde kesilir; sadece diğer boyut "boy" olarak ücretlendirilir.
//     Örn: 140×200 cm → $2.5 × 2.0 m = $5.00
//   • Her iki boyut da top eninden küçükse → alan formülü (en × boy m²).
//     Örn: 70×50 cm → $2.5 × 0.7 × 0.5 = $0.875

import {
  FABRIC_PRICE_PER_METER_USD,
  FABRIC_ROLL_WIDTHS_CM,
} from "@/lib/constants"

export type FabricDimensions = {
  widthCm:  number  // küçük boyut — "en"
  lengthCm: number  // büyük boyut — "boy"
}

// "70x50", "140 x 200", "70X50", "70×50", "70*50 cm" gibi ifadeleri ayrıştırır.
// İlk eşleşen iki sayıyı alır; sıraya göre küçük olanı en, büyük olanı boy kabul eder.
// Beden ("M", "L", "42") gibi ölçü içermeyen değerlerde null döner.
export function parseProductSize(size: string | null | undefined): FabricDimensions | null {
  if (!size) return null
  const match = size.match(/(\d+(?:[.,]\d+)?)\s*[xX×*]\s*(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const a = parseFloat(match[1].replace(",", "."))
  const b = parseFloat(match[2].replace(",", "."))
  if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) return null
  return {
    widthCm:  Math.min(a, b),
    lengthCm: Math.max(a, b),
  }
}

// Verilen boyut top eninde sayılır mı? (140 veya 150 ± 0.5 cm)
function matchesRollWidth(cm: number): boolean {
  return FABRIC_ROLL_WIDTHS_CM.some((w) => Math.abs(cm - w) < 0.5)
}

// USD cinsinden kumaş maliyeti.
export function calculateFabricCostUsd(d1Cm: number, d2Cm: number): number {
  const r1 = matchesRollWidth(d1Cm)
  const r2 = matchesRollWidth(d2Cm)

  // Tam top eni kullanımı — yalnızca diğer boyut çarpılır
  if (r1 && !r2) return FABRIC_PRICE_PER_METER_USD * (d2Cm / 100)
  if (r2 && !r1) return FABRIC_PRICE_PER_METER_USD * (d1Cm / 100)
  // Her iki boyut da top eninde — büyük olanı boy kabul et
  if (r1 && r2)  return FABRIC_PRICE_PER_METER_USD * (Math.max(d1Cm, d2Cm) / 100)
  // Hiçbiri top eninde değil → alan formülü
  return FABRIC_PRICE_PER_METER_USD * (d1Cm / 100) * (d2Cm / 100)
}

// TL cinsine çevrilmiş kumaş maliyeti — verilen USD/TRY kuru kullanılır.
export function calculateFabricCostTry(
  d1Cm: number,
  d2Cm: number,
  usdToTryRate: number
): number {
  const usd = calculateFabricCostUsd(d1Cm, d2Cm)
  return Math.round(usd * usdToTryRate * 100) / 100
}
