export function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfResultMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfResultMonth));
  return result;
}

export function generateMonthlyDebts(startDate: Date, monthlyRent: number) {
  const debts = [];
  for (let i = 0; i < 12; i++) {
    const dueDate = addMonthsClamped(startDate, i);
    debts.push({
      year: dueDate.getFullYear(),
      month: dueDate.getMonth() + 1,
      amount: monthlyRent,
      dueDate,
    });
  }
  return debts;
}
