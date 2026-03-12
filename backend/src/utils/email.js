const nodemailer = require('nodemailer');

function resolveTransportConfig() {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (!smtpUser || !smtpPass) {
    throw new Error('Missing SMTP credentials. Configure SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASSWORD.');
  }

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return {
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };
  }

  return {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };
}

function resolveFromAddress() {
  const fromName = process.env.EMAIL_FROM_NAME || 'Placement Tracker';
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER;

  if (!fromEmail) {
    throw new Error('Missing sender email. Configure EMAIL_FROM or SMTP_FROM_EMAIL.');
  }

  return `"${fromName}" <${fromEmail}>`;
}

async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const transporter = nodemailer.createTransport(resolveTransportConfig());

  const subject = 'Reset your Placement Tracker password';
  const greetingName = name ? name.split(' ')[0] : 'there';
  const text = `Hi ${greetingName},\n\nWe received a request to reset your password.\n\nUse the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\n- Placement Tracker`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Reset your password</h2>
      <p>Hi ${greetingName},</p>
      <p>We received a request to reset your Placement Tracker password.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #1d4ed8;">${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <p style="margin-top: 20px; color: #475569;">- Placement Tracker</p>
    </div>
  `;

  return transporter.sendMail({
    from: resolveFromAddress(),
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendPasswordResetEmail,
};
