export const mockSummaryMetrics = {
  totalRevenue: 284_350,
  costableRevenue: 198_200,
  netProfit: 52_480,
  profitToSalesRatio: 18.5,
  profitToCostRatio: 26.5,
  orderCount: 312,
  trends: {
    totalRevenue: 12.4,
    netProfit: 8.2,
    orderCount: 5.1,
    profitToSalesRatio: -0.8,
  },
}

export const mockProfitPerformance = [
  { date: "1 Nis", revenue: 7_200,  profit: 1_310 },
  { date: "3 Nis", revenue: 9_100,  profit: 1_680 },
  { date: "5 Nis", revenue: 8_450,  profit: 1_520 },
  { date: "7 Nis", revenue: 11_200, profit: 2_100 },
  { date: "9 Nis", revenue: 10_300, profit: 1_870 },
  { date: "11 Nis", revenue: 9_800, profit: 1_760 },
  { date: "13 Nis", revenue: 12_400, profit: 2_300 },
  { date: "15 Nis", revenue: 14_100, profit: 2_680 },
  { date: "17 Nis", revenue: 13_200, profit: 2_440 },
  { date: "19 Nis", revenue: 11_900, profit: 2_180 },
  { date: "21 Nis", revenue: 15_300, profit: 2_850 },
  { date: "23 Nis", revenue: 16_800, profit: 3_120 },
  { date: "25 Nis", revenue: 18_200, profit: 3_380 },
  { date: "27 Nis", revenue: 17_100, profit: 3_170 },
  { date: "29 Nis", revenue: 19_500, profit: 3_620 },
]

export const mockCostDistribution = [
  { name: "Ürün Maliyeti",  value: 98_400, color: "#F27A1A" },
  { name: "Komisyon",       value: 42_300, color: "#00D1FF" },
  { name: "Kargo",          value: 28_500, color: "#7C3AED" },
  { name: "Hizmet Bedeli",  value: 12_200, color: "#FF7F5D" },
  { name: "Stopaj",         value: 4_800,  color: "#1E293B" },
  { name: "KDV",            value: 6_100,  color: "#10B981" },
  { name: "Ekstra",         value: 2_300,  color: "#F59E0B" },
]

export const mockProductMetrics = {
  netSalesCount: 428,
  avgRevenuePerProduct: 664,
  avgProfitPerProduct: 122,
  avgCargoPerProduct: 66,
  avgCommissionRate: 14.9,
  avgDiscountRate: 8.3,
}

export const mockOrderMetrics = {
  orderCount: 312,
  avgRevenuePerOrder: 911,
  avgProfitPerOrder: 168,
  avgCargoPerOrder: 42,
}

export const mockTopProducts = [
  {
    id: "1",
    name: "Erkek Slim Fit Pamuk Gömlek",
    sku: "EG-SL-001",
    category: "Giyim",
    status: "IN_STOCK" as const,
    unitsSold: 342,
    revenue: 28_500,
  },
  {
    id: "2",
    name: "Kadın Oversize Sweatshirt",
    sku: "KO-SW-084",
    category: "Giyim",
    status: "LOW_STOCK" as const,
    unitsSold: 189,
    revenue: 18_710,
  },
  {
    id: "3",
    name: "Unisex Spor Koşu Ayakkabısı",
    sku: "UA-KA-042",
    category: "Ayakkabı",
    status: "IN_STOCK" as const,
    unitsSold: 124,
    revenue: 14_880,
  },
  {
    id: "4",
    name: "Deri Kemer — Kahverengi",
    sku: "DK-KH-011",
    category: "Aksesuar",
    status: "IN_STOCK" as const,
    unitsSold: 97,
    revenue: 8_245,
  },
  {
    id: "5",
    name: "Çocuk Kapüşonlu Polar Mont",
    sku: "CK-PL-033",
    category: "Çocuk",
    status: "OUT_OF_STOCK" as const,
    unitsSold: 63,
    revenue: 6_615,
  },
]
