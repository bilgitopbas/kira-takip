"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import YazdirButonu from "@/components/YazdirButonu";
import YazdirmaBasligi from "@/components/YazdirmaBasligi";

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

type Debt = { amount: number; dueDate: string };

type Props = {
  payments: Payment[];
  debts: Debt[];
};

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Hızlı aralık seçenekleri: bugünden geriye doğru
const HIZLI_ARALIKLAR = [
  { key: "1a", label: "1 Ay", months: 1 },
  { key: "3a", label: "3 Ay", months: 3 },
  { key: "6a", label: "6 Ay", months: 6 },
  { key: "1y", label: "1 Yıl", months: 12 },
  { key: "3y", label: "3 Yıl", months: 36 },
  { key: "tum", label: "Tümü", months: null },
] as const;

export default function FinansRaporlari({ payments, debts }: Props) {
  const now = new Date();
  // Sayfa açılırken tüm geçmiş yerine son 1 ay gösterilir; tahsilat defteri
  // yüzlerce satırla açılmasın.
  const [startDate, setStartDate] = useState(
    toDateInput(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()))
  );
  const [endDate, setEndDate] = useState(toDateInput(now));
  // Hangi hızlı seçeneğin etkin olduğunu göstermek için (tarih elle
  // değiştirilirse boşalır)
  const [aktifAralik, setAktifAralik] = useState<string | null>("1a");
  const [seciliAy, setSeciliAy] = useState("");

  function tarihAraligiSec(baslangic: Date, bitis: Date, aralikKey: string | null) {
    setStartDate(toDateInput(baslangic));
    setEndDate(toDateInput(bitis));
    setAktifAralik(aralikKey);
  }

  function hizliAralikSec(secenek: (typeof HIZLI_ARALIKLAR)[number]) {
    setSeciliAy("");
    if (secenek.months === null) {
      // Tümü: en eski kayıttan bugüne
      const tumTarihler = [
        ...payments.map((p) => new Date(p.paidAt)),
        ...debts.map((d) => new Date(d.dueDate)),
      ];
      const enEski = tumTarihler.length
        ? new Date(Math.min(...tumTarihler.map((d) => d.getTime())))
        : new Date(now.getFullYear(), 0, 1);
      tarihAraligiSec(enEski, now, secenek.key);
      return;
    }
    const baslangic = new Date(now.getFullYear(), now.getMonth() - secenek.months, now.getDate());
    tarihAraligiSec(baslangic, now, secenek.key);
  }

  // "2026-05" biçimindeki ay seçimi -> o ayın ilk ve son günü
  function aySec(deger: string) {
    setSeciliAy(deger);
    if (!deger) return;
    const [yil, ay] = deger.split("-").map(Number);
    tarihAraligiSec(new Date(yil, ay - 1, 1), new Date(yil, ay, 0), null);
  }

  function elleTarihDegistir(tip: "start" | "end", deger: string) {
    if (tip === "start") setStartDate(deger);
    else setEndDate(deger);
    setAktifAralik(null);
    setSeciliAy("");
  }

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

  const propertyBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredPayments) {
      map.set(p.propertyTitle, (map.get(p.propertyTitle) || 0) + p.amount);
    }
    return Array.from(map.entries())
      .map(([mulk, tutar]) => ({ mulk, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filteredPayments]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = filteredPayments.map((p) => ({
      Tarih: new Date(p.paidAt).toLocaleDateString("tr-TR"),
      Kiracı: p.tenantName,
      Mülk: p.propertyTitle,
      "Tutar (₺)": p.amount,
      Yöntem: p.method || "—",
      Notlar: p.notes || "—",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Tahsilat Defteri");
    XLSX.writeFile(workbook, `tahsilat-defteri-${startDate}-${endDate}.xlsx`);
  }

  return (
    <div>
      <YazdirmaBasligi
        baslik="Finans Raporu"
        altBaslik={`${new Date(startDate).toLocaleDateString("tr-TR")} – ${new Date(endDate).toLocaleDateString("tr-TR")}`}
      />
      <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Başlangıç</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => elleTarihDegistir("start", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bitiş</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => elleTarihDegistir("end", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tek Ay Seç</label>
            <input
              type="month"
              value={seciliAy}
              onChange={(e) => aySec(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={exportExcel}
            className="bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
          >
            Excel&apos;e Aktar
          </button>
          <YazdirButonu />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs font-semibold text-slate-500 mr-1">Hızlı aralık:</span>
          {HIZLI_ARALIKLAR.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => hizliAralikSec(a)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                aktifAralik === a.key
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-200 hover:border-[#17B6AE]"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Toplam Tahsilat</p>
          <p className="text-2xl font-bold text-slate-900">{totalCollected.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Vadesi Gelen Borç</p>
          <p className="text-2xl font-bold text-slate-900">{totalOwed.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Tahsilat Oranı</p>
          <p className="text-2xl font-bold text-slate-900">
            {collectionRate === null ? "—" : `%${collectionRate}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b-2 border-[#17B6AE]/20 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800">Tahsilat Defteri</h2>
          <span className="text-xs text-slate-500">
            {filteredPayments.length} kayıt ·{" "}
            <span className="font-semibold text-[#17B6AE]">
              {totalCollected.toLocaleString("tr-TR")} ₺
            </span>
          </span>
        </div>
        {filteredPayments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">Seçili tarih aralığında tahsilat kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#17B6AE]/8 text-left">
                <th className="px-1 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                <th className="px-1 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Kiracı</th>
                <th className="px-1 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Mülk</th>
                <th className="px-1 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="hidden sm:table-cell px-1 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Dekont</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-1 py-1.5 sm:px-5 sm:py-3 text-slate-700 whitespace-nowrap">
                    {new Date(p.paidAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-1 py-1.5 sm:px-5 sm:py-3 text-slate-800 font-medium max-w-[70px] sm:max-w-none truncate">{p.tenantName}</td>
                  <td className="px-1 py-1.5 sm:px-5 sm:py-3 text-slate-700 max-w-[60px] sm:max-w-none truncate">{p.propertyTitle}</td>
                  <td className="px-1 py-1.5 sm:px-5 sm:py-3 text-slate-800 font-medium whitespace-nowrap">
                    {p.amount.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="hidden sm:table-cell px-1 py-1.5 sm:px-5 sm:py-3 text-slate-500">{p.hasReceipt ? "Var" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <h2 className="text-sm font-bold text-slate-800">Mülk Bazlı Gelir Kırılımı</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Seçili tarih aralığında tahsil edilen kiraların hangi mülkten geldiğini
          gösterir. Hangi mülkün ne kadar getirdiğini karşılaştırmak için kullanılır;
          yeni bir tahsilat eklemez, yukarıdaki tahsilat defterindeki kayıtları
          mülke göre toplar.
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#17B6AE]/8 text-left">
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mülk</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17B6AE]/15">
                  {propertyBreakdown.map((row) => (
                    <tr key={row.mulk}>
                      <td className="px-4 py-2 text-slate-700">{row.mulk}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium text-right whitespace-nowrap">
                        {row.tutar.toLocaleString("tr-TR")} ₺
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#17B6AE]/30 font-bold">
                    <td className="px-4 py-2.5 text-slate-800">Toplam</td>
                    <td className="px-4 py-2.5 text-[#17B6AE] text-right whitespace-nowrap">
                      {propertyBreakdown.reduce((s, r) => s + r.tutar, 0).toLocaleString("tr-TR")} ₺
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
