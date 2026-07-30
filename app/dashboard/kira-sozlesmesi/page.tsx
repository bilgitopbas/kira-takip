import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import KiraSozlesmesiForm from "@/components/KiraSozlesmesiForm";

export default async function KiraSozlesmesiPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Kira Sözleşmesi Oluştur
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Formu doldurun, sözleşmeniz Word ve PDF olarak hazırlansın.
        </p>
      </div>

      <div className="bg-[#17B6AE]/5 border border-[#17B6AE]/20 rounded-2xl p-4 mb-6">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Sözleşme metni (20 genel, 10 özel koşul) hazır şablondan gelir; siz yalnızca
          taraflara ve kiraya ilişkin bilgileri doldurursunuz. Belgeyi indirdikten sonra
          <strong> imzalatmadan önce tüm alanları kontrol etmenizi</strong> öneririz.
        </p>
      </div>

      <KiraSozlesmesiForm />
    </div>
  );
}
