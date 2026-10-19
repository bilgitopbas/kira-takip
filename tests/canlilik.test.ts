// Mülk Şehrim canlılık kuralları (duman, pencere nabzı) testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { canliSahneUygun } from "@/lib/webglDestek";
import { bacaTutuyor, dumanBulutu, dumanEvresi, parlamaKatsayisi, type SehirBinasi } from "@/lib/sehir3dModeli";

test("canliSahneUygun: yalnız güçlü masaüstü, hareketi azalt kapalı", () => {
  assert.equal(canliSahneUygun({ dokunmatik: false, azHareket: false, cekirdek: 8, bellek: 8 }), true);
  assert.equal(canliSahneUygun({ dokunmatik: false, azHareket: false, cekirdek: 4 }), true, "bellek bilinmiyorsa çekirdek yeter");
  assert.equal(canliSahneUygun({ dokunmatik: true, azHareket: false, cekirdek: 8, bellek: 8 }), false, "telefon/tablet");
  assert.equal(canliSahneUygun({ dokunmatik: false, azHareket: true, cekirdek: 8, bellek: 8 }), false, "hareketi azalt");
  assert.equal(canliSahneUygun({ dokunmatik: false, azHareket: false, cekirdek: 2, bellek: 8 }), false, "az çekirdek");
  assert.equal(canliSahneUygun({ dokunmatik: false, azHareket: false, cekirdek: 8, bellek: 1 }), false, "az bellek");
  assert.equal(canliSahneUygun({ dokunmatik: false, azHareket: false }), false, "çekirdek bilinmiyor");
});

test("bacaTutuyor: tamamı boş fabrika tütmez", () => {
  const b = (durumlar: string[]) => ({ birimler: durumlar.map((durum, i) => ({ id: `u${i}`, durum })) }) as unknown as SehirBinasi;
  assert.equal(bacaTutuyor(b(["bos", "bos"])), false);
  assert.equal(bacaTutuyor(b(["bos", "gecikmis"])), true);
  assert.equal(bacaTutuyor(b(["odendi"])), true);
});

test("dumanEvresi: 0–1 arasında döner, bulutlar eşit aralıklı", () => {
  for (const t of [0, 1234, 6250, 99999, -500]) {
    for (let i = 0; i < 7; i++) {
      const p = dumanEvresi(t, i);
      assert.ok(p >= 0 && p < 1, `t=${t} i=${i} p=${p}`);
    }
  }
  assert.ok(Math.abs(dumanEvresi(0, 1) - 1 / 7) < 1e-9);
  // Tam tur (1 / 0,00016 ms) sonra aynı yer
  assert.ok(Math.abs(dumanEvresi(1 / 0.00016, 3) - dumanEvresi(0, 3)) < 1e-9);
  const ilk = dumanBulutu(0);
  const son = dumanBulutu(1);
  assert.ok(son.dy > ilk.dy && son.olcek > ilk.olcek, "iz yukarı çıkar ve genişler");
});

test("parlamaKatsayisi: sabitte 0,45; nabız 0,25–0,60", () => {
  assert.equal(parlamaKatsayisi(null), 0.45);
  for (let t = 0; t < 3000; t += 37) {
    const k = parlamaKatsayisi(t);
    assert.ok(k >= 0.25 - 1e-9 && k <= 0.6 + 1e-9, `t=${t} k=${k}`);
  }
});
