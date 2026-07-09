"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  NEW_CUSTOMER: "bg-[#17B6AE]/10 text-[#17B6AE]",
  IYZICO_PAYMENT: "bg-emerald-50 text-emerald-500",
  ANNOUNCEMENT: "bg-blue-50 text-blue-500",
};

function relativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

export default function AdminBildirimlerPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/dashboard/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRead(n: Notification) {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: !n.isRead } : x)));
    await fetch(`/api/dashboard/notifications/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: !n.isRead }),
    });
  }

  async function remove(id: string) {
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/dashboard/notifications/${id}`, { method: "DELETE" });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    await fetch("/api/dashboard/notifications/mark-all-read", { method: "POST" });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bildirimler</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-semibold text-[#17B6AE] hover:text-[#149891] transition">
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">Henüz bildiriminiz yok.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.isRead ? "bg-[#17B6AE]/5" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_ICON[n.type] || "bg-slate-50 text-slate-400"}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#17B6AE]" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400">{relativeTime(n.createdAt)}</span>
                    {n.link && (
                      <Link href={n.link} className="text-xs font-semibold text-[#17B6AE] hover:text-[#149891]">
                        Görüntüle →
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleRead(n)}
                    title={n.isRead ? "Okunmadı olarak işaretle" : "Okundu olarak işaretle"}
                    className="text-xs text-slate-400 hover:text-[#17B6AE] transition px-2 py-1"
                  >
                    {n.isRead ? "Okunmadı yap" : "Okundu yap"}
                  </button>
                  <button onClick={() => remove(n.id)} title="Sil" className="text-slate-300 hover:text-red-500 transition p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
