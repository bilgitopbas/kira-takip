"use client";

import { useMemo, useState } from "react";
import YazdirmaBasligi from "@/components/YazdirmaBasligi";
import Pagination from "@/components/Pagination";
import TarihAraligiFiltresi from "@/components/TarihAraligiFiltresi";
import { araliktaMi, useTarihAraligi } from "@/lib/tarihAraligi";

export type DefterKaydi = {
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

const SAYFA_BOYUTU = 15;

export default function TahsilatDefteri({ payments }: { payments: DefterKaydi[] }) {
  const [sayfa, setSayfa] = useState(1);

  const aralik = useTarihAraligi(
    () => {
      const tarihler = payments.map((p) => new Date(p.paidAt).getTime());
      return tarihler.length ? new Date(Math.min(...tarihler)) : new Date(new Date().getFullYear(), 0, 1);
    },
    () => setSayfa(1)
  );
  const { startDate, endDate } = aralik;

  const kayitlar = useMemo(
    () => payments.filter((p) => araliktaMi(p.paidAt, startDate, endDate)),
    [payments, startDate, endDate]
  );

  const toplam = kayitlar.reduce((sum, p) => sum + p.amount, 0);

  // Ekranda 15'erli sayfalanır; yazdırmada sayfalama uygulanmaz, tüm kayıtlar
  // basılır (kesilmemesi için satırlar print'te tekrar görünür yapılır).
  const sayfaBasi = (sayfa - 1) * SAYFA_BOYUTU;
  const sayfaSonu = sayfa * SAYFA_BOYUTU;

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = kayitlar.map((p) => ({
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

  const bh = "px-1 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider";
  const hd = "px-1 py-1.5 sm:px-5 sm:py-3";

  return (
    <div>
      <YazdirmaBasligi
        baslik="Tahsilat Defteri"
        altBaslik={`${new Date(startDate).toLocaleDateString("tr-TR")} – ${new Date(endDate).toLocaleDateString("tr-TR")}`}
      />

      <TarihAraligiFiltresi {...aralik} onExcel={exportExcel} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Toplam Tahsilat</p>
          <p className="text-2xl font-bold text-slate-900">{toplam.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Kayıt Sayısı</p>
          <p className="text-2xl font-bold text-slate-900">{kayitlar.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b-2 border-[#17B6AE]/20 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800">Tahsilat Defteri</h2>
          <span className="text-xs text-slate-500">
            {kayitlar.length} kayıt ·{" "}
            <span className="font-semibold text-[#17B6AE]">{toplam.toLocaleString("tr-TR")} ₺</span>
          </span>
        </div>

        {kayitlar.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            Seçili tarih aralığında tahsilat kaydı yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#17B6AE]/8 text-left">
                  <th className={bh}>Tarih</th>
                  <th className={bh}>Kiracı</th>
                  <th className={bh}>Mülk</th>
                  <th className={bh}>Tutar</th>
                  <th className={`hidden sm:table-cell ${bh}`}>Dekont</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kayitlar.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      i >= sayfaBasi && i < sayfaSonu ? "" : "hidden print:table-row"
                    }`}
                  >
                    <td className={`${hd} text-slate-700 whitespace-nowrap`}>
                      {new Date(p.paidAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className={`${hd} text-slate-800 font-medium max-w-[70px] sm:max-w-none truncate`}>
                      {p.tenantName}
                    </td>
                    <td className={`${hd} text-slate-700 max-w-[60px] sm:max-w-none truncate`}>
                      {p.propertyTitle}
                    </td>
                    <td className={`${hd} text-slate-800 font-medium whitespace-nowrap`}>
                      {p.amount.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className={`hidden sm:table-cell ${hd} text-slate-500`}>
                      {p.hasReceipt ? "Var" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {kayitlar.length > SAYFA_BOYUTU && (
          <div className="no-print flex flex-col items-center gap-2 px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-slate-400">
              {kayitlar.length} kayıttan {sayfaBasi + 1}–{Math.min(sayfaSonu, kayitlar.length)} arası
            </p>
            <Pagination
              page={sayfa}
              total={kayitlar.length}
              pageSize={SAYFA_BOYUTU}
              onPageChange={setSayfa}
            />
          </div>
        )}
      </div>
    </div>
  );
}
