// Dashboard ana sayfası için DB sorguları.
// Mock verideki her yapıyla birebir eşleşir — page.tsx'de sadece import değişecek.

import db from "@/lib/db"
import { profitToSalesRatio } from "@/lib/calculations"

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

// Prisma Decimal tipini number'a çevirir
function toNumber(val: unknown): number {
  return val ? Number(val) : 0
}

// İki dönem arasındaki değişim yüzdesi — trend hesabı için
function calcTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

// Bir sipariş için net kar hesaplar.
// Öncelik: order-level finansal alanlar (settlements'tan dolar).
// Komisyon/kargo henüz gelmemişse (=0) sadece bilinen kesintileri çıkar.
function calcOrderProfit(order: {
  grossAmount:      unknown
  discountAmount:   unknown
  commissionAmount: unknown
  cargoAmount:      unknown
  serviceFee:       unknown
  stoppageAmount:   unknown
  netKdv:           unknown
  items: Array<{ quantity: number; product?: { costPrice?: unknown } | null }>
}): number {
  const revenue    = toNumber(order.grossAmount) - toNumber(order.discountAmount)
  const deductions = toNumber(order.commissionAmount)
                   + toNumber(order.cargoAmount)
                   + toNumber(order.serviceFee)
                   + toNumber(order.stoppageAmount)
                   + toNumber(order.netKdv)
  const costTotal  = order.items.reduce((s, i) => {
    const cost = i.product?.costPrice ? toNumber(i.product.costPrice) : 0
    return s + cost * i.quantity
  }, 0)
  return Math.round((revenue - deductions - costTotal) * 100) / 100
}

// ─── Özet Metrikler ───────────────────────────────────────────────────────────

export type SummaryMetrics = {
  totalRevenue:       number
  netProfit:          number
  orderCount:         number
  profitToSalesRatio: number
  trends: {
    totalRevenue:       number
    netProfit:          number
    orderCount:         number
    profitToSalesRatio: number
  }
}

// Toplam ciro, kar, sipariş sayısı ve trend bilgilerini döner.
// Trend: seçili dönem ile bir önceki aynı uzunluktaki dönem karşılaştırılır.
export async function getSummaryMetrics(
  startDate: Date,
  endDate: Date
): Promise<SummaryMetrics> {
  // Seçili dönem için siparişleri çek
  const orders = await db.order.findMany({
    where: { orderDate: { gte: startDate, lte: endDate } },
    include: { items: true },
  })

  // Bir önceki dönem (aynı uzunlukta, hemen öncesi)
  const periodMs   = endDate.getTime() - startDate.getTime()
  const prevEnd    = new Date(startDate.getTime() - 1)
  const prevStart  = new Date(prevEnd.getTime() - periodMs)

  const prevOrders = await db.order.findMany({
    where: { orderDate: { gte: prevStart, lte: prevEnd } },
    include: { items: true },
  })

  // Seçili dönem hesaplamaları
  const totalRevenue = orders.reduce((s, o) => s + toNumber(o.grossAmount), 0)
  const netProfit    = orders.reduce((s, o) => s + calcOrderProfit(o), 0)
  const orderCount   = orders.length
  const ratio        = profitToSalesRatio(netProfit, totalRevenue)

  // Önceki dönem hesaplamaları
  const prevRevenue    = prevOrders.reduce((s, o) => s + toNumber(o.grossAmount), 0)
  const prevProfit     = prevOrders.reduce((s, o) => s + calcOrderProfit(o), 0)
  const prevOrderCount = prevOrders.length
  const prevRatio      = profitToSalesRatio(prevProfit, prevRevenue)

  return {
    totalRevenue,
    netProfit,
    orderCount,
    profitToSalesRatio: ratio,
    trends: {
      totalRevenue:       calcTrend(totalRevenue, prevRevenue),
      netProfit:          calcTrend(netProfit,    prevProfit),
      orderCount:         calcTrend(orderCount,   prevOrderCount),
      profitToSalesRatio: calcTrend(ratio,        prevRatio),
    },
  }
}

// ─── Kar Performansı Grafiği ──────────────────────────────────────────────────

export type ProfitPerformancePoint = {
  date:    string  // "1 Nis", "15 May" gibi
  revenue: number
  profit:  number
}

