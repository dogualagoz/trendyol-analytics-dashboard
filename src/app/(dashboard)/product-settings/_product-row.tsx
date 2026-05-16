"use client"

import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import type { ProductForSettings } from "@/lib/product-settings"
import { EditableCell } from "./_editable-cell"
import { ProductImage, DeliveryBadge, FabricCostCell } from "./_cells"
import { W, TD } from "./_styles"
import type { EditableField, SaveState } from "./_types"

export function ProductRow({
  product,
  isGroup,
  isSubRow = false,
  variantIndex,
  variantTotal,
  saveState,
  onSave,
  onApplyFabric,
}: {
  product: ProductForSettings
  isGroup: boolean
  variantIndex?: number
  variantTotal?: number
  saveState: SaveState
  onSave: (id: string, field: EditableField, val: number | null) => void
  onApplyFabric: (product: ProductForSettings) => void
  isSubRow?: boolean
}) {
  const state = saveState[product.id]

  return (
    <tr className={`transition-colors ${
      isSubRow
        ? "bg-white hover:bg-orange-50/20 border-l-2 border-l-[#F27A1A]/20"
        : "bg-white hover:bg-[#FAFAFA]"
    }`}>
      {/* Expand / status */}
      <td className={`${TD} ${W.expand} text-center h-16`}>
        {isGroup && variantIndex != null ? (
          <span className="inline-flex items-center justify-center text-[10px] font-bold text-[#8b7264] tabular-nums">
            {variantIndex}/{variantTotal}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-[#E2E2E2]" />
        )}
        {state === "saving" && <RefreshCw className="w-3 h-3 text-[#8b7264] animate-spin mx-auto mt-0.5" />}
        {state === "ok"     && <CheckCircle className="w-3 h-3 text-emerald-500 mx-auto mt-0.5" />}
        {state === "error"  && <AlertCircle className="w-3 h-3 text-red-500 mx-auto mt-0.5" />}
      </td>

      {/* Ürün Bilgisi */}
      <td className={`${TD} ${W.info} h-16`}>
        <div className="flex items-center gap-2.5">
          <ProductImage src={product.imageUrl} title={product.title} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1a1c1c] truncate" style={{ maxWidth: 200 }}>{product.title}</p>
            <p className="text-xs text-[#8b7264] mt-0.5">
              {[product.color, product.size].filter(Boolean).join(" · ") || product.category || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Barkod */}
      <td className={`${TD} ${W.barcode}`}>
        <span className="text-xs text-[#574236] font-mono truncate block">{product.barcode ?? "—"}</span>
      </td>

      {/* Ürün Maliyeti */}
      <td className={`${TD} ${W.costPrice} py-1.5`}>
        <EditableCell value={product.costPrice} suffix="₺" allowNull
          onSave={v => onSave(product.id, "costPrice", v)} />
      </td>

      {/* Kumaş Maliyeti — boyuttan otomatik hesap */}
      <td className={`${TD} ${W.fabricCost} py-1.5`}>
        <FabricCostCell product={product} onApply={() => onApplyFabric(product)} />
      </td>

      {/* Maliyet KDV Oranı */}
      <td className={`${TD} ${W.costKdvRate} py-1.5`}>
        <EditableCell value={product.costKdvRate} suffix="%" step="1"
          onSave={v => v != null && onSave(product.id, "costKdvRate", v)} />
      </td>

      {/* Desi */}
      <td className={`${TD} ${W.desi} py-1.5`}>
        <EditableCell value={product.desi} step="0.1"
          onSave={v => v != null && onSave(product.id, "desi", v)} />
      </td>

      {/* Ekstra Gider */}
      <td className={`${TD} ${W.extraCost} py-1.5`}>
        <EditableCell value={product.extraCost} suffix="₺"
          onSave={v => v != null && onSave(product.id, "extraCost", v)} />
      </td>

      {/* Marka */}
      <td className={`${TD} ${W.brand}`}>
        <span className="text-xs text-[#574236] truncate block">{product.brand ?? "—"}</span>
      </td>

      {/* Model Kodu */}
      <td className={`${TD} ${W.modelCode}`}>
        <span className="text-xs text-[#574236] font-mono truncate block">{product.modelCode ?? "—"}</span>
      </td>

      {/* Renk */}
      <td className={`${TD} ${W.color}`}>
        {product.color
          ? <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{product.color}</span>
          : <span className="text-[#d1cac5] text-xs">—</span>
        }
      </td>

      {/* Beden */}
      <td className={`${TD} ${W.size}`}>
        {product.size
          ? <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{product.size}</span>
          : <span className="text-[#d1cac5] text-xs">—</span>
        }
      </td>

      {/* Stok */}
      <td className={`${TD} ${W.stock}`}>
        <span className={`text-sm tabular-nums font-semibold ${product.stockQty === 0 ? "text-red-400" : "text-[#1a1c1c]"}`}>
          {product.stockQty.toLocaleString("tr-TR")}
        </span>
      </td>

      {/* İade Oranı */}
      <td className={`${TD} ${W.returnRate}`}>
        {product.returnRate != null
          ? <span className="text-xs tabular-nums text-[#574236] font-medium">%{product.returnRate.toFixed(1)}</span>
          : <span className="text-[#d1cac5] text-xs">—</span>
        }
      </td>

      {/* Teslimat Tipi */}
      <td className={`${TD} ${W.deliveryType}`}>
        <DeliveryBadge value={product.deliveryType} />
      </td>
    </tr>
  )
}
