"use client";

import { useState } from "react";

export default function EmailVerificationBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function resend() {
    setStatus("sending");
    setErrorMsg("");
    const res = await fetch("/api/dashboard/profile/resend-verification", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error || "E-posta gönderilemedi.");
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mb-6">
      <p className="text-sm text-slate-700">
        <span className="font-semibold text-blue-600">Lütfen e-posta adresinizi onaylayın.</span>{" "}
        {status === "sent"
          ? "Onay bağlantısı e-posta adresinize gönderildi."
          : "Gelen kutunuza gönderdiğimiz bağlantıya tıklayarak onaylayabilirsiniz."}
        {errorMsg && <span className="text-red-500"> {errorMsg}</span>}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={status === "sending" || status === "sent"}
        className="text-xs font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
      >
        {status === "sending" ? "Gönderiliyor..." : status === "sent" ? "Gönderildi" : "Tekrar Gönder"}
      </button>
    </div>
  );
}
