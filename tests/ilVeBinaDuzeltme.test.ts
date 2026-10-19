// İl teşhisi, kayıtlı binaya öneri, Yeniden eşle, mülk formu bina/konum ve
// varsayılan panel testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { binaAnahtariOlustur, binaCoz } from "@/lib/binaEslestir";
import { baslangicGruplari, ilUyarilari, yenidenEsle, type BMulk } from "@/lib/binalarimModeli";
import { atamaDogrula } from "@/lib/binalarimKayit";
import { atamaGovdesi, formOnerisi, pinBaslangici, secilebilirBinalar, TURKIYE_MERKEZI, type FBina } from "@/lib/mulkFormuBina";
import { baslangicKonumu } from "@/lib/konumMerkezi";
import { klasikIstendi } from "@/lib/panelTercihi";

const m = (id: string, title: string, ek: Partial<BMulk> = {}): BMulk => ({
  id, title, address: "", city: "Ankara", district: "Yenimahalle", propertyType: "KONUT", buildingId: null, block: null, unitNo: null, ...ek,
});

test("bina anahtarı: öneri ile kayıtlı bina aynı; il çözülemezse hiçbir ile varsayılmaz", () => {
  assert.equal(binaCoz({ id: "x", title: "Beştepe A No:3", city: "ANKARA " }).binaAnahtari, binaAnahtariOlustur("Ankara", "Beştepe"));
  assert.equal(binaAnahtariOlustur("", "Beştepe"), "-|bestepe");
  assert.equal(binaAnahtariOlustur("Bilinmeyen", "Beştepe"), "-|bestepe");
  assert.equal(binaCoz({ id: "x", title: "Beştepe A No:3", city: null }).il, null);
  // İl yoksa harita başlangıcı da yok (Konya ya da başka ile düşmez)
  assert.equal(baslangicKonumu("", "Karatay"), null);
  assert.equal(baslangicKonumu(null, null), null);
});

test("bağlanmamış mülk, aynı ildeki aynı adlı kayıtlı binaya öneri olarak düşer; başka ildekine düşmez", () => {
  const binalar = [{ id: "bA", name: "Beştepe", city: "Ankara", district: "Yenimahalle", lat: 39.94, lng: 32.8, locationVerified: true }];
  const mulkler = [
    m("1", "Beştepe A No:1", { buildingId: "bA", block: "A", unitNo: "1" }),
    m("2", "Beştepe A No:2"),
    m("3", "Beştepe A No:3", { city: "Konya", district: "Karatay" }),
  ];
  const g = baslangicGruplari(mulkler, binalar);
  const ankara = g.find((x) => x.id === "bA")!;
  assert.deepEqual(ankara.birimler.map((b) => [b.propertyId, !!b.yeniOneri]), [["1", false], ["2", true]]);
  const konya = g.find((x) => x.il === "Konya")!;
  assert.equal(konya.oneri, true);
  assert.deepEqual(konya.birimler.map((b) => b.propertyId), ["3"]);
});

test("il uyarıları: Konya'daki 1 birimlik Beştepe için Ankara uyarısı; il yok uyarısı", () => {
  const binalar = [{ id: "bA", name: "Beştepe", city: "Ankara", district: null, lat: null, lng: null, locationVerified: false }];
  const mulkler = [
    m("1", "Beştepe A No:1", { buildingId: "bA" }),
    m("2", "Beştepe A No:2", { buildingId: "bA" }),
    m("3", "Beştepe A No:3", { city: "Konya", district: "Karatay" }),
    m("4", "Çarşı Dükkanı", { city: "" }),
  ];
  const g = baslangicGruplari(mulkler, binalar);
  const u = ilUyarilari(g);
  const konya = g.find((x) => x.il === "Konya")!;
  assert.deepEqual(u.get(konya.anahtar)?.digerIller, [{ il: "Ankara", birim: 2 }]);
  assert.equal(u.get("b:bA"), undefined, "çoğunluktaki Ankara binası uyarı almaz");
  const ilsiz = g.find((x) => x.ad === "Çarşı Dükkanı")!;
  assert.equal(u.get(ilsiz.anahtar)?.ilYok, true);
});

test("Yeniden eşle: il düzeltilen mülk doğru ildeki kayıtlı binaya taşınır, boşalan grup düşer", () => {
  const binalar = [
    { id: "bA", name: "Beştepe", city: "Ankara", district: null, lat: null, lng: null, locationVerified: false },
    { id: "bK", name: "Beştepe", city: "Konya", district: "Karatay", lat: null, lng: null, locationVerified: false },
  ];
  const once = [m("1", "Beştepe A No:1", { buildingId: "bA" }), m("3", "Beştepe A No:3", { city: "Konya", buildingId: "bK" })];
  const g = baslangicGruplari(once, binalar);
  // Kullanıcı formda ilini Ankara yaptı (mülk verisi güncellendi), sonra Yeniden eşle
  const sonra = [once[0], { ...once[1], city: "Ankara", district: "Yenimahalle" }];
  const y = yenidenEsle(g, "b:bK", sonra);
  assert.equal(y.find((x) => x.id === "bK"), undefined);
  const ankara = y.find((x) => x.id === "bA")!;
  assert.deepEqual(ankara.birimler.map((b) => b.propertyId).sort(), ["1", "3"]);
  assert.ok(ankara.birimler.some((b) => b.propertyId === "3" && b.blok === "A" && b.daireNo === "3"));
  assert.equal(ankara.onayli, true);
});

