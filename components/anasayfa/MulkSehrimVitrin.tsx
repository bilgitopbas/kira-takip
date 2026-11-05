"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { gecikme, Ok } from "./SvgTanimlari";
import { cihazDurumu } from "@/lib/webglDestek";
import { ornekBinalar } from "@/lib/anasayfaOrnekPortfoy";
import type { Sehir3DSecim } from "@/components/yeni-panel/Sehir3D";

// "Mülk Şehrim" vitrini: panelin GERÇEK 3D şehri ve konum haritası, örnek
// portföyle. Ağır kütüphaneler (three, maplibre-gl) yalnız ziyaretçi açınca yüklenir;
// açılmadan önce aynı bileşenlerden alınmış ekran görüntüsü gösterilir.

const Yukleniyor = ({ metin }: { metin: string }) => (
  <div className="vitrin-yukleniyor" role="status">
    {metin}
  </div>
);
const Sehir3D = dynamic(() => import("@/components/yeni-panel/Sehir3D"), {
  ssr: false,
  loading: () => <Yukleniyor metin="Mülk Şehrim hazırlanıyor…" />,
});
const Harita = dynamic(() => import("@/components/yeni-panel/Harita"), {
  ssr: false,
  loading: () => <Yukleniyor metin="Harita yükleniyor…" />,
});

type Sekme = "sehir" | "konum";
const SEKMELER: { id: Sekme; ad: string; poster: string; dugme: string; ipucu: string }[] = [
  {
    id: "sehir",
    ad: "3D Mülk Şehrim",
    poster: "/anasayfa/vitrin-3d.webp",
    dugme: "3D şehri canlı deneyin",
    ipucu: "Sürükleyerek döndürün, tekerlek ya da iki parmakla yakınlaştırın, bir binaya dokunun.",
  },
  {
    id: "konum",
    ad: "Konum Haritası",
    poster: "/anasayfa/vitrin-harita.webp",
    dugme: "Haritayı canlı açın",
    ipucu: "Her pin bir bina; rengi binadaki en kötü ödeme durumunu, rozeti birim sayısını gösterir.",
  },
];
const BOS_SECIM: Sehir3DSecim = { bina: null, blok: null, birim: null };
const DURUM_ADI = { odendi: "ödendi", bekliyor: "bekliyor", gecikmis: "gecikmiş", bos: "boş" } as const;

export default function MulkSehrimVitrin() {
  const binalar = useMemo(() => ornekBinalar(), []);
  const [sekme, setSekme] = useState<Sekme>("sehir");
  const [acilan, setAcilan] = useState<Record<Sekme, boolean>>({ sehir: false, konum: false });
  const [webglYok, setWebglYok] = useState(false);
  const [secim, setSecim] = useState<Sehir3DSecim>(BOS_SECIM);
  const [haritaSecili, setHaritaSecili] = useState<string | null>(null);

  const aktif = SEKMELER.find((s) => s.id === sekme)!;
  const seciliAnahtar = sekme === "sehir" ? secim.bina : haritaSecili;
  const secili = seciliAnahtar ? binalar.find((b) => b.anahtar === seciliAnahtar) : undefined;
  const sayim = secili
    ? (["odendi", "bekliyor", "gecikmis", "bos"] as const)
        .map((d) => [d, secili.birimler.filter((u) => u.durum === d).length] as const)
        .filter(([, n]) => n > 0)
    : [];

  const ac = () => {
    if (!cihazDurumu().webgl) setWebglYok(true);
    else setAcilan((a) => ({ ...a, [sekme]: true }));
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
          <div className="vitrin-sekmeler belir" role="tablist" aria-label="Mülk Şehrim görünümleri" style={gecikme(".24s")}>
            {SEKMELER.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`vitrin-${s.id}`}
                aria-selected={sekme === s.id}
                aria-controls="vitrinSahne"
                onClick={() => setSekme(s.id)}
              >
                {s.ad}
              </button>
            ))}
          </div>
          <p className="vitrin-ipucu belir" style={gecikme(".3s")}>
            {aktif.ipucu}
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
          <a href="/register" className="dugme ana belir" style={gecikme(".36s")}>
            Kendi şehrinizi kurun <Ok />
          </a>
        </div>

        <div className="vitrin-sahne belir" id="vitrinSahne" role="tabpanel" aria-labelledby={`vitrin-${sekme}`} style={gecikme(".15s")}>
          {acilan[sekme] ? (
            sekme === "sehir" ? (
              <Sehir3D binalar={binalar} secim={secim} yalnizGecikmis={false} il="" ornek onSec={(bina, birim, blok) => setSecim({ bina, birim, blok })} />
            ) : (
              <Harita
                binalar={binalar}
                il=""
                seciliAnahtar={haritaSecili}
                duzeltmeler={{}}
                onSec={setHaritaSecili}
                onKonumDuzelt={() => {}}
                onKonumKaydet={async () => null}
              />
            )
          ) : (
            <button type="button" className="vitrin-poster" style={{ backgroundImage: `url(${aktif.poster})` }} onClick={ac}>
              <span className="vitrin-oynat">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l10.5-6.5z" />
                </svg>
                {webglYok ? "Bu cihazda 3D ve harita desteklenmiyor" : aktif.dugme}
              </span>
              <span className="vitrin-not">Örnek portföy · kayıt gerekmez</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
