"use client";

// Sağ panel "Binalar" sekmesi: aranabilir, sıralanabilir bina listesi.
import { useMemo, useState } from "react";
import Link from "next/link";
import { binaEslesir, ozetle, type Bina } from "@/lib/yeniPanelBina";
import { DURUM_ZEMIN, DagilimCubugu, kisaTl } from "@/components/yeni-panel/ortak";

type Siralama = "gec" | "birim" | "ad";

export default function BinalarSekmesi({
  binalar,
  il,
  onSec,
}: {
  binalar: Bina[];
  il: string;
  onSec: (anahtar: string) => void;
}) {
  const [sorgu, setSorgu] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("gec");

  const satirlar = useMemo(() => {
    const liste = binalar.filter((b) => binaEslesir(b, sorgu)).map((b) => ({ b, o: ozetle(b.birimler) }));
    return liste.sort((x, y) => {
      if (siralama === "ad") return x.b.ad.localeCompare(y.b.ad, "tr");
      if (siralama === "birim") return y.o.n - x.o.n || x.b.ad.localeCompare(y.b.ad, "tr");
      return y.o.sayac.gecikmis - x.o.sayac.gecikmis || y.o.gecikmisBorc - x.o.gecikmisBorc || y.o.n - x.o.n;
    });
  }, [binalar, sorgu, siralama]);

  const birimSayisi = binalar.reduce((t, b) => t + b.birimler.length, 0);

  return (
    <div className="p-4 sm:p-5">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-bold text-slate-900">Binalar</h2>
        <span className="text-xs text-slate-500 tabular-nums">
          {satirlar.length < binalar.length ? `${satirlar.length}/` : ""}
          {binalar.length} bina · {birimSayisi} birim{il ? ` · ${il}` : ""}
        </span>
      </header>
      <Link
        href="/dashboard/binalarim"
        className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#17B6AE]/40 bg-[#17B6AE]/5 px-3 py-2 text-xs font-semibold text-[#0a7c76] hover:bg-[#17B6AE]/10"
      >
        <span>Bina eşlemesini kontrol et ve düzelt (Binalarım)</span>
        <span aria-hidden="true">→</span>
      </Link>
      <div className="flex gap-2 mb-3">
        <input
          type="search"
          value={sorgu}
          onChange={(e) => setSorgu(e.target.value)}
          placeholder="Bina, adres ya da kiracı"
          aria-label="Binalarda ara"
          className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
        />
        <select
          value={siralama}
          onChange={(e) => setSiralama(e.target.value as Siralama)}
          aria-label="Bina listesini sırala"
          className="rounded-xl border border-gray-200 px-2 py-2 text-sm bg-white"
        >
          <option value="gec">Gecikmiş</option>
          <option value="birim">Birim sayısı</option>
          <option value="ad">Ad</option>
        </select>
      </div>

      {satirlar.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          {binalar.length === 0 ? "Bu ilde kayıtlı mülk yok." : `“${sorgu.trim()}” için bina bulunamadı.`}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {satirlar.map(({ b, o }) => (
            <li key={b.anahtar}>
              <button
                type="button"
                onClick={() => onSec(b.anahtar)}
                className="w-full text-left rounded-xl border border-gray-100 bg-white px-3 py-2.5 hover:border-[#17B6AE]/40 hover:shadow-sm transition"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DURUM_ZEMIN[o.enKotu]}`} aria-hidden="true" />
                  <b className="flex-1 min-w-0 truncate text-sm text-slate-800">{b.ad}</b>
                  <span className={`text-[11px] font-semibold tabular-nums ${o.sayac.gecikmis ? "text-red-600" : "text-slate-400"}`}>
                    {o.sayac.gecikmis ? `${o.sayac.gecikmis} gecikmiş` : "gecikme yok"}
                  </span>
                </span>
                <small className="block text-[11px] text-slate-500 mt-0.5 pl-[18px] tabular-nums">
                  {b.bloklar.length ? b.bloklar.map((x) => `${x.ad} ${x.birimler.length}`).join(" / ") : `${o.n} birim`} · %
                  {o.n ? Math.round((o.dolu / o.n) * 100) : 0} dolu · {kisaTl(o.aylikKira)}/ay
                </small>
                <span className="block mt-1.5 pl-[18px]">
                  <DagilimCubugu ozet={o} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
