Prisma şemasını güncelle ve migration hazırla.

Kullanıcının istediği değişikliği al, sonra:

1. `prisma/schema.prisma` dosyasını güncelle
2. Değişikliğin mevcut veriye etkisini açıkla (breaking change var mı?)
3. Çalıştırılacak komutu göster:
   ```
   npx prisma migrate dev --name <migration-adi>
   npx prisma generate
   ```
4. Değişen tabloya göre etkilenen `lib/` dosyalarını listele ve güncellenmesi gerekenleri belirt

Migration adını Türkçe snake_case yaz (örn: `urun_maliyet_alani_ekle`).
