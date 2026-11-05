// Google Analytics'in çalışabileceği sayfalar. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { gaIzinliYol } from "@/lib/cerezOnayi";

test("GA yalnız ana sayfa, blog ve yasal metinlerde", () => {
  for (const y of ["/", "/blog", "/blog/kira-artis-orani", "/gizlilik-politikasi", "/cerez-politikasi", "/aydinlatma-metni"]) {
    assert.ok(gaIzinliYol(y), y);
  }
});

test("GA panel, yönetim, giriş ve jeton taşıyan sayfalarda asla çalışmaz", () => {
  for (const y of ["/dashboard", "/dashboard/kiraci", "/admin/destek", "/login", "/register", "/reset-password", "/forgot-password", "/eposta-onay", "/hesap-davet", "/oturum-callback", "/blogger"]) {
    assert.ok(!gaIzinliYol(y), y);
  }
});
