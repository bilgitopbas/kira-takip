"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import veri from "@/lib/veri/il-ilce-merkezleri.json";
import { ILLER, ilCoz, katla, plakaKodu } from "@/lib/iller";
import { atamaGovdesi, formOnerisi, pinBaslangici, secilebilirBinalar, type BinaAlani, type FBina } from "@/lib/mulkFormuBina";
import { gorunumCoz, type Gorunum } from "@/lib/binaGorunumu";
import { GorunumKartlari } from "@/components/yeni-panel/GorunumSecici";

// Harita yalnız bina/konum bölümü açıkken (yeni panel) ve tarayıcıda yüklenir
const KonumHaritasi = dynamic(() => import("@/components/forms/KonumHaritasi"), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl border border-gray-200 grid place-items-center text-sm text-slate-400">Harita yükleniyor…</div>,
});

const ILCELER = veri.ilceler as unknown as Record<string, Record<string, [number, number]>>;

const PROPERTY_TYPES = [
  { value: "ARSA", label: "Arsa" },
  { value: "AVM", label: "AVM" },
  { value: "DEPO", label: "Depo" },
  { value: "DEVREMULK", label: "Devremülk" },
  { value: "FABRIKA", label: "Fabrika" },
  { value: "KONUT", label: "Konut" },
  { value: "OFIS", label: "Ofis" },
];

type Property = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  district: string | null;
  squareMeters: number | null;
  propertyType: string | null;
  notes: string | null;
  isOccupied: boolean;
};

type BinaVerisi = { binalar: FBina[]; atama: { buildingId: string | null; block: string | null; unitNo: string | null } | null };

const girdi = "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30";

