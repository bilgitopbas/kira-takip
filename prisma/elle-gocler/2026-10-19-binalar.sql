-- Yeni panel "Binalarim" sema eki (2026-10-19). EKLEYICI: yalniz yeni tablo + properties'e 3 bos (nullable) kolon.
-- Mevcut hicbir kolon degismez/silinmez. Uretim: npx prisma migrate diff (schema once -> sonra).
-- Onerilen uygulama yontemi: sunucuda 'npx prisma db push' (bu dosya inceleme ve elle uygulama icindir).
-- Elle uygulama: docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "block" TEXT,
ADD COLUMN     "buildingId" TEXT,
ADD COLUMN     "unitNo" TEXT;

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buildings_ownerId_idx" ON "buildings"("ownerId");

-- CreateIndex
CREATE INDEX "properties_buildingId_idx" ON "properties"("buildingId");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
