import nodemailer from "nodemailer";

const globalForMail = globalThis as unknown as {
  transporter: nodemailer.Transporter | undefined;
};

function getTransporter() {
  if (globalForMail.transporter) return globalForMail.transporter;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    globalForMail.transporter = transporter;
  }

  return transporter;
}

function emailShell(bodyHtml: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#F8F9FB; padding:32px 16px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #f0f0f0;">
      <div style="background:#17B6AE; padding:24px 32px;">
        <span style="color:#ffffff; font-size:18px; font-weight:700;">MizanMülk Yönetimi</span>
      </div>
      <div style="padding:32px;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 32px; background:#F8F9FB; text-align:center;">
        <span style="color:#94a3b8; font-size:12px;">© ${new Date().getFullYear()} MizanMülk Yönetimi</span>
      </div>
    </div>
  </div>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `MizanMülk <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(to: string, fullName: string) {
  const html = emailShell(`
    <h1 style="font-size:20px; color:#0f172a; margin:0 0 16px;">🎉 Hoş Geldiniz</h1>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Merhaba ${fullName},</p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">MizanMülk hesabınız başarıyla oluşturulmuştur.</p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Artık;</p>
    <ul style="font-size:14px; color:#334155; line-height:1.8; padding-left:20px;">
      <li>Mülk ve kiracı kayıtlarınızı yönetebilir,</li>
      <li>Sözleşme süreçlerinizi takip edebilir,</li>
      <li>Tahsilat ve raporlama işlemlerinizi kolayca gerçekleştirebilirsiniz.</li>
    </ul>
  `);
  await sendMail(to, "🎉 Hoş Geldiniz - MizanMülk", html);
}

export async function sendInviteEmail(to: string, inviterName: string, inviteLink: string) {
  const html = emailShell(`
    <h1 style="font-size:20px; color:#0f172a; margin:0 0 16px;">Davet Edildiniz</h1>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Merhaba,</p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">
      <strong>${inviterName}</strong>, MizanMülk Yönetimi hesabını sizinle birlikte kullanmak için sizi davet etti.
      Bu davet ile aynı hesaptaki mülkleri, kiracıları ve tahsilat bilgilerini kendi e-posta adresiniz ve
      belirleyeceğiniz şifre ile görüntüleyip yönetebileceksiniz.
    </p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Başlamak için aşağıdaki bağlantıya tıklayıp şifrenizi belirleyin. Bu bağlantı 48 saat süreyle geçerlidir.</p>
    <p style="text-align:center; margin:24px 0;">
      <a href="${inviteLink}" style="background:#17B6AE; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 24px; border-radius:10px; display:inline-block;">Şifremi Belirle ve Katıl</a>
    </p>
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">Bu daveti siz talep etmediyseniz bu e-postayı görmezden gelebilirsiniz.</p>
  `);
  await sendMail(to, `${inviterName} sizi MizanMülk hesabına davet etti`, html);
}

export async function sendVerificationEmail(to: string, fullName: string, verifyLink: string) {
  const html = emailShell(`
    <h1 style="font-size:20px; color:#0f172a; margin:0 0 16px;">E-posta Adresinizi Onaylayın</h1>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Merhaba ${fullName},</p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">MizanMülk hesabınızı kullanmaya devam edebilmeniz için e-posta adresinizi onaylamanız gerekiyor. Aşağıdaki bağlantıya tıklayarak onaylayabilirsiniz. Bu bağlantı 7 gün süreyle geçerlidir.</p>
    <p style="text-align:center; margin:24px 0;">
      <a href="${verifyLink}" style="background:#17B6AE; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 24px; border-radius:10px; display:inline-block;">E-postamı Onayla</a>
    </p>
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">Bu hesabı siz oluşturmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
  `);
  await sendMail(to, "E-posta Adresinizi Onaylayın - MizanMülk", html);
}

export async function sendPasswordResetEmail(to: string, fullName: string, resetLink: string) {
  const html = emailShell(`
    <h1 style="font-size:20px; color:#0f172a; margin:0 0 16px;">Şifre Sıfırlama Talebi</h1>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Merhaba ${fullName},</p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Hesabınız için bir şifre sıfırlama talebi aldık. Aşağıdaki bağlantıya tıklayarak yeni bir şifre belirleyebilirsiniz. Bu bağlantı 1 saat süreyle geçerlidir.</p>
    <p style="text-align:center; margin:24px 0;">
      <a href="${resetLink}" style="background:#17B6AE; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 24px; border-radius:10px; display:inline-block;">Şifremi Sıfırla</a>
    </p>
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">Bu talebi siz oluşturmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
  `);
  await sendMail(to, "Şifre Sıfırlama - MizanMülk", html);
}

/**
 * Oluşturulan kira sözleşmesini ek olarak gönderir.
 * Alıcı yalnızca sözleşmeyi oluşturan panel kullanıcısıdır; belge kiracıya
 * doğrudan gönderilmez.
 */
export async function sendKiraSozlesmesiEmail(
  to: string,
  fullName: string,
  kiraciAdi: string,
  ekler: { filename: string; content: Buffer }[]
) {
  const html = emailShell(`
    <h1 style="font-size:20px; color:#0f172a; margin:0 0 16px;">Kira Sözleşmeniz Hazır</h1>
    <p style="font-size:14px; color:#334155; line-height:1.6;">Merhaba ${fullName},</p>
    <p style="font-size:14px; color:#334155; line-height:1.6;">
      <strong>${kiraciAdi}</strong> için hazırladığınız kira sözleşmesi ekte yer alıyor.
      Belgeyi yazdırıp taraflarca imzalatmanız gerekmektedir.
    </p>
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">
      Bu belge girdiğiniz bilgilerle otomatik olarak dolduruldu. Göndermeden önce
      tüm alanları kontrol etmenizi öneririz.
    </p>
  `);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `MizanMülk <${process.env.SMTP_USER}>`,
    to,
    subject: `Kira Sözleşmesi - ${kiraciAdi}`,
    html,
    attachments: ekler,
  });
}

/** E-postalardaki butonların işaret ettiği panel adresi */
function panelAdresi(yol: string) {
  const taban = process.env.APP_URL?.replace(/\/$/, "") || "https://mizanmulkyonetimi.com";
  return `${taban}${yol}`;
}

function proButonu(metin = "Mizan Pro'ya Geç") {
  return `<p style="text-align:center; margin:28px 0;">
      <a href="${panelAdresi("/dashboard/mizan-pro")}" style="background:#17B6AE; color:#ffffff; text-decoration:none; font-weight:700; font-size:15px; padding:14px 32px; border-radius:10px; display:inline-block;">${metin}</a>
    </p>`;
}

/** "12 mülk, 18 kiracı ve 143 tahsilat kaydı" gibi kişisel özet */
function veriOzeti(o: { mulk: number; kiraci: number; tahsilat: number }) {
  const parcalar: string[] = [];
  if (o.mulk) parcalar.push(`<strong>${o.mulk} mülk</strong>`);
  if (o.kiraci) parcalar.push(`<strong>${o.kiraci} kiracı</strong>`);
  if (o.tahsilat) parcalar.push(`<strong>${o.tahsilat} tahsilat kaydı</strong>`);
  if (parcalar.length === 0) return "";
  const son = parcalar.pop();
  return parcalar.length ? `${parcalar.join(", ")} ve ${son}` : son!;
}

type DenemeVeri = {
  mulk: number;
  kiraci: number;
  tahsilat: number;
  aylikTutar: number;
};

/** Deneme bitimine 7 gün kala */
export async function sendTrialEndingEmail(
  to: string,
  fullName: string,
  kalanGun: number,
  veri: DenemeVeri
) {
  const ozet = veriOzeti(veri);
  const html = emailShell(`
    <h1 style="font-size:22px; color:#0f172a; margin:0 0 16px;">Deneme sürenizin bitmesine ${kalanGun} gün kaldı</h1>
    <p style="font-size:14px; color:#334155; line-height:1.7;">Merhaba ${fullName},</p>
    ${
      ozet
        ? `<p style="font-size:14px; color:#334155; line-height:1.7;">MizanMülk'te şu ana kadar ${ozet} oluşturdunuz. Deneme süreniz dolduğunda bu kayıtlar silinmez — ancak <strong>yeni kayıt ekleyemez, tahsilat işleyemez ve hatırlatma bildirimleri alamazsınız.</strong></p>`
        : `<p style="font-size:14px; color:#334155; line-height:1.7;">Deneme süreniz dolduğunda kayıtlarınız silinmez — ancak <strong>yeni kayıt ekleyemez, tahsilat işleyemez ve hatırlatma bildirimleri alamazsınız.</strong></p>`
    }
    <div style="background:#F8F9FB; border:1px solid #eef0f3; border-radius:12px; padding:18px 20px; margin:20px 0;">
      <p style="font-size:13px; color:#64748b; margin:0 0 6px;">Sizin için aylık tutar</p>
      <p style="font-size:26px; font-weight:700; color:#17B6AE; margin:0;">${veri.aylikTutar.toLocaleString("tr-TR")} TL</p>
      <p style="font-size:12px; color:#94a3b8; margin:6px 0 0;">${veri.mulk || 1} mülk × 75 TL · aylık</p>
    </div>
    <p style="font-size:14px; color:#334155; line-height:1.7;">
      Kira takibini elektronik tabloya geri döndürmeden önce bir düşünün: gecikmiş kira uyarıları,
      kira artış hesaplaması, 5. yıl kira tespit takvimi ve tek tuşla sözleşme oluşturma hepsi
      Mizan Pro ile devam ediyor.
    </p>
    ${proButonu()}
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">Sorularınız için bu e-postayı yanıtlayabilirsiniz.</p>
  `);
  await sendMail(to, `Deneme sürenizin bitmesine ${kalanGun} gün kaldı - MizanMülk`, html);
}

/** Deneme bitti, 7 günlük ek süre başladı */
export async function sendTrialGraceEmail(
  to: string,
  fullName: string,
  veri: DenemeVeri
) {
  const ozet = veriOzeti(veri);
  const html = emailShell(`
    <div style="background:#FEF3C7; border:1px solid #FDE68A; border-radius:10px; padding:10px 14px; margin:0 0 18px;">
      <span style="font-size:12px; font-weight:700; color:#B45309; letter-spacing:0.08em;">SON FIRSAT</span>
    </div>
    <h1 style="font-size:22px; color:#0f172a; margin:0 0 16px;">Hesabınız 7 gün sonra kilitleniyor</h1>
    <p style="font-size:14px; color:#334155; line-height:1.7;">Merhaba ${fullName},</p>
    <p style="font-size:14px; color:#334155; line-height:1.7;">
      45 günlük ücretsiz deneme süreniz doldu. Size <strong>7 günlük ek süre</strong> tanımladık —
      bu sürede paneli eskisi gibi kullanmaya devam edebilirsiniz.
    </p>
    ${
      ozet
        ? `<p style="font-size:14px; color:#334155; line-height:1.7;">Ek süre de dolduğunda ${ozet} yerinde duracak, ancak panel <strong>yalnızca görüntüleme moduna</strong> geçecek.</p>`
        : `<p style="font-size:14px; color:#334155; line-height:1.7;">Ek süre de dolduğunda panel <strong>yalnızca görüntüleme moduna</strong> geçecek.</p>`
    }
    <div style="background:#F8F9FB; border:1px solid #eef0f3; border-radius:12px; padding:18px 20px; margin:20px 0;">
      <p style="font-size:13px; color:#64748b; margin:0 0 6px;">Sizin için aylık tutar</p>
      <p style="font-size:26px; font-weight:700; color:#17B6AE; margin:0;">${veri.aylikTutar.toLocaleString("tr-TR")} TL</p>
      <p style="font-size:12px; color:#94a3b8; margin:6px 0 0;">${veri.mulk || 1} mülk × 75 TL · aylık</p>
    </div>
    ${proButonu("Aboneliğimi Başlat")}
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">Ödeme veya fatura konusunda yardıma ihtiyacınız varsa bu e-postayı yanıtlamanız yeterli.</p>
  `);
  await sendMail(to, "SON FIRSAT: Hesabınız 7 gün sonra kilitleniyor - MizanMülk", html);
}

/** Ek süre de doldu, hesap kilitlendi */
export async function sendTrialLockedEmail(
  to: string,
  fullName: string,
  veri: DenemeVeri
) {
  const ozet = veriOzeti(veri);
  const html = emailShell(`
    <h1 style="font-size:22px; color:#0f172a; margin:0 0 16px;">Hesabınız görüntüleme moduna geçti</h1>
    <p style="font-size:14px; color:#334155; line-height:1.7;">Merhaba ${fullName},</p>
    <p style="font-size:14px; color:#334155; line-height:1.7;">
      Deneme ve ek süreniz sona erdi. <strong>Verilerinizin hiçbiri silinmedi</strong> —
      ${ozet ? `${ozet} olduğu gibi duruyor. ` : ""}Panele girip görüntüleyebilir,
      raporlarınızı yazdırabilir ve Excel'e aktarabilirsiniz.
    </p>
    <p style="font-size:14px; color:#334155; line-height:1.7;">
      Yeni kayıt eklemek, tahsilat işlemek ve hatırlatma bildirimleri almak için aboneliğinizi
      başlatmanız yeterli. Kaldığınız yerden devam edersiniz.
    </p>
    <div style="background:#F8F9FB; border:1px solid #eef0f3; border-radius:12px; padding:18px 20px; margin:20px 0;">
      <p style="font-size:13px; color:#64748b; margin:0 0 6px;">Sizin için aylık tutar</p>
      <p style="font-size:26px; font-weight:700; color:#17B6AE; margin:0;">${veri.aylikTutar.toLocaleString("tr-TR")} TL</p>
      <p style="font-size:12px; color:#94a3b8; margin:6px 0 0;">${veri.mulk || 1} mülk × 75 TL · aylık</p>
    </div>
    ${proButonu("Hesabımı Yeniden Aç")}
    <p style="font-size:12px; color:#94a3b8; line-height:1.6;">Vazgeçtiyseniz bu e-postayı görmezden gelebilirsiniz; verileriniz yerinde kalır.</p>
  `);
  await sendMail(to, "Hesabınız görüntüleme moduna geçti - MizanMülk", html);
}
