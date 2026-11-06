// Mobil yönetim uçlarının gövde denetimi. Saf işlevler: tests/mobilAdminBicim.test.ts
import { paketMi, type Paket } from "@/lib/paketler";

type Hata = { hata: string };
type Govde = Record<string, unknown>;

export const MULK_LIMITI_SINIRI = 100000;
const BASLIK_SINIRI = 200;
const MESAJ_SINIRI = 4000;
const NOT_SINIRI = 500;

export type KullaniciDegisikligi = { paket?: Paket; yonetimIstiyor?: boolean; mulkLimiti?: number };

/** PATCH /kullanicilar/:id. Alanlar önce topluca denetlenir: biri bozuksa hiçbiri yazılmaz. */
export function kullaniciDegisikligi(g: Govde): KullaniciDegisikligi | Hata {
  const d: KullaniciDegisikligi = {};
  if (g.paket !== undefined) {
    if (!paketMi(g.paket)) return { hata: "Geçersiz paket." };
    d.paket = g.paket;
  }
  if (g.yonetimIstiyor !== undefined) {
    if (typeof g.yonetimIstiyor !== "boolean") return { hata: "yonetimIstiyor true ya da false olmalı." };
    d.yonetimIstiyor = g.yonetimIstiyor;
  }
  if (g.mulkLimiti !== undefined) {
    // Web gibi en az 1; limiti kaldırma (null) web'de de yok
    const n = g.mulkLimiti;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > MULK_LIMITI_SINIRI) {
      return { hata: "Geçerli bir mülk sayısı girin." };
    }
    d.mulkLimiti = n;
  }
  if (!Object.keys(d).length) return { hata: "Değiştirilecek alan yok." };
  return d;
}

/** PATCH /odeme-bildirimleri/:id → web'in action değerleri */
export function odemeIslemi(g: Govde): { action: "confirm" | "reject"; note: string | null } | Hata {
  const action = g.islem === "onayla" ? "confirm" : g.islem === "reddet" ? "reject" : null;
  if (!action) return { hata: "Geçersiz işlem." };
  if (g.not !== undefined && g.not !== null && typeof g.not !== "string") return { hata: "Not metin olmalı." };
  const not = typeof g.not === "string" ? g.not.trim().slice(0, NOT_SINIRI) : "";
  return { action, note: not || null };
}

export type OdemeDurumu = "PENDING" | "CONFIRMED" | "REJECTED";
export const odemeDurumuMu = (d: unknown): d is OdemeDurumu =>
  d === "PENDING" || d === "CONFIRMED" || d === "REJECTED";

export type DuyuruGirdisi = { title: string; subtitle: string | null; message: string; targetId: string | null };

/** POST /duyurular: hedefId yoksa herkese */
export function duyuruGirdisi(g: Govde): DuyuruGirdisi | Hata {
  const metin = (d: unknown) => (typeof d === "string" ? d.trim() : "");
  const title = metin(g.baslik);
  const message = metin(g.mesaj);
  const subtitle = metin(g.altBaslik) || null;
  if (!title || !message) return { hata: "Başlık ve mesaj zorunludur." };
  if (title.length > BASLIK_SINIRI || (subtitle?.length ?? 0) > BASLIK_SINIRI) {
    return { hata: `Başlık en çok ${BASLIK_SINIRI} karakter olabilir.` };
  }
  if (message.length > MESAJ_SINIRI) return { hata: `Mesaj en çok ${MESAJ_SINIRI} karakter olabilir.` };
  if (g.hedefId !== undefined && g.hedefId !== null && typeof g.hedefId !== "string") {
    return { hata: "Geçersiz hedef." };
  }
  return { title, subtitle, message, targetId: metin(g.hedefId) || null };
}
