/**
 * EMAIL SERVICE (client)
 * Thin wrapper over the backend's generic email endpoint. Branded emails like
 * "welcome" and "payment receipt" are sent automatically by the server — this
 * helper is for ad-hoc sends from the UI (e.g. the Contact Us form).
 */

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(`${API_BASE}/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });
  if (!res.ok) {
    let message = "Failed to send email";
    try { message = (await res.json()).error || message; } catch { /* ignore */ }
    throw new Error(message);
  }
}
