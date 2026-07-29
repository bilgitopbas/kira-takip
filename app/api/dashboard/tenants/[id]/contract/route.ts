import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUploadedFilePath } from "@/lib/uploads";
import { verifyContractToken } from "@/lib/contractToken";

// Dosya yeni sekmede açılabilsin diye gerçek MIME türüyle sunulur.
// Onceden hepsi "application/octet-stream" + "attachment" ile gonderildigi icin
// tarayici PDF/gorseli sekmede acmak yerine her zaman indirmeye zorluyordu.
// (Guvenlik basliklarindaki X-Content-Type-Options: nosniff nedeniyle dogru
// tur gondermek ayrica sart.)
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Bağlantı yeni sekmede açıldığı için hatayı JSON yerine okunabilir bir sayfa
// olarak döndürüyoruz - aksi halde kullanıcı boş/anlamsız bir sekme görüyor.
function hataSayfasi(mesaj: string, durum: number) {
  return new NextResponse(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Dosya açılamadı</title></head>
     <body style="font-family:system-ui,sans-serif;padding:2rem;color:#334155">
       <h1 style="font-size:1.25rem;margin:0 0 .5rem">Dosya açılamadı</h1>
       <p style="margin:0;color:#64748b">${mesaj}</p>
     </body></html>`,
    { status: durum, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// Türkçe karakterli dosya adları ASCII olmayan karakter içerdiği için
// Content-Disposition başlığında RFC 5987 (filename*) biçimiyle gönderilir.
function dosyaAdiBasligi(ad: string) {
  const asciiYedek = ad.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `inline; filename="${asciiYedek}"; filename*=UTF-8''${encodeURIComponent(ad)}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Normalde oturum çerezi ile yetkilendirilir. Mobil uygulamada bağlantı
  // Safari'de açıldığı için çerez taşınmaz; bu durumda kiracı verisiyle
  // birlikte verilen kısa ömürlü imzalı jeton (?t=) kabul edilir.
  const session = await getSession();
  const token = new URL(req.url).searchParams.get("t");
  const jetonGecerli = token ? await verifyContractToken(token, id) : false;

  if (!session && !jetonGecerli) {
    return hataSayfasi(
      "Bu bağlantının geçerlilik süresi dolmuş. Lütfen uygulamada kiracı sayfasını yenileyip tekrar deneyin.",
      401
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });

  if (!tenant || !tenant.contractFileUrl) {
    return hataSayfasi("Bu kiracıya ait bir sözleşme dosyası kayıtlı değil.", 404);
  }

  // Çerezle gelindiyse mülk sahipliği ayrıca doğrulanır; jetonla gelindiğinde
  // jeton zaten yalnızca bu kiracı için üretilmiş ve imzalıdır.
  if (session && !jetonGecerli && tenant.property.ownerId !== session.userId) {
    return hataSayfasi("Bu kiracıya ait bir sözleşme dosyası kayıtlı değil.", 404);
  }

  const filePath = getUploadedFilePath("contracts", tenant.contractFileUrl);

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(tenant.contractFileUrl).toLowerCase();
    const gosterilecekAd = tenant.contractFileName || tenant.contractFileUrl;
    // Word gibi tarayicinin gosteremedigi turlerde "inline" zaten indirmeye duser
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": dosyaAdiBasligi(gosterilecekAd),
      },
    });
  } catch (err) {
    // Kayıt veritabanında var ama dosya diskte yok/okunamıyor - sunucu
    // günlüğüne tam yolu yazıyoruz ki nedeni tespit edilebilsin.
    console.error("Sözleşme dosyası okunamadı:", filePath, err);
    return hataSayfasi(
      "Sözleşme kaydı bulundu ancak dosyanın kendisi sunucuda okunamadı. Lütfen sözleşmeyi kiracı düzenleme ekranından yeniden yükleyin.",
      404
    );
  }
}
