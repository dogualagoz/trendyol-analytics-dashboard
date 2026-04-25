Projedeki CLAUDE.md kurallarına uyarak yeni bir dashboard sayfası oluştur.

Kullanıcının belirttiği sayfa adı ve amacını al. Şunları oluştur:

1. `src/app/(dashboard)/<sayfa-adi>/page.tsx` — İnce sayfa bileşeni, veriyi server component ile çek
2. `src/app/api/<sayfa-adi>/route.ts` — İnce API route, iş mantığını lib'e delege et
3. `src/lib/<sayfa-adi>.ts` — İş mantığı ve Prisma sorguları burada

Kurallar:
- TypeScript strict, `any` kullanma
- Türkçe UI metinleri, İngilizce değişken/fonksiyon isimleri
- shadcn/ui bileşenlerini kullan (Card, Table vb.)
- API route sadece parse + lib çağrısı + response dönsün
- Prisma client'ı `lib/db.ts`'den import et

Oluşturduktan sonra sidebar'a (`src/components/layout/`) link eklemeyi hatırlat.
