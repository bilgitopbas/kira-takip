# Mizan Mülk Mobil API Sözleşmesi

Dal: `mobil-api` · Sürüm: 4 Kasım 2026 · Durum: **taslak, Lider kapısında** · Okuyan: Expo ajanı (`mizan-mobil` deposu)

- **A. Yeni uçlar** (`/api/mobil/*`): bu belge onaylanınca yazılacak; henüz yok.
- **B. Mevcut uçlar** (`/api/dashboard/*`, `/api/auth/*`): gerçek koddan çıkarıldı (`065b26f`). Yeniden yazılmaz; `lib/auth.ts` Bearer öğrenince olduğu gibi çalışır.

Kod ile belge çelişirse kod doğrudur; bildir.

## Temel kurallar

- **Taban adres:** `https://mizanmulkyonetimi.com`. Yollar köke görelidir.
- **Kimlik:** `Authorization: Bearer <erisimJetonu>`. Bearer başlığı varsa çerez yok sayılır: geçersiz Bearer 401'dir, çereze düşmez. CORS gerekmez (yerel uygulama).
- **Alan adları:** kayıt alanları veritabanındaki gibi İngilizce (`fullName`, `monthlyRent`; web tipleriyle aynı), sarmalayıcılar ve hesaplı alanlar Türkçe.
- **Tarih:** ISO 8601 metin. `yyyy-mm-dd` biçimli alanlar yorumda belirtilir (`PanelKiracisi`, `BugunSatiri`).
- **Para:** A bölümünde **sayı** (TL). B bölümünde Prisma `Decimal` alanları JSON'da **metin** gelir (`"1250.50"`): `Number()` ile çevir.
- **Hata gövdesi:**
  - A bölümü: `{ "hata": "Gösterilebilir Türkçe mesaj", "kod": "MAKINE_KODU" }`
  - B bölümü: `{ "error": "Gösterilebilir Türkçe mesaj" }`, `kod` yok.
  - İstemci `hata ?? error` okur. Akış kararı durum kodundan, ayrım `kod`dan.
- **Önbellek:** A bölümü yanıtları `Cache-Control: private, no-store`.
- **Gövde sınırı:** A bölümü JSON gövdesi en çok 16 KB; aşan 413 `GOVDE_BUYUK`. Bozuk JSON boş gövde sayılır (400 `EKSIK_ALAN`).
- **Durum kodları:**

| Kod | Anlam | İstemci ne yapar |
|---|---|---|
| 401 | Erişim jetonu yok, geçersiz, süresi dolmuş ya da oturum düşmüş | Bir kez `/api/mobil/yenile`, isteği tekrarla; o da 401 ise giriş ekranı |
| 403 | Yazma kapısı (kilit/onaysız e-posta) ya da sözleşme onayı | Yenileme YAPMA; mesajı göster, `kod`a göre ekran |
| 404 | Yok ya da başka hesabın kaydı (bilerek ayrılmaz) | "Bulunamadı" |
| 409 | Çakışma | Mesajı göster |
| 413 | Gövde çok büyük | Mesajı göster |
| 429 | Hız sınırı | Mesajı göster, bekle |
| 500 | Sunucu hatası | Mesajı göster, tekrar dene |
| 502/503 | Dış servis ya da yapılandırma eksik | Mesajı göster |

- **Sayfalı liste** (`?sayfa=1&adet=20`, `adet` en çok 100):
  ```json
  { "kayitlar": [], "sayfa": 1, "adet": 20, "toplam": 0, "sonrakiVar": false }
  ```

## Hesap modeli ve yetki

Web'in kuralı aynen geçerlidir; mobil hiçbir ek erişim açmaz.

- **Oturum kimliği:** sahip de ekip üyesi de sahibin `userId`'siyle çalışır. Üye oturumunda ayrıca `memberId` taşınır.
- **Veri süzgeci:** her sorgu `ownerId = session.userId` ile süzülür: `Property.ownerId`, `tenant.property.ownerId`, `Building.ownerId`, `CityLayout.ownerId`, `Notification.userId`. Başka hesabın kaydı 404.
- **Kiracı girişi yoktur.**

