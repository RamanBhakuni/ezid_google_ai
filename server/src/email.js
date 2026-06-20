import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'EZID <onboarding@resend.dev>';

// Only construct the client if a key is configured. Without a key the app still
// runs — emails are skipped with a warning instead of crashing.
const resend = API_KEY ? new Resend(API_KEY) : null;

/**
 * Sends one email via Resend. Never throws into the caller's main flow unless
 * you await + catch it yourself; returns a small status object.
 */
export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return { skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) throw new Error(error.message || JSON.stringify(error));
    console.log(`[email] sent "${subject}" to ${to} (id: ${data?.id})`);
    return { id: data?.id };
  } catch (e) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, e.message);
    throw e;
  }
}

/* ----------------------------------------------------------------------------
 * Branded templates — each returns { subject, html }
 * ------------------------------------------------------------------------- */

const shell = (heading, bodyHtml) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:#4f46e5;padding:24px;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:1px">EZID</span>
    </div>
    <div style="padding:28px;color:#1e293b;line-height:1.6">
      <h2 style="margin:0 0 12px;color:#0f172a">${heading}</h2>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center">
      You're receiving this because you have an EZID account. &copy; EZID
    </div>
  </div>`;

export const templates = {
  welcome: (name) => ({
    subject: 'Welcome to EZID 🎉',
    html: shell(
      `Welcome, ${name || 'there'}!`,
      `<p>Your EZID account is ready. Claim your short identity (e.g. <strong>ezid.in/yourname</strong>)
        and start sharing one simple link instead of a long email address.</p>
       <p>You also get <strong>10 free lookups</strong> to begin with.</p>`
    ),
  }),

  paymentReceipt: (name, planName, credits, expiry) => ({
    subject: 'Your EZID purchase receipt',
    html: shell(
      'Payment received ✅',
      `<p>Hi ${name || 'there'}, thanks for your purchase.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:8px 0;color:#64748b">Plan</td><td style="text-align:right"><strong>${planName}</strong></td></tr>
         <tr><td style="padding:8px 0;color:#64748b">Credits added</td><td style="text-align:right"><strong>${credits.toLocaleString()}</strong></td></tr>
         ${expiry ? `<tr><td style="padding:8px 0;color:#64748b">Valid until</td><td style="text-align:right"><strong>${expiry}</strong></td></tr>` : ''}
       </table>
       <p>Your credits are available immediately in your dashboard.</p>`
    ),
  }),
};
