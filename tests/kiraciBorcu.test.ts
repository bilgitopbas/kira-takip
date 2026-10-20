// Kiracı kartı "Toplam Borç" testleri: detaydaki saf hesap ile kartların toplu
// sorgu hesabı aynı sonucu vermeli. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { borcGorunumu, bugunBasi, odemeTarihiMetni, toplamBorclar, toplamFarkBorc } from "@/lib/kiraciBorcu";

const SIMDI = new Date("2026-10-20T09:00:00Z"); // 20 Ekim 12:00 TR
const gun = (iso: string) => new Date(`${iso}T00:00:00Z`);

type B = { tenantId: string; amount: number; dueDate: Date; payments: { amount: number }[] };
const BORCLAR: B[] = [
  { tenantId: "k1", amount: 10000, dueDate: gun("2026-08-05"), payments: [{ amount: 10000 }] }, // ödendi
  { tenantId: "k1", amount: 10000, dueDate: gun("2026-09-05"), payments: [{ amount: 4000 }] }, // kısmi → 6000
  { tenantId: "k1", amount: 10000, dueDate: gun("2026-10-05"), payments: [] }, // gecikmiş → 10000
  { tenantId: "k1", amount: 10000, dueDate: gun("2026-11-05"), payments: [] }, // bekliyor → yok
  { tenantId: "k1", amount: 10000, dueDate: gun("2026-12-05"), payments: [{ amount: 2500 }] }, // erken kısmi → 7500
  { tenantId: "k2", amount: 5000, dueDate: gun("2026-09-01"), payments: [{ amount: 5500 }] }, // fazla ödeme → -500
  { tenantId: "k3", amount: 8000, dueDate: gun("2026-11-01"), payments: [] }, // yalnız bekleyen → 0
];

/** Prisma groupBy'ın bu kullanımını bellekte taklit eden sahte istemci */
function sahtePrisma(borclar: B[]) {
  type Kosul = { tenantId: { in: string[] }; OR: [{ dueDate: { lt: Date } }, { payments: { some: { amount: { gt: number } } } }] };
  const uyar = (b: B, k: Kosul) =>
    k.tenantId.in.includes(b.tenantId) && (b.dueDate < k.OR[0].dueDate.lt || b.payments.some((p) => p.amount > k.OR[1].payments.some.amount.gt));
  const grupla = (satirlar: { tenantId: string; amount: number }[]) => {
    const m = new Map<string, number>();
    for (const s of satirlar) m.set(s.tenantId, (m.get(s.tenantId) ?? 0) + s.amount);
    return [...m].map(([tenantId, t]) => ({ tenantId, _sum: { amount: t } }));
  };
  return {
    debt: { groupBy: async (a: { where: Kosul }) => grupla(borclar.filter((b) => uyar(b, a.where))) },
    payment: {
      groupBy: async (a: { where: { debt: { is: Kosul } } }) =>
        grupla(borclar.filter((b) => uyar(b, a.where.debt.is)).flatMap((b) => b.payments.map((p) => ({ tenantId: b.tenantId, amount: p.amount })))),
    },
  } as unknown as Parameters<typeof toplamBorclar>[0];
}

test("bugunBasi: Türkiye gün başı (UTC+3)", () => {
  assert.equal(bugunBasi(SIMDI).toISOString(), "2026-10-19T21:00:00.000Z");
  assert.equal(bugunBasi(new Date("2026-10-19T22:30:00Z")).toISOString(), "2026-10-19T21:00:00.000Z", "TR gece yarısından sonra yeni gün");
});

test("toplu sorgu hesabı = detaydaki saf hesap (her kiracı için)", async () => {
  const toplu = await toplamBorclar(sahtePrisma(BORCLAR), ["k1", "k2", "k3", "k1"], SIMDI);
  const beklenen = { k1: 6000 + 10000 + 7500, k2: -500, k3: 0 };
  assert.equal(toplu.get("k1"), beklenen.k1);
  assert.equal(toplu.get("k2"), beklenen.k2);
  assert.equal(toplu.get("k3") ?? 0, beklenen.k3);
  // Saf hesap gerçek "bugün"e göre çalışır: vadeleri SIMDI'ye göre geçmiş/gelecek
  // olarak çok uzak tarihlere taşıyıp aynı sonucu verdiğini doğruluyoruz.
  const saf = (id: string) =>
    toplamFarkBorc(
      BORCLAR.filter((b) => b.tenantId === id).map((b) => ({ ...b, dueDate: b.dueDate < bugunBasi(SIMDI) ? new Date("2000-01-01") : new Date("2999-01-01") }))
    );
  assert.equal(saf("k1"), beklenen.k1);
  assert.equal(saf("k2"), beklenen.k2);
  assert.equal(saf("k3"), beklenen.k3);
});

test("boş kiracı listesi sorgu atmaz", async () => {
  const p = { debt: { groupBy: async () => assert.fail("sorgu atılmamalı") }, payment: { groupBy: async () => assert.fail("sorgu atılmamalı") } };
  assert.equal((await toplamBorclar(p as unknown as Parameters<typeof toplamBorclar>[0], [])).size, 0);
});

test("kart gösterimi ve ödeme tarihi biçimi", () => {
  assert.deepEqual(borcGorunumu(23500), { metin: "23.500 ₺", sinif: "bg-red-50 text-red-600" });
  assert.equal(borcGorunumu(0).metin, "Borç yok");
  assert.match(borcGorunumu(-500).metin, /^Fazla ödeme \+500 ₺$/);
  assert.equal(odemeTarihiMetni("2026-10-05T00:00:00.000Z"), "05.10.2026");
  assert.equal(odemeTarihiMetni(null), null);
});
