export type EffectiveDebtStatus = "PAID" | "PARTIAL" | "UNPAID" | "PENDING";

type Amountish = number | string | { toString(): string };

export function getEffectiveDebtStatus(debt: {
  amount: Amountish;
  dueDate: Date | string;
  payments?: { amount: Amountish }[];
}): EffectiveDebtStatus {
  const amount = Number(debt.amount);
  const totalPaid = (debt.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

  if (amount > 0 && totalPaid >= amount) return "PAID";
  if (totalPaid > 0) return "PARTIAL";

  const due = new Date(debt.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return "UNPAID";
  return "PENDING";
}

export function getTotalPaid(payments?: { amount: Amountish }[]) {
  return (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
}

export const DEBT_STATUS_LABELS: Record<EffectiveDebtStatus, string> = {
  PAID: "Ödendi",
  PARTIAL: "Kısmi Ödeme",
  UNPAID: "Ödenmedi",
  PENDING: "Bekliyor",
};

export const DEBT_STATUS_STYLES: Record<EffectiveDebtStatus, string> = {
  PAID: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  PARTIAL: "bg-blue-500 text-white shadow-sm shadow-blue-500/30",
  UNPAID: "bg-red-500 text-white shadow-sm shadow-red-500/30",
  PENDING: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
};
