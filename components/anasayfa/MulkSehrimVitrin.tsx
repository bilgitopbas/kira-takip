"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { gecikme, Ok } from "./SvgTanimlari";
import { cihazDurumu } from "@/lib/webglDestek";
import { ornekBinalar } from "@/lib/anasayfaOrnekPortfoy";
import type { Sehir3DSecim } from "@/components/yeni-panel/Sehir3D";

// "Mülk Şehrim" vitrini: panelin GERÇEK 3D şehri, örnek portföyle. three.js
// yalnız ziyaretçi açınca yüklenir; açılmadan önce aynı bileşenden alınmış
// ekran görüntüsü gösterilir. Dış sunucuya istek atmaz (harita bilinçli olarak
// yok: karo sağlayıcısı üçüncü taraftır).

const Sehir3D = dynamic(() => import("@/components/yeni-panel/Sehir3D"), {
  ssr: false,
  loading: () => (
    <div className="vitrin-yukleniyor" role="status">
      Mülk Şehrim hazırlanıyor…
    </div>
  ),
});

const BOS_SECIM: Sehir3DSecim = { bina: null, blok: null, birim: null };
const DURUM_ADI = { odendi: "ödendi", bekliyor: "bekliyor", gecikmis: "gecikmiş", bos: "boş" } as const;

export default function MulkSehrimVitrin() {
  const binalar = useMemo(() => ornekBinalar(), []);
  const [acik, setAcik] = useState(false);
  const [webglYok, setWebglYok] = useState(false);
  const [secim, setSecim] = useState<Sehir3DSecim>(BOS_SECIM);

  const secili = secim.bina ? binalar.find((b) => b.anahtar === secim.bina) : undefined;
  const sayim = secili
    ? (["odendi", "bekliyor", "gecikmis", "bos"] as const)
        .map((d) => [d, secili.birimler.filter((u) => u.durum === d).length] as const)
        .filter(([, n]) => n > 0)
    : [];

  const ac = () => {
    if (!cihazDurumu().webgl) setWebglYok(true);
    else setAcik(true);
  };

  return (
    <section className="vitrin bolum" id="mulk-sehrim" aria-labelledby="vitrinBas">
      <div className="kap vitrin-ic">
        <div className="vitrin-metin">
          <span className="cip belir">Mülk Şehrim</span>
          <h2 className="bas belir" id="vitrinBas" style={gecikme(".08s")}>
            Portföyünüzü listede değil, <span className="vurgu">şehirde görün.</span>
          </h2>
          <p className="alt belir" style={gecikme(".16s")}>
            Mülkleriniz gerçek ölçüleriyle bir şehre dönüşür. Kat ve pencere sayısı birim sayısından, bina biçimi mülk tipinden gelir. Sorun nerede,
            uzaktan belli olur.
          </p>
          <p className="vitrin-ipucu belir" style={gecikme(".24s")}>
            3D Mülk Şehrim&apos;i açın: sürükleyerek döndürün, tekerlek ya da iki parmakla yakınlaştırın, bir binaya dokunun.
          </p>
          <div className="vitrin-secim" aria-live="polite">
            {secili ? (
              <>
                <b>{secili.ad}</b> · {secili.birimler.length} birim
                {sayim.map(([d, n]) => (
                  <span key={d} className={`vs-${d}`}>
                    {n} {DURUM_ADI[d]}
                  </span>
                ))}
              </>
            ) : (
              <span className="vitrin-secim-bos">Bir binaya dokunun; birimlerinin durumu burada görünür.</span>
            )}
          </div>
          <a href="/register" className="dugme ana belir" style={gecikme(".32s")}>
            Kendi şehrinizi kurun <Ok />
          </a>
        </div>

        <div className="vitrin-sahne belir" style={gecikme(".15s")} aria-label="3D Mülk Şehrim örneği">
          {acik ? (
            <Sehir3D binalar={binalar} secim={secim} yalnizGecikmis={false} il="" ornek onSec={(bina, birim, blok) => setSecim({ bina, birim, blok })} />
          ) : (
            <button type="button" className="vitrin-poster" style={{ backgroundImage: "url(/anasayfa/vitrin-3d.webp)" }} onClick={ac}>
              <span className="vitrin-oynat">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l10.5-6.5z" />
                </svg>
                {webglYok ? "Bu cihazda 3D desteklenmiyor" : "3D Mülk Şehrim'i canlı deneyin"}
              </span>
              <span className="vitrin-not">Örnek portföy · kayıt gerekmez</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
