// Bina eşleme ve il eşleme tablo testleri.
// Çalıştır: npm test
//
// Girdiler, gerçek kayıtlarda görülen YAZIM KALIPLARINDAN türetilmiştir;
// kişi adı ya da gerçek bir müşterinin tam adres kaydı içermez.
import { test } from "node:test";
import assert from "node:assert/strict";
import { binaCoz, binalaraGrupla, metinCoz } from "@/lib/binaEslestir";
import { ILLER, ilCoz, plakaKodu } from "@/lib/iller";

type Beklenen = { ad: string; blok: string | null; no: string | null; guven: "yuksek" | "dusuk" } | null;

const TABLO: [string, Beklenen][] = [
  // Beştepe Plaza: yalnız A ve B blok (kullanıcı teyidi). "2A" → A, düşük güven.
  ["Beştepe 2A No:10", { ad: "BEŞTEPE", blok: "A", no: "10", guven: "dusuk" }],
  ["BEŞTEPE 2A BLOK NO : 5", { ad: "BEŞTEPE", blok: "A", no: "5", guven: "dusuk" }],
  ["BEŞTEPE 2A / 75", { ad: "BEŞTEPE", blok: "A", no: "75", guven: "dusuk" }],
  ["BEŞTEPE 31.SK. BİNA NO 2A KAPI NO :28", { ad: "BEŞTEPE", blok: "A", no: "28", guven: "dusuk" }],
  ["Beştepe A No:48", { ad: "BEŞTEPE", blok: "A", no: "48", guven: "yuksek" }],
  ["Beştepe B No:89", { ad: "BEŞTEPE", blok: "B", no: "89", guven: "yuksek" }],
  ["ÇAKIROĞLU A-BLOK NO:14", { ad: "ÇAKIROĞLU", blok: "A", no: "14", guven: "yuksek" }],
  // Çoklu birim kodu: eşleşmez, tek başına kalır
  ["KONYA DORUK SAN. 1M-1N", null],
  // Sentetik varyantlar
  ["beştepe a blok no:3", { ad: "BEŞTEPE", blok: "A", no: "3", guven: "yuksek" }],
  ["Çakıroğlu Blok B Daire 7", { ad: "ÇAKIROĞLU", blok: "B", no: "7", guven: "yuksek" }],
  ["Gül Apt. No:5", { ad: "GÜL APT", blok: null, no: "5", guven: "yuksek" }],
  ["Atatürk Cad. No:12 D:5", { ad: "ATATÜRK 12", blok: null, no: "5", guven: "yuksek" }],
  ["D100 Karayolu Depo", null],
  // Canlı ölçümde görülen kalıplar (sentetik örneklerle)
  ["Örnektepe A NO:102-103", { ad: "ÖRNEKTEPE", blok: "A", no: "102-103", guven: "yuksek" }],
  ["Örnektepe A NO:12-13-14", { ad: "ÖRNEKTEPE", blok: "A", no: "12-13-14", guven: "yuksek" }],
  ["Örnektepe NO:2A / 15", { ad: "ÖRNEKTEPE", blok: "A", no: "15", guven: "dusuk" }],
  ["Örnektepe A NO:12 Dükkan", { ad: "ÖRNEKTEPE", blok: "A", no: "12", guven: "yuksek" }],
  ["Örnektepe NO:5 A Blok", { ad: "ÖRNEKTEPE", blok: "A", no: "5", guven: "yuksek" }],
  ["Merkez Dükkan", null],
  ["", null],
];

for (const [girdi, beklenen] of TABLO) {
  test(`metinCoz: ${JSON.stringify(girdi)}`, () => {
    const sonuc = metinCoz(girdi);
    if (beklenen === null) {
      assert.equal(sonuc, null);
      return;
    }
    assert.ok(sonuc, "eşleşme bekleniyordu");
    assert.deepEqual(
      { ad: sonuc.ad, blok: sonuc.blok, no: sonuc.birimNo, guven: sonuc.guven },
      beklenen
    );
  });
}

test("binaCoz: başlık eşleşmezse adres denenir", () => {
  const c = binaCoz({ id: "m1", title: "Daire", address: "BEŞTEPE 31.SK. BİNA NO 2A KAPI NO :28", city: "Konya" });
  assert.equal(c.kaynak, "adres");
  assert.equal(c.blok, "A");
  assert.equal(c.birimNo, "28");
  assert.equal(c.binaAdi, "Beştepe");
  assert.equal(c.il, "Konya");
});

test("binaCoz: hiçbiri eşleşmezse mülk kendi başına bina olur", () => {
  const c = binaCoz({ id: "m9", title: "KONYA DORUK SAN. 1M-1N", address: "Organize Sanayi", city: "KONYA" });
  assert.equal(c.kaynak, "yok");
  assert.equal(c.binaAnahtari, "tek:m9");
  assert.equal(c.blok, null);
});

