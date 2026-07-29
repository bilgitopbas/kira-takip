export function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfResultMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfResultMonth));
  return result;
}

export function generateMonthlyDebts(startDate: Date, monthlyRent: number, months = 12) {
  const debts = [];
  for (let i = 0; i < months; i++) {
    const dueDate = addMonthsClamped(startDate, i);
    debts.push({
      year: dueDate.getFullYear(),
      month: dueDate.getMonth() + 1,
      amount: monthlyRent,
      dueDate,
      periodMonths: 1,
    });
  }
  return debts;
}

// Yıllık peşin ödemede 12 ayrı satır yerine 12 ayı kapsayan tek bir borç kaydı
// oluşturulur. Ödeme/tahsilat mantığı aylıkla birebir aynı işler.
export function generateYearlyDebt(startDate: Date, yearlyRent: number, months = 12) {
  return [
    {
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      amount: yearlyRent,
      dueDate: startDate,
      periodMonths: months,
    },
  ];
}

// Borcun kapsadığı son ay. Aylık kayıtta (periodMonths = 1) borcun kendi ayı,
// yıllıkta 12 aylık kapsamın son ayıdır: 12 Aralık 2026 -> 12 Kasım 2027.
// Bu, aylık tablodaki son satırın tarihiyle birebir aynıdır.
export function getLastCoveredMonth(dueDate: Date, periodMonths?: number | null) {
  return addMonthsClamped(dueDate, Math.max(1, periodMonths ?? 1) - 1);
}
