// GEÇİCİ TEST SAYFASI — API bağlantısını doğrulamak için
// Gerçek siparişler sayfası daha sonra buraya gelecek

import db from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { SyncButton } from "./_sync-button"

export default async function OrdersPage() {
  // DB'deki siparişleri çek — en yeniler önce
  const orders = await db.order.findMany({
    orderBy: { orderDate: "desc" },
    take: 50,
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return (
    <div className="space-y-6">

      {/* Başlık + Sync */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1a1c1c]">Siparişler</h2>
          <p className="text-sm text-[#574236] mt-0.5">
            DB'de <span className="font-semibold text-[#1a1c1c]">{orders.length}</span> sipariş var
          </p>
        </div>
        {/* Veriyi çekmek için butona bas */}
        <SyncButton />
      </div>

      {/* Veri yoksa yönlendirme */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E2E2] p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#1a1c1c]">Henüz sipariş yok</p>
          <p className="text-xs text-[#574236]">
            Önce Ayarlar sayfasından API bilgilerini gir, sonra "Trendyol&apos;dan Çek" butonuna bas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Tablo başlığı */}
          <div className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 px-5 py-3 border-b border-[#F4F4F4] bg-[#FAFAFA]">
            {["SİPARİŞ NO", "TARİH", "DURUM", "TUTAR", "KALEM"].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">
                {h}
              </span>
            ))}
          </div>

          {/* Satırlar */}
          <div className="divide-y divide-[#F4F4F4]">
            {orders.map((order) => {
              const totalProfit = order.items.reduce(
                (sum, item) => sum + (item.profit ? Number(item.profit) : 0),
                0
              )

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors"
                >
                  {/* Sipariş No */}
                  <div>
                    <p className="text-sm font-medium text-[#1a1c1c] font-mono">
                      {order.trendyolOrderId}
                    </p>
                    {/* Kar bilgisi */}
                    <p className={`text-xs mt-0.5 ${totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      Kar: {formatCurrency(totalProfit)}
                    </p>
                  </div>

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
                    {order.status}
                  </span>

                  {/* Tutar */}
                  <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">
                    {formatCurrency(Number(order.grossAmount))}
                  </span>

                  {/* Kalem sayısı */}
                  <span className="text-sm text-[#574236] tabular-nums">
                    {order.items.length} kalem
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
