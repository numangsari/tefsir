import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = "tefsir.net <noreply@tefsir.net>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://tefsir.net";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "tefsir.net — E-posta adresinizi doğrulayın",
    html: emailTemplate(
      "E-posta Doğrulama",
      "Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın. Bu bağlantı 24 saat geçerlidir.",
      url,
      "E-postamı Doğrula"
    ),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE_URL}/sifre-sifirla/${token}`;
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "tefsir.net — Şifre sıfırlama",
    html: emailTemplate(
      "Şifre Sıfırlama",
      "Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu bağlantı 1 saat geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.",
      url,
      "Şifremi Sıfırla"
    ),
  });
}

// İletişim formundan gelen mesajı site sahibine iletir. From doğrulanmış domain'de
// kalır (Resend gereği); replyTo gönderenin e-postasıdır, böylece doğrudan yanıtlanır.
export async function sendContactNotification(params: {
  name: string;
  email: string;
  subject?: string | null;
  body: string;
}) {
  const to = process.env.CONTACT_EMAIL ?? "numangsari@gmail.com";
  const subjectLine = params.subject?.trim()
    ? `tefsir.net iletişim: ${params.subject.trim()}`
    : "tefsir.net — yeni iletişim mesajı";
  await getResend().emails.send({
    from: FROM,
    to,
    replyTo: params.email,
    subject: subjectLine,
    html: contactTemplate(params),
  });
}

// HTML enjeksiyonunu önlemek için kullanıcı girdisini kaçışla (e-posta gövdesinde).
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contactTemplate({
  name,
  email,
  subject,
  body,
}: {
  name: string;
  email: string;
  subject?: string | null;
  body: string;
}) {
  const rows = [
    ["Ad", esc(name)],
    ["E-posta", `<a href="mailto:${esc(email)}" style="color:#15803d;">${esc(email)}</a>`],
    subject?.trim() ? ["Konu", esc(subject.trim())] : null,
  ].filter(Boolean) as [string, string][];

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e0;">
        <tr><td style="background:#15803d;padding:24px 32px;">
          <span style="color:#fff;font-size:22px;font-weight:600;letter-spacing:-0.5px;">tefsir.net</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1c1917;">Yeni iletişim mesajı</h1>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;font-size:14px;color:#44403c;">
            ${rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:4px 0;color:#78716c;width:90px;vertical-align:top;">${k}</td><td style="padding:4px 0;color:#1c1917;">${v}</td></tr>`
              )
              .join("")}
          </table>
          <div style="padding:16px;background:#fafaf9;border:1px solid #e5e5e0;border-radius:6px;font-size:15px;line-height:1.6;color:#1c1917;white-space:pre-wrap;">${esc(
            body
          )}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e5e0;background:#fafaf9;">
          <p style="margin:0;font-size:12px;color:#a8a29e;">Bu mesaja yanıt verirseniz doğrudan gönderene ulaşır.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailTemplate(title: string, body: string, url: string, buttonText: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e0;">
        <tr><td style="background:#15803d;padding:24px 32px;">
          <span style="color:#fff;font-size:22px;font-weight:600;letter-spacing:-0.5px;">tefsir.net</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1c1917;">${title}</h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#44403c;">${body}</p>
          <a href="${url}" style="display:inline-block;background:#15803d;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:500;">${buttonText}</a>
          <p style="margin:24px 0 0;font-size:12px;color:#78716c;">Bu butona tıklayamıyorsanız şu bağlantıyı tarayıcınıza kopyalayın:<br><a href="${url}" style="color:#15803d;">${url}</a></p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e5e0;background:#fafaf9;">
          <p style="margin:0;font-size:12px;color:#a8a29e;">Bu e-posta tefsir.net tarafından gönderilmiştir.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
