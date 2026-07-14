"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function OturumCallbackContent() {
  const searchParams = useSearchParams();
  const [attempted, setAttempted] = useState(false);

  const token = searchParams.get("token") || "";
  const destination = searchParams.get("destination") || "/dashboard";
  const deepLink = `mizanmulk://auth-callback?token=${encodeURIComponent(token)}&destination=${encodeURIComponent(destination)}`;

  useEffect(() => {
    if (!token) return;
    // Sayfa ilk yüklendiğinde bir kez otomatik denenir (bazı Safari
    // sürümlerinde gerçek bir sayfa yüklemesinden sonraki JS yönlendirmesi
    // çalışabiliyor); çalışmazsa aşağıdaki buton kullanıcı dokunuşuyla
    // güvenilir şekilde uygulamayı açar.
    window.location.href = deepLink;
    setAttempted(true);
  }, [token, deepLink]);

  if (!token) {
    return (
      <p className="text-sm text-slate-500 text-center">
        Geçersiz veya süresi dolmuş bağlantı. Lütfen uygulamadan tekrar giriş yapmayı deneyin.
      </p>
    );
  }

  return (
    <div className="text-center">
      <Image
        src="/logo-yeni-white.png"
        alt="Mizan Mülk Yönetimi"
        width={311}
        height={100}
        className="h-12 w-auto object-contain mx-auto mb-6"
        style={{ width: "auto" }}
      />
      <h1 className="text-xl font-bold text-slate-800 mb-2">Giriş başarılı</h1>
      <p className="text-sm text-slate-500 mb-6">
        Devam etmek için aşağıdaki butona dokunup uygulamaya dönün.
      </p>
      <a
        href={deepLink}
        className="inline-flex items-center justify-center gap-2 bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
      >
        Uygulamaya Dön
      </a>
      {attempted && (
        <p className="text-xs text-slate-400 mt-4">
          Otomatik yönlendirilmediyseniz yukarıdaki butona dokunun.
        </p>
      )}
    </div>
  );
}

export default function OturumCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Suspense fallback={null}>
          <OturumCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
