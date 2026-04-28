import db from "@/lib/db"

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}