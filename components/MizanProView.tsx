"use client";

import { useState } from "react";
import type { AccessState } from "@/lib/access";

const PRICE_PER_PROPERTY = 75;

type Access = {
  state: AccessState;
  trialDaysLeft: number;
  graceDaysLeft: number;
};

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
};

const STATE_COPY: Record<AccessState, { label: string; style: string; desc: string }> = {
  TRIAL: {
    label: "Ücretsiz Deneme",
    style: "bg-[#17B6AE]/10 text-[#17B6AE] border-[#17B6AE]/20",
    desc: "45 günlük deneme sürenizde sınırsız mülk ve kiracı ekleyebilirsiniz.",
  },
  GRACE: {
    label: "Ek Süre — Son Şans",
    style: "bg-amber-50 text-amber-600 border-amber-200",
    desc: "Deneme süreniz doldu, 7 günlük ek sürenizdesiniz. Hesabınız kilitlenmeden önce Mizan Pro'ya geçin.",
  },
  LOCKED: {
    label: "Süre Doldu",
    style: "bg-red-50 text-red-600 border-red-200",
    desc: "Deneme ve ek süreniz sona erdi. Verilerinizi görüntüleyebilirsiniz ancak yeni ekleme, güncelleme, bildirim ve hesaplama yapamazsınız.",
  },
  ACTIVE: {
    label: "Mizan Pro Aktif",
    style: "bg-emerald-50 text-emerald-600 border-emerald-200",
    desc: "Mizan Pro planınız aktif. Aşağıdan planınızı büyütebilirsiniz.",
  },
};

