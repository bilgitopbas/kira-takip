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
  PAID: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  UNPAID: "bg-red-500 text-white shadow-sm shadow-red-500/30",
  PENDING: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
};
