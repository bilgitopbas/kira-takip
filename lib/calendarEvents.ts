import { addMonthsClamped } from "@/lib/debts";

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getFiveYearDate(contractStart: Date) {
  return new Date(
    contractStart.getFullYear() + 5,
    contractStart.getMonth(),
    contractStart.getDate()
  );
}

export function getRenewalReminderDate(debtDueDates: Date[]) {
  if (debtDueDates.length === 0) return null;
  const latest = debtDueDates.reduce((max, d) => (d > max ? d : max));
  return addMonthsClamped(latest, -1);
}
