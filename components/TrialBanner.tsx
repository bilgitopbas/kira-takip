import Link from "next/link";
import type { AccessState } from "@/lib/access";

export default function TrialBanner({
  state,
  trialDaysLeft,
  graceDaysLeft,
}: {
  state: AccessState;
  trialDaysLeft: number;
  graceDaysLeft: number;
}) {
  if (state === "ACTIVE") return null;

  if (state === "TRIAL") {
    return (
      <div className="flex items-center justify-between gap-4 bg-[#17B6AE]/8 border border-[#17B6AE]/20 rounded-xl px-5 py-3 mb-6">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-[#17B6AE]">Ücretsiz deneme sürümündesiniz.</span>{" "}
          Deneme süresi bitmesine <span className="font-bold">{trialDaysLeft} gün</span> kaldı.
        </p>
        <Link href="/dashboard/mizan-pro" className="text-xs font-semibold text-[#17B6AE] hover:underline whitespace-nowrap">
          Mizan Pro&apos;ya Göz At →
        </Link>
      </div>
    );
  }

  if (state === "GRACE") {
    return (
      <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-amber-600">Deneme süreniz doldu — son şansınız!</span>{" "}
          Hesabınızın kilitlenmesine <span className="font-bold">{graceDaysLeft} gün</span> kaldı.
        </p>
        <Link
          href="/dashboard/mizan-pro"
          className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
        >
          Şimdi Mizan Pro&apos;ya Geç
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-6">
      <p className="text-sm text-slate-700">
        <span className="font-semibold text-red-600">Deneme ve ek süreniz sona erdi.</span>{" "}
        Verilerinizi görüntüleyebilirsiniz ancak ekleme, güncelleme, bildirim ve hesaplama yapamazsınız.
      </p>
      <Link
        href="/dashboard/mizan-pro"
        className="text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
      >
        Mizan Pro&apos;ya Geç
      </Link>
    </div>
  );
}
