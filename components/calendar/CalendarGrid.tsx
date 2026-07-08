"use client";

import { useMemo, useState } from "react";

export type CalendarEvent = {
  date: string; // YYYY-MM-DD
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
  contractStart: string;
  currentRent: number;
};

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  return dateKey(new Date());
}

function firstName(fullName: string) {
  return fullName.split(" ")[0];
}

export default function CalendarGrid({
  events,
  dotColorClass,
  selectedDate,
  onDayClick,
  initialMonth,
}: {
  events: CalendarEvent[];
  dotColorClass: string;
  selectedDate: string | null;
  onDayClick: (date: string) => void;
  initialMonth?: Date;
}) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const base = initialMonth || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list: { date: Date | null }[] = [];
    for (let i = 0; i < startOffset; i++) list.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) list.push({ date: new Date(year, month, d) });
    while (list.length % 7 !== 0) list.push({ date: null });
    return list;
  }, [monthCursor]);

  const today = todayKey();

  return (
    <div className="animate-calendar-pop">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-gray-100 transition"
        >
          ‹
        </button>
        <p className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[monthCursor.getMonth()]} {monthCursor.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-gray-100 transition"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-semibold text-slate-400 py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;
          const key = dateKey(cell.date);
          const dayEvents = eventsByDate.get(key) || [];
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const hasEvents = dayEvents.length > 0;
          return (
            <div key={i} className="relative group">
              <button
                type="button"
                onClick={() => hasEvents && onDayClick(key)}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-150 ${
                  isSelected
                    ? "bg-[#17B6AE] text-white shadow-lg shadow-[#17B6AE]/30 scale-105"
                    : isToday
                    ? "border-2 border-[#17B6AE] text-slate-800 font-semibold"
                    : hasEvents
                    ? "hover:scale-110 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-slate-700 font-medium bg-gray-50"
                    : "text-slate-500"
                }`}
              >
                <span>{cell.date.getDate()}</span>
                {hasEvents && (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full mt-0.5 ${
                        isSelected ? "bg-white" : `${dotColorClass} animate-pulse`
                      }`}
                    />
                    <span
                      className={`text-[8px] leading-tight mt-0.5 max-w-full px-0.5 truncate font-semibold ${
                        isSelected ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {firstName(dayEvents[0].tenantName)}
                      {dayEvents.length > 1 ? ` +${dayEvents.length - 1}` : ""}
                    </span>
                  </>
                )}
              </button>

              {hasEvents && (
                <div className="pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-bottom">
                  <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 space-y-1.5">
                    {dayEvents.map((e) => (
                      <div key={e.tenantId} className={dayEvents.length > 1 ? "border-b border-white/10 pb-1.5 last:border-0 last:pb-0" : ""}>
                        <p className="text-xs font-bold">{e.tenantName}</p>
                        {e.contractStart && (
                          <p className="text-[11px] text-white/70 mt-0.5">
                            Sözleşme: {new Date(e.contractStart).toLocaleDateString("tr-TR")}
                          </p>
                        )}
                        <p className="text-[11px] text-white/70">
                          Güncel Kira: {e.currentRent.toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="w-3 h-3 bg-slate-900 rotate-45 mx-auto -mt-1.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
