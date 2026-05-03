import db from "@/lib/db"
import { profitToSalesRatio } from "@/lib/calculations"

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function toNumber(val: unknown): number {
  return val ? Number(val) : 0
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function r(v: number) { return Math.round(v * 100) / 100 }

type OrderWithItems = {
  grossAmount:      unknown
  discountAmount:   unknown
  commissionAmount: unknown
  cargoAmount:      unknown
  serviceFee:       unknown
  stoppageAmount:   unknown
  netKdv:           unknown
  items: Array<{ quantity: number; product?: { costPrice?: unknown } | null }>
}

function calcOrderProfit(order: OrderWithItems): number {
  const revenue    = toNumber(order.grossAmount) - toNumber(order.discountAmount)
  const commission = toNumber(order.commissionAmount)
  const stoppage   = toNumber(order.stoppageAmount) || r(revenue * 0.01)
  const kdv        = toNumber(order.netKdv)         || r(commission * 0.10)
  const deductions = commission
                   + toNumber(order.cargoAmount)
                   + toNumber(order.serviceFee)
                   + stoppage
                   + kdv
  const costTotal  = order.items.reduce((s, i) => {
    const cost = i.product?.costPrice ? toNumber(i.product.costPrice) : 0
    return s + cost * i.quantity
  }, 0)
  return r(revenue - deductions - costTotal)
}

// ─── Özet Metrikler ───────────────────────────────────────────────────────────

export type SummaryMetrics = {
  totalRevenue:              number
  revenueWithCost:           number  // maliyeti girilmiş ürünlerin cirosu
  netProfit:                 number
  orderCount:                number
  profitToSalesRatio:        number
  profitToProductCostRatio:  number  // kâr / toplam ürün maliyeti
  trends: {
    totalRevenue:             number
    revenueWithCost:          number
    netProfit:                number
    orderCount:               number
    profitToSalesRatio:       number
    profitToProductCostRatio: number
  }
}

export async function getSummaryMetrics(startDate: Date, endDate: Date): Promise<SummaryMetrics> {
  const includeOpts = { items: { include: { product: true } } } as const

  const [orders, prevOrders] = await Promise.all([
    db.order.findMany({ where: { orderDate: { gte: startDate, lte: endDate } }, include: includeOpts }),
    (() => {
      const periodMs = endDate.getTime() - startDate.getTime()
      const prevEnd  = new Date(startDate.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - periodMs)
      return db.order.findMany({ where: { orderDate: { gte: prevStart, lte: prevEnd } }, include: includeOpts })
    })(),
  ])

  function calc(os: typeof orders) {
    const totalRevenue = os.reduce((s, o) => s + toNumber(o.grossAmount), 0)
    const netProfit    = os.reduce((s, o) => s + calcOrderProfit(o), 0)
    const orderCount   = os.length

    const revenueWithCost = os
      .filter(o => o.items.some(i => i.product?.costPrice != null && Number(i.product!.costPrice) > 0))
      .reduce((s, o) => s + toNumber(o.grossAmount), 0)

    const totalProductCost = os.reduce((s, o) =>
      s + o.items.reduce((si, i) => {
        const cost = i.product?.costPrice ? toNumber(i.product.costPrice) : 0
        return si + cost * i.quantity
      }, 0)
    , 0)

    return {
      totalRevenue,
      revenueWithCost,
      netProfit,
      orderCount,
      profitToSalesRatio:       profitToSalesRatio(netProfit, totalRevenue),
      profitToProductCostRatio: totalProductCost > 0 ? r((netProfit / totalProductCost) * 100) : 0,
    }
  }

  const cur  = calc(orders)
  const prev = calc(prevOrders)

  return {
    ...cur,
    trends: {
      totalRevenue:             calcTrend(cur.totalRevenue,             prev.totalRevenue),
      revenueWithCost:          calcTrend(cur.revenueWithCost,          prev.revenueWithCost),
      netProfit:                calcTrend(cur.netProfit,                prev.netProfit),
      orderCount:               calcTrend(cur.orderCount,               prev.orderCount),
      profitToSalesRatio:       calcTrend(cur.profitToSalesRatio,       prev.profitToSalesRatio),
      profitToProductCostRatio: calcTrend(cur.profitToProductCostRatio, prev.profitToProductCostRatio),
    },
  }
}

// ─── Kar Performansı Grafiği ──────────────────────────────────────────────────

export type ProfitPerformancePoint = {
  date:    string
  revenue: number
  profit:  number
}

export async function getProfitPerformance(startDate: Date, endDate: Date): Promise<ProfitPerformancePoint[]> {
  const orders = await db.order.findMany({
    where:   { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
    orderBy: { orderDate: "asc" },
  })

  const grouped = new Map<string, { revenue: number; profit: number }>()

  for (const order of orders) {
    const label    = order.orderDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
    const existing = grouped.get(label) ?? { revenue: 0, profit: 0 }
    grouped.set(label, {
      revenue: existing.revenue + toNumber(order.grossAmount),
      profit:  existing.profit  + calcOrderProfit(order),
    })
  }

  return Array.from(grouped.entries()).map(([date, vals]) => ({ date, ...vals }))
}

// ─── Maliyet Dağılımı ─────────────────────────────────────────────────────────

export type CostDistributionItem = {
  name:  string
  value: number
  color: string
}

export async function getCostDistribution(startDate: Date, endDate: Date): Promise<CostDistributionItem[]> {
  const orders = await db.order.findMany({
    where:   { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
  })

  let productCost = 0, commission = 0, cargo = 0, serviceFee = 0, stoppage = 0, kdv = 0, extra = 0

  for (const order of orders) {
    const grossRev   = toNumber(order.grossAmount)
    const discount   = toNumber(order.discountAmount)
    const netRev     = grossRev - discount

    // Komisyon: DB'de doğru hesaplanmış değer varsa kullan, yoksa 0 (sync sonrası dolar)
    const commissionVal = toNumber(order.commissionAmount)
    commission += commissionVal

    cargo      += toNumber(order.cargoAmount)
    serviceFee += toNumber(order.serviceFee)
    extra      += toNumber(order.extraCost)

    // Stopaj ve KDV: DB'de değer varsa kullan; yoksa sabit oranlarla hesapla
    // Stopaj %1 sabit (net ciro üzerinden), KDV %10 sabit (komisyon üzerinden)
    stoppage += toNumber(order.stoppageAmount) || r(netRev * 0.01)
    kdv      += toNumber(order.netKdv)         || r(commissionVal * 0.10)

    for (const item of order.items) {
      const cost = item.product?.costPrice ? toNumber(item.product.costPrice) : 0
      productCost += cost * item.quantity
    }
  }

  // Tüm kategoriler döndürülür — sıfır olanlar chart'ta soluk gösterilir (veri bekleniyor).
  // Ürün Maliyeti: kullanıcı ürünler sayfasından girer.
  // Diğerleri: settlements sync sonrası dolar.
  return [
    { name: "Toplam Ürün Maliyeti", value: r(productCost), color: "#F27A1A" },
    { name: "Toplam Komisyon",      value: r(commission),  color: "#00D1FF" },
    { name: "Toplam Kargo Ücreti",  value: r(cargo),       color: "#7C3AED" },
    { name: "Toplam Hizmet Bedeli", value: r(serviceFee),  color: "#FF7F5D" },
    { name: "Toplam Stopaj",        value: r(stoppage),    color: "#1E293B" },
    { name: "Toplam Net KDV",       value: r(kdv),         color: "#10B981" },
    { name: "Ekstra Maliyet",       value: r(extra),       color: "#F59E0B" },
  ]
}

// ─── Ürün Metrikleri ─────────────────────────────────────────────────────────

export type ProductMetrics = {
  netUnitsSold:      number
  avgRevenuePerUnit: number
  avgProfitPerUnit:  number
  avgCargoPerUnit:   number
  avgCommissionRate: number
  avgDiscountRate:   number
}

export async function getProductMetrics(startDate: Date, endDate: Date): Promise<ProductMetrics> {
  const orders = await db.order.findMany({
    where:   { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
  })

  const netUnitsSold    = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)
  const totalRevenue    = orders.reduce((s, o) => s + toNumber(o.grossAmount), 0)
  const totalProfit     = orders.reduce((s, o) => s + calcOrderProfit(o), 0)
  const totalCargo      = orders.reduce((s, o) => s + toNumber(o.cargoAmount), 0)
  const totalCommission = orders.reduce((s, o) => s + toNumber(o.commissionAmount), 0)
  const totalDiscount   = orders.reduce((s, o) => s + toNumber(o.discountAmount), 0)

  return {
    netUnitsSold,
    avgRevenuePerUnit: netUnitsSold > 0 ? r(totalRevenue    / netUnitsSold) : 0,
    avgProfitPerUnit:  netUnitsSold > 0 ? r(totalProfit     / netUnitsSold) : 0,
    avgCargoPerUnit:   netUnitsSold > 0 ? r(totalCargo      / netUnitsSold) : 0,
    avgCommissionRate: totalRevenue > 0 ? r((totalCommission / totalRevenue) * 100) : 0,
    avgDiscountRate:   totalRevenue > 0 ? r((totalDiscount   / totalRevenue) * 100) : 0,
  }
}

// ─── Sipariş Metrikleri ──────────────────────────────────────────────────────

export type OrderMetrics = {
  orderCount:          number
  avgRevenuePerOrder:  number
  avgProfitPerOrder:   number
  avgCargoPerOrder:    number
}

export async function getOrderMetrics(startDate: Date, endDate: Date): Promise<OrderMetrics> {
  const orders = await db.order.findMany({
    where:   { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
  })

  const orderCount   = orders.length
  const totalRevenue = orders.reduce((s, o) => s + toNumber(o.grossAmount), 0)
  const totalProfit  = orders.reduce((s, o) => s + calcOrderProfit(o), 0)
  const totalCargo   = orders.reduce((s, o) => s + toNumber(o.cargoAmount), 0)

  return {
    orderCount,
    avgRevenuePerOrder: orderCount > 0 ? r(totalRevenue / orderCount) : 0,
    avgProfitPerOrder:  orderCount > 0 ? r(totalProfit  / orderCount) : 0,
    avgCargoPerOrder:   orderCount > 0 ? r(totalCargo   / orderCount) : 0,
  }
}

// ─── Net Kâr Funnel ───────────────────────────────────────────────────────────

export type FunnelStep = {
  label: string
  value: number
}

export async function getProfitFunnel(startDate: Date, endDate: Date): Promise<FunnelStep[]> {
  const orders = await db.order.findMany({
    where:   { orderDate: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: true } } },
  })

  const ciro       = orders.reduce((s, o) => s + toNumber(o.grossAmount), 0)
  const cargo      = orders.reduce((s, o) => s + toNumber(o.cargoAmount), 0)
  const commission = orders.reduce((s, o) => s + toNumber(o.commissionAmount), 0)
  const serviceFee = orders.reduce((s, o) => s + toNumber(o.serviceFee), 0)
  const stoppage   = orders.reduce((s, o) => s + toNumber(o.stoppageAmount), 0)
  const kdv        = orders.reduce((s, o) => s + toNumber(o.netKdv), 0)
  const profit     = orders.reduce((s, o) => s + calcOrderProfit(o), 0)

  const afterCargo       = ciro - cargo
  const afterMarketplace = afterCargo - commission - serviceFee
  const afterTax         = afterMarketplace - stoppage - kdv

  return [
    { label: "Ciro",                             value: r(ciro) },
    { label: "Kargo ücreti düşülmüş tutar",      value: r(afterCargo) },
    { label: "Pazaryeri masrafı düşülmüş tutar", value: r(afterMarketplace) },
    { label: "Vergi düşülmüş tutar",             value: r(afterTax) },
    { label: "Kâr",                              value: r(profit) },
  ]
}

// ─── En İyi Ürünler ───────────────────────────────────────────────────────────

export type TopProduct = {
  id:        string
  name:      string
  category:  string | null
  unitsSold: number
  revenue:   number
}

export async function getTopProducts(startDate: Date, endDate: Date, limit = 5): Promise<TopProduct[]> {
  const items = await db.orderItem.findMany({
    where: {
      order:   { orderDate: { gte: startDate, lte: endDate } },
      product: { isNot: null },
    },
    include: { product: true },
  })

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

  return Array.from(grouped.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}
