// Web ile mobil API aynı veriyi mi gösteriyor? SALT OKUNUR: yalnız iki giriş, GET istekleri
// ve iki çıkış. Çıktıda yalnız sayılar ve fark adetleri olur; kişisel veri, kimlik (id),
// jeton ve şifre basılmaz.
//
//   node scripts/web-mobil-karsilastir.js
//   node scripts/web-mobil-karsilastir.js --hesap <dosya> --taban <adres>
//
// Hesap dosyası tek satır: "e-posta şifre". Çıkış kodu: 0 hepsi aynı, 1 fark var, 2 çalıştırılamadı.
// Giriş hız sınırı IP + e-posta başına 15 dk'da 10 (web girişi 10 dk'da 10): her koşu ikisinden birer harcar.
// Karşılığı olmayan alanlar: teslim/2026-11-04-mobil-expo/web-mobil-farklari.md

const VARSAYILAN_HESAP = "C:\\Users\\Huseyin\\mizan-anahtar\\deneme-hesap.txt";
const VARSAYILAN_TABAN = "https://mizanmulkyonetimi.com";
const CIHAZ_ID = "web-mobil-karsilastir";
const ORNEK_KIRACI = 3;
const SURE_MS = 60_000;
const KURUS = 0.005;

class Durdur extends Error {}

function argumanlar(argv) {
  const a = { hesap: VARSAYILAN_HESAP, taban: VARSAYILAN_TABAN };
  for (let i = 0; i < argv.length; i += 2) {
    if (argv[i] === "--hesap") a.hesap = argv[i + 1];
    else if (argv[i] === "--taban") a.taban = argv[i + 1];
    else throw new Durdur(`Bilinmeyen argüman: ${argv[i]}`);
  }
  a.taban = String(a.taban).replace(/\/+$/, "");
  // Şifre gidiyor: düz HTTP yalnız bu makineye
  if (!/^https:\/\//.test(a.taban) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(a.taban)) {
    throw new Durdur("Taban adres https olmalı.");
  }
  return a;
}

function hesabiOku(icerik) {
  const satir = icerik
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith("#"));
  const m = satir?.match(/^(\S+)\s+(.+)$/);
  if (!m) throw new Durdur('Hesap dosyası biçimi hatalı (beklenen: "e-posta şifre").');
  return { email: m[1], sifre: m[2] };
}

// --- Karşılaştırma defteri ---

const sonuclar = { tamam: 0, fark: 0, bilgi: 0 };

function yaz(durum, ad, ayrinti) {
  console.log(`${durum.padEnd(6)}${ad}${ayrinti ? `  (${ayrinti})` : ""}`);
}

function isle(ad, ayni, ayrinti) {
  sonuclar[ayni ? "tamam" : "fark"]++;
  yaz(ayni ? "TAMAM" : "FARK", ad, ayrinti);
}

const sayiAyni = (a, b) => (a === null || b === null || a === undefined || b === undefined ? a === b : Math.abs(Number(a) - Number(b)) < KURUS);

function sayi(ad, web, mobil) {
  isle(ad, sayiAyni(web, mobil), `web=${web ?? "yok"} mobil=${mobil ?? "yok"}`);
}

function kume(ad, webDizi, mobilDizi) {
  const web = new Set(webDizi);
  const mobil = new Set(mobilDizi);
  const yalnizWeb = [...web].filter((x) => !mobil.has(x)).length;
  const yalnizMobil = [...mobil].filter((x) => !web.has(x)).length;
  // Aynı kayıt iki kez gelirse küme bunu gizler: adet de karşılaştırılır
  const ayni = !yalnizWeb && !yalnizMobil && webDizi.length === mobilDizi.length;
  isle(ad, ayni, `web=${webDizi.length} mobil=${mobilDizi.length} yalniz_web=${yalnizWeb} yalniz_mobil=${yalnizMobil}`);
}

function bayrak(ad, web, mobil) {
  isle(ad, web === mobil, `web=${web} mobil=${mobil}`);
}

/** Kişisel olabilecek metinleri basmadan yalnız eşit mi diye bakar */
function gizliEsit(ad, web, mobil) {
  isle(ad, web === mobil, web === mobil ? "eşit" : "farklı");
}

function altKume(ad, kapsayanDizi, altDizi) {
  const kapsayan = new Set(kapsayanDizi);
  const disarida = altDizi.filter((x) => !kapsayan.has(x)).length;
  isle(ad, disarida === 0, `adet=${altDizi.length} disarida=${disarida}`);
}

