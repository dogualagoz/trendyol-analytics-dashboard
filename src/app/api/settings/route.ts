import { NextResponse } from "next/server"
import { getSetting, setSetting } from "@/lib/settings"

// Yönettiğimiz ayar anahtarları — sadece bu key'ler okunur/yazılır
const KEYS = [
  "trendyol_api_key",
  "trendyol_api_secret",
  "trendyol_seller_id",
  "trendyol_integration_ref",
  "sync_interval",
  "cargo_tier_1",
  "cargo_tier_2",
  "cargo_tier_3",
] as const

// GET /api/settings — mevcut ayarları döner, sayfa açılınca formu doldurmak için kullanılır
export async function GET() {
  // Her key için DB'den paralel okuma yapıp { key: value } objesine çevir
  const entries = await Promise.all(
    KEYS.map(async (key) => [key, await getSetting(key)])
  )
  return NextResponse.json(Object.fromEntries(entries))
}

// POST /api/settings — form verilerini alır, DB'ye kaydeder
export async function POST(req: Request) {
  const body = await req.json()

  // Sadece body'de gelen key'leri güncelle, gönderilmeyenlere dokunma
  await Promise.all(
    KEYS.filter((key) => body[key] !== undefined).map((key) =>
      setSetting(key, String(body[key]))
    )
  )

  return NextResponse.json({ success: true })
}
