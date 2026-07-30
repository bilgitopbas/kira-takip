"use client";

import { useState } from "react";
import CurrencyInput from "@/components/CurrencyInput";
import { SOZLESME_BOLUMLERI, type Alan } from "@/lib/kiraSozlesmesiAlanlari";

type Sonuc = {
  dosyaAdi: string;
  docx: string;
  pdf: string | null;
  mailGonderildi: boolean;
};

function bugununTarihi() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** base64 -> tarayıcıda indirme */
function indir(base64: string, dosyaAdi: string, tur: string) {
  const ikili = atob(base64);
  const dizi = new Uint8Array(ikili.length);
  for (let i = 0; i < ikili.length; i++) dizi[i] = ikili.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([dizi], { type: tur }));
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}

const GIRDI =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30";

export default function KiraSozlesmesiForm() {
  const [alanlar, setAlanlar] = useState<Record<string, string>>({
    Duzenlenmetarihi: bugununTarihi(),
  });
  // Yıllık bedeli kullanıcı elle değiştirdiyse otomatik hesaplamayı bırak
  const [yillikElle, setYillikElle] = useState(false);
  const [mailGonder, setMailGonder] = useState(true);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);

  function degistir(key: string, deger: string) {
    setAlanlar((eski) => {
      const yeni = { ...eski, [key]: deger };
      // Aylık kira girilince yıllık bedeli 12 ile çarpıp doldur
      if (key === "Aylıkkirabedeli" && !yillikElle) {
        const aylik = Number(deger);
        yeni.Yıllıkkirabedeli = Number.isFinite(aylik) && deger !== "" ? String(aylik * 12) : "";
      }
      if (key === "Yıllıkkirabedeli") setYillikElle(true);
      return yeni;
    });
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    setSonuc(null);
    setYukleniyor(true);
    try {
      const cevap = await fetch("/api/dashboard/kira-sozlesmesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alanlar, mailGonder }),
      });
      const veri = await cevap.json();
      if (!cevap.ok) {
        setHata(veri.error || "Sözleşme oluşturulamadı.");
        return;
      }
      setSonuc(veri);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }

  function alanCiz(alan: Alan) {
    const deger = alanlar[alan.key] ?? "";

    return (
      <div key={alan.key} className={alan.genisMi ? "sm:col-span-2" : ""}>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          {alan.label}
          {alan.zorunlu && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {alan.tip === "uzunMetin" ? (
          <textarea
            value={deger}
            onChange={(e) => degistir(alan.key, e.target.value)}
            rows={3}
            className={GIRDI}
          />
        ) : alan.tip === "para" ? (
          <CurrencyInput value={deger} onChange={(v) => degistir(alan.key, v)} />
        ) : (
          <input
            type={alan.tip === "tarih" ? "date" : alan.tip === "sayi" ? "number" : "text"}
            value={deger}
            onChange={(e) => degistir(alan.key, e.target.value)}
            className={GIRDI}
          />
        )}

        {alan.ipucu && <p className="text-[11px] text-slate-400 mt-1">{alan.ipucu}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={gonder} className="space-y-6">
      {SOZLESME_BOLUMLERI.map((bolum) => (
        <div
          key={bolum.baslik}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6"
        >
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{bolum.baslik}</h2>
          {bolum.aciklama && <p className="text-xs text-slate-500 mt-1">{bolum.aciklama}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {bolum.alanlar.map(alanCiz)}
          </div>
        </div>
      ))}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mailGonder}
            onChange={(e) => setMailGonder(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#17B6AE]"
          />
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Sözleşmeyi e-posta adresime de gönder
            <span className="block text-xs text-slate-500 mt-0.5">
              Belge yalnızca size gönderilir, kiracıya iletilmez.
            </span>
          </span>
        </label>

        {hata && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {hata}
          </p>
        )}

        <button
          type="submit"
          disabled={yukleniyor}
          className="mt-5 w-full sm:w-auto bg-[#17B6AE] hover:bg-[#13a099] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
        >
          {yukleniyor ? "Hazırlanıyor..." : "Sözleşmeyi Oluştur"}
        </button>
      </div>

      {sonuc && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-[#17B6AE]/30 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
            Sözleşmeniz hazır
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {sonuc.mailGonderildi
              ? "Belge e-posta adresinize de gönderildi."
              : mailGonder
                ? "Belge oluşturuldu, ancak e-posta gönderilemedi. Aşağıdan indirebilirsiniz."
                : "Aşağıdan indirebilirsiniz."}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                indir(
                  sonuc.docx,
                  `${sonuc.dosyaAdi}.docx`,
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
              }
              className="bg-[#17B6AE] hover:bg-[#13a099] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
            >
              Word İndir
            </button>
            {sonuc.pdf ? (
              <button
                type="button"
                onClick={() => indir(sonuc.pdf!, `${sonuc.dosyaAdi}.pdf`, "application/pdf")}
                className="bg-white hover:bg-gray-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-sm border border-gray-200"
              >
                PDF İndir
              </button>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 self-center">
                PDF şu an üretilemiyor; Word dosyasını indirip kendiniz PDF&apos;e
                çevirebilirsiniz.
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
