import db from "@/lib/db"
import { recalcOrderItemProfit } from "@/lib/calculations"
import { formatCurrency } from "@/lib/utils"
import { Prisma } from "@/generated/prisma/client"
import { SyncButton } from "./_sync-button"
import { OrderFilterBar } from "./_filter-bar"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function str(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const search   = str(sp.search)
  const status   = str(sp.status)
  const dateFrom = str(sp.dateFrom)
  const dateTo   = str(sp.dateTo)
  const sortBy   = str(sp.sortBy)   ?? "orderDate"
  const sortDir  = (str(sp.sortDir) ?? "desc") as "asc" | "desc"

  // WHERE koşulu
  const where: Prisma.OrderWhereInput = {}
  if (status) where.status = status
  if (dateFrom || dateTo) {
    where.orderDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo   && { lte: new Date(`${dateTo}T23:59:59`) }),
    }
  }
  if (search) {
    where.OR = [
      { trendyolOrderId: { contains: search, mode: "insensitive" } },
      { items: { some: { product: { title: { contains: search, mode: "insensitive" } } } } },
    ]
  }

  // ORDER BY
  const validSorts: Record<string, Prisma.OrderOrderByWithRelationInput> = {
    orderDate:   { orderDate:   sortDir },
    grossAmount: { grossAmount: sortDir },
  }
  const orderBy = validSorts[sortBy] ?? { orderDate: "desc" }

  const orders = await db.order.findMany({
    where,
    orderBy,
    include: {
      items: { include: { product: true } },
    },
  })

  // Durum sayaçları (filtre pill'ları için bilgi) — tüm kayıtlar üzerinde
  const totalAll = await db.order.count()

  return (
    <div className="space-y-4">

      {/* Başlık + Sync */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1a1c1c]">Siparişler</h2>
          <p className="text-sm text-[#574236] mt-0.5">
            <span className="font-semibold text-[#1a1c1c]">{orders.length}</span> sipariş gösteriliyor
            {orders.length !== totalAll && (
              <span className="text-[#8b7264]"> (toplam {totalAll})</span>
            )}
          </p>
        </div>
        <SyncButton />
      </div>

      <OrderFilterBar />

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E2E2] p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#1a1c1c]">Sipariş bulunamadı</p>
          <p className="text-xs text-[#574236]">
            Filtreleri değiştirin ya da Trendyol&apos;dan Çek butonuna basın.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Tablo başlığı */}
          <div className="grid grid-cols-[48px_2fr_1fr_120px_110px_100px] gap-4 px-5 py-3 border-b border-[#F4F4F4] bg-[#FAFAFA]">
            {["", "ÜRÜN / SİPARİŞ NO", "KAR", "TARİH", "DURUM", "TUTAR"].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">
                {h}
              </span>
            ))}
          </div>

          {/* Satırlar */}
          <div className="divide-y divide-[#F4F4F4]">
            {orders.map((order) => {
              const totalProfit = order.items.reduce((sum, item) => {
                const costPrice = item.product?.costPrice ? Number(item.product.costPrice) : 0
                return sum + recalcOrderItemProfit(item, costPrice)
              }, 0)

              const firstProduct = order.items[0]?.product
              const extraCount   = order.items.length - 1

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[48px_2fr_1fr_120px_110px_100px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors"
                >
                  {/* Ürün görseli */}
                  <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] overflow-hidden shrink-0">
                    {firstProduct?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstProduct.imageUrl} alt={firstProduct.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#574236]">
                        {firstProduct?.title?.charAt(0) ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* Ürün adı + sipariş no */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1a1c1c] truncate">
                      {firstProduct?.title ?? "—"}
                      {extraCount > 0 && (
                        <span className="ml-1.5 text-xs text-[#574236] font-normal">+{extraCount} ürün</span>
                      )}
                    </p>
                    <p className="text-xs text-[#574236] font-mono mt-0.5">{order.trendyolOrderId}</p>
                  </div>

                  {/* Kar */}
                  <span className={`text-sm font-semibold tabular-nums ${totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(totalProfit)}
                  </span>

                  {/* Tarih */}
                  <span className="text-sm text-[#574236]">
                    {order.orderDate.toLocaleDateString("tr-TR")}
                  </span>

                  {/* Durum */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${
                    order.status === "Delivered"  ? "bg-emerald-50 text-emerald-600" :
                    order.status === "Cancelled"  ? "bg-red-50 text-red-500"        :
                    order.status === "Returned"   ? "bg-amber-50 text-amber-600"    :
                                                    "bg-blue-50 text-blue-600"
                  }`}>
                    {order.status === "Delivered" ? "Teslim Edildi" :
                     order.status === "Cancelled" ? "İptal"         :
                     order.status === "Returned"  ? "İade"          :
                     order.status}
                  </span>

                  {/* Tutar */}
                  <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">
                    {formatCurrency(Number(order.grossAmount))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
