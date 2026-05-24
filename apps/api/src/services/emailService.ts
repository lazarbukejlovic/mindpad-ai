import { Resend } from 'resend';
import { config } from '../config/env';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!config.resendApiKey) return null;
  if (!resendClient) resendClient = new Resend(config.resendApiKey);
  return resendClient;
}

export async function sendPasswordResetEmail(toEmail: string, rawToken: string): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping password reset email');
    return;
  }

  const resetUrl = `${config.clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const { error } = await client.emails.send({
    from: config.emailFrom,
    to: toEmail,
    subject: 'Reset your MindPad AI password',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030609;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030609;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#d8eeff;letter-spacing:-0.03em;">MindPad</span>
          <span style="font-size:10px;font-weight:700;color:#40b8ff;background:rgba(0,160,255,0.12);border:1px solid rgba(0,160,255,0.28);border-radius:99px;padding:3px 9px;margin-left:8px;letter-spacing:0.1em;">AI</span>
        </td></tr>
        <tr><td style="background:rgba(5,10,22,0.95);border:1px solid rgba(0,160,255,0.15);border-radius:20px;padding:40px 36px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#d8eeff;">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:14px;color:rgba(140,170,210,0.85);line-height:1.6;">
            We received a request to reset the password for your MindPad AI account. Click the button below to set a new password. This link expires in <strong style="color:#d8eeff;">30 minutes</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="border-radius:12px;background:linear-gradient(135deg,#0092f0,#0056b8);">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:12px;">
                Reset Password
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:rgba(90,120,160,0.75);">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#40b8ff;word-break:break-all;">${resetUrl}</p>
          <p style="margin:0;font-size:12px;color:rgba(70,100,140,0.65);line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email — your password will not change.
          </p>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(50,80,120,0.6);">MindPad AI &mdash; Your AI productivity workspace</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error('[Email] Failed to send password reset email:', error.message);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendEmailVerification(toEmail: string, rawToken: string): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping verification email');
    return;
  }

  const verifyUrl = `${config.apiUrl}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;

  const { error } = await client.emails.send({
    from: config.emailFrom,
    to: toEmail,
    subject: 'Verify your MindPad AI email',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030609;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030609;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#d8eeff;letter-spacing:-0.03em;">MindPad</span>
          <span style="font-size:10px;font-weight:700;color:#40b8ff;background:rgba(0,160,255,0.12);border:1px solid rgba(0,160,255,0.28);border-radius:99px;padding:3px 9px;margin-left:8px;letter-spacing:0.1em;">AI</span>
        </td></tr>
        <tr><td style="background:rgba(5,10,22,0.95);border:1px solid rgba(0,160,255,0.15);border-radius:20px;padding:40px 36px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#d8eeff;">Verify your email</h1>
          <p style="margin:0 0 24px;font-size:14px;color:rgba(140,170,210,0.85);line-height:1.6;">
            Welcome to MindPad AI! Click the button below to verify your email address. This link expires in <strong style="color:#d8eeff;">24 hours</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="border-radius:12px;background:linear-gradient(135deg,#0092f0,#0056b8);">
              <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:12px;">
                Verify Email
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:rgba(90,120,160,0.75);">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#40b8ff;word-break:break-all;">${verifyUrl}</p>
          <p style="margin:0;font-size:12px;color:rgba(70,100,140,0.65);line-height:1.6;">
            If you did not create a MindPad AI account, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(50,80,120,0.6);">MindPad AI &mdash; Your AI productivity workspace</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error('[Email] Failed to send verification email:', error.message);
    throw new Error('Failed to send verification email');
  }
}
