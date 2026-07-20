"use client";

// Genel duyuru: Başlık / Alt Başlık / Mesaj yazılır; hedef olarak tüm
// kullanıcılar veya tek bir kullanıcı seçilir. Duyuru hem uygulama içi
// bildirim hem telefon push bildirimi olarak gider.

import { useState } from "react";
import { useRouter } from "next/navigation";

type Kullanici = { id: string; fullName: string; email: string };
type Duyuru = {
  id: string;
  title: string;
  subtitle: string | null;
  message: string;
  targetName: string | null;
  createdAt: Date | string;
  sender: { fullName: string };
};

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 " +
  "px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]";

const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5";

export default function AnnouncementsClient({
  announcements,
  users,
}: {
  announcements: Duyuru[];
  users: Kullanici[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", subtitle: "", message: "" });
  const [targetType, setTargetType] = useState<"all" | "user">("all");
  const [selectedUser, setSelectedUser] = useState<Kullanici | null>(null);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const lower = (s: string) => (s || "").toLocaleLowerCase("tr-TR");
  const filteredUsers = users.filter((u) =>
    lower(`${u.fullName} ${u.email}`).includes(lower(search))
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (targetType === "user" && !selectedUser) {
      setFeedback({ ok: false, text: "Lütfen duyurunun gideceği kullanıcıyı seçin." });
      return;
    }
    const confirmText =
      targetType === "user"
        ? `Bu duyuru SADECE ${selectedUser!.fullName} adlı kullanıcıya gönderilecek. Emin misiniz?`
        : "Bu duyuru TÜM kullanıcılara (uygulama bildirimi + telefon push) gönderilecek. Emin misiniz?";
    if (!confirm(confirmText)) return;

    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetId: targetType === "user" ? selectedUser!.id : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error || "Bir hata oluştu." });
        return;
      }
      setFeedback({
        ok: true,
        text: `Duyuru gönderildi.${data.pushRecipients != null ? ` Push ulaşan cihaz: ${data.pushRecipients}` : ""}`,
      });
      setForm({ title: "", subtitle: "", message: "" });
      setSelectedUser(null);
      setTargetType("all");
      router.refresh();
    } catch {
      setFeedback({ ok: false, text: "Bağlantı hatası." });
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu duyuru kaydı silinsin mi? (Gönderilmiş bildirimler geri alınmaz)")) return;
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Duyurular</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Duyurunuz kullanıcılara uygulama içi bildirim ve telefon push bildirimi olarak gider
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
            feedback.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Yeni duyuru */}
      <form
        onSubmit={submit}
        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 mb-6 space-y-4"
      >
        <div>
          <label className={labelCls}>Kime Gönderilsin? *</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(
              [
                { key: "all", label: "📢 Tüm Kullanıcılar" },
                { key: "user", label: "👤 Belirli Kullanıcı" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTargetType(t.key);
                  setFeedback(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  targetType === t.key
                    ? "border-[#17B6AE] bg-[#17B6AE]/10 text-[#17B6AE]"
                    : "border-gray-200 dark:border-slate-700 text-slate-400 hover:border-[#17B6AE]/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {targetType === "user" && (
            <div className="relative">
              <div
                onClick={() => setPickerOpen(!pickerOpen)}
                className={`${inputCls} flex items-center justify-between cursor-pointer`}
              >
                <span className={selectedUser ? "" : "text-slate-400"}>
                  {selectedUser ? `${selectedUser.fullName} (${selectedUser.email})` : "Kullanıcı seçin..."}
                </span>
                <span className="text-slate-400">{pickerOpen ? "▲" : "▼"}</span>
              </div>
              {pickerOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="İsim veya e-posta ara..."
                      autoFocus
                      className={inputCls}
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-400">Sonuç bulunamadı</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setPickerOpen(false);
                            setSearch("");
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-[#17B6AE]/5 border-t border-gray-50 dark:border-slate-700/50"
                        >
                          <p className="text-sm text-slate-800 dark:text-slate-100">{u.fullName}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Duyuru Başlığı *</label>
          <input
            type="text"
            required
            maxLength={80}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Örn: Haziran 2026 kira artış oranı açıklandı"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            Alt Başlık <span className="font-normal">(isteğe bağlı — bildirimde ikinci satır)</span>
          </label>
          <input
            type="text"
            maxLength={80}
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Örn: Mizan Mülk Yönetimi"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Duyuru Metni *</label>
          <textarea
            required
            rows={4}
            maxLength={500}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Duyurunuzu yazın... (bildirimde ilk satırlar görünür, kısa tutun)"
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-right text-slate-400 mt-1">{form.message.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-[#17B6AE] text-white hover:bg-[#139f98] transition-colors disabled:opacity-60"
        >
          {sending
            ? "Gönderiliyor..."
            : targetType === "user"
            ? `👤 ${selectedUser ? selectedUser.fullName + " Kişisine" : "Kullanıcıya"} Gönder`
            : "📢 Herkese Gönder"}
        </button>
      </form>

      {/* Geçmiş duyurular */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Geçmiş Duyurular</p>
        </div>
        {announcements.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Henüz duyuru gönderilmemiş.</p>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="p-4 flex items-start gap-3 border-b border-gray-50 dark:border-slate-800/60"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    📢 {a.title}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.targetName
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {a.targetName ? `👤 ${a.targetName}` : "📢 Herkese"}
                  </span>
                </div>
                {a.subtitle && (
                  <p className="text-xs font-medium text-[#17B6AE] mt-0.5">{a.subtitle}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {a.sender.fullName} · {new Date(a.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