export default function MizanProView({
  access,
  profile,
  currentPropertyCount,
  planPropertyLimit,
  isActive,
}: {
  access: Access;
  profile: Profile;
  currentPropertyCount: number;
  planPropertyLimit: number | null;
  isActive: boolean;
}) {
  const [propertyCount, setPropertyCount] = useState(Math.max(currentPropertyCount, 1));
  const [showPayment, setShowPayment] = useState(false);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planMsg, setPlanMsg] = useState<string | null>(null);

  const [showManagementForm, setShowManagementForm] = useState(false);
  const [mgmtForm, setMgmtForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    propertyCount: "",
  });
  const [mgmtSubmitting, setMgmtSubmitting] = useState(false);
  const [mgmtMsg, setMgmtMsg] = useState<string | null>(null);

  const price = propertyCount * PRICE_PER_PROPERTY;
  const copy = STATE_COPY[access.state];

  async function submitPlanRequest() {
    setPlanSubmitting(true);
    setPlanMsg(null);
    const res = await fetch("/api/dashboard/mizan-pro/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PLAN_UPGRADE", propertyCount }),
    });
    setPlanSubmitting(false);
    if (res.ok) {
      setPlanMsg("Talebiniz alındı! Ekibimiz en kısa sürede sizinle iletişime geçip ödeme işleminizi tamamlayacak.");
    } else {
      setPlanMsg("Talebiniz gönderilemedi, lütfen tekrar deneyin.");
    }
  }

  async function submitManagementRequest(e: React.FormEvent) {
    e.preventDefault();
    setMgmtSubmitting(true);
    setMgmtMsg(null);
    const res = await fetch("/api/dashboard/mizan-pro/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "MANAGEMENT_SERVICE", ...mgmtForm }),
    });
    setMgmtSubmitting(false);
    if (res.ok) {
      setMgmtMsg("Talebiniz alındı! Ekibimiz size özel teklifle en kısa sürede dönüş yapacak.");
    } else {
      const data = await res.json().catch(() => null);
      setMgmtMsg(data?.error || "Talebiniz gönderilemedi, lütfen tekrar deneyin.");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          Mizan
          <span className="bg-gradient-to-r from-[#17B6AE] to-[#0f9089] text-white px-3 py-1 rounded-lg text-2xl shadow-md shadow-[#17B6AE]/25">
            Pro
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Planınızı yönetin, mülk sayınızı ayarlayın ve özel hizmetlerimizden yararlanın.</p>
      </div>

      {/* Durum kartı */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 mb-6 shadow-xl">
        <div className="absolute w-72 h-72 bg-[#17B6AE]/20 rounded-full blur-3xl -top-20 -right-10" />
        <div className="relative z-10">
          <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border mb-4 ${copy.style}`}>
            {copy.label}
          </span>
          <p className="text-white text-lg font-medium max-w-2xl leading-relaxed">{copy.desc}</p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Kayıtlı Mülk</p>
              <p className="text-white text-2xl font-bold">{currentPropertyCount}</p>
            </div>
            {isActive && planPropertyLimit && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Plan Limiti</p>
                <p className="text-white text-2xl font-bold">{planPropertyLimit} mülk</p>
              </div>
            )}
            {access.state === "TRIAL" && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Kalan Deneme</p>
                <p className="text-white text-2xl font-bold">{access.trialDaysLeft} gün</p>
              </div>
            )}
            {access.state === "GRACE" && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Ek Süre</p>
                <p className="text-white text-2xl font-bold">{access.graceDaysLeft} gün</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan / mülk sayısı seçimi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Planınızı Oluşturun</h2>
        <p className="text-sm text-slate-500 mb-6">
          Yönetmek istediğiniz mülk sayısını seçin — her mülk aylık {PRICE_PER_PROPERTY} TL&apos;dir.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Mülk Sayısı</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPropertyCount((c) => Math.max(1, c - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-slate-600 font-bold text-lg hover:bg-gray-50 transition"
              >
                −
              </button>
              <span className="w-14 text-center text-2xl font-bold text-slate-800">{propertyCount}</span>
              <button
                type="button"
                onClick={() => setPropertyCount((c) => Math.min(500, c + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-slate-600 font-bold text-lg hover:bg-gray-50 transition"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-between bg-gradient-to-r from-[#17B6AE]/10 to-[#17B6AE]/5 rounded-2xl px-6 py-5 border border-[#17B6AE]/15">
            <div>
              <p className="text-xs font-semibold text-[#17B6AE] uppercase tracking-wider mb-1">Aylık Tutar</p>
              <p className="text-3xl font-bold text-slate-800">
                {price.toLocaleString("tr-TR")} <span className="text-lg text-slate-500">TL</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPayment(true)}
              className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition shadow-md shadow-[#17B6AE]/25 whitespace-nowrap"
            >
              Ödemeye Geç
            </button>
          </div>
        </div>

        {showPayment && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Kredi Kartı ile Ödeme</h3>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kart Numarası</label>
                  <input disabled placeholder="•••• •••• •••• ••••" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kart Üzerindeki İsim</label>
                  <input disabled placeholder={profile.fullName} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Son Kullanma Tarihi</label>
                  <input disabled placeholder="AA/YY" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">CVC</label>
                  <input disabled placeholder="•••" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-400" />
                </div>
              </div>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                <span className="font-bold">Bilgi:</span>
                <span>
                  Online ödeme altyapımız (iyzico) entegrasyon aşamasındadır. Aşağıdan{" "}
                  <strong>{propertyCount} mülk / {price.toLocaleString("tr-TR")} TL</strong> için talebinizi hemen
                  iletebilirsiniz — ekibimiz sizinle iletişime geçip ödemenizi güvenli şekilde tamamlayacaktır.
                </span>
              </div>
              <button
                type="button"
                onClick={submitPlanRequest}
                disabled={planSubmitting}
                className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {planSubmitting ? "Gönderiliyor..." : "Talebi Gönder"}
              </button>
              {planMsg && <p className="text-sm text-center text-emerald-600 font-medium">{planMsg}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Profesyonel Mülk Yönetimi Hizmeti */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-xl">
            <span className="inline-block text-[10px] font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-2.5 py-1 rounded-full uppercase tracking-widest mb-2">
              Özel Teklif
            </span>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Profesyonel Mülk Yönetimi Hizmeti</h2>
            <p className="text-sm text-slate-500">
              Ekibimiz sizin adınıza mülk ve kiracı yönetiminde destek sağlar — kiracı takibi, tahsilat
              hatırlatmaları ve sözleşme süreçlerini sizin yerinize yönetebiliriz. Bu hizmet ücretsiz değildir,
              mülklerinize özel bir teklif hazırlanır.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowManagementForm((v) => !v)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm whitespace-nowrap"
          >
            {showManagementForm ? "Formu Kapat" : "Teklif İste"}
          </button>
        </div>

        {showManagementForm && (
          <form onSubmit={submitManagementRequest} className="mt-6 border-t border-gray-100 pt-6 space-y-4 max-w-xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ad Soyad</label>
                <input
                  required
                  value={mgmtForm.fullName}
                  onChange={(e) => setMgmtForm({ ...mgmtForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-posta</label>
                <input
                  type="email"
                  required
                  value={mgmtForm.email}
                  onChange={(e) => setMgmtForm({ ...mgmtForm, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cep Telefonu</label>
                <input
                  required
                  value={mgmtForm.phone}
                  onChange={(e) => setMgmtForm({ ...mgmtForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bulunduğunuz Şehir</label>
                <input
                  required
                  value={mgmtForm.city}
                  onChange={(e) => setMgmtForm({ ...mgmtForm, city: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mülk Sayısı</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={mgmtForm.propertyCount}
                  onChange={(e) => setMgmtForm({ ...mgmtForm, propertyCount: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={mgmtSubmitting}
              className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {mgmtSubmitting ? "Gönderiliyor..." : "Talebi Gönder"}
            </button>
            {mgmtMsg && <p className="text-sm text-emerald-600 font-medium">{mgmtMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
