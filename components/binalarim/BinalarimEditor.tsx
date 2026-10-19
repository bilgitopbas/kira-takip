"use client";

// "Binalarım" eşleme ekranı (yeni panel). Otomatik öneriler (başlık/adres
// eşlemesi) mülk sahibince onaylanır ya da düzeltilir: bina adı, il/ilçe,
// konum (harita pini), blok ve daire no; birimler binalar arasında sürükle-
// bırak ya da "Taşı" ile taşınır, binalar birleştirilir/ayrılır.
// Kayıt yalnız bina eşlemesini yazar; mülkün kendi bilgileri, kiracıları ve
// borçları değişmez.
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import veri from "@/lib/veri/il-ilce-merkezleri.json";
import { ILLER } from "@/lib/iller";
import { baslangicKonumu } from "@/lib/konumMerkezi";
import { baslangicGruplari, ilUyarilari, kayitGovdesi, yenidenEsle, type BBina, type BMulk, type EGrup } from "@/lib/binalarimModeli";
import MulkDuzenleButton from "@/components/MulkDuzenleButton";

const KonumSecici = dynamic(() => import("@/components/binalarim/KonumSecici"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl border border-gray-200 grid place-items-center text-sm text-slate-400">Harita yükleniyor…</div>,
});

const ILCELER = veri.ilceler as unknown as Record<string, Record<string, [number, number]>>;
const TURKIYE: [number, number] = [35.2, 39.0];

const girdi = "rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white";

