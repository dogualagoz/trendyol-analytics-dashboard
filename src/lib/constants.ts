// Trendyol API ve iş mantığı sabitleri.
// Hesaplamalarda sihirli sayı kullanma — buradan import et.

// ─── Trendyol API Limitleri ───────────────────────────────────────────────────

export const ORDER_MAX_RANGE_MS      = 14 * 24 * 60 * 60 * 1000  // Orders API: max 14 gün
export const SETTLEMENT_MAX_RANGE_MS = 15 * 24 * 60 * 60 * 1000  // Settlements API: max 15 gün

// ─── Yasal Kesinti Oranları ───────────────────────────────────────────────────

export const KDV_RATE       = 0.10  // %10 — Trendyol'un komisyon üzerinden kestiği hizmet KDV'si
export const STOPAJ_RATE    = 0.01  // %1  — net ciro üzerinden gelir vergisi stopajı
export const CARGO_KDV_RATE = 0.20  // %20 — kargo faturasına eklenen KDV oranı

// ─── Kargo Barem Sınırları ────────────────────────────────────────────────────

export const CARGO_TIER_2_MIN = 200   // 200 TL ve üzeri → 2. barem
export const CARGO_TIER_3_MIN = 350   // 350 TL ve üzeri → 3. barem

// ─── Varsayılan Sync Aralığı ──────────────────────────────────────────────────

export const DEFAULT_SYNC_INTERVAL_MIN = 30  // dakika
export const DEFAULT_SYNC_LOOKBACK_DAYS = 90 // force resync geriye kaç gün gider
