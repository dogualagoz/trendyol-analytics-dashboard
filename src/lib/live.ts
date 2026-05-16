// Canlı performans sayfasının service katmanı.
// Bugünün (00:00'dan şu ana) verilerini DB'den hesaplayıp döner.
// Trendyol API'ya istek atmaz — sync zaten DB'yi güncel tutar.

import db from "@/lib/db"
import { profitToSalesRatio, profitToCostRatio } from "@/lib/calculations"

function getTodayStart(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TodayMetrics = {
  totalProfit: number
  totalRevenue: number
  orderCount: number
  totalCost: number
  profitToSalesRatio: number  // kâr marjı: profit / revenue
  profitToCostRatio: number   // kâr oranı: profit / cost
  lastUpdated: string         // ISO string
}

export type HourlyProfit = {
  hour: string    // "00:00", "01:00", ...
  profit: number  // kümülatif (o saate kadar toplam kar)
}

export type TodayOrderItem = {
  id: string
  productId: string | null
  productTitle: string
  productBarcode: string | null
  productImage: string | null
  quantity: number
  salePrice: number
  commissionRate: number   // % olarak (DB'de oran saklanır)
  commissionAmount: number // hesaplanmış tutar
  cargoShare: number
  costPrice: number
  profit: number
}

export type TodayOrder = {
  id: string
  trendyolOrderId: string
  orderDate: string   // ISO string
  grossAmount: number
  totalProfit: number
  totalCost: number
  profitToCostRatio: number   // kâr oranı (%)
  profitToSalesRatio: number  // kâr marjı (%)
  // modal için sipariş düzeyindeki gider kalemleri
  cargoAmount: number
  netKdv: number
  commissionAmount: number
  serviceFee: number
  stoppageAmount: number
  extraCost: number
  items: TodayOrderItem[]
}

export type TodayProduct = {
  id: string
  trendyolId: string
  title: string
  barcode: string | null
  imageUrl: string | null
  brand: string | null
  color: string | null
  size: string | null
  stockQty: number
  deliveryType: string | null
  returnRate: number | null
  costPrice: number | null
  extraCost: number
}

// ─── Service Fonksiyonları ─────────────────────────────────────────────────────

export async function getTodayMetrics(): Promise<TodayMetrics> {
  const start = getTodayStart()

  const orders = await db.order.findMany({
    where: { orderDate: { gte: start } },
    include: {
      items: {
        include: { product: { select: { costPrice: true } } },
      },
    },
  })

  let totalProfit = 0
  let totalCost = 0
  let totalRevenue = 0

  for (const order of orders) {
    totalRevenue += Number(order.grossAmount)
    for (const item of order.items) {
      totalProfit += Number(item.profit ?? 0)
      totalCost += Number(item.product?.costPrice ?? 0) * item.quantity
    }
  }

  return {
    totalProfit:          Math.round(totalProfit  * 100) / 100,
    totalRevenue:         Math.round(totalRevenue * 100) / 100,
    orderCount:           orders.length,
    totalCost:            Math.round(totalCost    * 100) / 100,
    profitToSalesRatio:   profitToSalesRatio(totalProfit, totalRevenue),
    profitToCostRatio:    profitToCostRatio(totalProfit, totalCost),
    lastUpdated:          new Date().toISOString(),
  }
}

export async function getTodayProfitByHour(): Promise<HourlyProfit[]> {
  const start = getTodayStart()

  const orders = await db.order.findMany({
    where: { orderDate: { gte: start } },
    include: { items: { select: { profit: true } } },
    orderBy: { orderDate: "asc" },
  })

  // Her saatin toplam karını biriktir
  const hourlyMap = new Map<number, number>()
  for (const order of orders) {
    const h = new Date(order.orderDate).getHours()
    const orderProfit = order.items.reduce((s, i) => s + Number(i.profit ?? 0), 0)
    hourlyMap.set(h, (hourlyMap.get(h) ?? 0) + orderProfit)
  }

  // Şu ana kadar her saati kümülatif topla
  const currentHour = new Date().getHours()
  const result: HourlyProfit[] = []
  let cumulative = 0

  for (let h = 0; h <= currentHour; h++) {
    cumulative += hourlyMap.get(h) ?? 0
    result.push({
      hour:   `${String(h).padStart(2, "0")}:00`,
      profit: Math.round(cumulative * 100) / 100,
    })
  }

  return result
}

export async function getTodayOrders(): Promise<TodayOrder[]> {
  const start = getTodayStart()

  const orders = await db.order.findMany({
    where: { orderDate: { gte: start } },
    orderBy: { orderDate: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { title: true, barcode: true, imageUrl: true, costPrice: true },
          },
        },
      },
    },
  })

  return orders.map((order) => {
    const items: TodayOrderItem[] = order.items.map((item) => {
      const salePrice       = Number(item.salePrice)
      const qty             = item.quantity
      const commissionRate  = Number(item.commission)
      const commissionAmt   = Math.round(salePrice * qty * commissionRate / 100 * 100) / 100
      const costPrice       = Number(item.product?.costPrice ?? 0)

      return {
        id:               item.id,
        productId:        item.productId,
        productTitle:     item.product?.title ?? "—",
        productBarcode:   item.product?.barcode ?? null,
        productImage:     item.product?.imageUrl ?? null,
        quantity:         qty,
        salePrice,
        commissionRate,
        commissionAmount: commissionAmt,
        cargoShare:       Number(item.cargoShare),
        costPrice,
        profit:           Number(item.profit ?? 0),
      }
    })

    const totalProfit  = items.reduce((s, i) => s + i.profit, 0)
    const totalCost    = items.reduce((s, i) => s + i.costPrice * i.quantity, 0)
    const grossAmount  = Number(order.grossAmount)

    return {
      id:                  order.id,
      trendyolOrderId:     order.trendyolOrderId,
      orderDate:           order.orderDate.toISOString(),
      grossAmount,
      totalProfit:         Math.round(totalProfit * 100) / 100,
      totalCost:           Math.round(totalCost   * 100) / 100,
      profitToCostRatio:   profitToCostRatio(totalProfit, totalCost),
      profitToSalesRatio:  profitToSalesRatio(totalProfit, grossAmount),
      cargoAmount:         Number(order.cargoAmount),
      netKdv:              Number(order.netKdv),
      commissionAmount:    Number(order.commissionAmount),
      serviceFee:          Number(order.serviceFee),
      stoppageAmount:      Number(order.stoppageAmount),
      extraCost:           Number(order.extraCost),
      items,
    }
  })
}

export async function getTodayOrderedProducts(): Promise<TodayProduct[]> {
  const start = getTodayStart()

  // Bugün sipariş alan ürünlerin ID'lerini bul
  const orderItems = await db.orderItem.findMany({
    where: {
      productId: { not: null },
      order: { orderDate: { gte: start } },
    },
    select: { productId: true },
    distinct: ["productId"],
  })

  const productIds = orderItems.map((i) => i.productId!).filter(Boolean)
  if (!productIds.length) return []

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    orderBy: [{ title: "asc" }],
  })

  return products.map((p) => ({
    id:           p.id,
    trendyolId:   p.trendyolId,
    title:        p.title,
    barcode:      p.barcode,
    imageUrl:     p.imageUrl,
    brand:        p.brand,
    color:        p.color,
    size:         p.size,
    stockQty:     p.stockQty,
    deliveryType: p.deliveryType,
    returnRate:   p.returnRate != null ? Number(p.returnRate) : null,
    costPrice:    p.costPrice  != null ? Number(p.costPrice)  : null,
    extraCost:    Number(p.extraCost),
  }))
}
