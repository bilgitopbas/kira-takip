-- GERI ALMA: "Binalarim" sema ekini kaldirir (2026-10-19). Binalar tablosu ve mulklerdeki bina/blok/daire no
-- ATAMALARI SILINIR; mulkler, kiracilar, borclar, odemeler ETKILENMEZ.
-- Once kodu sema eki OLMAYAN surume dondurun (git), sonra bu dosyayi uygulayin:
-- docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "buildings" DROP CONSTRAINT "buildings_ownerId_fkey";

-- DropIndex
DROP INDEX "properties_buildingId_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "block",
DROP COLUMN "buildingId",
DROP COLUMN "unitNo";

-- DropTable
DROP TABLE "buildings";


COMMIT;