export default function MulkForm({
  propertyId,
  onSuccess,
  onCancel,
}: {
  propertyId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const isEdit = !!propertyId;
  const [loading, setLoading] = useState(isEdit);
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [isOccupied, setIsOccupied] = useState(false);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [squareMeters, setSquareMeters] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Eklemede mülk kaydedilip bina bilgisi kaydedilemezse tekrar denemede
  // ikinci bir mülk oluşmasın diye kaydedilen kimlik tutulur.
  const [kaydedilenId, setKaydedilenId] = useState<string | null>(propertyId ?? null);

  // Bina + konum (yalnız yeni panel açıkken; uç 404 dönerse bölüm gizlenir)
  const [binaVeri, setBinaVeri] = useState<BinaVerisi | null>(null);
  // Elle düzenlenmemişse bina alanları başlık/adres/il'den önerilir
  const [elleBina, setElleBina] = useState<BinaAlani | null>(null);
  const [konum, setKonum] = useState<{ lat: number; lng: number } | null>(null);
  // 3D görünüm: kullanıcı bu bina seçimi için değiştirdiyse onun değeri
  const [gorunumElle, setGorunumElle] = useState<{ secim: string; deger: Gorunum | null } | null>(null);

  useEffect(() => {
    let iptal = false;
    async function load() {
      const [mulkRes, binaRes] = await Promise.all([
        propertyId ? fetch(`/api/dashboard/properties/${propertyId}`) : Promise.resolve(null),
        fetch(`/api/dashboard/binalar/ata${propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ""}`).catch(() => null),
      ]);
      if (iptal) return;
      if (mulkRes?.ok) {
        const { property }: { property: Property } = await mulkRes.json();
        setTitle(property.title);
        setPropertyType(property.propertyType || "");
        setIsOccupied(property.isOccupied);
        setCity(property.city || "");
        setDistrict(property.district || "");
        setSquareMeters(property.squareMeters ? String(property.squareMeters) : "");
        setAddress(property.address || "");
        setNotes(property.notes || "");
      }
      if (binaRes?.ok) {
        const v: BinaVerisi = await binaRes.json();
        if (iptal) return;
        setBinaVeri(v);
        // Kayıtlı ataması olan mülkte bu atama korunur (il/adres değişene dek)
        if (v.atama?.buildingId) {
          setElleBina({ secim: v.atama.buildingId, yeniAd: "", blok: v.atama.block ?? "", daireNo: v.atama.unitNo ?? "" });
        }
      }
      setLoading(false);
    }
    load();
    return () => {
      iptal = true;
    };
  }, [propertyId]);

  const binalar = useMemo(() => binaVeri?.binalar ?? [], [binaVeri]);
  const oneri = useMemo(() => formOnerisi({ title, address, city }, binalar), [title, address, city, binalar]);
  const bina = elleBina ?? oneri;
  const seciliBina = binalar.find((b) => b.id === bina.secim) ?? null;
  const gorunumDegisti = !!gorunumElle && gorunumElle.secim === bina.secim;
  const gorunum: Gorunum | null = gorunumDegisti ? gorunumElle!.deger : gorunumCoz(seciliBina?.gorunum) ?? null;
  const pin = pinBaslangici(seciliBina, city, district);
  const pinNokta = useMemo<[number, number]>(() => (konum ? [konum.lng, konum.lat] : pin.nokta), [konum, pin.nokta[0], pin.nokta[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const secenekler = secilebilirBinalar(binalar, city, bina.secim);
  const il = ilCoz(city);
  const ilceListesi = il ? Object.keys(ILCELER[il] ?? {}).sort((x, y) => x.localeCompare(y, "tr")) : [];
  const ilceListede = !district.trim() || ilceListesi.some((x) => katla(x) === katla(district));

  /** Konumu ya da eşlemeyi etkileyen alan değişti: öneri ve pin baştan hesaplanır */
  function konumAlaniDegisti() {
    setElleBina(null);
    setKonum(null);
  }
  function binaAlaniniDegistir(degisim: Partial<BinaAlani>) {
    if (degisim.secim !== undefined && degisim.secim !== bina.secim) setKonum(null);
    setElleBina({ ...bina, ...degisim });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const duzenleme = !!kaydedilenId;
    const res = await fetch(duzenleme ? `/api/dashboard/properties/${kaydedilenId}` : "/api/dashboard/properties", {
      method: duzenleme ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        address,
        city,
        district,
        squareMeters: squareMeters ? Number(squareMeters) : null,
        propertyType: propertyType || null,
        notes,
        isOccupied,
      }),
    });

    if (!res.ok) {
      setSubmitting(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error || (isEdit ? "Mülk güncellenemedi." : "Mülk oluşturulamadı."));
      return;
    }
    const { property } = (await res.json()) as { property: { id: string } };
    setKaydedilenId(property.id);

    if (binaVeri) {
      const atamaRes = await fetch("/api/dashboard/binalar/ata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          atamaGovdesi(property.id, bina, { title, city, district }, binalar, konum, bina.secim === "yeni" || gorunumDegisti ? gorunum : undefined)
        ),
      }).catch(() => null);
      if (!atamaRes?.ok) {
        setSubmitting(false);
        const data = atamaRes ? await atamaRes.json().catch(() => ({})) : {};
        setError(`Mülk kaydedildi ancak bina/konum bilgisi kaydedilemedi: ${data.error || "bağlantı hatası"}. Tekrar Kaydet'e basın.`);
        return;
      }
    }

    setSubmitting(false);
    onSuccess();
    router.refresh();
    if (!isEdit) router.push("/dashboard/kiraci");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-[#17B6AE]/5 border border-[#17B6AE]/20 text-sm text-slate-600 px-4 py-3 rounded-xl">
        {isEdit
          ? "Mülk bilgilerini güncelleyin."
          : "Mülkün türünü, durumunu ve görünen adını belirleyin. Mülkünüzü ekledikten sonra kiracı eklemeyi unutmayın."}
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mülk Adı *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setElleBina(null);
          }}
          placeholder="Örnek: Daire 5, Dükkan No:2"
          className={girdi}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Mülk Tipi</label>
        <div className="grid grid-cols-4 gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPropertyType(t.value)}
              className={`text-sm rounded-lg border px-3 py-2 transition ${
                propertyType === t.value ? "bg-[#17B6AE] text-white border-[#17B6AE]" : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Durum</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsOccupied(false)}
            className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
              !isOccupied ? "bg-red-50 text-red-600 border-red-300" : "bg-white text-slate-500 border-gray-300 hover:border-red-200"
            }`}
          >
            Boş
          </button>
          <button
            type="button"
            onClick={() => setIsOccupied(true)}
            className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
              isOccupied ? "bg-emerald-50 text-emerald-600 border-emerald-300" : "bg-white text-slate-500 border-gray-300 hover:border-emerald-200"
            }`}
          >
            Dolu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">İl</label>
          {/* 81 il listesi. Kayıttaki eski serbest metin listede birebir yoksa
              ("KONYA ", "Konya/Selçuklu" gibi) seçili olarak korunur; kullanıcı
              listeden seçmedikçe kayıt değişmez. */}
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setDistrict("");
              konumAlaniDegisti();
            }}
            className={`${girdi} bg-white`}
          >
            <option value="">İl seçin</option>
            {city && !(ILLER as readonly string[]).includes(city) && <option value={city}>{city} (kayıtlı)</option>}
            {[...ILLER]
              .sort((x, y) => x.localeCompare(y, "tr"))
              .map((il) => (
                <option key={il} value={il}>
                  {il} ({String(plakaKodu(il)).padStart(2, "0")})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">İlçe</label>
          {/* İlin ilçeleri öneri listesi olarak gelir; listede olmayan ilçe de yazılabilir */}
          <input
            type="text"
            value={district}
            list="mulk-ilceleri"
            onChange={(e) => {
              setDistrict(e.target.value);
              setKonum(null);
            }}
            placeholder={il ? "Listeden seçin" : "Önce il seçin"}
            className={girdi}
          />
          <datalist id="mulk-ilceleri">
            {ilceListesi.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">m²</label>
          <input type="number" min="0" value={squareMeters} onChange={(e) => setSquareMeters(e.target.value)} className={girdi} />
        </div>
      </div>
      {!ilceListede && il && (
        <p className="-mt-3 text-[11px] text-amber-700">Bu ilçe {il} listesinde yok; yazımı kontrol edin (harita il merkezinden başlar).</p>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adres *</label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setElleBina(null);
          }}
          placeholder="Açık adres"
          className={girdi}
        />
      </div>

      {binaVeri && (
        <fieldset className="rounded-2xl border border-gray-200 p-4 space-y-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Bina ve konum</legend>
          {!il && (
            <p className="text-[12px] rounded-lg bg-amber-50 border border-amber-100 text-amber-800 px-3 py-2">
              İl seçin: il olmadan mülk haritada gösterilmez ve hiçbir ile varsayılmaz.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bina</label>
              <select value={bina.secim} onChange={(e) => binaAlaniniDegistir({ secim: e.target.value })} className={`${girdi} bg-white`}>
                <option value="yeni">Yeni bina…</option>
                {secenekler.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.birimSayisi} birim{b.district ? ` · ${b.district}` : ""})
                  </option>
                ))}
                <option value="">Binaya bağlama</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Blok</label>
              <input
                type="text"
                value={bina.blok}
                maxLength={10}
                disabled={!bina.secim}
                onChange={(e) => binaAlaniniDegistir({ blok: e.target.value.toLocaleUpperCase("tr-TR") })}
                placeholder="A"
                className={`${girdi} disabled:bg-gray-50`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Daire / No</label>
              <input
                type="text"
                value={bina.daireNo}
                maxLength={20}
                disabled={!bina.secim}
                onChange={(e) => binaAlaniniDegistir({ daireNo: e.target.value })}
                placeholder="12"
                className={`${girdi} disabled:bg-gray-50`}
              />
            </div>
          </div>
          {bina.secim === "yeni" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Yeni bina adı</label>
              <input
                type="text"
                value={bina.yeniAd}
                maxLength={80}
                onChange={(e) => binaAlaniniDegistir({ yeniAd: e.target.value })}
                placeholder={title.trim() || "Örnek: Beştepe Sitesi"}
                className={girdi}
              />
            </div>
          )}
          {!elleBina && bina.secim !== "" && (
            <p className="text-[11px] text-slate-500">Mülk adı ve adresten önerildi; değiştirebilirsiniz.</p>
          )}

          {bina.secim !== "" && (
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                3D görünüm{seciliBina && seciliBina.birimSayisi > 1 ? ` (binanın tüm birimleri için)` : ""}
              </span>
              <GorunumKartlari deger={gorunum} onDegis={(g) => setGorunumElle({ secim: bina.secim, deger: g })} />
            </div>
          )}

          {bina.secim !== "" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Konum</span>
                {konum || pin.dogrulandi ? (
                  <span className="text-[11px] font-bold text-emerald-700">✓ Konum doğrulandı</span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700">
                    Konum doğrulanmadı · pin {pin.kaynak === "ilce" ? "ilçe" : pin.kaynak === "il" ? "il" : pin.kaynak === "bina" ? "kayıtlı bina" : "Türkiye"} merkezinde; sürükleyin
                  </span>
                )}
              </div>
              <KonumHaritasi nokta={pinNokta} yakinlik={pin.yakinlik} onDegis={(lat, lng) => setKonum({ lat, lng })} />
              {seciliBina && seciliBina.birimSayisi > 1 && (
                <p className="mt-1 text-[11px] text-slate-500">Bina konumu, binanın tüm birimleri ({seciliBina.birimSayisi}) için geçerlidir.</p>
              )}
            </div>
          )}
        </fieldset>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notlar</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${girdi} resize-none`} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
        >
          {submitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
