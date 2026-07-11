// Haftalik veritabani yedeğinin en güncelini gzip'leyip e-posta ekinde gönderir.
// Sunucuda cron ile calistirilir: node scripts/send-weekly-backup-email.mjs
import "dotenv/config";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import nodemailer from "nodemailer";

const BACKUP_DIR = process.env.BACKUP_DIR || "/root/yedekler-kira";
const RECIPIENT = process.env.BACKUP_EMAIL_TO || process.env.SMTP_USER;

function findLatestBackup(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("kira_yedek_") && f.endsWith(".sql"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) return null;
  return path.join(dir, files[0].name);
}

async function main() {
  const latest = findLatestBackup(BACKUP_DIR);
  if (!latest) {
    console.error(`Yedek dosyası bulunamadı: ${BACKUP_DIR}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(latest);
  const gzipped = zlib.gzipSync(raw);
  const attachmentName = `${path.basename(latest)}.gz`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const today = new Date().toLocaleDateString("tr-TR");

  await transporter.sendMail({
    from: `MizanMülk Yedekleme <${process.env.SMTP_USER}>`,
    to: RECIPIENT,
    subject: `Mizan Mülk Yönetimi - Haftalık Veritabanı Yedeği (${today})`,
    text: `Ekte ${today} tarihli en güncel veritabanı yedeği (gzip ile sıkıştırılmış) bulunmaktadır.\n\nDosya: ${attachmentName}\nBoyut: ${(gzipped.length / 1024).toFixed(1)} KB`,
    attachments: [{ filename: attachmentName, content: gzipped }],
  });

  console.log(`Yedek e-postası gönderildi: ${attachmentName} -> ${RECIPIENT}`);
}

main().catch((err) => {
  console.error("Yedek e-postası gönderilemedi:", err);
  process.exit(1);
});