// --- Saf hesaplar: web verisinden, istemcinin yaptığı gruplamanın karşılığı ---

function durumSayaci(birimler) {
  const s = { odendi: 0, bekliyor: 0, gecikmis: 0, bos: 0 };
  for (const b of birimler) s[b.durum]++;
  return s;
}

function webBinalari(birimler) {
  const gruplar = new Map();
  for (const b of birimler) {
    const g = gruplar.get(b.bina.anahtar) ?? { birim: 0, konumlu: false, ilVar: false };
    g.birim++;
    g.konumlu ||= !!b.bina.konum;
    g.ilVar ||= !!b.il;
    gruplar.set(b.bina.anahtar, g);
  }
  return gruplar;
}

const bugunAnahtari = (s) => `${s.tenantId}|${s.birimId}|${s.tarih}`;
const toplam = (dizi, alan) => dizi.reduce((t, x) => t + Number(x[alan] ?? 0), 0);

// --- Ağ ---

function istemci(taban) {
  async function istek(yol, { yontem = "GET", govde, cerez, bearer } = {}) {
    const basliklar = {};
    if (cerez) basliklar.cookie = cerez;
    if (bearer) basliklar.authorization = `Bearer ${bearer}`;
    if (govde !== undefined) basliklar["content-type"] = "application/json";
    const r = await fetch(taban + yol, {
      method: yontem,
      headers: basliklar,
      redirect: "manual",
      body: govde === undefined ? undefined : JSON.stringify(govde),
      signal: AbortSignal.timeout(SURE_MS),
    });
    let json = null;
    try {
      json = await r.json();
    } catch {
      // gövde JSON değil; durum kodu yeter
    }
    return { durum: r.status, json, setCookie: r.headers.getSetCookie?.() ?? [] };
  }
  return istek;
}

async function hepsiniCek(istek, yol, bearer) {
  const kayitlar = [];
  let ek = null;
  for (let sayfa = 1; ; sayfa++) {
    const r = await istek(`${yol}${yol.includes("?") ? "&" : "?"}adet=100&sayfa=${sayfa}`, { bearer });
    if (r.durum !== 200) return { durum: r.durum, kayitlar, ek };
    kayitlar.push(...r.json.kayitlar);
    ek ??= r.json;
    if (!r.json.sonrakiVar) return { durum: 200, kayitlar, ek };
  }
}

/** Bir uç 200 dönmediyse karşılaştırılamaz: FARK sayılır, gövde basılmaz */
function kontrol(adlar, ...yanitlar) {
  const bozuk = yanitlar.filter((r) => r.durum !== 200).map((r) => r.durum);
  if (bozuk.length === 0) return true;
  isle(adlar, false, `HTTP ${bozuk.join(",")}`);
  return false;
}

// --- Karşılaştırmalar ---

