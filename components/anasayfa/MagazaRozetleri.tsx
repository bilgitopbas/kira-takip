import type { CSSProperties } from "react";

// App Store ve Google Play rozetleri: her iki mağazanın resmi Türkçe rozet düzeni,
// siyah zemin. Girişte ve mobil uygulama bölümünde aynı bağlantılara gider.
export default function MagazaRozetleri({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style}>
      <a
        href="https://apps.apple.com/tr/app/mizan-m%C3%BClk-y%C3%B6netimi/id6759964652"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Mizan Mülk Yönetimi'ni App Store'dan indirin"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.94 1.36-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.35-1.26-3.428-2.8-1.287-1.87-2.312-4.78-2.312-7.55 0-4.44 2.892-6.79 5.75-6.79 1.47 0 2.688.95 3.616.95.87 0 2.213-1.01 3.858-1.01.62 0 2.86.06 4.335 2.18-.117.08-2.586 1.52-2.586 4.63 0 3.72 3.288 5.03 3.325 5.05z" />
        </svg>
        <span>
          <span className="s2" style={{ margin: 0 }}>
            App Store&apos;dan
          </span>
          <span className="s1" style={{ marginTop: 3 }}>
            İndirin
          </span>
        </span>
      </a>
      {/* Google Play logosunun renkleri marka kuralları gereği değiştirilemez */}
      <a
        href="https://play.google.com/store/apps/details?id=com.mizanmulkyonetimi.app&hl=tr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Mizan Mülk Yönetimi'ni Google Play'den indirin"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 3.5c-.4.3-.6.8-.6 1.4v14.2c0 .6.2 1.1.6 1.4l.1.06L13.5 12l-8.4-8.56L5 3.5z" fill="#00A0FF" />
          <path d="M13.5 12l3.2 3.2 5.1-2.9c.7-.4.7-1.4 0-1.8l-5.1-2.9L13.5 12z" fill="#FFC900" />
          <path d="M5.1 20.94c.34.24.83.26 1.36-.05l10.24-5.8L13.5 12l-8.4 8.94z" fill="#FF3A44" />
          <path d="M16.7 8.9L6.46 3.1c-.53-.3-1.02-.28-1.36-.05L13.5 12l3.2-3.1z" fill="#00E676" />
        </svg>
        <span>
          <span className="s1" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>
            İndirin
          </span>
          <span className="s2">Google Play</span>
        </span>
      </a>
    </div>
  );
}
