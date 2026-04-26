Son commit'ten bu yana yapılan değişiklikleri analiz edip Conventional Commits standardına uygun bir commit mesajı oluştur. Commit'i atmadan önce onay iste.

## Adımlar

1. `git diff HEAD` ve `git status` çalıştır — staged ve unstaged tüm değişiklikleri gör
2. Değişiklikleri analiz et:
   - Hangi dosyalar değişmiş?
   - Ne tür değişiklikler? (yeni özellik, hata düzeltme, refactor, yapılandırma vb.)
   - Hangi modülü/sayfayı etkiliyor? (dashboard, urunler, siparisler, sync, auth vb.)
3. Aşağıdaki formatta commit mesajı oluştur:

```
<tip>(<kapsam>): <kısa özet>

- <değişiklik 1>
- <değişiklik 2>
- <değişiklik 3>
```

## Conventional Commits Tipleri

| Tip | Ne zaman |
|---|---|
| `feat` | Yeni özellik eklendi |
| `fix` | Hata düzeltildi |
| `refactor` | Davranış değişmeden kod yeniden yazıldı |
| `chore` | Build, config, bağımlılık değişikliği |
| `style` | Sadece UI/CSS değişikliği |
| `docs` | Dokümantasyon değişikliği |
| `perf` | Performans iyileştirmesi |
| `test` | Test ekleme/güncelleme |

## Kapsam Örnekleri (bu proje için)

`dashboard`, `urunler`, `siparisler`, `iadeler`, `sync`, `auth`, `prisma`, `api`, `layout`, `fiyatlandirma`, `raporlar`

## Kurallar

- Özet satırı max 72 karakter
- Madde listesi Türkçe yaz
- Birden fazla modül etkilendiyse en önemli olanı kapsam olarak seç
- Breaking change varsa `!` ekle: `feat(auth)!: ...`
- Mesajı oluşturduktan sonra kullanıcıya göster ve onay iste, onay gelince `git add -A && git commit -m "..."` komutunu çalıştır
