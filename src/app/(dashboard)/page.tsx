import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  ShoppingBag,
  Percent,
  RefreshCw,
  ArrowRight,
} from "lucide-react"
import { ProfitChart } from "@/components/charts/profit-chart"
import { CostDistributionChart } from "@/components/charts/cost-distribution-chart"
import {
  mockSummaryMetrics,
  mockProfitPerformance,
  mockCostDistribution,
  mockTopProducts,
} from "@/lib/mock/dashboard"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils"

// ── Tip tanımları ────────────────────────────────────────────────

type MetricCardProps = {
  title: string
  value: string
  trend: number
  trendLabel?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

// ── Metrik Kartı ─────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  trend,
  trendLabel = "geçen aya göre",
  icon: Icon,
  iconBg,
  iconColor,
}: MetricCardProps) {
  const isPositive = trend >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-3">
      {/* Üst: başlık + ikon */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#574236] uppercase tracking-wide leading-none">
          {title}
        </p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
      </div>

      {/* Değer */}
      <p className="text-[1.6rem] font-bold text-[#1a1c1c] tabular-nums leading-none">
        {value}
      </p>

      {/* Trend */}
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}
        >
          <TrendIcon className="w-3 h-3" />
          {isPositive ? "+" : ""}{Math.abs(trend).toFixed(1).replace(".", ",")}%
        </span>
        <span className="text-xs text-[#574236]">{trendLabel}</span>
      </div>
    </div>
  )
}

// ── Ürün Durumu Badge ─────────────────────────────────────────────

const STATUS_MAP = {
  IN_STOCK:     { label: "Stokta Var",  cls: "bg-emerald-50 text-emerald-600" },
  LOW_STOCK:    { label: "Az Stok",     cls: "bg-amber-50 text-amber-600" },
  OUT_OF_STOCK: { label: "Tükendi",     cls: "bg-red-50 text-red-500" },
} as const

function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const { label, cls } = STATUS_MAP[status]
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ── Sayfa ─────────────────────────────────────────────────────────

const DATE_FILTERS = ["Bu Hafta", "Bu Ay", "Son 3 Ay"] as const

export default function DashboardPage() {
  const m = mockSummaryMetrics
  const t = m.trends

  return (
    <div className="space-y-6">

      {/* Başlık + Tarih Filtreleri */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#1a1c1c]">Genel Bakış</h2>
          <p className="text-sm text-[#574236] mt-0.5">
            Tüm satış ve karlılık metrikleriniz
          </p>
        </div>
        <div className="flex items-center gap-2">
          {DATE_FILTERS.map((label, i) => (
            <button
              key={label}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                i === 1
                  ? "bg-[#F27A1A] border-[#F27A1A] text-white"
                  : "bg-white border-[#E2E2E2] text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A]"
              }`}
            >
              {label}
            </button>
          ))}
          <button className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white border border-[#E2E2E2] text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors ml-1">
            <RefreshCw className="w-3 h-3" />
            Güncelle
          </button>
        </div>
      </div>

      {/* 4 Ana KPI Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Toplam Ciro"
          value={formatCurrency(m.totalRevenue)}
          trend={t.totalRevenue}
          icon={Banknote}
          iconBg="#FFF4E8"
          iconColor="#F27A1A"
        />
        <MetricCard
          title="Net Kar"
          value={formatCurrency(m.netProfit)}
          trend={t.netProfit}
          icon={Wallet}
          iconBg="#ECFDF5"
          iconColor="#059669"
        />
        <MetricCard
          title="Sipariş Sayısı"
          value={formatNumber(m.orderCount)}
          trend={t.orderCount}
          icon={ShoppingBag}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
        />
        <MetricCard
          title="Kar / Satış Oranı"
          value={formatPercent(m.profitToSalesRatio)}
          trend={t.profitToSalesRatio}
          icon={Percent}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
        />
      </div>

      {/* Grafik Bölümü: Kar Performansı (2/3) + Maliyet Dağılımı (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Kar Performansı — 2 kolon */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-[#1a1c1c]">Kar Performansı</h3>
              <p className="text-xs text-[#574236] mt-0.5">Son 30 Güne Genel Bakış</p>
            </div>
            <button className="text-xs text-[#574236] border border-[#E2E2E2] rounded-lg px-3 py-1.5 hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors">
              Son 30 Gün ▾
            </button>
          </div>
          <ProfitChart data={mockProfitPerformance} />
        </div>

        {/* Maliyet Dağılımı — 1 kolon */}
        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
          <div className="mb-1">
            <h3 className="text-sm font-semibold text-[#1a1c1c]">Maliyet Dağılımı</h3>
            <p className="text-xs text-[#574236] mt-0.5">Bu Ay</p>
          </div>
          <CostDistributionChart data={mockCostDistribution} />
        </div>
      </div>

      {/* En İyi Performans Gösteren Ürünler */}
      <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1a1c1c]">En İyi Performans Gösteren Ürünler</h3>
            <p className="text-xs text-[#574236] mt-0.5">Bu haftanın en yüksek gelir üreticileri</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-[#F27A1A] hover:text-[#984700] transition-colors">
            Tüm Envanteri Görüntüle
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tablo başlığı */}
        <div className="grid grid-cols-[2fr_1fr_1fr_80px_90px] gap-4 px-3 pb-2 border-b border-[#F4F4F4]">
          {["ÜRÜN", "KATEGORİ", "DURUM", "SATILAN", "GELİR"].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>

        {/* Satırlar */}
        <div className="divide-y divide-[#F4F4F4]">
          {mockTopProducts.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-[2fr_1fr_1fr_80px_90px] gap-4 items-center px-3 py-3.5 hover:bg-[#FAFAFA] transition-colors"
            >
              {/* Ürün: avatar + ad + SKU */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#F4F4F4] flex items-center justify-center shrink-0 text-sm font-bold text-[#574236]">
                  {product.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1a1c1c] truncate">{product.name}</p>
                  <p className="text-xs text-[#574236]">SKU: {product.sku}</p>
                </div>
              </div>

              {/* Kategori */}
              <span className="text-sm text-[#574236]">{product.category}</span>

              {/* Durum */}
              <StatusBadge status={product.status} />

              {/* Satılan */}
              <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">
                {formatNumber(product.unitsSold)}
              </span>

              {/* Gelir */}
              <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">
                {formatCurrency(product.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
