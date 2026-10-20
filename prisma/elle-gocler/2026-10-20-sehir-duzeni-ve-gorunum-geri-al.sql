-- GERI ALMA (2026-10-20): buildings."gorunum" kolonunu ve city_layouts tablosunu kaldirir.
-- Silinen: yalniz secilmis 3D gorunumler ve 3D bina duzenleri. Mulkler, binalar (ad/konum/atamalar),
-- kiracilar, borclar, odemeler ETKILENMEZ.
-- ONCE kodu bu eki OKUMAYAN surume dondurun (git), sonra bu dosyayi uygulayin:
-- docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- DropForeignKey
ALTER TABLE "city_layouts" DROP CONSTRAINT "city_layouts_ownerId_fkey";

-- AlterTable
ALTER TABLE "buildings" DROP COLUMN "gorunum";

-- DropTable
DROP TABLE "city_layouts";

COMMIT;