const FB: FBina[] = [
  { id: "bA", name: "Beştepe", city: "Ankara", district: "Yenimahalle", lat: 39.94, lng: 32.8, locationVerified: true, birimSayisi: 49 },
  { id: "bK", name: "Gül Apt.", city: "Konya", district: "Meram", lat: null, lng: null, locationVerified: false, birimSayisi: 4 },
];

test("form önerisi: kayıtlı bina seçilir; yoksa önerilen adla yeni bina; tek başına mülk kendi adıyla", () => {
  assert.deepEqual(formOnerisi({ title: "Beştepe B No:12", address: "", city: "Ankara" }, FB), { secim: "bA", yeniAd: "", blok: "B", daireNo: "12" });
  assert.deepEqual(formOnerisi({ title: "Beştepe B No:12", address: "", city: "Konya" }, FB), { secim: "yeni", yeniAd: "Beştepe", blok: "B", daireNo: "12" });
  assert.deepEqual(formOnerisi({ title: "Merkez Dükkan", address: "Çarşı", city: "Konya" }, FB), { secim: "yeni", yeniAd: "Merkez Dükkan", blok: "", daireNo: "" });
});

test("pin başlangıcı: kayıtlı bina konumu → ilçe → il → Türkiye (hiçbir ile varsayılmaz)", () => {
  assert.deepEqual(pinBaslangici(FB[0], "Ankara", "").nokta, [32.8, 39.94]);
  assert.equal(pinBaslangici(FB[0], "Ankara", "").dogrulandi, true);
  assert.equal(pinBaslangici(FB[1], "Konya", "Meram").kaynak, "ilce");
  assert.equal(pinBaslangici(null, "Konya", "Olmayanilçe").kaynak, "il");
  const t = pinBaslangici(null, "", "Karatay");
  assert.equal(t.kaynak, "turkiye");
  assert.deepEqual(t.nokta, TURKIYE_MERKEZI);
});

test("seçilebilir binalar aynı ilden (+ seçili olan); atama gövdesi", () => {
  assert.deepEqual(secilebilirBinalar(FB, "Ankara", "").map((b) => b.id), ["bA"]);
  assert.deepEqual(secilebilirBinalar(FB, "Ankara", "bK").map((b) => b.id), ["bA", "bK"]);
  assert.equal(secilebilirBinalar(FB, "", "").length, 2);

  const yeni = atamaGovdesi("p1", { secim: "yeni", yeniAd: " ", blok: "a ", daireNo: "" }, { title: "Daire 5", city: "KONYA ", district: "Meram" }, FB, { lat: 37.8, lng: 32.4 });
  assert.deepEqual(yeni, { propertyId: "p1", bina: { id: null, ad: "Daire 5", il: "Konya", ilce: "Meram", konum: { lat: 37.8, lng: 32.4, dogrulandi: true } }, blok: "a", daireNo: null });
  const mevcut = atamaGovdesi("p1", { secim: "bA", yeniAd: "", blok: "B", daireNo: "12" }, { title: "x", city: "Ankara", district: "" }, FB, null);
  assert.equal(mevcut.bina?.id, "bA");
  assert.equal(mevcut.bina?.konum, null);
  assert.equal(atamaGovdesi("p1", { secim: "", yeniAd: "", blok: "B", daireNo: "1" }, { title: "x", city: "", district: "" }, FB, null).bina, null);
});

test("atama doğrulaması: sahiplik, blok biçimi, il listesi; binadan çıkarma", () => {
  const MULK = new Set(["p1"]);
  const BINA = new Set(["bA"]);
  const r = atamaDogrula({ propertyId: "p1", bina: { id: null, ad: "Beştepe", il: "Ankara", ilce: "Yenimahalle", konum: null }, blok: "b", daireNo: "12" }, MULK, BINA);
  assert.ok(r.ok && r.atama.blok === "B" && r.atama.bina?.ad === "Beştepe");
  assert.equal(atamaDogrula({ propertyId: "baskasi", bina: null }, MULK, BINA).ok, false);
  assert.equal(atamaDogrula({ propertyId: "p1", bina: { id: "baskaBina", ad: "X", il: null, ilce: null, konum: null } }, MULK, BINA).ok, false);
  const ilHatali = atamaDogrula({ propertyId: "p1", bina: { id: null, ad: "X", il: "Konyaa", ilce: null, konum: null } }, MULK, BINA);
  assert.ok(!ilHatali.ok && ilHatali.hata === "il listeden seçilmeli.");
  const cikar = atamaDogrula({ propertyId: "p1", bina: null }, MULK, BINA);
  assert.ok(cikar.ok && cikar.atama.bina === null);
});

test("varsayılan panel: yalnız ?panel=klasik klasik açar", () => {
  assert.equal(klasikIstendi("klasik"), true);
  assert.equal(klasikIstendi(["x", "klasik"]), true);
  assert.equal(klasikIstendi("yeni"), false);
  assert.equal(klasikIstendi(undefined), false);
});
