"use client";

import { useMemo, useState } from "react";
import CalendarGrid, { type CalendarEvent } from "@/components/calendar/CalendarGrid";
import YazdirButonu from "@/components/YazdirButonu";

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function OzetBolumu({
  baslik,
  olaylar,
  renk,
}: {
  baslik: string;
  olaylar: CalendarEvent[];
  renk: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${renk}`} />
        <h3 className="text-sm font-bold text-slate-800">
          {baslik} <span className="font-normal text-slate-500">({olaylar.length})</span>
        </h3>
      </div>
      {olaylar.length === 0 ? (
        <p className="text-xs text-slate-400 pl-4">Bu ay için kayıt yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-2 py-1.5 font-semibold text-slate-500 border-r border-gray-200">Tarih</th>
                <th className="px-2 py-1.5 font-semibold text-slate-500 border-r border-gray-200">Kiracı</th>
                <th className="px-2 py-1.5 font-semibold text-slate-500 border-r border-gray-200">Mülk</th>
                <th className="px-2 py-1.5 font-semibold text-slate-500">Güncel Kira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {olaylar.map((e) => (
                <tr key={`${e.tenantId}-${e.date}`}>
                  <td className="px-2 py-1.5 text-slate-700 border-r border-gray-200 whitespace-nowrap">
                    {new Date(e.date).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-2 py-1.5 text-slate-800 font-medium border-r border-gray-200">{e.tenantName}</td>
                  <td className="px-2 py-1.5 text-slate-600 border-r border-gray-200">{e.propertyTitle}</td>
                  <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                    {e.currentRent.toLocaleString("tr-TR")} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Seçilen ayın olaylarını çıktı için düz liste hâlinde gösterir.
// Ekranda da görünür (hangi ayın yazdırılacağı belli olsun), çıktıda ise
// takvim ızgaraları gizlenip yalnızca bu liste basılır.
function AylikOzet({
  ay,
  fiveYearEvents,
  renewalEvents,
}: {
  ay: string;
  fiveYearEvents: CalendarEvent[];
  renewalEvents: CalendarEvent[];
}) {
  const [yil, aySayi] = ay.split("-").map(Number);
  const ayEtiketi = `${AY_ADLARI[aySayi - 1]} ${yil}`;

  const ayaAit = (list: CalendarEvent[]) =>
    list
      .filter((e) => e.date.startsWith(ay))
      .sort((a, b) => a.date.localeCompare(b.date));

  const tespit = ayaAit(fiveYearEvents);
  const zam = ayaAit(renewalEvents);

  return (
    <div>
      <h2 className="text-base font-bold text-slate-900 mb-1">{ayEtiketi} Takvim Özeti</h2>
      <p className="text-xs text-slate-500 mb-4">
        Bu ay içinde kira tespit davası açılabilecek ve zam/borçlandırma dönemi gelen kiracılar.
      </p>
      <OzetBolumu baslik="5. Yıl — Kira Tespit" olaylar={tespit} renk="bg-red-500" />
      <OzetBolumu baslik="Kira Artış / Borçlandırma" olaylar={zam} renk="bg-amber-500" />
    </div>
  );
}

function EventInfoPanel({ date, events }: { date: string | null; events: CalendarEvent[] }) {
  if (!date || events.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {events.map((e) => (
        <a
          key={e.tenantId}
          href={`/dashboard/kiraci/${e.tenantId}`}
          className="block bg-gray-50 hover:bg-[#17B6AE]/5 border border-gray-100 hover:border-[#17B6AE]/30 rounded-xl p-4 transition"
        >
          <p className="text-sm font-semibold text-slate-800">{e.tenantName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{e.propertyTitle}</p>
          {e.contractStart && (
            <p className="text-xs text-slate-400 mt-1">
              Sözleşme Başlangıcı: {new Date(e.contractStart).toLocaleDateString("tr-TR")}
            </p>
          )}
          <p className="text-xs text-slate-400">
            Güncel Aylık Kira: {e.currentRent.toLocaleString("tr-TR")} ₺
          </p>
        </a>
      ))}
    </div>
  );
}

export default function TakvimView({
  fiveYearEvents,
  renewalEvents,
}: {
  fiveYearEvents: CalendarEvent[];
  renewalEvents: CalendarEvent[];
}) {
  const [fiveYearSelected, setFiveYearSelected] = useState<string | null>(null);
  const [renewalSelected, setRenewalSelected] = useState<string | null>(null);

  // Yazdırılacak ay (varsayılan: içinde bulunulan ay)
  const buAy = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const [yazdirilacakAy, setYazdirilacakAy] = useState(buAy);

  const fiveYearEventsByDate = fiveYearEvents.filter((e) => e.date === fiveYearSelected);
  const renewalEventsByDate = renewalEvents.filter((e) => e.date === renewalSelected);

  return (
    <>
      {/* Ay seçimi + yazdırma. Çıktıda yalnızca aşağıdaki özet basılır. */}
      <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Yazdırılacak Ay
          </label>
          <input
            type="month"
            value={yazdirilacakAy}
            onChange={(e) => setYazdirilacakAy(e.target.value || buAy)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
        <div className="flex-1" />
        <YazdirButonu label="Bu Ayı Yazdır" />
      </div>

      {/* Ekranda özet kartı, çıktıda tek başına basılan bölüm */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 print:border-0 print:shadow-none print:p-0">
        <AylikOzet
          ay={yazdirilacakAy}
          fiveYearEvents={fiveYearEvents}
          renewalEvents={renewalEvents}
        />
      </div>

    <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <h2 className="text-sm font-bold text-slate-800">5. Yıl Kira Tespit Takvimi</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Sözleşme başlangıcından 5 yıl dolan kiracılar işaretlenir.
        </p>
        <CalendarGrid
          events={fiveYearEvents}
          dotColorClass="bg-red-500"
          selectedDate={fiveYearSelected}
          onDayClick={(d) => setFiveYearSelected(d === fiveYearSelected ? null : d)}
        />
        <EventInfoPanel date={fiveYearSelected} events={fiveYearEventsByDate} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <h2 className="text-sm font-bold text-slate-800">Kira Artış / Borçlandırma Hatırlatma</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          12 aylık borçlandırma dönemi dolduğunda, yeni dönemin (zam) başladığı ay işaretlenir.
        </p>
        <CalendarGrid
          events={renewalEvents}
          dotColorClass="bg-amber-500"
          selectedDate={renewalSelected}
          onDayClick={(d) => setRenewalSelected(d === renewalSelected ? null : d)}
        />
        <EventInfoPanel date={renewalSelected} events={renewalEventsByDate} />
      </div>
    </div>
    </>
  );
}
