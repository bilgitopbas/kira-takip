"use client";

import { useMemo, useState } from "react";

export type CalendarEvent = {
  date: string; // YYYY-MM-DD
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
  contractStart: string;
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
    <div>
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
          return (
            <button
              type="button"
              key={i}
              onClick={() => dayEvents.length > 0 && onDayClick(key)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-150 ${
                isSelected
                  ? "bg-[#17B6AE] text-white shadow-lg shadow-[#17B6AE]/30 scale-105"
                  : isToday
                  ? "border-2 border-[#17B6AE] text-slate-800 font-semibold"
                  : dayEvents.length > 0
                  ? "hover:scale-110 hover:shadow-md hover:-translate-y-0.5 cursor-pointer text-slate-700 font-medium bg-gray-50"
                  : "text-slate-500"
              }`}
            >
              <span>{cell.date.getDate()}</span>
              {dayEvents.length > 0 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white" : dotColorClass}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
