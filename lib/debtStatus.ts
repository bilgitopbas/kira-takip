export type EffectiveDebtStatus = "PAID" | "UNPAID" | "PENDING";

export function getEffectiveDebtStatus(
  status: string,
  dueDate: Date | string
): EffectiveDebtStatus {
  if (status === "PAID") return "PAID";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return "UNPAID";
  return "PENDING";
}

export const DEBT_STATUS_LABELS: Record<EffectiveDebtStatus, string> = {
  PAID: "Ödendi",
  UNPAID: "Ödenmedi",
  PENDING: "Bekliyor",
};

export const DEBT_STATUS_STYLES: Record<EffectiveDebtStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  UNPAID: "bg-red-50 text-red-600 border border-red-100",
  PENDING: "bg-amber-50 text-amber-600 border border-amber-100",
};