export default function BinalarimEditor({ mulkler, binalar }: { mulkler: BMulk[]; binalar: BBina[] }) {
  const router = useRouter();
  const [gruplar, setGruplar] = useState<EGrup[]>(() => baslangicGruplari(mulkler, binalar));
  const [degisti, setDegisti] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);
  const [yalnizKontrol, setYalnizKontrol] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const [konumAcik, setKonumAcik] = useState<string | null>(null);
  const [surukelenen, setSurukelenen] = useState<{ birim: string; kaynak: string } | null>(null);
  const [yeniSayac, setYeniSayac] = useState(1);

  // Kaydedilmemiş değişiklikle sayfadan çıkarken uyar
  useEffect(() => {
    if (!degisti) return;
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", uyar);
    return () => window.removeEventListener("beforeunload", uyar);
  }, [degisti]);

  /** Bir grubu değiştir; düzenlenen öneri otomatik onaylanır */
  function guncelle(anahtar: string, f: (g: EGrup) => EGrup) {
    setGruplar((gs) => gs.map((g) => (g.anahtar === anahtar ? { ...f(g), onayli: true } : g)));
    setDegisti(true);
    setMesaj(null);
  }

  function birimTasi(birimId: string, kaynak: string, hedef: string) {
    if (kaynak === hedef) return;
    setGruplar((gs) => {
      const k = gs.find((g) => g.anahtar === kaynak);
      const birim = k?.birimler.find((b) => b.propertyId === birimId);
      if (!k || !birim) return gs;
      let liste = gs.map((g) => (g.anahtar === kaynak ? { ...g, birimler: g.birimler.filter((b) => b.propertyId !== birimId), onayli: true } : g));
      if (hedef === "__yeni") {
        const yeni: EGrup = { anahtar: `y:${yeniSayac}`, id: null, ad: "Yeni bina", il: k.il, ilce: k.ilce, konum: null, birimler: [birim], oneri: false, onayli: true };
        setYeniSayac((n) => n + 1);
        liste = [yeni, ...liste];
      } else {
        liste = liste.map((g) => (g.anahtar === hedef ? { ...g, birimler: [...g.birimler, birim], onayli: true } : g));
      }
      return liste.filter((g) => g.birimler.length > 0);
    });
    setDegisti(true);
    setMesaj(null);
  }

  function birlestir(kaynak: string, hedef: string) {
    setGruplar((gs) => {
      const k = gs.find((g) => g.anahtar === kaynak);
      if (!k) return gs;
      return gs
        .filter((g) => g.anahtar !== kaynak)
        .map((g) => (g.anahtar === hedef ? { ...g, birimler: [...g.birimler, ...k.birimler], onayli: true } : g));
    });
    setDegisti(true);
    setMesaj(null);
  }

  function tumOnerileriOnayla() {
    setGruplar((gs) => gs.map((g) => ({ ...g, onayli: true })));
    setDegisti(true);
  }

  async function kaydet() {
    setKaydediliyor(true);
    setMesaj(null);
    try {
      const res = await fetch("/api/dashboard/binalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kayitGovdesi(gruplar)),
      });
      const v = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMesaj({ tur: "hata", metin: v.error || "Kaydedilemedi." });
        return;
      }
      setDegisti(false);
      setMesaj({ tur: "ok", metin: "Kaydedildi. Yeni panel bu eşlemeyi kullanacak." });
      router.refresh();
    } catch {
      setMesaj({ tur: "hata", metin: "Bağlantı hatası. Lütfen tekrar deneyin." });
    } finally {
      setKaydediliyor(false);
    }
  }

  const gorunen = useMemo(() => {
    const q = sorgu.trim().toLocaleLowerCase("tr-TR");
    return gruplar.filter((g) => {
      if (yalnizKontrol && !g.birimler.some((b) => b.kontrol) && g.onayli) return false;
      if (!q) return true;
      return `${g.ad} ${g.birimler.map((b) => b.title).join(" ")}`.toLocaleLowerCase("tr-TR").includes(q);
    });
  }, [gruplar, yalnizKontrol, sorgu]);

  const uyarilar = useMemo(() => ilUyarilari(gruplar), [gruplar]);
  const onayBekleyen = gruplar.filter((g) => !g.onayli).length;
  const kontrolBekleyen = gruplar.filter((g) => g.birimler.some((b) => b.kontrol)).length;

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="text-[#0a7c76] font-semibold hover:underline">
              ← Ana sayfa
            </Link>
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Binalarım</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Mülkleriniz başlık ve adreslerinden binalara otomatik ayrıldı. Önerileri kontrol edip onaylayın; gerekirse bina adını, blok ve daire numarasını düzeltin,
            birimleri sürükleyerek başka binaya taşıyın. Mülklerinizin kendi bilgileri ve kiracılarınız değişmez.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onayBekleyen > 0 && (
            <button type="button" onClick={tumOnerileriOnayla} className="text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-700 hover:bg-gray-50">
              Tüm önerileri onayla ({onayBekleyen})
            </button>
          )}
          <button
            type="button"
            onClick={kaydet}
            disabled={!degisti || kaydediliyor}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#17B6AE] text-white hover:bg-[#149891] disabled:opacity-50"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {mesaj && (
        <p
          className={`mb-3 text-sm rounded-xl px-4 py-2.5 border ${
            mesaj.tur === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-700"
          }`}
          role="status"
        >
          {mesaj.metin}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input type="search" value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder="Bina ya da mülk ara" aria-label="Binalarda ara" className={`${girdi} w-full sm:w-64`} />
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={yalnizKontrol} onChange={(e) => setYalnizKontrol(e.target.checked)} className="accent-[#17B6AE]" />
          Yalnız kontrol/onay bekleyenler
        </label>
        <span className="text-xs text-slate-500 sm:ml-auto tabular-nums">
          {gruplar.length} bina · {kontrolBekleyen} kontrol edilmeli · {onayBekleyen} onay bekliyor
        </span>
      </div>

      <div className="space-y-3">
        {gorunen.map((g) => {
          const kontrol = g.birimler.some((b) => b.kontrol);
          const ilceler = g.il ? Object.keys(ILCELER[g.il] ?? {}) : [];
          const bas = g.konum ? ([g.konum.lng, g.konum.lat] as [number, number]) : baslangicKonumu(g.il, g.ilce)?.nokta ?? TURKIYE;
          return (
            <section
              key={g.anahtar}
              onDragOver={(e) => {
                if (surukelenen && surukelenen.kaynak !== g.anahtar) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (surukelenen) birimTasi(surukelenen.birim, surukelenen.kaynak, g.anahtar);
                setSurukelenen(null);
              }}
              className={`bg-white rounded-2xl border shadow-sm p-4 ${kontrol ? "border-amber-200" : "border-gray-100"} ${
                surukelenen && surukelenen.kaynak !== g.anahtar ? "ring-2 ring-[#17B6AE]/20" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${g.oneri ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {g.oneri ? "Öneri" : g.id ? "Kayıtlı" : "Yeni"}
                </span>
                {kontrol && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">kontrol edin</span>}
                {uyarilar.get(g.anahtar)?.ilYok && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700">il seçin · haritada gösterilmez</span>
                )}
                {uyarilar.get(g.anahtar)?.digerIller.map((d) => (
                  <span key={d.il} className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700" title="Aynı bina adı başka ilde daha çok birimle kayıtlı">
                    aynı ad {d.il}&apos;da da var ({d.birim} birim) · il yanlış girilmiş olabilir
                  </span>
                ))}
                <span className="text-xs text-slate-500">{g.birimler.length} birim</span>
                <button
                  type="button"
                  onClick={() => {
                    setGruplar((gs) => yenidenEsle(gs, g.anahtar, mulkler));
                    setDegisti(true);
                    setMesaj(null);
                  }}
                  title="Mülklerin güncel ad, adres ve il bilgisinden bina önerisini yeniden hesapla"
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50"
                >
                  Yeniden eşle
                </button>
                {g.oneri && (
                  <label className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={g.onayli}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setGruplar((gs) => gs.map((x) => (x.anahtar === g.anahtar ? { ...x, onayli: v } : x)));
                        setDegisti(true);
                      }}
                      className="accent-[#17B6AE]"
                    />
                    Onayla
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 mb-2">
                <label className="text-[11px] font-semibold text-slate-500">
                  Bina adı
                  <input value={g.ad} maxLength={80} onChange={(e) => guncelle(g.anahtar, (x) => ({ ...x, ad: e.target.value }))} className={`${girdi} w-full mt-0.5`} />
                </label>
                <label className="text-[11px] font-semibold text-slate-500">
                  İl
                  <select
                    value={g.il}
                    onChange={(e) => guncelle(g.anahtar, (x) => ({ ...x, il: e.target.value, ilce: "" }))}
                    className={`${girdi} w-full mt-0.5`}
                  >
                    <option value="">İl seçin</option>
                    {ILLER.map((il) => (
                      <option key={il} value={il}>
                        {il}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-slate-500">
                  İlçe
                  <input
                    value={g.ilce}
                    maxLength={60}
                    list={`ilceler-${g.anahtar}`}
                    onChange={(e) => guncelle(g.anahtar, (x) => ({ ...x, ilce: e.target.value }))}
                    className={`${girdi} w-full mt-0.5`}
                  />
                  <datalist id={`ilceler-${g.anahtar}`}>
                    {ilceler.map((i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span className={g.konum?.dogrulandi ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                  {g.konum?.dogrulandi ? "Konum doğrulandı" : "Konum doğrulanmadı"}
                </span>
                <button
                  type="button"
                  onClick={() => setKonumAcik(konumAcik === g.anahtar ? null : g.anahtar)}
                  className="font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50"
                >
                  {konumAcik === g.anahtar ? "Haritayı kapat" : "Konumu haritada seç"}
                </button>
                {gruplar.length > 1 && (
                  <select
                    value=""
                    onChange={(e) => e.target.value && birlestir(g.anahtar, e.target.value)}
                    aria-label="Bu binayı başka bir binayla birleştir"
                    className={`${girdi} py-1 text-xs sm:ml-auto`}
                  >
                    <option value="">Şununla birleştir…</option>
                    {gruplar
                      .filter((x) => x.anahtar !== g.anahtar)
                      .map((x) => (
                        <option key={x.anahtar} value={x.anahtar}>
                          {x.ad} ({x.birimler.length})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {konumAcik === g.anahtar && (
                <div className="mb-3">
                  <KonumSecici
                    baslangic={bas}
                    onVazgec={() => setKonumAcik(null)}
                    onOnayla={(lat, lng) => {
                      guncelle(g.anahtar, (x) => ({ ...x, konum: { lat, lng, dogrulandi: true } }));
                      setKonumAcik(null);
                    }}
                  />
                </div>
              )}

              <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
                {g.birimler.map((b) => (
                  <li
                    key={b.propertyId}
                    draggable
                    onDragStart={() => setSurukelenen({ birim: b.propertyId, kaynak: g.anahtar })}
                    onDragEnd={() => setSurukelenen(null)}
                    className="grid grid-cols-[minmax(0,1fr)_4rem_5rem] sm:grid-cols-[minmax(0,1fr)_4.5rem_6rem_10rem] items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing"
                  >
                    <span className="min-w-0 flex items-center gap-1.5">
                      <span className="min-w-0 text-sm text-slate-700 truncate" title={b.title}>
                        {b.kontrol && <span className="text-amber-600 font-bold mr-1" title="Blok '2A' gibi bir yazımdan tahmin edildi">⚠</span>}
                        {b.yeniOneri && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 mr-1 rounded bg-sky-50 text-sky-700" title="Bu binaya ad ve il eşleşmesiyle önerildi; kaydedince bağlanır">
                            öneri
                          </span>
                        )}
                        {b.title}
                      </span>
                      {degisti ? (
                        <span className="flex-none text-[11px] text-slate-400" title="Mülkü düzenlemeden önce bu ekrandaki değişiklikleri kaydedin">
                          Düzenle
                        </span>
                      ) : (
                        <MulkDuzenleButton
                          propertyId={b.propertyId}
                          onUpdated={() => router.refresh()}
                          className="flex-none text-[11px] font-semibold text-[#0a7c76] hover:underline"
                        />
                      )}
                    </span>
                    <input
                      value={b.blok}
                      maxLength={10}
                      placeholder="Blok"
                      aria-label={`${b.title} blok`}
                      onChange={(e) =>
                        guncelle(g.anahtar, (x) => ({
                          ...x,
                          birimler: x.birimler.map((y) => (y.propertyId === b.propertyId ? { ...y, blok: e.target.value.toLocaleUpperCase("tr-TR"), kontrol: false } : y)),
                        }))
                      }
                      className={`${girdi} w-full`}
                    />
                    <input
                      value={b.daireNo}
                      maxLength={20}
                      placeholder="Daire no"
                      aria-label={`${b.title} daire no`}
                      onChange={(e) =>
                        guncelle(g.anahtar, (x) => ({
                          ...x,
                          birimler: x.birimler.map((y) => (y.propertyId === b.propertyId ? { ...y, daireNo: e.target.value } : y)),
                        }))
                      }
                      className={`${girdi} w-full`}
                    />
                    <select
                      value=""
                      onChange={(e) => e.target.value && birimTasi(b.propertyId, g.anahtar, e.target.value)}
                      aria-label={`${b.title} birimini başka binaya taşı`}
                      className={`${girdi} col-span-3 sm:col-span-1 w-full py-1 text-xs`}
                    >
                      <option value="">Taşı…</option>
                      <option value="__yeni">➕ Yeni bina (ayır)</option>
                      {gruplar
                        .filter((x) => x.anahtar !== g.anahtar)
                        .map((x) => (
                          <option key={x.anahtar} value={x.anahtar}>
                            {x.ad}
                          </option>
                        ))}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {gorunen.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Gösterilecek bina yok.</p>}
      </div>
    </div>
  );
}
