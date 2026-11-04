import http2, { type ClientHttp2Session, type ClientHttp2Stream } from "node:http2";
import type { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  apnsAyari,
  apnsGovdesi,
  apnsJwt,
  apnsOluMu,
  fcmAyari,
  fcmJwt,
  fcmMesaji,
  fcmOluMu,
  jetonGecerliMi,
  type ApnsAyari,
  type FcmAyari,
  type PushIleti,
} from "@/lib/pushBicim";

// Push gönderimi: APNs (iOS) ve FCM HTTP v1 (Android). Paket yok: JWT'ler Node
// crypto, istekler fetch/http2. HİÇBİR HATA YUKARI ÇIKMAZ: iş akışı bildirim servisinin
// ayakta olmasına bağlı değildir. PUSH_ACIK olmadan hiçbir şey gönderilmez. Cihaz
// jetonu olmayan kullanıcıya sessizce geçilir.

const ISTEK_SURESI_MS = 10_000;
const ESZAMANLI = 8;
const ARDISIK_HATA_SINIRI = 16;
const BOSTA_KAPANMA_MS = 60_000;

// Apple saatte birden çok jeton üretimini cezalandırır: 50 dk önbellek
let apnsOnbellek: { jeton: string; bitis: number } | null = null;
function apnsJetonu(ayar: ApnsAyari) {
  const simdi = Math.floor(Date.now() / 1000);
  if (apnsOnbellek && apnsOnbellek.bitis > simdi) return apnsOnbellek.jeton;
  const jeton = apnsJwt(ayar, simdi);
  apnsOnbellek = { jeton, bitis: simdi + 50 * 60 };
  return jeton;
}

// Google'ın jetonu bir saat geçerli: 55 dk önbellek
let fcmOnbellek: { jeton: string; bitis: number } | null = null;
async function fcmErisimJetonu(ayar: FcmAyari) {
  const simdi = Math.floor(Date.now() / 1000);
  if (fcmOnbellek && fcmOnbellek.bitis > simdi) return fcmOnbellek.jeton;
  const cevap = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: fcmJwt(ayar, simdi),
    }),
    signal: AbortSignal.timeout(ISTEK_SURESI_MS),
  });
  if (!cevap.ok) throw new Error(`FCM jetonu alınamadı: ${cevap.status}`);
  const j = (await cevap.json()) as { access_token?: string };
  if (!j.access_token) throw new Error("FCM jetonu boş");
  fcmOnbellek = { jeton: j.access_token, bitis: simdi + 55 * 60 };
  return j.access_token;
}

type Baglanti = {
  al: (konak: string) => ClientHttp2Session;
  /** Gönderim bitti: boşta kalınca kapanır */
  birak: () => void;
  /** Yanıt gelmedi: bağlantı yarı açık olabilir, sıradaki istek yeniden bağlansın */
  dusur: () => void;
};

// Tek http2 oturumu GÖNDERİMLER ARASINDA da paylaşılır: cron bildirimleri tek tek
// yollar; her birine yeni bağlantı Apple'ın "connection flood" sayacına girer.
// Oturum koparsa (GOAWAY, ağ) sıradaki istek yeniden bağlanır.
export function baglantiKur(
  baglan: (konak: string) => ClientHttp2Session = (konak) => http2.connect(`https://${konak}`),
  bostaMs = BOSTA_KAPANMA_MS
): Baglanti {
  let oturum: ClientHttp2Session | null = null;
  let sayac: ReturnType<typeof setTimeout> | null = null;
  return {
    al(konak) {
      if (sayac) {
        clearTimeout(sayac);
        sayac = null;
      }
      if (oturum && !oturum.destroyed && !oturum.closed) return oturum;
      const yeni = baglan(konak);
      // Yakalanmayan "error" olayı süreci düşürür; açık istekler kendi "close"uyla biter
      yeni.on("error", () => {});
      yeni.on("goaway", () => {
        if (oturum === yeni) oturum = null;
        try {
          yeni.close();
        } catch {}
      });
      oturum = yeni;
      return yeni;
    },
    birak() {
      if (sayac) clearTimeout(sayac);
      sayac = setTimeout(() => {
        sayac = null;
        try {
          oturum?.close();
        } catch {}
        oturum = null;
      }, bostaMs);
      sayac.unref?.();
    },
    dusur() {
      try {
        oturum?.destroy();
      } catch {}
      oturum = null;
    },
  };
}

const paylasilanBaglanti = baglantiKur();

type GonderimSonucu = { tamam: boolean; olu?: boolean; ulasilamadi?: boolean };

