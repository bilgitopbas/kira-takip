"use client";

import { useState } from "react";
import CalendarGrid, { type CalendarEvent } from "@/components/calendar/CalendarGrid";

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

  const fiveYearEventsByDate = fiveYearEvents.filter((e) => e.date === fiveYearSelected);
  const renewalEventsByDate = renewalEvents.filter((e) => e.date === renewalSelected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          12 aylık borçlandırma dolmadan 1 ay önce hatırlatma için işaretlenir.
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
  );
}
