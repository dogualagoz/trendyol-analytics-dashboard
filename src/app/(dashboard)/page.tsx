import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  ShoppingBag,
  Percent,
  Tag,
  BarChart2,
  RefreshCw,
} from "lucide-react"
import { ProfitChart } from "@/components/charts/profit-chart"
import { CostDistributionChart } from "@/components/charts/cost-distribution-chart"
import {
  mockSummaryMetrics,
  mockProfitPerformance,
  mockCostDistribution,
  mockProductMetrics,
  mockOrderMetrics,
} from "@/lib/mock/dashboard"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils"

// ── Tip tanımları ─────────────────────────────────────────────────────────────

type MetricCardProps = {
  title: string
  value: string
  trend?: number
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

type StatRowProps = {
  label: string
  value: string
}

// ── Alt bileşenler ─────────────────────────────────────────────────────────────

function MetricCard({ title, value, trend, icon: Icon, iconBg, iconColor }: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend).toFixed(1).replace(".", ",")}%</span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-[#574236] mt-4 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-bold text-[#1a1c1c] mt-1 tabular-nums leading-tight">
        {value}
      </p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
      <h3 className="text-sm font-semibold text-[#1a1c1c] mb-4">{title}</h3>
      {children}
    </div>
  )
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F4F4F4] last:border-0">
      <span className="text-sm text-[#574236]">{label}</span>
      <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">{value}</span>
    </div>
  )
}

// ── Sayfa ──────────────────────────────────────────────────────────────────────

const DATE_FILTERS = ["Bu Hafta", "Bu Ay", "Son 3 Ay"] as const

export default function DashboardPage() {
  const m = mockSummaryMetrics
  const t = m.trends

  return (
    <div className="space-y-6">

      {/* Başlık + Filtreler */}
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
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                i === 1
                  ? "bg-[#F27A1A] border-[#F27A1A] text-white"
                  : "bg-white border-[#E2E2E2] text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A]"
              }`}
            >
              {label}
            </button>
          ))}
          <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-[#E2E2E2] text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors ml-1">
            <RefreshCw className="w-3 h-3" />
            Güncelle
          </button>
        </div>
      </div>

      {/* Ana KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
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

      {/* İkincil KPI — Maliyeti Olan Ciro + Kar/Maliyet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <MetricCard
          title="Maliyeti Olan Ciro"
          value={formatCurrency(m.costableRevenue)}
          icon={Tag}
          iconBg="#FFF4E8"
          iconColor="#F27A1A"
        />
        <MetricCard
          title="Kar / Ürün Maliyeti Oranı"
          value={formatPercent(m.profitToCostRatio)}
          icon={BarChart2}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Kar Performansı — geniş kart (2/3) */}
        <SectionCard title="Kar Performansı — Son 30 Gün">
          <ProfitChart data={mockProfitPerformance} />
        </SectionCard>

        {/* Maliyet Dağılımı — dar kart (1/3) */}
        <SectionCard title="Maliyet Dağılımı">
          <CostDistributionChart data={mockCostDistribution} />
        </SectionCard>
      </div>

      {/* Alt Metrik Tabloları */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <SectionCard title="Ürün Metrikleri">
          <StatRow label="Net Satış Adedi"                 value={formatNumber(mockProductMetrics.netSalesCount)} />
          <StatRow label="Ürün Başına Ort. Satış Tutarı"   value={formatCurrency(mockProductMetrics.avgRevenuePerProduct)} />
          <StatRow label="Ürün Başına Ort. Kar"            value={formatCurrency(mockProductMetrics.avgProfitPerProduct)} />
          <StatRow label="Ürün Başına Ort. Kargo Maliyeti" value={formatCurrency(mockProductMetrics.avgCargoPerProduct)} />
          <StatRow label="Ort. Komisyon Oranı"             value={formatPercent(mockProductMetrics.avgCommissionRate)} />
          <StatRow label="Ort. İndirim Oranı"              value={formatPercent(mockProductMetrics.avgDiscountRate)} />
        </SectionCard>

        <SectionCard title="Sipariş Metrikleri">
          <StatRow label="Sipariş Sayısı"                    value={formatNumber(mockOrderMetrics.orderCount)} />
          <StatRow label="Sipariş Başına Ort. Satış Tutarı"  value={formatCurrency(mockOrderMetrics.avgRevenuePerOrder)} />
          <StatRow label="Sipariş Başına Ort. Kar"           value={formatCurrency(mockOrderMetrics.avgProfitPerOrder)} />
          <StatRow label="Sipariş Başına Ort. Kargo"         value={formatCurrency(mockOrderMetrics.avgCargoPerOrder)} />
        </SectionCard>

      </div>
    </div>
  )
}
