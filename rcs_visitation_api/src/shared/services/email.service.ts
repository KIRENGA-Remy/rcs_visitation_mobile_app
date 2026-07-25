import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Free email delivery using Gmail SMTP via nodemailer — no paid service,
 * no API keys, no credit card. Requires a Gmail account with 2-Step
 * Verification enabled and an "App Password" generated for it (Google
 * Account -> Security -> App Passwords), set as EMAIL_USER / EMAIL_APP_PASSWORD
 * in .env. Regular Gmail account sending limits (~500/day) are far more
 * than enough for occasionally creating officer accounts.
 *
 * This is intentionally the ONLY place that needs real credentials — if
 * EMAIL_USER/EMAIL_APP_PASSWORD aren't set, sending throws a clear
 * configuration error rather than silently failing.
 */

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!env.EMAIL_USER || !env.EMAIL_APP_PASSWORD) {
    throw new Error(
      'Email is not configured — set EMAIL_USER and EMAIL_APP_PASSWORD in .env ' +
      '(a Gmail address + App Password; see Google Account > Security > App Passwords).'
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_APP_PASSWORD },
    });
  }
  return transporter;
};

export const emailService = {
  async sendOfficerSetupOtp(to: string, firstName: string, otp: string, roleLabel: string = 'Prison Officer') {
    try {
      await getTransporter().sendMail({
        from: `"RCS Visitation" <${env.EMAIL_USER}>`,
        to,
        subject: `Set Up Your RCS Visitation ${roleLabel} Account`,
        text:
          `Hi ${firstName},\n\n` +
          `An administrator has created a ${roleLabel} account for you on RCS Visitation.\n\n` +
          `Your one-time setup code is: ${otp}\n\n` +
          `Open the app, go to "Activate Account", and enter this code along with ` +
          `a password of your choosing to finish setting up your account. ` +
          `This code expires in 30 minutes.\n\n` +
          `If you weren't expecting this, you can ignore this email.`,
        html:
          `<p>Hi ${firstName},</p>` +
          `<p>An administrator has created a ${roleLabel} account for you on <strong>RCS Visitation</strong>.</p>` +
          `<p>Your one-time setup code is:</p>` +
          `<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>` +
          `<p>Open the app, go to <strong>Activate Account</strong>, and enter this code along with ` +
          `a password of your choosing to finish setting up your account. ` +
          `This code expires in 30 minutes.</p>` +
          `<p style="color:#888;font-size:12px;">If you weren't expecting this, you can ignore this email.</p>`,
      });
      return { success: true };
    } catch (err: any) {
      // Never let an email delivery failure block the admin's action that
      // triggered it (creating the account) — log and let the caller decide
      // whether to surface a warning, same pattern as notificationService.
      logger.error({ message: 'Failed to send account setup email', error: err.message, to });
      return { success: false, error: err.message };
    }
  },
};
