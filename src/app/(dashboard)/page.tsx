import {
  TrendingUp, TrendingDown, Banknote, Wallet, ShoppingBag,
  Percent, BarChart2, ArrowRight,
} from "lucide-react"
import { ProfitChart }           from "@/components/charts/profit-chart"
import { CostDistributionChart } from "@/components/charts/cost-distribution-chart"
import { ProfitFunnelChart }     from "@/components/charts/funnel-chart"
import {
  getSummaryMetrics,
  getProfitPerformance,
  getCostDistribution,
  getTopProducts,
  getProductMetrics,
  getOrderMetrics,
  getProfitFunnel,
} from "@/lib/dashboard"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils"
import { DashboardHeader } from "./_dashboard-header"

// ── Sabitler ──────────────────────────────────────────────────────────────────

const RANGE_DAYS: Record<string, number> = {
  week:    7,
  month:   30,
  quarter: 90,
  year:    365,
}

// ── Bileşenler ────────────────────────────────────────────────────────────────

type MetricCardProps = {
  title:     string
  value:     string
  trend:     number
  icon:      React.ElementType
  iconBg:    string
  iconColor: string
}

// KPI kartı — design.md label-caps + data-tabular + error-container trend renkleri
function MetricCard({ title, value, trend, icon: Icon, iconBg, iconColor }: MetricCardProps) {
  const isPos     = trend >= 0
  const TrendIcon = isPos ? TrendingUp : TrendingDown

  return (
    <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4">
      {/* label-caps: 11px / 700 / uppercase / 0.05em tracking */}
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold text-[#574236] uppercase tracking-[0.05em] leading-none">
          {title}
        </p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
        </div>
      </div>

      {/* data-tabular: tabular-nums, font-bold */}
      <p className="text-[1.75rem] font-bold text-[#1a1c1c] tabular-nums leading-none">{value}</p>

      {/* Chip/status — design.md: low-saturation bg + high-saturation text
          Pozitif: emerald    |   Negatif: error-container / on-error-container */}
      <span className={`self-start inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
        isPos
          ? "bg-emerald-50 text-emerald-700"
          : "bg-[#ffdad6] text-[#93000a]"
      }`}>
        <TrendIcon className="w-3 h-3" />
        {isPos ? "+" : ""}{Math.abs(trend).toFixed(1).replace(".", ",")}%
      </span>
    </div>
  )
}

type MetricsListItem = { label: string; value: string; highlight?: boolean }

function MetricsList({ items }: { items: MetricsListItem[] }) {
  return (
    <div className="divide-y divide-[#F4F4F4]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
          {/* body-sm: 13px / 400 */}
          <span className="text-[13px] text-[#574236]">{item.label}</span>
          {/* data-tabular: 14px / 500 / tnum */}
          <span className={`text-[14px] font-medium tabular-nums ${
            item.highlight ? "text-[#F27A1A]" : "text-[#1a1c1c]"
          }`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const range     = searchParams.range ?? "month"
  const days      = RANGE_DAYS[range] ?? 30
  const endDate   = new Date()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [
    summary, profitPerformance, costDistribution, topProducts,
    productMetrics, orderMetrics, profitFunnel,
  ] = await Promise.all([
    getSummaryMetrics(startDate, endDate),
    getProfitPerformance(startDate, endDate),
    getCostDistribution(startDate, endDate),
    getTopProducts(startDate, endDate),
    getProductMetrics(startDate, endDate),
    getOrderMetrics(startDate, endDate),
    getProfitFunnel(startDate, endDate),
  ])

  const t = summary.trends
  const dateLabel = `${startDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} — ${endDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div className="space-y-6">

      {/* Başlık + Tarih Filtreleri */}
      <DashboardHeader range={range} />

      {/* ── 5 KPI Kartı ───────────────────────────────────────────────────────
          design.md icon renkleri:
            Ciro / Maliyeti Olan Ciro → primary-fixed (#ffdbc8) + primary (#984700)
            Kâr Tutarı                → tertiary-fixed (#b7eaff) + tertiary (#00677f)
            Kâr / Satış               → violet data-viz (#ede9fe + #7C3AED)
            Kâr / Ürün Maliyeti       → secondary-fixed (#d8e3fb) + on-secondary-fixed-variant (#3c475a)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <MetricCard
          title="Toplam Ciro"
          value={formatCurrency(summary.totalRevenue)}
          trend={t.totalRevenue}
          icon={Banknote}
          iconBg="#ffdbc8" iconColor="#984700"
        />
        <MetricCard
          title="Maliyeti Olan Ciro"
          value={formatCurrency(summary.revenueWithCost)}
          trend={t.revenueWithCost}
          icon={BarChart2}
          iconBg="#ffdbc8" iconColor="#984700"
        />
        <MetricCard
          title="Kâr Tutarı"
          value={formatCurrency(summary.netProfit)}
          trend={t.netProfit}
          icon={Wallet}
          iconBg="#b7eaff" iconColor="#00677f"
        />
        <MetricCard
          title="Kâr / Satış Oranı"
          value={formatPercent(summary.profitToSalesRatio)}
          trend={t.profitToSalesRatio}
          icon={Percent}
          iconBg="#ede9fe" iconColor="#7C3AED"
        />
        <MetricCard
          title="Kâr / Ürün Maliyeti"
          value={formatPercent(summary.profitToProductCostRatio)}
          trend={t.profitToProductCostRatio}
          icon={TrendingUp}
          iconBg="#d8e3fb" iconColor="#3c475a"
        />
      </div>

      {/* ── Maliyet Dağılımı — tam genişlik ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
        <div className="mb-5">
          <h3 className="text-[14px] font-semibold text-[#1a1c1c]">Maliyet Dağılımı (₺)</h3>
          <p className="text-[13px] text-[#574236] mt-1">{dateLabel}</p>
        </div>
        <CostDistributionChart data={costDistribution} />
      </div>

      {/* ── Kâr Performansı + Ürün Metrikleri ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[14px] font-semibold text-[#1a1c1c]">Kâr Performansı</h3>
          <p className="text-[13px] text-[#574236] mt-1 mb-4">{dateLabel}</p>
          <ProfitChart data={profitPerformance} />
        </div>

        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[14px] font-semibold text-[#1a1c1c] mb-5">Ürün Metrikleri</h3>
          <MetricsList items={[
            { label: "Net Satış Adedi",                 value: `${formatNumber(productMetrics.netUnitsSold)} adet`, highlight: true },
            { label: "Ürün başına satış tutarı",        value: formatCurrency(productMetrics.avgRevenuePerUnit) },
            { label: "Ürün başına ortalama kâr",        value: formatCurrency(productMetrics.avgProfitPerUnit) },
            { label: "Ürün başına ort. kargo maliyeti", value: formatCurrency(productMetrics.avgCargoPerUnit) },
            { label: "Ortalama komisyon oranı",         value: formatPercent(productMetrics.avgCommissionRate) },
            { label: "Ortalama indirim oranı",          value: formatPercent(productMetrics.avgDiscountRate) },
          ]} />
        </div>

      </div>

      {/* ── Net Kâr Performansı + Sipariş Metrikleri ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[14px] font-semibold text-[#1a1c1c]">Net Kâr Performansı</h3>
          <p className="text-[13px] text-[#574236] mt-1 mb-4">Gelirden kâra giden adımlar</p>
          <ProfitFunnelChart data={profitFunnel} />
        </div>

        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[14px] font-semibold text-[#1a1c1c] mb-5">Sipariş Metrikleri</h3>
          <MetricsList items={[
            { label: "Sipariş Sayısı",                     value: `${formatNumber(orderMetrics.orderCount)} adet`, highlight: true },
            { label: "Sipariş başına satış tutarı",        value: formatCurrency(orderMetrics.avgRevenuePerOrder) },
            { label: "Sipariş başına ortalama kâr",        value: formatCurrency(orderMetrics.avgProfitPerOrder) },
            { label: "Sipariş başına ort. kargo maliyeti", value: formatCurrency(orderMetrics.avgCargoPerOrder) },
          ]} />
        </div>

      </div>

      {/* ── En İyi Ürünler ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[14px] font-semibold text-[#1a1c1c]">En İyi Performans Gösteren Ürünler</h3>
            <p className="text-[13px] text-[#574236] mt-1">Seçili dönemin en yüksek gelir üreticileri</p>
          </div>
          <a
            href="/products"
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#F27A1A] hover:text-[#984700] uppercase tracking-[0.05em] transition-colors"
          >
            Tümünü Gör
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Tablo başlığı — label-caps */}
        <div className="grid grid-cols-[2fr_1fr_80px_90px] gap-4 px-3 pb-3 border-b border-[#E2E2E2]">
          {["ÜRÜN", "KATEGORİ", "SATILAN", "GELİR"].map((h) => (
            <span key={h} className="text-[11px] font-bold text-[#574236] uppercase tracking-[0.05em]">
              {h}
            </span>
          ))}
        </div>

        <div className="divide-y divide-[#F4F4F4]">
          {topProducts.length === 0 ? (
            <p className="text-[13px] text-[#574236] text-center py-10">
              Bu dönemde henüz sipariş verisi yok.
            </p>
          ) : (
            topProducts.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[2fr_1fr_80px_90px] gap-4 items-center px-3 py-4 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#ffdbc8] flex items-center justify-center shrink-0 text-sm font-bold text-[#984700]">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[14px] font-medium text-[#1a1c1c] truncate">{product.name}</p>
                </div>
                <span className="text-[13px] text-[#574236]">{product.category ?? "—"}</span>
                <span className="text-[14px] font-medium text-[#1a1c1c] tabular-nums">{formatNumber(product.unitsSold)}</span>
                <span className="text-[14px] font-medium text-[#1a1c1c] tabular-nums">{formatCurrency(product.revenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
