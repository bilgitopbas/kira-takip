-- GERI ALMA (2026-11-04): mobil_oturumlar ve cihaz_jetonlari tablolarini kaldirir.
-- Silinen: yalniz mobil oturumlar ve push jetonlari (kullanicilar yeniden giris yapar). Web verisi ETKILENMEZ.
-- ONCE kodu bu eki OKUMAYAN surume dondurun (git), sonra bu dosyayi uygulayin:
-- docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- DropForeignKey
ALTER TABLE "mobil_oturumlar" DROP CONSTRAINT "mobil_oturumlar_userId_fkey";

-- DropForeignKey
ALTER TABLE "mobil_oturumlar" DROP CONSTRAINT "mobil_oturumlar_memberId_fkey";

-- DropForeignKey
ALTER TABLE "cihaz_jetonlari" DROP CONSTRAINT "cihaz_jetonlari_userId_fkey";

-- DropForeignKey
ALTER TABLE "cihaz_jetonlari" DROP CONSTRAINT "cihaz_jetonlari_mobilOturumId_fkey";

-- DropTable
DROP TABLE "mobil_oturumlar";

-- DropTable
DROP TABLE "cihaz_jetonlari";

COMMIT;
