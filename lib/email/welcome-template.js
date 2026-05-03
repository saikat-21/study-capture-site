export const welcomeEmailSubject = "Welcome to Study Capture Pro";

export function buildWelcomeEmail({
  email,
  paymentId = "Recorded",
  supportEmail = "support@studycapture.co"
} = {}) {
  const safeEmail = email || "your email";
  const safePaymentId = paymentId || "Recorded";

  const text = `Hi,

Welcome to Study Capture Pro.

Your lifetime Pro access is now active for this email:

${safeEmail}

What you can do with Pro:
- Export unlimited PDFs
- Build unlimited Study Books
- Use Reading Capture
- Use Auto-scroll Capture
- Restore Pro on up to 3 active personal browsers/devices
- Manage or remove old devices from your account page

How to activate Pro:
1. Open the Study Capture extension
2. Click Account / Restore Pro
3. Enter this email address
4. Verify with the email code

Manage your Pro devices here:
https://studycapture.co/activate

Important usage rules:
You can:
- Use Study Capture for personal study, research, reading, note-taking, and offline reference
- Capture webpages you are allowed to access
- Use Pro on your own personal browsers/devices within the 3-device limit

You should not:
- Share, resell, rent, or transfer your Pro access to others
- Use Study Capture to copy, distribute, or republish copyrighted content without permission
- Use automated capture in a way that overloads websites or violates their terms
- Try to bypass device limits, licensing checks, or Pro restrictions
- Use Study Capture for illegal, harmful, or abusive activity

Payment details:
Payment ID: ${safePaymentId}

Need help?
Contact us at ${supportEmail}

Thank you for supporting Study Capture.

- Study Capture`;

  const html = `
    <div style="margin:0;background:#F5F7FA;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0F172A">
      <div style="max-width:680px;margin:0 auto;overflow:hidden;border-radius:24px;background:#ffffff;border:1px solid rgba(15,23,42,.08);box-shadow:0 18px 48px rgba(15,23,42,.08)">
        <div style="background:#0B1220;padding:30px 32px;color:#E5E7EB">
          <p style="margin:0 0 12px;color:#5FE0B7;font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Study Capture Pro</p>
          <h1 style="margin:0;font-size:30px;line-height:1.18;color:#ffffff">Welcome to Study Capture Pro</h1>
          <p style="margin:14px 0 0;color:#CBD5E1;font-size:16px;line-height:1.65">Your lifetime Pro access is now active.</p>
        </div>
        <div style="padding:30px 32px">
          <p style="margin:0 0 8px;font-size:16px;line-height:1.7">Hi,</p>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7">Your lifetime Pro access is now active for this email:</p>
          <div style="margin:0 0 26px;border-radius:16px;background:#ECFDF5;border:1px solid #A7F3D0;padding:16px 18px;color:#065F46;font-weight:800">${escapeHtml(safeEmail)}</div>

          <h2 style="margin:0 0 12px;font-size:18px;line-height:1.4;color:#0F172A">What you can do with Pro</h2>
          ${renderList([
            "Export unlimited PDFs",
            "Build unlimited Study Books",
            "Use Reading Capture",
            "Use Auto-scroll Capture",
            "Restore Pro on up to 3 active personal browsers/devices",
            "Manage or remove old devices from your account page"
          ])}

          <h2 style="margin:28px 0 12px;font-size:18px;line-height:1.4;color:#0F172A">How to activate Pro</h2>
          <ol style="margin:0;padding-left:22px;color:#475569;font-size:15px;line-height:1.8">
            <li>Open the Study Capture extension</li>
            <li>Click Account / Restore Pro</li>
            <li>Enter this email address</li>
            <li>Verify with the email code</li>
          </ol>

          <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#475569">Manage your Pro devices here:<br />
            <a href="https://studycapture.co/activate" style="color:#2563EB;font-weight:700;text-decoration:none">https://studycapture.co/activate</a>
          </p>

          <h2 style="margin:28px 0 12px;font-size:18px;line-height:1.4;color:#0F172A">Important usage rules</h2>
          <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#0F172A">You can:</p>
          ${renderList([
            "Use Study Capture for personal study, research, reading, note-taking, and offline reference",
            "Capture webpages you are allowed to access",
            "Use Pro on your own personal browsers/devices within the 3-device limit"
          ])}
          <p style="margin:18px 0 8px;font-size:15px;font-weight:800;color:#0F172A">You should not:</p>
          ${renderList([
            "Share, resell, rent, or transfer your Pro access to others",
            "Use Study Capture to copy, distribute, or republish copyrighted content without permission",
            "Use automated capture in a way that overloads websites or violates their terms",
            "Try to bypass device limits, licensing checks, or Pro restrictions",
            "Use Study Capture for illegal, harmful, or abusive activity"
          ])}

          <div style="margin:28px 0;border-radius:16px;background:#F8FAFC;border:1px solid #E2E8F0;padding:16px 18px">
            <p style="margin:0 0 6px;color:#0F172A;font-weight:800">Payment details</p>
            <p style="margin:0;color:#475569;font-size:15px">Payment ID: ${escapeHtml(safePaymentId)}</p>
          </div>

          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569">Need help?<br />
            Contact us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#2563EB;font-weight:700;text-decoration:none">${escapeHtml(supportEmail)}</a>
          </p>
          <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#475569">Thank you for supporting Study Capture.</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#0F172A;font-weight:800">- Study Capture</p>
        </div>
      </div>
    </div>`;

  return { subject: welcomeEmailSubject, text, html };
}

function renderList(items) {
  return `
    <ul style="margin:0;padding-left:22px;color:#475569;font-size:15px;line-height:1.8">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
