// Birim ödeme durumu kuralı testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { birimDurumuHesapla, type DurumBorcu } from "@/lib/birimDurumu";

// Bugün: 19 Ekim 2026
const BUGUN = new Date(2026, 9, 19, 14, 0, 0);

function borc(yil: number, ay: number, gun: number, tutar: number, odenen: number[] = [], periodMonths = 1): DurumBorcu {
  return {
    amount: tutar,
    dueDate: new Date(yil, ay - 1, gun),
    year: yil,
    month: ay,
    periodMonths,
    payments: odenen.map((amount) => ({ amount })),
  };
}

test("oturan kiracı yok → boş", () => {
  assert.equal(birimDurumuHesapla([], BUGUN).durum, "bos");
});

test("bu ayın borcu tamamen ödendi → ödendi", () => {
  const r = birimDurumuHesapla([[borc(2026, 10, 5, 20000, [20000])]], BUGUN);
  assert.equal(r.durum, "odendi");
  assert.equal(r.borcKaydiYok, false);
});

test("bu ayın borcu vadesi gelmedi → bekliyor", () => {
  const r = birimDurumuHesapla([[borc(2026, 10, 25, 20000)]], BUGUN);
  assert.equal(r.durum, "bekliyor");
  assert.equal(r.buAyVade?.getDate(), 25);
});

test("bu ayın borcu kısmen ödendi, vadesi gelmedi → bekliyor", () => {
  assert.equal(birimDurumuHesapla([[borc(2026, 10, 25, 20000, [5000])]], BUGUN).durum, "bekliyor");
});

test("vadesi geçmiş ödenmemiş borç → gecikmiş (gün ve tutar)", () => {
  const r = birimDurumuHesapla([[borc(2026, 9, 5, 20000, [5000]), borc(2026, 10, 5, 20000)]], BUGUN);
  assert.equal(r.durum, "gecikmis");
  assert.equal(r.gecikmisBorc, 35000);
  assert.equal(r.gecikmeGun, 44); // 5 Eylül → 19 Ekim
});

test("vade günü bugün → henüz gecikmiş değil", () => {
  assert.equal(birimDurumuHesapla([[borc(2026, 10, 19, 20000)]], BUGUN).durum, "bekliyor");
});

test("yıllık peşin borç bu ayı kapsıyor ve ödendi → ödendi", () => {
  const r = birimDurumuHesapla([[borc(2026, 3, 1, 240000, [240000], 12)]], BUGUN);
  assert.equal(r.durum, "odendi");
});

test("bu ay için borç kaydı yok → bekliyor + borcKaydiYok", () => {
  const r = birimDurumuHesapla([[borc(2026, 8, 5, 20000, [20000])]], BUGUN);
  assert.equal(r.durum, "bekliyor");
  assert.equal(r.borcKaydiYok, true);
});

test("iki oturan kiracı: biri gecikmişse birim gecikmiş", () => {
  const r = birimDurumuHesapla([[borc(2026, 10, 5, 10000, [10000])], [borc(2026, 9, 5, 10000)]], BUGUN);
  assert.equal(r.durum, "gecikmis");
});
