# Mizan Mülk mobil API: uygulama planı

Tarih: 4 Kasım 2026 · Dal: `mobil-api` (`next-16-4` üstünden) · Durum: API ve push yazıldı; canlıya Lider çıkarır.
Kalıp: Topbaş Hukuk (`hukuk-sistemi`, `lib/mobil*.js`, `lib/push*.js`). Sözleşme: `api-sozlesmesi.md`.
Mobilde giriş yalnız e-posta + şifre (kullanıcı kararı, 5 Kas); Google ve Apple girişi yok, web'deki Google girişi aynen kalır.

## Şema önerisi (yalnız ekleme, web etkilenmez)

```prisma
model User {
  // ...
  mobilOturumlar MobilOturum[]
  cihazJetonlari CihazJetonu[]
}

model AccountMember {
  // ...
  mobilOturumlar MobilOturum[]
}

// Cihaz başına tek satır. Üye oturumunda userId sahibindir (web oturumuyla aynı).
model MobilOturum {
  id               String    @id @default(cuid())
  cihazId          String
  yenilemeOzeti    String    @unique
  oncekiOzet       String?
  oncekiGecerlilik DateTime?
  sessionVersion   Int       // Topbaş'taki sifreParmak yerine: web oturumuyla aynı kaynak
  olusturma        DateTime  @default(now())
  sonGorulme       DateTime  @default(now())
  sonKullanma      DateTime

  userId   String
  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  memberId String?
  member   AccountMember? @relation(fields: [memberId], references: [id], onDelete: Cascade)

  cihazJetonlari CihazJetonu[]

  @@unique([userId, cihazId])
  @@index([oncekiOzet])
  @@index([memberId])
  @@index([sonKullanma])
  @@map("mobil_oturumlar")
}

model CihazJetonu {
  id         String   @id @default(cuid())
  platform   String   // ios | android
  jeton      String   @unique
  olusturma  DateTime @default(now())
  sonGorulme DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  mobilOturumId String
  mobilOturum   MobilOturum @relation(fields: [mobilOturumId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([mobilOturumId])
  @@map("cihaz_jetonlari")
}
```

**SQL:** Depoda `prisma/migrations` yok; düzen `prisma/elle-gocler/` (tek işlemde `BEGIN…COMMIT`, ayrı `-geri-al.sql`, `migrate diff` ile üretilir). Görevdeki "elle uygulanabilir tek SQL" bu düzenle karşılanır: `prisma/elle-gocler/2026-11-04-mobil.sql` + `-geri-al.sql`. `prisma/migrations` ayrıca istenirse söyleyin. Canlıya Lider uygular.

## Dosyalar

