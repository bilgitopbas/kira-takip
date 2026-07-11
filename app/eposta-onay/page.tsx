import Link from "next/link";
import Image from "next/image";

export default async function EpostaOnayPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const content = {
    success: {
      icon: "✅",
      title: "E-posta Adresiniz Onaylandı",
      message: "Artık hesabınızı sorunsuz şekilde kullanmaya devam edebilirsiniz.",
    },
    invalid: {
      icon: "⚠️",
      title: "Bağlantının Süresi Dolmuş",
      message:
        "Bu onay bağlantısı geçersiz ya da süresi dolmuş. Panelinize giriş yapıp yeni bir onay maili isteyebilirsiniz.",
    },
    missing: {
      icon: "⚠️",
      title: "Geçersiz Bağlantı",
      message: "Onay bağlantısı eksik görünüyor. Lütfen e-postanızdaki bağlantıyı tekrar kontrol edin.",
    },
  }[status === "success" || status === "invalid" ? status : "missing"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/logo-yeni-white.png"
              alt="Mizan Mülk Yönetimi"
              width={311}
              height={100}
              className="h-14 w-auto object-contain drop-shadow-[0_8px_16px_rgba(23,182,174,0.25)]"
              style={{ width: "auto" }}
              priority
            />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-5xl mb-4">{content.icon}</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">{content.title}</h1>
          <p className="text-sm text-slate-500 mb-6">{content.message}</p>
          <Link
            href="/dashboard"
            className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold rounded-xl py-3 px-6 text-sm transition shadow-md shadow-[#17B6AE]/25"
          >
            Panele Git
          </Link>
        </div>
      </div>
    </div>
  );
}
