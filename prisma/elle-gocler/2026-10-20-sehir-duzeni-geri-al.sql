-- GERI ALMA: city_layouts tablosunu kaldirir (2026-10-20). Yalniz 3D bina DUZENLERI silinir;
-- mulkler, binalar, kiracilar, borclar, odemeler ETKILENMEZ. Kod tablo yoksa duzeni cihazda tutar.
-- docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- DropForeignKey
ALTER TABLE "city_layouts" DROP CONSTRAINT "city_layouts_ownerId_fkey";

-- DropTable
DROP TABLE "city_layouts";

COMMIT;
