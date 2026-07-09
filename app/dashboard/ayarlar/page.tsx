"use client";

import { useEffect, useState } from "react";

type Profile = { fullName: string; email: string; phone: string | null };
type Preferences = {
  notifyPaymentOverdue: boolean;
  notifyRenewalUpcoming: boolean;
  notifyFiveYear: boolean;
  notifyMonthlySummary: boolean;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-[#17B6AE]" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

export default function AyarlarPage() {
  const [profile, setProfile] = useState<Profile>({ fullName: "", email: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", newPasswordRepeat: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile(d.user);
        }
        setProfileLoading(false);
      });
    fetch("/api/dashboard/notification-preferences")
      .then((r) => r.json())
      .then((d) => setPrefs(d.preferences));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfileSaving(false);

    if (!res.ok) {
      setProfileMsg({ type: "error", text: data.error || "Profil güncellenemedi." });
      return;
    }
    setProfile(data.user);
    setProfileMsg({ type: "success", text: "Profil bilgileriniz güncellendi." });
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.newPassword !== passwordForm.newPasswordRepeat) {
      setPasswordMsg({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    setPasswordSaving(true);
    const res = await fetch("/api/dashboard/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });
    const data = await res.json();
    setPasswordSaving(false);

    if (!res.ok) {
      setPasswordMsg({ type: "error", text: data.error || "Şifre güncellenemedi." });
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "", newPasswordRepeat: "" });
    setPasswordMsg({ type: "success", text: "Şifreniz güncellendi." });
  }

  async function updatePref(key: keyof Preferences, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await fetch("/api/dashboard/notification-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-sm text-slate-500 mt-1">Hesap bilgilerinizi güncelleyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-1">Profil Bilgileri</h2>
          <p className="text-sm text-slate-500 mb-4">Hesap bilgilerinizi güncelleyin.</p>

          {profileMsg && (
            <div className={`mb-4 text-sm px-4 py-3 rounded-xl ${profileMsg.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-600" : "bg-red-50 border border-red-100 text-red-500"}`}>
              {profileMsg.text}
            </div>
          )}

          {profileLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-posta</label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefon</label>
                <input
                  type="text"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
              >
                {profileSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-1">Şifre Değiştir</h2>
          <p className="text-sm text-slate-500 mb-4">Hesap şifrenizi güncelleyin.</p>

          {passwordMsg && (
            <div className={`mb-4 text-sm px-4 py-3 rounded-xl ${passwordMsg.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-600" : "bg-red-50 border border-red-100 text-red-500"}`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mevcut Şifre</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Yeni Şifre</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Yeni Şifre Tekrar</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPasswordRepeat}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPasswordRepeat: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {passwordSaving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-800 mb-1">Bildirim Tercihleri</h2>
          <p className="text-sm text-slate-500 mb-4">Hangi bildirimleri almak istediğinizi seçin.</p>

          {!prefs ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Gecikmiş Ödeme Bildirimleri</p>
                  <p className="text-xs text-slate-500">Kiracı vadesinde ödeme yapmazsa bildirim al.</p>
                </div>
                <Toggle checked={prefs.notifyPaymentOverdue} onChange={(v) => updatePref("notifyPaymentOverdue", v)} />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Zam Dönemi Hatırlatmaları</p>
                  <p className="text-xs text-slate-500">12 aylık borçlandırma dönemi dolmadan önce hatırlat.</p>
                </div>
                <Toggle checked={prefs.notifyRenewalUpcoming} onChange={(v) => updatePref("notifyRenewalUpcoming", v)} />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">5. Yıl Bildirimleri</p>
                  <p className="text-xs text-slate-500">Kira tespit davası açılabilecek 5. yıl yaklaşınca bildirim al.</p>
                </div>
                <Toggle checked={prefs.notifyFiveYear} onChange={(v) => updatePref("notifyFiveYear", v)} />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Aylık Tahsilat Özeti</p>
                  <p className="text-xs text-slate-500">Her ay sonunda toplam tahsilat özeti bildirimi al.</p>
                </div>
                <Toggle checked={prefs.notifyMonthlySummary} onChange={(v) => updatePref("notifyMonthlySummary", v)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
