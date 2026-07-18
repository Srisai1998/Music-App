import nodemailer from 'nodemailer';
import logger from './logger';

// ── Transporter factory ───────────────────────────────────────────────────────
// In development with no SMTP configured → auto-create an Ethereal test account.
// Ethereal is a fake SMTP service by nodemailer. All emails are captured at
// https://ethereal.email and never actually delivered.
// In production → use the SMTP_* env vars.

let transporter: nodemailer.Transporter | null = null;
let etherealUser = '';

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const isDev = process.env.NODE_ENV !== 'production';
  const smtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'your_email@gmail.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'your_app_password';

  if (!smtpConfigured && isDev) {
    // Auto-create Ethereal test account (only in dev)
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealUser = testAccount.user;
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      logger.info(`📧 Dev email: Ethereal account created → ${testAccount.user}`);
      logger.info(`📧 View emails at: https://ethereal.email/messages (login: ${testAccount.user} / ${testAccount.pass})`);
    } catch (err) {
      // If Ethereal is unreachable, use a no-op transport
      logger.warn('📧 Could not create Ethereal account, emails will be logged only');
      transporter = nodemailer.createTransport({ jsonTransport: true } as any);
    }
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

const FROM = `"${process.env.FROM_NAME || 'Music App'}" <${process.env.FROM_EMAIL || 'noreply@musicapp.com'}>`;

// ── Helper: send mail and log preview URL in dev ──────────────────────────────
async function send(options: nodemailer.SendMailOptions): Promise<void> {
  const t = await getTransporter();
  try {
    const info = await t.sendMail({ from: FROM, ...options });
    // nodemailer.getTestMessageUrl returns a preview URL for Ethereal accounts
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Email sent to ${options.to}`);
      logger.info(`📧 ★ PREVIEW URL → ${previewUrl}`);
      logger.info(`📧 (Open that URL in your browser to see the email)`);
    }
  } catch (err: any) {
    logger.warn(`📧 Email failed (non-fatal): ${err.message}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const url = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
  await send({
    to: email,
    subject: 'Verify your Music App account',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1db954;margin-bottom:8px">Welcome to Music App!</h2>
        <p style="color:#333">Click the button below to verify your email address.</p>
        <a href="${url}" style="display:inline-block;background:#1db954;color:#fff;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:bold;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">This link expires in 24 hours.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#ccc;font-size:11px">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${frontendUrl}/reset-password?token=${token}`;

  // Always log the reset URL to console so devs can test without real email
  logger.info(`🔑 PASSWORD RESET LINK for ${email}:`);
  logger.info(`🔑 ${url}`);
  logger.info(`🔑 (Token: ${token})`);

  await send({
    to: email,
    subject: 'Reset your Music App password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1db954;margin-bottom:8px">Password Reset</h2>
        <p style="color:#333">We received a request to reset your password. Click below to set a new password.</p>
        <a href="${url}" style="display:inline-block;background:#1db954;color:#fff;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:bold;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#999;font-size:12px;margin-top:8px">This link expires in 1 hour.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#ccc;font-size:11px">If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color:#aaa;font-size:12px;word-break:break-all">Direct link: ${url}</p>
      </div>
    `,
  });
};

export const sendSubscriptionConfirmation = async (
  email: string,
  plan: string,
  expiresAt: Date
): Promise<void> => {
  await send({
    to: email,
    subject: 'Music App Premium — Subscription Confirmed',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1db954">🎵 Welcome to Premium!</h2>
        <p>Your <strong>${plan}</strong> subscription is now active.</p>
        <p>Valid until: <strong>${expiresAt.toLocaleDateString()}</strong></p>
        <p>Enjoy unlimited music, no ads, and high-quality audio.</p>
      </div>
    `,
  });
};
