"use client";

import { useEffect, useState } from "react";
import { ODEME_PERIYOTLARI } from "@/lib/odemeBildirimi";
import { PRICE_PER_PROPERTY } from "@/lib/fiyat";

export type BankaBilgisi = { iban: string; sahip: string; banka: string } | null;

type Bekleyen = {
  referenceCode: string;
  propertyCount: number;
  months: number;
  amount: number;
};

export default function HavaleOdeme({
  propertyCount,
  banka,
  onTalep,
  talepGonderiliyor,
  talepMesaji,
}: {
  propertyCount: number;
  banka: BankaBilgisi;
  onTalep: () => void;
  talepGonderiliyor: boolean;
  talepMesaji: string | null;
}) {
  const [ay, setAy] = useState(12);
  const [bekleyen, setBekleyen] = useState<Bekleyen | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    let iptal = false;
    fetch("/api/dashboard/odeme-bildirimi")
      .then((r) => r.json())
      .then((v) => {
        if (!iptal && v.bekleyen) setBekleyen(v.bekleyen);
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, []);

  const tutar = propertyCount * PRICE_PER_PROPERTY * ay;

  async function bildir() {
    setHata("");
    setYukleniyor(true);
    try {
      const cevap = await fetch("/api/dashboard/odeme-bildirimi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyCount, months: ay }),
      });
      const veri = await cevap.json();
      if (!cevap.ok) {
        setHata(veri.error || "Bildirim gönderilemedi.");
        return;
      }
      setBekleyen({ referenceCode: veri.referenceCode, propertyCount, months: ay, amount: veri.amount });
    } catch {
      setHata("Bağlantı hatası.");
    } finally {
      setYukleniyor(false);
    }
  }

  function ibanKopyala() {
    if (!banka) return;
    navigator.clipboard.writeText(banka.iban.replace(/\s/g, "")).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    });
  }

  // Banka bilgisi tanımlı değilse havale bölümü hiç gösterilmez
  if (!banka) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-2">Ödeme</h3>
        <p className="text-sm text-slate-500 mb-4">
          Ödeme talebinizi bırakın, ekibimiz sizinle iletişime geçip aboneliğinizi başlatsın.
        </p>
        <button
          type="button"
          onClick={onTalep}
          disabled={talepGonderiliyor}
          className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          {talepGonderiliyor ? "Gönderiliyor..." : "Talebi Gönder"}
        </button>
        {talepMesaji && (
          <p className="text-sm text-center text-emerald-600 font-medium mt-3">{talepMesaji}</p>
        )}
      </div>
    );
  }

  if (bekleyen) {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <h3 className="text-sm font-bold text-amber-900 mb-2">Ödemeniz kontrol ediliyor</h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          <span className="font-mono font-bold">{bekleyen.referenceCode}</span> kodlu,{" "}
          <strong>{bekleyen.amount.toLocaleString("tr-TR")} TL</strong> tutarındaki ödeme
          bildiriminiz alındı. Havaleniz hesabımıza geçtiğinde aboneliğiniz açılacak ve size
          bildirim gönderilecek.
        </p>
        <p className="text-xs text-amber-700 mt-3">
          Havaleyi henüz yapmadıysanız, açıklama kısmına{" "}
          <span className="font-mono font-bold">{bekleyen.referenceCode}</span> yazmayı unutmayın.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">Havale / EFT ile Ödeme</h3>
        <p className="text-xs text-slate-500">
          Kredi kartıyla online ödeme altyapımız hazırlanıyor. Şimdilik banka havalesi ile
          ödeyebilirsiniz.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">Ödeme Dönemi</p>
        <div className="flex flex-wrap gap-2">
          {ODEME_PERIYOTLARI.map((p) => (
            <button
              key={p.ay}
              type="button"
              onClick={() => setAy(p.ay)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl border transition ${
                ay === p.ay
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              {p.etiket}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <Satir etiket="Hesap Sahibi" deger={banka.sahip} />
        {banka.banka && <Satir etiket="Banka" deger={banka.banka} />}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">IBAN</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm text-slate-800 truncate">{banka.iban}</span>
            <button
              type="button"
              onClick={ibanKopyala}
              className="text-xs font-semibold text-[#17B6AE] hover:underline flex-shrink-0"
            >
              {kopyalandi ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#17B6AE]/5">
          <span className="text-xs font-semibold text-slate-600">Ödenecek Tutar</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">
            {tutar.toLocaleString("tr-TR")} TL
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {propertyCount} mülk × {PRICE_PER_PROPERTY} TL × {ay === 12 ? "12 ay" : `${ay} ay`}
      </p>

      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Önemli:</strong> Havaleyi yaptıktan sonra aşağıdaki butona basın. Size özel bir
          referans kodu oluşturulacak; bu kodu havale açıklamasına yazmanız ödemenizin hızlıca
          eşleştirilmesini sağlar. Ödemeniz kontrol edildikten sonra aboneliğiniz açılır.
        </p>
      </div>

      {hata && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {hata}
        </p>
      )}

      <button
        type="button"
        onClick={bildir}
        disabled={yukleniyor}
        className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
      >
        {yukleniyor ? "Oluşturuluyor..." : "Referans Kodu Al ve Ödemeyi Bildir"}
      </button>
    </div>
  );
}

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-xs font-semibold text-slate-500">{etiket}</span>
      <span className="text-sm text-slate-800 truncate">{deger}</span>
    </div>
  );
}
