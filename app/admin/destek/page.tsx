"use client";

import { useEffect, useState } from "react";

type ContactRequest = {
  id: string;
  name: string;
  phone: string;
  marketingConsent: boolean;
  isRead: boolean;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  user: { fullName: string; email: string; phone: string | null };
};

export default function AdminDestekPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/contact-requests").then((r) => r.json()),
      fetch("/api/admin/support-tickets").then((r) => r.json()),
    ]).then(([reqData, ticketData]) => {
      setRequests(reqData.requests || []);
      setTickets(ticketData.tickets || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Destek Talepleri</h1>
        <p className="text-sm text-slate-400 mt-1">Panel içi destek talepleri ve public sayfadan gelen iletişim talepleri.</p>
      </div>

      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-700 mb-3">Panel Destek Talepleri</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Konu</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Açıklama</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">Henüz destek talebi yok.</td>
                  </tr>
                )}
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-500 text-xs font-bold">{t.user.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{t.user.fullName}</p>
                          <p className="text-xs text-slate-400">{t.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium max-w-[160px]">{t.subject}</td>
                    <td className="px-5 py-4 text-slate-500 max-w-[320px]">{t.description}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.status === "OPEN" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-50 text-slate-400 border border-gray-100"}`}>
                        {t.status === "OPEN" ? "Açık" : "Kapalı"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Public İletişim Talepleri</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ad Soyad</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pazarlama</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">Henüz destek talebi yok.</td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-slate-500 text-xs font-bold">{r.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-slate-700">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{r.phone}</td>
                    <td className="px-5 py-4">
                      {r.marketingConsent ? (
                        <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full">Onaylı</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {new Date(r.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.isRead ? "bg-gray-50 text-slate-400 border border-gray-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                        {r.isRead ? "Okundu" : "Yeni"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
