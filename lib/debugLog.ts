const KEY = "mizan_debug_log";
const MAX_ENTRIES = 150;

// GEÇİCİ TANI ARACI — native OAuth/yönlendirme akışını build beklemeden,
// cihazda kalıcı olarak izlemek için. Web Inspector'a erişim olmadığı için
// eklendi, sorun teşhis edilince kaldırılacak.
export function logEvent(msg: string) {
  try {
    const raw = localStorage.getItem(KEY);
    const entries: string[] = raw ? JSON.parse(raw) : [];
    const time = new Date().toISOString().slice(11, 23);
    entries.push(`${time} ${msg}`);
    while (entries.length > MAX_ENTRIES) entries.shift();
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // localStorage yoksa sessizce yok say
  }
}

export function readLog(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearLog() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // yok say
  }
}
