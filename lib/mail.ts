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
