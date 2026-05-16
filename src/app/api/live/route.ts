// GET /api/live — canlı performans sayfasının ihtiyaç duyduğu tüm bugünkü verileri döner.
// Trendyol'a istek atmaz; DB'den okur. Sayfa 30 saniyede bir bu endpoint'i çağırır.

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import {
  getTodayMetrics,
  getTodayProfitByHour,
  getTodayOrders,
  getTodayOrderedProducts,
} from "@/lib/live"

export async function GET() {
  const [metrics, profitByHour, orders, products] = await Promise.all([
    getTodayMetrics(),
    getTodayProfitByHour(),
    getTodayOrders(),
    getTodayOrderedProducts(),
  ])

  return NextResponse.json({ metrics, profitByHour, orders, products })
}
