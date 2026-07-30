import "server-only";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { TUM_ALANLAR } from "@/lib/kiraSozlesmesiAlanlari";

const calistir = promisify(execFile);

const SABLON_YOLU = path.join(process.cwd(), "templates", "kira-sozlesmesi.docx");

/** "120000.00" -> "120.000,00 TL" */
function paraYaz(ham: string) {
  const sayi = Number(ham);
  if (!Number.isFinite(sayi)) return ham;
  return `${sayi.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
}

/** "2026-07-30" -> "30.07.2026" */
function tarihYaz(ham: string) {
  const [yil, ay, gun] = ham.split("-");
  if (!yil || !ay || !gun) return ham;
  return `${gun}.${ay}.${yil}`;
}

/**
 * Formdan gelen ham değerleri şablona yazılacak biçime çevirir.
 * Bilinmeyen anahtarlar YOK SAYILIR — şablonda olmayan bir alan enjekte
 * edilemesin diye yalnızca tanımlı alanlar geçirilir.
 */
export function sablonVerisiHazirla(girdi: Record<string, unknown>) {
  const veri: Record<string, string> = {};

  for (const alan of TUM_ALANLAR) {
    const ham = girdi[alan.key];
    const metin = typeof ham === "string" ? ham.trim() : "";
    if (!metin) {
      veri[alan.key] = "";
      continue;
    }
    if (alan.tip === "para") veri[alan.key] = paraYaz(metin);
    else if (alan.tip === "tarih") veri[alan.key] = tarihYaz(metin);
    else veri[alan.key] = metin;
  }

  return veri;
}

/** Zorunlu alanlardan boş olanların etiketlerini döner. */
export function eksikZorunluAlanlar(girdi: Record<string, unknown>) {
  return TUM_ALANLAR.filter((a) => {
    if (!a.zorunlu) return false;
    const d = girdi[a.key];
    return typeof d !== "string" || d.trim() === "";
  }).map((a) => a.label);
}

/** Şablonu doldurup .docx içeriğini döner. */
export function sozlesmeUret(veri: Record<string, string>): Buffer {
  const sablon = fs.readFileSync(SABLON_YOLU, "binary");
  const zip = new PizZip(sablon);

  const doc = new Docxtemplater(zip, {
    // Şablonda {{...}} kullanılıyor, docxtemplater varsayılanı tek süslü
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    // Doldurulmayan alan hata vermesin, boş kalsın (ör. kefilsiz sözleşme)
    nullGetter: () => "",
  });

  doc.render(veri);
  return doc.toBuffer();
}

/**
 * Word belgesini PDF'e çevirir. Sunucuda LibreOffice kurulu değilse null
 * döner — sözleşme yine de Word olarak üretilmiş olur, akış kesilmez.
 */
export async function pdfeCevir(docx: Buffer): Promise<Buffer | null> {
  const klasor = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-sozlesme-"));
  const docxYolu = path.join(klasor, "sozlesme.docx");
  const pdfYolu = path.join(klasor, "sozlesme.pdf");

  try {
    fs.writeFileSync(docxYolu, docx);
    await calistir(
      process.env.SOFFICE_PATH || "soffice",
      ["--headless", "--norestore", "--convert-to", "pdf", "--outdir", klasor, docxYolu],
      { timeout: 60_000 }
    );
    if (!fs.existsSync(pdfYolu)) return null;
    return fs.readFileSync(pdfYolu);
  } catch (hata) {
    console.error("PDF cevrimi basarisiz (LibreOffice kurulu mu?):", hata);
    return null;
  } finally {
    fs.rmSync(klasor, { recursive: true, force: true });
  }
}

/** Dosya adı: "Kira Sozlesmesi - Ahmet Yilmaz - 30.07.2026" */
export function dosyaAdiUret(kiraciAdi: string) {
  const temiz = kiraciAdi
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const bugun = new Date().toISOString().slice(0, 10);
  return `kira-sozlesmesi-${temiz || "belge"}-${bugun}`;
}