async function ozetVeBirimler(istek, cerez, bearer) {
  const [web, mobil, mulkler] = await Promise.all([
    istek("/api/dashboard/yeni-panel/ozet", { cerez }),
    istek("/api/mobil/panel/ozet", { bearer }),
    hepsiniCek(istek, "/api/mobil/panel/mulkler", bearer),
  ]);
  if (!kontrol("özet ve birimler", web, mobil, mulkler)) return null;
  const w = web.json;
  const m = mobil.json;

  for (const alan of [
    "mulkSayisi",
    "doluSayisi",
    "bosSayisi",
    "kiraciSayisi",
    "buAyTahsilat",
    "buYilTahsilat",
    "tahsilatOrani",
    "buAyBeklenen",
    "mulkBuYil",
    "gecikmisSayisi",
    "gecikmisTutar",
    "ilsizMulkSayisi",
  ]) {
    sayi(`özet.${alan}`, w.ozet[alan], m.ozet[alan]);
  }
  kume("özet.gecikenler", w.ozet.gecikenler.map((g) => g.id), m.ozet.gecikenler.map((g) => g.id));
  sayi("özet.gecikenler kalan toplamı", toplam(w.ozet.gecikenler, "remaining"), toplam(m.ozet.gecikenler, "remaining"));
  gizliEsit("özet.seriler", JSON.stringify(w.ozet.seriler), JSON.stringify(m.ozet.seriler));

  for (const liste of ["vadesiGelenler", "sozlesmeYenilemeleri", "kiraArtislari"]) {
    kume(`bugün.${liste}`, w.bugun[liste].map(bugunAnahtari), m.bugun[liste].map(bugunAnahtari));
  }
  sayi("bugün.vadesiGelenler tutar toplamı", toplam(w.bugun.vadesiGelenler, "tutar"), toplam(m.bugun.vadesiGelenler, "tutar"));

  // 5. yıl listesinin web'de karşılığı yok: kayıtlar en azından web'deki kiracı ve mülklerden olmalı
  const besYil = m.bugun.besYil ?? [];
  sonuclar.bilgi++;
  yaz("BILGI", "bugün.besYil web'de karşılığı yok", `mobil=${besYil.length}`);
  altKume("bugün.besYil mülkleri web birimlerinde", w.birimler.map((b) => b.id), besYil.map((s) => s.birimId));

  kume("birim id", w.birimler.map((b) => b.id), mulkler.kayitlar.map((b) => b.id));
  const webSayac = durumSayaci(w.birimler);
  for (const d of Object.keys(webSayac)) sayi(`birim durumu.${d}`, webSayac[d], mulkler.ek?.sayac?.[d] ?? 0);

  // Aynı birimin alanları tek tek: durum, borç, bina anahtarı, il, kiracı
  const webBirim = new Map(w.birimler.map((b) => [b.id, b]));
  let farkli = 0;
  for (const b of mulkler.kayitlar) {
    const k = webBirim.get(b.id);
    if (!k) continue;
    const ayni =
      k.durum === b.durum &&
      sayiAyni(k.gecikmisBorc, b.gecikmisBorc) &&
      k.gecikmeGun === b.gecikmeGun &&
      k.bina.anahtar === b.bina.anahtar &&
      k.il === b.il &&
      (k.kiraci?.id ?? null) === (b.kiraci?.id ?? null) &&
      sayiAyni(k.kiraci?.toplamBorc ?? null, b.kiraci?.toplamBorc ?? null) &&
      sayiAyni(k.kiraci?.monthlyRent ?? null, b.kiraci?.monthlyRent ?? null);
    if (!ayni) farkli++;
  }
  isle("birim alanları tek tek", farkli === 0, `karsilastirilan=${mulkler.kayitlar.length} farkli=${farkli}`);

  return { webBirimler: w.birimler, mobilOzet: m, mobilMulkIdleri: mulkler.kayitlar.map((b) => b.id) };
}

async function binalar(istek, cerez, bearer, webBirimler) {
  const [web, mBina, mSehir, mHarita] = await Promise.all([
    istek("/api/dashboard/binalar", { cerez }),
    istek("/api/mobil/panel/binalar", { bearer }),
    istek("/api/mobil/panel/sehir", { bearer }),
    istek("/api/mobil/panel/harita", { bearer }),
  ]);
  if (!kontrol("binalar", web, mBina, mSehir, mHarita)) return;

  // Web "binalar" ucu yalnız kayıtlı binaları verir; öneriyle gruplananları web istemcisi
  // birimlerden kurar. Asıl karşılık bu yüzden birimlerin bina anahtarıdır.
  const gruplar = webBinalari(webBirimler);
  const webAnahtarlar = [...gruplar.keys()];
  const mobilBinalar = mBina.json.binalar;

  kume("bina anahtarları (panel/binalar)", webAnahtarlar, mobilBinalar.map((b) => b.anahtar));
  kume("bina anahtarları (panel/sehir)", webAnahtarlar, mSehir.json.binalar.map((b) => b.anahtar));
  sayi("bina birim toplamı (panel/binalar)", webBirimler.length, toplam(mobilBinalar.map((b) => ({ n: b.birimler.length })), "n"));
  sayi("bina birim toplamı (panel/sehir)", webBirimler.length, toplam(mSehir.json.binalar.map((b) => ({ n: b.birimler.length })), "n"));

  const webKonumlu = [...gruplar.values()].filter((g) => g.konumlu).length;
  sayi("konumlu bina (panel/binalar)", webKonumlu, mobilBinalar.filter((b) => b.konum).length);
  sayi("konumlu bina (panel/sehir)", webKonumlu, mSehir.json.binalar.filter((b) => b.konum).length);

  // Ham kayıtlarla: mülke bağlı kayıtlı binalar ve konumları
  const bagliIdler = [...new Set(web.json.mulkler.map((m) => m.buildingId).filter(Boolean))];
  kume("kayıtlı bina id", bagliIdler, mobilBinalar.filter((b) => b.binaId).map((b) => b.binaId));
  const bagli = new Set(bagliIdler);
  const webKayitli = web.json.binalar.filter((b) => bagli.has(b.id));
  sayi(
    "kayıtlı binada konum",
    webKayitli.filter((b) => b.lat !== null && b.lng !== null).length,
    mobilBinalar.filter((b) => b.binaId && b.konum).length
  );
  sayi(
    "kayıtlı binada doğrulanmış konum",
    webKayitli.filter((b) => b.lat !== null && b.lng !== null && b.locationVerified).length,
    mobilBinalar.filter((b) => b.binaId && b.konum?.dogrulandi).length
  );

  // Harita: il bilinmeyen bina konumlu da olsa haritaya girmez
  const { konumlar, konumsuz } = mHarita.json;
  sayi("harita konum + konumsuz = bina sayısı", webAnahtarlar.length, konumlar.length + konumsuz.length);
  sayi(
    "harita kayıtlı konum",
    [...gruplar.values()].filter((g) => g.konumlu && g.ilVar).length,
    konumlar.filter((k) => k.kaynak === "kayit").length
  );
}

