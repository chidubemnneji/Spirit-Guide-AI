import { Resend } from "resend";

const FROM = "SoulGuide <noreply@soulguide.app>";
const APP_URL = process.env.APP_URL || "https://spirit-guide-ai-production.up.railway.app";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — email sending disabled");
    return null;
  }
  return new Resend(key);
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const firstName = name.split(" ")[0];

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your SoulGuide account",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0f0d0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0d0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1814;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width:36px;height:36px;background:#7C6AC7;border-radius:10px;display:inline-block;text-align:center;line-height:36px;font-size:18px;margin-right:10px;vertical-align:middle;">🔥</div>
                    <span style="font-size:20px;font-weight:700;color:#fff;vertical-align:middle;font-family:Georgia,serif;">Soul<span style="color:#C8A96E;">Guide</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#e8e2d8;font-size:16px;margin:0 0 8px;">Hi ${firstName},</p>
              <p style="color:#a09880;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Welcome to SoulGuide. One step before your journey begins — confirm your email address.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:#C8A96E;color:#0f0d0a;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;">
                      Confirm my email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#665e50;font-size:13px;margin:24px 0 0;text-align:center;">
                This link expires in 24 hours. If you didn't create a SoulGuide account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#443c30;font-size:12px;margin:0;text-align:center;">
                SoulGuide · A companion for your faith
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const firstName = name.split(" ")[0];

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your SoulGuide password",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0d0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0d0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1814;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:700;color:#fff;font-family:Georgia,serif;">Soul<span style="color:#C8A96E;">Guide</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#e8e2d8;font-size:16px;margin:0 0 8px;">Hi ${firstName},</p>
              <p style="color:#a09880;font-size:15px;line-height:1.6;margin:0 0 28px;">
                We received a request to reset your password. Click below to choose a new one.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:#C8A96E;color:#0f0d0a;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#665e50;font-size:13px;margin:24px 0 0;text-align:center;">
                This link expires in 1 hour. If you didn't request a reset, ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}
