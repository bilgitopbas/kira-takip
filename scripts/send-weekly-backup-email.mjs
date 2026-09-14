// Haftalik veritabani yedeğinin en güncelini gzip'leyip ŞİFRELEYEREK e-posta ekinde gönderir.
// Sunucuda cron ile calistirilir: node scripts/send-weekly-backup-email.mjs
//
// Şifreleme, OpenSSL'in `enc -aes-256-cbc -pbkdf2` biçimiyle birebir uyumludur
// (Topbaş Hukuk yedeğiyle aynı yöntem): "Salted__" + 8 bayt tuz + AES-256-CBC
// şifreli veri; anahtar ve IV, parola + tuzdan PBKDF2-HMAC-SHA256 (10.000 tur)
// ile türetilir. Böylece dosya sunucuda/bilgisayarda yalnızca openssl ile açılır.
//
// Parola .env içindeki YEDEK_PAROLA değişkeninden okunur. Tanımlı değilse yedek
// ŞİFRESİZ GÖNDERİLMEZ; betik hata vererek çıkar.
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";
import nodemailer from "nodemailer";

const BACKUP_DIR = process.env.BACKUP_DIR || "/root/yedekler-kira";
const RECIPIENT = process.env.BACKUP_EMAIL_TO || process.env.SMTP_USER;
const PAROLA = process.env.YEDEK_PAROLA;

// OpenSSL varsayılanları: PBKDF2 10.000 tur, SHA-256, 8 bayt tuz.
const PBKDF2_TUR = 10000;

function findLatestBackup(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("kira_yedek_") && f.endsWith(".sql"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) return null;
  return path.join(dir, files[0].name);
}

// `openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:...` ile açılabilen çıktı üretir.
export function opensslUyumluSifrele(veri, parola) {
  const tuz = crypto.randomBytes(8);
  const turetilen = crypto.pbkdf2Sync(parola, tuz, PBKDF2_TUR, 48, "sha256");
  const anahtar = turetilen.subarray(0, 32);
  const iv = turetilen.subarray(32, 48);
  const cipher = crypto.createCipheriv("aes-256-cbc", anahtar, iv);
  return Buffer.concat([Buffer.from("Salted__", "ascii"), tuz, cipher.update(veri), cipher.final()]);
}

async function main() {
  if (!PAROLA) {
    console.error(
      "YEDEK_PAROLA tanımlı değil (.env). Yedek şifresiz gönderilmez; e-posta gönderimi iptal edildi."
    );
    process.exit(1);
  }

  const latest = findLatestBackup(BACKUP_DIR);
  if (!latest) {
    console.error(`Yedek dosyası bulunamadı: ${BACKUP_DIR}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(latest);
  const gzipped = zlib.gzipSync(raw);
  const encrypted = opensslUyumluSifrele(gzipped, PAROLA);
  const attachmentName = `${path.basename(latest)}.gz.enc`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const today = new Date().toLocaleDateString("tr-TR");

  // Not: Parola e-posta gövdesine KESİNLİKLE yazılmaz.
  const text = [
    `Ekte ${today} tarihli en güncel veritabanı yedeği bulunmaktadır.`,
    `Dosya gzip ile sıkıştırılmış ve AES-256 ile ŞİFRELENMİŞTİR.`,
    ``,
    `Dosya: ${attachmentName}`,
    `Boyut: ${(encrypted.length / 1024).toFixed(1)} KB`,
    ``,
    `GERİ YÜKLEME (şifre çözme) — parola, sunucudaki .env dosyasında YEDEK_PAROLA olarak kayıtlı olan paroladır:`,
    ``,
    `1) Şifreyi çöz:`,
    `   openssl enc -d -aes-256-cbc -pbkdf2 -in ${attachmentName} -out yedek.sql.gz -pass pass:PAROLANIZ`,
    ``,
    `2) Sıkıştırmayı aç:`,
    `   gunzip yedek.sql.gz`,
    ``,
    `3) Veritabanına yükle (sunucuda):`,
    `   docker exec -i kira_db psql -U kira_admin kira_takip_db < yedek.sql`,
    ``,
    `Parola yanlışsa 1. adım "bad decrypt" hatası verir.`,
  ].join("\n");

  await transporter.sendMail({
    from: `MizanMülk Yedekleme <${process.env.SMTP_USER}>`,
    to: RECIPIENT,
    subject: `Mizan Mülk Yönetimi - Haftalık Veritabanı Yedeği (${today})`,
    text,
    attachments: [{ filename: attachmentName, content: encrypted }],
  });

  console.log(`Şifreli yedek e-postası gönderildi: ${attachmentName} -> ${RECIPIENT}`);
}

// Yalnızca doğrudan çalıştırıldığında gönder (test için içe aktarılabilir).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("Yedek e-postası gönderilemedi:", err);
    process.exit(1);
  });
}
