"use client";

// Mülk Şehrim bina düzeninin saklanması (hesap düzeyinde).
// Sunucu ucu: /api/dashboard/sehir-duzeni (il başına). Tablo henüz kurulmadıysa
// uç { sunucu: false } döner ve düzen bu cihazda (localStorage) tutulur; tablo
// kurulduktan sonraki ilk açılışta cihazdaki düzen bir kez sunucuya aktarılır.
import { useCallback, useEffect, useState } from "react";
import type { Duzen } from "@/lib/sehirDuzeni";

const yerelAnahtar = (hesap: string, il: string) => `mizan_sehir_duzeni:${hesap}:${il}`;

function yerelOku(anahtar: string): Duzen | null {
  try {
    const v = window.localStorage.getItem(anahtar);
    return v ? (JSON.parse(v) as Duzen) : null;
  } catch {
    return null;
  }
}
function yerelYaz(anahtar: string, duzen: Duzen | null) {
  try {
    if (duzen && Object.keys(duzen).length) window.localStorage.setItem(anahtar, JSON.stringify(duzen));
    else window.localStorage.removeItem(anahtar);
  } catch {
    // gizli pencere vb.: yalnız bu oturumda geçerli olur
  }
}

async function sunucuyaYaz(il: string, duzen: Duzen | null): Promise<boolean> {
  try {
    const r = await fetch("/api/dashboard/sehir-duzeni", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ il, duzen: duzen ?? {} }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** il: seçili il adı, "" = tüm iller */
export function useSehirDuzeni(il: string) {
  const ilAnahtari = il || "*";
  const [durum, setDurum] = useState<{ il: string; duzen: Duzen | null; sunucu: boolean; hesap: string } | null>(null);

  useEffect(() => {
    let iptal = false;
    (async () => {
      let sunucu = false;
      let hesap = "yerel";
      let duzen: Duzen | null = null;
      try {
        const r = await fetch(`/api/dashboard/sehir-duzeni?il=${encodeURIComponent(ilAnahtari)}`, { signal: AbortSignal.timeout(4000) });
        if (r.ok) {
          const v = (await r.json()) as { sunucu: boolean; hesap: string; duzen: Duzen | null };
          sunucu = v.sunucu;
          hesap = v.hesap || hesap;
          duzen = v.duzen;
        }
      } catch {
        // çevrimdışı: cihazdaki düzen
      }
      const yerel = yerelOku(yerelAnahtar(hesap, ilAnahtari));
      if (sunucu && !duzen && yerel) {
        // Tablo kurulmadan önce bu cihazda yapılmış düzeni bir kez sunucuya taşı
        if (await sunucuyaYaz(ilAnahtari, yerel)) yerelYaz(yerelAnahtar(hesap, ilAnahtari), null);
        duzen = yerel;
      } else if (!sunucu) duzen = yerel;
      if (!iptal) setDurum({ il: ilAnahtari, duzen, sunucu, hesap });
    })();
    return () => {
      iptal = true;
    };
  }, [ilAnahtari]);

  const kaydet = useCallback(
    async (duzen: Duzen | null) => {
      if (!durum || durum.il !== ilAnahtari) return;
      setDurum({ ...durum, duzen });
      const tamam = durum.sunucu ? await sunucuyaYaz(ilAnahtari, duzen) : false;
      // Sunucu yoksa ya da yazılamadıysa cihazda tut (düzen kaybolmasın)
      yerelYaz(yerelAnahtar(durum.hesap, ilAnahtari), tamam ? null : duzen);
    },
    [durum, ilAnahtari]
  );

  const gecerli = durum && durum.il === ilAnahtari ? durum : null;
  return { duzen: gecerli?.duzen ?? null, yuklendi: !!gecerli, sunucuda: !!gecerli?.sunucu, kaydet };
}