| İşlem | Sahip (`SAHIP`) | Üye (`UYE`) | Admin (`ADMIN`) |
|---|---|---|---|
| Tüm panel okumaları | ✓ | ✓ (sahiple aynı veri) | ✓ (kendi hesabının verisi) |
| Tüm yazmalar (mülk, kiracı, borç, tahsilat, masraf, not, bina, ekip, profil) | ✓ | ✓ (web'deki gibi kısıt yok) | ✓ |
| Şifre değiştirme | ✓ | ✗ 403 | ✓ |
| Hesabı silme (`/api/mobil/hesap-sil`) | Tüm hesap | Yalnız kendi üyeliği | ✗ 403 |
| Bildirimler | ✓ | ✓ (sahibin listesi; okundu bilgisi ortak) | ✓ |
| `/api/admin/*` | Yok | Yok | v1'de Bearer kabul etmez, web'den (Açık nokta 3) |

**Yazma kapısı (`requireWriteAccess`):** yazma uçlarının çoğu buradan geçer; geçmezse 403 `{error}`. Kural, sahibin hesabına göre:
- `LOCKED` (deneme + 7 gün ek süre bitti ya da `PASSIVE`): yazma kapalı, okuma açık.
- `TRIAL`: serbest.
- `GRACE` / `ACTIVE`: e-posta onaylı değilse yazma kapalı.

İstemci bunu önceden `abonelik.yazmaKapali` ile bilir.

**Üye için arayüz önerisi:** Web üyeyi sunucuda kısıtlamaz. Expo üyeye Ekip, e-posta değiştirme ve şifre ekranlarını göstermez; "Hesabı sil" üyede yalnız üyeliği siler.

## Oturum akışı

1. `POST /api/mobil/giris` (ya da `giris-google`, `giris-apple`) → jetonları expo-secure-store'a yaz. `cihazId`'yi ilk yanıttan sakla, sonraki girişlerde gönder.
2. `sozlesmeGerekli: true` ise önce onay ekranı → `POST /api/mobil/sozlesme-onay`. Onaysız oturuma `/api/mobil/panel/*` 403 `SOZLESME_ONAYI_GEREK` döner.
3. Erişim jetonu **5 dk**. `erisimBitis` geçmeden ya da 401 alınca `POST /api/mobil/yenile`.
4. **Yenileme tek seferde bir istek olmalı (single-flight):** her yenileme yenileme jetonunu da değiştirir. Yanıt yolda kaybolursa eski jeton 60 sn daha çalışır; süre geçince eski jetonun gelmesi çalınma sayılır (`CALINMA_SUPHESI`) ve oturum silinir. Yeni jetonu hemen yaz.
5. **Şifre değişimi / sıfırlama:** `User.sessionVersion` artar. Sahip ve tüm üyelerin tüm cihazlarındaki oturumlar **anında** düşer: erişim jetonu bir sonraki istekte 401, yenileme `SIFRE_DEGISTI`. Şifreyi bu cihazda değiştiren istemci yeni şifreyle `giris` çağırır.
6. **Üye hesaptan çıkarılınca:** oturum satırı ve push jetonları silinir (veritabanı Cascade). Erişim jetonu anında 401, yenileme `GECERSIZ`. İstemci için `SIFRE_DEGISTI` ile aynı: giriş ekranı.
7. **Çıkış:** önce `POST /api/mobil/cikis`, sonra yereli temizle. Açık erişim jetonu çıkıştan sonra en çok 5 dk geçerli kalır, istemci onu zaten siler.
8. **Cihaz jetonu:** girişten sonra, her açılışta ve jeton değişince `POST /api/mobil/cihaz`.

---

# A. Yeni uçlar

## Kimlik

Üç giriş ucu da aynı **oturum yanıtını** döner:

```json
{
  "erisimJetonu": "…", "erisimBitis": "ISO",
  "yenilemeJetonu": "…", "yenilemeBitis": "ISO",
  "cihazId": "…",
  "kullanici": {
    "id": "sahibin userId'si (üyede de)",
    "ad": "Tam ad (soyad ayrı alan değil)",
    "email": "giriş e-postası",
    "tur": "SAHIP|UYE|ADMIN",
    "memberId": "yalnız UYE'de",
    "hesapAdi": "sahibin adı"
  },
  "abonelik": {
    "durum": "TRIAL|ACTIVE|PASSIVE|DANISMAN",
    "erisim": "TRIAL|GRACE|ACTIVE|LOCKED",
    "denemeBitis": "ISO",
    "ekSureBitis": "ISO",
    "denemeKalanGun": 0,
    "ekSureKalanGun": 0,
    "kilitli": false,
    "yazmaKapali": false,
    "yazmaKapaliSebep": "KILITLI|EPOSTA_ONAYSIZ|null"
  },
  "emailOnayli": true,
  "profilEksik": false,
  "sozlesmeGerekli": false,
  "yeniHesap": false
}
```

- `abonelik`, `emailOnayli`, `profilEksik` **sahibin** kaydından gelir (üyede de).
- `profilEksik`: sahibin `city` alanı boş; web `/dashboard/profili-tamamla` uyarısının karşılığı. Doldurma: `PATCH /api/dashboard/profile`.
- `sozlesmeGerekli`: sahipte `termsAcceptedAt` ya da `marketingConsentAt` boş. Üye ve adminde her zaman `false`.
- `yeniHesap`: yalnız Google/Apple ile bu istekte açıldıysa `true`.
- `kilitli` / ödeme: **uygulama içinde fiyat, havale ya da satın alma bağlantısı gösterilmez** (App Store 3.1.1; mevcut kabukta da `MizanProView` böyle). Nötr mesaj + web adresi metni yeterli.

### POST /api/mobil/giris
- **Yetki:** açık. Hız sınırı IP başına 15 dk'da 10.
- **İstek:** `{ email: string, sifre: string, cihazId?: string (en çok 128) }`. `cihazId` yoksa sunucu üretir. İstemci e-postayı kırpar, otomatik büyük harfi kapatır.
- **Sıra (web `auth/login` ile aynı):** önce `User.email`, yoksa `AccountMember.email`.
- **Yanıt 200:** oturum yanıtı.
- **Hatalar:**
  - 400 `EKSIK_ALAN`
  - 401 `GECERSIZ`: hesap yok, şifre yanlış, hesap şifresiz (yalnız Google/Apple) ve daveti kabul edilmemiş üye **aynı yanıtı** verir. Mesaj: "E-posta veya şifre hatalı. Hesabınızı Google ya da Apple ile açtıysanız o düğmeyi kullanın."
  - 429 `RATE_LIMIT`
- **Not:** Web bu durumları ayrı mesajla söylüyor; mobilde hesap varlığı sızdırılmaz.

### POST /api/mobil/giris-google
- **Yetki:** açık. Giriş sayacıyla ortak: IP başına 15 dk'da 10.
- **İstek:** `{ idToken: string (en çok 4096), cihazId?: string }`. Yerel Google Sign-In'in `idToken`'ı. `webClientId` olarak web istemci kimliğini ver (Açık nokta 5).
- **Doğrulama:** Google JWKS ile imza; `iss` = `accounts.google.com` ya da `https://accounts.google.com`; `exp`; `aud` ∈ {`GOOGLE_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`}; `email_verified` = true.
- **Hesap eşleme (`auth/google/callback` ile aynı):**
  1. `User.googleId = sub` → giriş.
  2. Yoksa `User.email = email` → `googleId` yazılır, `emailVerifiedAt` boşsa şimdi; giriş.
  3. Yoksa yeni `User`: `fullName = name || email`, `role = CUSTOMER`, `subscriptionStatus = TRIAL`, 45 gün deneme, `emailVerifiedAt = şimdi`. Hoş geldin e-postası + admin bildirimi. `yeniHesap: true`, `sozlesmeGerekli: true`.
- **Hatalar:**
  - 400 `EKSIK_ALAN`
  - 401 `GECERSIZ_JETON`
  - 403 `EPOSTA_ONAYSIZ`
  - 409 `UYE_HESABI`: bu e-posta bir ekip üyeliğine ait; "E-posta ve şifrenizle giriş yapın." (Açık nokta 2)
  - 429 `RATE_LIMIT`
  - 503 `YAPILANDIRILMAMIS`

### POST /api/mobil/giris-apple
- **Yetki:** açık. Giriş sayacıyla ortak. Yalnız iOS düğmesi.
- **İstek:**
  ```json
  { "identityToken": "…", "nonce": "ham nonce", "adSoyad": "yalnız ilk girişte", "cihazId": "…" }
  ```
- **Nonce:** istemci rastgele `ham` üretir, Apple isteğine `SHA256(ham)` (küçük harf hex) verir, sunucuya `ham` gönderir. `nonce` zorunlu.
- **Doğrulama:** `https://appleid.apple.com/auth/keys` JWKS ile imza; `iss` = `https://appleid.apple.com`; `aud` = `APPLE_BUNDLE_ID`; `exp`; `claim.nonce === SHA256(ham)`.
- **Hesap eşleme:** Apple e-postayı yalnız ilk girişte verir, kullanıcı eşlemesi `sub` ile yapılır (yeni alan `User.appleSub`, plan.md):
  1. `User.appleSub = sub` → giriş.
  2. Yoksa jetonda e-posta var ve `email_verified` true: `User.email = email` → `appleSub` yazılır, `emailVerifiedAt` boşsa şimdi; giriş.
  3. Yoksa ve e-posta varsa: yeni `User` (Google'daki gibi). `fullName = adSoyad || email`. Gizli aktarma adresi (`@privaterelay.appleid.com`) olduğu gibi saklanır.
  4. Yoksa ve e-posta yoksa: 400 `EPOSTA_YOK` ("Ayarlar > Apple Kimliği > Apple ile Giriş'ten Mizan'ı kaldırıp tekrar deneyin.").
- **Hatalar:** Google'daki gibi + `EPOSTA_YOK`. `GECERSIZ_JETON` nonce uyuşmazlığını da kapsar.

### POST /api/mobil/yenile
- **Yetki:** yenileme jetonunun kendisi. Hız sınırı IP başına 15 dk'da 120.
- **İstek:** `{ yenilemeJetonu: string (en çok 512) }`
- **Yanıt 200:** oturum yanıtı (yeni jeton çifti, güncel kullanıcı ve abonelik). 60 gün baştan başlar. `yeniHesap` hep `false`.
- **Hatalar (hepsi 401, hepsinde giriş ekranı):** `GECERSIZ` · `SURESI_DOLDU` · `SIFRE_DEGISTI` · `CALINMA_SUPHESI`. 429 `RATE_LIMIT`.
- **Sunucu:** erişim jetonu HS256, 5 dk; anahtar `SESSION_SECRET`'tan HKDF ile türetilir (web çerezi ile birbirinin yerine geçmez). Yenileme jetonu rastgele 256 bit; veritabanında yalnız SHA-256 özeti durur.

### POST /api/mobil/cikis
- **Yetki:** yenileme jetonunun kendisi (erişim jetonu bitmiş olabilir).
- **İstek:** `{ yenilemeJetonu: string, cihazJetonu?: string }`. Bu oturuma bağlı push kaydı kendiliğinden silinir.
- **Yanıt 200:** `{ mesaj }`. Jeton geçersizse de 200.

### POST /api/mobil/cihaz
- **Yetki:** mobil oturum (Bearer). Çerezli web oturumu 401. Hız sınırı IP başına 15 dk'da 60.
- **İstek:** `{ platform: "ios"|"android", jeton: string (en çok 1024) }`. Yerel APNs/FCM jetonu (`getDevicePushTokenAsync`), **Expo push jetonu DEĞİL**.
- **Yanıt 200:** `{ mesaj }`. Aynı jeton başka hesaptaysa bu hesaba geçer.
- **Kural:** jeton erişim jetonundaki oturuma bağlanır. Oturum düşünce (şifre değişimi, üye çıkarılması, süre, çalınma şüphesi, çıkış) push kaydı da gider. Yeniden girişten sonra tekrar kaydet.
- **Hatalar:** 400 `GECERSIZ_PLATFORM` · 400 `GECERSIZ_JETON` · 401 `OTURUM_YOK` · 429 `RATE_LIMIT`.

### DELETE /api/mobil/cihaz
- **İstek:** gövdeli DELETE `{ jeton: string }`. Yalnız kendi hesabının jetonu silinir; yoksa da 200.

### POST /api/mobil/sozlesme-onay
- **Yetki:** mobil oturum; yalnız `SAHIP` (üye/admin için etkisiz 200).
- **İstek:** gövde yok. **Yanıt 200:** `{ mesaj }`. `termsAcceptedAt` ve `marketingConsentAt` şimdiye yazılır (doluysa korunur).
- **Metinler:** web sayfaları `/kullanim-kosullari`, `/aydinlatma-metni`, `/acik-riza-metni`, `/gizlilik-politikasi`.

### POST /api/mobil/hesap-sil
Apple 5.1.1(v) ve Play hesap silme kuralı için. **Geri alınamaz; onay ekranı şart.**
- **Yetki:** mobil oturum. Hız sınırı oturum başına 15 dk'da 5.
- **İstek:** `{ onayMetni: "hesabımı sil", authorizationCode?: string }`. `onayMetni` tr-TR küçültmeyle karşılaştırılır. `authorizationCode`: Apple hesabında taze Apple girişinden gelir, jeton iptali için (Açık nokta 6).
- **Etki:**
  - `SAHIP`: mülk, kiracı, borç, tahsilat, masraf, not, bina, düzen, bildirim, destek, ödeme bildirimi, abonelik, ekip üyeleri, oturum, cihaz jetonları ve hesap silinir; yüklenen sözleşme/makbuz dosyaları diskten silinir.
  - `UYE`: yalnız kendi `AccountMember` kaydı, oturumları ve jetonları. Sahibin verisine dokunulmaz.
  - `ADMIN`: 403 `YETKISIZ`.
- **Yanıt 200:** `{ mesaj }`. Sonra yereli temizle, giriş ekranına dön.
- **Hatalar:** 400 `ONAY_GEREKLI` · 401 · 403 `YETKISIZ` · 429 · 500.
- **Not:** `DELETE /api/dashboard/profile/delete-account` mobilde **kullanılmaz** (Açık nokta 1).

## Panel (`/api/mobil/panel/*`)

- **Yetki hepsinde:** mobil oturum + `sozlesmeGerekli` değil; süzgeç `ownerId = session.userId`. Yalnız okuma. Kilitli hesap da okur.
- **Hatalar:** 401 · 403 `SOZLESME_ONAYI_GEREK` · 404 `BULUNAMADI` (detaylarda).
- **`YENI_PANEL` bayrağına bağlı değildir** (web'in `binalar` / `sehir-duzeni` yazma uçları bağlıdır).
- **Sunucu tarafı aynı işlevler:** `panelOzetiGetir`, `panelBirimleriGetir`, `binalariKur`, `binaKonumlari`; web ile aynı rakam.

**Ortak şekiller** (`lib/yeniPanelTipleri.ts`, `lib/yeniPanelBina.ts`):

- `…Birim` = `PanelBirimi`:
  ```json
  {
    "id": "", "title": "", "address": "", "city": null, "district": null, "propertyType": "KONUT",
    "isOccupied": true, "il": "Konya",
    "bina": { "anahtar": "", "ad": "", "blok": null, "birimNo": null, "guven": "yuksek|dusuk", "kaynak": "baslik|adres|yok|kayit", "binaId": null, "gorunum": null, "konum": { "lat": 0, "lng": 0, "dogrulandi": false } },
    "kiraci": { "id": "", "fullName": "", "monthlyRent": 0, "contractStart": "yyyy-mm-dd", "rating": null, "rentPaymentDate": "yyyy-mm-dd", "toplamBorc": 0 },
    "oturanKiraciSayisi": 1, "durum": "odendi|bekliyor|gecikmis|bos",
    "kiraGirilmemis": false, "borcKaydiYok": false, "gecikmisBorc": 0, "gecikmeGun": 0, "buAyVade": "yyyy-mm-dd"
  }
  ```
  `bina.konum` ve `kiraci` null olabilir. Veri azaltma: kiracının TC, telefon, e-posta ve adresi bu şekilde yoktur.
- `…Bina` = `Bina`:
  ```json
  {
    "anahtar": "", "ad": "", "il": null, "ilce": null, "adres": "", "tip": null,
    "bloklar": [ { "ad": "A", "birimler": ["…Birim"] } ],
    "bloksuz": ["…Birim"], "birimler": ["…Birim"],
    "kontrolGerekli": false, "binaId": null, "gorunum": null, "konum": null, "tekBirim": true
  }
  ```
- `…Ozet` = `Ozet`: `{ n, sayac: {odendi, bekliyor, gecikmis, bos}, dolu, aylikKira, gecikmisBorc, enKotu, borcKaydiYok }`
- `…BugunSatiri`: `{ birimId, tenantId, tenantName, propertyTitle, tarih: "yyyy-mm-dd", tutar? }`

### GET /api/mobil/panel/ozet
```json
{
  "ozet": {
    "mulkSayisi": 0, "doluSayisi": 0, "bosSayisi": 0, "kiraciSayisi": 0,
    "buAyTahsilat": 0, "buYilTahsilat": 0, "tahsilatOrani": null, "buAyBeklenen": 0, "mulkBuYil": 0,
    "seriler": { "mulk": [], "kiraci": [], "tahsilat": [], "gelir": [] },
    "gecikmisSayisi": 0, "gecikmisTutar": 0,
    "gecikenler": [ { "id": "", "tenantId": "", "tenantName": "", "propertyTitle": "", "year": 0, "month": 0, "remaining": 0 } ],
    "mulkTipleri": [ { "label": "", "value": 0 } ],
    "iller": [ { "il": "", "mulkSayisi": 0 } ],
    "ilsizMulkSayisi": 0
  },
  "bugun": {
    "vadesiGelenler": ["…BugunSatiri"],
    "sozlesmeYenilemeleri": ["…BugunSatiri"],
    "kiraArtislari": ["…BugunSatiri"],
    "besYil": ["…BugunSatiri"]
  },
  "abonelik": "…(oturum yanıtındaki gibi)",
  "okunmamisBildirim": 0
}
```
**Bugün listesi kuralları:**
- `ozet.gecikenler`: vadesi geçmiş, ödenmemiş borçlar (Gecikme sekmesi).
- `vadesiGelenler`: ödenmemiş, vadesi 0–14 gün içinde.
- `sozlesmeYenilemeleri`: `contractEnd` 0–60 gün içinde.
- `kiraArtislari`: `rentRevisionDate` yıl dönümü 0–45 gün içinde.
- `besYil` **(yeni, web'de sekmesi yok)**: `contractStart + 5 yıl`, −30…+90 gün aralığında. Bildirim kuralıyla aynı tarih (`getFiveYearDate`).
- Hepsi yalnız oturan (`LIVING`) kiracılar; `tarih`e göre artan. Mobil yeniden hesaplamaz.
- `seriler.mulk|kiraci|tahsilat`: son 8 ay; `seriler.gelir`: yıl içi birikimli.

### GET /api/mobil/panel/mulkler
Sorgu: `q` (başlık, adres, kiracı adı), `il`, `durum` (`odendi|bekliyor|gecikmis|bos`), `tip` (`PropertyType`), `siralama` (`no|gec|kira`, varsayılan `no`), `sayfa`, `adet`.
Sayfalı; kayıt: `…Birim`. Ek alan: `sayac: {odendi, bekliyor, gecikmis, bos}` (süzgeçten önce).

### GET /api/mobil/panel/mulkler/:id
Başkasının mülkü 404.
```json
{
  "id": "", "title": "", "address": "", "city": null, "district": null, "squareMeters": null,
  "propertyType": null, "notes": null, "isOccupied": false, "buildingId": null, "block": null, "unitNo": null,
  "createdAt": "",
  "birim": "…Birim",
  "kiracilar": [
    { "id": "", "fullName": "", "occupancyStatus": "LIVING|VACATED", "birincil": true, "monthlyRent": null, "contractStart": null, "contractEnd": null, "rating": null, "toplamBorc": 0 }
  ],
  "masraflar": {
    "toplam": 0,
    "son": [ { "id": "", "description": "", "amount": 0, "date": "", "notes": null, "tenantId": null, "tenantName": null } ]
  }
}
```
`kiracilar`: birincil + bağlı (`TenantProperty`) kiracılar, tekrarsız. `masraflar.son`: en yeni 10; tamamı `panel/masraflar?propertyId=`.

### GET /api/mobil/panel/binalar?il=
Binalarım gruplaması. `il` yoksa tüm iller.
```json
{
  "binalar": [ { "…Bina": "", "ozet": "…Ozet" } ],
  "toplamOzet": "…Ozet",
  "iller": [ { "il": "", "mulkSayisi": 0 } ],
  "ilsizMulkSayisi": 0
}
```
Sıralama ada göre (`tr`). Eşleme kaydı için B bölümü `binalar`.

### GET /api/mobil/panel/harita?il=
Konum haritası. Web'deki `binaKonumlari` + bina adları. Kümeleme (`kumele`, `haritaSeviyesi`) istemcidedir.
```json
{
  "konumlar": [
    { "anahtar": "", "ad": "", "binaId": null, "nokta": [32.48, 37.87], "kaynak": "ilce|il|kayit", "dogrulanmadi": true, "il": "", "ilce": null, "ozet": "…Ozet" }
  ],
  "konumsuz": [ { "anahtar": "", "ad": "", "il": null, "binaId": null } ]
}
```
- `nokta` = **[boylam, enlem]** (MapLibre sırası).
- `kaynak: "kayit"` kayıtlı koordinat; `ilce` / `il` merkezden türetilmiş ve halka biçiminde yayılmıştır. `dogrulanmadi: true` ise pini "yaklaşık" göster.
- Pin taşıma: B bölümü `binalar/:id/konum` (yalnız `binaId` dolu binada).

### GET /api/mobil/panel/sehir?il=
3D Mülk Şehrim verisi. `binalar`, `sehirBinasi(bina)`'nın (`lib/sehir3dModeli.ts`) doğrudan girdisidir; web `binalariKur(ilBirimleri)` ile aynı şekli üretir.
```json
{
  "il": "*",
  "binalar": ["…Bina"],
  "duzen": { "binaAnahtari": [0, 0] }
}
```
- `il` yoksa ya da boşsa düzen anahtarı `*` (tüm iller).
- `duzen`: `yerlesimCoz(anahtarlar, duzen)` girdisi; kayıt yoksa `null`. Yazma: B bölümü `sehir-duzeni`.
- Bina birim seçimi: `kuleler[].izgara` hücre `id` = `…Birim.id` → `panel/mulkler/:id`.
- **Yanıt büyük olabilir** (`birimler`, `bloklar`, `bloksuz` aynı birimleri tekrarlar): açılışta bir kez çek, gzip var.

### GET /api/mobil/panel/kiracilar
Sorgu: `q` (ad), `propertyId` (birincil ya da bağlı mülk), `il`, `oturma` (`LIVING|VACATED`), `siralama` (`newest|rent_asc|rent_desc|contract_asc|contract_desc`), `sayfa`, `adet`.
Sayfalı; kayıt:
```json
{
  "id": "", "fullName": "", "monthlyRent": null, "contractStart": null, "contractEnd": null, "rating": null,
  "rentPaymentDate": null, "occupancyStatus": "LIVING", "toplamBorc": 0,
  "mulk": { "id": "", "title": "" },
  "digerMulkler": [ { "id": "", "title": "" } ]
}
```
`toplamBorc`: kiracı detayındaki "Toplam Fark Borç" ile aynı (`lib/kiraciBorcu.ts`). Artı borçlu, eksi fazla ödeme, 0 fark yok.

### GET /api/mobil/panel/kiracilar/:id
Başkasının kiracısı 404. Sözleşme bu yanıttadır.
```json
{
  "id": "", "fullName": "", "phone": null, "email": null, "tenantType": null, "nationalId": null, "taxNumber": null,
  "notificationAddress": null, "notes": null, "rating": null, "occupancyStatus": "LIVING", "createdAt": "",
  "mulk": { "id": "", "title": "", "address": "", "city": null },
  "digerMulkler": [ { "id": "", "title": "" } ],
  "sozlesme": {
    "monthlyRent": null, "contractStart": null, "contractEnd": null, "contractDurationMonths": null,
    "rentRevisionDate": null, "rentPaymentDate": null, "paymentFrequency": null, "increaseType": null,
    "increaseRate": null, "depositAmount": null, "depositCurrency": null, "contractNotes": null,
    "besYilTarihi": null,
    "dosya": { "ad": "Sözleşme.pdf", "yol": "/api/dashboard/tenants/:id/contract" }
  },
  "toplamBorc": 0,
  "borclar": [
    {
      "id": "", "year": 0, "month": 0, "amount": 0, "dueDate": "", "periodMonths": 1, "billingGroupId": null,
      "durum": "PAID|PARTIAL|UNPAID|PENDING", "odenen": 0, "kalan": 0,
      "tahsilatlar": [ { "id": "", "amount": 0, "paidAt": "", "method": null, "notes": null, "hasReceipt": false } ]
    }
  ],
  "masraflar": [ { "id": "", "description": "", "amount": 0, "date": "", "notes": null } ],
  "notlar": [ { "id": "", "content": "", "authorEmail": "", "authorName": null, "createdAt": "" } ]
}
```
- `borclar`: `dueDate` artan. `durum` web'deki etkin durumdur (`getEffectiveDebtStatus`); istemcide yeniden hesaplama.
- `sozlesme.dosya` yoksa `null`. İndirme `yol` ile, Bearer şart (Dosyalar bölümü).
- Dönem işlemleri (`bulk-*`) `billingGroupId`'ye göre gruplanır; eski kayıtlarda boş olabilir, web 12'şerli gruplar.

### GET /api/mobil/panel/tahsilatlar
Sorgu: `bas`, `bit` (`paidAt`; `bas` dahil, `bit` hariç, ISO), `tenantId`, `q` (kiracı adı), `sayfa`, `adet`.
Sayfalı, `paidAt` azalan; kayıt:
```json
{ "id": "", "amount": 0, "paidAt": "", "method": null, "notes": null, "hasReceipt": false, "tenantId": "", "tenantName": "", "propertyTitle": "", "debtId": null, "donem": { "year": 0, "month": 0 } }
```
Ek alan: `toplamTutar` (süzgece göre, sayfadan bağımsız). `donem` borçsuz tahsilatta `null`.

### GET /api/mobil/panel/masraflar
Sorgu: `bas`, `bit` (`date`), `propertyId`, `tenantId`, `sayfa`, `adet`.
Sayfalı, `date` azalan; kayıt:
```json
{ "id": "", "description": "", "amount": 0, "date": "", "notes": null, "propertyId": "", "propertyTitle": "", "tenantId": null, "tenantName": null }
```
Ek alan: `toplamTutar`.

### GET /api/mobil/panel/bildirimler
Sorgu: `okunmamis=1`, `sayfa`, `adet`.
Sayfalı, en yeni üstte + `okunmamis` (toplam okunmamış). Kayıt: `{ id, type, title, message, link, isRead, createdAt }`.
Okundu ve sil: B bölümü `notifications`. `type` için Push bölümü. `link` = push `yol`.

---

# Push

- Sunucu yerel jetona doğrudan APNs (HTTP/2) ve FCM v1 ile gönderir. OneSignal ve Expo push servisi yok; **web push yok**.
- `PUSH_ACIK=1` olmadan gönderilmez. O zamana dek `/api/mobil/cihaz` kayıt alır.
- **iOS yük:**
  ```json
  {
    "aps": { "alert": { "title": "başlık", "subtitle": "(duyuruda, varsa)", "body": "metin" }, "sound": "default", "thread-id": "PAYMENT_OVERDUE" },
    "yol": "/dashboard/kiraci/abc", "tur": "PAYMENT_OVERDUE",
    "data": { "yol": "/dashboard/kiraci/abc", "tur": "PAYMENT_OVERDUE" }
  }
  ```
- **Android yük:**
  ```json
  { "notification": { "title": "başlık", "body": "metin" }, "data": { "yol": "/dashboard/kiraci/abc", "tur": "PAYMENT_OVERDUE" }, "android": { "priority": "high" } }
  ```
- **Derin bağlantı:** `yol` = eski `data.path` = `Notification.link`. **WEB yoludur** ve boş olabilir; uygulama kendi rotasına eşler. Okurken: `content.data.yol ?? content.data.data?.yol`. Tanınmayan yol → Bildirimler ekranı.
- **Kime:** hesap sahibi + daveti kabul etmiş üyeler (`hesapPushHedefleri` kuralı): `CihazJetonu.userId = sahibin id'si`, üye cihazları da bu kimlikle kayıtlıdır. Süresi dolmuş ya da `sessionVersion` uyuşmayan oturumun jetonuna gönderilmez ve silinir.
- **Ölü jeton:** APNs 410 / `BadDeviceToken` / `Unregistered`; FCM `UNREGISTERED` ya da jeton hatalı `INVALID_ARGUMENT` → sunucu siler.
- Kullanıcının kapattığı türler (`notify*`) ve kilitli hesaplar (hesap türlerinde) elenir. Tercihler: B `notification-preferences`.

| `tur` | Ne zaman | Kim | Başlık | `yol` | Uygulama rotası |
|---|---|---|---|---|---|
| `PAYMENT_OVERDUE` | Vade + 1 gün, ödenmemiş | Hesap | Gecikmiş Ödeme | `/dashboard/kiraci/:id` | Kiracı detayı |
| `RENEWAL_UPCOMING` | Son borç dönemine 15 gün kala | Hesap | Zam Dönemi Yaklaşıyor | `/dashboard/kiraci/:id` | Kiracı detayı |
| `FIVE_YEAR_3_MONTHS` | 5. yıla 3 ay | Hesap | 5. Yıl Yaklaşıyor | `/dashboard/kiraci/:id` | Kiracı detayı |
| `FIVE_YEAR_1_MONTH` | 5. yıla 1 ay | Hesap | 5. Yıl Yaklaşıyor | `/dashboard/kiraci/:id` | Kiracı detayı |
| `FIVE_YEAR_REACHED` | 5. yıl doldu | Hesap | 5. Yıl Doldu | `/dashboard/kiraci/:id` | Kiracı detayı |
| `MONTHLY_SUMMARY` | Önceki ay bitince | Hesap | Aylık Tahsilat Özeti | `/dashboard/finans-raporlari` | Tahsilatlar |
| `TRIAL_REMINDER` | Bitime 7 gün, ek süre, kilit | Hesap | Deneme süreniz bitiyor / SON FIRSAT… / …görüntüleme moduna geçti | `/dashboard/mizan-pro` | Hesap ekranı, **ödeme yok** |
| `ANNOUNCEMENT` | Admin duyurusu | Tek hesap ya da herkes | Duyuru başlığı (`subtitle` iOS'ta) | yok | Bildirimler |
| `NEW_CUSTOMER` | Yeni kayıt | Adminler | Yeni müşteri kaydı | `/admin/kullanicilar` | Bildirimler |
| `IYZICO_PAYMENT` | iyzico ödemesi | Adminler | Yeni ödeme alındı | `/admin/gelirler` | Bildirimler |

- `EFT_PAYMENT_NOTICE`: yalnız admin bildirim listesine yazılır, **push gitmez** (`/admin/odeme-bildirimleri`).
- Bildirim listesi başlıkları duyuruda `📢 ` ile başlar, push başlığı başlamaz.
- Cron günde birdir (`/api/cron/bildirimler`, `/api/cron/deneme-hatirlatma`). Bildirim önce `Notification` kaydı olur, `[userId, dedupeKey]` tekrarı engeller.
- Metinler kiracı adı içerir (`Ahmet Y. kirasını ödemedi…`): Apple/Google üzerinden geçer, kilit ekranında görünür (Açık nokta 7).

# Dosyalar

- **Kira sözleşmesi dosyası:** `GET /api/dashboard/tenants/:id/contract`, Bearer ile. Doğru `Content-Type`, `inline`. **Hata JSON değil HTML sayfasıdır** (web için): durum kodu ≠ 200 ise gövdeyi gösterme. Range yok. expo-file-system ile başlıklı indir, sonra aç/paylaş.
- **Makbuz:** yükleme var (`receiptFile`), **indirme ucu web'de de yok**; yalnız `hasReceipt` gösterilir (Açık nokta 8).
- **Yükleme sınırı (`lib/uploads.ts`):** en çok 10 MB; uzantı dosya ADINDAN denetlenir: `.pdf .jpg .jpeg .png .webp .doc .docx`. RN'de `FormData.append('contractFile', { uri, name: 'x.pdf', type })`, `name` uzantılı olmalı (HEIC reddedilir, önce JPEG'e çevir).

---

# B. Mevcut uçlar

`app/api/dashboard/**/route.ts` ve `app/api/auth/**/route.ts` dosyalarından çıkarıldı.

**Hepsinde ortak:**
- **Yetki:** "oturum" = sahip ya da üye (`session.userId`); yoksa 401 `Yetkisiz erişim.` (`odeme-bildirimi`, `kira-sozlesmesi`, `yazdirma-baglantisi`: `Oturum bulunamadı.`).
- **"Yazma kapısı"** yazan uçlarda 403 `{error}` döner.
- Başarı çoğunlukla `{ success: true, ... }`. Kayıt nesneleri ham Prisma satırıdır: `Decimal` alanlar metin (`amount`, `monthlyRent`, `increaseRate`, `depositAmount`).
- Doğrulaması olmayan alanda bozuk JSON ya da yanlış tür 500 verebilir: istemci formda kendisi doğrulasın.

**Enum:**
- `PropertyType` = ARSA, AVM, DEPO, DEVREMULK, FABRIKA, KONUT, OFIS
- `TenantType` = INDIVIDUAL, CORPORATE
- `PaymentFrequency` = MONTHLY, YEARLY
- `IncreaseType` = TUFE, CUSTOM
- `Currency` = TRY, USD, EUR
- `TenantOccupancyStatus` = LIVING, VACATED

**Ekran → uç haritası:**

| Ekran | Okuma (A) | Yazma (B) |
|---|---|---|
| Bugün / özet | `panel/ozet` | hızlı tahsilat: `debts/:id/payments` |
| Mülkler | `panel/mulkler`, `/:id` | `properties`, `properties/:id`, `binalar/ata` |
| Binalarım | `panel/binalar` | `binalar`, `binalar/ata`, `binalar/:id/gorunum` |
| Konum haritası | `panel/harita` | `binalar/:id/konum` |
| Mülk Şehrim 3D | `panel/sehir` | `sehir-duzeni`, `binalar/:id/gorunum` |
| Kiracılar | `panel/kiracilar`, `/:id` | `tenants`, `tenants/:id`, `occupancy`, `notes` |
| Borçlandırma | kiracı detayı | `tenants/:id/debts`, `debts/bulk-*` |
| Tahsilatlar | `panel/tahsilatlar` | `debts/:id/payments`, `payments/:id` |
| Masraflar | `panel/masraflar` | `tenants/:id/expenses`, `expenses/:id` |
| Bildirimler | `panel/bildirimler` | `notifications/*`, `notification-preferences` |
| Hesap | `profile` | `profile`, `profile/password`, `resend-verification`, `team`, `/api/mobil/hesap-sil` |
| Destek | | `support-tickets` |
| Araçlar | `market-rates`, `rent-increase-rates` | `kira-sozlesmesi` |

## Mülk

### GET /api/dashboard/properties
- **Yetki:** oturum.
- **İstek:** `?all=1` hafif seçici listesi; yoksa `page, q, type, city, occupied=true|false` (sayfa boyu 10).
- **Yanıt:** `all=1`: `{ properties: [{id, title}] }`. Aksi: `{ properties: [{id, title, address, city, isOccupied, propertyType, _count: {tenants}}], total, hasMore }`.
- **Not:** Mobil liste için `panel/mulkler` kullanır; bu uç yalnız form seçicisi (`all=1`).

### POST /api/dashboard/properties
- **Yetki:** oturum + yazma kapısı + plan mülk sınırı (`checkPropertyLimit`, aşılırsa 403).
- **İstek:** JSON `{ title (zorunlu), address?, city?, district?, squareMeters?, propertyType?, notes?, isOccupied? }`.
- **Yanıt:** 200 `{ success, property }`. 400 `Mülk adı zorunludur.` / `Geçersiz mülk tipi.`; 500.
- **Not:** Bina ataması ayrı: ardından `binalar/ata`.

### GET /api/dashboard/properties/:id
- **Yetki:** oturum, sahiplik (404). **Yanıt:** `{ property }` (ham satır).

### PATCH /api/dashboard/properties/:id
- **Yetki:** oturum + yazma kapısı + sahiplik.
- **İstek:** POST ile aynı. **TAM kayıt gönder:** gönderilmeyen alan boşalır (`address` → `""`, diğerleri `null`, `isOccupied` → `false`). `buildingId/block/unitNo` değişmez.
- **Yanıt:** `{ success, property }`.

### DELETE /api/dashboard/properties/:id
- **Yetki:** oturum + yazma kapısı + sahiplik.
- **Yanıt:** `{ success }`. 400 `Bu mülke bağlı kiracılar var. Önce kiracıları silin.` (FK kısıtı; masrafı ya da ek kiracı bağı olan mülkte de bu mesaj döner).
- **Not:** Onay ekranı koy.

### GET /api/dashboard/properties/:id/expenses
- **Yetki:** oturum, sahiplik. **Yanıt:** `{ expenses: [Expense + tenant: {fullName}] }`. Mobil `panel/masraflar?propertyId=` tercih eder.

### GET /api/dashboard/properties/cities
- **Yetki:** oturum. **Yanıt:** `{ cities: string[] }` (serbest metin, tekil).

## Kiracı

### GET /api/dashboard/tenants
- **Yetki:** oturum.
- **İstek:** `?all=1` seçici; yoksa `page, q, city, propertyId, sort` (sayfa boyu 10).
- **Yanıt:** `all=1`: `{ tenants: [{id, fullName, property: {title}}] }`. Aksi `{ tenants, total, hasMore }`.
- **Not:** Mobil yalnız `all=1` kullanır.

### POST /api/dashboard/tenants
- **Yetki:** oturum + yazma kapısı; tüm mülkler bu hesabın olmalı (404 `Mülk bulunamadı.`).
- **İstek:** `multipart/form-data`:
  - `propertyId` **tekrarlanabilir**: ilki birincil, kalanlar ek mülk. Zorunlu.
  - `fullName` zorunlu.
  - Metin: `phone, email, tenantType, nationalId, taxNumber, notificationAddress, notes, rating (1-5), contractStart, contractDurationMonths, rentRevisionDate, rentPaymentDate, paymentFrequency, increaseType, increaseRate (yalnız CUSTOM), depositAmount, depositCurrency, contractNotes`.
  - Dosya: `contractFile` (isteğe bağlı).
- **Yanıt:** `{ success, tenant }`. 400 alan hatası (`Mülk ve ad soyad zorunludur.`, `Puan 1 ile 5 arasında olmalıdır.`, dosya hatası); 500.
- **Not:** `contractEnd`, `contractStart + contractDurationMonths`'tan hesaplanır. `monthlyRent` bu uçta **yazılmaz**: borçlandırma ucundan gelir.

### GET /api/dashboard/tenants/:id
- **Yetki:** oturum, sahiplik (404). **Yanıt:** `{ tenant (tüm alanlar + property, debts+payments, expenses, tenantNotes, otherProperties), contractToken }`.
- **Not:** Mobil `panel/kiracilar/:id` kullanır (para sayı, durum hesaplı).

### PATCH /api/dashboard/tenants/:id
- **Yetki:** oturum + yazma kapısı + sahiplik.
- **İstek:** POST ile aynı `multipart`. **TAM kayıt gönder:** gönderilmeyen alan `null`'a yazılır; ek mülkler baştan yazılır. `contractFile` yoksa eski dosya kalır.
- **Yanıt:** `{ success, tenant }`.

### DELETE /api/dashboard/tenants/:id
- **Yetki:** oturum + yazma kapısı + sahiplik.
- **Yanıt:** `{ success }`. 500 `Kiracı silinemedi.`
- **Not:** Geri alınamaz; ödeme ve borçlar da silinir, masraflardan kiracı bağı kalkar. **Notu olan kiracı silinemez** (FK kısıtı, 500): önce notları sil.

### PATCH /api/dashboard/tenants/:id/occupancy
- **Yetki:** oturum + yazma kapısı + sahiplik. **İstek:** `{ status: "LIVING"|"VACATED" }`. **Yanıt:** `{ success }`. 400 `Geçersiz durum.`

### POST /api/dashboard/tenants/:id/notes
- **Yetki:** oturum + yazma kapısı + sahiplik. **İstek:** `{ content }`. **Yanıt:** `{ success, note }`. 400 `Not boş olamaz.`
- **Not:** Yazan kişi `getActor` ile kaydedilir (üyede üyenin adı).

### DELETE /api/dashboard/notes/:noteId
- **Yetki:** oturum + yazma kapısı + sahiplik. **Yanıt:** `{ success }`.

### GET /api/dashboard/tenants/:id/contract
- Dosyalar bölümü. Yetki: oturum + sahiplik, ya da `?t=<contractToken>`. Mobil Bearer kullanır.

## Borç ve tahsilat

### POST /api/dashboard/tenants/:id/debts
- **Yetki:** oturum + yazma kapısı + sahiplik.
- **İstek:** `{ monthlyRent: number, startDate: string, paymentType?: "MONTHLY"|"YEARLY", months?: number (1-36, varsayılan 12) }`.
- **Yanıt:** `{ success, created, updated }`. 400 `Geçerli bir tarih ve kira bedeli girin.`
- **Not:** Aynı aya düşen eski borç silinmez, yeni döneme devralınır. `YEARLY`: tutar dönem toplamı, tek borç. `Tenant.monthlyRent` ve `paymentFrequency` güncellenir.

### POST /api/dashboard/tenants/:id/debts/bulk-pay
- **Yetki:** oturum + yazma kapısı + sahiplik. **İstek:** `{ debtIds: string[] }`.
- **Yanıt:** `{ success, marked }`. 400 `İşaretlenecek borç kaydı bulunamadı.` / `Borç kayıtları bu kiracıya ait değil.` / `Bu dönemdeki borçlar zaten ödenmiş.`
- **Not:** Kalan bakiye kadar tahsilat, tarihi borcun vadesi.

### PATCH /api/dashboard/tenants/:id/debts/bulk-update
- **Yetki:** aynı. **İstek:** `{ debtIds: string[], amount: number }`. **Yanıt:** `{ success, updated }`. 400 `Düzeltilecek borç kaydı bulunamadı.` / `Geçerli bir tutar girin.`

### POST /api/dashboard/tenants/:id/debts/bulk-delete
- **Yetki:** aynı. **İstek:** `{ debtIds: string[] }`. **Yanıt:** `{ success, deleted }`.
- **Not:** Geri alınamaz; bağlı tahsilatlar da silinir. Onay ekranı koy.

### POST /api/dashboard/debts/:debtId/payments
- **Yetki:** oturum + yazma kapısı + sahiplik (404 `Borç kaydı bulunamadı.`).
- **İstek:** `multipart/form-data`: `amount` (zorunlu), `paidAt?`, `notes?`, `receiptFile?`.
- **Yanıt:** `{ success, payment }`. 400 `Geçerli bir tahsilat miktarı girin.`; 500.
- **Not:** Toplam ödenen borca ulaşırsa borç `PAID` olur.

### PATCH /api/dashboard/payments/:paymentId
- **Yetki:** oturum + yazma kapısı + sahiplik. **İstek:** `{ amount: number, paidAt?, notes? }`. **Yanıt:** `{ success, payment }`.
- **Not:** Borç durumu yeniden hesaplanır.

### DELETE /api/dashboard/payments/:paymentId
- **Yetki:** aynı. **Yanıt:** `{ success }`.

## Masraf

### POST /api/dashboard/tenants/:id/expenses
- **Yetki:** oturum + yazma kapısı + sahiplik. **İstek:** `{ description, amount, date, notes? }`. **Yanıt:** `{ success, expense }`. 400 alan hataları.
- **Not:** Masraf kiracının birincil mülküne yazılır. Kiracısız mülk masrafı ucu **yok**.

### DELETE /api/dashboard/expenses/:expenseId
- **Yetki:** oturum + yazma kapısı + sahiplik. **Yanıt:** `{ success }`.

## Bina ve şehir (yeni panel)

Hepsi `YENI_PANEL=1` ister (canlıda açık); kapalıysa 404 `Bulunamadı.`. Yazmalar yazma kapısından geçer.

### GET /api/dashboard/binalar
- **Yanıt:** `{ mulkler: [{id, title, address, city, district, propertyType, buildingId, block, unitNo}], binalar: [{id, name, city, district, lat, lng, locationVerified, gorunum}] }`.

### POST /api/dashboard/binalar
- **İstek:** `{ binalar: [{ id|null, ad (≤80), il|null (81 il), ilce|null (≤60), konum: {lat, lng, dogrulandi}|null, gorunum?, birimler: [{ propertyId, blok|null, daireNo|null }] }] }`. En çok 1000 bina.
- **Yanıt:** `{ success, binaIdleri }`. 400 `{sıra}. bina: …`; 500.
- **Not:** Toplu eşleme. Yalnız `buildingId/block/unitNo` ve `Building` değişir. **Hiç mülkü kalmayan binalar silinir.** Konum Türkiye kutusu dışındaysa 400.

### GET /api/dashboard/binalar/ata?propertyId=
- **Yanıt:** `{ binalar: [{id, name, city, district, lat, lng, locationVerified, gorunum, birimSayisi}], atama: {buildingId, block, unitNo}|null }`.

### POST /api/dashboard/binalar/ata
- **İstek:** `{ propertyId, bina: { id|null, ad, il, ilce, konum|null, gorunum? }|null, blok|null, daireNo|null }`. `bina: null` mülkü binadan çıkarır.
- **Yanıt:** `{ success, buildingId }`.

### PATCH /api/dashboard/binalar/:id/konum
- **İstek:** `{ lat, lng }`. **Yanıt:** `{ success }`. 400 `Konum Türkiye sınırları dışında.`; 404.
- **Not:** `locationVerified = true` olur.

### PATCH /api/dashboard/binalar/:id/gorunum
- **İstek:** `{ gorunum: "villa"|"mustakil"|"apt"|"ofis"|"plaza"|"avm"|"fabrika"|"arsa"|null }` (`null` otomatik). **Yanıt:** `{ success }`.

### GET /api/dashboard/sehir-duzeni?il=
- **Yanıt:** `{ sunucu: true, hesap, duzen|null }`. Mobil `panel/sehir` kullanır.

### PUT /api/dashboard/sehir-duzeni
- **İstek:** `{ il: "Konya"|"*", duzen: { binaAnahtari: [sütun, satır] } }`. En çok 2000 bina; `duzen: {}` sıfırlar.
- **Yanıt:** `{ success }`. 400 `Geçersiz hücre.` / `İki bina aynı hücrede olamaz.`; 409 `{sunucu: false}` tablo yoksa (canlıda kurulu).

### GET /api/dashboard/yeni-panel/ozet
- **Yanıt:** `{ ozet, birimler, bugun }`. Mobil `panel/*` kullanır.

## Bildirim

### GET /api/dashboard/notifications
- **Yanıt:** `{ notifications }`, sayfasız. Mobil `panel/bildirimler` kullanır.

### GET /api/dashboard/notifications/unread-count
- **Yanıt:** `{ count }`. Rozet için hafif uç.

### PATCH /api/dashboard/notifications/:id
- **İstek:** `{ isRead: boolean }`. **Yanıt:** `{ success, notification }`. 404.

### DELETE /api/dashboard/notifications/:id
- **Yanıt:** `{ success }`. 404. Kalıcı silme.

### POST /api/dashboard/notifications/mark-all-read
- **Yanıt:** `{ success }`.

### POST /api/dashboard/notifications/delete-all
- **Yanıt:** `{ success }`. Kalıcı; onay koy.

### GET, PATCH /api/dashboard/notification-preferences
- **İstek (PATCH):** boolean alanlardan istenenler: `notifyPaymentOverdue, notifyRenewalUpcoming, notifyFiveYear, notifyMonthlySummary`.
- **Yanıt:** `{ preferences }` (PATCH'te `success` de).
- **Not:** Hesap düzeyinde: üye değiştirirse sahibin tercihi değişir.

## Hesap

### GET /api/dashboard/profile
- **Yanıt:** `{ user: {fullName, email, phone, city, hasPassword}, role }`.
- **Not:** Üyede **sahibin** profili döner; üyenin kendi adı `kullanici.ad`'dadır.

### PATCH /api/dashboard/profile
- **İstek:** `{ fullName, email (ikisi zorunlu), phone?, city? }`. **Yanıt:** `{ success, user }`. 400; 409 `Bu e-posta adresi başka bir hesapta kayıtlı.`
- **Not:** E-posta değişimi onay istemez (web'deki gibi). `city` gönderilmezse değişmez.

### POST /api/dashboard/profile/password
- **Yetki:** oturum; üye 403 `Şifre değişikliğini yalnızca hesap sahibi yapabilir.`
- **İstek:** `{ currentPassword?, newPassword }` (en az 6). Şifresiz (Google/Apple) hesapta `currentPassword` gerekmez, ilk şifreyi belirler.
- **Yanıt:** `{ success }`. 400 `Mevcut şifre hatalı.` vb.
- **Not:** `sessionVersion` artar: bu cihazdaki Bearer de düşer → yeni şifreyle `giris` (Oturum akışı 5). Bearer istekte çerez yazılmaz.

### POST /api/dashboard/profile/resend-verification
- **Yanıt:** `{ success }`. 400 `E-posta adresiniz zaten onaylı.`; 429 (hesap başına 15 dk'da 3); 500.

### DELETE /api/dashboard/profile/delete-account
- **MOBİLDE KULLANILMAZ.** Yerine `/api/mobil/hesap-sil` (Açık nokta 1).

### GET /api/dashboard/team
- **Yanıt:** `{ members: [{id, email, fullName, acceptedAt, createdAt}] }`.

### POST /api/dashboard/team
- **Yetki:** oturum + yazma kapısı. **İstek:** `{ email, fullName }`. **Yanıt:** `{ success, member }`. 409 kayıtlı/davetli e-posta.
- **Not:** Davet e-postası gider, kabul web'de (`/hesap-davet`, 48 saat). Yanıttaki `member` davet jetonunu da içerir: istemcide saklama, loglama.

### DELETE /api/dashboard/team/:id
- **Yetki:** oturum + yazma kapısı. **Yanıt:** `{ success }`. Üyenin mobil oturumları da düşer.

### POST /api/dashboard/support-tickets
- **İstek:** `{ subject, description }`. **Yanıt:** `{ success, ticket }`. 400.

## Araçlar

### GET /api/dashboard/market-rates
- **Yanıt:** `{ usd: {buying, selling}, eur: {…}, gramAltin: {…}, updatedAt }`. 15 dk önbellek. 502 servis yoksa.

### GET /api/dashboard/rent-increase-rates?year=&month=
- **Yetki:** oturum; kilitli hesap 403. **Yanıt:** `getRentIncreaseRates` çıktısı. 400 geçersiz tarih.

### POST /api/dashboard/kira-sozlesmesi
- **Yetki:** oturum + yazma kapısı. **İstek:** `{ alanlar: {...}, mailGonder?: boolean }`. **Yanıt:** `{ dosyaAdi, docx (base64), pdf (base64)|null, mailGonderildi }`. 400 `Şu alanlar zorunludur: …`.
- **Not:** `mailGonder` belgeyi oturumdaki kişiye gönderir. Alan listesi `lib/kiraSozlesmesiAlanlari.ts`. Base64 yanıt büyüktür. v1'de zorunlu değil.

### POST /api/dashboard/yazdirma-baglantisi
- **İstek:** `{ yol: "/dashboard/…" }` (göreli, ≤300). **Yanıt:** `{ url }`.
- **Not:** Tek kullanımlık (10 dk). Açıldığı tarayıcıda 7 günlük web oturumu kurar. Rapor/yazdırma sayfalarını sistem tarayıcısında açmak içindir.

## Ödeme ve Mizan Pro: mobilde kullanılmaz

`POST /api/dashboard/mizan-pro/request`, `GET|POST /api/dashboard/odeme-bildirimi`. App Store 3.1.1 gereği uygulamada ödeme yöntemi ya da fiyat gösterilmez. İstisna: mevcut kabuktaki "Beni Arayın" (`mizan-pro/request`, `{type: "PLAN_UPGRADE", propertyCount}`) kalsın mı Lider kararı (Açık nokta 4).

## Açık kimlik uçları (`/api/auth/*`)

### POST /api/auth/forgot-password
- **Yetki:** açık; IP başına saatte 5.
- **İstek:** `{ email }`. **Yanıt:** `{ success, message }` (var/yok aynı).
- **Not:** Yalnız `User`; **üyede şifre sıfırlama yok** (web'de de). Bağlantı web sayfasına gider (`/reset-password`, 1 saat), o sayfa sistem tarayıcısında açılır.

**Mobil kullanmaz (web akışı):** `register` (reCAPTCHA + çerez), `reset-password`, `accept-invite`, `verify-email`, `logout`, `login`, `google`, `google/callback`, `exchange-session`, `yazdirma-oturumu`.

---

# Açık noktalar (Lider kararı)

Varsayılan yazılı olan, karar gelmezse uygulanacak olandır.

1. **Web güvenlik açığı (üye sahibi silebilir):** `DELETE /api/dashboard/profile/delete-account` `session.memberId` denetlemiyor: **ekip üyesi sahibin tüm hesabını silebilir.** Ayrıca web ucu, şemaya göre, kiracı notu, masraf ya da ödeme bildirimi olan hesapta FK kısıtına takılıp 500 verir (canlıda denenmedi), yani çoğu dolu hesap silinemez; bu mağaza kuralına aykırı olur. Varsayılan: mobil yeni `hesap-sil` ucunu kullanır, web ucuna dokunmam. Öneri: web ucuna tek satır üye engeli ayrı onayla.
2. **Üye e-postasıyla Google/Apple:** web kuralında üyenin e-postasıyla Google girişi yeni bir sahip hesabı açar ve üyenin şifreli girişini kilitler (önce `User` aranır). Görev "eşleme aynen" diyor; bu tek köşede sapıyorum. Varsayılan: mobilde 409 `UYE_HESABI`; web değişmez.
3. **Admin:** Admin v1'de mobilde kendi hesabının paneli ve bildirimleri. `/api/admin/*` Bearer kabul etmez (`impersonate` gibi uçlar açılmasın, proxy matcher'ıyla 403). Varsayılan: böyle; admin ekranları v2.
4. **"Beni Arayın":** Varsayılan: mobilde **yok** (3.1.1 riski), yalnız nötr metin. Mevcut kabukta var; kullanıcı isterse eklenir.
5. **Google istemci kimlikleri:** yeni env adları `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `APPLE_BUNDLE_ID`. Varsayılan: Expo `webClientId = GOOGLE_CLIENT_ID` verir, `aud` web kimliği olur; diğer ikisi isteğe bağlı.
6. **Apple jeton iptali:** Apple hesap silmede SIWA jetonunun iptalini ister. `appleid.apple.com/auth/revoke` için ayrı `.p8` ve env gerekir (`APPLE_SIWA_KEY_ID`, `APPLE_SIWA_KEY_B64`, `APPLE_TEAM_ID`). Varsayılan: kod yazılır, env yoksa iptal sessiz geçilir, hesap yine silinir.
7. **Kilit ekranında kiracı adı:** Metinler OneSignal'de de böyleydi. Varsayılan: aynen kalır (Topbaş'ta sohbet metni çıkarılmıştı, burada davranış değişmesin diye dokunmuyorum).
8. **v1'de eksik bırakılanlar:** makbuz indirme (web'de de yok), takvim ve finans raporu uçları (Lider listesinde yok), e-postayla kayıt (reCAPTCHA gerekir; uygulama içi Google/Apple + web `/register` bağlantısı). İstenirse v1.1.
9. **Hız sınırı:** görevdeki değerler (giriş 10/15 dk IP) uygulanır. Türkiye'de GSM'ler CGNAT kullanır; aynı IP'de çok kullanıcı takılabilir. `getClientIp` `x-forwarded-for`'un ilk değerini alıyor; nginx başlığı eziyor mu sunucuda doğrulanmalı, yoksa sınır atlatılır. Varsayılan: görevdeki gibi.
10. **Kullanım koşulları onayı:** web Google akışı `termsAcceptedAt` yazmıyor, yani web'den Google ile gelen hesaplarda onay kaydı yok. Mobilde `sozlesmeGerekli` bu hesaplara da bir kez onay ekranı gösterir. Varsayılan: böyle; web'e dokunulmaz.
