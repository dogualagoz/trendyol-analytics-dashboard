CLAUDE.md'deki formülü kullanarak kar hesaplama mantığını oluştur veya güncelle.

Formül:
Kar = Satış Tutarı - Komisyon - Kargo Payı - Hizmet Bedeli - Stopaj - Net KDV - Ürün Maliyeti - Ekstra Maliyet

Kullanıcının belirttiği context'e göre:
- `src/lib/calculations.ts` dosyasını oluştur veya güncelle
- Tam TypeScript tipleriyle fonksiyon yaz (types/index.ts'den import et)
- Her parametreyi ayrı argüman olarak al, magic number kullanma
- Birim testleri için örnek input/output yorum olarak değil, ayrı bir test dosyasında göster

Fonksiyon çıktısı: { profit, profitMargin, costRatio } dönsün.