| Dosya | İş |
|---|---|
| `lib/mobilJeton.ts` | Saf. Erişim JWT (jose, HS256, HKDF ile `SESSION_SECRET`'tan türetilmiş anahtar, `tur: "mobil-erisim"`), yenileme jetonu, özet, `bearerAyikla` |
| `lib/mobilOturum.ts` | `oturumAc`, `oturumYenile`, `oturumKapat`, oturum yanıtı, süresi geçen temizliği |
| `lib/mobilKapi.ts` | `hataYaniti`, `mobilOturumKapisi`, `panelKapisi`, `jsonGovde` (16 KB), `sayfalama` |
| `lib/auth.ts` | `getSession`: Bearer varsa mobil JWT + `oturumHalaGecerli`; yoksa çerez aynen. `createSession`: Bearer isteğinde çerez yazmaz. Çerezli akış değişmez |
| `proxy.ts` | Matcher'a `/api/admin/:path*`: Bearer başlıklı istek 403. Çerezli akış değişmez |
| `lib/mobilBicim.ts`, `lib/mobilPanelModeli.ts` | Saf kurallar (abonelik, yenileme kararı, sayfalama; birim süzme, `besYil`, harita) |
| `lib/mobilPanel.ts` | Panel okuma sorguları, dar `select`, para sayıya çevrilir |
| `lib/hesapSilme.ts` | Sahip hesabının tüm verisi tek işlemde; dosyalar diskten |
| `app/api/mobil/**` | giris, yenile, cikis, cihaz, sozlesme-onay, hesap-sil, panel/* |
| `lib/pushBicim.ts`, `lib/push.ts` | Topbaş portu; `PUSH_ACIK`, `APNS_*`, `FCM_*` adları aynı |
| `lib/pushHedef.ts` | `hesapPushHedefleri` kalkar; hedef `CihazJetonu.userId` |
| `lib/notifications.ts`, `denemeHatirlatma.ts`, `adminNotifications.ts`, `admin/announcements` | Kendi push'a bağlanır, cihazı olmayan sessiz geçer |
| `tests/` | `mobilJeton`, `mobilBicim`, `mobilPanelModeli`, `pushBicim` (APNs döngüsü dahil) |

## Topbaş'tan bilerek farklı

- **`sessionVersion`, `sifreParmak` yerine:** web oturumuyla aynı kaynak; şifre değişimi ve sıfırlama bunu zaten artırıyor.
- **Erişim jetonu her istekte DB'ye bakar** (`oturumHalaGecerli`, mevcut `getSession` akışı): şifre değişimi ve üye çıkarma 5 dk değil **anında** etkili. İstek başına 1–2 PK okuma, web çerezinde de aynı.
- **Hand-rolled HMAC yok:** repo zaten `jose` kullanıyor.
- **Push gönderiminde oturum süzgeci:** Topbaş gönderimde yalnız oturum süresine bakıyor; şifre değişse de jeton, istemci yenileme deneyene kadar push alır. Burada `sessionVersion` da denetlenir, uyuşmayan silinir. Çalınan telefon, şifre değişince bildirim almaz.
- **Üye oturumu `AccountMember`'a FK Cascade:** üye çıkarılınca jetonlar da anında gider. Bu yüzden üyeye yenilemede `SIFRE_DEGISTI` değil `GECERSIZ` döner (satır yok); istemci için fark yok (giriş ekranı).
- **APNs oturumu çağrılar arası paylaşılır:** cron bildirimleri tek tek yollar (`createIfMissing`). Topbaş'ta oturum toplu gönderim başına açılıyordu; 10 bin kullanıcıda bildirim başına yeni bağlantı Apple'ın "connection flood" sınırına girer. Boşta 60 sn sonra kapanır.

## OneSignal sökümü

- **Silinir:** `lib/onesignal.ts`, `components/OneSignalBridge.tsx`, `DashboardShell`/`AdminShell`/`dashboard/layout` bağları (`pushId`), `onesignal-cordova-plugin`, `android/app/capacitor.build.gradle` ve `ios/App/CapApp-SPM/Package.swift` kayıtları, `config.xml` ve `cordova_plugins.js` kalıntıları, env adı referansları. Gizlilik metinlerinde OneSignal geçmiyor (arandı).
- **AYRI COMMIT (önceki commit'te OneSignal ve kendi push birlikte çalışır).** Eski Capacitor uygulaması `server.url` ile canlı siteyi yüklüyor. Söküm canlıya, yeni uygulama mağazaya çıkmadan giderse eski uygulamadakiler push'u kaybeder ve kendi push'umuz da onlara ulaşamaz (cihaz jetonu yok). Hangi sürümde canlıya gideceği Lider kararı.
- Web push yok (kullanıcı kararı); panel içi liste kalır.

## Adımlar

1. Şema + `elle-gocler` SQL, Prisma üretimi.
2. `mobilJeton`, `mobilOturum`, `mobilKapi` + testler.
3. `lib/auth.ts` Bearer + `proxy.ts`; web giriş/çıkış dokunulmadan test.
4. Kimlik uçları, `cihaz`, `sozlesme-onay`, `hesap-sil`.
5. Panel uçları.
6. `push.ts`, `pushBicim.ts`, çağrı noktaları (`PUSH_ACIK` kapalıyken sessiz).
7. OneSignal sökümü (ayrı commit).
8. `npm test`, `npx tsc --noEmit`; alt ajanla diff incelemesi; ≤10 satır rapor.

## Canlıya geçiş öncesi Lider/kullanıcı işleri

- SQL uygulaması; env: `APNS_KEY_B64`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `FCM_SERVICE_ACCOUNT_B64`, `PUSH_ACIK`, isteğe bağlı `GUVENILEN_PROXY` (varsayılan 1), `APNS_ORTAM`.
- iOS bundle id doğrulaması (`MizanMulk` görünüyor; ASC ile eşleşmeli), Firebase projesi.
- Sunucuda: nginx `x-forwarded-for`'u eziyor mu; `next-16-4` canlı dal mı.