// Tarih aralığını günlere bölerek her gün için ciro ve kar toplar.
// Recharts çizgi grafiğine direkt verilebilir.
export async function getProfitPerformance(
  startDate: Date,
  endDate: Date
): Promise<ProfitPerformancePoint[]> {
  const orders = await db.order.findMany({
    where: { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
    orderBy: { orderDate: "asc" },
  })

  const grouped = new Map<string, { revenue: number; profit: number }>()

  for (const order of orders) {
    const label = order.orderDate.toLocaleDateString("tr-TR", {
      day:   "numeric",
      month: "short",
    })

    const existing = grouped.get(label) ?? { revenue: 0, profit: 0 }
    const profit   = calcOrderProfit(order)

    grouped.set(label, {
      revenue: existing.revenue + toNumber(order.grossAmount),
      profit:  existing.profit  + profit,
    })
  }

  return Array.from(grouped.entries()).map(([date, vals]) => ({
    date,
    ...vals,
  }))
}

// ─── Maliyet Dağılımı ─────────────────────────────────────────────────────────

export type CostDistributionItem = {
  name:  string
  value: number
  color: string
}

// Maliyet türlerini toplayıp donut grafik için hazırlar.
export async function getCostDistribution(
  startDate: Date,
  endDate: Date
): Promise<CostDistributionItem[]> {
  const orders = await db.order.findMany({
    where: { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
  })

  let productCost = 0
  let commission  = 0
  let cargo       = 0
  let serviceFee  = 0
  let stoppage    = 0
  let kdv         = 0
  let extra       = 0

  for (const order of orders) {
    commission += toNumber(order.commissionAmount)
    cargo      += toNumber(order.cargoAmount)
    serviceFee += toNumber(order.serviceFee)
    stoppage   += toNumber(order.stoppageAmount)
    kdv        += toNumber(order.netKdv)
    extra      += toNumber(order.extraCost)

    // Ürün maliyeti: her kalemin costPrice × quantity toplamı
    for (const item of order.items) {
      const cost = item.product?.costPrice ? toNumber(item.product.costPrice) : 0
      productCost += cost * item.quantity
    }
  }

  // Değeri 0 olan kategorileri grafikten çıkar
  const all: CostDistributionItem[] = [
    { name: "Ürün Maliyeti", value: productCost, color: "#F27A1A" },
    { name: "Komisyon",      value: commission,  color: "#00D1FF" },
    { name: "Kargo",         value: cargo,       color: "#7C3AED" },
    { name: "Hizmet Bedeli", value: serviceFee,  color: "#FF7F5D" },
    { name: "Stopaj",        value: stoppage,    color: "#1E293B" },
    { name: "KDV",           value: kdv,         color: "#10B981" },
    { name: "Ekstra",        value: extra,       color: "#F59E0B" },
  ]

  return all.filter(item => item.value > 0)
}

// ─── En İyi Ürünler ───────────────────────────────────────────────────────────

export type TopProduct = {
  id:        string
  name:      string
  category:  string | null
  unitsSold: number
  revenue:   number
}

// En çok satış yapan ürünleri döner — tablo için.
export async function getTopProducts(
  startDate: Date,
  endDate:   Date,
  limit = 5
): Promise<TopProduct[]> {
  // Sipariş kalemleri üzerinden ürün bazlı toplama yapıyoruz
  const items = await db.orderItem.findMany({
    where: {
      order: { orderDate: { gte: startDate, lte: endDate } },
      product: { isNot: null },
    },
    include: { product: true },
  })

  // Ürün ID'sine göre grupla
  const grouped = new Map<string, TopProduct>()

  for (const item of items) {
    if (!item.product) continue

    const existing = grouped.get(item.product.id)
    if (existing) {
      existing.unitsSold += item.quantity
      existing.revenue   += toNumber(item.salePrice) * item.quantity
    } else {
      grouped.set(item.product.id, {
        id:        item.product.id,
        name:      item.product.title,
        category:  item.product.category,
        unitsSold: item.quantity,
        revenue:   toNumber(item.salePrice) * item.quantity,
      })
    }
  }

  // Gelire göre sırala, ilk limit kadarını döndür
  return Array.from(grouped.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}
