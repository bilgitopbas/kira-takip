// Bu dosya yalnızca sunucuda çalışır (node:fs / child_process kullanır);
// istemci bileşeninden import edilirse derleme hata verir.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { alanGorunurMu, TUM_ALANLAR } from "@/lib/kiraSozlesmesiAlanlari";

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

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
  const al = (k: string) => (typeof girdi[k] === "string" ? (girdi[k] as string).trim() : "");
  const veri: Record<string, string | boolean> = {};

  for (const alan of TUM_ALANLAR) {
    const metin = al(alan.key);
    if (!metin) {
      veri[alan.key] = "";
      continue;
    }
    if (alan.tip === "para") veri[alan.key] = paraYaz(metin);
    else if (alan.tip === "tarih") veri[alan.key] = tarihYaz(metin);
    else if (alan.tip === "iban") veri[alan.key] = ibanYaz(metin);
    else veri[alan.key] = metin;
  }

  // Ödeme şekli: "Diğer" seçilmişse serbest metin kullanılır
  if (al("Odemesekli") === "OZEL") veri["Odemesekli"] = al("OdemesekliOzel");

  // Kira artışı: TÜFE seçeneklerinde cümle, kira başlangıç ayına göre kurulur
  const artisTipi = al("ArtisTipi");
  const baslangicAyi = ayAdi(al("Kirabaslangıctarihi"));
  if (artisTipi === "TUFE") {
    veri["Artis_Bilgisi"] = `TÜİK'in açıkladığı ${baslangicAyi} ayı 12 aylık ortalamasına göre TÜFE oranında`;
  } else if (artisTipi === "TUFE_YIUFE") {
    veri["Artis_Bilgisi"] = `TÜİK'in açıkladığı ${baslangicAyi} ayı 12 aylık ortalamalarına göre TÜFE/2 + Yİ-ÜFE/2 oranında`;
  } else {
    // "Diğer": kullanıcının elle yazdığı oran. Artis_Bilgisi bir form alanı
    // değil (ArtisTipi'nin serbest kutusu) olduğu için burada açıkça atanır.
    veri["Artis_Bilgisi"] = al("Artis_Bilgisi");
  }

  // Depozito: tutar yerine "son güncel 1 aylık kira bedeli" yazılabilir
  if (al("DepozitoTipi") === "KIRA") {
    veri["Depozitotutarı"] = "son güncel 1 aylık kira bedeli";
  }

  // Kefil bölümü şablonda koşullu; boolean olarak geçilir
  veri["Kefilvar"] = al("Kefilvar") === "VAR";

  return veri;
}

/** "2026-08-01" -> "Ağustos" */
function ayAdi(isoTarih: string) {
  const ay = Number(isoTarih.split("-")[1]);
  return AY_ADLARI[ay - 1] ?? "";
}

/** Girilen haneleri TR ön ekiyle IBAN'a çevirir */
function ibanYaz(ham: string) {
  const haneler = ham.replace(/[^0-9]/g, "");
  if (!haneler) return "";
  // TR dahil baştan 4'erli gruplanır: TR12 0006 2001 ...
  return `TR${haneler}`.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Zorunlu alanlardan boş olanların etiketlerini döner.
 * Koşullu alanlar yalnızca görünür durumdaysa zorunlu sayılır (ör. kefil
 * yoksa kefil alanları istenmez).
 */
export function eksikZorunluAlanlar(girdi: Record<string, unknown>) {
  const degerler: Record<string, string> = {};
  for (const [k, v] of Object.entries(girdi)) {
    if (typeof v === "string") degerler[k] = v;
  }

  return TUM_ALANLAR.filter((a) => {
    if (!a.zorunlu) return false;
    if (!alanGorunurMu(a, degerler)) return false;
    // "Diğer" seçilen serbest alanlarda asıl doldurulması gereken serbest metin
    if (a.serbestDeger && degerler[a.key] === a.serbestDeger) {
      const serbest = a.serbestKey ? degerler[a.serbestKey] : "";
      return !serbest || serbest.trim() === "";
    }
    const d = degerler[a.key];
    return !d || d.trim() === "";
  }).map((a) => a.label);
}

/** Şablonu doldurup .docx içeriğini döner. */
export function sozlesmeUret(veri: Record<string, string | boolean>): Buffer {
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
