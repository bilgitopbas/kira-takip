"use client";

// Birim kartı = klasik "Mülklerim" kartı + "Kiracılar" kartıyla aynı yapı
// (önizleme v6). Düzenle / Masraflar / Sil / Tahsilat / Kiracı Ekle işlemleri
// klasik paneldeki bileşen ve uçları AYNEN kullanır; yeni bir yazma ucu yok.
import { useState } from "react";
import Link from "next/link";
import MulkMasraflarButton from "@/components/MulkMasraflarButton";
import MulkDuzenleButton from "@/components/MulkDuzenleButton";
import TahsilatEkleButton from "@/components/TahsilatEkleButton";
import KiraciEkleButton from "@/components/KiraciEkleButton";
import { durumMetni } from "@/lib/yeniPanelBina";
import type { PanelBirimi } from "@/lib/yeniPanelTipleri";
import { borcGorunumu } from "@/lib/kiraciBorcu";
import { BasHarf, DURUM_ROZET, TipRozeti, isoTr, tl } from "@/components/yeni-panel/ortak";

const AY_ADI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function Yildizlar({ puan }: { puan: number | null }) {
  if (!puan) return <span className="text-slate-400 text-xs">Puanlanmadı</span>;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${puan} / 5 puan`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${n <= puan ? "fill-amber-400 stroke-amber-400" : "fill-transparent stroke-gray-300"}`} strokeWidth={1.5} aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function BirimKarti({
  birim,
  onKapat,
  onDegisti,
}: {
  birim: PanelBirimi;
  onKapat: () => void;
  /** Kayıt değişti/silindi → paneli tazele */
  onDegisti: () => void;
}) {
  const [hata, setHata] = useState("");
  const k = birim.kiraci;
  const buAy = AY_ADI[new Date().getMonth()];

  async function sil(yol: string, soru: string, varsayilanHata: string) {
    if (!confirm(soru)) return;
    setHata("");
    const res = await fetch(yol, { method: "DELETE" });
    if (!res.ok) {
      const veri = await res.json().catch(() => ({}));
      setHata(veri.error || varsayilanHata);
      return;
    }
    onDegisti();
  }

  return (
    <div className="space-y-2 py-2" role="group" aria-label="Birim özeti">
      {/* Mülk kartı */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <TipRozeti tip={birim.propertyType} />
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                birim.isOccupied ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
              }`}
            >
              {birim.isOccupied ? "Dolu" : "Boş"}
            </span>
          </div>
          <button type="button" onClick={onKapat} aria-label="Birim kartını kapat" className="w-7 h-7 -mr-1 -mt-1 rounded-lg text-slate-400 hover:bg-gray-100 hover:text-slate-600">
            ×
          </button>
        </div>
        <h4 className="font-semibold text-slate-800 text-sm leading-snug" title={birim.title}>
          {birim.title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
          {birim.address || "Adres girilmemiş"}
          {birim.il ? ` · ${birim.il}` : birim.city ? ` · ${birim.city}` : ""}
        </p>
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-slate-500">
            {birim.oturanKiraciSayisi > 0 ? `${birim.oturanKiraciSayisi} kiracı` : "Kiracı yok"}
          </span>
          <div className="flex items-center gap-1">
            <MulkMasraflarButton propertyId={birim.id} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition" />
            <MulkDuzenleButton propertyId={birim.id} onUpdated={onDegisti} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#17B6AE]/10 text-[#17B6AE] hover:bg-[#17B6AE]/20 transition" />
            <button
              type="button"
              onClick={() => sil(`/api/dashboard/properties/${birim.id}`, "Bu mülkü silmek istediğinize emin misiniz?", "Mülk silinemedi.")}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition"
            >
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* Kiracı kartı */}
      {k ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link href={`/dashboard/kiraci/${k.id}`} className="flex items-center gap-3 min-w-0 group">
              <BasHarf ad={k.fullName} />
              <span className="min-w-0">
                <span className="block font-semibold text-slate-800 truncate group-hover:text-[#0a7c76]">{k.fullName}</span>
                <span className="block text-xs text-slate-500 truncate">{birim.title}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => sil(`/api/dashboard/tenants/${k.id}`, "Bu kiracıyı silmek istediğinize emin misiniz?", "Kiracı silinemedi.")}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition flex-shrink-0"
            >
              Sil
            </button>
          </div>
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Oturmaya devam ediyor</span>
          {birim.oturanKiraciSayisi > 1 && (
            <span className="ml-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              +{birim.oturanKiraciSayisi - 1} kiracı daha
            </span>
          )}
          <dl className="space-y-1.5 mt-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Aylık Kira</dt>
              <dd className="font-semibold text-slate-800 text-right">
                {k.monthlyRent === null ? (
                  <span className="text-amber-600 font-medium text-xs">— kira girilmemiş</span>
                ) : (
                  tl(k.monthlyRent)
                )}
                {birim.gecikmisBorc > 0 && <small className="block text-[11px] font-medium text-red-600">Borç {tl(birim.gecikmisBorc)}</small>}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Yıllık Kira</dt>
              <dd className="font-medium text-slate-700">{k.monthlyRent === null ? "—" : tl(k.monthlyRent * 12)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Başlangıç</dt>
              <dd className="text-slate-700">{isoTr(k.contractStart)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Kira Ödeme Tarihi</dt>
              <dd className="text-slate-700">{isoTr(k.rentPaymentDate)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Toplam Borç</dt>
              <dd>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${borcGorunumu(k.toplamBorc).sinif}`}>{borcGorunumu(k.toplamBorc).metin}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">{buAy} ödemesi</dt>
              <dd>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DURUM_ROZET[birim.durum]}`}>{durumMetni(birim)}</span>
              </dd>
            </div>
          </dl>
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-50">
            <Yildizlar puan={k.rating} />
            <TahsilatEkleButton className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#17B6AE] text-white hover:bg-[#149891] transition" />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Bu birimde oturan kiracı yok.</p>
          <KiraciEkleButton onCreated={onDegisti} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#17B6AE] text-white hover:bg-[#149891] transition whitespace-nowrap" />
        </div>
      )}

      {hata && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{hata}</p>}
    </div>
  );
}
