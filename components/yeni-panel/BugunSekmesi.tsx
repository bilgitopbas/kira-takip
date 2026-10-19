"use client";

// Sağ panel "Bugün" sekmesi: vadesi gelenler, gecikenler, sözleşme
// yenilemeleri, kira artış tarihleri. Satıra dokununca ilgili bina paneli açılır.
import Link from "next/link";
import type { BugunListeleri, BugunSatiri, PanelBirimi } from "@/lib/yeniPanelTipleri";
import { BasHarf, isoTr, kisaTl, tl } from "@/components/yeni-panel/ortak";

const LISTE_SINIRI = 4;

function gunFarki(iso: string) {
  const [y, a, g] = iso.split("-").map(Number);
  const hedef = new Date(y, a - 1, g).getTime();
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return Math.round((hedef - bugun.getTime()) / 86400000);
}

function Bolum({
  baslik,
  sayi,
  kirmizi,
  tumuHref,
  bosMetin,
  children,
}: {
  baslik: string;
  sayi: number;
  kirmizi?: boolean;
  tumuHref: string;
  bosMetin: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-3 first:pt-0 border-b border-gray-100 last:border-b-0">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
        {baslik}
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${kirmizi && sayi ? "bg-red-50 text-red-600" : "bg-gray-100 text-slate-500"}`}>{sayi}</span>
      </h3>
      {sayi === 0 ? <p className="text-xs text-slate-400">{bosMetin}</p> : <ul className="space-y-1">{children}</ul>}
      {sayi > LISTE_SINIRI && (
        <Link href={tumuHref} className="mt-1.5 inline-block text-xs font-semibold text-[#0a7c76] hover:underline">
          Tümünü gör →
        </Link>
      )}
    </section>
  );
}

function Satir({
  ad,
  alt,
  sag,
  sagAlt,
  sagAltKirmizi,
  onClick,
}: {
  ad: string;
  alt: string;
  sag: string;
  sagAlt: string;
  sagAltKirmizi?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left hover:bg-gray-50">
        <BasHarf ad={ad} />
        <span className="min-w-0 flex-1">
          <b className="block text-sm font-semibold text-slate-800 truncate">{ad}</b>
          <small className="block text-[11px] text-slate-500 truncate">{alt}</small>
        </span>
        <span className="text-right flex-shrink-0">
          <span className="block text-sm font-semibold tabular-nums text-slate-800">{sag}</span>
          <small className={`block text-[11px] ${sagAltKirmizi ? "text-red-600 font-semibold" : "text-slate-500"}`}>{sagAlt}</small>
        </span>
      </button>
    </li>
  );
}

export default function BugunSekmesi({
  bugun,
  birimler,
  tarihMetni,
  onBirim,
}: {
  bugun: BugunListeleri;
  /** Seçili ile göre süzülmüş birimler */
  birimler: PanelBirimi[];
  tarihMetni: string;
  onBirim: (birimId: string) => void;
}) {
  const ildeki = new Set(birimler.map((b) => b.id));
  const sus = (liste: BugunSatiri[]) => liste.filter((s) => ildeki.has(s.birimId));

  const vade = sus(bugun.vadesiGelenler);
  const gecikenler = birimler.filter((b) => b.durum === "gecikmis").sort((a, b) => b.gecikmisBorc - a.gecikmisBorc);
  const yenileme = sus(bugun.sozlesmeYenilemeleri);
  const artis = sus(bugun.kiraArtislari);
  const borcKaydiYok = birimler.filter((b) => b.borcKaydiYok).length;

  return (
    <div className="p-4 sm:p-5">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-bold text-slate-900">Bugün</h2>
        <span className="text-xs text-slate-500">{tarihMetni}</span>
      </header>

      {borcKaydiYok > 0 && (
        <p className="mb-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {borcKaydiYok} birimde bu ay için borç kaydı yok — borçlandırma unutulmuş olabilir.
        </p>
      )}

      <Bolum baslik="Vadesi gelenler" sayi={vade.length} tumuHref="/dashboard/tahsilat-defteri" bosMetin="Önümüzdeki 14 günde vadesi gelen ödeme yok.">
        {vade.slice(0, LISTE_SINIRI).map((s) => (
          <Satir key={`${s.tenantId}-${s.tarih}`} ad={s.tenantName} alt={s.propertyTitle} sag={tl(s.tutar ?? 0)} sagAlt={isoTr(s.tarih)} onClick={() => onBirim(s.birimId)} />
        ))}
      </Bolum>

      <Bolum baslik="Gecikenler" sayi={gecikenler.length} kirmizi tumuHref="/dashboard/tahsilat-defteri" bosMetin="Gecikmiş ödeme yok.">
        {gecikenler.slice(0, LISTE_SINIRI).map((b) => (
          <Satir
            key={b.id}
            ad={b.kiraci?.fullName ?? b.title}
            alt={b.title}
            sag={kisaTl(b.gecikmisBorc)}
            sagAlt={`${b.gecikmeGun} gün`}
            sagAltKirmizi
            onClick={() => onBirim(b.id)}
          />
        ))}
      </Bolum>

      <Bolum baslik="Sözleşme yenilemeleri" sayi={yenileme.length} tumuHref="/dashboard/takvim" bosMetin="Önümüzdeki 60 günde biten sözleşme yok.">
        {yenileme.slice(0, LISTE_SINIRI).map((s) => (
          <Satir key={`${s.tenantId}-${s.tarih}`} ad={s.tenantName} alt={s.propertyTitle} sag={isoTr(s.tarih)} sagAlt={`${gunFarki(s.tarih)} gün kaldı`} onClick={() => onBirim(s.birimId)} />
        ))}
      </Bolum>

      <Bolum baslik="Kira artış tarihleri" sayi={artis.length} tumuHref="/dashboard/kira-artis-hesapla" bosMetin="Önümüzdeki 45 günde kira artış tarihi yok.">
        {artis.slice(0, LISTE_SINIRI).map((s) => (
          <Satir key={`${s.tenantId}-${s.tarih}`} ad={s.tenantName} alt={s.propertyTitle} sag={isoTr(s.tarih)} sagAlt={`${gunFarki(s.tarih)} gün kaldı`} onClick={() => onBirim(s.birimId)} />
        ))}
      </Bolum>
    </div>
  );
}
