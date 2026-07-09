"use client";

export default function ImpersonationBanner({ customerName }: { customerName: string }) {
  async function exitImpersonation() {
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <div className="no-print bg-amber-500 text-white text-sm px-6 py-2 flex items-center justify-between flex-shrink-0">
      <span className="font-medium">
        Yönetici olarak <strong>{customerName}</strong> hesabına bakıyorsunuz. Tüm işlemler bu müşteri adına yapılır.
      </span>
      <button
        type="button"
        onClick={exitImpersonation}
        className="bg-white/20 hover:bg-white/30 font-semibold px-3 py-1 rounded-lg transition text-xs"
      >
        Yönetime Dön
      </button>
    </div>
  );
}
