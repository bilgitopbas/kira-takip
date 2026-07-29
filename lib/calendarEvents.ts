import { addMonthsClamped, getLastCoveredMonth } from "@/lib/debts";

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

// Borçlar {dueDate, periodMonths} olarak verilir. Aylık kayıtlarda
// periodMonths = 1 olduğu için sonuçlar eskisiyle birebir aynıdır; yıllık
// kayıtlarda (periodMonths = 12) dönemin gerçek bitişi esas alınır.
type DonemliBorc = { dueDate: Date; periodMonths?: number | null };

// Son borç döneminin kapsadığı en son ay (aylıkta son borcun kendi ayı,
// yıllıkta 12 aylık kapsamın son ayı)
function sonKapsananAy(debts: DonemliBorc[]) {
  if (debts.length === 0) return null;
  const latest = debts.reduce((max, d) => (d.dueDate > max.dueDate ? d : max));
  return getLastCoveredMonth(latest.dueDate, latest.periodMonths);
}

export function getRenewalReminderDate(debts: DonemliBorc[]) {
  const son = sonKapsananAy(debts);
  if (!son) return null;
  return addMonthsClamped(son, 1);
}

export function getRenewalNotificationDate(debts: DonemliBorc[]) {
  const son = sonKapsananAy(debts);
  if (!son) return null;
  const result = new Date(son);
  result.setDate(result.getDate() - 15);
  return result;
}
