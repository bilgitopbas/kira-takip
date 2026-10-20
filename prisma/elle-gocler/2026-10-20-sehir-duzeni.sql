-- Mulk Sehrim 3D bina duzeni sema eki (2026-10-20). EKLEYICI: yalniz yeni tablo city_layouts.
-- Mevcut hicbir tablo/kolon degismez. Uretim: npx prisma migrate diff (schema once -> sonra).
-- Uygulama: docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- CreateTable
CREATE TABLE "city_layouts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "il" TEXT NOT NULL,
    "cells" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "city_layouts_ownerId_il_key" ON "city_layouts"("ownerId", "il");

-- AddForeignKey
ALTER TABLE "city_layouts" ADD CONSTRAINT "city_layouts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