// Toplu APNs gönderimi: en çok ESZAMANLI açık istek. Her isteğin kendi sayacı var; asılı
// istek yalnız kendini düşürür. Yanıt gelmeden art arda ARDISIK_HATA_SINIRI istek düşerse
// Apple'a ulaşılamıyor demektir: kalanlar denenmez, döngü kilitlenmez.
export async function iosTopluGonder(
  ayar: ApnsAyari,
  jetonlar: string[],
  ileti: PushIleti,
  {
    baglanti = paylasilanBaglanti,
    sureMs = ISTEK_SURESI_MS,
    eszamanli = ESZAMANLI,
  }: { baglanti?: Baglanti; sureMs?: number; eszamanli?: number } = {}
) {
  const sonuclar = new Map<string, GonderimSonucu>();
  const govde = JSON.stringify(apnsGovdesi(ileti));
  let sira = 0;
  let ardisikHata = 0;

  const tekIstek = (jeton: string) =>
    new Promise<GonderimSonucu>((coz) => {
      let bitti = false;
      let istek: ClientHttp2Stream | undefined;
      const bitir = (sonuc: GonderimSonucu, yanitGeldi = false) => {
        if (bitti) return;
        bitti = true;
        clearTimeout(sayac);
        ardisikHata = yanitGeldi ? 0 : ardisikHata + 1;
        try {
          istek?.close(http2.constants.NGHTTP2_CANCEL);
        } catch {}
        coz(sonuc);
      };
      const sayac = setTimeout(() => {
        bitir({ tamam: false });
        baglanti.dusur();
      }, sureMs);
      try {
        istek = baglanti.al(ayar.konak).request({
          ":method": "POST",
          ":path": `/3/device/${jeton}`,
          "apns-topic": ayar.konu,
          "apns-push-type": "alert",
          "apns-priority": "10",
          authorization: `bearer ${apnsJetonu(ayar)}`,
          "content-type": "application/json",
          "content-length": Buffer.byteLength(govde),
        });
        let durum = 0;
        let yanit = "";
        istek.on("response", (b) => {
          durum = Number(b[":status"]) || 0;
        });
        istek.on("data", (p) => {
          yanit += p;
        });
        istek.on("error", () => bitir({ tamam: false }));
        istek.on("close", () => bitir({ tamam: false }));
        istek.on("end", () => {
          if (durum === 200) {
            bitir({ tamam: true }, true);
            return;
          }
          let sebep = "";
          try {
            sebep = JSON.parse(yanit)?.reason || "";
          } catch {}
          const olu = apnsOluMu(durum, sebep);
          if (!olu) console.error(`[push] APNs ${durum} ${sebep}`);
          bitir({ tamam: false, olu }, durum > 0);
        });
        istek.end(govde);
      } catch (e) {
        console.error(`[push] APNs: ${(e as Error).message}`);
        bitir({ tamam: false });
      }
    });

  const isci = async () => {
    while (sira < jetonlar.length && ardisikHata < ARDISIK_HATA_SINIRI) {
      const jeton = jetonlar[sira++];
      sonuclar.set(jeton, await tekIstek(jeton));
    }
  };
  await Promise.all(Array.from({ length: Math.min(eszamanli, jetonlar.length) }, isci));
  baglanti.birak();

  const denenmeyen = jetonlar.length - sonuclar.size;
  if (denenmeyen) console.error(`[push] APNs'e ulaşılamadı, ${denenmeyen} cihaz denenmedi`);
  return jetonlar.map((jeton) => ({ jeton, ...(sonuclar.get(jeton) ?? { tamam: false }) }));
}

async function androidGonder(ayar: FcmAyari, jeton: string, ileti: PushIleti): Promise<GonderimSonucu> {
  let erisim: string;
  try {
    erisim = await fcmErisimJetonu(ayar);
  } catch (e) {
    console.error(`[push] ${(e as Error).message}`);
    return { tamam: false, ulasilamadi: true };
  }
  let cevap: Response;
  try {
    cevap = await fetch(`https://fcm.googleapis.com/v1/projects/${ayar.proje}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${erisim}`, "Content-Type": "application/json" },
      body: JSON.stringify(fcmMesaji(jeton, ileti)),
      signal: AbortSignal.timeout(ISTEK_SURESI_MS),
    });
  } catch {
    return { tamam: false, ulasilamadi: true };
  }
  if (cevap.ok) return { tamam: true };
  let hataAdi = "";
  let mesaj = "";
  try {
    const { error } = (await cevap.json()) as {
      error?: { status?: string; message?: string; details?: { errorCode?: string }[] };
    };
    hataAdi = error?.details?.find((x) => x.errorCode)?.errorCode || error?.status || "";
    mesaj = error?.message || "";
  } catch {}
  const olu = fcmOluMu(hataAdi, mesaj);
  if (!olu) console.error(`[push] FCM ${cevap.status} ${hataAdi} ${mesaj}`);
  return { tamam: false, olu };
}

