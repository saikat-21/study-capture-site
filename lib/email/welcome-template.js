export const welcomeEmailSubject = "Welcome to Study Capture Pro — License Activated 🎉";

export function buildWelcomeEmail({ email, licenseRef }) {
  const safeEmail = email || "your email";
  const safeLicenseRef = licenseRef || "your Study Capture Pro license";

  const text = `Excellent choice upgrading to Study Capture Pro.

Your Pro Lifetime license is active for ${safeEmail}.
License reference: ${safeLicenseRef}

Included features:
- Unlimited PDF exports
- Unlimited Study Books
- Reading Capture Mode
- Auto Scroll Capture
- Future Pro improvements

Fair Use Policy:
Pro supports up to 3 personal browsers/devices. Sharing, resale, or abnormal activations may result in review or suspension.

Support:
For billing, refunds, invoices, or license purchase questions:
billing@studycapture.co

For product help:
support@studycapture.co`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#071014;color:#E7F4EF;padding:32px">
      <div style="max-width:640px;margin:0 auto;background:#101A20;border:1px solid rgba(231,244,239,.12);border-radius:20px;padding:32px">
        <p style="color:#5FE0B7;font-weight:700;margin:0 0 16px">Study Capture Pro</p>
        <h1 style="font-size:32px;line-height:1.15;margin:0 0 20px;color:#fff">Excellent choice upgrading to Study Capture Pro.</h1>
        <p style="font-size:16px;line-height:1.7;color:rgba(231,244,239,.76)">Your Pro Lifetime license is active for <strong style="color:#fff">${safeEmail}</strong>.</p>
        <p style="font-size:15px;line-height:1.7;color:rgba(231,244,239,.72)">License reference: <strong style="color:#fff">${safeLicenseRef}</strong></p>
        <h2 style="font-size:18px;color:#fff;margin:28px 0 12px">Your Pro features</h2>
        <ul style="line-height:1.8;color:rgba(231,244,239,.76);padding-left:20px">
          <li>Unlimited PDF exports</li>
          <li>Unlimited Study Books</li>
          <li>Reading Capture Mode</li>
          <li>Auto Scroll Capture</li>
          <li>Future Pro improvements</li>
        </ul>
        <h2 style="font-size:18px;color:#fff;margin:28px 0 12px">Fair Use Policy</h2>
        <p style="font-size:15px;line-height:1.7;color:rgba(231,244,239,.72)">Pro supports up to 3 personal browsers/devices. Sharing, resale, or abnormal activations may result in review or suspension.</p>
        <p style="font-size:15px;line-height:1.7;color:rgba(231,244,239,.72)">Billing, refunds, invoices, or license purchase questions: <a href="mailto:billing@studycapture.co" style="color:#5FE0B7">billing@studycapture.co</a>.</p>
        <p style="font-size:15px;line-height:1.7;color:rgba(231,244,239,.72)">Product help: <a href="mailto:support@studycapture.co" style="color:#5FE0B7">support@studycapture.co</a>.</p>
      </div>
    </div>`;

  return { subject: welcomeEmailSubject, text, html };
}
