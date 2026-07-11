export type ImportRow = {
  id: string;
  title: string;
  propertyType: string; // ARSA | AVM | DEPO | DEVREMULK | FABRIKA | KONUT | OFIS | ""
  isOccupied: boolean;
  city: string;
  district: string;
  address: string;
  notes: string;
  tenantName: string;
  nationalId: string;
  phone: string;
  notificationAddress: string;
  contractStart: string; // yyyy-mm-dd
  paymentFrequency: string; // MONTHLY | YEARLY | ""
  increaseRate: string;
  depositAmount: string;
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  ARSA: "Arsa",
  AVM: "AVM",
  DEPO: "Depo",
  DEVREMULK: "Devremülk",
  FABRIKA: "Fabrika",
  KONUT: "Konut",
  OFIS: "Ofis",
};

const PROPERTY_TYPE_MAP: Record<string, string> = {
  arsa: "ARSA",
  avm: "AVM",
  depo: "DEPO",
  "devremülk": "DEVREMULK",
  devremulk: "DEVREMULK",
  fabrika: "FABRIKA",
  konut: "KONUT",
  ofis: "OFIS",
};

const HEADER_ALIASES: Record<keyof Omit<ImportRow, "id">, string[]> = {
  title: ["mülk adı", "mulk adi", "mülk başlığı", "mulk basligi", "başlık", "baslik"],
  propertyType: ["mülk tipi", "mulk tipi", "tip", "mülk türü", "mulk turu"],
  isOccupied: ["durum"],
  city: ["şehir", "sehir", "il"],
  district: ["ilçe", "ilce", "semt"],
  address: ["adres", "mülk adresi", "mulk adresi"],
  notes: ["notlar", "not"],
  tenantName: ["ad soyad", "kiracı adı soyadı", "kiraci adi soyadi", "kiracı", "kiraci"],
  nationalId: ["tc kimlik no", "tc kimlik numarası", "tc kimlik numarasi", "tckn"],
  phone: ["telefon numarası", "telefon numarasi", "telefon", "cep telefonu"],
  notificationAddress: ["tebligat adresi"],
  contractStart: ["sözleşme başlangıç tarihi", "sozlesme baslangic tarihi", "başlangıç tarihi", "baslangic tarihi"],
  paymentFrequency: ["ödeme şekli", "odeme sekli"],
  increaseRate: ["artış oranı", "artis orani"],
  depositAmount: ["depozito"],
};

function normalizeHeader(h: unknown) {
  return String(h ?? "")
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ");
}

export function mapHeaders(headerRow: unknown[]): Record<number, keyof Omit<ImportRow, "id">> {
  const map: Record<number, keyof Omit<ImportRow, "id">> = {};
  headerRow.forEach((raw, index) => {
    const normalized = normalizeHeader(raw);
    if (!normalized) return;
    for (const key of Object.keys(HEADER_ALIASES) as (keyof Omit<ImportRow, "id">)[]) {
      if (HEADER_ALIASES[key].includes(normalized)) {
        map[index] = key;
        break;
      }
    }
  });
  return map;
}

function excelDateToIso(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    // Excel serial date (1900 date system)
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (!str) return "";
  // dd.mm.yyyy or dd/mm/yyyy
  const dmy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // yyyy-mm-dd already
  const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

function cell(row: unknown[], colIndex: number | undefined): string {
  if (colIndex === undefined) return "";
  const v = row[colIndex];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function parseRows(headerRow: unknown[], dataRows: unknown[][]): ImportRow[] {
  const map = mapHeaders(headerRow);
  const colByField = new Map<keyof Omit<ImportRow, "id">, number>();
  for (const [idx, field] of Object.entries(map)) {
    colByField.set(field, Number(idx));
  }

  return dataRows
    .filter((row) => row.some((v) => v !== null && v !== undefined && String(v).trim() !== ""))
    .map((row, i) => {
      const durumRaw = cell(row, colByField.get("isOccupied")).toLocaleLowerCase("tr");
      const typeRaw = cell(row, colByField.get("propertyType")).toLocaleLowerCase("tr");
      const freqRaw = cell(row, colByField.get("paymentFrequency")).toLocaleLowerCase("tr");
      const contractStartRaw = colByField.has("contractStart") ? row[colByField.get("contractStart")!] : "";

      return {
        id: `row-${i}-${Date.now()}`,
        title: cell(row, colByField.get("title")),
        propertyType: PROPERTY_TYPE_MAP[typeRaw] || "",
        isOccupied: durumRaw === "dolu",
        city: cell(row, colByField.get("city")),
        district: cell(row, colByField.get("district")),
        address: cell(row, colByField.get("address")),
        notes: cell(row, colByField.get("notes")),
        tenantName: cell(row, colByField.get("tenantName")),
        nationalId: cell(row, colByField.get("nationalId")),
        phone: cell(row, colByField.get("phone")),
        notificationAddress: cell(row, colByField.get("notificationAddress")),
        contractStart: excelDateToIso(contractStartRaw),
        paymentFrequency: freqRaw.startsWith("yıl") || freqRaw.startsWith("yil") ? "YEARLY" : freqRaw.startsWith("ay") ? "MONTHLY" : "",
        increaseRate: cell(row, colByField.get("increaseRate")).replace(/[^\d.,]/g, "").replace(",", "."),
        depositAmount: cell(row, colByField.get("depositAmount")).replace(/[^\d.,]/g, "").replace(",", "."),
      };
    });
}

export const EXPECTED_COLUMNS = [
  "Mülk Adı",
  "Mülk Tipi (Arsa/AVM/Depo/Devremülk/Fabrika/Konut/Ofis)",
  "Durum (Boş/Dolu)",
  "Şehir",
  "İlçe",
  "Adres",
  "Notlar",
  "Ad Soyad",
  "TC Kimlik No",
  "Telefon Numarası",
  "Tebligat Adresi",
  "Sözleşme Başlangıç Tarihi",
  "Ödeme Şekli (Aylık/Yıllık)",
  "Artış Oranı",
  "Depozito",
];