// Tek tek istek ama sırayla değil: 10 bin cihazlık duyuru dakikalarca sürmesin. Google'a
// art arda ulaşılamıyorsa kalanlar denenmez (her biri süre sınırı kadar beklerdi).
export async function androidTopluGonder(
  jetonlar: string[],
  tekGonder: (jeton: string) => Promise<GonderimSonucu>,
  eszamanli = ESZAMANLI
) {
  const sonuclar: ({ jeton: string } & GonderimSonucu)[] = [];
  let sira = 0;
  let ardisikHata = 0;
  const isci = async () => {
    while (sira < jetonlar.length && ardisikHata < ARDISIK_HATA_SINIRI) {
      const jeton = jetonlar[sira++];
      const sonuc = await tekGonder(jeton);
      ardisikHata = sonuc.ulasilamadi ? ardisikHata + 1 : 0;
      sonuclar.push({ jeton, ...sonuc });
    }
  };
  await Promise.all(Array.from({ length: Math.min(eszamanli, jetonlar.length) }, isci));
  const denenmeyen = jetonlar.length - sonuclar.length;
  if (denenmeyen) console.error(`[push] FCM'e ulaşılamadı, ${denenmeyen} cihaz denenmedi`);
  return sonuclar;
}

type Hedef = { jeton: string; platform: string };

async function jetonlaraGonder(jetonlar: Hedef[], ileti: PushIleti, ios: ApnsAyari | null, android: FcmAyari | null) {
  const sonuclar: ({ jeton: string } & GonderimSonucu)[] = [];
  const secili = (p: string) => jetonlar.filter((j) => j.platform === p).map((j) => j.jeton);
  const iosJetonlari = secili("ios");
  const androidJetonlari = secili("android");
  try {
    if (ios && iosJetonlari.length) sonuclar.push(...(await iosTopluGonder(ios, iosJetonlari, ileti)));
    if (android && androidJetonlari.length) {
      sonuclar.push(...(await androidTopluGonder(androidJetonlari, (j) => androidGonder(android, j, ileti))));
    }
  } catch (e) {
    console.error(`[push] gönderim hatası: ${(e as Error).message}`);
  }
  const oluler = sonuclar.filter((r) => r.olu).map((r) => r.jeton);
  if (oluler.length) await prisma.cihazJetonu.deleteMany({ where: { jeton: { in: oluler } } });
}

// Geçerli hedefler; süresi dolmuş ya da şifresi değişmiş oturumun jetonu silinir
async function hedefleriGetir(where: Prisma.CihazJetonuWhereInput): Promise<Hedef[]> {
  const satirlar = await prisma.cihazJetonu.findMany({
    where,
    select: {
      jeton: true,
      platform: true,
      user: { select: { sessionVersion: true } },
      mobilOturum: { select: { sessionVersion: true, sonKullanma: true } },
    },
  });
  const simdi = new Date();
  const gecerli = satirlar.filter((j) => jetonGecerliMi(j, simdi));
  if (gecerli.length !== satirlar.length) {
    const bayat = satirlar.filter((j) => !jetonGecerliMi(j, simdi)).map((j) => j.jeton);
    await prisma.cihazJetonu.deleteMany({ where: { jeton: { in: bayat } } });
  }
  return gecerli;
}

async function gonder(where: Prisma.CihazJetonuWhereInput, ileti: PushIleti) {
  try {
    const ios = apnsAyari();
    const android = fcmAyari();
    if (!ios && !android) return;
    const jetonlar = await hedefleriGetir(where);
    if (jetonlar.length) await jetonlaraGonder(jetonlar, ileti, ios, android);
  } catch (e) {
    console.error(`[push] ${(e as Error).message}`);
  }
}

/**
 * Bir hesabın tüm cihazları: sahip + ekip üyeleri. Üye oturumu sahibin userId'siyle
 * açıldığı için jetonları da bu kimlikle kayıtlıdır. Reddolmaz.
 */
export const hesabaPush = (userId: string, ileti: PushIleti) => gonder({ userId }, ileti);

/** Yalnız hesap sahibinin kendi cihazları (admin bildirimleri: üyelere gitmez). Reddolmaz. */
export const sahibePush = (userId: string, ileti: PushIleti) =>
  gonder({ userId, mobilOturum: { memberId: null } }, ileti);

/** Uygulamayı kurmuş herkes (genel duyuru). Reddolmaz. */
export const herkesePush = (ileti: PushIleti) => gonder({}, ileti);

/** Duyuru ekranındaki sayı: yalnız anahtarı girilmiş platformlar */
export async function pushCihazSayisi(): Promise<number> {
  const platformlar = [apnsAyari() && "ios", fcmAyari() && "android"].filter((p): p is string => !!p);
  if (platformlar.length === 0) return 0;
  return prisma.cihazJetonu.count({ where: { platform: { in: platformlar } } });
}
