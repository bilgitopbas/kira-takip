# Web ile mobil: karşılığı olmayan alanlar

`scripts/web-mobil-karsilastir.js` bunları karşılaştıramaz; neden aşağıda. Hesaplamaların çoğu web'le aynı işlevden gelir (`panelOzetiGetir`, `panelBirimleriGetir`, `binalariKur`, `computeAccessState`, `toplamBorclar`).

## Mobilde olup web JSON ucunda olmayanlar

| Mobil alan | Neden karşılığı yok | Betik ne yapıyor |
|---|---|---|
| `bugun.besYil` | Mobile özel Bugün listesi. Web'de 5. yıl yalnız takvim sayfasında ve bildirimde, JSON ucu yok. Tarih kuralı aynı (`getFiveYearDate`), ama −30…+90 gün aralığı ve "yalnız oturan kiracı" süzgeci mobilin. | Adedi `BILGI` olarak basar, mülklerin web birimlerinde olduğuna bakar |
| `abonelik.*` | Web durumu sunucu bileşeninde hesaplar, ucu yok. `yazmaKapali` ve `yazmaKapaliSebep`, `requireWriteAccess` kuralının önceden görünümü. | Giriş yanıtı ile `panel/ozet` eşit mi; `kilitli` için web `rent-increase-rates` 403 davranışı |
| `emailOnayli` | Web'de sunucu bileşeninde banner | Karşılaştırmaz |
| `sozlesmeGerekli`, `POST sozlesme-onay` | Yalnız mobilde kapı. Web onayı kayıtta alır; web Google akışı `termsAcceptedAt` yazmaz | Karşılaştırmaz; true ise durur, onay yazmaz |
| `kullanici.tur`, `memberId`, `hesapAdi` | Web'de oturum içinde, JSON'da yok | `rol`, ad ve e-posta eşitliği (üyede web profili sahibin olduğu için ad/e-posta atlanır) |
| `panel/tahsilatlar`, `toplamTutar` | Web tahsilat defteri sunucu bileşeni, JSON ucu yok | Örnek kiracılarda toplamı web kiracı ayrıntısıyla karşılaştırır |
| `panel/masraflar`, `toplamTutar` | Web'de genel masraf listesi yok (yalnız mülk ve kiracı ayrıntısında) | Aynı |
| `panel/binalar` öneri binaları, `ozet`, `toplamOzet` | Web `/api/dashboard/binalar` yalnız kayıtlı binaları verir; gruplamayı web istemcisi birimlerden kurar | Anahtarları web birimlerinin `bina.anahtar`'ıyla karşılaştırır |
| `panel/harita` `konumlar`, `konumsuz`, `ad` | Web istemcide `binaKonumlari` ile hesaplar | Toplam ve kayıtlı konum sayısı |
| `panel/sehir` `duzen` | Web ayrı uçtan okur (`sehir-duzeni`) | Karşılaştırmaz |
| Kiracı ayrıntısında `durum`, `odenen`, `kalan`, `besYilTarihi`, `sozlesme.dosya` | Web istemcide hesaplar; dosyada web `contractToken` kullanır | Kaynak tutarlar ve "dosya var mı" |

## Biçim farkı (aynı veri)

- Para: mobilde sayı, web ham uçlarında metin (`"1250.50"`). Betik sayıya çevirir.
- Hata gövdesi: mobilde `{hata, kod}`, web'de `{error}`.
- Mobil oturumda `GET /api/dashboard/profile` `role` hep `CUSTOMER` döner; tür `kullanici.tur`'dadır.

## Betiğin sınırı

- Örnek kiracı sayısı 3; tahsilat ve masraf tutarlılığı tüm hesapta değil bu örneklerde bakılır.
- Tek hesabı görür. Üye hesabıyla ayrıca koşarsa üye yetkisini de sınar.
- Çekim sırasında biri veri yazarsa geçici `FARK` çıkabilir; tekrar koşmak ayırır.
