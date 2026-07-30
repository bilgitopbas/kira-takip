"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import YazdirmaBasligi from "@/components/YazdirmaBasligi";
import TarihAraligiFiltresi from "@/components/TarihAraligiFiltresi";
import SayacDeger from "@/components/SayacDeger";
import { useTarihAraligi } from "@/lib/tarihAraligi";

type Payment = {
  id: string;
  amount: number;
  paidAt: string;
  method: string | null;
  notes: string | null;
  hasReceipt: boolean;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
};

type Debt = {
  id: string;
  amount: number;
  dueDate: string;
  paid: number;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
};

// Gecikme yaslandirma: gun araligi -> renk. Tek hue (kirmizi) uzerinde
// aciktan koyuya siralanmis; siralama gecikmenin agirligini tasiyor.
const GECIKME_DILIMLERI = [
  { key: "0-30", label: "1-30 gün", min: 1, max: 30, color: "#e57373" },
  { key: "31-60", label: "31-60 gün", min: 31, max: 60, color: "#d64545" },
  { key: "61-90", label: "61-90 gün", min: 61, max: 90, color: "#b52626" },
  { key: "90+", label: "90 günden fazla", min: 91, max: Infinity, color: "#7f1616" },
] as const;

const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const RENK_BU_YIL = "#17B6AE";
const RENK_GECEN_YIL = "#eb6834";

function paraFormat(n: number) {
  return `${Math.round(n).toLocaleString("tr-TR")} ₺`;
}

type Props = {
  payments: Payment[];
  debts: Debt[];
};