async function bildirimler(istek, cerez, bearer, mobilOzet) {
  const [web, mobil] = await Promise.all([
    istek("/api/dashboard/notifications/unread-count", { cerez }),
    istek("/api/mobil/panel/bildirimler?adet=1", { bearer }),
  ]);
  if (!kontrol("okunmamış bildirim", web, mobil)) return;
  sayi("okunmamış bildirim (panel/bildirimler)", web.json.count, mobil.json.okunmamis);
  sayi("okunmamış bildirim (panel/ozet)", web.json.count, mobilOzet.okunmamisBildirim);
}

async function kiracilarVeMulkler(istek, cerez, bearer, mobilMulkIdleri) {
  const [wKiraci, wMulk, mKiraci] = await Promise.all([
    istek("/api/dashboard/tenants?all=1", { cerez }),
    istek("/api/dashboard/properties?all=1", { cerez }),
    hepsiniCek(istek, "/api/mobil/panel/kiracilar", bearer),
  ]);
  if (!kontrol("kiracı ve mülk listeleri", wKiraci, wMulk, mKiraci)) return [];
  const webKiraciIdleri = wKiraci.json.tenants.map((t) => t.id);
  kume("kiracı id", webKiraciIdleri, mKiraci.kayitlar.map((t) => t.id));
  kume("mülk id", wMulk.json.properties.map((p) => p.id), mobilMulkIdleri);
  return webKiraciIdleri.slice(0, ORNEK_KIRACI);
}

// Birkaç kiracının ayrıntısı: borç, tahsilat, masraf, not. Tahsilat ve masraf listelerinin
// web'de JSON ucu yok; toplamları buradan doğrulanır.
async function kiraciOrnekleri(istek, cerez, bearer, idler) {
  let sira = 0;
  for (const id of idler) {
    sira++;
    const [web, mobil, tahsilat, masraf] = await Promise.all([
      istek(`/api/dashboard/tenants/${id}`, { cerez }),
      istek(`/api/mobil/panel/kiracilar/${id}`, { bearer }),
      istek(`/api/mobil/panel/tahsilatlar?tenantId=${id}&adet=1`, { bearer }),
      istek(`/api/mobil/panel/masraflar?tenantId=${id}&adet=1`, { bearer }),
    ]);
    const ad = `örnek kiracı ${sira}`;
    if (!kontrol(ad, web, mobil, tahsilat, masraf)) continue;
    const t = web.json.tenant;
    const k = mobil.json;
    const webOdemeler = t.debts.flatMap((d) => d.payments);
    sayi(`${ad}: borç adedi`, t.debts.length, k.borclar.length);
    sayi(`${ad}: borç tutarı`, toplam(t.debts, "amount"), toplam(k.borclar, "amount"));
    sayi(`${ad}: tahsilat toplamı`, toplam(webOdemeler, "amount"), toplam(k.borclar.flatMap((d) => d.tahsilatlar), "amount"));
    sayi(`${ad}: tahsilat toplamı (panel/tahsilatlar)`, toplam(webOdemeler, "amount"), tahsilat.json.toplamTutar);
    sayi(`${ad}: masraf toplamı`, toplam(t.expenses, "amount"), toplam(k.masraflar, "amount"));
    sayi(`${ad}: masraf toplamı (panel/masraflar)`, toplam(t.expenses, "amount"), masraf.json.toplamTutar);
    sayi(`${ad}: not adedi`, t.tenantNotes.length, k.notlar.length);
    sayi(`${ad}: aylık kira`, t.monthlyRent, k.sozlesme.monthlyRent);
    sayi(`${ad}: depozito`, t.depositAmount, k.sozlesme.depositAmount);
    bayrak(`${ad}: sözleşme dosyası var`, !!t.contractFileUrl, !!k.sozlesme.dosya);
  }
}

