// Hesap silme ucu: ekip üyesi sahibin hesabını silemez. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hesapSilmeEngeli } from "@/lib/hesapSilmeYetkisi";

test("üye engellenir, sahip geçer", () => {
  assert.equal(hesapSilmeEngeli({}), null);
  assert.equal(hesapSilmeEngeli({ memberId: undefined }), null);
  assert.equal(typeof hesapSilmeEngeli({ memberId: "m1" }), "string");
});

test("uç, engeli herhangi bir silmeden önce uygular", () => {
  const kaynak = readFileSync("app/api/dashboard/profile/delete-account/route.ts", "utf8");
  const engel = kaynak.indexOf("hesapSilmeEngeli(session)");
  assert.ok(engel > 0, "engel çağrılıyor");
  assert.ok(engel < kaynak.indexOf("deleteMany"), "silmeden önce");
  assert.ok(kaynak.indexOf("status: 403") > engel, "403 döner");
});