export default function FinansRaporlari({ payments, debts }: Props) {
  // Tarih aralığı mantığı Tahsilat Defteri sayfasıyla ortak
  const aralik = useTarihAraligi(() => {
    const tarihler = [
      ...payments.map((p) => new Date(p.paidAt).getTime()),
      ...debts.map((d) => new Date(d.dueDate).getTime()),
    ];
    return tarihler.length ? new Date(Math.min(...tarihler)) : new Date(new Date().getFullYear(), 0, 1);
  });
  const { startDate, endDate } = aralik;

  const filteredPayments = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return payments.filter((p) => {
      const d = new Date(p.paidAt);
      return d >= start && d <= end;
    });
  }, [payments, startDate, endDate]);

  const filteredDebts = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return debts.filter((d) => {
      const due = new Date(d.dueDate);
      return due >= start && due <= end;
    });
  }, [debts, startDate, endDate]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOwed = filteredDebts.reduce((sum, d) => sum + d.amount, 0);
  const collectionRate = totalOwed > 0 ? Math.min(100, Math.round((totalCollected / totalOwed) * 100)) : null;

  // Gecikme yaşlandırma: BUGÜN itibarıyla vadesi geçmiş ve hâlâ bakiyesi olan
  // borçlar. Bilerek tarih aralığından bağımsız — "şu an ne kadar param
  // sokakta" sorusunun cevabı, seçili döneme göre değişmemeli.
  const gecikmeAnalizi = useMemo(() => {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const kovalar = GECIKME_DILIMLERI.map((d) => ({ ...d, tutar: 0, adet: 0 }));
    let toplam = 0;

    for (const borc of debts) {
      const kalan = borc.amount - borc.paid;
      if (kalan <= 0) continue;
      const vade = new Date(borc.dueDate);
      vade.setHours(0, 0, 0, 0);
      const gun = Math.floor((bugun.getTime() - vade.getTime()) / 86400000);
      if (gun < 1) continue;
      const kova = kovalar.find((k) => gun >= k.min && gun <= k.max);
      if (!kova) continue;
      kova.tutar += kalan;
      kova.adet += 1;
      toplam += kalan;
    }
    return { kovalar, toplam, adet: kovalar.reduce((s, k) => s + k.adet, 0) };
  }, [debts]);

  // Seçili aralıkta en çok tahsilat yapılan ilk 5 mülk ve ilk 5 kiracı
  const enCokGetiren = useMemo(() => {
    function ilkBes(anahtar: (p: Payment) => string) {
      const harita = new Map<string, number>();
      for (const p of filteredPayments) {
        harita.set(anahtar(p), (harita.get(anahtar(p)) ?? 0) + p.amount);
      }
      return [...harita.entries()]
        .map(([ad, tutar]) => ({ ad, tutar }))
        .sort((a, b) => b.tutar - a.tutar)
        .slice(0, 5);
    }
    return { mulkler: ilkBes((p) => p.propertyTitle), kiracilar: ilkBes((p) => p.tenantName) };
  }, [filteredPayments]);

  // Bu yıl / geçen yıl aynı ayların tahsilat karşılaştırması. Takvim yılına
  // dayandığı için bu da tarih aralığından bağımsız.
  const yilKarsilastirma = useMemo(() => {
    // Yıl bilgisi memo içinde okunur; `now` her render'da yeniden üretildiği
    // için bağımlılık listesine konamaz.
    const buYil = new Date().getFullYear();
    const gecenYil = buYil - 1;
    const satirlar = AY_KISA.map((ay) => ({ ay, buYil: 0, gecenYil: 0 }));
    let gecenYilVarMi = false;

    for (const p of payments) {
      const d = new Date(p.paidAt);
      const yil = d.getFullYear();
      if (yil === buYil) satirlar[d.getMonth()].buYil += p.amount;
      else if (yil === gecenYil) {
        satirlar[d.getMonth()].gecenYil += p.amount;
        gecenYilVarMi = true;
      }
    }
    return { satirlar, buYil, gecenYil, gecenYilVarMi };
  }, [payments]);

  const propertyBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredPayments) {
      map.set(p.propertyTitle, (map.get(p.propertyTitle) || 0) + p.amount);
    }
    return Array.from(map.entries())
      .map(([mulk, tutar]) => ({ mulk, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filteredPayments]);

  return (
    <div>
      <YazdirmaBasligi
        baslik="Finans Raporu"
        altBaslik={`${new Date(startDate).toLocaleDateString("tr-TR")} – ${new Date(endDate).toLocaleDateString("tr-TR")}`}
      />
      <TarihAraligiFiltresi {...aralik} />

      {/* Kartlar sırayla süzülerek girer, rakamlar 0'dan hedefe sayar.
          Sayaçlar filtre değiştikçe de yeni değere doğru animasyonla gider. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {[
          { baslik: "Toplam Tahsilat", deger: totalCollected, sonEk: " ₺" },
          { baslik: "Vadesi Gelen Borç", deger: totalOwed, sonEk: " ₺" },
          {
            baslik: "Tahsilat Oranı",
            deger: collectionRate,
            onEk: "%",
            bos: collectionRate === null,
          },
        ].map((kart, i) => (
          <div
            key={kart.baslik}
            className="kart-girisi bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="text-xs font-medium text-slate-500 mb-1">{kart.baslik}</p>
            <p className="text-2xl font-bold text-slate-900">
              {kart.bos ? (
                "—"
              ) : (
                <SayacDeger hedef={kart.deger ?? 0} onEk={kart.onEk} sonEk={kart.sonEk} />
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Sıralama: Mülk Bazlı Gelir Kırılımı > Gecikme Yaşlandırma > İlk 5 >
          Yıl Karşılaştırma. Blokları taşımak yerine flex sırası kullanıldı. */}
      <div className="flex flex-col gap-6">
      {/* Gecikme yaşlandırma — bugün itibarıyla, seçili aralıktan bağımsız */}
      <div
        className="order-2 kart-girisi bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="text-sm font-bold text-slate-800">Gecikme Yaşlandırma Analizi</h2>
          {gecikmeAnalizi.adet > 0 && (
            <span className="text-sm">
              <span className="font-bold text-[#b52626]">{paraFormat(gecikmeAnalizi.toplam)}</span>{" "}
              <span className="text-slate-500">· {gecikmeAnalizi.adet} borç</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Vadesi geçmiş ve hâlâ bakiyesi olan borçlar, ne kadar gecikmiş olduklarına göre
          ayrılır. <strong>Bugün itibarıyla</strong> hesaplanır; yukarıdaki tarih aralığından
          etkilenmez.
        </p>
        {gecikmeAnalizi.adet === 0 ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            Vadesi geçmiş ödenmemiş borç yok.
          </p>
        ) : (
          // Etiket/tutar ustte, cubuk tam genislikte altta: dar ekranda yan
          // yana dizilince cubuga hic yer kalmiyordu.
          <div className="space-y-3">
            {gecikmeAnalizi.kovalar.map((k) => {
              const oran = gecikmeAnalizi.toplam > 0 ? (k.tutar / gecikmeAnalizi.toplam) * 100 : 0;
              return (
                <div key={k.key} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-sm text-slate-600">
                      {k.label}
                      <span className="text-slate-400"> · {k.adet} borç</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
                      {paraFormat(k.tutar)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-50 rounded-r-[4px]">
                    <div
                      className="cubuk-dolum h-full rounded-r-[4px]"
                      style={{
                        width: `${oran}%`,
                        backgroundColor: k.color,
                        animationDelay: "420ms",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3) Seçili aralıkta en çok tahsilat yapılan ilk 5 mülk ve kiracı */}
      <div className="order-3 grid grid-cols-1 lg:grid-cols-2 gap-6 kart-girisi" style={{ animationDelay: "400ms" }}>
        {[
          { baslik: "En Çok Kira Getiren 5 Mülk", satirlar: enCokGetiren.mulkler },
          { baslik: "En Çok Kira Ödeyen 5 Kiracı", satirlar: enCokGetiren.kiracilar },
        ].map((blok) => {
          const enBuyuk = blok.satirlar[0]?.tutar ?? 0;
          return (
            <div key={blok.baslik} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-800 mb-4">{blok.baslik}</h2>
              {blok.satirlar.length === 0 ? (
                <p className="text-sm text-slate-500">Seçili tarih aralığında tahsilat kaydı yok.</p>
              ) : (
                <div className="space-y-3">
                  {blok.satirlar.map((s, i) => (
                    <div key={s.ad} className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="text-sm text-slate-700 truncate">
                          <span className="text-slate-400 mr-1.5">{i + 1}.</span>
                          {s.ad}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
                          {paraFormat(s.tutar)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-50 rounded-r-[4px]">
                        <div
                          className="cubuk-dolum h-full rounded-r-[4px] bg-[#17B6AE]"
                          style={{
                            width: `${enBuyuk > 0 ? (s.tutar / enBuyuk) * 100 : 0}%`,
                            animationDelay: `${500 + i * 60}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4) Bu yıl / geçen yıl karşılaştırması — takvim yılı bazlı */}
      <div
        className="order-4 kart-girisi bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        style={{ animationDelay: "480ms" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="text-sm font-bold text-slate-800">Yıl Karşılaştırma</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RENK_BU_YIL }} />
              <span className="text-slate-600">{yilKarsilastirma.buYil}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RENK_GECEN_YIL }} />
              <span className="text-slate-600">{yilKarsilastirma.gecenYil}</span>
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Bu yılın aylık tahsilatı, geçen yılın aynı aylarıyla karşılaştırılır. Takvim yılına
          dayanır; yukarıdaki tarih aralığından etkilenmez.
        </p>
        {!yilKarsilastirma.gecenYilVarMi && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
            {yilKarsilastirma.gecenYil} yılına ait tahsilat kaydı yok; karşılaştırma ancak iki
            yıllık veri girildiğinde anlamlı olur.
          </p>
        )}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yilKarsilastirma.satirlar} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
              <XAxis dataKey="ay" tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#898781" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}B` : String(v))}
              />
              <Tooltip
                formatter={(deger) => paraFormat(Number(deger) || 0)}
                contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
              />
              <Bar dataKey="gecenYil" name={String(yilKarsilastirma.gecenYil)} fill={RENK_GECEN_YIL} radius={[4, 4, 0, 0]} />
              <Bar dataKey="buYil" name={String(yilKarsilastirma.buYil)} fill={RENK_BU_YIL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="order-1 kart-girisi bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        style={{ animationDelay: "240ms" }}
      >
        <h2 className="text-sm font-bold text-slate-800">Mülk Bazlı Gelir Kırılımı</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Seçili tarih aralığında tahsil edilen kiraların hangi mülkten geldiğini
          gösterir. Hangi mülkün ne kadar getirdiğini karşılaştırmak için kullanılır;
          yeni bir tahsilat eklemez, Tahsilat Defteri sayfasındaki kayıtları mülke
          göre toplar.
        </p>
        {propertyBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500">Seçili tarih aralığında tahsilat yok.</p>
        ) : (
          <>
            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="mulk" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(v) => `${(v / 1000).toLocaleString("tr-TR")}k ₺`}
                    width={52}
                  />
                  <Tooltip
                    cursor={{ fill: "#17B6AE", fillOpacity: 0.06 }}
                    formatter={(value) => [`${Number(value).toLocaleString("tr-TR")} ₺`, "Tahsilat"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
                  />
                  <Bar dataKey="tutar" fill="#17B6AE" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