async function profil(istek, cerez, oturum, mobilOzet) {
  const [web, kilit] = await Promise.all([
    istek("/api/dashboard/profile", { cerez }),
    // Geçersiz ay: kilitli hesapta 403, değilse 400. Dış servise gitmez, hiçbir şey yazmaz.
    istek("/api/dashboard/rent-increase-rates?year=2000&month=0", { cerez }),
  ]);
  if (!kontrol("profil", web)) return;
  const { user, role } = web.json;
  const { kullanici, abonelik } = oturum;

  bayrak("rol", role === "ADMIN" ? "ADMIN" : "CUSTOMER", kullanici.tur === "ADMIN" ? "ADMIN" : "CUSTOMER");
  bayrak("profil eksik (şehir)", !user.city, oturum.profilEksik);
  gizliEsit("hesap adı", user.fullName, kullanici.hesapAdi);
  if (kullanici.tur !== "UYE") {
    gizliEsit("ad", user.fullName, kullanici.ad);
    gizliEsit("e-posta", user.email, kullanici.email);
  }
  gizliEsit("abonelik (giriş yanıtı ile panel/ozet)", JSON.stringify(abonelik), JSON.stringify(mobilOzet.abonelik));
  if (kilit.durum === 403 || kilit.durum === 400) {
    bayrak("hesap kilidi", kilit.durum === 403, abonelik.kilitli);
  } else {
    isle("hesap kilidi", false, `HTTP ${kilit.durum}`);
  }
}

// --- Akış ---

async function main() {
  const { readFileSync } = await import("node:fs");
  const ayar = argumanlar(process.argv.slice(2));
  let hesap;
  try {
    hesap = hesabiOku(readFileSync(ayar.hesap, "utf8"));
  } catch (e) {
    if (e instanceof Durdur) throw e;
    throw new Durdur(`Hesap dosyası okunamadı (${e.code ?? "hata"}).`);
  }
  const istek = istemci(ayar.taban);
  let cerez = null;
  let oturum = null;

  try {
    const web = await istek("/api/auth/login", {
      yontem: "POST",
      govde: { email: hesap.email, password: hesap.sifre },
    });
    if (web.durum !== 200) throw new Durdur(`Web girişi başarısız: HTTP ${web.durum}`);
    cerez = web.setCookie.map((c) => c.split(";")[0]).find((c) => c.startsWith("kira_session="));
    if (!cerez) throw new Durdur("Web girişi çerez döndürmedi.");

    const mobil = await istek("/api/mobil/giris", {
      yontem: "POST",
      govde: { email: hesap.email, sifre: hesap.sifre, cihazId: CIHAZ_ID },
    });
    if (mobil.durum !== 200) throw new Durdur(`Mobil giriş başarısız: HTTP ${mobil.durum} ${mobil.json?.kod ?? ""}`.trim());
    oturum = mobil.json;
    if (oturum.sozlesmeGerekli) throw new Durdur("Hesapta sözleşme onayı eksik; panel açılmaz. Betik onay yazmaz.");
    const bearer = oturum.erisimJetonu;

    const taban = await ozetVeBirimler(istek, cerez, bearer);
    if (taban) {
      await binalar(istek, cerez, bearer, taban.webBirimler);
      await bildirimler(istek, cerez, bearer, taban.mobilOzet);
      const ornekler = await kiracilarVeMulkler(istek, cerez, bearer, taban.mobilMulkIdleri);
      await kiraciOrnekleri(istek, cerez, bearer, ornekler);
      await profil(istek, cerez, oturum, taban.mobilOzet);
    }
  } finally {
    if (oturum) {
      await istek("/api/mobil/cikis", { yontem: "POST", govde: { yenilemeJetonu: oturum.yenilemeJetonu } }).catch(() => {});
    }
    if (cerez) await istek("/api/auth/logout", { yontem: "POST", cerez }).catch(() => {});
  }

  console.log(`\nSONUC tamam=${sonuclar.tamam} fark=${sonuclar.fark} bilgi=${sonuclar.bilgi}`);
  return sonuclar.fark ? 1 : 0;
}

main()
  .then((kod) => {
    process.exitCode = kod;
  })
  .catch((e) => {
    // Bilinmeyen hatada yalnız türü: mesaj adres ya da gövde içerebilir
    console.error(e instanceof Durdur ? e.message : `Hata: ${e?.name ?? "bilinmiyor"}`);
    process.exitCode = 2;
  });
