// GEÇİCİ TEST SAYFASI — ürünlerin DB'ye doğru yazılıp yazılmadığını kontrol için

import db from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export default async function ProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orderItems: true } } },
  })

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">Ürünler</h2>
        <p className="text-sm text-[#574236] mt-0.5">
          DB'de <span className="font-semibold text-[#1a1c1c]">{products.length}</span> ürün var
        </p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E2E2] p-10 text-center">
          <p className="text-sm font-medium text-[#1a1c1c]">Henüz ürün yok</p>
          <p className="text-xs text-[#574236] mt-1">
            Siparişler sayfasından sync başlat.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">

          <div className="grid grid-cols-[60px_2fr_1fr_1fr_80px_100px] gap-4 px-5 py-3 border-b border-[#F4F4F4] bg-[#FAFAFA]">
            {["", "ÜRÜN", "BARKOD", "KATEGORİ", "SİPARİŞ", "MALİYET"].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[#F4F4F4]">
            {products.map((product) => (
              <div key={product.id} className="grid grid-cols-[60px_2fr_1fr_1fr_80px_100px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">

                {/* Görsel */}
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] overflow-hidden shrink-0">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#574236]">
                      {product.title.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Ad */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1a1c1c] truncate">{product.title}</p>
                  <p className="text-xs text-[#574236]">{product.brand ?? "—"}</p>
                </div>

                {/* Barkod */}
                <span className="text-xs text-[#574236] font-mono truncate">{product.barcode ?? "—"}</span>

                {/* Kategori */}
                <span className="text-sm text-[#574236] truncate">{product.category ?? "—"}</span>

                {/* Sipariş sayısı */}
                <span className="text-sm text-[#574236] tabular-nums">{product._count.orderItems}</span>

                {/* Maliyet */}
                <span className={`text-sm font-semibold tabular-nums ${product.costPrice ? "text-[#1a1c1c]" : "text-amber-500"}`}>
                  {product.costPrice ? formatCurrency(Number(product.costPrice)) : "Girilmedi"}
                </span>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
