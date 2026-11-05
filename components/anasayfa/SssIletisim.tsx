"use client";

import { useState } from "react";
import Script from "next/script";
import { gecikme } from "./SvgTanimlari";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: { getResponse: (id?: number) => string; reset: (id?: number) => void };
  }
}

const SORULAR = [
  {
    q: "Fiyatlandırma nasıl çalışıyor?",
    a: "Aylık mülk başına 75 TL karşılığında tüm özelliklerden yararlanabilirsiniz. Tüm planlar 45 günlük ücretsiz denemeyle gelir.",
  },
  {
    q: "Ücretsiz deneme süresi ne kadar?",
    a: "Kayıt olduğunuz andan itibaren 45 gün boyunca hiçbir ücret ödemeden tüm özellikleri kullanabilirsiniz. Deneme süresi dolduğunda ödeme yapmazsanız hesabınız salt okunur moda geçer, verileriniz silinmez.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Tüm verileriniz SSL şifreleme ile korunur ve düzenli olarak yedeklenir. Kişisel ve finansal bilgileriniz üçüncü taraflarla paylaşılmaz; KVKK kapsamında tam uyumluluk sağlanmaktadır.",
  },
  {
    q: "Raporlama özellikleri nelerdir?",
    a: "Mizan Mülk Yönetimi ile kiracı ödeme durumu, geciken kira listesi, mülk doluluk oranı, aylık/yıllık gelir-gider özeti ve tahsilat performansı gibi yönetim verilerini raporlayabilirsiniz.",
  },
  {
    q: "Profesyonel Mülk Yönetimi hizmeti nedir?",
    a: "Kayıt sırasında bu hizmeti seçerseniz, ekibimiz sizin adınıza mülk ve kiracı yönetiminde destek sağlayabilir. Kiracı takibi, tahsilat hatırlatmaları ve sözleşme süreçlerini sizin yerinize yönetebiliriz.",
  },
  {
    q: "Mobil uygulama var mı?",
    a: "Evet, iOS ve Android uygulamalarımızla mülklerinizi cebinizden de yönetebilirsiniz. Ayrıca web tarayıcısı üzerinden mobil uyumlu arayüzümüzü de kullanabilirsiniz.",
  },
];

export default function SssIletisim() {
  const [form, setForm] = useState({ name: "", phone: "", consent: false });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const recaptchaToken = RECAPTCHA_SITE_KEY ? window.grecaptcha?.getResponse() : "";
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError("Lütfen robot olmadığınızı doğrulayın.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recaptchaToken }),
      });
      if (res.ok) {
        setSent(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
      window.grecaptcha?.reset();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      window.grecaptcha?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sss bolum" id="sss" aria-labelledby="sssBas">
      <div className="kap sss-ic">
        <div>
          <span className="cip belir">Sık Sorulan Sorular</span>
          <h2 className="belir" id="sssBas" style={gecikme(".08s")}>
            En çok sorulan sorular
          </h2>
          <p className="alt belir" style={gecikme(".16s")}>
            Sorularınızın yanıtlarını burada bulabilirsiniz. Daha fazla yardım isterseniz, destek ekibimiz her zaman yanınızdadır.
          </p>
          <div className="sorular">
            {SORULAR.map((s) => (
              <details key={s.q} className="belir">
                <summary>
                  {s.q}
                  <span className="arti" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{s.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div>
          <div className="iletisim-kart belir" style={gecikme(".1s")}>
            <span className="cip koyu">Bize Ulaşın</span>
            <h2 style={{ marginTop: 16 }}>Sizi Arayalım</h2>
            <p className="alt" style={{ margin: "10px 0 0" }}>
              Telefon numaranızı bırakın, en kısa sürede sizi arayalım.
            </p>
            {sent ? (
              <div className="gonderildi" role="status">
                <b>Talebiniz alındı!</b>
                <span>En kısa sürede sizi arayacağız.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="alan">
                  <label htmlFor="iletisimAd">Adınız Soyadınız *</label>
                  <input
                    id="iletisimAd"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Adınız Soyadınız"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="alan">
                  <label htmlFor="iletisimTel">Telefon Numaranız *</label>
                  <div className="tel-sat">
                    <span>🇹🇷 +90</span>
                    <input
                      id="iletisimTel"
                      type="tel"
                      inputMode="tel"
                      required
                      maxLength={20}
                      placeholder="5XX XXX XX XX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <label className="onay">
                  <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                  <span>Mizan Mülk Yönetimi kampanyaları hakkında elektronik ileti almak istiyorum.</span>
                </label>
                {RECAPTCHA_SITE_KEY && (
                  <>
                    <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
                    <div className="g-recaptcha alan" data-sitekey={RECAPTCHA_SITE_KEY} />
                  </>
                )}
                {error && <p className="form-hata">{error}</p>}
                <button type="submit" disabled={loading} className="dugme ana">
                  {loading ? "Gönderiliyor..." : "Teklif Al"}
                </button>
                <p className="kvkk">Kişisel verileriniz, 6698 sayılı KVKK kapsamında bilgi talebinizin değerlendirilmesi amacı ile işlenmektedir.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
