const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Load backend .env explicitly so this utility works regardless of import order/cwd.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Create a Nodemailer transporter configured for Gmail.
 * Supports SMTP_* variables and falls back to EMAIL_* variables.
 */
function createTransporter() {
  const userRaw = process.env.SMTP_USER || process.env.EMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const user = String(userRaw || '').trim().replace(/^['\"]|['\"]$/g, '');

  if (!user || !rawPass) {
    console.error('[email] Email configuration error: SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS is missing in .env');
    throw new Error('Email configuration error');
  }

  // Strip spaces — Gmail app passwords are sometimes copied with spaces between groups
  const pass = String(rawPass).trim().replace(/^['\"]|['\"]$/g, '').replace(/\s/g, '');

  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Resolve the "From" address for outgoing emails.
 */
function resolveFromAddress() {
  const fromName = process.env.EMAIL_FROM_NAME || 'Placement Tracker Security';
  const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
  return `"${fromName}" <${fromEmail}>`;
}

/**
 * Send a password reset email with a branded HTML template.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email
 * @param {string} options.resetUrl - Full reset URL with token
 * @param {string} options.name     - Recipient's first name (for greeting)
 */
async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const greetingName = name ? name.split(' ')[0] : 'there';

  const subject = 'Reset Your Password — Placement Tracker';

  // ── Plain-text fallback ───────────────────────────────────────────────────
  const text = [
    `Hi ${greetingName},`,
    '',
    'We received a request to reset your Placement Tracker password.',
    '',
    `Reset your password using this link (expires in 15 minutes):`,
    resetUrl,
    '',
    'If you did not request this, please ignore this email. Your password will remain unchanged.',
    '',
    '— Placement Tracker Security',
  ].join('\n');

  // ── Professional HTML email ───────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
              🎯 Placement Tracker
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700;">
              Password Reset Request
            </h2>
            <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
              Hi ${greetingName}, we received a request to reset the password for your account.
              Click the button below to create a new password.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);border-radius:12px;">
                  <a href="${resetUrl}" target="_blank"
                     style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;color:#2563eb;font-size:13px;">
              ${resetUrl}
            </p>

            <!-- Expiry Warning -->
            <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">
                ⏱️ This link expires in 15 minutes
              </p>
              <p style="margin:4px 0 0;color:#a16207;font-size:13px;">
                After expiry you will need to request a new reset link.
              </p>
            </div>

            <!-- Security Note -->
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 18px;">
              <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">
                🔒 Security Notice
              </p>
              <p style="margin:4px 0 0;color:#15803d;font-size:13px;">
                If you did not request this password reset, please ignore this email.
                Your password will remain unchanged and your account is secure.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              This is an automated message from Placement Tracker.
              Please do not reply to this email.
            </p>
            <p style="margin:8px 0 0;color:#cbd5e1;font-size:11px;">
              © ${new Date().getFullYear()} Placement Tracker. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: resolveFromAddress(),
    to,
    subject,
    text,
    html,
  });

  console.info('[email] Password reset email sent', {
    to,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

module.exports = {
  sendPasswordResetEmail,
};