test("binalaraGrupla: Beştepe yazımları tek binada, A ve B bloklarında toplanır", () => {
  const mulkler = [
    { id: "1", title: "Beştepe 2A No:10", address: "", city: "Konya" },
    { id: "2", title: "BEŞTEPE 2A BLOK NO : 5", address: "", city: "KONYA " },
    { id: "3", title: "BEŞTEPE 2A / 75", address: "", city: "konya" },
    { id: "4", title: "Beştepe A No:48", address: "", city: "Konya" },
    { id: "5", title: "Beştepe B No:89", address: "", city: "Konya" },
    { id: "6", title: "ÇAKIROĞLU A-BLOK NO:14", address: "", city: "Konya" },
    { id: "7", title: "KONYA DORUK SAN. 1M-1N", address: "", city: "Konya" },
  ];
  const binalar = binalaraGrupla(mulkler);
  assert.equal(binalar.length, 3);

  const bestepe = binalar.find((b) => b.ad === "Beştepe");
  assert.ok(bestepe);
  assert.equal(bestepe.birimSayisi, 5);
  assert.equal(bestepe.kontrolGerekli, true);
  assert.deepEqual(bestepe.bloklar.map((b) => b.ad), ["A", "B"]);
  assert.deepEqual(bestepe.bloklar[0].birimler.map((u) => u.cozum.birimNo), ["5", "10", "48", "75"]);
  assert.deepEqual(bestepe.bloklar[1].birimler.map((u) => u.id), ["5"]);

  const cakiroglu = binalar.find((b) => b.ad === "Çakıroğlu");
  assert.ok(cakiroglu);
  assert.equal(cakiroglu.kontrolGerekli, false);
});

test("binalaraGrupla: aynı ad farklı illerde ayrı bina", () => {
  const binalar = binalaraGrupla([
    { id: "1", title: "Merkez Apt. No:1", city: "Konya" },
    { id: "2", title: "Merkez Apt. No:2", city: "Ankara" },
  ]);
  assert.equal(binalar.length, 2);
});

test("ILLER: 81 il, tekrar yok, plaka kodları 1-81", () => {
  assert.equal(ILLER.length, 81);
  assert.equal(new Set(ILLER).size, 81);
  assert.equal(plakaKodu("Adana"), 1);
  assert.equal(plakaKodu("Ankara"), 6);
  assert.equal(plakaKodu("İstanbul"), 34);
  assert.equal(plakaKodu("Konya"), 42);
  assert.equal(plakaKodu("Düzce"), 81);
});

const IL_TABLOSU: [string | null, string | null][] = [
  ["Konya", "Konya"],
  ["KONYA ", "Konya"],
  ["konya", "Konya"],
  ["İSTANBUL", "İstanbul"],
  ["istanbul", "İstanbul"],
  ["Istanbul", "İstanbul"],
  ["IĞDIR", "Iğdır"],
  ["izmir", "İzmir"],
  ["K.Maraş", "Kahramanmaraş"],
  ["Afyon", "Afyonkarahisar"],
  ["Urfa", "Şanlıurfa"],
  ["İçel", "Mersin"],
  ["Konya / Selçuklu", "Konya"],
  ["Selçuklu-Konya", "Konya"],
  ["Ankara / Konya", null],
  ["Selçuklu", null],
  ["", null],
  [null, null],
];

for (const [girdi, beklenen] of IL_TABLOSU) {
  test(`ilCoz: ${JSON.stringify(girdi)}`, () => {
    assert.equal(ilCoz(girdi), beklenen);
  });
}

test("baslangicKonumu: ilçe bulunursa ilçe, yoksa il merkezi, il yoksa null", async () => {
  const { baslangicKonumu } = await import("@/lib/konumMerkezi");
  const meram = baslangicKonumu("KONYA ", "meram");
  assert.equal(meram?.seviye, "ilce");
  const bilinmeyen = baslangicKonumu("Konya", "Olmayan İlçe");
  assert.equal(bilinmeyen?.seviye, "il");
  assert.ok(bilinmeyen && bilinmeyen.nokta[0] > 32 && bilinmeyen.nokta[0] < 33 && bilinmeyen.nokta[1] > 37.5 && bilinmeyen.nokta[1] < 38.2);
  assert.equal(baslangicKonumu("", "Meram"), null);
});

test("il-ilce-merkezleri.json: 81 ilin hepsinin koordinatı Türkiye sınırları içinde", async () => {
  const veri = (await import("@/lib/veri/il-ilce-merkezleri.json")).default as unknown as { iller: Record<string, [number, number]> };
  assert.deepEqual(Object.keys(veri.iller).sort(), [...ILLER].sort());
  for (const [il, [x, y]] of Object.entries(veri.iller)) {
    assert.ok(x > 25.5 && x < 45 && y > 35.8 && y < 42.2, `${il} sınır dışı`);
  }
});

test("Konya merkez ilçeleri (Selçuklu, Meram, Karatay) ilçe koordinatıyla ve il merkezine yakın", async () => {
  const { baslangicKonumu } = await import("@/lib/konumMerkezi");
  const merkez = baslangicKonumu("Konya", null)!.nokta;
  for (const ilce of ["Selçuklu", "SELÇUKLU", "Meram", "Karatay"]) {
    const k = baslangicKonumu("Konya", ilce);
    assert.equal(k?.seviye, "ilce", ilce);
    assert.ok(Math.hypot(k!.nokta[0] - merkez[0], k!.nokta[1] - merkez[1]) < 0.15, `${ilce} merkezden uzak`);
  }
});
