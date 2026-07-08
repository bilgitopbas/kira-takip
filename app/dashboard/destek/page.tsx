"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Verileriniz güvende mi?",
    a: "Evet. Tüm verileriniz SSL ile şifrelenmiş bağlantı üzerinden iletilir ve güvenli sunucularda saklanır.",
  },
  {
    q: "Destek talebime ne zaman dönüş yapılır?",
    a: "Destek taleplerine genellikle 24 saat içinde dönüş yapılmaktadır.",
  },
  {
    q: "Kiracı ve mülk bilgilerimi kim görebilir?",
    a: "Sadece siz ve yetkilendirdiğiniz hesabınız verilerinize erişebilir. Başka hiçbir kullanıcı görüntüleyemez.",
  },
  {
    q: "Ödeme/dekont dosyalarım nerede saklanıyor?",
    a: "Yüklediğiniz dekont ve sözleşme dosyaları güvenli sunucu depolamasında saklanır, sadece kendi hesabınızdan erişilebilir.",
  },
  {
    q: "Aboneliğimi nasıl iptal edebilirim?",
    a: "Destek talebi oluşturarak veya bilgi@mizanmulkyonetimi.com adresinden bize ulaşarak iptal talebinde bulunabilirsiniz.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{q}</span>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="text-sm text-slate-500 pb-4 pr-6">{a}</p>}
    </div>
  );
}

export default function DestekPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch("/api/dashboard/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Destek talebi gönderilemedi.");
      return;
    }

    setSubject("");
    setDescription("");
    setSuccess(true);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Yardım &amp; Destek</h1>
        <p className="text-sm text-slate-500 mt-1">Sorularınız için buradayız.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">İletişim Bilgileri</h2>
          <div className="space-y-3">
            <a
              href="mailto:bilgi@mizanmulkyonetimi.com"
              className="flex items-center gap-3 text-sm text-slate-700 hover:text-[#17B6AE] transition"
            >
              <div className="w-9 h-9 rounded-lg bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              bilgi@mizanmulkyonetimi.com
            </a>
            <a
              href="tel:+905307382996"
              className="flex items-center gap-3 text-sm text-slate-700 hover:text-[#17B6AE] transition"
            >
              <div className="w-9 h-9 rounded-lg bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              +90 530 738 29 96
            </a>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mt-6 mb-2">Sıkça Sorulan Sorular</h3>
          <div>
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Destek Talebi Oluştur</h2>

          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm px-4 py-3 rounded-xl">
              Destek talebiniz alındı. En kısa sürede size dönüş yapılacaktır.
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Konu *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Açıklama *</label>
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {submitting ? "Gönderiliyor..." : "Destek Talebi Gönder"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
