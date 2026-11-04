// Ekip üyesinin oturumu hesap sahibinin userId'sini taşır; hesap silme ucu sahibin tüm
// hesabını siler. Üye bunu yapamaz. Tablo testi: tests/hesapSilmeYetkisi.test.ts
export function hesapSilmeEngeli(session: { memberId?: string }): string | null {
  return session.memberId ? "Hesabı yalnızca hesap sahibi silebilir." : null;
}
