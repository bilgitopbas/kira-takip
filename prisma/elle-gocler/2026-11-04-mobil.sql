-- Mobil API sema eki (2026-11-04). EKLEYICI: yeni tablolar mobil_oturumlar ve cihaz_jetonlari.
-- Mevcut hicbir tablo/kolon degismez. Uretim: npx prisma migrate diff (schema once -> sonra).
-- Uygulama: docker exec -i kira_db psql -U kira_admin -d kira_takip_db -v ON_ERROR_STOP=1 < bu_dosya.sql
BEGIN;

-- CreateTable
CREATE TABLE "mobil_oturumlar" (
    "id" TEXT NOT NULL,
    "cihazId" TEXT NOT NULL,
    "yenilemeOzeti" TEXT NOT NULL,
    "oncekiOzet" TEXT,
    "oncekiGecerlilik" TIMESTAMP(3),
    "sessionVersion" INTEGER NOT NULL,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sonGorulme" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sonKullanma" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT,

    CONSTRAINT "mobil_oturumlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cihaz_jetonlari" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "jeton" TEXT NOT NULL,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sonGorulme" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "mobilOturumId" TEXT NOT NULL,

    CONSTRAINT "cihaz_jetonlari_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobil_oturumlar_yenilemeOzeti_key" ON "mobil_oturumlar"("yenilemeOzeti");

-- CreateIndex
CREATE INDEX "mobil_oturumlar_oncekiOzet_idx" ON "mobil_oturumlar"("oncekiOzet");

-- CreateIndex
CREATE INDEX "mobil_oturumlar_memberId_idx" ON "mobil_oturumlar"("memberId");

-- CreateIndex
CREATE INDEX "mobil_oturumlar_sonKullanma_idx" ON "mobil_oturumlar"("sonKullanma");

-- CreateIndex
CREATE UNIQUE INDEX "mobil_oturumlar_userId_cihazId_key" ON "mobil_oturumlar"("userId", "cihazId");

-- CreateIndex
CREATE UNIQUE INDEX "cihaz_jetonlari_jeton_key" ON "cihaz_jetonlari"("jeton");

-- CreateIndex
CREATE INDEX "cihaz_jetonlari_userId_idx" ON "cihaz_jetonlari"("userId");

-- CreateIndex
CREATE INDEX "cihaz_jetonlari_mobilOturumId_idx" ON "cihaz_jetonlari"("mobilOturumId");

-- AddForeignKey
ALTER TABLE "mobil_oturumlar" ADD CONSTRAINT "mobil_oturumlar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobil_oturumlar" ADD CONSTRAINT "mobil_oturumlar_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "account_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cihaz_jetonlari" ADD CONSTRAINT "cihaz_jetonlari_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cihaz_jetonlari" ADD CONSTRAINT "cihaz_jetonlari_mobilOturumId_fkey" FOREIGN KEY ("mobilOturumId") REFERENCES "mobil_oturumlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
