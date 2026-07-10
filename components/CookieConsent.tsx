"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mizan_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage erişilemiyorsa bannerı sessizce gösterme
    }
  }, []);

  function respond(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // yok say
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-slate-600 leading-relaxed flex-1">
          Web sitemizde deneyiminizi iyileştirmek için çerezler kullanıyoruz. Sitemizi kullanmaya devam ederek çerez
          kullanımını kabul etmiş olursunuz. Detaylar için{" "}
          <a href="/cerez-politikasi" className="text-[#17B6AE] underline font-semibold">
            Çerez Politikası
          </a>
          &apos;nı inceleyebilirsiniz.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => respond("rejected")}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-gray-50 transition"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17B6AE] hover:bg-[#149891] transition shadow-md shadow-[#17B6AE]/25"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
