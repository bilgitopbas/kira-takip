"use client";

// Türkçe biçimli para girişi: kullanıcı yazarken "100.000,00" olarak görünür,
// dışarıya ise her zaman ham sayı dizesi ("100000.00") verilir — böylece
// mevcut Number(...) çağrıları ve API'ler olduğu gibi çalışmaya devam eder.
//
// type="number" kullanılamaz: tarayıcı o modda binlik ayracı göstermez ve
// virgüllü girişi reddeder. Bu yüzden type="text" + inputMode="decimal"
// (mobilde sayı klavyesi açılır).

// "100000.5" -> "100.000,5" | "100000." -> "100.000," | "" -> ""
export function formatCurrency(raw: string): string {
  if (raw === "") return "";
  const [intPart, decPart] = raw.split(".");
  const intFormatted = Number(intPart || "0").toLocaleString("tr-TR");
  return decPart === undefined ? intFormatted : `${intFormatted},${decPart}`;
}

// "100.000,50" -> "100000.50" (rakam ve tek virgül dışındaki her şey atılır,
// ondalık en fazla 2 hane)
export function parseCurrency(display: string): string {
  let temiz = display.replace(/[^\d,]/g, "");
  const ilkVirgul = temiz.indexOf(",");
  if (ilkVirgul !== -1) {
    temiz = temiz.slice(0, ilkVirgul + 1) + temiz.slice(ilkVirgul + 1).replace(/,/g, "");
  }
  const [tamKisim, ondalik] = temiz.split(",");
  if (ondalik === undefined) return tamKisim;
  // Boş alana doğrudan virgül yazılırsa "." gibi geçersiz bir sayı oluşmasın
  return `${tamKisim || "0"}.${ondalik.slice(0, 2)}`;
}

export default function CurrencyInput({
  value,
  onChange,
  className = "",
  wrapperClassName = "",
  placeholder,
  required,
  disabled,
  // Para birimi seçicisi olan alanlarda (örn. Depozito) boş bırakılır.
  suffix = "₺",
}: {
  value: string;
  onChange: (raw: string) => void;
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        type="text"
        inputMode="decimal"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={formatCurrency(value)}
        onChange={(e) => onChange(parseCurrency(e.target.value))}
        className={`${suffix ? "pr-9" : ""} ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
